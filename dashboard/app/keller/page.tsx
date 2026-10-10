"use client";
import { KellerSheet } from "@/components/KellerSheet";
import { useStafette } from "@/lib/useStafette";

export default function KellerPage() {
  const { state, ingest } = useStafette();
  return (
    <main className="stage">
      <KellerSheet state={state} onIngest={ingest} />
    </main>
  );
}
