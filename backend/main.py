"""Stafette backend: one FastAPI process on port 8000.

Dashboard:  GET /state · GET /events (SSE) · POST /approvals/{id} · POST /reset
Twilio:     /twilio/twiml, /twilio/stream (voice/, coming next)
Documents:  /docs/ingest (docs/, built by Manuel)

Run:  uv run uvicorn main:app --port 8000
"""

from __future__ import annotations

import asyncio
import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from state import store

load_dotenv()

app = FastAPI(title="Stafette backend")

# The dashboard runs on localhost:3000 locally and on Azure when hosted.
# Add the Azure URL to CORS_ORIGINS (comma-separated) in .env.
_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_KEEPALIVE_S = 15.0


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@app.get("/state")
async def get_state() -> dict:
    return store.snapshot()


@app.get("/events")
async def events(request: Request) -> StreamingResponse:
    """Server-Sent Events: every message is {"state": StafetteState}, the full state."""
    queue = store.subscribe()

    async def stream():
        try:
            yield f"data: {json.dumps({'state': store.snapshot()}, ensure_ascii=False)}\n\n"
            while not await request.is_disconnected():
                try:
                    snap = await asyncio.wait_for(queue.get(), timeout=_KEEPALIVE_S)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # keeps proxies (ngrok, Azure) from closing the stream
                    continue
                yield f"data: {json.dumps({'state': snap}, ensure_ascii=False)}\n\n"
        finally:
            store.unsubscribe(queue)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class ApprovalAnswer(BaseModel):
    approve: bool


@app.post("/approvals/{approval_id}")
async def answer_approval(approval_id: str, answer: ApprovalAnswer) -> dict:
    if not store.answer_approval(approval_id, answer.approve):
        raise HTTPException(status_code=404, detail="no pending approval with this id")
    return {"ok": True}


@app.post("/reset")
async def reset() -> dict:
    store.reset()
    return {"ok": True}
