"use client";
/** Honors the OS "reduce motion" setting for every Magic UI / motion animation. */
import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
