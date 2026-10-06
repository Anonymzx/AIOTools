"use client";

import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees per axis. Defaults to 6. */
  max?: number;
};

/**
 * 3D tilt wrapper: rotateX/Y (max 6°) from cursor, perspective 1000,
 * preserve-3d, spring-smoothed. Transform-only (60fps).
 * Disabled on touch (coarse pointer) or prefers-reduced-motion —
 * renders a plain div so mobile is unaffected.
 */
export function TiltCard({ children, className, max = 6 }: TiltCardProps) {
  const [enabled, setEnabled] = useState(false);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 18 });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!coarse && !reduced);
  }, []);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 2 * max);
    rx.set(-py * 2 * max);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: 1000 }} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("h-full", className)}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export default TiltCard;
