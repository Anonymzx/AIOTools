"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimatedButtonVariant = "primary" | "accent" | "outline";
type AnimatedButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<AnimatedButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500",
  accent:
    "bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400",
  outline:
    "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
};

const sizeClasses: Record<AnimatedButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 py-2",
  lg: "h-10 px-6 text-base",
};

const baseClasses =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-50";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface AnimatedButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
  > {
  variant?: AnimatedButtonVariant;
  size?: AnimatedButtonSize;
  loading?: boolean;
  success?: boolean;
}

let rippleId = 0;

export function AnimatedButton({
  variant = "primary",
  size = "md",
  loading = false,
  success = false,
  disabled,
  className,
  children,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduce && !isDisabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const sizePx = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - sizePx / 2;
      const y = e.clientY - rect.top - sizePx / 2;
      const id = ++rippleId;
      setRipples((prev) => [...prev, { id, x, y, size: sizePx }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 550);
    }
    onClick?.(e);
  };

  return (
    <motion.button
      type="button"
      whileHover={reduce || isDisabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduce || isDisabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {!reduce &&
        ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-current opacity-30"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-hidden
          />
        ))}
      {loading && (
        <motion.span
          className="flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          aria-hidden
        >
          <Loader2 className="h-4 w-4 animate-none" aria-hidden />
        </motion.span>
      )}
      {!loading && success && (
        <motion.span
          className="flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          aria-hidden
        >
          <Check className="h-4 w-4" aria-hidden />
        </motion.span>
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export interface IconButtonProps
  extends Omit<AnimatedButtonProps, "size" | "loading" | "success"> {
  label: string;
}

export function IconButton({
  label,
  variant = "outline",
  className,
  children,
  ...props
}: IconButtonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      whileHover={reduce || props.disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduce || props.disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      aria-label={label}
      title={label}
      className={cn(baseClasses, variantClasses[variant], "h-9 w-9", className)}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center">{children}</span>
    </motion.button>
  );
}
