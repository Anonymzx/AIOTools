"use client";

import { useEffect, useRef, useState } from "react";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Film,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAX_FRAMES = 30;

type LoopMode = "infinite" | "once";

interface FrameItem {
  id: string;
  file: File;
  url: string;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    listTitle: string;
    notImage: string;
    limitReached: string;
    needTwo: string;
    maxWidthLabel: string;
    delayLabel: string;
    delayUnit: string;
    delayNote: string;
    loopLabel: string;
    loopInfinite: string;
    loopOnce: string;
    generate: string;
    generating: string;
    success: string;
    encodeFailed: string;
    reset: string;
    error: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    reorderHint: string;
    previewLabel: string;
    download: string;
    outputSize: string;
    dims: string;
    frameLabel: string;
  }
> = {
  en: {
    title: "Images to GIF",
    description:
      "Turn 2–30 images into an animated GIF. Reorder frames with drag & drop, set frame delay and output width — everything runs locally in your browser.",
    dropHint: "Drop images here, or click to browse (JPG, PNG, WebP — up to 30)",
    listTitle: "Frames in playback order",
    notImage: "is not a supported image and was skipped.",
    limitReached: "Maximum of 30 frames reached.",
    needTwo: "Add at least 2 images to build a GIF.",
    maxWidthLabel: "Max width",
    delayLabel: "Frame delay",
    delayUnit: "ms",
    delayNote:
      "One global delay applies to every frame. Per-frame editing is not supported — all frames play for the same duration.",
    loopLabel: "Loop",
    loopInfinite: "Infinite",
    loopOnce: "Play once",
    generate: "Build GIF",
    generating: "Encoding…",
    success: "Animated GIF ready.",
    encodeFailed: "Failed to encode the GIF. One of the images may be corrupted.",
    reset: "Clear all",
    error: "Something went wrong.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove frame",
    reorderHint: "Drag rows to reorder, or use the arrow buttons on touch screens.",
    previewLabel: "Animated preview",
    download: "Download .gif",
    outputSize: "File",
    dims: "Canvas",
    frameLabel: "Frame",
  },
  id: {
    title: "Gambar ke GIF",
    description:
      "Ubah 2–30 gambar menjadi GIF animasi. Susun ulang frame dengan drag & drop, atur jeda dan lebar keluaran — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan gambar di sini, atau klik untuk memilih (JPG, PNG, WebP — maks. 30)",
    listTitle: "Frame sesuai urutan putar",
    notImage: "bukan gambar yang didukung dan dilewati.",
    limitReached: "Batas maksimal 30 frame tercapai.",
    needTwo: "Tambahkan minimal 2 gambar untuk membuat GIF.",
    maxWidthLabel: "Lebar maks",
    delayLabel: "Jeda frame",
    delayUnit: "md",
    delayNote:
      "Satu jeda global berlaku untuk semua frame. Edit per-frame tidak didukung — semua frame tampil dengan durasi sama.",
    loopLabel: "Putar",
    loopInfinite: "Tanpa henti",
    loopOnce: "Sekali putar",
    generate: "Buat GIF",
    generating: "Meng-encode…",
    success: "GIF animasi siap.",
    encodeFailed: "Gagal meng-encode GIF. Salah satu gambar mungkin rusak.",
    reset: "Hapus semua",
    error: "Terjadi kesalahan.",
    moveUp: "Pindah ke atas",
    moveDown: "Pindah ke bawah",
    remove: "Hapus frame",
    reorderHint: "Seret baris untuk menyusun ulang, atau gunakan tombol panah di layar sentuh.",
    previewLabel: "Pratinjau animasi",
    download: "Unduh .gif",
    outputSize: "File",
    dims: "Kanvas",
    frameLabel: "Frame",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Why is there only one global delay instead of per-frame timing?",
      a: "A single delay keeps the UI simple and the output predictable: every frame plays for exactly the same duration. If you need varied timing, build separate GIFs per segment or reorder frames so repeated images create the pause effect you want.",
    },
    id: {
      q: "Kenapa hanya ada satu jeda global, bukan per-frame?",
      a: "Satu jeda membuat UI sederhana dan output terprediksi: setiap frame tampil tepat sama lama. Jika butuh variasi, buat GIF terpisah per segmen atau susun ulang frame agar gambar berulang menciptakan efek jeda yang diinginkan.",
    },
  },
  {
    en: {
      q: "How does the max-width slider affect quality and file size?",
      a: "Each frame is pre-scaled on a canvas so its width never exceeds the slider value (100–800 px), keeping aspect ratio. Smaller widths produce much smaller GIF files; larger widths look sharper but encode slower and weigh more.",
    },
    id: {
      q: "Bagaimana slider lebar-maks memengaruhi kualitas dan ukuran file?",
      a: "Setiap frame diskalakan dulu di canvas agar lebarnya tak melebihi nilai slider (100–800 px) dengan rasio aspek terjaga. Lebar kecil menghasilkan GIF jauh lebih ringan; lebar besar lebih tajam tapi encode lebih lambat dan lebih berat.",
    },
  },
  {
    en: {
      q: "Are my images uploaded anywhere?",
      a: "No. Decoding, scaling, palette quantization, and GIF encoding all run in your browser tab with the gifenc library. Nothing leaves your device.",
    },
    id: {
      q: "Apakah gambarku diunggah ke mana pun?",
      a: "Tidak. Decoding, scaling, kuantisasi palet, dan encoding GIF semuanya berjalan di tab browser memakai library gifenc. Tidak ada yang keluar dari perangkatmu.",
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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = url;
    } catch {
      reject(new Error("decode-failed"));
    }
  });
}

