"""Dialog tools: what the phone agent can do, each one decided by check().

The model calls a tool; this module asks the policy engine, logs the
decision for the dashboard and only then acts. A refusal goes back to the
model with a sentence it may say, so the caller hears a polite no.
"""

from __future__ import annotations

import logging
from datetime import datetime

from contracts import MODEL_DIALOG, Allowed, Blocked, NeedsApproval
from policy.engine import check
from state import store
from voice.calls import MANDATE, PLAN, Call, decision_text, relax_call_hours

log = logging.getLogger(__name__)

# Tools that act on the practice being called; the source is set by us, not by the model.
SOURCE_TOOLS = {"request_records", "confirm_channel"}

GUARD_RECIPIENT = "Am Telefon wollte jemand die Unterlagen an eine andere E-Mail-Adresse. Das haben Sie nicht erlaubt."

STATION_BY_OUTCOME = {
    "requested": ("active", "Heute {t} angerufen. Die Praxis schickt die Unterlagen direkt an Dr. Keller."),
    "needs_consent": ("active", "Heute {t} angerufen. Die Praxis wartet auf die unterschriebene Vollmacht."),
    "closed": ("active", "Heute {t} niemand erreicht. Rückruf geplant."),
    "callback": ("active", "Heute {t} angerufen. Rückruf vereinbart."),
    "refused": ("skipped", "Die Praxis gibt die Unterlagen nicht heraus."),
}


def _decide(action: str, args: dict):
    decision = check(action, args, MANDATE, PLAN, datetime.now(), relax_call_hours=relax_call_hours())
    store.add_event(decision, decision_text(action, args, decision), model=MODEL_DIALOG)
    return decision


async def handle_tool_call(handle, call: Call) -> dict:
    """Run one tool call from gradbot. Always answers the model, even on errors."""
    name = handle.name
    args = dict(getattr(handle, "args", None) or {})
    if name in SOURCE_TOOLS:
        args["source_id"] = call.source_id
    try:
        reply = _act(name, args, _decide(name, args), call)
    except Exception:  # noqa: BLE001 - the model must never wait forever on a tool
        log.exception("tool %s failed", name)
        reply = {"ok": False, "say": "Das kann ich gerade nicht erledigen."}
    await handle.send_json(reply)
    return reply


def _act(name: str, args: dict, decision, call: Call) -> dict:
    if isinstance(decision, Blocked):
        if name == "set_recipient":
            store.set_station(call.source_id, guard=GUARD_RECIPIENT)
            return {"ok": False, "reason": decision.reason,
                    "say": f"Das kann ich leider nicht ändern. Ich darf die Unterlagen nur an "
                           f"{MANDATE.recipient.name} senden lassen."}
        return {"ok": False, "reason": decision.reason, "say": "Das darf ich im Auftrag der Patientin nicht tun."}

    if isinstance(decision, NeedsApproval):
        if name == "accept_fee":
            say = "Kosten muss ich zuerst mit Frau Muster abklären. Ich melde mich dazu wieder."
        else:
            say = "Das muss ich zuerst mit Frau Muster klären. Bitte schicken Sie vorerst nur die vereinbarten Unterlagen."
        return {"ok": False, "needs_approval": decision.question, "say": say}

    assert isinstance(decision, Allowed)
    match name:
        case "identify_principal":
            facts = MANDATE.disclosable()
            return {"ok": True, "name": facts.get("principal.name"), "geburtsdatum": facts.get("principal.birth_date"),
                    "neue_aerztin": facts.get("recipient.name")}
        case "confirm_recipient":
            return {"ok": True, "empfaengerin": MANDATE.recipient.name, "kanal": "HIN-Mail"}
        case "request_records":
            return {"ok": True, "say": f"Bitte senden Sie die Unterlagen direkt an {MANDATE.recipient.name} per HIN-Mail."}
        case "set_recipient":
            return {"ok": True, "empfaengerin": MANDATE.recipient.name}
        case "confirm_channel":
            letter = _decide("send_mandate_letter", {"source_id": call.source_id})
            if not isinstance(letter, Allowed):
                return {"ok": False, "say": "Die Vollmacht ist noch nicht unterschrieben. Ich melde mich, sobald sie da ist."}
            store.add_event("ALLOWED", f"Vollmacht an hinterlegte Adresse von {call.source_name} gesendet (simuliert)")
            return {"ok": True, "say": "Die unterschriebene Vollmacht kommt an die bei Ihnen hinterlegte Adresse."}
        case "end_call":
            call.outcome = args["outcome"]
            call.end_requested = True
            status, detail = STATION_BY_OUTCOME[call.outcome]
            store.set_station(call.source_id, status=status, detail=detail.format(t=datetime.now().strftime("%H:%M")))
            return {"ok": True}
        case "ask_principal":
            return {"ok": True}
    return {"ok": False, "say": "Das kann ich nicht tun."}
