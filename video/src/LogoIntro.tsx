/**
 * Logo entry: the two bars of the mark slide in along their axis and meet like a
 * relay baton handover; the overlap turns dark only where they touch. Then the
 * wordmark unfolds letter by letter and the claim rises in, line by line.
 *
 * Geometry mirrors brand/stafette-mark.svg (viewBox 0 0 64 64, bars rotated -35 deg).
 */
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "./brand";
import { FONT_FAMILY, fontsReady } from "./fonts";

export type LogoIntroProps = { dark: boolean; setup: string; promise: string; subline: string };

const MARK_SIZE = 200;
const GAP = 36; // mark to wordmark, from the logo lockup (text at x=76 next to a 64-unit mark)
const WORD = "stafette";

// Unit vector along the bars: rotate(-35) in the y-down SVG space points up and to the right
const ANGLE = (35 * Math.PI) / 180;
const AXIS = { x: Math.cos(ANGLE), y: -Math.sin(ANGLE) };
const SLIDE = 70; // start distance in viewBox units, well outside the mark

const barTransform = (cx: number, cy: number, d: number) =>
  `translate(${AXIS.x * d} ${AXIS.y * d}) rotate(-35 ${cx} ${cy})`;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LogoIntro = ({ dark, setup, promise, subline }: LogoIntroProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipId = `bar-${useId().replace(/:/g, "")}`;

  // The wordmark is measured once the font is loaded, so the lockup recenters exactly.
  const wordRef = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender("measure wordmark"));
  const [wordWidth, setWordWidth] = useState(0);
  useEffect(() => {
    fontsReady.then(() => setWordWidth(wordRef.current?.offsetWidth ?? 0));
  }, []);
  useEffect(() => {
    if (wordWidth > 0) continueRender(handle);
  }, [wordWidth, handle]);

  const smooth = { damping: 200 };
  const teal = spring({ frame: frame - 4, fps, config: smooth, durationInFrames: 24 });
  const coral = spring({ frame: frame - 9, fps, config: smooth, durationInFrames: 24 });
  const tealShift = -SLIDE * (1 - teal);
  const coralShift = SLIDE * (1 - coral);

  // Handover beat: a short bump and two rings when the bars meet (around frame 28)
  const bump = interpolate(frame, [24, 30, 40], [1, 1.06, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ring = (start: number) => {
    const t = interpolate(frame, [start, start + 26], [0, 1], clamp);
    return { r: 10 + Easing.out(Easing.cubic)(t) * 46, opacity: t > 0 ? (1 - t) * 0.45 : 0, width: 1.6 * (1 - t) };
  };
  const ringA = ring(27);
  const ringB = ring(32);

  const reveal = spring({ frame: frame - 38, fps, config: smooth, durationInFrames: 30 });
  const letter = (i: number) => {
    const t = interpolate(frame, [44 + i * 2.5, 56 + i * 2.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return { opacity: t, transform: `translateY(${(1 - t) * 22}px)`, filter: `blur(${(1 - t) * 8}px)` };
  };

  const rise = (start: number) => {
    const t = interpolate(frame, [start, start + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return { opacity: t, transform: `translateY(${(1 - t) * 16}px)` };
  };

  const fg = dark ? BRAND.paper : BRAND.ink;
  const muted = dark ? BRAND.mutedOnInk : BRAND.muted;
  const bar = { width: 38, height: 14, rx: 7 };

  return (
    <AbsoluteFill
      style={{
        background: dark
          ? `radial-gradient(ellipse at 50% 45%, #15384d 0%, ${BRAND.ink} 70%)`
          : `radial-gradient(ellipse at 50% 45%, #ffffff 0%, ${BRAND.paper} 70%)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg
            width={MARK_SIZE}
            height={MARK_SIZE}
            viewBox="0 0 64 64"
            style={{ overflow: "visible", transform: `scale(${bump})` }}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={4} y={26} {...bar} transform={barTransform(23, 33, tealShift)} />
              </clipPath>
            </defs>
            <circle cx={32} cy={32} r={ringA.r} fill="none" stroke={BRAND.teal} strokeWidth={ringA.width} opacity={ringA.opacity} />
            <circle cx={32} cy={32} r={ringB.r} fill="none" stroke={BRAND.coral} strokeWidth={ringB.width} opacity={ringB.opacity} />
            <rect x={4} y={26} {...bar} fill={BRAND.teal} opacity={Math.min(1, teal * 2)} transform={barTransform(23, 33, tealShift)} />
            <rect x={22} y={24} {...bar} fill={BRAND.coral} opacity={Math.min(1, coral * 2)} transform={barTransform(41, 31, coralShift)} />
            {/* Overlap: the coral bar clipped to the teal one, so it only appears where they touch.
                The clip sits on an untransformed group; on the rect it would inherit the rect's transform. */}
            <g clipPath={`url(#${clipId})`}>
              <rect x={22} y={24} {...bar} fill={fg} transform={barTransform(41, 31, coralShift)} />
            </g>
          </svg>

          <div style={{ width: wordWidth * reveal, marginLeft: GAP * reveal, display: "flex" }}>
            <span
              ref={wordRef}
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                fontSize: 120,
                fontWeight: 700,
                letterSpacing: "-0.032em",
                lineHeight: 1,
                color: fg,
                transform: "translateY(-4px)",
              }}
            >
              {WORD.split("").map((ch, i) => (
                <span key={i} style={{ display: "inline-block", ...letter(i) }}>
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 64,
            display: "flex",
            gap: "0.3em",
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: muted, ...rise(70) }}>{setup}</span>
          <span style={{ color: fg, ...rise(80) }}>{promise}</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 30, fontWeight: 500, color: muted, ...rise(96) }}>{subline}</div>
      </div>
    </AbsoluteFill>
  );
};
