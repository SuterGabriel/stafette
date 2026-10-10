"""StafetteState: the single in-memory state the dashboard renders.

Mirrors dashboard/lib/types.ts exactly (camelCase on the wire). The backend
always pushes the *whole* state over SSE; the dashboard computes nothing.

Nothing here is persisted. A restart or POST /reset returns to the seed.
"""

from __future__ import annotations

import asyncio
import time
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from contracts import Decision, decision_label


class _Wire(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Patient(_Wire):
    name: str
    birth: str
    address: str


class Doctor(_Wire):
    name: str
    city: str


class MandateView(_Wire):
    """What Anna's app shows of the mandate. The full mandate lives in policy/schema.py."""
    version: int
    hash: str
    sources: list[str]
    recipient: str
    scope: str
    valid_until: str


class Station(_Wire):
    id: str
    name: str
    detail: str
    status: Literal["done", "active", "waiting", "skipped"]
    guard: str | None = None


class PendingApproval(_Wire):
    id: str
    question: str
    body: str
    why: str


class StafetteEvent(_Wire):
    id: str
    ts: str
    decision: Literal["ALLOWED", "BLOCKED", "APPROVAL"]
    text: str
    model: str | None = None


class Finding(_Wire):
    id: str
    name: str
    detail: str
    ref: str
    quote: str
    quote_src: str


class Section(_Wire):
    title: str
    items: list[Finding]


class CallLine(_Wire):
    who: Literal["agent", "practice"]
    text: str


class CallView(_Wire):
    """The call in progress, shown live in Anna's app. Never contains medical content."""
    source_name: str
    status: Literal["ringing", "connected", "ended", "failed"]
    outcome: str | None = None
    lines: list[CallLine] = []


class StafetteState(_Wire):
    patient: Patient
    doctor: Doctor
    mandate: MandateView
    stations: list[Station]
    approval: PendingApproval | None = None
    approval_result: Literal["yes", "no"] | None = None
    events: list[StafetteEvent]
    sections: list[Section]
    missing: str | None = None
    documents: int
    source_count: int
    updated_at: str
    reviewed_at: str | None = None
    call: CallView | None = None

    def wire(self) -> dict:
        return self.model_dump(by_alias=True, mode="json")


def now_hm() -> str:
    return time.strftime("%H:%M")


# --- Seed ------------------------------------------------------------------
# Same story as dashboard/lib/mock.ts, so the dashboard looks identical live
# and offline. Real parts (calls, documents) replace pieces of it as they land.

def seed_state() -> StafetteState:
    return StafetteState.model_validate({
        "patient": {"name": "Anna Muster", "birth": "12.03.1984", "address": "Seestrasse 12, 8008 Zürich"},
        "doctor": {"name": "Dr. med. Lea Keller", "city": "Winterthur"},
        "mandate": {
            "version": 1,
            "hash": "7f3a…c91e",
            "sources": ["Hausarztpraxis Seefeld", "Spital Musterstadt"],
            "recipient": "Dr. med. Lea Keller, Winterthur",
            "scope": "Berichte, Laborwerte, Medikamente, Röntgen",
            "validUntil": "31. Oktober",
        },
        "stations": [
            {"id": "spital_b", "name": "Spital Musterstadt", "detail": "4 Dokumente bei Dr. Keller angekommen", "status": "done"},
            {
                "id": "praxis_a",
                "name": "Hausarztpraxis Seefeld",
                "detail": "Heute 10:14 angerufen. Die Praxis schickt die Unterlagen direkt an Dr. Keller.",
                "status": "active",
                "guard": "Am Telefon wollte jemand die Unterlagen an eine andere E-Mail-Adresse. Das haben Sie nicht erlaubt.",
            },
            {"id": "dr_brunner", "name": "Dr. Sabine Brunner, Kardiologie", "detail": "Wartet auf Ihr Okay", "status": "waiting"},
        ],
        "approval": {
            "id": "add_source_dr_brunner",
            "question": "Soll ich auch bei Dr. Sabine Brunner anfragen?",
            "body": "Im Spitalbericht steht, dass Sie zu ihr in die Kardiologie überwiesen wurden. Von dort fehlen noch Unterlagen.",
            "why": "Ich frage Sie, weil Sie mir diese Praxis noch nicht erlaubt haben.",
        },
        "approvalResult": None,
        "events": [
            {"id": "e1", "ts": "10:12", "decision": "ALLOWED", "text": "Vollmacht v1 unterschrieben (sha256 7f3a…c91e)", "model": "gemini-3.8-flash"},
            {"id": "e2", "ts": "10:14", "decision": "ALLOWED", "text": "place_call(praxis_seefeld)", "model": "gemini-3.6-flash"},
            {"id": "e3", "ts": "10:15", "decision": "ALLOWED", "text": "confirm_channel(praxis_seefeld)", "model": "gemini-3.6-flash"},
            {"id": "e4", "ts": "10:16", "decision": "BLOCKED", "text": 'set_recipient("anna.priv@gmail.com") · recipient_not_in_mandate', "model": "gemini-3.6-flash"},
            {"id": "e5", "ts": "10:41", "decision": "APPROVAL", "text": "add_source(dr_brunner) · nicht in Vollmacht", "model": "gemini-3.6-flash"},
        ],
        "sections": [
            {"title": "Diagnosen", "items": [
                {"id": "vhf", "name": "Paroxysmales Vorhofflimmern", "detail": "erstmals 15.03.2026", "ref": "Austrittsbericht, S. 1",
                 "quote": "Paroxysmales Vorhofflimmern, erstmals dokumentiert am 15.03.2026", "quoteSrc": "Spital Musterstadt · Austrittsbericht vom 19.03.2026 · Seite 1"},
                {"id": "pneu", "name": "Pneumonie rechts basal", "detail": "03/2026, behandelt", "ref": "Austrittsbericht, S. 1",
                 "quote": "Ambulant erworbene Pneumonie rechts basal", "quoteSrc": "Spital Musterstadt · Austrittsbericht vom 19.03.2026 · Seite 1"},
                {"id": "appe", "name": "Status nach Appendektomie", "detail": "2018", "ref": "Zuweisung (Foto)",
                 "quote": "Status nach Appendektomie 2018 (Spital Musterstadt)", "quoteSrc": "Hausarztpraxis Seefeld · Zuweisung vom 14.03.2026 · Handyfoto"},
            ]},
            {"title": "Allergien", "items": [
                {"id": "peni", "name": "Penicillin", "detail": "generalisiertes Exanthem 2011", "ref": "3 Quellen",
                 "quote": "Bekannte Penicillin-Allergie (generalisiertes Exanthem 2011)", "quoteSrc": "Austrittsbericht S. 1 · Medikamentenliste · Zuweisung"},
            ]},
            {"title": "Medikamente", "items": [
                {"id": "meto", "name": "Metoprolol 25 mg", "detail": "1-0-0, seit 03/2026", "ref": "Medikamentenliste",
                 "quote": "Metoprolol 25 mg · 1-0-0 · Vorhofflimmern · 03/2026", "quoteSrc": "Hausarztpraxis Seefeld · Aktuelle Medikation, Stand 26.03.2026"},
                {"id": "ceti", "name": "Cetirizin 10 mg", "detail": "bei Bedarf", "ref": "Medikamentenliste",
                 "quote": "Cetirizin 10 mg · 0-0-1 bei Bedarf · Heuschnupfen", "quoteSrc": "Hausarztpraxis Seefeld · Aktuelle Medikation, Stand 26.03.2026"},
            ]},
            {"title": "Letzte Werte", "items": [
                {"id": "crp", "name": "CRP 4 mg/l", "detail": "im Normbereich, 26.03.2026", "ref": "Laborbefund",
                 "quote": "CRP 4 mg/l (Referenz < 5)", "quoteSrc": "Hausarztpraxis Seefeld · Laborbefund vom 26.03.2026"},
            ]},
        ],
        "missing": "Kardiologischer Bericht von Dr. med. Sabine Brunner. Anfrage bei der Patientin hängig.",
        "documents": 4,
        "sourceCount": 2,
        "updatedAt": "10:42",
        "reviewedAt": None,
    })


def fresh_state() -> StafetteState:
    """Start of the live demo: Anna has not signed yet, nothing has happened."""
    return StafetteState.model_validate({
        "patient": {"name": "Anna Muster", "birth": "12.03.1984", "address": "Seestrasse 12, 8008 Zürich"},
        "doctor": {"name": "Dr. med. Lea Keller", "city": "Winterthur"},
        "mandate": {
            "version": 1,
            "hash": "—",
            "sources": ["Hausarztpraxis Seefeld", "Spital Musterstadt"],
            "recipient": "Dr. med. Lea Keller, Winterthur",
            "scope": "Berichte, Laborwerte, Medikamente, Röntgen",
            "validUntil": "31. Oktober",
        },
        "stations": [
            {"id": "praxis_a", "name": "Hausarztpraxis Seefeld", "detail": "Noch nicht kontaktiert", "status": "waiting"},
            {"id": "spital_b", "name": "Spital Musterstadt", "detail": "Noch nicht kontaktiert", "status": "waiting"},
        ],
        "approval": None,
        "approvalResult": None,
        "events": [],
        "sections": [],
        "missing": None,
        "documents": 0,
        "sourceCount": 0,
        "updatedAt": now_hm(),
        "reviewedAt": None,
        "call": None,
    })


# --- Store -------------------------------------------------------------------

class StateStore:
    """Holds the current state and notifies SSE subscribers on every change."""

    def __init__(self) -> None:
        self._state = fresh_state()
        self._subscribers: set[asyncio.Queue[dict]] = set()
        self._event_seq = 100

    @property
    def state(self) -> StafetteState:
        return self._state

    def snapshot(self) -> dict:
        return self._state.wire()

    # subscriptions (one queue per open /events connection)
    def subscribe(self) -> asyncio.Queue[dict]:
        q: asyncio.Queue[dict] = asyncio.Queue(maxsize=16)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[dict]) -> None:
        self._subscribers.discard(q)

    def _publish(self) -> None:
        self._state.updated_at = now_hm()
        snap = self.snapshot()
        for q in list(self._subscribers):
            if q.full():  # slow client: drop its oldest snapshot, the newest wins
                q.get_nowait()
            q.put_nowait(snap)

    # mutations
    def reset(self, *, story: bool = False) -> None:
        """Back to the live start (default) or to the finished demo story (tests, offline look)."""
        self._state = seed_state() if story else fresh_state()
        self._publish()

    def set_mandate(self, *, version: int, hash: str, sources: list[str]) -> None:
        m = self._state.mandate
        m.version, m.hash, m.sources = version, hash, sources
        self._publish()

    def add_station(self, station: Station) -> None:
        if all(s.id != station.id for s in self._state.stations):
            self._state.stations.append(station)
        self._publish()

    def set_approval(self, approval: PendingApproval | None) -> None:
        self._state.approval = approval
        if approval is not None:
            self._state.approval_result = None
        self._publish()

    def set_call(self, *, source_name: str | None = None, status: str | None = None,
                 outcome: str | None = None, clear_lines: bool = False) -> None:
        call = self._state.call
        if call is None or clear_lines:
            call = CallView(source_name=source_name or "", status=status or "ringing")
        if source_name is not None:
            call.source_name = source_name
        if status is not None:
            call.status = status  # type: ignore[assignment]
        if outcome is not None:
            call.outcome = outcome
        self._state.call = call
        self._publish()

    def add_call_line(self, who: str, text: str, keep: int = 14) -> None:
        if self._state.call is None:
            return
        lines = self._state.call.lines
        if lines and lines[-1].who == who and who == "agent":
            lines[-1].text = f"{lines[-1].text} {text}".strip()   # TTS arrives in pieces: one bubble per turn
        else:
            lines.append(CallLine(who=who, text=text))  # type: ignore[arg-type]
        del lines[:-keep]
        self._publish()

    def add_event(self, decision: Decision | str, text: str, model: str | None = None) -> StafetteEvent:
        """Log one policy decision (or a plain label) to the protocol and push it."""
        label = decision if isinstance(decision, str) else decision_label(decision)
        self._event_seq += 1
        event = StafetteEvent(id=f"e{self._event_seq}", ts=now_hm(), decision=label, text=text, model=model)
        self._state.events.append(event)
        self._publish()
        return event

    def set_station(self, station_id: str, *, status: str | None = None, detail: str | None = None,
                    guard: str | None = None) -> None:
        for s in self._state.stations:
            if s.id == station_id:
                if status is not None:
                    s.status = status  # type: ignore[assignment]
                if detail is not None:
                    s.detail = detail
                if guard is not None:
                    s.guard = guard
        self._publish()

    def set_documents(self, sections: list[Section] | list[dict], missing: str | None,
                      documents: int, source_count: int) -> None:
        """Entry point for the document pipeline (backend/docs/): replace Dr. Keller's sheet."""
        self._state.sections = [s if isinstance(s, Section) else Section.model_validate(s) for s in sections]
        self._state.missing = missing
        self._state.documents = documents
        self._state.source_count = source_count
        self._publish()

    def answer_approval(self, approval_id: str, approve: bool) -> bool:
        """Record Anna's answer and close the question. What follows is the orchestrator's job.

        Returns False if there is no pending approval with this id.
        """
        st = self._state
        if st.approval is None or st.approval.id != approval_id:
            return False
        st.approval = None
        st.approval_result = "yes" if approve else "no"
        self._publish()
        return True

    def mark_reviewed(self) -> None:
        self._state.reviewed_at = now_hm()
        self._publish()


store = StateStore()
