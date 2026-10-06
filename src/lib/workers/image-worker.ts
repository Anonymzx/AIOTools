/// <reference lib="webworker" />

import imageCompression from "browser-image-compression";

export {};

interface CompressRequest {
  file: File;
  quality: number; // 0-1
  maxSizeMB: number;
  maxWidthOrHeight?: number;
}

type WorkerOut =
  | { type: "progress"; value: number }
  | { type: "done"; blob: Blob }
  | { type: "error"; message: string };

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<CompressRequest>) => void) | null;
  postMessage: (msg: WorkerOut) => void;
};

function clampQuality(q: number): number {
  try {
    if (Number.isNaN(q)) return 0.8;
    return Math.min(1, Math.max(0.01, q));
  } catch {
    return 0.8;
  }
}

scope.onmessage = async (e: MessageEvent<CompressRequest>) => {
  try {
    const { file, quality, maxSizeMB, maxWidthOrHeight } = e.data;
    if (!file) {
      scope.postMessage({ type: "error", message: "No file received by worker." });
      return;
    }
    const q = clampQuality(quality);
    const sizeCap = maxSizeMB > 0 ? maxSizeMB : 2;

    const result = await imageCompression(file, {
      maxSizeMB: sizeCap,
      maxWidthOrHeight: maxWidthOrHeight && maxWidthOrHeight > 0 ? maxWidthOrHeight : 1920,
      initialQuality: q,
      useWebWorker: true,
      onProgress: (p: number) => {
        try {
          scope.postMessage({ type: "progress", value: Math.min(99, Math.max(0, Math.round(p))) });
        } catch {
          // ignore progress post errors
        }
      },
    });

    scope.postMessage({ type: "done", blob: result });
  } catch (err) {
    try {
      const message = err instanceof Error ? err.message : "Image compression failed in worker.";
      scope.postMessage({ type: "error", message });
    } catch {
      // last resort: nothing to do
    }
  }
};
