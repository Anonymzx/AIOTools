"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <span className="group relative block w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-indigo-600 transition-transform duration-200 group-focus-within:scale-x-100 dark:bg-indigo-400"
        />
      </span>
    );
  },
);
Input.displayName = "Input";

export { Input };
