"use client";
/**
 * Demo stage: Anna's phone and Dr. Keller's phone side by side, both driven by the same
 * state. Live, the demo runs in order from the web app: Anna signs -> the agent calls the
 * practice -> records arrive at Dr. Keller -> the gap becomes a question to Anna -> her yes
 * extends the mandate and starts the next call. Single views: /anna and /keller.
 */
import { AnnaApp } from "@/components/AnnaApp";
import { KellerSheet } from "@/components/KellerSheet";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useStafette } from "@/lib/useStafette";

export default function DemoPage() {
  const { state, decide, reset, start, ingest, live, connected, offline } = useStafette();
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
        <AnnaApp state={state} onDecide={decide} onReset={reset} onStart={start} />
      </div>
      <div>
        <p className="stage-label">Was Dr. Keller sieht</p>
        <KellerSheet state={state} onIngest={ingest} />
      </div>
      <span className={`status-pill ${tone}`}>{status}</span>
    </main>
  );
}
