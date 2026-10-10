import json

import pytest
from fastapi.testclient import TestClient

import main
from agent import orchestrator
from state import store
from voice import calls

client = TestClient(main.app)

BRUNNER = {"name": "Dr. med. Sabine Brunner, Kardiologie am See", "specialty": "Kardiologie"}


def setup_function() -> None:
    orchestrator.reset()


def texts() -> list[str]:
    return [e["text"] for e in client.get("/state").json()["events"]]


def test_state_matches_dashboard_contract() -> None:
    s = client.get("/state").json()
    for key in ("patient", "doctor", "mandate", "stations", "approval", "approvalResult", "events",
                "sections", "missing", "documents", "sourceCount", "updatedAt", "reviewedAt", "call"):
        assert key in s
    assert s["mandate"]["validUntil"] == "October 31"


def test_live_demo_starts_empty() -> None:
    s = client.get("/state").json()
    assert s["events"] == [] and s["sections"] == [] and s["approval"] is None and s["call"] is None
    assert {st["id"]: st["status"] for st in s["stations"]} == {"praxis_a": "waiting", "spital_b": "waiting"}


def test_story_seed_still_available_for_offline_look() -> None:
    store.reset(story=True)
    s = client.get("/state").json()
    assert s["sections"][0]["items"][0]["quoteSrc"] and s["approval"]["id"] == "add_source_dr_brunner"


def test_start_signs_mandate_and_places_the_call() -> None:
    assert client.post("/agent/start").status_code == 200
    t = texts()
    assert t[0].startswith("Mandate v1 signed")
    assert "place_call(praxis_a)" in t                      # allowed by the policy engine
    assert any(x.startswith("Call not possible") for x in t)   # tests have no Twilio credentials


def test_gap_asks_anna_and_yes_creates_mandate_v2() -> None:
    orchestrator.propose_source(BRUNNER)
    s = client.get("/state").json()
    assert s["approval"]["id"] == "add_source_dr_brunner"
    assert s["events"][-1]["decision"] == "APPROVAL"
    assert any(st["id"] == "dr_brunner" and st["status"] == "waiting" for st in s["stations"])

    assert client.post("/approvals/add_source_dr_brunner", json={"approve": True}).status_code == 200
    s = client.get("/state").json()
    assert s["approval"] is None and s["approvalResult"] == "yes"
    assert s["mandate"]["version"] == 2 and "Dr. med. Sabine Brunner" in s["mandate"]["sources"]
    assert calls.MANDATE.version == 2 and "dr_brunner" in calls.MANDATE.source_ids
    assert "place_call(dr_brunner)" in texts()


def test_no_drops_the_source() -> None:
    orchestrator.propose_source(BRUNNER)
    client.post("/approvals/add_source_dr_brunner", json={"approve": False})
    s = client.get("/state").json()
    assert s["approvalResult"] == "no" and s["mandate"]["version"] == 1
    assert next(st for st in s["stations"] if st["id"] == "dr_brunner")["status"] == "skipped"


def test_ingest_fills_the_sheet_and_proposes_missing_sources(tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    cache = tmp_path / "ingest_cache.json"
    cache.write_text(json.dumps({
        "sections": [{"title": "Diagnosen", "items": [{"id": "vhf", "name": "Vorhofflimmern", "detail": "2026",
                                                        "ref": "Austrittsbericht, S. 1", "quote": "Paroxysmales Vorhofflimmern",
                                                        "quoteSrc": "Spital Musterstadt · S. 1"}]}],
        "missing": "Kardiologischer Bericht von Dr. med. Sabine Brunner.",
        "missing_sources": [BRUNNER], "rejected": [], "documents": 5, "source_count": 2,
    }), encoding="utf-8")
    monkeypatch.setattr(orchestrator, "CACHE", cache)

    r = client.post("/agent/ingest")
    assert r.status_code == 200 and r.json()["missing_sources"] == 1
    s = client.get("/state").json()
    assert s["documents"] == 5 and s["sections"][0]["items"][0]["id"] == "vhf"
    assert s["approval"]["id"] == "add_source_dr_brunner"


def test_unknown_approval_is_404() -> None:
    assert client.post("/approvals/nope", json={"approve": True}).status_code == 404


def test_reset_returns_to_the_live_start() -> None:
    orchestrator.propose_source(BRUNNER)
    client.post("/approvals/add_source_dr_brunner", json={"approve": True})
    client.post("/reset")
    assert client.get("/state").json()["mandate"]["version"] == 1 and calls.MANDATE.version == 1
