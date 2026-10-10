import { Composition } from "remotion";
import { LogoIntro } from "./LogoIntro";

const claim = {
  setup: "Switch doctors.",
  promise: "Your medical history follows.",
  subline: "An AI agent that collects your records, only with your permission.",
};
const intro = { component: LogoIntro, durationInFrames: 150, fps: 30, width: 1920, height: 1080 } as const;

export const RemotionRoot = () => (
  <>
    <Composition id="LogoIntro" {...intro} defaultProps={{ dark: false, ...claim }} />
    <Composition id="LogoIntroDark" {...intro} defaultProps={{ dark: true, ...claim }} />
  </>
);
