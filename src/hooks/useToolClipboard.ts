"use client";

import { useEffect, useRef } from "react";

export const PASTE_EVENT = "aiotools:paste";
export const CLEAR_EVENT = "aiotools:clear";

/** Listens for palette "Paste from Clipboard" dispatches and fills the tool input. */
export function useToolPaste(setter: (t: string) => void): void {
  const ref = useRef(setter);
  ref.current = setter;
  useEffect(() => {
    const onPaste = (e: Event) => {
      try {
        const text = (e as CustomEvent<{ text?: string }>).detail?.text ?? "";
        ref.current(text);
      } catch {
        // never break the tool UI on palette events
      }
    };
    window.addEventListener(PASTE_EVENT, onPaste);
    return () => window.removeEventListener(PASTE_EVENT, onPaste);
  }, []);
}

/** Listens for palette "Clear All Inputs" dispatches and resets the tool input. */
export function useToolClear(reset: () => void): void {
  const ref = useRef(reset);
  ref.current = reset;
  useEffect(() => {
    const onClear = () => {
      try {
        ref.current();
      } catch {
        // never break the tool UI on palette events
      }
    };
    window.addEventListener(CLEAR_EVENT, onClear);
    return () => window.removeEventListener(CLEAR_EVENT, onClear);
  }, []);
}
