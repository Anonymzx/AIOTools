"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Lock, Unlock, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type ResizeMode = "pixels" | "percent" | "preset";
type OutFormat = "jpg" | "png" | "webp";

interface SizePreset {
  key: string;
  label: string;
  w: number;
  h: number;
}

const PRESETS: SizePreset[] = [
  { key: "ig-post", label: "Instagram Post 1080×1080", w: 1080, h: 1080 },
  { key: "ig-story", label: "Story 1080×1920", w: 1080, h: 1920 },
  { key: "yt-thumb", label: "YouTube Thumb 1280×720", w: 1280, h: 720 },
  { key: "passport", label: "Passport 600×600", w: 600, h: 600 },
  { key: "favicon", label: "Favicon 64×64", w: 64, h: 64 },
];

interface ResizeStrings {
  description: string;
  helper: string;
  modePixels: string;
  modePercent: string;
  modePreset: string;
  width: string;
  height: string;
  lockAspect: string;
  locked: string;
  unlocked: string;
  scale: string;
  presetLabel: string;
  original: string;
  output: string;
  estSize: string;
  formatLabel: string;
  qualityLabel: string;
  download: string;
  noImage: string;
  noImageDesc: string;
  failed: string;
  needImage: string;
  done: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, ResizeStrings> = {
  en: {
    description: "Resize images by exact pixels, percentage, or social-media presets. Live canvas preview with output size estimate, all in your browser.",
    helper: "Single image up to 25 MB — JPG, PNG, WebP.",
    modePixels: "Pixels",
    modePercent: "Percent",
    modePreset: "Preset",
    width: "Width",
    height: "Height",
    lockAspect: "Lock aspect ratio",
    locked: "Locked",
    unlocked: "Unlocked",
    scale: "Scale",
    presetLabel: "Size preset",
    original: "Original",
    output: "Output",
    estSize: "Estimated size",
    formatLabel: "Output format",
    qualityLabel: "Quality",
    download: "Download",
    noImage: "No image yet",
    noImageDesc: "Upload an image above, pick a resize mode, and the live preview plus size estimate appear here.",
    failed: "Could not resize the image.",
    needImage: "Upload an image first.",
    done: "Resized image ready.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. Decoding and resizing happen on a <canvas> in your browser. Nothing leaves your device.",
    faqQ2: "How is the size estimate calculated?",
    faqA2: "The preview canvas is encoded with your chosen format and quality in real time, so the estimate is the actual encoded byte size, not a guess.",
    faqQ3: "What do the presets do?",
    faqA3: "Each preset resizes to exact pixel dimensions for common targets: Instagram post/story, YouTube thumbnail, passport photo, and favicon.",
  },
  id: {
    description: "Ubah ukuran gambar lewat piksel pasti, persentase, atau preset media sosial. Pratinjau canvas langsung dengan estimasi ukuran output, semua di browser.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    modePixels: "Piksel",
    modePercent: "Persen",
    modePreset: "Preset",
    width: "Lebar",
    height: "Tinggi",
    lockAspect: "Kunci rasio aspek",
    locked: "Terkunci",
    unlocked: "Terbuka",
    scale: "Skala",
    presetLabel: "Preset ukuran",
    original: "Asli",
    output: "Hasil",
    estSize: "Estimasi ukuran",
    formatLabel: "Format output",
    qualityLabel: "Kualitas",
    download: "Unduh",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah gambar di atas, pilih mode resize, dan pratinjau langsung beserta estimasi ukuran muncul di sini.",
    failed: "Gagal mengubah ukuran gambar.",
    needImage: "Unggah gambar terlebih dahulu.",
    done: "Gambar hasil resize siap.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Decode dan resize terjadi pada <canvas> di browser. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Bagaimana estimasi ukuran dihitung?",
    faqA2: "Canvas pratinjau di-encode dengan format dan kualitas pilihan Anda secara real-time, jadi estimasinya adalah ukuran byte hasil encode yang sebenarnya, bukan tebakan.",
    faqQ3: "Apa fungsi preset?",
    faqA3: "Setiap preset mengubah ukuran ke dimensi piksel yang tepat untuk target umum: postingan/story Instagram, thumbnail YouTube, foto paspor, dan favicon.",
  },
};

const MIME: Record<OutFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

interface Decoded {
  src: CanvasImageSource;
  w: number;
  h: number;
  cleanup: () => void;
}

async function decodeFile(file: File): Promise<Decoded> {
  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      return { src: bmp, w: bmp.width, h: bmp.height, cleanup: () => bmp.close() };
    }
    throw new Error("no-bitmap");
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode-failed"));
        el.src = url;
      });
      return {
        src: img,
        w: img.naturalWidth,
        h: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
}

