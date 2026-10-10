"""Start a demo call through the running backend.

    uv run python scripts/call.py              # calls "Hausarztpraxis Seefeld" (praxis_a)
    uv run python scripts/call.py spital_b

The backend (uvicorn on :8000) and ngrok must be running. The phone that
rings is DEMO_TO_NUMBER from backend/.env, never a real practice.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

source = sys.argv[1] if len(sys.argv) > 1 else "praxis_a"
req = urllib.request.Request(
    "http://localhost:8000/twilio/dial",
    data=json.dumps({"source_id": source}).encode(),
    headers={"Content-Type": "application/json", "X-Stafette-Token": os.environ.get("STAFETTE_ADMIN_TOKEN", "")},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(json.dumps(json.loads(resp.read()), indent=2, ensure_ascii=False))
except urllib.error.HTTPError as err:
    print(f"HTTP {err.code}: {err.read().decode(errors='replace')}")
except urllib.error.URLError as err:
    print(f"Backend nicht erreichbar ({err.reason}). Läuft 'uv run uvicorn main:app --port 8000'?")
