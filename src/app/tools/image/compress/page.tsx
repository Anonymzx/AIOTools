"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { Download, ImagePlus, Loader2, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSlider } from "@/components/ui/animated-slider";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import BeforeAfterSlider from "@/components/tools/BeforeAfterSlider";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolSteps } from "@/components/ui/tool-steps";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type Status = "idle" | "compressing" | "done";

interface CompressStrings {
  description: string;
  helper: string;
  qualityLabel: string;
  compressBtn: string;
  compressing: string;
  progressLabel: string;
  original: string;
  compressed: string;
  saved: string;
  dimensions: string;
  download: string;
  again: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  compressedOk: string;
  compressedFail: string;
  workerTimeout: string;
  before: string;
  after: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  stepUpload: string;
  stepProcess: string;
  stepDownload: string;
}

const STR: Record<Locale, CompressStrings> = {
  en: {
    description: "Reduce image file size right in your browser. Drag the quality slider, preview before vs after, then download.",
    helper: "Single image up to 25 MB — JPG, PNG or WebP.",
    qualityLabel: "Quality",
    compressBtn: "Compress image",
    compressing: "Compressing…",
    progressLabel: "Compression progress",
    original: "Original",
    compressed: "Compressed",
    saved: "saved",
    dimensions: "Dimensions",
    download: "Download compressed",
    again: "Compress another",
    emptyTitle: "No image yet",
    emptyDesc: "Upload an image above, pick a quality, and press Compress. Everything runs locally — your file never leaves this device.",
    noFile: "Please upload an image first.",
    compressedOk: "Image compressed successfully.",
    compressedFail: "Compression failed. Please try another file.",
    workerTimeout: "Worker timed out, retrying on main thread…",
    before: "Before",
    after: "After",
    faqQ1: "Is my image uploaded to a server?",
    faqA1: "No. Compression runs 100% in your browser using a Web Worker (with a main-thread fallback). Your file never leaves your device.",
    faqQ2: "What quality should I choose?",
    faqA2: "80% is a great default for photos — much smaller files with almost no visible loss. Use 60% or lower for thumbnails, 90%+ when every detail matters.",
    faqQ3: "Are large images resized?",
      faqA3: "Images wider or taller than 1920 px are scaled down to 1920 px on the long edge to keep files small. Smaller images keep their original dimensions.",
    stepUpload: "Upload",
    stepProcess: "Compress",
    stepDownload: "Download",
  },
  id: {
    description: "Perkecil ukuran file gambar langsung di browser. Geser slider kualitas, pratinjau sebelum vs sesudah, lalu unduh.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, atau WebP.",
    qualityLabel: "Kualitas",
    compressBtn: "Kompres gambar",
    compressing: "Mengompres…",
    progressLabel: "Progres kompresi",
    original: "Asli",
    compressed: "Terkompres",
    saved: "hemat",
    dimensions: "Dimensi",
    download: "Unduh hasil",
    again: "Kompres lainnya",
    emptyTitle: "Belum ada gambar",
    emptyDesc: "Unggah gambar di atas, pilih kualitas, lalu tekan Kompres. Semua berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah gambar terlebih dahulu.",
    compressedOk: "Gambar berhasil dikompres.",
    compressedFail: "Kompresi gagal. Coba file lain.",
    workerTimeout: "Worker kehabisan waktu, mencoba ulang di thread utama…",
    before: "Sebelum",
    after: "Sesudah",
    faqQ1: "Apakah gambar saya diunggah ke server?",
    faqA1: "Tidak. Kompresi berjalan 100% di browser memakai Web Worker (dengan fallback thread utama). File tidak pernah keluar dari perangkatmu.",
    faqQ2: "Kualitas berapa yang sebaiknya dipilih?",
    faqA2: "80% adalah default yang bagus untuk foto — jauh lebih kecil dengan nyaris tanpa penurunan visual. Pakai 60% ke bawah untuk thumbnail, 90%+ jika detail sangat penting.",
    faqQ3: "Apakah gambar besar di-resize?",
      faqA3: "Gambar yang lebih lebar/tinggi dari 1920 px diperkecil ke 1920 px pada sisi terpanjang agar file tetap kecil. Gambar kecil mempertahankan dimensi aslinya.",
    stepUpload: "Unggah",
    stepProcess: "Kompres",
    stepDownload: "Unduh",
  },
};

