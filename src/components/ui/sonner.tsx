"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function Toaster({ ...props }: ToasterProps): React.JSX.Element {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      richColors
      closeButton
      gap={8}
      visibleToasts={5}
      swipeDirections={["right", "bottom"]}
      icons={{
        success: <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />,
        error: <XCircle className="h-4 w-4 text-red-500" aria-hidden />,
        loading: <Loader2 className="h-4 w-4 animate-spin" aria-hidden />,
      }}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
