# Stafette Backend

Ein FastAPI-Prozess auf Port 8000 für Dashboard, Telefon und Dokumente. Alles in-memory.

## Starten

```powershell
cd backend
copy .env.example .env      # Keys eintragen, .env wird nie committet
uv sync
uv run uvicorn main:app --port 8000
```

Dashboard live verbinden: `dashboard/.env.local` mit `NEXT_PUBLIC_API_URL=http://localhost:8000`, dann `npm run dev`. Unten rechts steht „Live verbunden“.

Tests: `uv run pytest`

## Aufbau

| Datei / Ordner | Inhalt | Wer | Stand |
|---|---|---|---|
| `main.py` | `/state`, `/events` (SSE), `/approvals/{id}`, `/reset`, CORS | Gabriel | ✅ |
| `state.py` | `StafetteState` genau wie `dashboard/lib/types.ts`, Store mit SSE-Push, Demo-Seed | Gabriel | ✅ |
| `contracts.py` | `Allowed` · `NeedsApproval` · `Blocked`, Call-Outcomes, Modellnamen | Gabriel | ✅ |
| `policy/` | Vollmacht-Schema, `check()`, Tests für alle Fälle aus POLICY.md | Gabriel | ✅ |
| `voice/` | Twilio-Bridge, gradbot-Session (Stimme Livia, de-ch), Gesprächsbeginn, Dialog-Tools durch `check()` | Gabriel | ✅ Code, Live-Test offen |
| `scripts/` | `gradium_check.py` (Stimmen, Opener), `call.py` (Demo-Anruf starten) | Gabriel | ✅ |
| `docs/` | Akten lesen, Zitate prüfen, Lücken finden ([Auftrag](docs/README.md)) | Manuel | ⬜ |

## Anruf starten

Braucht in `.env`: `OPENAI_API_KEY` (= Gemini-Key für gradbot), `GRADIUM_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `DEMO_TO_NUMBER`, `PUBLIC_URL` (feste ngrok-Domain) und `STAFETTE_ADMIN_TOKEN`.

```powershell
ngrok http 8000 --url <feste-domain>.ngrok.app     # Terminal 1
cd backend; uv run uvicorn main:app --port 8000    # Terminal 2
cd backend; uv run python scripts/call.py          # Terminal 3: ruft DEMO_TO_NUMBER an
```

Ablauf: `place_call` → Policy Engine → Twilio wählt → nach dem Abheben `/twilio/twiml` (Signatur geprüft) → Audio über `/twilio/stream` zu gradbot → fester Gesprächsbeginn → Gespräch. Jeder Tool-Call geht durch `check()` und erscheint im Protokoll des Dashboards.

## API für das Dashboard

| Endpoint | Was |
|---|---|
| `GET /state` | aktueller `StafetteState` |
| `GET /events` | Server-Sent Events, jede Nachricht `data: {"state": StafetteState}` |
| `POST /approvals/{id}` | Annas Antwort, Body `{"approve": true\|false}` |
| `POST /reset` | Demo zurücksetzen |
| `GET /healthz` | `{"status": "ok"}` |

Gehostetes Dashboard (Azure): dessen URL in `CORS_ORIGINS` eintragen und das Backend über die feste ngrok-Domain erreichbar machen.
