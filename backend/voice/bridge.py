"""Bridge one Twilio Media Stream to a gradbot session (Gradium STT -> Gemini -> Gradium TTS).

Pattern from gradium-ai/digigrad (bridge.py), reduced to what Stafette needs:
fixed opener, caller audio in, agent audio out, barge-in, tool calls through
the policy engine, hang up after end_call. No recording is written to disk.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time

import gradbot
from fastapi import WebSocket, WebSocketDisconnect

from state import store
from voice.audio import GRADBOT_INPUT_RATE, GRADBOT_OUTPUT_RATE, TWILIO_RATE, resample_ulaw
from voice.calls import CALLS, OPENER, Call
from voice.llm_proxy import local_base_url
from voice.session import session_config
from voice.tools import handle_tool_call

log = logging.getLogger(__name__)

FAREWELL_DRAIN_S = 3.0      # let the goodbye finish before hanging up
BARGE_GUARD_S = 1.0         # ignore "interruptions" right after the agent starts a turn


async def _wait_for_start(ws: WebSocket) -> tuple[str, str]:
    """Twilio sends 'connected', then 'start' with streamSid and our <Parameter name="call">."""
    while True:
        evt = json.loads(await ws.receive_text())
        if evt.get("event") == "start":
            params = evt.get("start", {}).get("customParameters") or {}
            return evt["streamSid"], params.get("call", "")


async def run_bridge(ws: WebSocket) -> None:
    try:
        stream_sid, call_id = await _wait_for_start(ws)
    except (WebSocketDisconnect, json.JSONDecodeError, KeyError):
        return
    call = CALLS.get(call_id)
    if call is None:
        log.warning("stream for unknown call %r", call_id)
        await ws.close()
        return
    log.info("call %s connected (stream %s)", call.id, stream_sid)
    store.set_call(source_name=call.source_name, status="connected")

    async def send_audio(ulaw_8k: bytes) -> None:
        if ulaw_8k:
            await ws.send_text(json.dumps({"event": "media", "streamSid": stream_sid,
                                           "media": {"payload": base64.b64encode(ulaw_8k).decode("ascii")}}))

    async def clear_playback() -> None:
        await ws.send_text(json.dumps({"event": "clear", "streamSid": stream_sid}))

    # gradbot reads GRADIUM_API_KEY, OPENAI_API_KEY and LLM_MODEL from the environment. The LLM goes
    # through our shim (voice/llm_proxy.py), which fixes Gemini's tool-call stream for gradbot.
    input_handle, output_handle = await gradbot.run(
        llm_base_url=local_base_url(),
        session_config=session_config(call),
        input_format=gradbot.AudioFormat.Ulaw,
        output_format=gradbot.AudioFormat.Ulaw,
    )

    # Fixed opener first. The caller is "held" (buffered, not dropped) while it plays.
    if call.opener_task is not None:
        try:
            await asyncio.wait_for(call.opener_task, timeout=8.0)
        except asyncio.TimeoutError:
            log.warning("opener not ready in time for call %s", call.id)
    guard_until = time.monotonic()
    if call.opener_ulaw:
        await send_audio(call.opener_ulaw)
        guard_until += len(call.opener_ulaw) / TWILIO_RATE + 0.3
        call.transcript.append(("agent", OPENER))
        store.add_call_line("agent", OPENER.replace("Staffette", "Stafette"))

    stop = asyncio.Event()
    tool_tasks: set[asyncio.Task] = set()
    turn = {"start": 0.0, "last": 0.0}

    async def producer() -> None:
        """Twilio -> gradbot."""
        held: list[bytes] = []
        resample_state = None
        try:
            while not stop.is_set():
                evt = json.loads(await ws.receive_text())
                kind = evt.get("event")
                if kind == "media":
                    audio, resample_state = resample_ulaw(base64.b64decode(evt["media"]["payload"]),
                                                          TWILIO_RATE, GRADBOT_INPUT_RATE, resample_state)
                    now = time.monotonic()
                    if now < guard_until:
                        held.append(audio)
                        continue
                    if held:
                        log.info("call %s | opener done, forwarding %d held frames", call.id, len(held))
                    while held:
                        await input_handle.send_audio(held.pop(0))
                    if not (turn["start"] and now - turn["start"] < BARGE_GUARD_S):
                        await input_handle.send_audio(audio)
                elif kind == "stop":
                    return
        except WebSocketDisconnect:
            pass
        except Exception:  # noqa: BLE001
            log.exception("producer error in call %s", call.id)
        finally:
            stop.set()

    async def consumer() -> None:
        """gradbot -> Twilio, plus transcript and tool calls."""
        resample_state = None
        try:
            while not stop.is_set():
                msg = await output_handle.receive()
                if msg is None:
                    log.warning("call %s | gradbot output closed", call.id)
                    return
                kind = getattr(msg, "msg_type", None)
                if kind != "audio":
                    log.info("call %s | gradbot msg %s", call.id, kind)
                if kind == "audio":
                    now = time.monotonic()
                    if getattr(msg, "interrupted", False) and turn["start"] and now - turn["start"] >= BARGE_GUARD_S:
                        await clear_playback()          # the practice talks over the agent: stop speaking
                        turn["start"] = 0.0
                        resample_state = None
                        continue
                    if not turn["start"] or now - turn["last"] > 0.5:
                        turn["start"] = now
                    turn["last"] = now
                    audio, resample_state = resample_ulaw(msg.data, GRADBOT_OUTPUT_RATE, TWILIO_RATE, resample_state)
                    await send_audio(audio)
                elif kind == "stt_text" and (text := (getattr(msg, "text", "") or "").strip()):
                    log.info("call %s | PRAXIS: %s", call.id, text)
                    call.transcript.append(("practice", text))
                    store.add_call_line("practice", text)
                elif kind == "tts_text" and (text := (getattr(msg, "text", "") or "").strip()):
                    log.info("call %s | AGENT: %s", call.id, text)
                    call.transcript.append(("agent", text))
                    store.add_call_line("agent", text.replace("Staffette", "Stafette"))
                elif kind == "tool_call":
                    handle = gradbot.ToolHandle(msg.tool_call_handle, msg.tool_call)
                    task = asyncio.create_task(handle_tool_call(handle, call))
                    tool_tasks.add(task)
                    task.add_done_callback(tool_tasks.discard)

                if call.end_requested:
                    await _drain_farewell(output_handle, send_audio)
                    return
        except Exception:  # noqa: BLE001
            log.exception("consumer error in call %s", call.id)
        finally:
            stop.set()

    try:
        await asyncio.gather(producer(), consumer())
    finally:
        for task in tool_tasks:
            task.cancel()
        try:
            await input_handle.close()
        except Exception:  # noqa: BLE001
            pass
        try:
            await ws.close()            # closing the stream ends the TwiML, Twilio hangs up
        except Exception:  # noqa: BLE001
            pass
        store.set_call(status="ended", outcome=call.outcome or "aufgelegt")
        log.info("call %s ended (outcome %s)", call.id, call.outcome)


async def _drain_farewell(output_handle, send_audio) -> None:
    """After end_call, keep streaming the goodbye until audio stops (max FAREWELL_DRAIN_S)."""
    deadline = time.monotonic() + FAREWELL_DRAIN_S
    resample_state = None
    while time.monotonic() < deadline:
        try:
            msg = await asyncio.wait_for(output_handle.receive(), timeout=0.6)
        except asyncio.TimeoutError:
            return
        if msg is None:
            return
        if getattr(msg, "msg_type", None) == "audio":
            audio, resample_state = resample_ulaw(msg.data, GRADBOT_OUTPUT_RATE, TWILIO_RATE, resample_state)
            await send_audio(audio)
