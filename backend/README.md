# Stafette Backend

One FastAPI process on port 8000 for the dashboard, phone and documents. Everything in memory.

## Run

```powershell
cd backend
copy .env.example .env      # add your keys, .env is never committed
uv sync
uv run uvicorn main:app --port 8000
```

Connect the dashboard live: `dashboard/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`, then `npm run dev`. The bottom right shows "Live connected".

Tests: `uv run pytest`

## Structure

| File / folder | Contents | Who | Status |
|---|---|---|---|
| `main.py` | `/state`, `/events` (SSE), `/approvals/{id}`, `/reset`, CORS | Gabriel | ✅ |
| `state.py` | `StafetteState` exactly like `dashboard/lib/types.ts`, store with SSE push, demo seed | Gabriel | ✅ |
| `contracts.py` | `Allowed` · `NeedsApproval` · `Blocked`, call outcomes, model names | Gabriel | ✅ |
| `policy/` | Mandate schema, `check()`, tests for every case in POLICY.md | Gabriel | ✅ |
| `voice/` | Twilio bridge, gradbot session (voice Livia, de-ch), call opener, dialog tools through `check()` | Gabriel | ✅ Code, live test pending |
| `scripts/` | `gradium_check.py` (voices, opener), `call.py` (start the demo call) | Gabriel | ✅ |
| `docs/` | Read records, check quotes, find gaps ([task](docs/README.md)) | Manuel | ⬜ |

## Start a call

Needs in `.env`: `OPENAI_API_KEY` (= Gemini key for gradbot), `GRADIUM_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `DEMO_TO_NUMBER`, `PUBLIC_URL` (fixed ngrok domain) and `STAFETTE_ADMIN_TOKEN`.

```powershell
ngrok http 8000 --url <fixed-domain>.ngrok.app     # Terminal 1
cd backend; uv run uvicorn main:app --port 8000    # Terminal 2
cd backend; uv run python scripts/call.py          # Terminal 3: calls DEMO_TO_NUMBER
```

Flow: `place_call` → policy engine → Twilio dials → after pickup `/twilio/twiml` (signature checked) → audio over `/twilio/stream` to gradbot → fixed call opener → conversation. Every tool call goes through `check()` and shows up in the dashboard log.

## API for the dashboard

| Endpoint | What |
|---|---|
| `GET /state` | current `StafetteState` |
| `GET /events` | Server-sent events, each message `data: {"state": StafetteState}` |
| `POST /approvals/{id}` | Anna's answer, body `{"approve": true\|false}` |
| `POST /reset` | Reset the demo |
| `GET /healthz` | `{"status": "ok"}` |

Hosted dashboard (Vercel): add its URL to `CORS_ORIGINS` (preview deployments: `CORS_ORIGIN_REGEX`) and make the backend reachable through the fixed ngrok domain.
