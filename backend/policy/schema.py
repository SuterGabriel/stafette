"""The mandate (Vollmacht): what the agent may do on Anna's behalf.

Gemini compiles Anna's sentence into this structure once. From then on only
code reads it. A mandate is immutable; every extension creates a new version
(v2, v3 …) with a new hash, and the old version stays in the log.
See docs/POLICY.md.
"""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

# Actions that never run without Anna's explicit yes.
APPROVAL_ACTIONS = ("add_source", "change_recipient", "extend_scope", "accept_fee")


class Principal(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    birth_date: str


class Source(BaseModel):
    model_config = ConfigDict(frozen=True)
    id: str
    name: str
    phone: str
    specialty: str | None = None


class Recipient(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    channel: str
    address: str


class Limits(BaseModel):
    model_config = ConfigDict(frozen=True)
    max_calls_per_source: int = 3
    # Comma-separated HH:MM-HH:MM windows, local time.
    call_hours: str = "08:00-12:00,14:00-17:00"

    def in_call_hours(self, at: datetime) -> bool:
        t = at.time()
        for window in self.call_hours.split(","):
            start, end = (time.fromisoformat(p.strip()) for p in window.split("-"))
            if start <= t < end:
                return True
        return False


class Mandate(BaseModel):
    model_config = ConfigDict(frozen=True)
    mandate_id: str
    version: int = 1
    goal: str
    principal: Principal
    sources: tuple[Source, ...]
    recipient: Recipient
    scope: tuple[str, ...]
    may_disclose_on_call: tuple[str, ...] = ("principal.name", "principal.birth_date", "recipient.name")
    limits: Limits = Field(default_factory=Limits)
    valid_until: date
    requires_human_approval: tuple[str, ...] = APPROVAL_ACTIONS

    @property
    def source_ids(self) -> set[str]:
        return {s.id for s in self.sources}

    def hash(self) -> str:
        """sha256 over the canonical JSON; appears in every event and in the PDF footer."""
        canonical = json.dumps(self.model_dump(mode="json"), sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def with_source(self, source: Source) -> Mandate:
        """Anna said yes to a new source: the next version of the mandate."""
        return self.model_copy(update={"version": self.version + 1, "sources": (*self.sources, source)})

    def disclosable(self) -> dict[str, str]:
        """The only facts the phone agent may say on a call (identify_principal)."""
        facts = {
            "principal.name": self.principal.name,
            "principal.birth_date": self.principal.birth_date,
            "recipient.name": self.recipient.name,
        }
        return {k: v for k, v in facts.items() if k in self.may_disclose_on_call}


def example_mandate() -> Mandate:
    """Version 1 from docs/POLICY.md: Anna Muster, two sources, recipient Dr. Keller."""
    return Mandate(
        mandate_id="m_2026_10_10_001",
        version=1,
        goal="complete_history_for_new_gp",
        principal=Principal(name="Anna Muster", birth_date="1984-03-12"),
        sources=(
            Source(id="praxis_a", name="Hausarztpraxis Seefeld", phone="+41 44 000 00 01"),
            Source(id="spital_b", name="Spital Musterstadt", phone="+41 44 000 00 02"),
        ),
        recipient=Recipient(name="Dr. med. Lea Keller", channel="hin_mail", address="lea.keller@hin.ch"),
        scope=("reports", "lab_results", "medication_list", "imaging_reports"),
        valid_until=date(2026, 10, 31),
    )
