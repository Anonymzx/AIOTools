/// <reference lib="webworker" />

export {};

interface ConvertIn {
  type: "convert";
  blob: Blob;
  toType: string;
  quality: number;
}

type WorkerOut =
  | { type: "done"; blob: Blob }
  | { type: "stage"; stage: string }
  | { type: "error"; message: string };

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<ConvertIn>) => void) | null;
  postMessage: (msg: WorkerOut) => void;
};

function clampQuality(q: number): number {
  try {
    if (!Number.isFinite(q)) return 0.92;
    return Math.min(1, Math.max(0.1, q));
  } catch {
    return 0.92;
  }
}

scope.onmessage = async (e: MessageEvent<ConvertIn>) => {
  try {
    const data = e.data;
    if (!data || data.type !== "convert" || !data.blob) {
      scope.postMessage({ type: "error", message: "No image received by worker." });
      return;
    }
    // heic2any reports no progress, so emit an indeterminate stage instead.
    try {
      scope.postMessage({ type: "stage", stage: "Converting..." });
    } catch {
      // ignore stage post errors
    }
    // Dynamic import keeps heic2any out of the main bundle.
    const mod = (await import("heic2any")) as unknown as {
      default?: (opts: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
    };
    const convert = mod.default;
    if (typeof convert !== "function") {
      scope.postMessage({ type: "error", message: "HEIC engine failed to load." });
      return;
    }
    const toType = data.toType === "image/png" ? "image/png" : "image/jpeg";
    const out = await convert({
      blob: data.blob,
      toType,
      quality: toType === "image/png" ? undefined : clampQuality(data.quality),
    });
    const blob = Array.isArray(out) ? out[0] : out;
    if (!blob) {
      scope.postMessage({ type: "error", message: "Conversion produced no output." });
      return;
    }
    scope.postMessage({ type: "done", blob });
  } catch (err) {
    try {
      const message =
        err instanceof Error ? err.message : "HEIC conversion failed inside worker.";
      scope.postMessage({ type: "error", message });
    } catch {
      // last resort: nothing to do
    }
  }
};
