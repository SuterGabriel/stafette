"""Orchestrator: the steps of the demo, in order, each action through the policy engine.

1. start()        Anna signs mandate v1 in her app -> place_call to the first practice
2. ingest()       records arrive at Dr. Keller -> document pipeline -> sheet fills,
                  every mentioned doctor without records is proposed via add_source
3. on_approval()  Anna answers -> yes: mandate v2 + place_call, no: source dropped

The steps are fixed for the hackathon demo; a model-driven loop (docs/ARCHITECTURE.md)
would choose them itself, but would still only act through check().
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime
from pathlib import Path

from contracts import MODEL_COMPILER, MODEL_ORCHESTRATOR, NeedsApproval
from policy.engine import check
from policy.schema import Source
from state import PendingApproval, Station, store
from voice import calls
from voice.calls import Call, env, relax_call_hours, short_hash

log = logging.getLogger(__name__)

BACKEND = Path(__file__).resolve().parents[1]
FIXTURES = BACKEND.parent / "fixtures"
# Documents that "arrive" in the demo. 06 (prompt injection) is the optional second attack.
DEMO_DOCUMENTS = [
    "01_austrittsbericht_spital_musterstadt.pdf",
    "02_laborbefund_praxis_seefeld.pdf",
    "03_medikamentenliste_praxis_seefeld.pdf",
    "04_roentgenbefund_thorax_spital_musterstadt.pdf",
    "05_zuweisung_praxis_seefeld_handyfoto.jpg",
]
CACHE = BACKEND / "out" / "ingest_cache.json"

_pending: dict[str, dict] = {}     # approval id -> proposed source (name, specialty)
_queue: list[str] = []             # approvals waiting until the current one is answered


def reset() -> None:
    calls.reset_demo()
    _pending.clear()
    _queue.clear()
    store.reset()
    store.set_simulate(calls.SIMULATE)      # test mode survives a reset


def _sync_mandate() -> None:
    m = calls.MANDATE
    store.set_mandate(version=m.version, hash=short_hash(m), sources=[s.name for s in m.sources])


async def _dial(source_id: str) -> Call | None:
    """place_call through the policy engine; problems end up in the protocol, not in a crash."""
    try:
        result = await calls.dial(source_id)
    except RuntimeError as exc:                     # backend/.env incomplete
        store.add_event("BLOCKED", f"Anruf nicht möglich: {exc}")
        return None
    except Exception as exc:  # noqa: BLE001 - e.g. Twilio rejects the number
        log.exception("dial failed")
        store.add_event("BLOCKED", f"Twilio-Fehler: {type(exc).__name__}")
        return None
    return result if isinstance(result, Call) else None


async def start() -> None:
    """Anna signed in her app: log mandate v1 and call the first practice."""
    _sync_mandate()
    store.add_event("ALLOWED", f"Vollmacht v{calls.MANDATE.version} unterschrieben (sha256 {short_hash()})",
                    model=MODEL_COMPILER)
    store.set_station("praxis_a", detail="Wird gleich angerufen …")
    await _dial("praxis_a")


def _slug(name: str) -> str:
    """'Dr. med. Sabine Brunner, Kardiologie am See' -> 'dr_brunner'."""
    person = name.split(",")[0]
    words = [w for w in re.findall(r"[A-Za-zÄÖÜäöüß]+", person) if w.lower() not in {"dr", "med", "prof", "pd"}]
    return "dr_" + (words[-1].lower() if words else "quelle")


def _ask_next() -> None:
    if store.state.approval is None and _queue:
        approval_id = _queue.pop(0)
        source = _pending[approval_id]
        spec = f" ({source['specialty']})" if source.get("specialty") else ""
        store.set_approval(PendingApproval(
            id=approval_id,
            question=f"Soll ich auch bei {source['name'].split(',')[0]} anfragen?",
            body=f"In Ihren Unterlagen wird {source['name']}{spec} erwähnt. Von dort fehlen noch Unterlagen.",
            why="Ich frage Sie, weil Sie mir diese Praxis noch nicht erlaubt haben.",
        ))


def propose_source(source: dict) -> None:
    """A gap from the document pipeline: name and specialty only, through add_source."""
    args = {"name": source["name"], "specialty": source.get("specialty", ""),
            "reason": "in den Unterlagen erwähnt, keine Unterlagen vorhanden"}
    decision = check("add_source", args, calls.MANDATE, calls.PLAN, datetime.now(), relax_call_hours=relax_call_hours())
    store.add_event(decision, f"add_source({source['name']})" + (" · nicht in Vollmacht" if isinstance(decision, NeedsApproval)
                                                               else f" · {getattr(decision, 'reason', '')}"),
                    model=MODEL_ORCHESTRATOR)
    if not isinstance(decision, NeedsApproval):
        return
    approval_id = f"add_source_{_slug(source['name'])}"
    if approval_id in _pending:
        return
    _pending[approval_id] = args
    _queue.append(approval_id)
    store.add_station(Station(id=_slug(source["name"]), name=source["name"].split(",")[0] +
                              (f", {source['specialty']}" if source.get("specialty") else ""),
                              detail="Wartet auf Ihr Okay", status="waiting"))
    _ask_next()


def _run_pipeline() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    from docs.pipeline import process       # Manuel's pipeline, imported lazily (Gemini client)

    result = process([FIXTURES / name for name in DEMO_DOCUMENTS], calls.MANDATE.sources)
    CACHE.parent.mkdir(exist_ok=True)
    CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


async def ingest() -> dict:
    """Records arrived at Dr. Keller: read them, fill the sheet, propose missing sources."""
    from docs.pipeline import publish

    result = await asyncio.to_thread(_run_pipeline)
    publish(result)
    for station_id in ("praxis_a", "spital_b"):
        store.set_station(station_id, status="done", detail="Unterlagen bei Dr. Keller angekommen")
    for source in result.get("missing_sources", []):
        propose_source(source)
    return {"documents": result.get("documents"), "missing_sources": len(result.get("missing_sources", []))}


async def on_approval(approval_id: str, approve: bool) -> bool:
    """Anna's answer. Yes extends the mandate (new version, new hash) and calls the new source."""
    if not store.answer_approval(approval_id, approve):
        return False
    source = _pending.pop(approval_id, None)
    station_id = _slug(source["name"]) if source else approval_id.removeprefix("add_source_")
    if approve and source:
        new = Source(id=station_id, name=source["name"].split(",")[0], specialty=source.get("specialty") or None,
                     phone=env("DEMO_TO_NUMBER") or "demo")   # never a number from a document
        calls.MANDATE = calls.MANDATE.with_source(new)
        calls.PLAN.signed.add(station_id)
        _sync_mandate()
        store.add_event("ALLOWED", f"Freigabe erteilt · Vollmacht v{calls.MANDATE.version} (sha256 {short_hash()})")
        store.set_station(station_id, status="active", detail="Wird angefragt. Vollmacht ergänzt.")
        await _dial(station_id)
    else:
        store.add_event("BLOCKED", "Freigabe abgelehnt · Quelle verworfen")
        store.set_station(station_id, status="skipped", detail="Nicht angefragt")
    _ask_next()
    return True
