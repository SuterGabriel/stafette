"""Orchestrator endpoints, called from the dashboard (owner: Gabriel)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent import orchestrator
from state import store
from voice import calls

router = APIRouter(prefix="/agent", tags=["agent"])
store.set_simulate(calls.SIMULATE)   # show the mode from .env from the first page load on


class SimulateRequest(BaseModel):
    on: bool


@router.post("/simulate")
async def simulate(req: SimulateRequest) -> dict:
    """Test mode on/off: calls are played by a script through the same tools and policy, no phone rings."""
    calls.set_simulate(req.on)
    return {"ok": True, "simulate": req.on}


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