function yieldToUI(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

export default function ImagesToGifPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const dragIdx = useRef<number | null>(null);

  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [maxWidth, setMaxWidth] = useState(400);
  const [delayMs, setDelayMs] = useState(500);
  const [loop, setLoop] = useState<LoopMode>("infinite");
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifSize, setGifSize] = useState<number | null>(null);
  const [gifDims, setGifDims] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        for (const f of frames) URL.revokeObjectURL(f.url);
      } catch {
        // ignore
      }
      if (gifUrl) {
        try {
          URL.revokeObjectURL(gifUrl);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (files: File[]): void => {
    try {
      setFrames((prev) => {
        try {
          const next = [...prev];
          for (const f of files) {
            if (next.length >= MAX_FRAMES) {
              toast.error(s.limitReached);
              break;
            }
            if (!f.type.startsWith("image/")) {
              toast.error(`${f.name} ${s.notImage}`);
              continue;
            }
            let url = "";
            try {
              url = URL.createObjectURL(f);
            } catch {
              toast.error(s.error);
              continue;
            }
            next.push({ id: `${f.name}-${f.size}-${Date.now()}-${next.length}`, file: f, url });
          }
          return next;
        } catch {
          toast.error(s.error);
          return prev;
        }
      });
      setGifUrl((prev) => {
        if (prev) {
          try {
            URL.revokeObjectURL(prev);
          } catch {
            // ignore
          }
        }
        return null;
      });
      setGifSize(null);
      setGifDims(null);
    } catch {
      toast.error(s.error);
    }
  };

  const move = (index: number, dir: -1 | 1): void => {
    try {
      setFrames((prev) => {
        const j = index + dir;
        if (index < 0 || j < 0 || index >= prev.length || j >= prev.length) return prev;
        const next = [...prev];
        const a = next[index];
        const b = next[j];
        if (!a || !b) return prev;
        next[index] = b;
        next[j] = a;
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const removeAt = (index: number): void => {
    try {
      setFrames((prev) => {
        const target = prev[index];
        try {
          if (target) URL.revokeObjectURL(target.url);
        } catch {
          // ignore
        }
        return prev.filter((_, i) => i !== index);
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleDrop = (target: number): void => {
    try {
      const from = dragIdx.current;
      dragIdx.current = null;
      setDropIdx(null);
      if (from === null || from === target) return;
      setFrames((prev) => {
        if (from < 0 || from >= prev.length || target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        if (!moved) return prev;
        next.splice(target, 0, moved);
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      for (const f of frames) {
        try {
          URL.revokeObjectURL(f.url);
        } catch {
          // ignore
        }
      }
      setFrames([]);
      if (gifUrl) {
        try {
          URL.revokeObjectURL(gifUrl);
        } catch {
          // ignore
        }
      }
      setGifUrl(null);
      setGifSize(null);
      setGifDims(null);
      setProgress(0);
    } catch {
      toast.error(s.error);
    }
  };

  const handleEncode = async (): Promise<void> => {
    if (encoding) return;
    try {
      if (frames.length < 2) {
        toast.error(s.needTwo);
        return;
      }
      setEncoding(true);
      setProgress(0);
      if (gifUrl) {
        try {
          URL.revokeObjectURL(gifUrl);
        } catch {
          // ignore
        }
        setGifUrl(null);
      }
      const gif = GIFEncoder({ autoFirstFrame: true });
      let outW = 0;
      let outH = 0;
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i];
        if (!fr) continue;
        const img = await loadImage(fr.url);
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-2d-context");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const palette = quantize(imageData.data, 256);
        const index = applyPalette(imageData.data, palette);
        if (i === 0) {
          outW = w;
          outH = h;
          gif.writeFrame(index, w, h, {
            palette,
            delay: delayMs,
            repeat: loop === "infinite" ? 0 : -1,
          });
        } else {
          gif.writeFrame(index, w, h, { palette, delay: delayMs });
        }
        if (mountedRef.current) setProgress(Math.round(((i + 1) / frames.length) * 100));
        await yieldToUI();
      }
      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([new Uint8Array(bytes)], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      if (!mountedRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        return;
      }
      setGifUrl(url);
      setGifSize(blob.size);
      setGifDims(`${outW}×${outH}`);
      toast.success(s.success);
    } catch {
      toast.error(s.encodeFailed);
    } finally {
      if (mountedRef.current) setEncoding(false);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Images"
      slug="image/images-to-gif"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FileDropzone
              accept={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
              multiple
              maxSizeMB={25}
              maxFiles={MAX_FRAMES}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />

            {frames.length === 0 && (
              <EmptyState
                icon={<Film className="h-6 w-6" aria-hidden />}
                title={s.listTitle}
                hint={s.needTwo}
              />
            )}

            {frames.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.listTitle}{" "}
                  <Badge variant="secondary" className="font-mono">
                    {frames.length}/{MAX_FRAMES}
                  </Badge>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.reorderHint}</p>
                <ul className="space-y-2">
                  {frames.map((f, i) => (
                    <li
                      key={f.id}
                      draggable
                      onDragStart={() => {
                        dragIdx.current = i;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDropIdx(i);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(i);
                      }}
                      onDragEnd={() => {
                        dragIdx.current = null;
                        setDropIdx(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
                        dropIdx === i && "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900",
                      )}
                    >
                      <GripVertical
                        className="h-4 w-4 shrink-0 cursor-grab text-zinc-400"
                        aria-hidden
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={`${s.frameLabel} ${i + 1}`}
                        className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {i + 1}. {f.file.name}
                        </span>
                        <span className="block font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {delayMs} {s.delayUnit}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={`${s.moveUp}: ${f.file.name}`}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === frames.length - 1}
                        aria-label={`${s.moveDown}: ${f.file.name}`}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        aria-label={`${s.remove}: ${f.file.name}`}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="gif-maxw"
                  className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.maxWidthLabel}
                  <Badge variant="secondary" className="font-mono">
                    {maxWidth}px
                  </Badge>
                </label>
                <input
                  id="gif-maxw"
                  type="range"
                  min={100}
                  max={800}
                  step={10}
                  value={maxWidth}
                  onChange={(e) => {
                    try {
                      setMaxWidth(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
              <div>
                <label
                  htmlFor="gif-delay"
                  className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.delayLabel}
                  <Badge variant="secondary" className="font-mono">
                    {delayMs} {s.delayUnit}
                  </Badge>
                </label>
                <input
                  id="gif-delay"
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={delayMs}
                  onChange={(e) => {
                    try {
                      setDelayMs(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.delayNote}</p>

            <div>
              <label
                htmlFor="gif-loop"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.loopLabel}
              </label>
              <select
                id="gif-loop"
                value={loop}
                onChange={(e) => {
                  try {
                    setLoop(e.target.value === "once" ? "once" : "infinite");
                  } catch {
                    // ignore
                  }
                }}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="infinite">{s.loopInfinite}</option>
                <option value="once">{s.loopOnce}</option>
              </select>
            </div>

            {encoding && (
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="space-y-1"
              >
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{progress}%</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleEncode()}
                disabled={encoding || frames.length < 2}
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                size="lg"
              >
                {encoding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.generating} {progress}%
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4" aria-hidden />
                    {s.generate} ({frames.length})
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={encoding}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.reset}
              </Button>
            </div>
          </CardContent>
        </Card>

        {gifUrl && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.previewLabel}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gifUrl}
                alt={s.previewLabel}
                className="max-h-96 w-full rounded-xl border border-zinc-200 object-contain bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              />
              <p className="flex flex-wrap gap-2">
                {gifSize !== null && (
                  <Badge variant="secondary" className="font-mono">
                    {s.outputSize}: {formatSize(gifSize)}
                  </Badge>
                )}
                {gifDims && (
                  <Badge variant="secondary" className="font-mono">
                    {s.dims}: {gifDims}
                  </Badge>
                )}
              </p>
              <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
                <a href={gifUrl} download="animation.gif">
                  <Download aria-hidden />
                  {s.download}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
