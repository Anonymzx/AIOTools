"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileImage, ImagePlus, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "idle" | "working" | "done" | "fallback";
type OutFormat = "jpeg" | "png";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    notHeic: string;
    alreadyConvertible: string;
    formatLabel: string;
    jpegLabel: string;
    pngLabel: string;
    qualityLabel: string;
    qualityNote: string;
    convertBtn: string;
    working: string;
    converting: string;
    progressLabel: string;
    downloadLabel: string;
    again: string;
    retry: string;
    noFile: string;
    ok: string;
    fail: string;
    workerFailed: string;
    emptyTitle: string;
    emptyDesc: string;
    fallbackTitle: string;
    fallbackTip1: string;
    fallbackTip2: string;
    error: string;
  }
> = {
  en: {
    title: "HEIC to JPG / PNG",
    description:
      "Convert iPhone HEIC/HEIF photos to JPG or PNG right in your browser. Runs in a Web Worker so the page stays responsive — your photos never leave your device.",
    dropHint: "Drop a .heic or .heif file here, or click to browse",
    notHeic: "is not a .heic/.heif file and was skipped.",
    alreadyConvertible:
      "is already a standard image — use the Convert Image tool for JPG/PNG/WebP instead.",
    formatLabel: "Output format",
    jpegLabel: "JPG",
    pngLabel: "PNG",
    qualityLabel: "JPG quality",
    qualityNote: "Quality only applies to JPG. PNG is always lossless.",
    convertBtn: "Convert",
    working: "Converting…",
    converting: "Converting…",
    progressLabel: "HEIC conversion progress",
    downloadLabel: "Download",
    again: "Convert another",
    retry: "Try again",
    noFile: "Please upload a .heic/.heif file first.",
    ok: "Conversion finished.",
    fail: "Conversion failed. The file may be corrupted or use an unsupported HEIC profile.",
    workerFailed: "Background worker failed, retrying on main thread…",
    emptyTitle: "No HEIC file yet",
    emptyDesc:
      "Upload a .heic/.heif photo above (usually from an iPhone), pick JPG or PNG, then press Convert. Everything runs locally — the file never leaves this device.",
    fallbackTitle: "Couldn't convert here",
    fallbackTip1: "Try a smaller file, or reload the page and convert again.",
    fallbackTip2: "Use desktop Chrome or Edge — some mobile browsers cannot decode HEIC.",
    error: "Something went wrong.",
  },
  id: {
    title: "HEIC ke JPG / PNG",
    description:
      "Ubah foto HEIC/HEIF dari iPhone menjadi JPG atau PNG langsung di browser. Berjalan di Web Worker agar halaman tetap responsif — fotomu tidak pernah keluar dari perangkat.",
    dropHint: "Letakkan file .heic atau .heif di sini, atau klik untuk memilih",
    notHeic: "bukan file .heic/.heif dan dilewati.",
    alreadyConvertible:
      "sudah gambar standar — gunakan tool Convert Image untuk JPG/PNG/WebP.",
    formatLabel: "Format keluaran",
    jpegLabel: "JPG",
    pngLabel: "PNG",
    qualityLabel: "Kualitas JPG",
    qualityNote: "Kualitas hanya berlaku untuk JPG. PNG selalu lossless.",
    convertBtn: "Konversi",
    working: "Mengonversi…",
    converting: "Mengonversi…",
    progressLabel: "Progres konversi HEIC",
    downloadLabel: "Unduh",
    again: "Konversi lainnya",
    retry: "Coba lagi",
    noFile: "Silakan unggah file .heic/.heif terlebih dahulu.",
    ok: "Konversi selesai.",
    fail: "Konversi gagal. File mungkin rusak atau memakai profil HEIC yang tak didukung.",
    workerFailed: "Worker latar gagal, mencoba ulang di thread utama…",
    emptyTitle: "Belum ada file HEIC",
    emptyDesc:
      "Unggah foto .heic/.heif di atas (biasanya dari iPhone), pilih JPG atau PNG, lalu tekan Konversi. Semua berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    fallbackTitle: "Tidak bisa dikonversi di sini",
    fallbackTip1: "Coba file yang lebih kecil, atau muat ulang halaman lalu konversi lagi.",
    fallbackTip2: "Gunakan Chrome atau Edge desktop — sebagian browser HP tak bisa decode HEIC.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What is a HEIC file?",
      a: "HEIC (High Efficiency Image Container) is the default photo format on iPhones since iOS 11. It stores higher quality at smaller sizes than JPEG, but Windows, Android, and many web apps cannot open it — converting to JPG or PNG fixes that.",
    },
    id: {
      q: "Apa itu file HEIC?",
      a: "HEIC (High Efficiency Image Container) adalah format foto bawaan iPhone sejak iOS 11. Kualitasnya lebih tinggi dengan ukuran lebih kecil dari JPEG, tetapi Windows, Android, dan banyak aplikasi web tidak bisa membukanya — konversi ke JPG atau PNG mengatasinya.",
    },
  },
  {
    en: {
      q: "Should I choose JPG or PNG?",
      a: "Pick JPG for photos you want to share or upload (much smaller, quality slider applies). Pick PNG when you need pixel-perfect quality, e.g. for editing — PNG output here is always lossless.",
    },
    id: {
      q: "Pilih JPG atau PNG?",
      a: "Pilih JPG untuk foto yang ingin dibagikan atau diunggah (jauh lebih kecil, slider kualitas berlaku). Pilih PNG jika butuh kualitas sempurna per piksel, mis. untuk editing — keluaran PNG di sini selalu lossless.",
    },
  },
  {
    en: {
      q: "Why does conversion take a while or show no percentage?",
      a: "HEIC decoding is CPU-heavy, especially for 12–48 MP iPhone photos, and the heic2any library reports no progress — so the bar runs indeterminate. It processes in a Web Worker, so the page stays responsive while you wait.",
    },
    id: {
      q: "Kenapa konversi lama atau tanpa persentase?",
      a: "Decoding HEIC berat di CPU, apalagi untuk foto iPhone 12–48 MP, dan library heic2any tidak melaporkan progres — jadi bar berjalan indeterminat. Prosesnya di Web Worker sehingga halaman tetap responsif selagi menunggu.",
    },
  },
  {
    en: {
      q: "Are my photos uploaded to a server?",
      a: "Never. Conversion runs 100% in your browser (Web Worker with a main-thread fallback). Your photos never leave your device.",
    },
    id: {
      q: "Apakah fotoku diunggah ke server?",
      a: "Tidak pernah. Konversi berjalan 100% di browser (Web Worker dengan fallback thread utama). Fotomu tidak pernah meninggalkan perangkatmu.",
    },
  },
];

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

