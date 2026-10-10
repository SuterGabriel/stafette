from fastapi.testclient import TestClient

import main
from state import store

client = TestClient(main.app)


def setup_function() -> None:
    store.reset()


def test_state_matches_dashboard_contract() -> None:
    s = client.get("/state").json()
    for key in ("patient", "doctor", "mandate", "stations", "approval", "approvalResult", "events",
                "sections", "missing", "documents", "sourceCount", "updatedAt", "reviewedAt"):
        assert key in s
    assert s["mandate"]["validUntil"] == "31. Oktober"
    assert s["sections"][0]["items"][0]["quoteSrc"]
    assert {e["decision"] for e in s["events"]} <= {"ALLOWED", "BLOCKED", "APPROVAL"}


def test_approval_yes_extends_mandate() -> None:
    r = client.post("/approvals/add_source_dr_brunner", json={"approve": True})
    assert r.status_code == 200
    s = client.get("/state").json()
    assert s["approval"] is None and s["approvalResult"] == "yes"
    assert s["mandate"]["version"] == 2
    assert "Dr. Sabine Brunner, Kardiologie" in s["mandate"]["sources"]
    assert s["events"][-1]["text"] == "place_call(dr_brunner)"


def test_approval_no_drops_source() -> None:
    client.post("/approvals/add_source_dr_brunner", json={"approve": False})
    s = client.get("/state").json()
    assert s["approvalResult"] == "no" and s["mandate"]["version"] == 1
    brunner = next(st for st in s["stations"] if st["id"] == "dr_brunner")
    assert brunner["status"] == "skipped"


def test_unknown_approval_is_404() -> None:
    assert client.post("/approvals/nope", json={"approve": True}).status_code == 404


def test_reset_restores_seed() -> None:
    client.post("/approvals/add_source_dr_brunner", json={"approve": True})
    client.post("/reset")
    assert client.get("/state").json()["mandate"]["version"] == 1
