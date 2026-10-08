"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-950/50",
        className,
      )}
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
        aria-hidden
      >
        {icon}
      </motion.span>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        {title}
      </motion.p>
      {hint && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.12 }}
          className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
        >
          {hint}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.18 }}
          className="mt-1"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
