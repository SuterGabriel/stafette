"""HTTP and WebSocket endpoints of the phone agent (owner: Gabriel).

Twilio calls /twilio/twiml after pickup and opens the media stream on
/twilio/stream. main.py already includes this router.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/twilio", tags=["voice"])
