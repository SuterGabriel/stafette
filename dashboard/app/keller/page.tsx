"use client";
import { KellerSheet } from "@/components/KellerSheet";
import { useStafette } from "@/lib/useStafette";

export default function KellerPage() {
  const { state } = useStafette();
  return (
    <main className="stage">
      <div className="stage-col--doc">
        <KellerSheet state={state} />
      </div>
    </main>
  );
}
