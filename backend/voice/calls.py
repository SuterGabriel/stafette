"""Outbound calls: the orchestrator's place_call, checked by the policy engine first.

Demo rule (docs/PROJECT.md): we never call a real practice. Every mandated
source is dialled at DEMO_TO_NUMBER, the phone of the team member playing
the practice. The number never comes from a conversation or a document.
"""

from __future__ import annotations

import asyncio
import logging
import os
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime

from contracts import MODEL_ORCHESTRATOR, Allowed, Blocked, Decision
from policy.engine import PlanState, check
from policy.schema import example_mandate
from state import store
from voice.audio import render_ulaw

log = logging.getLogger(__name__)

# How TTS has to see the brand name to pronounce it right ("Stafette" came out as "Stafettie").
SPOKEN_BRAND = "Staffette"

# Fixed opener from docs/POLICY.md. Spoken from a pre-rendered clip, never phrased by the LLM.
OPENER = (
    f"Grüezi, hier ist ein KI-Assistent der Firma {SPOKEN_BRAND}. Ich rufe im Auftrag von Anna Muster an, "
    "wegen der Übermittlung ihrer Unterlagen an ihre neue Hausärztin. "
    "Darf ich das Gespräch für eine Notiz transkribieren?"
)

# Demo state: the current mandate (v1, v2 after Anna's yes …) and the plan per source.
# Other modules read these as calls.MANDATE / calls.PLAN so they always see the current version.
MANDATE = example_mandate()
PLAN = PlanState(signed={s.id for s in MANDATE.sources})


@dataclass
class Call:
    id: str
    source_id: str
    source_name: str
    to: str
    created: float = field(default_factory=time.time)
    twilio_sid: str = ""
    opener_ulaw: bytes | None = None
    opener_task: asyncio.Task | None = None
    end_requested: bool = False
    outcome: str | None = None
    transcript: list[tuple[str, str]] = field(default_factory=list)


CALLS: dict[str, Call] = {}

# Test mode: calls are played by agent/sim_call.py instead of Twilio (same tools, same policy).
SIMULATE = os.environ.get("DEMO_SIMULATE_CALLS", "").strip().lower() in {"1", "true", "yes"}


def set_simulate(on: bool) -> None:
    global SIMULATE
    SIMULATE = on
    store.set_simulate(on)


def reset_demo() -> None:
    """Back to mandate v1, no calls made."""
    global MANDATE, PLAN
    MANDATE = example_mandate()
    PLAN = PlanState(signed={s.id for s in MANDATE.sources})
    CALLS.clear()


def short_hash(mandate=None) -> str:
    h = (mandate or MANDATE).hash()
    return f"{h[:4]}…{h[-4:]}"


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def relax_call_hours() -> bool:
    return env("DEMO_RELAX_CALL_HOURS").lower() in {"1", "true", "yes"}


def voice_id() -> str:
    return env("GRADIUM_VOICE_ID", "V64Rt53v9dWHV0LU")


def public_url() -> str:
    return env("PUBLIC_URL").rstrip("/")


def public_ws_url() -> str:
    return public_url().replace("https://", "wss://", 1).replace("http://", "ws://", 1)


def decision_text(action: str, args: dict, decision: Decision) -> str:
    """Event text in the dashboard's style, e.g. 'set_recipient("x@y.ch") · recipient_not_in_mandate'."""
    def fmt(v) -> str:
        if isinstance(v, str):
            return f'"{v}"'
        if isinstance(v, (list, tuple)):
            return "[" + ", ".join(map(str, v)) + "]"
        return str(v)

    shown = ", ".join(fmt(v) for k, v in args.items() if k != "source_id")
    target = args.get("source_id", "")
    inner = ", ".join(p for p in (target, shown) if p)
    text = f"{action}({inner})"
    if isinstance(decision, Blocked):
        text += f" · {decision.reason}"
    return text


async def _prepare_opener(call: Call) -> None:
    call.opener_ulaw = await render_ulaw(voice_id(), OPENER)


async def dial(source_id: str) -> Call | Decision:
    """place_call: ask the policy engine, then let Twilio dial. Returns the Call or the refusal."""
    args = {"source_id": source_id}
    decision = check("place_call", args, MANDATE, PLAN, datetime.now(), relax_call_hours=relax_call_hours())
    store.add_event(decision, decision_text("place_call", args, decision), model=MODEL_ORCHESTRATOR)
    if not isinstance(decision, Allowed):
        return decision

    if SIMULATE:
        from agent import sim_call   # lazy: agent imports voice

        source = next(s for s in MANDATE.sources if s.id == source_id)
        call = Call(id=secrets.token_urlsafe(8), source_id=source_id, source_name=source.name, to="Testmodus")
        CALLS[call.id] = call
        PLAN.calls_made[source_id] = PLAN.calls(source_id) + 1
        store.set_call(source_name=source.name, status="ringing", clear_lines=True, simulated=True)
        store.set_station(source_id, status="active", detail=f"Wird gerade angerufen ({time.strftime('%H:%M')}, Testmodus) …")
        call.opener_task = asyncio.create_task(sim_call.run(call))
        return call

    missing = [n for n in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "DEMO_TO_NUMBER")
               if not env(n)]
    if missing or not public_url() or "xxxx" in public_url():
        raise RuntimeError(f"Missing in backend/.env: {', '.join(missing) or 'PUBLIC_URL'}")

    source = next(s for s in MANDATE.sources if s.id == source_id)
    call = Call(id=secrets.token_urlsafe(8), source_id=source_id, source_name=source.name, to=env("DEMO_TO_NUMBER"))
    CALLS[call.id] = call
    PLAN.calls_made[source_id] = PLAN.calls(source_id) + 1
    call.opener_task = asyncio.create_task(_prepare_opener(call))

    from twilio.rest import Client

    client = Client(env("TWILIO_ACCOUNT_SID"), env("TWILIO_AUTH_TOKEN"))
    kwargs = dict(to=call.to, from_=env("TWILIO_FROM_NUMBER"), url=f"{public_url()}/twilio/twiml?call={call.id}",
                  method="POST")
    detection = env("TWILIO_MACHINE_DETECTION", "Disable")
    if detection and detection != "Disable":
        kwargs["machine_detection"] = detection
    store.set_call(source_name=source.name, status="ringing", clear_lines=True)
    try:
        twilio_call = await asyncio.to_thread(client.calls.create, **kwargs)
    except Exception:
        store.set_call(status="failed")
        raise
    call.twilio_sid = twilio_call.sid
    store.set_station(source_id, status="active", detail=f"Wird gerade angerufen ({time.strftime('%H:%M')}) …")
    log.info("dialling %s for source %s (call %s, sid %s)", call.to, source_id, call.id, call.twilio_sid)
    return call
