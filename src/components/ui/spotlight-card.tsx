"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

const BORDER_MASK: Record<string, string | number> = {
  padding: 1,
  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/**
 * Cursor-tracking spotlight wrapper: radial fill glow + border-only glow
 * follow the cursor via motion values (useMotionTemplate), spring-smoothed.
 * Transform/opacity-adjacent (background-image via motion template, no layout).
 * Plain div fallback on touch or prefers-reduced-motion.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const [enabled, setEnabled] = useState(false);
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const sx = useSpring(mx, { stiffness: 250, damping: 25 });
  const sy = useSpring(my, { stiffness: 250, damping: 25 });
  const glow = useMotionTemplate`radial-gradient(220px circle at ${sx}px ${sy}px, rgba(99, 102, 241, 0.14), transparent 70%)`;
  const borderGlow = useMotionTemplate`radial-gradient(160px circle at ${sx}px ${sy}px, rgba(99, 102, 241, 0.55), transparent 70%)`;

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!coarse && !reduced);
  }, []);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const onLeave = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(r.width / 2);
    my.set(r.height / 2);
  };

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative", className)}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: glow }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: borderGlow, ...BORDER_MASK }}
        aria-hidden
      />
    </div>
  );
}

export default SpotlightCard;
