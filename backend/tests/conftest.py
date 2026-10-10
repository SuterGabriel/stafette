import pytest


@pytest.fixture(autouse=True)
def _no_real_calls(monkeypatch: pytest.MonkeyPatch) -> None:
    """backend/.env holds real Twilio credentials; tests must never dial. Call hours relaxed for determinism."""
    for name in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("DEMO_RELAX_CALL_HOURS", "1")