function formatKB(bytes: number): string {
  try {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } catch {
    return "—";
  }
}

function extFromBlob(blob: Blob): string {
  try {
    if (blob.type === "image/png") return "png";
    if (blob.type === "image/webp") return "webp";
    return "jpg";
  } catch {
    return "jpg";
  }
}

function baseName(name: string): string {
  try {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(0, i) : name;
  } catch {
    return "image";
  }
}

function getDimensions(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          resolve({ w: img.naturalWidth, h: img.naturalHeight });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

function compressOnMainThread(
  file: File,
  quality: number,
  maxSizeMB: number,
  onProgress: (p: number) => void,
): Promise<Blob> {
  try {
    return imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      initialQuality: quality,
      useWebWorker: true,
      onProgress: (p: number) => {
        try {
          onProgress(Math.min(99, Math.max(0, Math.round(p))));
        } catch {
          // ignore
        }
      },
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

export default function CompressPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [resultName, setResultName] = useState("");
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const urlsRef = useRef<string[]>([]);
  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url);
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

  // Revoke all object URLs on unmount
  useEffect(() => {
    const bag = urlsRef.current;
    return () => {
      try {
        for (const u of bag) {
          try {
            URL.revokeObjectURL(u);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const next = files[0] ?? null;
        setFile((prev) => {
          if (prev === next) return prev;
          return next;
        });
        // Replace previous input/result URLs
        setOriginalUrl((prev) => {
          if (prev) revokeUrl(prev);
          return prev;
        });
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return prev;
        });
        setResultSize(null);
        setOrigDims(null);
        setResultDims(null);
        setStatus("idle");
        setProgress(0);
        if (next) {
          try {
            const url = URL.createObjectURL(next);
            trackUrl(url);
            setOriginalUrl(url);
            void getDimensions(url).then((d) => {
              try {
                setOrigDims(d);
              } catch {
                // ignore
              }
            });
          } catch {
            toast.error(s.compressedFail);
          }
        }
      } catch {
        toast.error(s.compressedFail);
      }
    },
    [revokeUrl, trackUrl, s.compressedFail],
  );

  const runCompress = useCallback(async () => {
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    const q = Math.min(1, Math.max(0.01, quality / 100));
    const maxSizeMB = Math.max(0.1, file.size / 1024 / 1024);
    setStatus("compressing");
    setProgress(0);

    const onProgress = (p: number) => {
      try {
        setProgress(p);
      } catch {
        // ignore
      }
    };

    let blob: Blob | null = null;

    // 1) Try Web Worker with timeout
    try {
      blob = await new Promise<Blob>((resolve, reject) => {
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
        }, 90000);
        try {
          worker = new Worker(new URL("../../../../lib/workers/image-worker", import.meta.url));
        } catch (e) {
          done(() => reject(e instanceof Error ? e : new Error("worker-init-failed")));
          return;
        }
        const w = worker;
        w.onmessage = (e: MessageEvent<{ type: string; value?: number; blob?: Blob; message?: string }>) => {
          try {
            const data = e.data;
            if (data.type === "progress") onProgress(typeof data.value === "number" ? data.value : 0);
            else if (data.type === "done" && data.blob) {
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
          w.postMessage({ file, quality: q, maxSizeMB, maxWidthOrHeight: 1920 });
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
    } catch (e) {
      // 2) Fallback: main thread
      try {
        if (e instanceof Error && e.message === "worker-timeout") toast.warning(s.workerTimeout);
        blob = await compressOnMainThread(file, q, maxSizeMB, onProgress);
      } catch {
        blob = null;
      }
    }

    try {
      if (!blob) {
        setStatus("idle");
        toast.error(s.compressedFail);
        return;
      }
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      setResultSize(blob.size);
      setResultName(`${baseName(file.name)}-compressed.${extFromBlob(blob)}`);
      void getDimensions(url).then((d) => {
        try {
          setResultDims(d);
        } catch {
          // ignore
        }
      });
      setProgress(100);
      setStatus("done");
      toast.success(s.compressedOk);
    } catch {
      setStatus("idle");
      toast.error(s.compressedFail);
    }
  }, [file, quality, revokeUrl, trackUrl, s]);

  const handleReset = useCallback(() => {
    try {
      setOriginalUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setFile(null);
      setResultSize(null);
      setResultName("");
      setOrigDims(null);
      setResultDims(null);
      setStatus("idle");
      setProgress(0);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.compressedFail);
    }
  }, [revokeUrl, s.compressedFail]);

  const savedPct =
    file && resultSize !== null && file.size > 0
      ? Math.max(0, Math.round((1 - resultSize / file.size) * 100))
      : 0;

  const stage: 0 | 1 | 2 | 3 =
    status === "done" ? 3 : status === "compressing" ? 2 : file ? 1 : 0;

  return (
    <ToolLayout
      title="Compress Image"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="compress"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <ToolSteps stage={stage} labels={[s.stepUpload, s.stepProcess, s.stepDownload]} />
        <FileDropzone
          key={dropzoneKey}
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          maxSizeMB={25}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        {originalUrl && file ? (
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div>
                <AnimatedSlider
                  label={s.qualityLabel}
                  value={quality}
                  min={1}
                  max={100}
                  step={1}
                  disabled={status === "compressing"}
                  onChange={(v) => {
                    try {
                      setQuality(Math.min(100, Math.max(1, Math.round(v))));
                    } catch {
                      // ignore
                    }
                  }}
                  format={(v) => `${v}%`}
                  id="quality-slider"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                  <span>1%</span>
                  <span>100%</span>
                </div>
              </div>

              <Button
                onClick={() => void runCompress()}
                disabled={status === "compressing"}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {status === "compressing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.compressing}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" aria-hidden />
                    {s.compressBtn}
                  </>
                )}
              </Button>

              {status === "compressing" && (
                <div role="status" aria-label={s.progressLabel}>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                    {progress}%
                  </p>
                </div>
              )}

              {status === "done" && resultUrl && resultSize !== null && (
                <div className="space-y-4">
                  <BeforeAfterSlider
                    before={originalUrl}
                    after={resultUrl}
                    beforeLabel={s.before}
                    afterLabel={s.after}
                  />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-[11px] font-medium text-zinc-500 uppercase dark:text-zinc-400">
                        {s.original}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
                        {formatKB(file.size)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-[11px] font-medium text-zinc-500 uppercase dark:text-zinc-400">
                        {s.compressed}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
                        {formatKB(resultSize)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950">
                      <p className="text-[11px] font-medium text-emerald-600 uppercase dark:text-emerald-400">
                        {s.saved}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                        {savedPct}%
                      </p>
                    </div>
                  </div>
                  {origDims && resultDims && (
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                      {s.dimensions}: {origDims.w}×{origDims.h} → {resultDims.w}×{resultDims.h}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700" size="lg">
                      <a href={resultUrl} download={resultName}>
                        <Download className="h-4 w-4" aria-hidden />
                        {s.download}
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleReset} size="lg" className="flex-1">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      {s.again}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<ImagePlus className="h-6 w-6" aria-hidden />}
            title={s.emptyTitle}
            hint={s.emptyDesc}
          />
        )}
      </div>
    </ToolLayout>
  );
}
