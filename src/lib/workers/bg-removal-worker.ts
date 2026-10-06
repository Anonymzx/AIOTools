/// <reference lib="webworker" />

export {};

interface RemoveIn {
  type: "remove";
  blob: Blob;
}

type WorkerOut =
  | { type: "done"; blob: Blob }
  | { type: "progress"; key: string; current: number; total: number }
  | { type: "error"; message: string };

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<RemoveIn>) => void) | null;
  postMessage: (msg: WorkerOut) => void;
};

scope.onmessage = async (e: MessageEvent<RemoveIn>) => {
  try {
    const data = e.data;
    if (!data || data.type !== "remove" || !data.blob) {
      scope.postMessage({ type: "error", message: "No image received by worker." });
      return;
    }
    // Dynamic import keeps the ~40MB model runtime out of the main bundle.
    const mod = (await import("@imgly/background-removal")) as unknown as {
      default?: (image: Blob, config?: Record<string, unknown>) => Promise<Blob>;
      removeBackground?: (image: Blob, config?: Record<string, unknown>) => Promise<Blob>;
    };
    const removeBackground = mod.default ?? mod.removeBackground;
    if (typeof removeBackground !== "function") {
      scope.postMessage({ type: "error", message: "Background removal engine failed to load." });
      return;
    }
    const out: Blob = await removeBackground(data.blob, {
      device: "cpu",
      output: { format: "image/png", quality: 1 },
      progress: (key: string, current: number, total: number) => {
        try {
          scope.postMessage({ type: "progress", key, current, total });
        } catch {
          // ignore progress post errors
        }
      },
    });
    scope.postMessage({ type: "done", blob: out });
  } catch (err) {
    try {
      const message =
        err instanceof Error ? err.message : "Background removal failed inside worker.";
      scope.postMessage({ type: "error", message });
    } catch {
      // last resort: nothing to do
    }
  }
};
