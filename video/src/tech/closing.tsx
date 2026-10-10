/** The last two scenes: the agentic moment (the gap) and the outro card. */
import { interpolate, useCurrentFrame } from "remotion";
import { C, Card, Chip, Mark, prog, rise, SceneLayout, useSceneFrame } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- 5 · The gap ---------- */

const STATIONS = [
  { name: "Spital Musterstadt", detail: "4 documents received", state: "done" },
  { name: "Praxis Seefeld", detail: "records requested", state: "active" },
];

const Dot = ({ state }: { state: string }) => (
  <span
    style={{
      width: 26,
      height: 26,
      borderRadius: 13,
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 15,
      fontWeight: 800,
      color: "#fff",
      boxSizing: "border-box",
      background: state === "done" ? C.teal : "#fff",
      border: state === "active" ? `7px solid ${C.teal}` : state === "waiting" ? `2px dashed ${C.coral}` : "none",
    }}
  >
    {state === "done" ? "✓" : ""}
  </span>
);

const Line = ({ w }: { w: number }) => (
  <div style={{ width: `${w * 100}%`, height: 11, borderRadius: 4, background: "#E6E1D6", marginBottom: 16 }} />
);

export const GapScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const mark = prog(frame, 30, 20);
  const link = prog(frame, 58, 20);
  const station = prog(frame, 80, 24);
  const ask = prog(frame, 118, 20);
  const press = interpolate(frame, [160, 165, 172], [1, 0.94, 1], clamp);
  const approved = prog(frame, 176, 16);

  return (
    <SceneLayout
      dur={dur}
      eyebrow="06 · The gap"
      title={["It found the gap", "on its own."]}
      body="The discharge letter mentions a cardiologist with no records. She is not in the mandate, so the agent asks Anna before it calls."
      chips={
        <>
          <Chip tone="ink">Gap detector</Chip>
          <Chip>Gemini 3.6 Flash · orchestrator</Chip>
        </>
      }
    >
      {/* Discharge letter */}
      <Card style={{ position: "absolute", left: 0, top: 60, width: 440, padding: "30px 32px", ...rise(frame, 4) }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>SPITAL MUSTERSTADT</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: "4px 0 22px" }}>Discharge letter</div>
        {[0.92, 0.78, 0.86, 0.6].map((w, i) => (
          <Line key={i} w={w} />
        ))}
        <div style={{ fontSize: 23, fontWeight: 600, color: C.ink, lineHeight: 1.45, margin: "6px 0 18px" }}>
          Follow-up: referred to{" "}
          <span style={{ position: "relative", fontWeight: 800 }}>
            Dr. med. S. Brunner, cardiology
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -2,
                height: 4,
                borderRadius: 2,
                width: `${mark * 100}%`,
                background: C.coral,
              }}
            />
          </span>
          .
        </div>
        {[0.7, 0.84].map((w, i) => (
          <Line key={i} w={w} />
        ))}
        <Chip tone="no" style={{ marginTop: 6, ...rise(frame, 46, { dy: 10 }) }}>
          mentioned · no records
        </Chip>
      </Card>

      {/* Letter → Anna's app */}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={968} height={804}>
        <path
          d="M 440 330 C 470 330, 470 318, 500 318"
          fill="none"
          stroke={C.coral}
          strokeWidth={3}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - link}
        />
      </svg>

      {/* Anna's progress, as in her app */}
      <Card style={{ position: "absolute", left: 500, top: 20, width: 468, padding: "28px 30px", ...rise(frame, 12) }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>ANNA’S APP</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: "4px 0 20px" }}>Records for Dr. Keller</div>
        {STATIONS.map((s) => (
          <div key={s.name} style={{ display: "flex", gap: 14, paddingBottom: 18 }}>
            <Dot state={s.state} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{s.name}</div>
              <div style={{ fontSize: 19, fontWeight: 500, color: C.muted }}>{s.detail}</div>
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            gap: 14,
            overflow: "hidden",
            maxHeight: 130 * station,
            opacity: station,
            transform: `translateX(${(1 - station) * 24}px)`,
          }}
        >
          <Dot state={approved > 0.5 ? "active" : "waiting"} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>Dr. Sabine Brunner, cardiology</div>
            <div style={{ fontSize: 19, fontWeight: 500, color: C.muted }}>
              {approved > 0.5 ? "requested · mandate v2" : "waiting for your OK"}
            </div>
            <Chip tone="ask" style={{ marginTop: 10, fontSize: 18, padding: "6px 14px" }}>
              NEW · found by the agent
            </Chip>
          </div>
        </div>
      </Card>

      {/* The question to Anna, then her answer */}
      <div style={{ position: "absolute", left: 500, top: 480, width: 468 }}>
        <div
          style={{
            background: C.ink,
            color: C.paper,
            borderRadius: 24,
            padding: "24px 26px",
            opacity: ask * (1 - approved),
            transform: `translateY(${(1 - ask) * 20}px)`,
            boxShadow: "0 24px 60px rgba(14,42,59,0.18)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>Ask Dr. Brunner too?</div>
          <div style={{ fontSize: 19, color: "#B8C6CE", margin: "6px 0 18px" }}>
            She is mentioned in your discharge letter. I need your OK first.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span
              style={{
                flex: 1,
                textAlign: "center",
                padding: "13px 0",
                borderRadius: 14,
                background: C.teal,
                fontSize: 21,
                fontWeight: 800,
                transform: `scale(${press})`,
                boxShadow: frame > 160 ? `0 0 0 ${6 * (1 - prog(frame, 162, 14))}px rgba(15,139,141,0.35)` : "none",
              }}
            >
              Yes, ask
            </span>
            <span
              style={{
                flex: 1,
                textAlign: "center",
                padding: "13px 0",
                borderRadius: 14,
                border: "1.5px solid #5C6E7A",
                fontSize: 21,
                fontWeight: 800,
              }}
            >
              No
            </span>
          </div>
        </div>
        <Chip
          tone="ok"
          style={{
            position: "absolute",
            left: 0,
            top: 20,
            opacity: approved,
            transform: `scale(${0.85 + 0.15 * approved})`,
            fontSize: 24,
            padding: "14px 22px",
          }}
        >
          ✓ Anna said yes · mandate v2
        </Chip>
      </div>
    </SceneLayout>
  );
};

/* ---------- Outro ---------- */

export const OutroScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const out = interpolate(useCurrentFrame(), [dur - 8, dur], [1, 0], clamp);
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 30, ...rise(frame, 4, { dy: 20 }) }}>
        <Mark size={150} />
        <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.032em", color: C.ink }}>stafette</span>
      </div>
      <div style={{ display: "flex", gap: "0.3em", fontSize: 52, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 56 }}>
        <span style={{ color: C.muted, ...rise(frame, 16) }}>Switch doctors.</span>
        <span style={{ color: C.ink, ...rise(frame, 24) }}>Your medical history follows.</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: C.muted, marginTop: 40, ...rise(frame, 40) }}>
        Built with Gemini · Gradium · Twilio · Entire
      </div>
    </div>
  );
};