function baseName(name: string): string {
  try {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(0, i) : name;
  } catch {
    return "converted";
  }
}

async function convertOnMainThread(blob: Blob, toType: string, quality: number): Promise<Blob> {
  try {
    const mod = (await import("heic2any")) as unknown as {
      default?: (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;
    };
    const convert = mod.default;
    if (typeof convert !== "function") throw new Error("engine-load-failed");
    const out = await convert({
      blob,
      toType,
      quality: toType === "image/png" ? undefined : quality,
    });
    const first = Array.isArray(out) ? out[0] : out;
    if (!first) throw new Error("empty-output");
    return first;
  } catch (e) {
    throw e instanceof Error ? e : new Error("main-thread-failed");
  }
}

export default function HeicConvertPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutFormat>("jpeg");
  const [quality, setQuality] = useState(92);
  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const mountedRef = useRef(true);
  const urlsRef = useRef<string[]>([]);

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

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        if (!mountedRef.current) return;
        const f = files[0];
        if (!f) {
          setDropzoneKey((k) => k + 1);
          return;
        }
        if (/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name)) {
          toast.info(`${f.name} ${s.alreadyConvertible}`);
          setDropzoneKey((k) => k + 1);
          return;
        }
        if (!/\.(heic|heif)$/i.test(f.name)) {
          toast.error(`${f.name} ${s.notHeic}`);
          setDropzoneKey((k) => k + 1);
          return;
        }
        setFile(f);
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        setResultSize(null);
        setFallbackReason(null);
        setStatus("idle");
        setDropzoneKey((k) => k + 1);
      } catch {
        toast.error(s.error);
      }
    },
    [revokeUrl, s],
  );

  const runWorker = useCallback(
    (input: Blob, toType: string, q: number): Promise<Blob> => {
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
          worker = new Worker(new URL("../../../../lib/workers/heic-worker", import.meta.url));
        } catch (e) {
          done(() => reject(e instanceof Error ? e : new Error("worker-init-failed")));
          return;
        }
        const w = worker;
        w.onmessage = (
          e: MessageEvent<
            | { type: "done"; blob: Blob }
            | { type: "stage"; stage: string }
            | { type: "error"; message: string }
          >,
        ) => {
          try {
            const data = e.data;
            if (data.type === "stage") {
              // Indeterminate — heic2any reports no progress; UI already shows animation.
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
          w.postMessage({ type: "convert", blob: input, toType, quality: q });
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

  const runConvert = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    const toType = format === "png" ? "image/png" : "image/jpeg";
    const q = Math.min(1, Math.max(0.1, quality / 100));
    setStatus("working");
    setFallbackReason(null);
    let blob: Blob | null = null;
    let workerErr: unknown = null;
    try {
      blob = await runWorker(file, toType, q);
    } catch (e) {
      workerErr = e;
      blob = null;
    }
    if (!mountedRef.current) return;
    if (!blob) {
      // Main-thread fallback for any worker failure.
      try {
        if (workerErr) toast.warning(s.workerFailed);
        blob = await convertOnMainThread(file, toType, q);
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
        setFallbackReason(reason);
        setStatus("fallback");
        toast.error(s.fail);
        return;
      }
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      setResultSize(blob.size);
      setStatus("done");
      toast.success(s.ok);
    } catch {
      setFallbackReason(s.fail);
      setStatus("fallback");
      toast.error(s.fail);
    }
  }, [file, format, quality, runWorker, trackUrl, revokeUrl, s]);

  const handleReset = useCallback(() => {
    try {
      if (!mountedRef.current) return;
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setResultSize(null);
      setFile(null);
      setStatus("idle");
      setFallbackReason(null);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  }, [revokeUrl, s.error]);

  const ext = format === "png" ? "png" : "jpg";
  const downloadName = file ? `${baseName(file.name)}.${ext}` : `converted.${ext}`;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileImage"
      slug="image/heic-convert"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dropzoneKey}
              accept={["image/heic", "image/heif"]}
              multiple={false}
              maxSizeMB={50}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />
            {file && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Badge variant="secondary" className="font-mono">
                  {file.name}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {formatSize(file.size)}
                </Badge>
              </p>
            )}
          </CardContent>
        </Card>

        {file ? (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.formatLabel}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: "jpeg" as const, label: s.jpegLabel },
                      { v: "png" as const, label: s.pngLabel },
                    ]
                  ).map((o) => (
                    <Button
                      key={o.v}
                      type="button"
                      variant={format === o.v ? "default" : "outline"}
                      disabled={status === "working"}
                      onClick={() => {
                        try {
                          if (mountedRef.current) setFormat(o.v);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      className={cn(
                        format === o.v &&
                          "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
                      )}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="heic-quality"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.qualityLabel}
                  </label>
                  <Badge variant="secondary" aria-live="polite">
                    {quality}%
                  </Badge>
                </div>
                <input
                  id="heic-quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  disabled={status === "working" || format === "png"}
                  onChange={(e) => {
                    try {
                      if (mountedRef.current) setQuality(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  aria-valuetext={`${quality}%`}
                  className="mt-2 w-full accent-indigo-600 disabled:opacity-40"
                />
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{s.qualityNote}</p>
              </div>

              <Button
                onClick={() => void runConvert()}
                disabled={status === "working"}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                size="lg"
              >
                {status === "working" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.working}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    {s.convertBtn}
                  </>
                )}
              </Button>

              {status === "working" && (
                <div role="status" aria-label={s.progressLabel}>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-600" />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {s.converting}
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
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void runConvert()}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    {s.retry}
                  </Button>
                </div>
              )}

              {status === "done" && resultUrl && (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt={downloadName}
                    className="max-h-80 w-full rounded-xl border border-zinc-200 object-contain bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <p className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {resultSize !== null && (
                      <Badge variant="secondary" className="font-mono">
                        {formatSize(resultSize)}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="font-mono uppercase">
                      {ext}
                    </Badge>
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      asChild
                      className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      size="lg"
                    >
                      <a href={resultUrl} download={downloadName}>
                        <Download className="h-4 w-4" aria-hidden />
                        {s.downloadLabel} {downloadName}
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleReset} size="lg" className="flex-1">
                      <ImagePlus className="h-4 w-4" aria-hidden />
                      {s.again}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileImage className="h-6 w-6" aria-hidden />
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
