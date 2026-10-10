"use client";
/**
 * Demo stage: one phone at a time, switching on its own as the story moves on.
 *   Anna signs and the agent calls -> call ends -> Dr. Keller (records arrive) ->
 *   gap found -> Anna (question) -> second call ends -> Dr. Keller (review).
 * The toggle on top lets the presenter switch by hand at any time. Both phones stay
 * mounted, so Anna's screen does not jump back to the start when switching.
 * Single views: /anna and /keller.
 */
import { useEffect, useRef, useState } from "react";
import { AnnaApp } from "@/components/AnnaApp";
import { KellerSheet } from "@/components/KellerSheet";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useStafette } from "@/lib/useStafette";

type View = "anna" | "keller";

const TO_KELLER_AFTER_CALL_MS = 2000;
const TO_ANNA_AFTER_SHEET_MS = 4000;

export default function DemoPage() {
  const { state, decide, reset, start, ingest, setSimulate, live, connected, offline } = useStafette();
  const [view, setView] = useState<View>("anna");
  const [news, setNews] = useState<Record<View, boolean>>({ anna: false, keller: false });

  const callStatus = state.call?.status ?? null;
  const hasSheet = state.sections.length > 0;
  const approvalId = state.approval?.id ?? null;
  const prev = useRef({ callStatus, hasSheet, approvalId });
  const sheetShownAt = useRef(0);

  // Automatic switching on the story's turning points.
  useEffect(() => {
    const before = prev.current;
    prev.current = { callStatus, hasSheet, approvalId };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const go = (target: View, delay: number) => {
      setNews((n) => ({ ...n, [target]: true }));
      timers.push(setTimeout(() => setView(target), delay));
    };

    if (!before.hasSheet && hasSheet) sheetShownAt.current = Date.now();
    if (before.callStatus !== "ended" && callStatus === "ended") {
      go("keller", TO_KELLER_AFTER_CALL_MS);        // records are on their way to Dr. Keller
    }
    if (!before.approvalId && approvalId) {
      // Let the audience watch the sheet fill before the question pops up on Anna's phone.
      const watched = Date.now() - sheetShownAt.current;
      go("anna", Math.max(0, TO_ANNA_AFTER_SHEET_MS - watched));
    }
    return () => timers.forEach(clearTimeout);
  }, [callStatus, hasSheet, approvalId]);

  useEffect(() => setNews((n) => ({ ...n, [view]: false })), [view]);

  const restart = () => {
    setView("anna");
    setNews({ anna: false, keller: false });
    reset();
  };

  const [status, tone] = !live
    ? ["Demo data", ""]
    : offline
      ? ["Backend unreachable · demo data", "status-pill--offline"]
      : connected
        ? ["Live connected", "status-pill--live"]
        : ["Connecting …", ""];

  return (
    <main className="stage stage--single">
      <DotPattern width={24} height={24} className="stage-dots" />

      <div className="stage-col">
        <div className="view-switch" role="tablist" aria-label="View">
          {(["anna", "keller"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={`view-tab ${view === v ? "view-tab--on" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "anna" ? "Anna, patient" : "Dr. Keller, new GP"}
              {news[v] && view !== v && <span className="view-dot" aria-label="new" />}
            </button>
          ))}
        </div>

        <div hidden={view !== "anna"}>
          <AnnaApp state={state} onDecide={decide} onReset={restart} onStart={start} />
        </div>
        <div hidden={view !== "keller"}>
          <KellerSheet state={state} onIngest={ingest} />
        </div>

        {live && !offline && (
          <label className="sim-toggle">
            <input
              type="checkbox"
              checked={Boolean(state.simulateCalls)}
              onChange={(e) => setSimulate(e.target.checked)}
            />
            Test mode: simulate calls, no phone rings
          </label>
        )}
      </div>

      <span className={`status-pill ${tone}`}>{status}</span>
    </main>
  );
}
