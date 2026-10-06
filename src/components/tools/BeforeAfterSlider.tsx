"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronsLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    try {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPos(Math.min(95, Math.max(5, pct)));
    } catch {
      // ignore pointer math errors
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        draggingRef.current = true;
        setDragging(true);
        setInteracted(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      } catch {
        // ignore pointer errors
      }
    },
    [updateFromClientX],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        if (!draggingRef.current) return;
        updateFromClientX(e.clientX);
      } catch {
        // ignore pointer errors
      }
    },
    [updateFromClientX],
  );

  const endDrag = useCallback(() => {
    try {
      draggingRef.current = false;
      setDragging(false);
    } catch {
      // ignore
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    try {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setInteracted(true);
        setPos((p) => Math.max(5, p - 4));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setInteracted(true);
        setPos((p) => Math.min(95, p + 4));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={`${beforeLabel} / ${afterLabel} comparison`}
      aria-valuenow={Math.round(pos)}
      aria-valuemin={5}
      aria-valuemax={95}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative w-full touch-none overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
        "dark:border-zinc-800 dark:bg-zinc-900",
      )}
    >
      {/* After (base layer, full width) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={afterLabel}
        draggable={false}
        className="block aspect-[4/3] h-auto max-h-[70vh] w-full object-contain"
      />

      {/* Before (clipped overlay, inline width %) */}
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt={beforeLabel}
          draggable={false}
          className="h-full max-w-none object-cover"
          style={{ width: `${pos > 0 ? 10000 / pos : 100}%` }}
        />
      </div>

      {/* Divider line */}
      <div
        aria-hidden
        style={{ left: `${pos}%` }}
        className={cn(
          "absolute inset-y-0 w-0.5 bg-white transition-shadow duration-200",
          dragging
            ? "shadow-[0_0_16px_2px_rgba(99,102,241,0.9)]"
            : "shadow-[0_0_8px_rgba(0,0,0,0.5)]",
        )}
      />

      {/* Handle */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ left: `${pos}%`, scale: dragging ? 1.15 : 1 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 250, damping: 28 }
        }
        style={{ x: "-50%", y: "-50%" }}
        className="absolute top-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-zinc-900/10"
      >
        <ChevronsLeftRight className="h-5 w-5" />
      </motion.div>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: interacted || reduceMotion ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <Badge className="absolute top-3 left-3 bg-zinc-950/70 text-white hover:bg-zinc-950/70 dark:bg-zinc-950/70">
          {beforeLabel}
        </Badge>
        <Badge className="absolute top-3 right-3 bg-indigo-600/90 text-white hover:bg-indigo-600/90">
          {afterLabel}
        </Badge>
      </motion.div>
    </div>
  );
}

export type { BeforeAfterSliderProps };
