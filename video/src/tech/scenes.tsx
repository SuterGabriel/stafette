/**
 * The six scenes of the tech-stack video. Order follows the pitch line:
 * "Gemini compiles the mandate, plans the next step, leads the call and reads messy scans.
 *  Gradium gives it a voice. Entire records how we built it."
 * Right-hand visual area is about 968 × 804 px.
 */
import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, Card, Chip, MONO, Mark, prog, rise, SceneLayout, useSceneFrame, Waveform } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- 0 · Title ---------- */

export const TitleScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const out = interpolate(useCurrentFrame(), [dur - 12, dur], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: out,
        filter: `blur(${(1 - out) * 8}px)`,
      }}
    >
      <div style={{ ...rise(frame, 2), marginBottom: 36 }}>
        <Mark size={88} />
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.teal,
          marginBottom: 28,
          ...rise(frame, 8),
        }}
      >
        How it’s built
      </div>
      <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.02, textAlign: "center" }}>
        <div style={{ color: C.ink, ...rise(frame, 14, { dy: 32 }) }}>Gemini proposes.</div>
        <div style={{ color: C.teal, ...rise(frame, 24, { dy: 32 }) }}>Code decides.</div>
      </div>
    </div>
  );
};

/* ---------- 1 · Goal → Mandate ---------- */

const GOAL = "“I’m switching to Dr. Keller. Make sure she has my history.”";
const MANDATE_ROWS: [string, string][] = [
  ["may contact", "Praxis Seefeld · Spital Musterstadt"],
  ["send only to", "Dr. med. Lea Keller"],
  ["records", "reports · lab · medication"],
  ["valid until", "31 Oct · then deleted"],
];

