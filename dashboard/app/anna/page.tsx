"use client";
import { AnnaApp } from "@/components/AnnaApp";
import { useStafette } from "@/lib/useStafette";

export default function AnnaPage() {
  const { state, decide, reset, start } = useStafette();
  return (
    <main className="stage">
      <AnnaApp state={state} onDecide={decide} onReset={reset} onStart={start} />
    </main>
  );
}
