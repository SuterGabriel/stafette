"use client";
/**
 * Load animation on first open and every reload (the root layout persists across client
 * navigation, so it does not replay between pages). Same choreography as the Remotion
 * logo intro (video/src/LogoIntro.tsx), condensed to about two seconds: the bars slide in
 * along their axis and meet like a baton handover, the overlap only appears where they
 * touch, then the wordmark unfolds and the page fades in.
 *
 * Pure CSS (globals.css, "Load animation"), so it starts with the first paint instead of
 * waiting for hydration. React only removes the overlay once its fade-out has finished.
 */
import { useState } from "react";

export function Splash() {
  const [done, setDone] = useState(false);
  if (done) return null;

  return (
    <div
      className="splash"
      aria-hidden="true"
      onAnimationEnd={(e) => e.target === e.currentTarget && setDone(true)}
    >
      <div className="splash-lockup">
        <svg className="splash-mark" viewBox="0 0 64 64">
          <defs>
            {/* clipPath only accepts shapes, so this rect carries rotation and slide in CSS */}
            <clipPath id="splash-clip">
              <rect className="splash-clip-teal" x={4} y={26} width={38} height={14} rx={7} />
            </clipPath>
          </defs>
          <circle className="splash-ring splash-ring--a" cx={32} cy={32} r={10} />
          <circle className="splash-ring splash-ring--b" cx={32} cy={32} r={10} />
          <g className="splash-teal">
            <rect x={4} y={26} width={38} height={14} rx={7} transform="rotate(-35 23 33)" fill="#0F8B8D" />
          </g>
          <g className="splash-coral">
            <rect x={22} y={24} width={38} height={14} rx={7} transform="rotate(-35 41 31)" fill="#FF7A59" />
          </g>
          {/* Overlap: the coral bar clipped to the teal one, so it only appears where they touch */}
          <g clipPath="url(#splash-clip)">
            <g className="splash-coral">
              <rect x={22} y={24} width={38} height={14} rx={7} transform="rotate(-35 41 31)" fill="var(--ink)" />
            </g>
          </g>
        </svg>
        <div className="splash-word">
          <span>
            {"stafette".split("").map((ch, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
