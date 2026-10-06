import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Magnetic pull toward the cursor (default strength 0.3, spring 150/15).
 * Attaches mousemove/leave on the referenced element itself; springs reset to 0.
 * Skips entirely on coarse pointers or prefers-reduced-motion (harmless mobile no-op).
 *
 * Usage:
 *   const mag = useMagnetic<HTMLSpanElement>(0.3);
 *   <motion.span ref={mag.ref} style={{ x: mag.x, y: mag.y }}>…</motion.span>
 */
export function useMagnetic<T extends HTMLElement = HTMLDivElement>(strength = 0.3) {
  const ref = useRef<T>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 150, damping: 15 });
  const y = useSpring(rawY, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      rawX.set((e.clientX - (r.left + r.width / 2)) * strength);
      rawY.set((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [rawX, rawY, strength]);

  return { ref, x, y };
}
