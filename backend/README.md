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
| `policy/` | Vollmacht-Schema, `check()`, Tests | Gabriel | ⬜ |
| `voice/` | Twilio-Bridge, gradbot-Session, Gesprächsbeginn, Dialog-Tools | Gabriel | ⬜ |
| `docs/` | Akten lesen, Zitate prüfen, Lücken finden ([Auftrag](docs/README.md)) | Manuel | ⬜ |

## API für das Dashboard

| Endpoint | Was |
|---|---|
| `GET /state` | aktueller `StafetteState` |
| `GET /events` | Server-Sent Events, jede Nachricht `data: {"state": StafetteState}` |
| `POST /approvals/{id}` | Annas Antwort, Body `{"approve": true\|false}` |
| `POST /reset` | Demo zurücksetzen |
| `GET /healthz` | `{"status": "ok"}` |

Gehostetes Dashboard (Azure): dessen URL in `CORS_ORIGINS` eintragen und das Backend über die feste ngrok-Domain erreichbar machen.
