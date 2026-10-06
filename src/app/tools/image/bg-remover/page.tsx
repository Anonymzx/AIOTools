"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eraser, ImagePlus, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import BeforeAfterSlider from "@/components/tools/BeforeAfterSlider";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type Status = "idle" | "working" | "done" | "fallback";
type StageKey = "starting" | "fetch:model" | "compute:inference" | "finishing";

interface BgStrings {
  description: string;
  helper: string;
  removeBtn: string;
  working: string;
  starting: string;
  loadingModel: string;
  processing: string;
  finishing: string;
  progressLabel: string;
  before: string;
  after: string;
  downloadTransparent: string;
  downloadSolid: string;
  solidLabel: string;
  again: string;
  retry: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  ok: string;
  fail: string;
  noWasm: string;
  workerFailed: string;
  fallbackTitle: string;
  fallbackTip1: string;
  fallbackTip2: string;
  fallbackTip3: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, BgStrings> = {
  en: {
    description:
      "Remove photo backgrounds with on-device AI. Preview before vs after, then download a transparent PNG or composite over a solid color.",
    helper: "Single image up to 10 MB — JPG or PNG.",
    removeBtn: "Remove background",
    working: "Removing…",
    starting: "Starting…",
    loadingModel: "Loading model…",
    processing: "Processing…",
    finishing: "Finishing…",
    progressLabel: "Background removal progress",
    before: "Before",
    after: "After",
    downloadTransparent: "Download transparent PNG",
    downloadSolid: "Download solid background",
    solidLabel: "Solid background color",
    again: "Remove another",
    retry: "Try again",
    emptyTitle: "No image yet",
    emptyDesc:
      "Upload a JPG or PNG above, then press Remove background. Everything runs locally — your photo never leaves this device.",
    noFile: "Please upload an image first.",
    ok: "Background removed successfully.",
    fail: "Background removal failed. Please try again.",
    noWasm: "This browser does not support WebAssembly, which the AI model needs to run.",
    workerFailed: "Background worker failed, retrying on main thread…",
    fallbackTitle: "Couldn't run the AI model here",
    fallbackTip1: "Try a smaller image (under 4 MB works best on phones).",
    fallbackTip2: "Use desktop Chrome or Edge with hardware acceleration on.",
    fallbackTip3: "Check your connection — the model downloads ~40 MB on first run, then it's cached.",
    faqQ1: "Is my photo uploaded to a server?",
    faqA1:
      "No. Removal runs 100% in your browser via WebAssembly (Web Worker with a main-thread fallback). Your file never leaves your device; only the ~40 MB AI model downloads once on first run and is then cached.",
    faqQ2: "Why does the first run take so long?",
    faqA2:
      "The first run downloads the AI model (~40 MB) and warms up WebAssembly, which can take a minute on slow connections. Later runs reuse the cached model and are much faster.",
    faqQ3: "What do I get as output?",
    faqA3:
      "A transparent PNG (bg-removed.png) shown against a checkerboard, plus an optional solid-color composite (bg-solid.png) using the color picker. For best results use a clear subject with good contrast against the background.",
  },
  id: {
    description:
      "Hapus latar foto dengan AI di perangkat. Pratinjau sebelum vs sesudah, lalu unduh PNG transparan atau gabungkan dengan warna solid.",
    helper: "Satu gambar hingga 10 MB — JPG atau PNG.",
    removeBtn: "Hapus background",
    working: "Menghapus…",
    starting: "Memulai…",
    loadingModel: "Memuat model…",
    processing: "Memproses…",
    finishing: "Menyelesaikan…",
    progressLabel: "Progres penghapusan background",
    before: "Sebelum",
    after: "Sesudah",
    downloadTransparent: "Unduh PNG transparan",
    downloadSolid: "Unduh background solid",
    solidLabel: "Warna background solid",
    again: "Hapus lainnya",
    retry: "Coba lagi",
    emptyTitle: "Belum ada gambar",
    emptyDesc:
      "Unggah JPG atau PNG di atas, lalu tekan Hapus background. Semua berjalan lokal — fotomu tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah gambar terlebih dahulu.",
    ok: "Background berhasil dihapus.",
    fail: "Penghapusan background gagal. Silakan coba lagi.",
    noWasm: "Browser ini tidak mendukung WebAssembly yang dibutuhkan model AI.",
    workerFailed: "Worker background gagal, mencoba ulang di thread utama…",
    fallbackTitle: "Model AI tidak bisa berjalan di sini",
    fallbackTip1: "Coba gambar yang lebih kecil (di bawah 4 MB paling baik di HP).",
    fallbackTip2: "Gunakan Chrome atau Edge desktop dengan akselerasi hardware aktif.",
    fallbackTip3:
      "Periksa koneksi — model mengunduh ~40 MB saat pertama kali, lalu tersimpan di cache.",
    faqQ1: "Apakah fotoku diunggah ke server?",
    faqA1:
      "Tidak. Penghapusan berjalan 100% di browser via WebAssembly (Web Worker dengan fallback thread utama). File tidak pernah keluar dari perangkatmu; hanya model AI ~40 MB yang diunduh sekali saat pertama lalu tersimpan di cache.",
    faqQ2: "Kenapa proses pertama lama?",
    faqA2:
      "Proses pertama mengunduh model AI (~40 MB) dan memanaskan WebAssembly, bisa memakan waktu semenit di koneksi lambat. Proses berikutnya memakai model cache dan jauh lebih cepat.",
    faqQ3: "Apa hasil yang saya dapat?",
    faqA3:
      "PNG transparan (bg-removed.png) yang ditampilkan di atas pola papan catur, plus opsi gabungan warna solid (bg-solid.png) lewat pemilih warna. Hasil terbaik untuk subjek yang jelas dengan kontras bagus terhadap latar.",
  },
};

function stageLabel(stage: StageKey, s: BgStrings): string {
  try {
    if (stage === "fetch:model") return s.loadingModel;
    if (stage === "compute:inference") return s.processing;
    if (stage === "finishing") return s.finishing;
    return s.starting;
  } catch {
    return s.starting;
  }
}

function stageFromKey(key: string): StageKey {
  try {
    if (key.startsWith("fetch")) return "fetch:model";
    if (key.startsWith("compute")) return "compute:inference";
    return "compute:inference";
  } catch {
    return "compute:inference";
  }
}

function pctFromParts(current: number, total: number, fallback: number): number {
  try {
    if (Number.isFinite(total) && total > 0 && Number.isFinite(current)) {
      return Math.min(99, Math.max(0, Math.round((current / total) * 100)));
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image-load-failed"));
      img.src = url;
    } catch (e) {
      reject(e instanceof Error ? e : new Error("image-load-failed"));
    }
  });
}

