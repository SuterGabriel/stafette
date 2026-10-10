"""The policy engine: the only place that decides whether an agent action runs.

The model proposes an action (a tool call). check() compares it with the
mandate and the current plan state and returns Allowed, NeedsApproval or
Blocked. It never calls a model, never touches the network and has no global
state: same input, same decision. Default is Blocked. See docs/POLICY.md.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from contracts import CALL_OUTCOMES, Allowed, Blocked, Decision, NeedsApproval
from policy.schema import Mandate

# Every action the agent can propose. Anything else is blocked.
ORCHESTRATOR_ACTIONS = (
    "search_contact", "place_call", "schedule_callback", "prepare_mandate_letter",
    "send_mandate_letter", "add_source", "ask_principal", "mark_done",
)
DIALOG_ACTIONS = (
    "identify_principal", "request_records", "confirm_recipient", "confirm_channel",
    "set_recipient", "accept_fee", "ask_principal", "end_call",
)
KNOWN_ACTIONS = frozenset(ORCHESTRATOR_ACTIONS + DIALOG_ACTIONS)

# A newly found source is proposed by name and specialty only. Contact details
# from a document are never trusted; the number comes from our own search.
ADD_SOURCE_FIELDS = frozenset({"name", "specialty", "reason"})

# A source is finished when its records are verified, or it refused, or Anna said no.
TERMINAL_STATES = frozenset({"verified", "refused", "skipped"})


@dataclass
class PlanState:
    """What has happened per source so far (owned by the orchestrator)."""
    calls_made: dict[str, int] = field(default_factory=dict)
    signed: set[str] = field(default_factory=set)
    status: dict[str, str] = field(default_factory=dict)

    def calls(self, source_id: str) -> int:
        return self.calls_made.get(source_id, 0)

    def is_signed(self, source_id: str) -> bool:
        return source_id in self.signed

    def all_terminal(self, source_ids: set[str]) -> bool:
        return all(self.status.get(s) in TERMINAL_STATES for s in source_ids)


def _same_address(a: str, b: str) -> bool:
    return a.strip().casefold() == b.strip().casefold()


def check(
    action: str,
    args: dict,
    mandate: Mandate,
    state: PlanState,
    now: datetime,
    *,
    relax_call_hours: bool = False,
) -> Decision:
    """Decide one proposed action. relax_call_hours is the demo flag for a Saturday evening."""
    if action not in KNOWN_ACTIONS:
        return Blocked("unknown_action")

    if now.date() > mandate.valid_until:
        return Blocked("mandate_expired")

    match action:
        case "add_source":
            if set(args) - ADD_SOURCE_FIELDS:
                return Blocked("contact_details_not_allowed")
            return NeedsApproval(
                f"Darf ich {args.get('name', '?')} ({args.get('specialty', '?')}) hinzufügen? "
                f"Grund: {args.get('reason', '')}"
            )

        case "accept_fee":
            return NeedsApproval(f"Die Praxis verlangt {args.get('amount', '?')} Franken. Einverstanden?")

        case "place_call" | "schedule_callback":
            source_id = args.get("source_id")
            if source_id not in mandate.source_ids:
                return Blocked("unknown_source")
            if state.calls(source_id) >= mandate.limits.max_calls_per_source:
                return Blocked("call_limit_reached")
            at = args.get("at", now)
            if not relax_call_hours and not mandate.limits.in_call_hours(at):
                return Blocked("outside_call_hours")
            return Allowed()

        case "request_records":
            if args.get("source_id") not in mandate.source_ids:
                return Blocked("unknown_source")
            if not set(args.get("scope", ())) <= set(mandate.scope):
                return NeedsApproval("Die Praxis will mehr schicken als vereinbart. Erlauben?")
            return Allowed()

        case "set_recipient":
            if not _same_address(str(args.get("address", "")), mandate.recipient.address):
                return Blocked("recipient_not_in_mandate")
            return Allowed()

        case "send_mandate_letter":
            source_id = args.get("source_id")
            if source_id not in mandate.source_ids:
                return Blocked("unknown_source")
            if not state.is_signed(source_id):
                return Blocked("mandate_not_signed")
            return Allowed()

        case "search_contact" | "prepare_mandate_letter" | "confirm_channel":
            if args.get("source_id") not in mandate.source_ids:
                return Blocked("unknown_source")
            return Allowed()

        case "mark_done":
            if not state.all_terminal(mandate.source_ids):
                return Blocked("open_sources")
            return Allowed()

        case "end_call":
            if args.get("outcome") not in CALL_OUTCOMES:
                return Blocked("invalid_outcome")
            return Allowed()

        case "ask_principal" | "identify_principal" | "confirm_recipient":
            return Allowed()

    return Blocked("unknown_action")
