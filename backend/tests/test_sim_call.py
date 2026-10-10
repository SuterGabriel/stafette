"""Test mode: the scripted call goes through the real tools and the real policy engine."""

import asyncio

from fastapi.testclient import TestClient

import main
from agent import orchestrator, sim_call
from state import store
from voice import calls

client = TestClient(main.app)


def setup_function() -> None:
    calls.set_simulate(False)
    orchestrator.reset()


def teardown_function() -> None:
    calls.set_simulate(False)


def test_toggle_survives_reset_and_shows_in_state() -> None:
    assert client.post("/agent/simulate", json={"on": True}).json() == {"ok": True, "simulate": True}
    client.post("/reset")
    assert client.get("/state").json()["simulateCalls"] is True


def test_simulated_first_call_blocks_the_private_address() -> None:
    calls.set_simulate(True)
    call = asyncio.run(calls.dial("praxis_a"))
    call.opener_task.cancel()                       # run the script here, without delays
    asyncio.run(sim_call.run(call, delay=0))

    s = store.state
    assert s.call.status == "ended" and s.call.simulated and s.call.outcome == "requested"
    texts = [(e.decision, e.text) for e in s.events]
    assert ("ALLOWED", "place_call(praxis_a)") in texts
    assert any(d == "ALLOWED" and t.startswith("request_records(praxis_a") for d, t in texts)
    assert any(d == "BLOCKED" and "recipient_not_in_mandate" in t for d, t in texts)
    assert any("Dr. med. Lea Keller" in line.text for line in s.call.lines if line.who == "agent")
    station = next(st for st in s.stations if st.id == "praxis_a")
    assert station.guard and "directly to Dr. Keller" in station.detail


def test_no_twilio_needed_in_test_mode() -> None:
    calls.set_simulate(True)
    call = asyncio.run(calls.dial("praxis_a"))
    call.opener_task.cancel()
    assert call.to == "Testmodus" and not any("Call not possible" in e.text for e in store.state.events)
