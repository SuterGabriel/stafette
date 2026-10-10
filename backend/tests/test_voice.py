"""Phone agent tests without network: tool decisions, TwiML and the protected dial endpoint."""

import asyncio

import pytest
from fastapi.testclient import TestClient
from twilio.request_validator import RequestValidator

import main
from state import store
from voice.calls import CALLS, Call
from voice.tools import GUARD_RECIPIENT, handle_tool_call

client = TestClient(main.app)


class FakeHandle:
    def __init__(self, name: str, args: dict | None = None):
        self.name, self.args, self.sent = name, args or {}, None

    async def send_json(self, obj) -> None:
        self.sent = obj


def run_tool(name: str, args: dict | None = None, call: Call | None = None):
    call = call or Call(id="t1", source_id="praxis_a", source_name="Hausarztpraxis Seefeld", to="+41000000000")
    handle = FakeHandle(name, args)
    asyncio.run(handle_tool_call(handle, call))
    return handle.sent, call


def setup_function() -> None:
    store.reset()
    CALLS.clear()


def test_private_mail_on_the_phone_is_blocked_and_shown() -> None:
    reply, _ = run_tool("set_recipient", {"address": "anna.priv@gmail.com"})
    assert reply["ok"] is False and reply["reason"] == "recipient_not_in_mandate"
    assert "Dr. med. Lea Keller" in reply["say"]
    last = store.state.events[-1]
    assert last.decision == "BLOCKED" and "recipient_not_in_mandate" in last.text and last.model == "gemini-3.6-flash"
    assert next(s for s in store.state.stations if s.id == "praxis_a").guard == GUARD_RECIPIENT


def test_extra_records_go_to_anna_first() -> None:
    reply, _ = run_tool("request_records", {"scope": ["reports", "psychiatry_reports"]})
    assert reply["ok"] is False and "needs_approval" in reply
    assert store.state.events[-1].decision == "APPROVAL"


def test_source_comes_from_the_call_not_from_the_model() -> None:
    reply, _ = run_tool("request_records", {"scope": ["reports"], "source_id": "spital_c"})
    assert reply["ok"] is True
    assert "praxis_a" in store.state.events[-1].text


def test_identify_principal_says_only_disclosable_facts() -> None:
    reply, _ = run_tool("identify_principal")
    assert reply == {"ok": True, "name": "Anna Muster", "geburtsdatum": "1984-03-12", "neue_aerztin": "Dr. med. Lea Keller"}


def test_end_call_hangs_up_and_updates_the_station() -> None:
    reply, call = run_tool("end_call", {"outcome": "requested"})
    assert reply == {"ok": True} and call.end_requested and call.outcome == "requested"
    station = next(s for s in store.state.stations if s.id == "praxis_a")
    assert "directly to Dr. Keller" in station.detail


def test_unknown_tool_is_refused() -> None:
    reply, call = run_tool("send_records_to", {"address": "x@y.ch"})
    assert reply["ok"] is False and not call.end_requested
    assert store.state.events[-1].decision == "BLOCKED"


def test_dial_needs_the_admin_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STAFETTE_ADMIN_TOKEN", "secret-token")
    assert client.post("/twilio/dial", json={"source_id": "praxis_a"}).status_code == 403
    assert client.post("/twilio/dial", json={"source_id": "praxis_a"},
                       headers={"X-Stafette-Token": "wrong"}).status_code == 403


def test_dial_to_unknown_source_is_blocked_before_twilio(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STAFETTE_ADMIN_TOKEN", "secret-token")
    r = client.post("/twilio/dial", json={"source_id": "spital_c"}, headers={"X-Stafette-Token": "secret-token"})
    assert r.status_code == 200 and r.json()["detail"] == "unknown_source"
    assert "unknown_source" in store.state.events[-1].text


def test_twiml_requires_twilio_signature(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test-token")
    monkeypatch.setenv("PUBLIC_URL", "https://stafette.ngrok.app")
    monkeypatch.delenv("ALLOW_INSECURE_TWILIO", raising=False)
    CALLS["abc"] = Call(id="abc", source_id="praxis_a", source_name="Hausarztpraxis Seefeld", to="+41000000000")
    form = {"CallSid": "CA123", "From": "+13312824626"}

    assert client.post("/twilio/twiml?call=abc", data=form).status_code == 403

    url = "https://stafette.ngrok.app/twilio/twiml?call=abc"
    signature = RequestValidator("test-token").compute_signature(url, form)
    r = client.post("/twilio/twiml?call=abc", data=form, headers={"X-Twilio-Signature": signature})
    assert r.status_code == 200
    assert '<Stream url="wss://stafette.ngrok.app/twilio/stream">' in r.text
    assert '<Parameter name="call" value="abc"/>' in r.text


def test_unknown_or_inbound_call_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLOW_INSECURE_TWILIO", "1")
    assert "<Reject/>" in client.post("/twilio/twiml", data={"CallSid": "CA9"}).text
