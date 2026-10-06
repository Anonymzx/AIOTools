"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  const reduce = useReducedMotion();
  // Omit React drag/animation handlers — framer-motion defines its own signatures.
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...motionSafe } = props;
  void onDrag;
  void onDragStart;
  void onDragEnd;
  void onAnimationStart;
  return (
    <motion.div
      className={cn(badgeVariants({ variant }), className)}
      whileHover={reduce ? {} : { scale: 1.06 }}
      whileTap={reduce ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      {...motionSafe}
    />
  );
}

export { Badge, badgeVariants };
