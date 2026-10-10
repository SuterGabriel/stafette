# Stack und Partner-Integration

Verifiziert am 9.10.2026, Quellen in [RESEARCH.md](RESEARCH.md#3-tech-stack-verifiziert).

## Überblick

| Schicht | Wahl | Warum |
|---|---|---|
| Voice-Orchestrierung | **Pipecat** (Python) | Offizielle Gradium-Services, Twilio-Serializer, Gemini-LLM-Service |
| Telefonie | **Twilio**, upgegradeter Account, Nummer **ohne** Regulatory Bundle | CH-Nummer braucht Bundle, CH-Mobile nur SMS, Trial zu eingeschränkt |
| STT / TTS | **Gradium** (`pipecat-ai[gradium]`) | Partner, Streaming, semantische VAD, Schweizer Stimme |
| Dialog + Orchestrator | **`gemini-3.6-flash`** | GA, Pipecat-Default, günstig, Function Calling |
| Policy-Compiler + Extraktion | **`gemini-3.8-flash`** | Stärkstes Flash, Structured Output, PDFs bis 1000 Seiten |
| Policy Engine | Python, pure functions + Pydantic | Testbar, deterministisch |
| Backend | FastAPI auf Port **8000** | Twilio-WebSocket, SSE fürs Dashboard |
| Dashboard | Next.js 15 (`dashboard/`) | Gabriel kennt es; läuft ohne Backend auf Demo-Daten |
| Tunnel | ngrok, `ngrok http 8000` (feste Domain, wenn möglich) | Twilio braucht öffentliche URL |
| Mail-Versand | **Im MVP simuliert** | `send_mandate_letter` erzeugt das PDF und ein Event „an hinterlegte Adresse gesendet“, verschickt aber nichts. Kein Mail-Dienst nötig, keine echte Adresse im Spiel. HIN erst nach dem Hack. |
| Entwicklung | **Claude Code** und/oder **Antigravity CLI (`agy`)** + **Entire** | Entire ist für beide aktiviert. Gemini CLI wird eingestellt und von Entire nicht unterstützt |

> ⚠️ **Nicht** `gemini-flash-latest` verwenden, das zeigt auf 3.5. `gemini-3.7-flash` ist deprecated. Live-Variante (`gemini-3.8-live`) bewusst **nicht** im MVP: Twilio-Audioformat und gemeldete Latenzen machen die kaskadierte Pipeline sicherer, und nur sie liefert Gradium-Stimme und Transkripte fürs Dashboard.

## Repo-Struktur

```
stafette/
├── backend/
│   ├── main.py              # FastAPI :8000 – Dashboard: /state, /events (SSE), /approvals/{id}, /reset
│   │                        #               Twilio: /twilio/twiml, /ws · Dokumente: /docs/ingest
│   ├── agent/
│   │   ├── orchestrator.py  # Ziel-Schleife: nach jedem Event gemini-3.6-flash fragen (nur Tool-Calls)
│   │   ├── plan_state.py    # Karte pro Quelle, Zustandsmaschine
│   │   ├── tools.py         # search_contact, place_call, send_mandate_letter, add_source, ...
│   │   └── sim_call.py      # Simulierter Anruf (Text) für Strang B und als Fallback
│   ├── voice/
│   │   ├── bot.py           # aus pipecat-examples/twilio-chatbot, STT/TTS auf Gradium getauscht
│   │   └── tools.py         # request_records, confirm_channel, set_recipient, end_call, ...
│   ├── policy/
│   │   ├── schema.py        # Pydantic-Modell der Vollmacht
│   │   ├── compiler.py      # gemini-3.8-flash → Vollmacht (Structured Output)
│   │   ├── engine.py        # check(...) -> Allowed | NeedsApproval | Blocked
│   │   ├── letter.py        # Vollmacht/Entbindung als PDF für Unterschrift
│   │   └── test_engine.py   # Injection-Fälle als Tests
│   ├── docs/
│   │   ├── extract.py       # gemini-3.8-flash: Seite -> Fundstellen mit Zitat + erwähnte Ärzte
│   │   ├── verify.py        # Zitat muss im Seitentext vorkommen
│   │   └── gaps.py          # Erwähnte Quellen ohne Unterlagen -> Event an Orchestrator
│   └── events.py            # In-memory Event Log mit TTL
├── dashboard/               # Next.js 15, Typen in lib/types.ts = Vertrag mit dem Backend
├── fixtures/                # Synthetische Dokumente
└── *.md
```

## Partner im Detail

### Google DeepMind / Gemini

Fünf sichtbare Rollen, damit die Juroren sehen, dass Gemini nicht nur ein Chatfenster ist. Mehr Google-Produkte hängen wir bewusst nicht an; diese Rollen sauber zeigen ist wichtiger.

1. **Compiler** (`gemini-3.8-flash`): Gesprochenes Ziel → Vollmacht-JSON per Structured Output (`response_format` mit `mime_type: "application/json"` und `schema`). Bei jeder Freigabe neu als v2, v3 …
2. **Orchestrator** (`gemini-3.6-flash`): Entscheidet nach jedem Ereignis den nächsten Schritt, antwortet nur mit Tool-Calls.
3. **Dialog-Agent** (`gemini-3.6-flash` in Pipecat): führt das Telefonat, handelt nur über Tools.
4. **Leser** (`gemini-3.8-flash`): Multimodale Extraktion aus Scans und schiefen Fotos, mit Seite, Zitat und erwähnten Ärzten. Beim Handyfoto (kein Textlayer) liefert Gemini zusätzlich die **Bounding Box** des Zitats, damit das Dashboard es auf dem Foto markieren kann. Das ist der stärkste Gemini-Moment der Demo.
5. **Kontaktsuche** (`search_contact`): Google-Search-Grounding der Gemini API. Läuft als **eigener** Gemini-Aufruf innerhalb des Tools, nicht im Orchestrator-Request, damit der Orchestrator weiterhin nur Tool-Calls ausgibt. Wird als Erstes gestrichen, wenn die Zeit knapp ist (DEMO.md).

**Sichtbar machen:** Jedes Event trägt das Feld `model` (z. B. `gemini-3.6-flash`), das Dashboard zeigt es neben dem Entscheid. Entschieden hat immer die Policy Engine. So steht „The model proposes, code decides“ direkt im Protokoll.

**Falls Fallback gradbot:** gradbot spricht nur OpenAI-kompatible Endpoints. Ohne diese Einstellung telefoniert der Agent mit OpenAI und Gemini fällt raus:

```
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-3.6-flash
OPENAI_API_KEY=<Gemini-Key>   # Name ist von gradbot vorgegeben, Inhalt ist der Gemini-Key
```

Tool-Calls über diese Schnittstelle **vor 12:30 mit einem echten Anruf testen**.

```python
from pipecat.services.google.llm import GoogleLLMService
llm = GoogleLLMService(
    api_key=os.environ["GEMINI_API_KEY"],
    settings=GoogleLLMService.Settings(model="gemini-3.6-flash"),  # model= ist deprecated
)
```

Gemma 4 lokal für die Extraktion wird **nicht** gebaut, nur im Pitch als Ausbaustufe erwähnt (Datenschutz-Frage).

### Gradium

- `uv add "pipecat-ai[gradium]"` → `GradiumSTTService` (`pipecat.services.gradium.stt`), `GradiumTTSService` (`pipecat.services.gradium.tts`).
- **STT** Sprache `de` (kein `de-CH`; Hochdeutsch sprechen in der Demo). Semantische VAD für sauberes Turn-Taking.
- **TTS** Schweizer Stimme (Hochdeutsch mit Schweizer Akzent), Beispiel-ID `vox_emb_ybLDszpRN8R26pPr`. TTS liefert 48 kHz, Pipecat resampled auf Twilio-8 kHz.
- Kein Voice Cloning der Patientenstimme (wirkt wie Täuschung).
- Fallback: **Gradbot** (`pip install gradbot`, Twilio Media Streams eingebaut, LLM muss OpenAI-kompatibel sein).

### Entire

- Gemini CLI wird **nicht** unterstützt und von Google eingestellt → **Antigravity CLI (`agy`)**.
- Vor der ersten Zeile Code aktivieren, damit die ganze Entstehung als Checkpoints vorliegt.
- Demo (20 s): Commit mit `Entire-Checkpoint`-Trailer → Session-Timeline auf entire.io (Prompt, Tool Calls, Diff) → `entire checkpoint explain <id>` live.
- Pitch-Satz: *"We built a guardrail for agents that act in the world, and we built it with agents whose every step is auditable."*

### Twilio

- **Heute Abend:** Account upgraden, sofort verfügbare Nummer **ohne** Bundle kaufen, Geo-Permissions für Anrufe in die Schweiz freischalten, Testanruf aufs Teammate-Handy. Internationale Gebühren in Kauf nehmen.
- Ausgehender Anruf per REST-API mit TwiML `<Connect><Stream url="wss://…/ws"/></Connect>`.
- `TwilioFrameSerializer` braucht `stream_sid` (für Auto-Hangup zusätzlich `call_sid`, `account_sid`, `auth_token`), Transport `FastAPIWebsocketTransport` mit `add_wav_header=False`.
- Starter: [pipecat-examples/twilio-chatbot](https://github.com/pipecat-ai/pipecat-examples/tree/main/twilio-chatbot) (inbound und outbound). STT/TTS auf Gradium tauschen.

### Voice-Einstellungen gegen bekannte Stolperfallen

- `SileroVADAnalyzer` lokal, `stop_secs=0.2`, Interruptions an.
- **Kein Lautsprecher** auf der Bühne: Echo löst falsches Barge-in aus. MPA-Handy am Ohr bzw. Headset.
- ngrok-URL ändert sich bei Neustart → feste Domain oder TwiML nachziehen.
- Handy-Hotspot als Backup fürs Saal-WLAN.

## Setup-Befehle (aus den Docs)

```bash
# Entire
curl -fsSL https://entire.io/install.sh | bash      # Linux
brew install --cask entireio/tap/entire              # macOS
entire login
entire enable --agent antigravity
entire status && entire doctor
entire checkpoint list
entire checkpoint explain <id>

# ngrok (Windows: winget install --id Ngrok.Ngrok -e)
ngrok config add-authtoken <token von dashboard.ngrok.com>
ngrok update                 # winget liefert 3.3.1, ngrok verlangt evtl. eine neuere Version
ngrok http 8000              # Projekt-Backend; im Pipecat-Beispiel ist es 7860

# Pipecat
uv add "pipecat-ai[gradium]"
uv add "pipecat-ai[google]"
# im geklonten pipecat-examples/twilio-chatbot:
uv sync
cp env.example .env
ngrok http 7860
uv run bot.py --transport twilio

# Dashboard
cd dashboard && npm install && npm run dev   # http://localhost:3000, ohne Backend auf Demo-Daten

# Fallback
pip install gradbot
```

## Setup-Checkliste (heute Abend)

- [ ] Gemini API Key, `gemini-3.6-flash` und `gemini-3.8-flash` einmal aufgerufen
- [ ] Gradium API Key, Schweizer Stimme getestet
- [ ] Twilio upgegradet, Nummer gekauft, CH-Geo-Permission an
- [x] ngrok installiert (3.3.1 via winget)
- [ ] ngrok Authtoken hinterlegt, `ngrok update`, `ngrok http 8000` gibt eine URL
- [ ] **Hello-World:** Twilio ruft Handy an, Gradium sagt einen Satz (im Beispiel-Repo, nicht im Projekt-Repo)
- [ ] Antigravity CLI + Entire installiert, `entire doctor` grün
- [ ] Leeres Projekt-Repo, aber **noch kein Projektcode**
- [ ] 5 synthetische Dokumente in `fixtures/`
- [ ] `.env.example`:

```
GEMINI_API_KEY=
GRADIUM_API_KEY=
GRADIUM_VOICE_ID=vox_emb_ybLDszpRN8R26pPr
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
DEMO_TO_NUMBER=
PUBLIC_URL=https://xxxx.ngrok.app
DEMO_RELAX_CALL_HOURS=true
```

Dashboard: `dashboard/.env.local` mit `NEXT_PUBLIC_API_URL=http://localhost:8000`.

> Accounts, Keys, Testdokumente und ein Hello-World im fremden Beispiel-Repo sind übliche Vorbereitung. Projektcode vorher zu schreiben kann gegen die Regeln sein; bei der Opening nachfragen.
