"use client";

import { create } from "zustand";

export type BatchStatus = "pending" | "processing" | "done" | "error";

export interface BatchItem {
  id: string;
  name: string;
  size: number;
  status: BatchStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
}

interface BatchQueueState {
  items: BatchItem[];
  addFiles: (files: File[]) => void;
  setStatus: (id: string, status: BatchStatus, error?: string) => void;
  setProgress: (id: string, progress: number) => void;
  setResult: (id: string, resultUrl: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

let counter = 0;

function makeId(): string {
  try {
    counter += 1;
    return `batch-${Date.now().toString(36)}-${counter}`;
  } catch {
    counter += 1;
    return `batch-fallback-${counter}`;
  }
}

export const useBatchQueue = create<BatchQueueState>()((set) => ({
  items: [],
  addFiles: (files: File[]) => {
    try {
      const added: BatchItem[] = files.map((f) => ({
        id: makeId(),
        name: f.name ?? "file",
        size: f.size ?? 0,
        status: "pending",
        progress: 0,
      }));
      set((s) => ({ items: [...s.items, ...added] }));
    } catch {
      // queue must never break the calling tool UI
    }
  },
  setStatus: (id: string, status: BatchStatus, error?: string) => {
    try {
      set((s) => ({
        items: s.items.map((i) =>
          i.id === id ? { ...i, status, error: status === "error" ? (error ?? i.error) : undefined } : i,
        ),
      }));
    } catch {
      // ignore state errors
    }
  },
  setProgress: (id: string, progress: number) => {
    try {
      const clamped = Math.min(1, Math.max(0, progress));
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, progress: clamped } : i)) }));
    } catch {
      // ignore state errors
    }
  },
  setResult: (id: string, resultUrl: string) => {
    try {
      set((s) => ({
        items: s.items.map((i) =>
          i.id === id ? { ...i, status: "done" as BatchStatus, progress: 1, resultUrl } : i,
        ),
      }));
    } catch {
      // ignore state errors
    }
  },
  remove: (id: string) => {
    try {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    } catch {
      // ignore state errors
    }
  },
  clear: () => {
    try {
      set({ items: [] });
    } catch {
      // ignore state errors
    }
  },
}));
