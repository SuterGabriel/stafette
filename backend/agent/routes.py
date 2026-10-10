"""Orchestrator endpoints, called from the dashboard (owner: Gabriel)."""

from fastapi import APIRouter, HTTPException

from agent import orchestrator

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/start")
async def start() -> dict:
    """Anna signed the mandate in her app: the agent starts calling."""
    await orchestrator.start()
    return {"ok": True}


@router.post("/ingest")
async def ingest() -> dict:
    """Records arrived at Dr. Keller: read, verify, fill the sheet, propose missing sources."""
    try:
        return {"ok": True, **await orchestrator.ingest()}
    except Exception as exc:  # noqa: BLE001 - e.g. GEMINI_API_KEY missing
        raise HTTPException(status_code=503, detail=f"Dokumente konnten nicht gelesen werden: {exc}") from exc