export default function ResizePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [pixW, setPixW] = useState(800);
  const [pixH, setPixH] = useState(600);
  const [locked, setLocked] = useState(true);
  const [percent, setPercent] = useState(100);
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const [format, setFormat] = useState<OutFormat>("jpg");
  const [quality, setQuality] = useState(0.92);
  const [estBytes, setEstBytes] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(true);
  const decodedRef = useRef<Decoded | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        decodedRef.current?.cleanup();
      } catch {
        // ignore
      }
    };
  }, []);

  const natW = decoded?.w ?? 0;
  const natH = decoded?.h ?? 0;
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];
  const outW =
    mode === "pixels" ? Math.max(1, Math.round(pixW)) : mode === "percent" ? Math.max(1, Math.round((natW * percent) / 100)) : preset.w;
  const outH =
    mode === "pixels" ? Math.max(1, Math.round(pixH)) : mode === "percent" ? Math.max(1, Math.round((natH * percent) / 100)) : preset.h;

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        const d = await decodeFile(f);
        if (!mountedRef.current) {
          try {
            d.cleanup();
          } catch {
            // ignore
          }
          return;
        }
        try {
          decodedRef.current?.cleanup();
        } catch {
          // ignore
        }
        decodedRef.current = d;
        setDecoded(d);
        setPixW(d.w);
        setPixH(d.h);
        setPercent(100);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  const onWChange = useCallback(
    (v: number) => {
      try {
        const w = Math.max(1, Math.round(v) || 1);
        setPixW(w);
        if (locked && natW > 0 && natH > 0) setPixH(Math.max(1, Math.round((w * natH) / natW)));
      } catch {
        // ignore
      }
    },
    [locked, natW, natH],
  );

  const onHChange = useCallback(
    (v: number) => {
      try {
        const h = Math.max(1, Math.round(v) || 1);
        setPixH(h);
        if (locked && natW > 0 && natH > 0) setPixW(Math.max(1, Math.round((h * natW) / natH)));
      } catch {
        // ignore
      }
    },
    [locked, natW, natH],
  );

  // Render full-res output + live KB estimate
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) return;
      canvas.width = Math.max(1, outW);
      canvas.height = Math.max(1, outH);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(decoded.src, 0, 0, canvas.width, canvas.height);
      const q = format === "png" ? undefined : quality;
      canvas.toBlob(
        (blob) => {
          try {
            if (mountedRef.current) setEstBytes(blob ? blob.size : null);
          } catch {
            // ignore
          }
        },
        MIME[format],
        q,
      );
    } catch {
      toast.error(s.failed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded, outW, outH, format, quality]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) {
        toast.error(s.needImage);
        return;
      }
      const q = format === "png" ? undefined : quality;
      canvas.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resized-${outW}x${outH}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => {
              try {
                URL.revokeObjectURL(url);
              } catch {
                // ignore
              }
            }, 4000);
            toast.success(s.done);
          } catch {
            toast.error(s.failed);
          }
        },
        MIME[format],
        q,
      );
    } catch {
      toast.error(s.failed);
    }
  }, [decoded, format, quality, outW, outH, s]);

  const estLabel =
    estBytes == null
      ? "—"
      : estBytes < 1024
        ? `${estBytes} B`
        : estBytes < 1024 * 1024
          ? `${(estBytes / 1024).toFixed(1)} KB`
          : `${(estBytes / 1024 / 1024).toFixed(2)} MB`;

  return (
    <ToolLayout
      title="Image Resizer"
      description={s.description}
      descriptionId={s.description}
      iconName="Repeat"
      slug="image/resize"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          maxSizeMB={25}
          maxFiles={1}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        {decoded ? (
          <>
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap gap-2" role="group" aria-label="mode">
                  {(["pixels", "percent", "preset"] as ResizeMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        try {
                          setMode(m);
                        } catch {
                          // ignore
                        }
                      }}
                      aria-pressed={mode === m}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        mode === m
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                      )}
                    >
                      {m === "pixels" ? s.modePixels : m === "percent" ? s.modePercent : s.modePreset}
                    </button>
                  ))}
                </div>

                {mode === "pixels" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rsz-w" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.width} (px)
                      </label>
                      <input
                        id="rsz-w"
                        type="number"
                        min={1}
                        max={8192}
                        value={pixW}
                        onChange={(e) => onWChange(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="rsz-h" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.height} (px)
                      </label>
                      <input
                        id="rsz-h"
                        type="number"
                        min={1}
                        max={8192}
                        value={pixH}
                        onChange={(e) => onHChange(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          setLocked((v) => !v);
                        } catch {
                          // ignore
                        }
                      }}
                      aria-pressed={locked}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      {locked ? <Lock className="h-4 w-4" aria-hidden /> : <Unlock className="h-4 w-4" aria-hidden />}
                      {s.lockAspect}: {locked ? s.locked : s.unlocked}
                    </button>
                  </div>
                )}

                {mode === "percent" && (
                  <div>
                    <label htmlFor="rsz-pct" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.scale}: <span className="tabular-nums">{percent}%</span>
                    </label>
                    <input
                      id="rsz-pct"
                      type="range"
                      min={1}
                      max={200}
                      step={1}
                      value={percent}
                      onChange={(e) => {
                        try {
                          setPercent(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                )}

                {mode === "preset" && (
                  <div>
                    <label htmlFor="rsz-preset" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.presetLabel}
                    </label>
                    <select
                      id="rsz-preset"
                      value={presetKey}
                      onChange={(e) => {
                        try {
                          setPresetKey(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="rsz-format" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.formatLabel}
                    </label>
                    <select
                      id="rsz-format"
                      value={format}
                      onChange={(e) => {
                        try {
                          setFormat(e.target.value as OutFormat);
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm uppercase text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {(["jpg", "png", "webp"] as OutFormat[]).map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  {format !== "png" && (
                    <div>
                      <label htmlFor="rsz-quality" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.qualityLabel}: <span className="tabular-nums">{Math.round(quality * 100)}%</span>
                      </label>
                      <input
                        id="rsz-quality"
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={quality}
                        onChange={(e) => {
                          try {
                            setQuality(Number(e.target.value));
                          } catch {
                            // ignore
                          }
                        }}
                        className="mt-2 w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>
                    {s.original}: <span className="font-semibold tabular-nums">{natW}×{natH}</span>
                  </span>
                  <span>
                    {s.output}: <span className="font-semibold tabular-nums">{outW}×{outH}</span>
                  </span>
                  <span>
                    {s.estSize}: <span className="font-semibold tabular-nums">{estLabel}</span>
                  </span>
                </div>
                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <canvas
                    ref={canvasRef}
                    className="mx-auto h-auto max-h-[60vh] w-auto max-w-full object-contain"
                  />
                </div>
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download} {format.toUpperCase()} · {outW}×{outH}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.noImage}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.noImageDesc}</p>
            </CardContent>
          </Card>
        )}
        {!decoded && <canvas ref={canvasRef} className="hidden" />}
      </div>
    </ToolLayout>
  );
}
