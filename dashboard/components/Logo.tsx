/** Stafette mark: two bars overlapping at the moment of handover. */
export function Logo({ size = 22, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <rect id="sa1" x="4" y="26" width="38" height="14" rx="7" transform="rotate(-35 23 33)" />
          <rect id="sa2" x="22" y="24" width="38" height="14" rx="7" transform="rotate(-35 41 31)" />
          <clipPath id="sac">
            <use href="#sa1" />
          </clipPath>
        </defs>
        <use href="#sa1" fill="var(--petrol)" />
        <use href="#sa2" fill="var(--coral)" />
        <use href="#sa2" fill="var(--ink)" clipPath="url(#sac)" />
      </svg>
      {withText && <span>stafette</span>}
    </span>
  );
}
