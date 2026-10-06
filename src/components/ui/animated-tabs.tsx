"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedTabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: AnimatedTabDef[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function AnimatedTabs({ tabs, value, onChange, ariaLabel, className }: AnimatedTabsProps) {
  const reduce = useReducedMotion();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      className={cn(
        "grid gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <motion.button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
              active
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 32 }
                }
                className="absolute inset-0 rounded-lg bg-white shadow dark:bg-zinc-950"
                aria-hidden
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

interface AnimatedTabPanelProps {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedTabPanel({ tabKey, children, className }: AnimatedTabPanelProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tabKey}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
