"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  text: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
  showToast?: boolean;
  copiedMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  size = "default",
  variant = "outline",
  className,
  disabled = false,
  showToast = true,
  copiedMessage = "Copied to clipboard.",
  emptyMessage = "Nothing to copy yet.",
  errorMessage = "Failed to copy.",
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function handleClick(): Promise<void> {
    try {
      if (text === "") {
        if (showToast) toast.info(emptyMessage);
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (showToast) toast.success(copiedMessage);
    } catch {
      if (showToast) toast.error(errorMessage);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void handleClick()}
      disabled={disabled}
      className={cn("flex-1", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "check" : "copy"}
          initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-flex"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </motion.span>
      </AnimatePresence>
      {label}
    </Button>
  );
}

export default CopyButton;
