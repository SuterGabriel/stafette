"""HTTP and WebSocket endpoints of the phone agent (owner: Gabriel).

POST /twilio/dial    start a call to a mandated source (needs STAFETTE_ADMIN_TOKEN)
POST /twilio/twiml   Twilio asks what to do after pickup -> <Connect><Stream>
WS   /twilio/stream  the live audio, bridged to gradbot

Twilio's requests are verified with its HMAC signature; without a valid
signature nothing is answered. main.py already includes this router.
"""

from __future__ import annotations

import hmac
import os
from xml.sax.saxutils import quoteattr

from fastapi import APIRouter, Header, HTTPException, Request, WebSocket
from fastapi.responses import Response
from pydantic import BaseModel
from twilio.request_validator import RequestValidator

from contracts import Allowed
from voice.bridge import run_bridge
from voice.calls import CALLS, Call, dial, public_url, public_ws_url

router = APIRouter(prefix="/twilio", tags=["voice"])

_REJECT = '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>'


def _twilio_signature_ok(url: str, params: dict, signature: str) -> bool:
    if os.environ.get("ALLOW_INSECURE_TWILIO", "").strip() == "1":   # local tests only
        return True
    token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
    if not token or not signature:
        return False
    return RequestValidator(token).validate(url, params, signature)


class DialRequest(BaseModel):
    source_id: str = "praxis_a"


@router.post("/dial")
async def dial_endpoint(body: DialRequest, x_stafette_token: str = Header(default="")) -> dict:
    """Start a call. Protected because the backend is public behind ngrok and calls cost money."""
    expected = os.environ.get("STAFETTE_ADMIN_TOKEN", "").strip()
    if not expected or not hmac.compare_digest(x_stafette_token, expected):
        raise HTTPException(status_code=403, detail="missing or wrong X-Stafette-Token")
    try:
        result = await dial(body.source_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if isinstance(result, Call):
        return {"decision": "ALLOWED", "call_id": result.id, "twilio_sid": result.twilio_sid}
    return {"decision": "ALLOWED" if isinstance(result, Allowed) else type(result).__name__,
            "detail": getattr(result, "reason", None) or getattr(result, "question", None)}


@router.post("/twiml")
async def twiml(request: Request) -> Response:
    form = {k: str(v) for k, v in (await request.form()).items()}
    url = f"{public_url()}{request.url.path}" + (f"?{request.url.query}" if request.url.query else "")
    if not _twilio_signature_ok(url, form, request.headers.get("x-twilio-signature", "")):
        raise HTTPException(status_code=403, detail="invalid Twilio signature")

    call_id = request.query_params.get("call", "")
    if call_id not in CALLS:            # inbound calls and unknown calls are not answered
        return Response(_REJECT, media_type="application/xml")
    stream_url = quoteattr(f"{public_ws_url()}/twilio/stream")
    xml = ('<?xml version="1.0" encoding="UTF-8"?><Response><Connect>'
           f'<Stream url={stream_url}><Parameter name="call" value={quoteattr(call_id)}/></Stream>'
           '</Connect></Response>')
    return Response(xml, media_type="application/xml")


@router.websocket("/stream")
async def stream(ws: WebSocket) -> None:
    # For WebSockets Twilio signs the <Stream url> exactly, without parameters.
    if not _twilio_signature_ok(f"{public_ws_url()}/twilio/stream", {}, ws.headers.get("x-twilio-signature", "")):
        await ws.close(code=4403)
        return
    await ws.accept()
    await run_bridge(ws)
