# Stack und Partner-Integration

Recherche vom 9.10.2026 in [RESEARCH.md](RESEARCH.md#3-tech-stack-verifiziert). **Stand dieses Dokuments: 10.10.2026, 13:20.** Am Hack-Tag entschieden: Telefonteil auf **gradbot** (Muster aus [gradium-ai/digigrad](https://github.com/gradium-ai/digigrad)) statt Pipecat.

## Überblick

| Schicht | Wahl | Warum |
|---|---|---|
| Voice-Pipeline | **gradbot 0.1.9** (Gradium), Twilio-Bridge nach dem Muster von `digigrad/src/gradphone/bridge.py`, schlank nachgebaut | Läuft in digigrad bereits mit Twilio + Gradium. Windows-Wheels vorhanden, kein WSL nötig |
| Telefonie | **Twilio**, upgegradeter Account, Nummer **ohne** Regulatory Bundle | CH-Nummer braucht Bundle, CH-Mobile nur SMS, Trial zu eingeschränkt |
| STT / TTS | **Gradium** über gradbot | Partner, Streaming, Turn-Taking, Schweizer Stimme |
| Dialog + Orchestrator | **`gemini-3.6-flash`** | Günstig, Function Calling. Dialog läuft über die OpenAI-kompatible Gemini-Schnittstelle (gradbot-Vorgabe) |
| Policy-Compiler + Extraktion | **`gemini-3.8-flash`** über `google-genai` | Stärkstes Flash, Structured Output, PDFs und Fotos |
| Policy Engine | Python, pure functions + Pydantic | Testbar, deterministisch |
| Backend | FastAPI, **ein Prozess auf Port 8000** | Dashboard-Routen und Twilio-Routen im selben Server, ein Tunnel genügt |
| Dashboard | Next.js 15.5.27 (`dashboard/`) | Läuft ohne Backend auf Demo-Daten |
| Tunnel | ngrok mit fester Domain `runny-lagoon-overhead.ngrok-free.dev` → Port 8000 | Twilio braucht eine öffentliche URL |
| Hosting | **Frontend auf Vercel**, **Backend auf dem Laptop** hinter ngrok | Vercel Functions können keine WebSockets (Twilio Media Stream), keine langen SSE-Verbindungen und keinen gemeinsamen Zustand im Speicher. Nach dem Hack: Render, Railway oder Fly.io |
| Mail-Versand | **Im MVP simuliert** | `send_mandate_letter` erzeugt das PDF und ein Event „an hinterlegte Adresse gesendet“, verschickt aber nichts. HIN nach dem Hack |
| Entwicklung | **Claude Code** (Antigravity optional) + **Entire** | Entire ist für beide aktiviert |

> ⚠️ **Nicht** `gemini-flash-latest` verwenden, das zeigt auf 3.5. `gemini-3.7-flash` ist deprecated. `gemini-3.8-live` bewusst **nicht**: Twilio-Audioformat und Latenz, und nur die kaskadierte Pipeline liefert Gradium-Stimme und Transkripte.

## Repo-Struktur: Ist und Soll

✅ vorhanden · ⬜ noch zu bauen

```
stafette/
├── README.md                ✅ Überblick, Stand, Links
├── docs/                    ✅ PROJECT, ARCHITECTURE, POLICY, STACK, DEMO, PITCH, RESEARCH, diagramme.html
├── brand/                   ✅ Logo, App-Icon
├── fixtures/                ✅ 6 synthetische Dokumente + make_fixtures.py
├── dashboard/               ✅ Next.js 15 – Annas App + Dr. Kellers Übergabe, läuft auf Mock-Daten
│   ├── app/                 ✅ /  (Demo-Bühne, beide Ansichten) · /anna · /keller
│   ├── components/          ✅ AnnaApp.tsx, KellerSheet.tsx, Logo, Icons
│   └── lib/                 ✅ types.ts (= Vertrag mit dem Backend), mock.ts, useStafette.ts (SSE)
└── backend/                 ⬜ noch nicht angelegt
    ├── pyproject.toml       ⬜ uv, Python 3.12
    ├── .env.example         ⬜ siehe unten
    ├── main.py              ⬜ FastAPI :8000 – Dashboard: /state, /events (SSE), /approvals/{id}, /reset
    │                           Twilio: /twilio/twiml, /twilio/stream · Dokumente: /docs/ingest
    ├── state.py             ⬜ StafetteState (genau wie dashboard/lib/types.ts), Event Log, SSE-Push, in-memory
    ├── contracts.py         ⬜ Allowed | NeedsApproval | Blocked, Outcome-Werte, Event-Format
    ├── policy/
    │   ├── schema.py        ⬜ Pydantic-Modell der Vollmacht
    │   ├── compiler.py      ⬜ gemini-3.8-flash → Vollmacht (Structured Output)
    │   ├── engine.py        ⬜ check(action, args, mandate, state, now) → Decision
    │   ├── letter.py        ⬜ Vollmacht + Entbindung als PDF (reportlab), Versand simuliert
    │   └── test_engine.py   ⬜ Testfälle 1–10 aus POLICY.md
    ├── agent/
    │   ├── orchestrator.py  ⬜ Ziel-Schleife: nach jedem Ereignis gemini-3.6-flash fragen, nur Tool-Calls
    │   ├── plan_state.py    ⬜ Zustand pro Quelle (ARCHITECTURE.md §3), abgebildet auf Stations im Dashboard
    │   ├── tools.py         ⬜ search_contact, place_call, send_mandate_letter, add_source, mark_done …
    │   └── sim_call.py      ⬜ Simulierter Anruf (Text), Fallback für den Telefonteil
    ├── voice/
    │   ├── bridge.py        ⬜ Twilio Media Streams ⇄ gradbot.run() (nach digigrad: producer/consumer, μ-law)
    │   ├── session.py       ⬜ gradbot.SessionConfig: Stimme, Prompt, Tools, Turn-Taking
    │   ├── opener.py        ⬜ Fixer Gesprächsbeginn, vorgerendert über Gradium TTS
    │   └── tools.py         ⬜ request_records, confirm_channel, set_recipient, accept_fee, end_call → check()
    └── docs/
        ├── extract.py       ⬜ gemini-3.8-flash: Seite → Fundstellen mit Zitat (+ Bounding Box beim Foto)
        ├── verify.py        ⬜ Zitat muss im Seitentext vorkommen (pymupdf)
        └── gaps.py          ⬜ Erwähnte Ärzte ohne Unterlagen → Ereignis an den Orchestrator
```

**Was aus digigrad übernommen wird (als Vorlage, nicht kopiert):** Twilio-Dial, TwiML `<Connect><Stream>`, WebSocket-Bridge mit μ-law-Resampling, `SessionConfig` im Modus `business`, vorgerenderter Opener, Tool-Dispatch mit Fehlerfang (`_run_tool_call`). **Weggelassen:** Telegram, Voice Cloning, Mail, Websuche, Memory, Tenants, Datenbank, Inbound.

**Wo die Policy Engine sitzt:** Jeder Tool-Call von gradbot läuft durch `voice/tools.py` → `check()` → bei `Blocked` `handle.send_error(reason)`, bei `Allowed` die echte Aktion. In digigrad ist das die Stelle `_run_tool_call()`.

## Partner im Detail

### Google DeepMind / Gemini

Fünf sichtbare Rollen. Mehr Google-Produkte hängen wir bewusst nicht an.

1. **Compiler** (`gemini-3.8-flash`): Gesprochenes Ziel → Vollmacht-JSON per Structured Output. Bei jeder Freigabe neu als v2, v3 …
2. **Orchestrator** (`gemini-3.6-flash`): Entscheidet nach jedem Ereignis den nächsten Schritt, antwortet nur mit Tool-Calls.
3. **Dialog-Agent** (`gemini-3.6-flash` in gradbot): führt das Telefonat, handelt nur über Tools.
4. **Leser** (`gemini-3.8-flash`): Extraktion aus PDFs, Scans und schiefen Fotos, mit Seite, Zitat und erwähnten Ärzten. Beim Handyfoto (kein Textlayer) liefert Gemini zusätzlich die **Bounding Box** des Zitats. Das ist der stärkste Gemini-Moment der Demo.
5. **Kontaktsuche** (`search_contact`): Google-Search-Grounding als **eigener** Aufruf innerhalb des Tools, damit der Orchestrator weiterhin nur Tool-Calls ausgibt. Wird als Erstes gestrichen, wenn die Zeit knapp ist.

**Sichtbar machen:** Jedes Event trägt das Feld `model`, das Dashboard zeigt es im Protokoll. Entschieden hat immer die Policy Engine.

**Gemini in gradbot:** gradbot spricht nur OpenAI-kompatible Endpoints. Ohne diese Einstellung telefoniert der Agent mit OpenAI und Gemini fällt raus:

```
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.6-flash
OPENAI_API_KEY=<Gemini-Key>   # Name ist von gradbot vorgegeben, Inhalt ist der Gemini-Key
```

**Risiko:** Tool-Calls über diese Schnittstelle als Erstes mit einem echten Anruf testen.

Gemma 4 lokal wird **nicht** gebaut, nur im Pitch als Ausbaustufe erwähnt.

### Gradium

- Über gradbot: `gradbot.run()` liest `GRADIUM_API_KEY` aus der Umgebung und macht STT → LLM → TTS.
- **STT** Sprache `de` (Hochdeutsch sprechen in der Demo). Turn-Taking über `silence_timeout_s` (8.0), `flush_duration_s` (0.5) und `stt_extra_config={"padding_bonus": 1.5}` – Werte aus digigrad.
- **TTS** Schweizer Stimme (Hochdeutsch mit Schweizer Akzent), Beispiel-ID `vox_emb_ybLDszpRN8R26pPr`. In digigrad gibt es keine deutsche Stimme, die ID muss in `session.py` gesetzt werden.
- Gesprächsbeginn vorgerendert und mit `assistant_speaks_first=False`, damit er nicht vom LLM formuliert wird.
- Kein Voice Cloning der Patientenstimme.

### Entire

- Ist im Repo aktiv (`entire status`), für Claude Code und Antigravity. Checkpoints werden mit jedem Push auf `origin` synchronisiert.
- Demo (20 s): Commit mit `Entire-Checkpoint`-Trailer → Session-Timeline auf entire.io → `entire checkpoint explain <id>` live.
- Pitch-Satz: *"We built a guardrail for agents that act in the world, and we built it with agents whose every step is auditable."*

### Twilio

- Account upgraden, sofort verfügbare Nummer **ohne** Bundle kaufen, Geo-Permissions für die Schweiz freischalten.
- Ausgehender Anruf per REST `calls.create(url=PUBLIC_URL/twilio/twiml)`, TwiML `<Connect><Stream url="wss://…/twilio/stream"/></Connect>`, Audio 8 kHz μ-law.
- `TWILIO_MACHINE_DETECTION` aus lassen (digigrad: sonst brechen Anrufe nach Sekunden ab).

### Voice-Stolperfallen

- **Kein Lautsprecher** auf der Bühne: Echo löst falsches Barge-in aus. MPA-Handy am Ohr bzw. Headset.
- ngrok-URL ändert sich bei Neustart → feste Domain oder `PUBLIC_URL` nachziehen.
- Handy-Hotspot als Backup fürs Saal-WLAN.

## Setup

```powershell
# ngrok (installiert via winget)
ngrok config add-authtoken <token von dashboard.ngrok.com>
ngrok update                 # winget liefert 3.3.1
ngrok http 8000

# Backend (sobald angelegt)
cd backend
uv sync                      # Python 3.12
uv run uvicorn main:app --port 8000

# Dashboard
cd dashboard
npm install
npm run dev                  # http://localhost:3000, ohne Backend auf Demo-Daten
```

Abhängigkeiten Backend: `fastapi`, `uvicorn[standard]`, `gradbot==0.1.9`, `gradium`, `twilio`, `google-genai`, `pydantic`, `pymupdf`, `reportlab`, `python-dotenv`.

## Checkliste

- [x] Repo mit Docs, Brand, Fixtures (`3bb0a75`)
- [x] Entire aktiv
- [x] Dashboard auf Mock-Daten, Next.js gepatcht (`240979e`)
- [x] ngrok installiert
- [ ] ngrok Authtoken, `ngrok update`, `ngrok http 8000` gibt eine URL
- [ ] Gemini API Key, `gemini-3.6-flash` und `gemini-3.8-flash` einmal aufgerufen
- [ ] Gradium API Key, Schweizer Stimme getestet
- [ ] Twilio upgegradet, Nummer gekauft, CH-Geo-Permission an
- [ ] `backend/` mit `contracts.py`, `state.py`, `/state` + `/events` → Dashboard zeigt „Live verbunden“
- [ ] Erster Anruf: Twilio → gradbot (Gemini) → Handy, Opener hörbar

## Umgebungsvariablen

`backend/.env.example`:

```
# Gemini (Compiler, Orchestrator, Leser)
GEMINI_API_KEY=
# Gemini für gradbot (Telefon-Dialog), OpenAI-kompatibel
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.6-flash
OPENAI_API_KEY=            # = Gemini-Key
# Gradium
GRADIUM_API_KEY=
GRADIUM_VOICE_ID=vox_emb_ybLDszpRN8R26pPr
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
DEMO_TO_NUMBER=
TWILIO_MACHINE_DETECTION=Disable
# Tunnel
PUBLIC_URL=https://xxxx.ngrok.app
# Demo
DEMO_RELAX_CALL_HOURS=true
```

`dashboard/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
