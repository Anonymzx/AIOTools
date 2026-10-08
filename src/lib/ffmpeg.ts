"use client";

// Shared single-thread ffmpeg.wasm loader (ST core — no SharedArrayBuffer,
// no COOP/COEP headers needed). Dynamic import happens ONLY after a user
// gesture (process click), never at module top-level.

export class FFmpegCompatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FFmpegCompatError";
  }
}

// Installed core version (matches @ffmpeg/ffmpeg 0.12.15 const CORE_VERSION).
export const FFMPEG_CORE_VERSION = "0.12.9";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;

let ffmpegRef: FFmpegInstance | null = null;
let loaded = false;
let loadingPromise: Promise<FFmpegInstance> | null = null;

export function isWasmSupported(): boolean {
  try {
    if (typeof window === "undefined") return true; // SSR: render compat UI optimistically
    return (
      typeof WebAssembly === "object" &&
      typeof Blob === "function" &&
      typeof Worker === "function" &&
      typeof URL !== "undefined"
    );
  } catch {
    return false;
  }
}

export function isFFmpegLoaded(): boolean {
  return loaded && ffmpegRef !== null;
}

export function getFFmpeg(): FFmpegInstance | null {
  return ffmpegRef;
}

export async function loadFFmpeg(
  onEventProgress?: (p: number) => void,
): Promise<FFmpegInstance> {
  if (ffmpegRef && loaded) return ffmpegRef;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      if (!isWasmSupported()) {
        throw new FFmpegCompatError(
          "WebAssembly is not available in this browser. Please use the latest Chrome or Edge on desktop.",
        );
      }
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const inst = new FFmpeg();
      if (onEventProgress) {
        try {
          inst.on("progress", ({ progress }: { progress: number }) => {
            try {
              const p = Math.round(Math.min(1, Math.max(0, progress)) * 100);
              onEventProgress(p);
            } catch {
              // ignore
            }
          });
        } catch {
          // ignore listener errors
        }
      }
      const coreURL = await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.js`,
        "text/javascript",
      );
      const wasmURL = await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm",
      );
      const workerURL = await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.worker.js`,
        "text/javascript",
      );
      await inst.load({
        coreURL,
        wasmURL,
        workerURL,
      } as unknown as Parameters<FFmpegInstance["load"]>[0]);
      ffmpegRef = inst;
      loaded = true;
      return inst;
    } catch (e) {
      loadingPromise = null;
      if (e instanceof FFmpegCompatError) throw e;
      throw new Error(
        e instanceof Error ? e.message : "Failed to load video engine.",
      );
    }
  })();

  try {
    return await loadingPromise;
  } catch (e) {
    loadingPromise = null;
    throw e;
  }
}

export async function writeInput(
  ffmpeg: FFmpegInstance,
  name: string,
  file: File | Blob,
): Promise<void> {
  try {
    const { fetchFile } = await import("@ffmpeg/util");
    const data = await fetchFile(file);
    await ffmpeg.writeFile(name, data);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to write input file.",
    );
  }
}

export async function readOutput(
  ffmpeg: FFmpegInstance,
  name: string,
): Promise<Uint8Array> {
  try {
    const data = await ffmpeg.readFile(name);
    if (data instanceof Uint8Array) return data;
    if (typeof data === "string") return new TextEncoder().encode(data);
    return new Uint8Array(data as ArrayBuffer);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to read output file.",
    );
  }
}

export async function deleteFFmpegFile(
  ffmpeg: FFmpegInstance,
  name: string,
): Promise<void> {
  try {
    await ffmpeg.deleteFile(name);
  } catch {
    // ignore missing-file errors
  }
}

export function terminateFFmpeg(): void {
  try {
    loadingPromise = null;
    loaded = false;
    if (ffmpegRef) {
      try {
        ffmpegRef.terminate();
      } catch {
        // ignore
      }
      ffmpegRef = null;
    }
  } catch {
    // ignore
  }
}

export function toBlob(data: Uint8Array, mime: string): Blob {
  try {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    return new Blob([copy.buffer as ArrayBuffer], { type: mime });
  } catch {
    return new Blob([], { type: mime });
  }
}

export function formatBytes(bytes: number): string {
  try {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  } catch {
    return "—";
  }
}

export function formatTime(sec: number): string {
  try {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  } catch {
    return "0:00";
  }
}
