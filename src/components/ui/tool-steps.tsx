"use client";

import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cog, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolStepsProps {
  /** 0 = not started (all dim), 1 = uploaded, 2 = processing, 3 = done. */
  stage: 0 | 1 | 2 | 3;
  /** Locale strings passed from the page — this component stays presentational. */
  labels?: [string, string, string];
  className?: string;
}

const ICONS = [Upload, Cog, Download];

/**
 * 3-stage progress stepper: icon nodes + connector lines that fill via
 * scaleX by stage, spring pop on activate, icon→check morph on complete.
 * Transform/opacity only (60fps), compact horizontal row.
 */
export function ToolSteps({ stage, labels, className }: ToolStepsProps) {
  const dur = (v: number) => v;

  return (
    <ol
      className={cn("flex items-center", className)}
      aria-label="Progress"
      aria-valuenow={stage}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      {[0, 1, 2].map((i) => {
        const Icon = ICONS[i] ?? Upload;
        const active = stage === i + 1;
        const done = stage > i + 1;
        const on = active || done;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <span
                className="mx-1 min-w-4 flex-1 rounded-full bg-zinc-200 sm:mx-2 dark:bg-zinc-800"
                style={{ height: 2 }}
                aria-hidden
              >
                <motion.span
                  className="block h-full w-full origin-left rounded-full bg-indigo-600 dark:bg-indigo-500"
                  initial={false}
                  animate={{ scaleX: stage > i ? 1 : 0 }}
                  transition={{ duration: dur(0.4), ease: "easeOut" }}
                />
              </span>
            )}
            <li className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
              <motion.span
                key={`${i}-${on}`}
                initial={{ scale: on ? 0.6 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border",
                  done &&
                    "border-transparent bg-indigo-600 text-white dark:bg-indigo-500",
                  active &&
                    "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400",
                  !on && "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500",
                )}
                aria-current={active ? "step" : undefined}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={done ? "check" : "icon"}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: dur(0.15) }}
                    className="flex items-center justify-center"
                  >
                    {done ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
              {labels?.[i] && (
                <span
                  className={cn(
                    "text-[11px] leading-tight font-medium",
                    on
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500",
                  )}
                >
                  {labels[i]}
                </span>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export default ToolSteps;
