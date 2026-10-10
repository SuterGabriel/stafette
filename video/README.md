# Stafette Video

Remotion 4 · React 19 · Manrope lokal gebündelt (`public/fonts`, rendert offline).

```powershell
cd video
npm install
npm run dev                  # Remotion Studio im Browser
npm run render:intro         # out/logo-intro.mp4
npm run render:intro-dark    # out/logo-intro-dark.mp4
npm run render:tech          # out/tech-stack.mp4
```

## Kompositionen

| ID | Was |
|---|---|
| `LogoIntro` | Logo-Animation, heller Hintergrund (Standard), 5 s, 1920×1080, 30 fps |
| `LogoIntroDark` | dasselbe auf Ink-Hintergrund |
| `TechStack` | „How it’s built“, 67 s, gleicher Look: Titel → Vollmacht → Policy → Anruf → Dokumentenweg → Foto → Lücke → Stack → Schlussbild |

Ablauf: Die zwei Stäbe gleiten entlang ihrer Achse herein und treffen sich wie bei einer Stabübergabe
(die dunkle Überlappung entsteht erst beim Berühren), kurzer Impuls mit zwei Ringen, dann klappt die
Wortmarke Buchstabe für Buchstabe auf, darunter der Claim in drei Stufen:
„Switch doctors.“ → „Your medical history follows.“ → kleine Zeile „An AI agent that collects your records,
only with your permission.“ Ab Sekunde 3 steht das Bild, gut als Opener
oder Hintergrund auf der Bühne.

Claim ändern: im Studio unter Props oder beim Rendern mit
`--props='{"dark":false,"setup":"…","promise":"…","subline":"…"}'`.
Geometrie und Farben entsprechen `brand/stafette-mark.svg`.

## TechStack

„How it’s built“, **67 s**. Jede Szene baut sich auf und steht dann ein paar Sekunden, damit man live darüber
sprechen kann. Tempo und Länge pro Szene stehen in `SCENES` (`src/tech/TechStack.tsx`): `speed` streckt die
Choreografie, `dur` bestimmt, wie lange die Szene stehen bleibt.

### Sprechskript (Englisch, ca. 2,5 Wörter pro Sekunde)

| Zeit | Szene | Was man sagt |
|---|---|---|
| 0:00 | Gemini proposes. Code decides. | “So how does it work? One rule runs through everything: Gemini proposes, code decides.” |
| 0:04 | 01 Vollmacht | “Anna says one sentence. Gemini compiles it into a mandate: who may be contacted, who receives the records, and until when. Anna signs it.” |
| 0:11 | 02 Policy Engine | “From then on, the orchestrator plans every next step, but it can only emit tool calls. Each one hits our policy engine, plain deterministic code: allowed, blocked, or ask Anna.” |
| 0:21 | 03 Anruf | “Gemini leads the phone call, Twilio carries it, and Gradium gives it a Swiss voice. When someone tries to redirect the records, the tool call is blocked. It can’t, not won’t.” |
| 0:31 | 04 Records arrive | “The records go over HIN straight to Dr. Keller’s practice, never to us. Stafette reads them on her behalf: Gemini extracts each finding, code checks every quote against its page, and instructions hidden in documents are dropped.” |
| 0:43 | 05 Reading | “Even a crooked phone photo: Gemini finds the line, and the quote points back to the exact spot.” |
| 0:49 | 06 Die Lücke | “Then the agentic part: the discharge letter mentions a cardiologist. No records, not in the mandate. So it asks Anna first, and only then calls.” |
| 0:57 | 07 Stack | “And we built it the same way: with agents, and Entire records every step, checkpoint by checkpoint.” |
| 1:03 | Schlussbild | “Stafette. Switch doctors, your medical history follows.” |

Code: `src/tech/` (`ui.tsx` Bausteine, `scenes.tsx` Titel, Vollmacht, Policy, Anruf, Foto, Stack, `records.tsx` Dokumentenweg,
`closing.tsx` Lücke und Schlussbild,
`TechStack.tsx` Timeline). Partner erscheinen als Typo-Kacheln, ohne Logo-Dateien.
