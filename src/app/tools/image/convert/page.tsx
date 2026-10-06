"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, FileWarning, Images, Loader2, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useBatchQueue, type BatchStatus } from "@/lib/batch-queue";

type TargetFormat = "webp" | "jpg" | "png";
type ItemStatus = "pending" | "converting" | "done" | "error";

interface ConvertItem {
  id: string;
  file: File;
  thumbUrl: string;
  status: ItemStatus;
  error: string | null;
  outputUrl: string | null;
  outputSize: number | null;
  outputName: string;
}

interface ConvertStrings {
  description: string;
  helper: string;
  formatLabel: string;
  convertAll: string;
  converting: string;
  progress: string;
  downloadAll: string;
  retry: string;
  emptyTitle: string;
  emptyDesc: string;
  noFiles: string;
  allDone: string;
  fileFailed: string;
  zipDone: string;
  zipFailed: string;
  statusPending: string;
  statusConverting: string;
  statusDone: string;
  statusError: string;
  webp: string;
  jpg: string;
  png: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, ConvertStrings> = {
  en: {
    description: "Convert images between WebP, JPG and PNG entirely in your browser. Convert all at once or grab files one by one.",
    helper: "Multiple images up to 25 MB each — JPG, PNG, WebP, GIF, BMP.",
    formatLabel: "Target format",
    convertAll: "Convert all",
    converting: "Converting…",
    progress: "converted",
    downloadAll: "Download all (.zip)",
    retry: "Retry",
    emptyTitle: "No images yet",
    emptyDesc: "Drop images above and choose a target format. Decoding and encoding happen on your device — nothing is uploaded.",
    noFiles: "Please add at least one image first.",
    allDone: "All images converted.",
    fileFailed: "Could not convert",
    zipDone: "ZIP archive ready.",
    zipFailed: "Failed to build the ZIP archive.",
    statusPending: "Waiting",
    statusConverting: "Converting",
    statusDone: "Ready",
    statusError: "Failed",
    webp: "WebP — smallest, modern",
    jpg: "JPG — universal photos",
    png: "PNG — lossless, transparency",
    faqQ1: "Are my images uploaded anywhere?",
    faqA1: "No. Files are decoded with createImageBitmap and re-encoded on a canvas, all inside your browser. No network request ever carries your images.",
    faqQ2: "Which format should I pick?",
    faqA2: "WebP gives the smallest files and works everywhere modern. JPG is the safest choice for maximum compatibility. PNG keeps every pixel and transparency but is larger.",
    faqQ3: "Does conversion reduce quality?",
    faqA3: "WebP and JPG are encoded at 92% quality — visually near-lossless for most photos. PNG conversion is fully lossless.",
  },
  id: {
    description: "Ubah gambar antara WebP, JPG, dan PNG sepenuhnya di browser. Konversi sekaligus atau unduh satu per satu.",
    helper: "Banyak gambar hingga 25 MB tiap file — JPG, PNG, WebP, GIF, BMP.",
    formatLabel: "Format target",
    convertAll: "Konversi semua",
    converting: "Mengonversi…",
    progress: "terkonversi",
    downloadAll: "Unduh semua (.zip)",
    retry: "Coba lagi",
    emptyTitle: "Belum ada gambar",
    emptyDesc: "Letakkan gambar di atas dan pilih format target. Decoding dan encoding terjadi di perangkatmu — tidak ada yang diunggah.",
    noFiles: "Tambahkan minimal satu gambar terlebih dahulu.",
    allDone: "Semua gambar terkonversi.",
    fileFailed: "Gagal mengonversi",
    zipDone: "Arsip ZIP siap.",
    zipFailed: "Gagal membuat arsip ZIP.",
    statusPending: "Menunggu",
    statusConverting: "Mengonversi",
    statusDone: "Siap",
    statusError: "Gagal",
    webp: "WebP — terkecil, modern",
    jpg: "JPG — universal untuk foto",
    png: "PNG — lossless, transparansi",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. File di-decode dengan createImageBitmap dan di-encode ulang di canvas, semuanya di dalam browser. Tidak ada request jaringan yang membawa gambarmu.",
    faqQ2: "Format mana yang sebaiknya dipilih?",
    faqA2: "WebP menghasilkan file terkecil dan didukung di semua browser modern. JPG paling aman untuk kompatibilitas maksimum. PNG menjaga setiap piksel dan transparansi tetapi lebih besar.",
    faqQ3: "Apakah konversi menurunkan kualitas?",
    faqA3: "WebP dan JPG di-encode pada kualitas 92% — nyaris tanpa perbedaan visual untuk kebanyakan foto. Konversi PNG sepenuhnya lossless.",
  },
};

const MIME: Record<TargetFormat, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};

const EXT: Record<TargetFormat, string> = {
  webp: "webp",
  jpg: "jpg",
  png: "png",
};