async function compositeOverColor(transparentUrl: string, color: string): Promise<Blob> {
  try {
    const img = await loadImage(transparentUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1;
    canvas.height = img.naturalHeight || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), "image/png", 1);
      } catch {
        resolve(null);
      }
    });
    if (!blob) throw new Error("composite-failed");
    return blob;
  } catch (e) {
    throw e instanceof Error ? e : new Error("composite-failed");
  }
}

async function removeOnMainThread(
  blob: Blob,
  onStage: (stage: StageKey, pct: number) => void,
): Promise<Blob> {
  try {
    const mod = (await import("@imgly/background-removal")) as unknown as {
      default?: (image: Blob, config?: Record<string, unknown>) => Promise<Blob>;
      removeBackground?: (image: Blob, config?: Record<string, unknown>) => Promise<Blob>;
    };
    const removeBackground = mod.default ?? mod.removeBackground;
    if (typeof removeBackground !== "function") throw new Error("engine-load-failed");
    return await removeBackground(blob, {
      device: "cpu",
      output: { format: "image/png", quality: 1 },
      progress: (key: string, current: number, total: number) => {
        try {
          onStage(stageFromKey(key), pctFromParts(current, total, 50));
        } catch {
          // ignore progress errors
        }
      },
    });
  } catch (e) {
    throw e instanceof Error ? e : new Error("main-thread-failed");
  }
}

