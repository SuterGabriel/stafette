# Stafette Dashboard

Next.js 15 · React 19 · TypeScript · Manrope bundled locally (works offline too).
Animations with [Magic UI](https://magicui.design) (Tailwind v4 without Preflight + `motion`).

## Run

```powershell
cd dashboard
npm install
npm run dev
```

- `http://localhost:3000/`: demo stage, Anna's app and Dr. Keller's handover side by side
- `/anna`: only Anna's app
- `/keller`: only Dr. Keller's handover

Without a backend everything runs on demo data (`lib/mock.ts`), the bottom right shows "Demo data".

## Connect to the backend

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The backend has to provide:

| Endpoint | What |
|---|---|
| `GET /state` | current `StafetteState` as JSON |
| `GET /events` | Server-sent events, each message `data: {"state": StafetteState}` |
| `POST /approvals/{id}` | Body `{"approve": true\|false}`, Anna's answer |
| `POST /reset` | Reset the demo |

The types are in `lib/types.ts`. On every change the backend sends the **whole** state, the frontend computes nothing itself. Policy decisions (`ALLOWED`, `BLOCKED`, `APPROVAL`) come ready-made from the policy engine.

## Structure

```
app/
  page.tsx          demo stage (both views, one state)
  anna/page.tsx     patient
  keller/page.tsx   doctor
  globals.css       design tokens and all styles
components/
  AnnaApp.tsx       start → understood → mandate → progress
  KellerSheet.tsx   handover with sources and quotes
  Logo.tsx, Icons.tsx
  MotionProvider.tsx  respects the system's "reduce motion" setting
  Splash.tsx        loading animation on open/reload (pure CSS, styles in globals.css)
  ui/               Magic UI components (BlurFade, NumberTicker, BorderBeam, …)
lib/
  types.ts          types shared with the backend
  mock.ts           demo data (matches /fixtures)
  useStafette.ts    state hook: mock or live via SSE
```

## Magic UI

Components live as our own code in `components/ui/` and are pulled in with the shadcn CLI:

```powershell
npx shadcn@latest add "https://magicui.design/r/<name>.json"
```

Tailwind is only there for these components: `globals.css` imports theme and utilities, but **no Preflight**,
so the handwritten styles apply unchanged. Adapt colors in the components to the design tokens,
don't leave the Tailwind defaults (`text-black` etc.). The CLI sometimes writes broken keyframes
into `globals.css` (e.g. `boxShadow` instead of `box-shadow`), check briefly after adding.