function makeId(f: File): string {
  try {
    return `${f.name}-${f.size}-${f.lastModified}`;
  } catch {
    return `${Math.random().toString(36).slice(2)}`;
  }
}

/** Mirror convert-page file states into the shared batch queue (lookup by name+size). */
function mirrorQueue(
  name: string,
  size: number,
  status: BatchStatus,
  extra?: { resultUrl?: string; error?: string },
): void {
  try {
    const q = useBatchQueue.getState();
    const b = q.items.find((i) => i.name === name && i.size === size);
    if (!b) return;
    if (extra?.resultUrl) q.setResult(b.id, extra.resultUrl);
    else q.setStatus(b.id, status, extra?.error);
    q.setProgress(b.id, status === "done" ? 1 : status === "pending" ? 0 : 0.5);
  } catch {
    // queue mirror must never break conversion
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

function formatSize(bytes: number | null): string {
  try {
    if (bytes === null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "—";
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      return await createImageBitmap(img);
    } finally {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => {
          try {
            if (b) resolve(b);
            else reject(new Error("encode-failed"));
          } catch (e) {
            reject(e);
          }
        },
        type,
        quality,
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function convertFile(file: File, format: TargetFormat): Promise<Blob> {
  const bitmap = await decodeToBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");
    ctx.drawImage(bitmap, 0, 0);
    return await canvasToBlob(canvas, MIME[format], 0.92);
  } finally {
    try {
      bitmap.close();
    } catch {
      // ignore
    }
  }
}

export default function ConvertPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [format, setFormat] = useState<TargetFormat>("webp");
  const [items, setItems] = useState<ConvertItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

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
        setItems((prev) => {
          try {
            const incoming = new Set(files.map(makeId));
            // Revoke removed entries
            for (const p of prev) {
              try {
                if (!incoming.has(p.id)) {
                  revokeUrl(p.thumbUrl);
                  revokeUrl(p.outputUrl);
                }
              } catch {
                // ignore
              }
            }
            const kept = prev.filter((p) => incoming.has(p.id));
            const keptIds = new Set(kept.map((p) => p.id));
            const added: ConvertItem[] = [];
            for (const f of files) {
              try {
                const id = makeId(f);
                if (keptIds.has(id)) continue;
                const thumbUrl = URL.createObjectURL(f);
                trackUrl(thumbUrl);
                added.push({
                  id,
                  file: f,
                  thumbUrl,
                  status: "pending",
                  error: null,
                  outputUrl: null,
                  outputSize: null,
                  outputName: "",
                });
              } catch {
                toast.error(s.fileFailed);
              }
            }
            return [...kept, ...added];
          } catch {
            toast.error(s.fileFailed);
            return prev;
          }
        });
        setDoneCount(0);
        try {
          const q = useBatchQueue.getState();
          q.clear();
          q.addFiles(files);
        } catch {
          // queue mirror is best-effort
        }
        setZipUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
      } catch {
        toast.error(s.fileFailed);
      }
    },
    [revokeUrl, trackUrl, s.fileFailed],
  );

  const convertOne = useCallback(
    async (id: string, target: TargetFormat): Promise<boolean> => {
      let ok = false;
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "converting" as ItemStatus, error: null } : p)),
      );
      try {
        const item = items.find((p) => p.id === id);
        // Fallback lookup from latest state via functional read
        const current = item ?? null;
        if (!current) throw new Error("item-missing");
        mirrorQueue(current.file.name, current.file.size, "processing");
        const blob = await convertFile(current.file, target);
        const url = URL.createObjectURL(blob);
        trackUrl(url);
        mirrorQueue(current.file.name, current.file.size, "done", { resultUrl: url });
        setItems((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            try {
              if (p.outputUrl) revokeUrl(p.outputUrl);
            } catch {
              // ignore
            }
            return {
              ...p,
              status: "done" as ItemStatus,
              outputUrl: url,
              outputSize: blob.size,
              outputName: `${baseName(p.file.name)}.${EXT[target]}`,
            };
          }),
        );
        ok = true;
      } catch {
        try {
          const item = items.find((p) => p.id === id);
          mirrorQueue(item?.file.name ?? "", item?.file.size ?? 0, "error", {
            error: s.fileFailed,
          });
          toast.error(`${s.fileFailed} ${item?.file.name ?? ""}`.trim());
        } catch {
          toast.error(s.fileFailed);
        }
        setItems((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "error" as ItemStatus, error: s.fileFailed } : p,
          ),
        );
        ok = false;
      }
      return ok;
    },
    [items, revokeUrl, trackUrl, s.fileFailed],
  );

  const convertAll = useCallback(async () => {
    if (items.length === 0) {
      toast.error(s.noFiles);
      return;
    }
    setBusy(true);
    setDoneCount(0);
    try {
      let ok = 0;
      for (const item of items) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const succeeded = await convertOne(item.id, format);
          if (succeeded) {
            ok += 1;
            setDoneCount(ok);
          }
        } catch {
          // per-file error already handled in convertOne
        }
      }
      if (ok === items.length) toast.success(s.allDone);
      else if (ok > 0) toast.success(`${ok} / ${items.length} ${s.progress}`);
    } catch {
      toast.error(s.fileFailed);
    } finally {
      try {
        setBusy(false);
      } catch {
        // ignore
      }
    }
  }, [convertOne, format, items, s]);

  const downloadZip = useCallback(async () => {
    const ready = items.filter((i) => i.status === "done" && i.outputUrl);
    if (ready.length < 2) return;
    try {
      const zip = new JSZip();
      for (const item of ready) {
        try {
          if (!item.outputUrl) continue;
          // eslint-disable-next-line no-await-in-loop
          const res = await fetch(item.outputUrl);
          // eslint-disable-next-line no-await-in-loop
          const blob = await res.blob();
          zip.file(item.outputName || `${baseName(item.file.name)}.png`, blob);
        } catch {
          toast.error(`${s.fileFailed} ${item.file.name}`);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setZipUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      toast.success(s.zipDone);
    } catch {
      toast.error(s.zipFailed);
    }
  }, [items, revokeUrl, trackUrl, s]);

  const convertedCount = items.filter((i) => i.status === "done").length;
  const showZip = convertedCount > 1;

  const statusBadge = (st: ItemStatus) => {
    try {
      if (st === "done")
        return <Badge className="bg-emerald-600 hover:bg-emerald-600">{s.statusDone}</Badge>;
      if (st === "converting")
        return <Badge className="bg-indigo-600 hover:bg-indigo-600">{s.statusConverting}</Badge>;
      if (st === "error") return <Badge variant="destructive">{s.statusError}</Badge>;
      return <Badge variant="secondary">{s.statusPending}</Badge>;
    } catch {
      return <Badge variant="secondary">{s.statusPending}</Badge>;
    }
  };

  return (
    <ToolLayout
      title="Convert Image"
      description={s.description}
      descriptionId={s.description}
      iconName="Repeat"
      slug="convert"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
          multiple
          maxSizeMB={25}
          maxFiles={20}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.formatLabel}</p>
            <div role="group" aria-label={s.formatLabel} className="grid grid-cols-3 gap-2">
              {(["webp", "jpg", "png"] as TargetFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    try {
                      setFormat(f);
                    } catch {
                      // ignore
                    }
                  }}
                  aria-pressed={format === f}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                    format === f
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                  )}
                >
                  <span className="block text-sm font-bold uppercase">{f}</span>
                  <span
                    className={cn(
                      "mt-0.5 hidden text-[11px] leading-tight sm:block",
                      format === f ? "text-indigo-100" : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    {f === "webp" ? s.webp : f === "jpg" ? s.jpg : s.png}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void convertAll()}
                disabled={busy || items.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.converting} {doneCount}/{items.length}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    {s.convertAll}
                    {items.length > 0 ? ` (${items.length})` : ""}
                  </>
                )}
              </Button>
              {showZip && (
                <Button variant="outline" onClick={() => void downloadZip()} size="lg" className="flex-1">
                  <Package className="h-4 w-4" aria-hidden />
                  {s.downloadAll}
                </Button>
              )}
            </div>

            {zipUrl && showZip && (
              <Button asChild variant="secondary" className="w-full">
                <a href={zipUrl} download="converted-images.zip">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.downloadAll}
                </a>
              </Button>
            )}

            {busy && (
              <div role="status">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                    style={{
                      width: items.length > 0 ? `${Math.round((doneCount / items.length) * 100)}%` : "0%",
                    }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                  {doneCount}/{items.length} {s.progress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Images className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.emptyTitle}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.emptyDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2" aria-label={`${items.length} files`}>
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-white p-2.5 shadow-sm dark:bg-zinc-900",
                  item.status === "error"
                    ? "border-red-300 dark:border-red-900"
                    : "border-zinc-200 dark:border-zinc-800",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbUrl}
                  alt={item.file.name}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                    {formatSize(item.file.size)}
                    {item.status === "done" && item.outputSize !== null && (
                      <> → {formatSize(item.outputSize)}</>
                    )}
                    {item.status === "error" && (
                      <span className="ml-1 inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <FileWarning className="h-3 w-3" aria-hidden />
                        {item.error ?? s.statusError}
                      </span>
                    )}
                  </p>
                  <div className="mt-1">{statusBadge(item.status)}</div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {item.status === "done" && item.outputUrl && (
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <a href={item.outputUrl} download={item.outputName}>
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        {EXT[format].toUpperCase()}
                      </a>
                    </Button>
                  )}
                  {item.status === "error" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void convertOne(item.id, format)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      {s.retry}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ToolLayout>
  );
}
