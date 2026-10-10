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

from docs import routes as docs_routes
from state import store
from voice import routes as voice_routes

load_dotenv()

app = FastAPI(title="Stafette backend")

# Each part owns its own router file, so nobody has to edit main.py:
# docs/routes.py (Manuel) and voice/routes.py (Gabriel).
app.include_router(docs_routes.router)
app.include_router(voice_routes.router)

# The dashboard runs on localhost:3000 locally and on Vercel when hosted.
# CORS_ORIGINS: exact origins (comma-separated). CORS_ORIGIN_REGEX: e.g. the
# project's Vercel preview deployments, https://stafette-.*\.vercel\.app
_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", "").strip() or None,
    allow_methods=["GET", "POST"],
    # ngrok-skip-browser-warning lets a hosted dashboard pass ngrok's free-domain warning page.
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],
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
                    yield ": keepalive\n\n"  # keeps proxies (ngrok, Vercel) from closing the stream
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
