"""Audio plumbing between Twilio (8 kHz μ-law) and gradbot / Gradium.

Twilio Media Streams carry 8 kHz μ-law. gradbot takes 24 kHz μ-law in and
gives 48 kHz μ-law out (rates as in gradium-ai/digigrad). audioop exists in
Python 3.12, which this project pins.
"""

from __future__ import annotations

import asyncio
import audioop
import io
import logging
import os
import wave

log = logging.getLogger(__name__)

TWILIO_RATE = 8000
GRADBOT_INPUT_RATE = 24000
GRADBOT_OUTPUT_RATE = 48000

_TTS_CACHE: dict[tuple[str, str], bytes] = {}


def resample_ulaw(ulaw: bytes, src_rate: int, dst_rate: int, state=None):
    """Resample μ-law bytes; returns (ulaw_out, state) so chunks stay continuous."""
    if not ulaw or src_rate == dst_rate:
        return ulaw, state
    pcm = audioop.ulaw2lin(ulaw, 2)
    pcm, state = audioop.ratecv(pcm, 2, 1, src_rate, dst_rate, state)
    return audioop.lin2ulaw(pcm, 2), state


def wav_to_twilio_ulaw(wav_bytes: bytes) -> bytes:
    with wave.open(io.BytesIO(wav_bytes), "rb") as w:
        rate, channels, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        pcm = w.readframes(w.getnframes())
    if width != 2:
        pcm = audioop.lin2lin(pcm, width, 2)
    if channels == 2:
        pcm = audioop.tomono(pcm, 2, 0.5, 0.5)
    if rate != TWILIO_RATE:
        pcm, _ = audioop.ratecv(pcm, 2, 1, rate, TWILIO_RATE, None)
    return audioop.lin2ulaw(pcm, 2)


async def render_ulaw(voice_id: str, text: str, timeout_s: float = 10.0) -> bytes | None:
    """Gradium TTS for a fixed sentence, as Twilio-ready μ-law. Cached per voice and text."""
    key = (voice_id, text)
    if key in _TTS_CACHE:
        return _TTS_CACHE[key]
    api_key = os.environ.get("GRADIUM_API_KEY", "").strip()
    if not api_key or not voice_id:
        log.warning("TTS render skipped: GRADIUM_API_KEY or voice id missing")
        return None
    try:
        import gradium

        client = gradium.GradiumClient(api_key=api_key)
        setup = gradium.TTSSetup(model_name="default", voice_id=voice_id, output_format="wav")
        result = await asyncio.wait_for(client.tts(setup, text), timeout=timeout_s)
        wav = getattr(result, "raw_data", None)
        if not wav:
            return None
        ulaw = wav_to_twilio_ulaw(wav)
        _TTS_CACHE[key] = ulaw
        return ulaw
    except Exception as exc:  # noqa: BLE001 - a missing opener must not kill the call
        log.warning("TTS render failed: %s", exc)
        return None
