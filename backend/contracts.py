"""Shared contracts between policy engine, orchestrator, phone agent and dashboard.

Everything that crosses a module boundary is defined here, so the parts can be
built independently (see docs/PROJECT.md, "Schnittstelle zwischen uns").
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


# --- Policy decisions ------------------------------------------------------
# The model proposes an action; check() in policy/engine.py returns one of
# these. Nothing else may decide whether an action runs.

@dataclass(frozen=True)
class Allowed:
    pass


@dataclass(frozen=True)
class NeedsApproval:
    question: str


@dataclass(frozen=True)
class Blocked:
    reason: str


Decision = Allowed | NeedsApproval | Blocked

# How a decision is shown in the dashboard (dashboard/lib/types.ts: Decision).
DecisionLabel = Literal["ALLOWED", "BLOCKED", "APPROVAL"]


def decision_label(decision: Decision) -> DecisionLabel:
    if isinstance(decision, Allowed):
        return "ALLOWED"
    if isinstance(decision, NeedsApproval):
        return "APPROVAL"
    return "BLOCKED"


# --- Phone call ------------------------------------------------------------
# end_call(outcome) reports one of these back to the orchestrator.

CallOutcome = Literal["requested", "needs_consent", "closed", "refused", "callback"]
CALL_OUTCOMES: tuple[str, ...] = ("requested", "needs_consent", "closed", "refused", "callback")


# --- Models ----------------------------------------------------------------
# Shown next to each event so the jury sees which model proposed the step.
# The decision itself always comes from the policy engine.

MODEL_COMPILER = "gemini-3.8-flash"
MODEL_ORCHESTRATOR = "gemini-3.6-flash"
MODEL_DIALOG = "gemini-3.6-flash"
MODEL_READER = "gemini-3.8-flash"
