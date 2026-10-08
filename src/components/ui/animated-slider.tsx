"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AnimatedSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function AnimatedSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  disabled = false,
  id,
  className,
}: AnimatedSliderProps): React.JSX.Element {
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const display = format ? format(value) : String(value);
  const sliderId = id ?? `animated-slider-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <Badge variant="secondary" aria-live="polite" className="tabular-nums">
          {display}
        </Badge>
      </div>
      <motion.div whileTap={{ scale: 0.995 }} className="mt-1">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            try {
              onChange(Number(e.target.value));
            } catch {
              // ignore
            }
          }}
          aria-valuetext={display}
          className="w-full accent-indigo-600 active:scale-[1.01]"
        />
        <div
          aria-hidden
          className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
          />
        </div>
      </motion.div>
    </div>
  );
}

export default AnimatedSlider;
