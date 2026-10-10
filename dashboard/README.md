# Stafette Dashboard

Next.js 15 · React 19 · TypeScript · Manrope lokal gebündelt (läuft auch offline).
Animationen mit [Magic UI](https://magicui.design) (Tailwind v4 ohne Preflight + `motion`).

## Starten

```powershell
cd dashboard
npm install
npm run dev
```

- `http://localhost:3000/` – Demo-Bühne: Annas App und Dr. Kellers Übergabe nebeneinander
- `/anna` – nur Annas App
- `/keller` – nur Dr. Kellers Übergabe

Ohne Backend läuft alles auf Demo-Daten (`lib/mock.ts`), unten rechts steht „Demo-Daten“.

## Mit Backend verbinden

`.env.local` anlegen:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Das Backend muss liefern:

| Endpoint | Was |
|---|---|
| `GET /state` | aktueller `StafetteState` als JSON |
| `GET /events` | Server-Sent Events, jede Nachricht `data: {"state": StafetteState}` |
| `POST /approvals/{id}` | Body `{"approve": true\|false}` – Annas Antwort |
| `POST /reset` | Demo zurücksetzen |

Die Typen stehen in `lib/types.ts`. Das Backend sendet bei jeder Änderung den **ganzen** State, das Frontend rechnet nichts selbst. Policy-Entscheide (`ALLOWED`, `BLOCKED`, `APPROVAL`) kommen fertig aus der Policy Engine.

## Aufbau

```
app/
  page.tsx          Demo-Bühne (beide Ansichten, ein State)
  anna/page.tsx     Patientin
  keller/page.tsx   Ärztin
  globals.css       Design-Tokens und alle Styles
components/
  AnnaApp.tsx       Start → Verstanden → Vollmacht → Fortschritt
  KellerSheet.tsx   Übergabe mit Fundstellen und Zitaten
  Logo.tsx, Icons.tsx
  MotionProvider.tsx  respektiert „Bewegung reduzieren“ des Systems
  Splash.tsx        Ladeanimation beim Öffnen/Reload (reines CSS, Styles in globals.css)
  ui/               Magic-UI-Komponenten (BlurFade, NumberTicker, BorderBeam, …)
lib/
  types.ts          gemeinsame Typen mit dem Backend
  mock.ts           Demo-Daten (passen zu /fixtures)
  useStafette.ts    State-Hook: Mock oder Live via SSE
```

## Magic UI

Komponenten liegen als eigener Code in `components/ui/` und werden mit der shadcn-CLI geholt:

```powershell
npx shadcn@latest add "https://magicui.design/r/<name>.json"
```

Tailwind ist nur für diese Komponenten da: `globals.css` importiert Theme und Utilities, aber **keinen Preflight**,
damit die handgeschriebenen Styles unverändert gelten. Farben in den Komponenten an die Design-Tokens anpassen,
nicht die Tailwind-Defaults (`text-black` usw.) stehen lassen. Die CLI schreibt Keyframes manchmal kaputt
in `globals.css` (z. B. `boxShadow` statt `box-shadow`), nach dem Hinzufügen kurz prüfen.
