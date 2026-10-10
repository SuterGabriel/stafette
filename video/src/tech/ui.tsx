/** Shared building blocks for the tech-stack video, same look as the white logo intro. */
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";

export const C = {
  ...BRAND,
  line: "#E4E0D8",
  soft: "#F1EFEA",
  okBg: "#DCEEED",
  okText: "#0A4F51",
  noBg: "#FBEFEA",
  noText: "#9E3A1C",
  askBg: "#FBF3E2",
  askText: "#8A5A12",
};

export const MONO = "ui-monospace, Consolas, Menlo, monospace";
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Tempo of the current scene: 1.5 plays its choreography 1.5 times slower (see TechStack SCENES). */
export const SpeedContext = createContext(1);
/** Scene time for entrances and choreography; fades still use the real frame. */
export const useSceneFrame = () => useCurrentFrame() / useContext(SpeedContext);

/** 0 → 1 between `start` and `start + len`, eased. */
export const prog = (frame: number, start: number, len = 20) =>
  interpolate(frame, [start, start + len], [0, 1], { ...clamp, easing: EASE });

/** Fade + rise + unblur, the entrance used for almost everything. */
export const rise = (frame: number, start: number, { len = 22, dy = 24, blur = 6 } = {}): CSSProperties => {
  const t = prog(frame, start, len);
  return { opacity: t, transform: `translateY(${(1 - t) * dy}px)`, filter: `blur(${(1 - t) * blur}px)` };
};

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: "#FFFFFF",
      border: `1px solid ${C.line}`,
      borderRadius: 28,
      boxShadow: "0 24px 60px rgba(14, 42, 59, 0.08), 0 2px 6px rgba(14, 42, 59, 0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

type Tone = "teal" | "ink" | "muted" | "ok" | "no" | "ask";
const TONES: Record<Tone, CSSProperties> = {
  teal: { background: C.okBg, color: C.okText },
  ink: { background: C.ink, color: C.paper },
  muted: { background: C.soft, color: C.muted },
  ok: { background: C.okBg, color: C.okText },
  no: { background: C.noBg, color: C.noText },
  ask: { background: C.askBg, color: C.askText },
};

export const Chip = ({ children, tone = "muted", style }: { children: ReactNode; tone?: Tone; style?: CSSProperties }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 18px",
      borderRadius: 999,
      fontSize: 22,
      fontWeight: 700,
      whiteSpace: "nowrap",
      ...TONES[tone],
      ...style,
    }}
  >
    {children}
  </span>
);

/** The static Stafette mark (brand/stafette-mark.svg). */
export const Mark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <clipPath id="mark-clip">
        <rect x={4} y={26} width={38} height={14} rx={7} transform="rotate(-35 23 33)" />
      </clipPath>
    </defs>
    <rect x={4} y={26} width={38} height={14} rx={7} transform="rotate(-35 23 33)" fill={C.teal} />
    <rect x={22} y={24} width={38} height={14} rx={7} transform="rotate(-35 41 31)" fill={C.coral} />
    <g clipPath="url(#mark-clip)">
      <rect x={22} y={24} width={38} height={14} rx={7} transform="rotate(-35 41 31)" fill={C.ink} />
    </g>
  </svg>
);

/** Live audio bars, deterministic per frame. */
export const Waveform = ({
  bars = 24,
  height = 56,
  color = C.teal,
  level = 1,
  barWidth = 6,
  gap = 5,
}: {
  bars?: number;
  height?: number;
  color?: string;
  level?: number;
  barWidth?: number;
  gap?: number;
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap, height }}>
      {Array.from({ length: bars }, (_, i) => {
        const wave = Math.abs(Math.sin(frame * 0.22 + i * 0.7) * Math.cos(frame * 0.09 + i * 0.31));
        const h = Math.max(barWidth, (0.15 + 0.85 * wave) * height * level);
        return <span key={i} style={{ width: barWidth, height: h, borderRadius: barWidth, background: color }} />;
      })}
    </div>
  );
};

/** Left text column + right visual, with a soft crossfade in and out of the scene. */
export const SceneLayout = ({
  dur,
  eyebrow,
  title,
  body,
  chips,
  children,
}: {
  dur: number;
  eyebrow: string;
  title: [string, string];
  body?: string;
  chips?: ReactNode;
  children: ReactNode;
}) => {
  const frame = useSceneFrame();
  const out = interpolate(useCurrentFrame(), [dur - 12, dur], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        inset: "180px 96px 96px 96px",
        display: "flex",
        gap: 60,
        opacity: out,
        filter: `blur(${(1 - out) * 8}px)`,
      }}
    >
      <div style={{ width: 700, flex: "none", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.teal,
            marginBottom: 24,
            ...rise(frame, 4),
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: C.ink }}>
          <div style={rise(frame, 8)}>{title[0]}</div>
          <div style={{ color: C.muted, ...rise(frame, 14) }}>{title[1]}</div>
        </div>
        {body && (
          <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.45, color: C.muted, marginTop: 28, ...rise(frame, 22) }}>
            {body}
          </div>
        )}
        {chips && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36, ...rise(frame, 30) }}>{chips}</div>
        )}
      </div>
      <div style={{ flex: 1, position: "relative" }}>{children}</div>
    </div>
  );
};
