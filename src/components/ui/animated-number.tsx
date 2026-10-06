"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

function defaultFormat(n: number): string {
  try {
    return String(Math.round(n));
  } catch {
    return "0";
  }
}

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps): React.JSX.Element {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });
  // Hydration-safe: server + first client render both show format(0).
  const fmt = format ?? defaultFormat;
  const target = Number.isFinite(value) ? value : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    let raf = 0;
    try {
      if (reduce) {
        el.textContent = fmt(target);
        return;
      }
      const from = 0;
      const start = performance.now();
      const dur = 700;
      const tick = (now: number) => {
        try {
          const t = Math.min(1, (now - start) / dur);
          // easeOutCubic — transform/opacity-free text update, cheap.
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(from + (target - from) * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        } catch {
          // ignore
        }
      };
      el.textContent = fmt(from);
      raf = requestAnimationFrame(tick);
    } catch {
      try {
        if (el) el.textContent = fmt(target);
      } catch {
        // ignore
      }
    }
    return () => {
      try {
        cancelAnimationFrame(raf);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, reduce]);

  return (
    <span ref={ref} className={className}>
      {fmt(0)}
    </span>
  );
}

export default AnimatedNumber;