export const MandateScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const typed = Math.round(interpolate(frame, [14, 50], [0, GOAL.length], clamp));
  const line = prog(frame, 48, 18);
  const compiler = prog(frame, 56, 18);
  const line2 = prog(frame, 70, 16);
  const signed = prog(frame, 120, 14);

  return (
    <SceneLayout
      dur={dur}
      eyebrow="01 · Goal → Mandate"
      title={["One sentence.", "A signed mandate."]}
      body="Gemini compiles Anna’s spoken goal into a strict, machine-readable mandate."
      chips={
        <>
          <Chip tone="ink">Gemini 3.8 Flash</Chip>
          <Chip>Structured Output</Chip>
        </>
      }
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Card style={{ width: 860, padding: "26px 32px", display: "flex", alignItems: "center", gap: 28, ...rise(frame, 6) }}>
          <Waveform bars={14} height={52} level={frame < 52 ? 1 : 0.25} />
          <div style={{ fontSize: 28, fontWeight: 600, color: C.ink, minHeight: 72, display: "flex", alignItems: "center" }}>
            {GOAL.slice(0, typed)}
          </div>
        </Card>

        <div style={{ width: 3, height: 56 * line, background: C.line, borderRadius: 2 }} />
        <div
          style={{
            opacity: compiler,
            transform: `scale(${0.9 + 0.1 * compiler})`,
            padding: "16px 28px",
            borderRadius: 999,
            background: C.ink,
            color: C.paper,
            fontSize: 26,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: `0 0 0 ${8 * Math.abs(Math.sin(frame * 0.12)) * compiler}px rgba(15, 139, 141, 0.18)`,
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.teal }} />
          Gemini · Policy Compiler
        </div>
        <div style={{ width: 3, height: 48 * line2, background: C.line, borderRadius: 2 }} />

        <Card style={{ width: 860, padding: "28px 36px", ...rise(frame, 78) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>Mandate v1</span>
            <Chip tone="ok" style={{ opacity: signed, transform: `scale(${0.8 + 0.2 * signed})` }}>
              ✓ Signed by Anna
            </Chip>
          </div>
          {MANDATE_ROWS.map(([k, v], i) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderTop: `1px solid ${C.line}`,
                fontSize: 24,
                ...rise(frame, 86 + i * 7, { dy: 12, blur: 3 }),
              }}
            >
              <span style={{ color: C.muted, fontWeight: 500 }}>{k}</span>
              <span style={{ color: C.ink, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginTop: 10, opacity: signed }}>
            sha256 9f2c 41ab e07d · v1
          </div>
        </Card>
      </div>
    </SceneLayout>
  );
};

/* ---------- 2 · Policy Engine ---------- */

type Call = { label: string; lane: number; verdict: string; tone: "ok" | "no" | "ask"; start: number };
const CALLS: Call[] = [
  { label: "place_call(praxis_seefeld)", lane: 0, verdict: "✓ Allowed", tone: "ok", start: 30 },
  { label: "set_recipient(private_mail)", lane: 1, verdict: "✕ Blocked", tone: "no", start: 70 },
  { label: "add_source(dr_brunner)", lane: 2, verdict: "? Ask Anna", tone: "ask", start: 110 },
];
const LANE_Y = [96, 330, 564];
const GATE_X = 330;
const LANE_X = 560;

export const PolicyScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const gateFlash = CALLS.map((c) => {
    const t = interpolate(frame, [c.start + 16, c.start + 22, c.start + 40], [0, 1, 0], clamp);
    return { t, tone: c.tone };
  }).find((g) => g.t > 0);
  const flashColor = gateFlash ? { ok: C.teal, no: C.noText, ask: C.askText }[gateFlash.tone] : C.line;

  return (
    <SceneLayout
      dur={dur}
      eyebrow="02 · Next step"
      title={["Gemini plans.", "Code decides."]}
      body="The orchestrator only emits tool calls. A deterministic policy engine checks every single one against the mandate."
      chips={
        <>
          <Chip tone="ink">Gemini 3.6 Flash</Chip>
          <Chip>Python · Pydantic</Chip>
        </>
      }
    >
      {/* Orchestrator → gate */}
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 370,
          width: (GATE_X - 250) * prog(frame, 16, 14),
          height: 3,
          background: C.line,
        }}
      />

      {/* Orchestrator */}
      <Card style={{ position: "absolute", left: 0, top: 300, width: 250, padding: "22px 24px", ...rise(frame, 8) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: C.teal,
              opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.15)),
            }}
          />
          <span style={{ fontSize: 26, fontWeight: 800, color: C.ink }}>Orchestrator</span>
        </div>
        <div style={{ fontSize: 20, color: C.muted, fontWeight: 600 }}>Gemini · tool calls only</div>
      </Card>

      {/* Gate */}
      <Card
        style={{
          position: "absolute",
          left: GATE_X,
          top: 40,
          width: 160,
          height: 700,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          zIndex: 2,
          border: `2px solid ${flashColor}`,
          boxShadow: gateFlash
            ? `0 0 0 ${10 * gateFlash.t}px ${flashColor}22, 0 24px 60px rgba(14,42,59,0.08)`
            : "0 24px 60px rgba(14,42,59,0.08)",
          ...rise(frame, 14),
        }}
      >
        <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.8}>
          <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
          <path d="M9 12l2 2 4-4" stroke={C.teal} />
        </svg>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, textAlign: "center", lineHeight: 1.15 }}>
          Policy
          <br />
          Engine
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.muted, textAlign: "center" }}>deterministic</div>
      </Card>

      {/* Lanes */}
      {CALLS.map((c, i) => {
        const filled = prog(frame, c.start + 34, 12);
        const tone = { ok: [C.okBg, C.okText], no: [C.noBg, C.noText], ask: [C.askBg, C.askText] }[c.tone];
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: LANE_X,
              top: LANE_Y[c.lane],
              width: 408,
              height: 120,
              borderRadius: 24,
              border: `2px dashed ${filled > 0.5 ? "transparent" : C.line}`,
              background: filled > 0 ? tone[0] : "transparent",
              opacity: Math.max(0.6 * prog(frame, 18 + i * 4), filled),
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: 16,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: tone[1], opacity: filled }}>{c.verdict}</span>
          </div>
        );
      })}

      {/* Tool calls travelling through the gate */}
      {CALLS.map((c) => {
        const a = prog(frame, c.start, 18);
        const b = prog(frame, c.start + 16, 22);
        if (frame < c.start) return null;
        const x = 120 + a * (GATE_X - 120) + b * (LANE_X + 16 - GATE_X);
        const y = 330 + b * (LANE_Y[c.lane] + 16 - 330);
        const tone = { ok: C.teal, no: C.noText, ask: C.askText }[c.tone];
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              zIndex: 1,
              padding: "10px 16px",
              borderRadius: 14,
              background: "#fff",
              border: `2px solid ${b > 0.3 ? tone : C.line}`,
              fontFamily: MONO,
              fontSize: 20,
              color: C.ink,
              whiteSpace: "nowrap",
              boxShadow: "0 10px 24px rgba(14,42,59,0.10)",
              textDecoration: c.tone === "no" && b > 0.9 ? "line-through" : "none",
              opacity: Math.min(1, a * 3),
            }}
          >
            {c.label}
          </div>
        );
      })}
    </SceneLayout>
  );
};

