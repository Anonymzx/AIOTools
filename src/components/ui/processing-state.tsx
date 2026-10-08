"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProcessingBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export function ProcessingBar({ progress, label, className }: ProcessingBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Processing"}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label ? <span className="min-w-0 truncate">{label}</span> : <span />}
        <span className="shrink-0 tabular-nums">{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full overflow-hidden rounded-full"
        >
          <motion.div
            initial={false}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 100%" }}
            className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
          />
        </motion.div>
      </div>
    </div>
  );
}

interface ProcessingDotsProps {
  label?: string;
  className?: string;
}

export function ProcessingDots({ label, className }: ProcessingDotsProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label={label ?? "Processing"}
    >
      {[0, 1, 2].map((d) => (
        <motion.span
          key={d}
          initial={false}
          animate={{ y: [0, -6, 0], opacity: [1, 0.6, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: d * 0.15 }}
          className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400"
        />
      ))}
      {label ? (
        <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      ) : null}
    </div>
  );
}

interface ShimmerProps {
  className?: string;
  rounded?: string;
}

export function Shimmer({ className, rounded = "rounded-xl" }: ShimmerProps) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      style={{ backgroundSize: "200% 100%" }}
      className={cn(
        "bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200",
        "dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800",
        rounded,
        className,
      )}
    />
  );
}
