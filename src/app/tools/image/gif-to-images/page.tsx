"use client";

import { useEffect, useRef, useState } from "react";
import { parseGIF, decompressFrames } from "gifuct-js";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, Images, Loader2, Package, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExtractedFrame {
  url: string;
  delay: number;
  w: number;
  h: number;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    notGif: string;
    empty: string;
    noFrames: string;
    parseFailed: string;
    parsing: string;
    framesLabel: string;
    dimsLabel: string;
    delayLabel: string;
    msUnit: string;
    downloadOne: string;
    downloadZip: string;
    zipDone: string;
    zipFailed: string;
    reset: string;
    error: string;
    frameAlt: string;
  }
> = {
  en: {
    title: "GIF to Images",
    description:
      "Split an animated GIF into individual PNG frames. Each frame is composited onto the full canvas honoring transparency and disposal rules — everything runs locally in your browser.",
    dropHint: "Drop a .gif file here, or click to browse (single GIF)",
    notGif: "Please choose a .gif file.",
    empty: "Choose a GIF first.",
    noFrames: "No image frames found in this GIF.",
    parseFailed: "Failed to parse this GIF. It may be corrupted or use an unsupported extension.",
    parsing: "Extracting frames…",
    framesLabel: "Frames",
    dimsLabel: "Canvas",
    delayLabel: "Delay",
    msUnit: "ms",
    downloadOne: "PNG",
    downloadZip: "Download all as ZIP",
    zipDone: "Frame ZIP downloaded.",
    zipFailed: "Failed to build the ZIP.",
    reset: "Clear",
    error: "Something went wrong.",
    frameAlt: "GIF frame",
  },
  id: {
    title: "GIF ke Gambar",
    description:
      "Pecah GIF animasi menjadi frame PNG satu per satu. Tiap frame digabung ke kanvas penuh mengikuti aturan transparansi dan disposal — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan file .gif di sini, atau klik untuk memilih (satu GIF)",
    notGif: "Pilih file .gif.",
    empty: "Pilih GIF terlebih dahulu.",
    noFrames: "Tidak ada frame gambar di GIF ini.",
    parseFailed: "Gagal membaca GIF ini. File mungkin rusak atau memakai ekstensi tak didukung.",
    parsing: "Mengekstrak frame…",
    framesLabel: "Frame",
    dimsLabel: "Kanvas",
    delayLabel: "Jeda",
    msUnit: "md",
    downloadOne: "PNG",
    downloadZip: "Unduh semua sebagai ZIP",
    zipDone: "ZIP frame terunduh.",
    zipFailed: "Gagal membuat ZIP.",
    reset: "Bersihkan",
    error: "Terjadi kesalahan.",
    frameAlt: "Frame GIF",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are transparent GIF frames handled?",
      a: "Each frame's patch is drawn onto a full-size canvas at its own offset. When the previous frame's disposal type is 'restore to background' (type 2), that region is cleared first — so transparent areas show correctly instead of smearing previous frames.",
    },
    id: {
      q: "Bagaimana frame GIF transparan ditangani?",
      a: "Patch tiap frame digambar ke kanvas ukuran penuh pada offset-nya. Bila tipe disposal frame sebelumnya adalah 'kembalikan ke latar' (tipe 2), area itu dibersihkan dulu — sehingga area transparan tampil benar, bukan sisa frame lama.",
    },
  },
  {
    en: {
      q: "What do I get in the ZIP download?",
      a: "One PNG per frame named frame-01.png, frame-02.png, and so on, each at the GIF's full canvas size. You can also download any single frame directly from its thumbnail card.",
    },
    id: {
      q: "Apa isi unduhan ZIP?",
      a: "Satu PNG per frame bernama frame-01.png, frame-02.png, dst., masing-masing seukuran kanvas penuh GIF. Kamu juga bisa mengunduh satu frame langsung dari kartu thumbnail-nya.",
    },
  },
  {
    en: {
      q: "Are my GIFs uploaded anywhere?",
      a: "No. Parsing with gifuct-js, canvas compositing, and ZIP packing all happen in your browser tab. Nothing leaves your device.",
    },
    id: {
      q: "Apakah GIF-ku diunggah ke mana pun?",
      a: "Tidak. Parsing dengan gifuct-js, compositing canvas, dan packing ZIP semuanya terjadi di tab browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function yieldToUI(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function pad(n: number): string {
  try {
    return String(n).padStart(2, "0");
  } catch {
    return String(n);
  }
}

export default function GifToImagesPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);

  const [dzKey, setDzKey] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [gifDims, setGifDims] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        for (const f of frames) URL.revokeObjectURL(f.url);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFrames = (): void => {
    try {
      for (const f of frames) {
        try {
          URL.revokeObjectURL(f.url);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    setFrames([]);
    setGifDims(null);
    setFileName(null);
  };

  const handleFiles = (files: File[]): void => {
    try {
      const f = files[0];
      setDzKey((k) => k + 1);
      if (!f) return;
      const isGif =
        f.type === "image/gif" || f.name.toLowerCase().endsWith(".gif");
      if (!isGif) {
        toast.error(s.notGif);
        return;
      }
      clearFrames();
      setFileName(f.name);
      void parseGif(f);
    } catch {
      toast.error(s.error);
    }
  };

  const parseGif = async (file: File): Promise<void> => {
    if (parsing) return;
    try {
      setParsing(true);
      setProgress(0);
      const buffer = await file.arrayBuffer();
      const parsed = parseGIF(buffer);
      const fullW = parsed.lsd.width;
      const fullH = parsed.lsd.height;
      if (!fullW || !fullH) throw new Error("bad-dims");
      const decoded = decompressFrames(parsed, true);
      if (decoded.length === 0) {
        toast.error(s.noFrames);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = fullW;
      canvas.height = fullH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-2d-context");
      ctx.clearRect(0, 0, fullW, fullH);
      const out: ExtractedFrame[] = [];
      for (let i = 0; i < decoded.length; i++) {
        const fr = decoded[i];
        if (!fr) continue;
        try {
          // Honor disposal: previous frame asking for background restore clears its region first.
          if (i > 0) {
            const prev = decoded[i - 1];
            if (prev && prev.disposalType === 2) {
              ctx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
            }
          }
          const { width, height, left, top } = fr.dims;
          if (width > 0 && height > 0) {
            const patch = ctx.createImageData(width, height);
            patch.data.set(fr.patch);
            ctx.putImageData(patch, left, top);
          }
          const blob = await new Promise<Blob | null>((resolve) => {
            try {
              canvas.toBlob((b) => resolve(b), "image/png");
            } catch {
              resolve(null);
            }
          });
          if (!blob) throw new Error("encode-failed");
          const url = URL.createObjectURL(blob);
          out.push({ url, delay: fr.delay, w: fullW, h: fullH });
        } catch {
          // Skip undecodable frames instead of failing the whole GIF.
        }
        if (mountedRef.current) setProgress(Math.round(((i + 1) / decoded.length) * 100));
        await yieldToUI();
      }
      if (!mountedRef.current) {
        for (const o of out) {
          try {
            URL.revokeObjectURL(o.url);
          } catch {
            // ignore
          }
        }
        return;
      }
      if (out.length === 0) {
        toast.error(s.noFrames);
        return;
      }
      setFrames(out);
      setGifDims(`${fullW}×${fullH}`);
    } catch {
      toast.error(s.parseFailed);
    } finally {
      if (mountedRef.current) {
        setParsing(false);
      }
    }
  };

  const handleZip = async (): Promise<void> => {
    if (zipping || frames.length === 0) return;
    try {
      setZipping(true);
      const zip = new JSZip();
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i];
        if (!fr) continue;
        const res = await fetch(fr.url);
        const blob = await res.blob();
        zip.file(`frame-${pad(i + 1)}.png`, blob);
        await yieldToUI();
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(fileName ?? "frames").replace(/\.gif$/i, "")}-frames.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(s.zipDone);
      } finally {
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }, 4000);
      }
    } catch {
      toast.error(s.zipFailed);
    } finally {
      setZipping(false);
    }
  };

  const handleReset = (): void => {
    try {
      clearFrames();
      setProgress(0);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileImage"
      slug="image/gif-to-images"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={[".gif"]}
              multiple={false}
              maxSizeMB={50}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />

            {parsing && (
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="space-y-1"
              >
                <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {s.parsing} {progress}%
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {frames.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {s.framesLabel}: {frames.length}
                </Badge>
                {gifDims && (
                  <Badge variant="secondary" className="font-mono">
                    {s.dimsLabel}: {gifDims}
                  </Badge>
                )}
                {fileName && (
                  <Badge variant="secondary" className="max-w-full truncate font-mono">
                    {fileName}
                  </Badge>
                )}
              </div>
            )}

            {frames.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleZip()}
                  disabled={zipping}
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {zipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Package className="h-4 w-4" aria-hidden />
                  )}
                  {s.downloadZip} ({frames.length})
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {s.reset}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {frames.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {frames.map((fr, i) => (
              <Card
                key={`${fr.url}-${i}`}
                className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <CardContent className="space-y-2 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fr.url}
                    alt={`${s.frameAlt} ${i + 1}`}
                    className="aspect-square w-full rounded-lg border border-zinc-200 object-contain bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <p className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      #{i + 1}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {s.delayLabel} {fr.delay} {s.msUnit}
                    </Badge>
                  </p>
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <a href={fr.url} download={`frame-${pad(i + 1)}.png`}>
                      <Download aria-hidden />
                      {s.downloadOne}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {frames.length === 0 && !parsing && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Images className="h-6 w-6" aria-hidden />
              </span>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.dropHint}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
