"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Honors prefers-reduced-motion everywhere Motion is used. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
