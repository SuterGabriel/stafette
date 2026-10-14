# Stack and partner integration

Research from October 9, 2026 in [RESEARCH.md](RESEARCH.md#3-tech-stack-verified). **This document as of: October 10, 2026, 13:20.** Decided on hack day: phone part on **gradbot** (pattern from [gradium-ai/digigrad](https://github.com/gradium-ai/digigrad)) instead of Pipecat.

## Overview

| Layer | Choice | Why |
|---|---|---|
| Voice pipeline | **gradbot 0.1.9** (Gradium), Twilio bridge following the pattern of `digigrad/src/gradphone/bridge.py`, rebuilt lean | Already runs in digigrad with Twilio + Gradium. Windows wheels available, no WSL needed |
| Telephony | **Twilio**, upgraded account, number **without** Regulatory Bundle | CH number needs a bundle, CH mobile is SMS only, trial too limited |
| STT / TTS | **Gradium** via gradbot | Partner, streaming, turn-taking, Swiss voice |
| Dialog + orchestrator | **`gemini-3.6-flash`** | Cheap, function calling. Dialog runs over the OpenAI-compatible Gemini interface (gradbot requirement) |
| Policy compiler + extraction | **`gemini-3.8-flash`** via `google-genai` | Strongest Flash, structured output, PDFs and photos |
| Policy engine | Python, pure functions + Pydantic | Testable, deterministic |
| Backend | FastAPI, **one process on port 8000** | Dashboard routes and Twilio routes in the same server, one tunnel is enough |
| Dashboard | Next.js 15.5.27 (`dashboard/`) | Runs on demo data without a backend |
| Tunnel | ngrok with fixed domain `runny-lagoon-overhead.ngrok-free.dev` → port 8000 | Twilio needs a public URL |
| Hosting | **Frontend on Vercel**, **backend on the laptop** behind ngrok | Vercel Functions can't do WebSockets (Twilio Media Stream), long SSE connections or shared in-memory state. After the hack: Render, Railway or Fly.io |
| Mail sending | **Simulated in the MVP** | `send_mandate_letter` creates the PDF and an event "sent to address on file", but sends nothing. HIN (the Swiss secure email network for healthcare) after the hack |
| Development | **Claude Code** (Antigravity optional) + **Entire** | Entire is enabled for both |

> ⚠️ Do **not** use `gemini-flash-latest`, it points to 3.5. `gemini-3.7-flash` is deprecated. Deliberately **not** `gemini-3.8-live`: Twilio audio format and latency, and only the cascaded pipeline delivers the Gradium voice and transcripts.

## Repo structure: current and target

✅ exists · ⬜ still to build

```
stafette/
├── README.md                ✅ Overview, status, links
├── docs/                    ✅ PROJECT, ARCHITECTURE, POLICY, STACK, DEMO, PITCH, RESEARCH, diagrams.html
├── brand/                   ✅ Logo, app icon
├── fixtures/                ✅ 6 synthetic documents + make_fixtures.py
├── dashboard/               ✅ Next.js 15: Anna's app + Dr. Keller's handover, runs on mock data
│   ├── app/                 ✅ /  (demo stage, both views) · /anna · /keller
│   ├── components/          ✅ AnnaApp.tsx, KellerSheet.tsx, Logo, Icons
│   └── lib/                 ✅ types.ts (= contract with the backend), mock.ts, useStafette.ts (SSE)
└── backend/                 ⬜ not created yet
    ├── pyproject.toml       ⬜ uv, Python 3.12
    ├── .env.example         ⬜ see below
    ├── main.py              ⬜ FastAPI :8000. Dashboard: /state, /events (SSE), /approvals/{id}, /reset
    │                           Twilio: /twilio/twiml, /twilio/stream · Documents: /docs/ingest
    ├── state.py             ⬜ StafetteState (exactly like dashboard/lib/types.ts), event log, SSE push, in-memory
    ├── contracts.py         ⬜ Allowed | NeedsApproval | Blocked, outcome values, event format
    ├── policy/
    │   ├── schema.py        ⬜ Pydantic model of the mandate
    │   ├── compiler.py      ⬜ gemini-3.8-flash → mandate (structured output)
    │   ├── engine.py        ⬜ check(action, args, mandate, state, now) → Decision
    │   ├── letter.py        ⬜ Mandate + confidentiality waiver as PDF (reportlab), sending simulated
    │   └── test_engine.py   ⬜ Test cases 1–10 from POLICY.md
    ├── agent/
    │   ├── orchestrator.py  ⬜ Goal loop: ask gemini-3.6-flash after every event, tool calls only
    │   ├── plan_state.py    ⬜ State per source (ARCHITECTURE.md §3), mapped to stations in the dashboard
    │   ├── tools.py         ⬜ search_contact, place_call, send_mandate_letter, add_source, mark_done …
    │   └── sim_call.py      ⬜ Simulated call (text), fallback for the phone part
    ├── voice/
    │   ├── bridge.py        ⬜ Twilio Media Streams ⇄ gradbot.run() (after digigrad: producer/consumer, μ-law)
    │   ├── session.py       ⬜ gradbot.SessionConfig: voice, prompt, tools, turn-taking
    │   ├── opener.py        ⬜ Fixed call opening, pre-rendered via Gradium TTS
    │   └── tools.py         ⬜ request_records, confirm_channel, set_recipient, accept_fee, end_call → check()
    └── docs/
        ├── extract.py       ⬜ gemini-3.8-flash: page → sources with quote (+ bounding box for photos)
        ├── verify.py        ⬜ Quote must appear in the page text (pymupdf)
        └── gaps.py          ⬜ Doctors mentioned without records → event to the orchestrator
```

**What we take from digigrad (as a template, not copied):** Twilio dial, TwiML `<Connect><Stream>`, WebSocket bridge with μ-law resampling, `SessionConfig` in `business` mode, pre-rendered opener, tool dispatch with error catching (`_run_tool_call`). **Left out:** Telegram, voice cloning, mail, web search, memory, tenants, database, inbound.

**Where the policy engine sits:** Every tool call from gradbot goes through `voice/tools.py` → `check()` → on `Blocked` `handle.send_error(reason)`, on `Allowed` the real action. In digigrad this is the `_run_tool_call()` spot.

## Partners in detail

### Google DeepMind / Gemini

Five visible roles. We deliberately don't add more Google products.

1. **Compiler** (`gemini-3.8-flash`): spoken goal → mandate JSON via structured output. Rebuilt as v2, v3 … with every approval.
2. **Orchestrator** (`gemini-3.6-flash`): decides the next step after every event, answers only with tool calls.
3. **Dialog agent** (`gemini-3.6-flash` in gradbot): handles the phone call, acts only through tools.
4. **Reader** (`gemini-3.8-flash`): extraction from PDFs, scans and skewed photos, with page, quote and doctors mentioned. For the phone photo (no text layer), Gemini also returns the **bounding box** of the quote. This is the strongest Gemini moment of the demo.
5. **Contact search** (`search_contact`): Google Search grounding as a **separate** call inside the tool, so the orchestrator still only outputs tool calls. First to be cut if time runs short.

**Make it visible:** Every event carries the `model` field, the dashboard shows it in the log. The policy engine always made the decision.

**Gemini in gradbot:** gradbot only speaks OpenAI-compatible endpoints. Without this setting the agent calls with OpenAI and Gemini drops out:

```
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.6-flash
OPENAI_API_KEY=<Gemini-Key>   # name is set by gradbot, the value is the Gemini key
```

**Risk:** Test tool calls over this interface with a real call first.

Gemma 4 running locally is **not** built, only mentioned in the pitch as a next stage.

### Gradium

- Via gradbot: `gradbot.run()` reads `GRADIUM_API_KEY` from the environment and does STT → LLM → TTS.
- **STT** language `de` (speak Standard German in the demo). Turn-taking via `silence_timeout_s` (8.0), `flush_duration_s` (0.5) and `stt_extra_config={"padding_bonus": 1.5}`, values from digigrad.
- **TTS** Swiss voice (Standard German with a Swiss accent), example ID `vox_emb_ybLDszpRN8R26pPr`. digigrad has no German voice, the ID must be set in `session.py`.
- Call opening pre-rendered and with `assistant_speaks_first=False`, so the LLM doesn't phrase it.
- No voice cloning of the patient's voice.

### Entire

- Active in the repo (`entire status`), for Claude Code and Antigravity. Checkpoints are synced with every push to `origin`.
- Demo (20 s): commit with `Entire-Checkpoint` trailer → session timeline on entire.io → `entire checkpoint explain <id>` live.
- Pitch line: *"We built a guardrail for agents that act in the world, and we built it with agents whose every step is auditable."*

### Twilio

- Upgrade the account, buy an instantly available number **without** a bundle, enable geo permissions for Switzerland.
- Outbound call via REST `calls.create(url=PUBLIC_URL/twilio/twiml)`, TwiML `<Connect><Stream url="wss://…/twilio/stream"/></Connect>`, audio 8 kHz μ-law.
- Leave `TWILIO_MACHINE_DETECTION` off (digigrad: otherwise calls drop after seconds).

### Voice pitfalls

- **No speaker** on stage: echo triggers false barge-in. MPA (medical practice assistant) phone at the ear or a headset.
- ngrok URL changes on restart → fixed domain or update `PUBLIC_URL`.
- Phone hotspot as backup for the venue Wi-Fi.

## Setup

```powershell
# ngrok (installed via winget)
ngrok config add-authtoken <token from dashboard.ngrok.com>
ngrok update                 # winget ships 3.3.1
ngrok http 8000

# Backend (once created)
cd backend
uv sync                      # Python 3.12
uv run uvicorn main:app --port 8000

# Dashboard
cd dashboard
npm install
npm run dev                  # http://localhost:3000, on demo data without a backend
```

Backend dependencies: `fastapi`, `uvicorn[standard]`, `gradbot==0.1.9`, `gradium`, `twilio`, `google-genai`, `pydantic`, `pymupdf`, `reportlab`, `python-dotenv`.

## Checklist

- [x] Repo with docs, brand, fixtures (`3bb0a75`)
- [x] Entire active
- [x] Dashboard on mock data, Next.js patched (`240979e`)
- [x] ngrok installed
- [ ] ngrok authtoken, `ngrok update`, `ngrok http 8000` gives a URL
- [ ] Gemini API key, `gemini-3.6-flash` and `gemini-3.8-flash` called once
- [ ] Gradium API key, Swiss voice tested
- [ ] Twilio upgraded, number bought, CH geo permission on
- [ ] `backend/` with `contracts.py`, `state.py`, `/state` + `/events` → dashboard shows "Live connected"
- [ ] First call: Twilio → gradbot (Gemini) → phone, opener audible

## Environment variables

`backend/.env.example`:

```
# Gemini (compiler, orchestrator, reader)
GEMINI_API_KEY=
# Gemini for gradbot (phone dialog), OpenAI-compatible
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.6-flash
OPENAI_API_KEY=            # = Gemini key
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
