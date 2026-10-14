# Stafette Video

Remotion 4 · React 19 · Manrope bundled locally (`public/fonts`, renders offline).

```powershell
cd video
npm install
npm run dev                  # Remotion Studio in the browser
npm run render:intro         # out/logo-intro.mp4
npm run render:intro-dark    # out/logo-intro-dark.mp4
npm run render:tech          # out/tech-stack.mp4 (silent, for speaking live)
npm run voiceover            # re-record the script with Gradium
npm run render:tech-voice    # out/tech-stack-voiceover.mp4 (with Gradium voice)
```

## Compositions

| ID | What |
|---|---|
| `LogoIntro` | Logo animation, light background (default), 5 s, 1920×1080, 30 fps |
| `LogoIntroDark` | the same on ink background |
| `TechStackVoiceover` | `TechStack` with Gradium narrator, scenes grow with the text (approx. 84 s) |
| `TechStack` | "How it’s built", 67 s, same look: title → mandate → policy → call → document path → photo → gap → stack → closing shot |

Sequence: the two batons slide in along their axis and meet like in a relay baton handover
(the dark overlap only appears when they touch), a short pulse with two rings, then the
wordmark unfolds letter by letter, with the claim below in three steps:
"Switch doctors." → "Your medical history follows." → small line "An AI agent that collects your records,
only with your permission." From second 3 the frame holds, good as an opener
or as a background on stage.

Change the claim: in the Studio under Props, or when rendering with
`--props='{"dark":false,"setup":"…","promise":"…","subline":"…"}'`.
Geometry and colors match `brand/stafette-mark.svg`.

## TechStack

"How it’s built", **67 s**. Each scene builds up and then holds for a few seconds, so you can talk over it
live. Pace and length per scene are in `SCENES` (`src/tech/TechStack.tsx`): `speed` stretches the
choreography, `dur` sets how long the scene holds.

### Script (English, approx. 2.5 words per second)

| Time | Scene | What you say |
|---|---|---|
| 0:00 | Gemini proposes. Code decides. | “So how does it work? One rule runs through everything: Gemini proposes, code decides.” |
| 0:04 | 01 Mandate | “Anna says one sentence. Gemini compiles it into a mandate: who may be contacted, who receives the records, and until when. Anna signs it.” |
| 0:11 | 02 Policy Engine | “From then on, the orchestrator plans every next step, but it can only emit tool calls. Each one hits our policy engine, plain deterministic code: allowed, blocked, or ask Anna.” |
| 0:21 | 03 Call | “Gemini leads the phone call, Twilio carries it, and Gradium gives it a Swiss voice. When someone tries to redirect the records, the tool call is blocked. It can’t, not won’t.” |
| 0:31 | 04 Records arrive | “The records go over HIN straight to Dr. Keller’s practice, never to us. Stafette reads them on her behalf: Gemini extracts each finding, code checks every quote against its page, and instructions hidden in documents are dropped.” |
| 0:43 | 05 Reading | “Even a crooked phone photo: Gemini finds the line, and the quote points back to the exact spot.” |
| 0:49 | 06 The gap | “Then the agentic part: the discharge letter mentions a cardiologist. No records, not in the mandate. So it asks Anna first, and only then calls.” |
| 0:57 | 07 Stack | “And we built it the same way: with agents, and Entire records every step, checkpoint by checkpoint.” |
| 1:03 | Closing shot | “Stafette. Switch doctors, your medical history follows.” |

Code: `src/tech/` (`ui.tsx` building blocks, `scenes.tsx` title, mandate, policy, call, photo, stack, `records.tsx` document path,
`closing.tsx` gap and closing shot,
`TechStack.tsx` timeline). Partners appear as type tiles, without logo files.

## Voiceover with Gradium

Script: `voiceover/script.json` (one line per scene, key = scene label in `TechStack.tsx`).
The brand is spelled "Staffette" there so the voice pronounces it correctly.

```powershell
cd video
npm run voiceover                                   # all lines with the voice from script.json (Kelly)
uv run --project ../backend python scripts/voiceover.py --voice <uid>          # different voice
uv run --project ../backend python scripts/voiceover.py --samples <uid> <uid>  # compare voice samples
npm run render:tech-voice
```

- Needs `GRADIUM_API_KEY` in `backend/.env` and the backend's Python environment (`uv sync` in `backend/`).
- Writes `public/voice/<scene>.wav` and `src/tech/voiceover.json` (durations). Both are checked in, so rendering
  works without a key too.
- Gradium delivers WAV in streaming format without a length in the header; the script fills in the real durations.
- Each line starts 10 frames after the scene begins. If it's longer than the scene, the scene is extended.
  Shorter text makes a shorter video.
- Voices to choose from (English, calm): Kelly `Lxc7YlPC8ckLJA8H` (default), Declan `I7GYfpcKbafFrYUv`,
  Christopher `fs2Qj_X2Z2WvWJSU`.
