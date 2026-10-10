"use client";
/**
 * Demo stage: Anna's phone and Dr. Keller's handover side by side,
 * both driven by the same state so a decision on the phone updates the sheet live.
 * Single views: /anna and /keller.
 */
import { AnnaApp } from "@/components/AnnaApp";
import { KellerSheet } from "@/components/KellerSheet";
import { useStafette } from "@/lib/useStafette";

export default function DemoPage() {
  const { state, decide, reset, live, connected } = useStafette();

  return (
    <main className="stage">
      <div>
        <p className="stage-label">Was Anna sieht</p>
        <AnnaApp state={state} onDecide={decide} onReset={reset} />
      </div>
      <div className="stage-col--doc">
        <p className="stage-label">Was Dr. Keller bekommt</p>
        <KellerSheet state={state} />
      </div>
      <span className={`status-pill ${live && connected ? "status-pill--live" : ""}`}>
        {live ? (connected ? "Live verbunden" : "Verbinde …") : "Demo-Daten"}
      </span>
    </main>
  );
}