export default function BgRemoverPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState<StageKey>("starting");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [solidColor, setSolidColor] = useState("#6366f1");
  const [solidUrl, setSolidUrl] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const mountedRef = useRef(true);
  const urlsRef = useRef<string[]>([]);
  const resultBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        for (const u of urlsRef.current) {
          try {
            URL.revokeObjectURL(u);
          } catch {
            // ignore
          }
        }
        urlsRef.current = [];
      } catch {
        // ignore
      }
    };
  }, []);

  const trackUrl = useCallback((url: string) => {
    try {
      urlsRef.current.push(url);
    } catch {
      // ignore
    }
  }, []);

  const revokeUrl = useCallback((url: string | null) => {
    try {
      if (url) {
        URL.revokeObjectURL(url);
        urlsRef.current = urlsRef.current.filter((u) => u !== url);
      }
    } catch {
      // ignore revoke errors
    }
  }, []);

  const safeSet = useCallback(
    <T,>(setter: (v: T) => void, v: T) => {
      try {
        if (mountedRef.current) setter(v);
      } catch {
        // ignore
      }
    },
    [],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const next = files[0] ?? null;
        if (!mountedRef.current) return;
        setFile(next);
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        setSolidUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        resultBlobRef.current = null;
        safeSet(setStatus, "idle");
        safeSet(setProgress, 0);
        safeSet(setStage, "starting");
        safeSet(setFallbackReason, null);
        setOriginalUrl((prev) => {
          if (prev) revokeUrl(prev);
          if (!next) return null;
          try {
            const url = URL.createObjectURL(next);
            trackUrl(url);
            return url;
          } catch {
            toast.error(s.fail);
            return null;
          }
        });
      } catch {
        toast.error(s.fail);
      }
    },
    [revokeUrl, trackUrl, safeSet, s.fail],
  );

  const runWorker = useCallback(
    (input: Blob, onStage: (stage: StageKey, pct: number) => void): Promise<Blob> => {
      return new Promise<Blob>((resolve, reject) => {
        let worker: Worker | null = null;
        let settled = false;
        const done = (fn: () => void) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            fn();
          }
        };
        const timer = setTimeout(() => {
          done(() => {
            try {
              worker?.terminate();
            } catch {
              // ignore
            }
            reject(new Error("worker-timeout"));
          });
        }, 120000);
        try {
          worker = new Worker(
            new URL("../../../../lib/workers/bg-removal-worker", import.meta.url),
          );
        } catch (e) {
          done(() => reject(e instanceof Error ? e : new Error("worker-init-failed")));
          return;
        }
        const w = worker;
        w.onmessage = (
          e: MessageEvent<
            | { type: "done"; blob: Blob }
            | { type: "progress"; key: string; current: number; total: number }
            | { type: "error"; message: string }
          >,
        ) => {
          try {
            const data = e.data;
            if (data.type === "progress") {
              onStage(stageFromKey(data.key), pctFromParts(data.current, data.total, 50));
            } else if (data.type === "done" && data.blob) {
              const out = data.blob;
              done(() => {
                try {
                  w.terminate();
                } catch {
                  // ignore
                }
                resolve(out);
              });
            } else if (data.type === "error") {
              done(() => {
                try {
                  w.terminate();
                } catch {
                  // ignore
                }
                reject(new Error(data.message ?? "worker-error"));
              });
            }
          } catch {
            // ignore message errors
          }
        };
        w.onerror = () => {
          done(() => {
            try {
              w.terminate();
            } catch {
              // ignore
            }
            reject(new Error("worker-error"));
          });
        };
        try {
          w.postMessage({ type: "remove", blob: input });
        } catch (e) {
          done(() => {
            try {
              w.terminate();
            } catch {
              // ignore
            }
            reject(e instanceof Error ? e : new Error("worker-post-failed"));
          });
        }
      });
    },
    [],
  );

  const runRemove = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    try {
      if (typeof WebAssembly !== "object") {
        safeSet(setFallbackReason, s.noWasm);
        safeSet(setStatus, "fallback");
        return;
      }
    } catch {
      safeSet(setFallbackReason, s.noWasm);
      safeSet(setStatus, "fallback");
      return;
    }

    const input: Blob = file;
    safeSet(setStatus, "working");
    safeSet(setStage, "starting");
    safeSet(setProgress, 2);
    safeSet(setFallbackReason, null);
    const onStage = (st: StageKey, pct: number) => {
      try {
        if (!mountedRef.current) return;
        setStage(st);
        setProgress(pct);
      } catch {
        // ignore
      }
    };

    let blob: Blob | null = null;
    let workerErr: unknown = null;
    try {
      blob = await runWorker(input, onStage);
    } catch (e) {
      workerErr = e;
      blob = null;
    }
    if (!mountedRef.current) return;

    if (!blob) {
      // Main-thread fallback for any worker failure.
      try {
        if (workerErr) toast.warning(s.workerFailed);
        onStage("fetch:model", 5);
        blob = await removeOnMainThread(input, onStage);
      } catch (e) {
        blob = null;
        workerErr = e;
      }
      if (!mountedRef.current) return;
    }

    try {
      if (!blob) {
        const reason =
          workerErr instanceof Error && workerErr.message
            ? `${s.fail} (${workerErr.message})`
            : s.fail;
        safeSet(setFallbackReason, reason);
        safeSet(setStatus, "fallback");
        toast.error(s.fail);
        return;
      }
      onStage("finishing", 99);
      resultBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      safeSet(setProgress, 100);
      safeSet(setStatus, "done");
      toast.success(s.ok);
    } catch {
      safeSet(setFallbackReason, s.fail);
      safeSet(setStatus, "fallback");
      toast.error(s.fail);
    }
  }, [file, runWorker, revokeUrl, trackUrl, safeSet, s]);

  // Solid-color composite derived from the transparent result.
  useEffect(() => {
    let cancelled = false;
    try {
      if (status !== "done" || !resultUrl) {
        setSolidUrl((prev) => {
          if (prev) {
            try {
              URL.revokeObjectURL(prev);
              urlsRef.current = urlsRef.current.filter((u) => u !== prev);
            } catch {
              // ignore
            }
          }
          return null;
        });
        return;
      }
      void (async () => {
        try {
          const blob = await compositeOverColor(resultUrl, solidColor);
          if (cancelled || !mountedRef.current) return;
          const url = URL.createObjectURL(blob);
          urlsRef.current.push(url);
          setSolidUrl((prev) => {
            if (prev) {
              try {
                URL.revokeObjectURL(prev);
                urlsRef.current = urlsRef.current.filter((u) => u !== prev);
              } catch {
                // ignore
              }
            }
            return url;
          });
        } catch {
          if (!cancelled && mountedRef.current) toast.error(s.fail);
        }
      })();
    } catch {
      // ignore composite scheduling errors
    }
    return () => {
      cancelled = true;
    };
  }, [resultUrl, solidColor, status, s.fail]);

  const handleReset = useCallback(() => {
    try {
      if (!mountedRef.current) return;
      setOriginalUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setSolidUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      resultBlobRef.current = null;
      setFile(null);
      safeSet(setStatus, "idle");
      safeSet(setProgress, 0);
      safeSet(setStage, "starting");
      safeSet(setFallbackReason, null);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.fail);
    }
  }, [revokeUrl, safeSet, s.fail]);

  return (
    <ToolLayout
      title="Background Remover"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="image/bg-remover"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          key={dropzoneKey}
          accept={["image/jpeg", "image/png"]}
          multiple={false}
          maxSizeMB={10}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        {originalUrl && file ? (
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Button
                onClick={() => void runRemove()}
                disabled={status === "working"}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {status === "working" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.working}
                  </>
                ) : (
                  <>
                    <Eraser className="h-4 w-4" aria-hidden />
                    {s.removeBtn}
                  </>
                )}
              </Button>

              {status === "working" && (
                <div role="status" aria-label={s.progressLabel}>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span>{stageLabel(stage, s)}</span>
                    <span className="tabular-nums">{progress}%</span>
                  </p>
                </div>
              )}

              {status === "fallback" && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950"
                >
                  <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
                    <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
                    {s.fallbackTitle}
                  </p>
                  {fallbackReason && (
                    <p className="mt-1 break-words text-xs text-amber-700 dark:text-amber-300">
                      {fallbackReason}
                    </p>
                  )}
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    <li>{s.fallbackTip1}</li>
                    <li>{s.fallbackTip2}</li>
                    <li>{s.fallbackTip3}</li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void runRemove()}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    {s.retry}
                  </Button>
                </div>
              )}

              {status === "done" && resultUrl && originalUrl && (
                <div className="space-y-4">
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{
                      backgroundImage:
                        "conic-gradient(#d4d4d8 0 25%, #fafafa 0 50%, #d4d4d8 0 75%, #fafafa 0)",
                      backgroundSize: "20px 20px",
                    }}
                  >
                    <BeforeAfterSlider
                      before={originalUrl}
                      after={resultUrl}
                      beforeLabel={s.before}
                      afterLabel={s.after}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="solid-color"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      {s.solidLabel}
                    </label>
                    <input
                      id="solid-color"
                      type="color"
                      value={solidColor}
                      onChange={(e) => {
                        try {
                          if (mountedRef.current) setSolidColor(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <span className="font-mono text-xs text-zinc-500 uppercase dark:text-zinc-400">
                      {solidColor}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700" size="lg">
                      <a href={resultUrl} download="bg-removed.png">
                        <Download className="h-4 w-4" aria-hidden />
                        {s.downloadTransparent}
                      </a>
                    </Button>
                    {solidUrl && (
                      <Button asChild variant="secondary" className="flex-1" size="lg">
                        <a href={solidUrl} download="bg-solid.png">
                          <Download className="h-4 w-4" aria-hidden />
                          {s.downloadSolid}
                        </a>
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleReset} size="lg" className="w-full">
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    {s.again}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.emptyTitle}
              </p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.emptyDesc}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
