"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// Always renders the same DOM on server and first client render.
// Reduced-motion users are covered globally by MotionConfig reducedMotion="user"
// (it neutralizes the animation) — never early-return null here, that breaks
// hydration for reduced-motion users (server renders div, client renders null).
export default function ScrollProgress(): React.JSX.Element {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 origin-left bg-indigo-500 dark:bg-indigo-400"
    />
  );
}

export { ScrollProgress };