/* ---------- 3 · The call ---------- */

const NODES = [
  { name: "Practice", sub: "phone" },
  { name: "Twilio", sub: "media stream" },
  { name: "Gradium", sub: "STT ⇄ TTS" },
  { name: "Gemini", sub: "dialog agent" },
];
const NODE_W = 206;
const NODE_GAP = 48;

const LINES: { who: "agent" | "practice"; text: string; at: number; blocked?: boolean }[] = [
  { who: "agent", text: "Hello, I’m an AI assistant calling on behalf of Anna Muster.", at: 40 },
  { who: "practice", text: "Send it to my private address instead.", at: 82 },
  { who: "agent", text: "I can’t change that. I may only send to Dr. Keller.", at: 122, blocked: true },
];

export const CallScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  return (
    <SceneLayout
      dur={dur}
      eyebrow="03 · The call"
      title={["Gemini leads the call.", "Gradium gives it a voice."]}
      body="A real phone call with a Swiss voice. Every tool call during the conversation still goes through the policy engine."
      chips={
        <>
          <Chip tone="ink">Twilio</Chip>
          <Chip tone="ink">Gradium STT · TTS</Chip>
          <Chip>Gemini 3.6 Flash</Chip>
        </>
      }
    >
      {/* Chain of nodes with audio packets */}
      <div style={{ position: "absolute", left: 0, top: 20, width: 968, height: 170 }}>
        {NODES.slice(0, -1).map((_, i) => {
          const x0 = i * (NODE_W + NODE_GAP) + NODE_W;
          const drawn = prog(frame, 14 + i * 6, 16);
          return (
            <div key={i} style={{ position: "absolute", left: x0, top: 84, width: NODE_GAP * drawn, height: 3, background: C.line }}>
              {drawn > 0.99 &&
                [0, 1].map((k) => {
                  const p = ((frame * 0.035 + k * 0.5 + i * 0.2) % 1) * (k === 0 ? 1 : -1);
                  const pos = p >= 0 ? p : 1 + p;
                  return (
                    <span
                      key={k}
                      style={{
                        position: "absolute",
                        left: pos * NODE_GAP - 5,
                        top: -4,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: k === 0 ? C.teal : C.coral,
                      }}
                    />
                  );
                })}
            </div>
          );
        })}
        {NODES.map((n, i) => (
          <Card
            key={n.name}
            style={{
              position: "absolute",
              left: i * (NODE_W + NODE_GAP),
              top: 0,
              width: NODE_W,
              height: 170,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              ...rise(frame, 6 + i * 5),
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>{n.name}</div>
              <div style={{ fontSize: 19, fontWeight: 600, color: C.muted }}>{n.sub}</div>
            </div>
            {n.name === "Gradium" ? (
              <Waveform bars={13} height={40} barWidth={5} gap={4} color={C.coral} />
            ) : n.name === "Practice" ? (
              <span style={{ fontSize: 34 }}>☎</span>
            ) : (
              <span style={{ width: 12, height: 12, borderRadius: 6, background: C.teal }} />
            )}
          </Card>
        ))}
      </div>

      {/* Transcript */}
      <Card style={{ position: "absolute", left: 0, top: 236, width: 968, height: 520, padding: "28px 32px", ...rise(frame, 24) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted }}>
            Live transcript
          </span>
          <Chip tone="no" style={{ ...rise(frame, 104), fontFamily: MONO, fontSize: 18 }}>
            ✕ BLOCKED · recipient_not_in_mandate
          </Chip>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {LINES.map((l) => (
            <div
              key={l.at}
              style={{
                alignSelf: l.who === "agent" ? "flex-start" : "flex-end",
                maxWidth: 720,
                padding: "18px 24px",
                borderRadius: 22,
                fontSize: 27,
                fontWeight: 600,
                lineHeight: 1.35,
                background: l.who === "agent" ? C.soft : C.ink,
                color: l.who === "agent" ? C.ink : C.paper,
                border: l.blocked ? `2px solid ${C.teal}` : "2px solid transparent",
                ...rise(frame, l.at, { dy: 16 }),
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.08em", opacity: 0.6, marginBottom: 4 }}>
                {l.who === "agent" ? "STAFETTE AGENT" : "CALLER"}
              </div>
              {l.text}
            </div>
          ))}
        </div>
      </Card>
    </SceneLayout>
  );
};

/* ---------- 4 · Documents ---------- */

const PHOTO_LINES = [0.9, 0.7, 0.82, 0.55, 0.88, 0.76, 0.62, 0.84, 0.5, 0.79, 0.68];
const HIT = 5;

export const ScanScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const beam = interpolate(frame, [10, 52], [-10, 110], clamp);
  const box = prog(frame, 48, 18);
  const link = prog(frame, 64, 20);
  const verified = prog(frame, 96, 14);

  return (
    <SceneLayout
      dur={dur}
      eyebrow="05 · Reading"
      title={["Messy scans in.", "Every line keeps its source."]}
      body="Gemini reads PDFs and crooked phone photos. Each finding carries the verbatim quote and where it was found."
      chips={
        <>
          <Chip tone="ink">Gemini 3.8 Flash · multimodal</Chip>
          <Chip>Quote verifier</Chip>
        </>
      }
    >
      {/* Crooked phone photo */}
      <div style={{ position: "absolute", left: 30, top: 70, ...rise(frame, 4) }}>
      <div
        style={{
          width: 430,
          height: 580,
          transform: "rotate(-6deg)",
          borderRadius: 18,
          background: "#FFFDF7",
          boxShadow: "0 30px 70px rgba(14,42,59,0.16)",
          padding: "44px 40px",
          overflow: "hidden",
        }}
      >
        <div style={{ width: 160, height: 18, borderRadius: 4, background: "#CFC8BA", marginBottom: 12 }} />
        <div style={{ width: 240, height: 12, borderRadius: 4, background: "#E2DCCF", marginBottom: 36 }} />
        {PHOTO_LINES.map((w, i) => (
          <div key={i} style={{ position: "relative", height: 34, display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: `${w * 100}%`,
                height: 11,
                borderRadius: 4,
                background: i === HIT ? "#9C9483" : "#DDD6C8",
              }}
            />
            {i === HIT && (
              <svg style={{ position: "absolute", left: -10, top: 0, overflow: "visible" }} width={380} height={34}>
                <rect
                  x={0}
                  y={2}
                  width={w * 350 + 20}
                  height={30}
                  rx={8}
                  fill={`rgba(255,122,89,${0.12 * box})`}
                  stroke={C.coral}
                  strokeWidth={3}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - box}
                />
              </svg>
            )}
          </div>
        ))}
        {/* Scan beam */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${beam}%`,
            height: 70,
            background: `linear-gradient(180deg, transparent, rgba(15,139,141,0.22), transparent)`,
            borderBottom: `2px solid rgba(15,139,141,0.6)`,
            opacity: frame > 54 ? 0 : 1,
          }}
        />
      </div>
      </div>

      {/* Connector from the quote to the doctor's sheet */}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={968} height={804}>
        <path
          d="M 352 368 C 450 368, 460 330, 545 330"
          fill="none"
          stroke={C.coral}
          strokeWidth={3}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - link}
        />
        <circle cx={545} cy={330} r={7 * link} fill={C.coral} />
      </svg>

      {/* Dr. Keller's sheet */}
      <Card style={{ position: "absolute", left: 556, top: 150, width: 412, padding: "28px 30px", ...rise(frame, 20) }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>
          Handover · Dr. Keller
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.ink, margin: "6px 0 18px" }}>Anna Muster</div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, ...rise(frame, 78, { dy: 12 }) }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>ALLERGIES</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, marginTop: 4 }}>Penicillin</div>
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: C.soft,
              borderLeft: `3px solid ${C.teal}`,
              fontSize: 20,
              fontWeight: 600,
              color: C.ink,
            }}
          >
            “Penicillin allergy, generalised rash 2011”
            <div style={{ fontSize: 16, color: C.muted, marginTop: 4 }}>Referral (phone photo) · p. 1</div>
          </div>
        </div>
        <Chip tone="ok" style={{ marginTop: 18, opacity: verified, transform: `scale(${0.85 + 0.15 * verified})` }}>
          ✓ Quote verified against page
        </Chip>
      </Card>
    </SceneLayout>
  );
};

/* ---------- 5 · Stack ---------- */

const PARTNERS: { name: string; role: string; color: string }[] = [
  { name: "Google Gemini", role: "compiles · plans · talks · reads", color: C.teal },
  { name: "Gradium", role: "Swiss voice, speech in and out", color: C.coral },
  { name: "Twilio", role: "the phone line", color: C.ink },
  { name: "Entire", role: "every build step auditable", color: C.teal },
];
const SOFTWARE = ["FastAPI · Python", "Policy Engine · Pydantic", "Next.js 15", "Magic UI", "Remotion", "ngrok", "Vercel", "Claude Code"];
const CHECKPOINT = "Entire-Checkpoint: 01M4JXVP294VXEAPC5HVZDFXM3";

const Tile = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <Card style={{ padding: "24px 26px", borderRadius: 24, ...style }}>{children}</Card>
);

export const StackScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const typed = Math.round(interpolate(frame, [70, 110], [0, CHECKPOINT.length], clamp));
  const pushed = prog(frame, 112, 12);
  return (
    <SceneLayout
      dur={dur}
      eyebrow="07 · The stack"
      title={["Built with agents.", "Every step auditable."]}
      body="Entire records how we built it, checkpoint by checkpoint, pushed with every commit."
      chips={<Chip tone="ink">Entire</Chip>}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {PARTNERS.map((p, i) => (
            <Tile key={p.name} style={{ display: "flex", gap: 18, alignItems: "stretch", ...rise(frame, 6 + i * 5) }}>
              <span style={{ width: 6, borderRadius: 3, background: p.color, flex: "none" }} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{p.name}</div>
                <div style={{ fontSize: 21, fontWeight: 600, color: C.muted, marginTop: 4 }}>{p.role}</div>
              </div>
            </Tile>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
          {SOFTWARE.map((s, i) => (
            <Chip key={s} style={{ background: "#fff", border: `1px solid ${C.line}`, ...rise(frame, 30 + i * 3, { dy: 10 }) }}>
              {s}
            </Chip>
          ))}
        </div>
        <Card
          style={{
            marginTop: 10,
            padding: "22px 26px",
            background: C.ink,
            border: "none",
            fontFamily: MONO,
            fontSize: 22,
            color: "#E9EEF0",
            ...rise(frame, 62),
          }}
        >
          <div style={{ color: "#8FA3AE" }}>$ git commit -m "Policy engine: block foreign recipients"</div>
          <div style={{ marginTop: 8, minHeight: 30 }}>
            {CHECKPOINT.slice(0, typed)}
            <span style={{ opacity: typed < CHECKPOINT.length && frame % 16 < 8 ? 1 : 0 }}>▌</span>
          </div>
          <div style={{ marginTop: 8, color: "#7FD3C9", opacity: pushed }}>✓ checkpoint pushed to origin</div>
        </Card>
      </div>
    </SceneLayout>
  );
};
