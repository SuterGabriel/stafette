/**
 * "How it's built": about 68 s motion graphic for the pitch, same look as the white logo intro.
 * Every scene first builds up, then holds for a few seconds so the speaker can talk over it
 * (speaker notes in video/README.md). `speed` stretches a scene's choreography, `dur` adds the hold.
 * Scenes overlap by OVERLAP frames so each one crossfades into the next.
 */
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FONT_FAMILY } from "../fonts";
import { GapScene, OutroScene } from "./closing";
import { RecordsScene } from "./records";
import { CallScene, MandateScene, PolicyScene, ScanScene, StackScene, TitleScene } from "./scenes";
import { C, Mark, prog, SpeedContext } from "./ui";

const OVERLAP = 12;
const SCENES = [
  { label: "Intro", dur: 130, speed: 1.3, Comp: TitleScene },
  { label: "Mandate", dur: 235, speed: 1.4, Comp: MandateScene },
  { label: "Policy", dur: 300, speed: 1.6, Comp: PolicyScene },
  { label: "Call", dur: 300, speed: 1.6, Comp: CallScene },
  { label: "Records", dur: 380, speed: 1, Comp: RecordsScene },
  { label: "Reading", dur: 205, speed: 1.4, Comp: ScanScene },
  { label: "Gap", dur: 240, speed: 1, Comp: GapScene },
  { label: "Stack", dur: 205, speed: 1.3, Comp: StackScene },
  { label: "Outro", dur: 120, speed: 1, Comp: OutroScene },
];
const STEPS = SCENES.slice(1, -1); // what the progress bar counts

const starts = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].dur - OVERLAP], []);
export const TECH_STACK_FRAMES = starts[starts.length - 1] + SCENES[SCENES.length - 1].dur;

const Header = () => {
  const frame = useCurrentFrame();
  const show = prog(frame, starts[1], 20) * (1 - prog(frame, starts[starts.length - 1] - 6, 14));
  const current = starts.reduce((idx, s, i) => (frame >= s + OVERLAP / 2 ? i : idx), 0);
  const step = Math.min(Math.max(1, current), STEPS.length);
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top: 72,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: show,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Mark size={40} />
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", color: C.ink }}>stafette</span>
        <span style={{ width: 1, height: 28, background: C.line, margin: "0 8px" }} />
        <span style={{ fontSize: 24, fontWeight: 600, color: C.muted }}>How it’s built</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.muted }}>{STEPS[step - 1].label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((s, i) => (
            <span key={s.label} style={{ width: 40, height: 6, borderRadius: 3, background: i < step ? C.ink : C.line }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const TechStack = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, #ffffff 0%, ${C.paper} 70%)`,
      fontFamily: FONT_FAMILY,
    }}
  >
    {SCENES.map(({ label, dur, speed, Comp }, i) => (
      <Sequence key={label} from={starts[i]} durationInFrames={dur} name={label}>
        <SpeedContext.Provider value={speed}>
          <Comp dur={dur} />
        </SpeedContext.Provider>
      </Sequence>
    ))}
    <Header />
  </AbsoluteFill>
);
