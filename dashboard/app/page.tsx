"use client";
/**
 * Demo stage: Anna's phone and Dr. Keller's handover side by side,
 * both driven by the same state so a decision on the phone updates the sheet live.
 * Single views: /anna and /keller.
 */
import { AnnaApp } from "@/components/AnnaApp";
import { KellerSheet } from "@/components/KellerSheet";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useStafette } from "@/lib/useStafette";

export default function DemoPage() {
  const { state, decide, reset, live, connected, offline } = useStafette();
  const [status, tone] = !live
    ? ["Demo-Daten", ""]
    : offline
      ? ["Backend nicht erreichbar · Demo-Daten", "status-pill--offline"]
      : connected
        ? ["Live verbunden", "status-pill--live"]
        : ["Verbinde …", ""];

  return (
    <main className="stage">
      <DotPattern width={24} height={24} className="stage-dots" />
      <div>
        <p className="stage-label">Was Anna sieht</p>
        <AnnaApp state={state} onDecide={decide} onReset={reset} />
      </div>
      <div className="stage-col--doc">
        <p className="stage-label">Was Dr. Keller bekommt</p>
        <KellerSheet state={state} />
      </div>
      <span className={`status-pill ${tone}`}>{status}</span>
    </main>
  );
}
