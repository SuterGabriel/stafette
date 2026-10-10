# Stafette Video

Remotion 4 · React 19 · Manrope lokal gebündelt (`public/fonts`, rendert offline).

```powershell
cd video
npm install
npm run dev                  # Remotion Studio im Browser
npm run render:intro         # out/logo-intro.mp4
npm run render:intro-dark    # out/logo-intro-dark.mp4
```

## Kompositionen

| ID | Was |
|---|---|
| `LogoIntro` | Logo-Animation, heller Hintergrund (Standard), 5 s, 1920×1080, 30 fps |
| `LogoIntroDark` | dasselbe auf Ink-Hintergrund |

Ablauf: Die zwei Stäbe gleiten entlang ihrer Achse herein und treffen sich wie bei einer Stabübergabe
(die dunkle Überlappung entsteht erst beim Berühren), kurzer Impuls mit zwei Ringen, dann klappt die
Wortmarke Buchstabe für Buchstabe auf, darunter der Claim in drei Stufen:
„Switch doctors.“ → „Your medical history follows.“ → kleine Zeile „An AI agent that collects your records,
only with your permission.“ Ab Sekunde 3 steht das Bild, gut als Opener
oder Hintergrund auf der Bühne.

Claim ändern: im Studio unter Props oder beim Rendern mit
`--props='{"dark":false,"setup":"…","promise":"…","subline":"…"}'`.
Geometrie und Farben entsprechen `brand/stafette-mark.svg`.
