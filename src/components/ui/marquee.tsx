"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  /** Seconds per full loop. Defaults to 30. */
  speed?: number;
  className?: string;
}

const CHIP_CLS =
  "whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";

/**
 * Infinite tool-name marquee: duplicated row (×2) translating x [0%, -50%]
 * linear repeat. Pause settles to -50% (visually identical to 0% since
 * halves match, so resume has no jump). Edge gradient masks fade the ends.
 * Reduced motion → static wrapped row. Transform-only (60fps).
 */
export function Marquee({ items, speed = 30, className }: MarqueeProps) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  if (reduce) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)} role="list">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} role="listitem" className={CHIP_CLS}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center">
          <span className={CHIP_CLS}>{item}</span>
          <span className="mx-3 text-indigo-400 dark:text-indigo-500" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex w-max will-change-transform"
        initial={{ x: "0%" }}
        animate={paused ? { x: "-50%" } : { x: ["0%", "-50%"] }}
        transition={
          paused
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: speed, ease: "linear", repeat: Infinity }
        }
      >
        {row(false)}
        {row(true)}
      </motion.div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950"
        aria-hidden
      />
    </div>
  );
}

export default Marquee;
