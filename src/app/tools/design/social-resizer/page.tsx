"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, ImagePlus, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

interface Preset {
  key: string;
  platform: string;
  label: string;
  w: number;
  h: number;
}

const PRESETS: Preset[] = [
  { key: "ig-post", platform: "Instagram", label: "Post 1080×1080", w: 1080, h: 1080 },
  { key: "ig-story", platform: "Instagram", label: "Story 1080×1920", w: 1080, h: 1920 },
  { key: "fb-post", platform: "Facebook", label: "Post 1200×630", w: 1200, h: 630 },
  { key: "fb-cover", platform: "Facebook", label: "Cover 820×312", w: 820, h: 312 },
  { key: "fb-profile", platform: "Facebook", label: "Profile 170×170", w: 170, h: 170 },
  { key: "x-post", platform: "X", label: "Post 1600×900", w: 1600, h: 900 },
  { key: "x-header", platform: "X", label: "Header 1500×500", w: 1500, h: 500 },
  { key: "x-profile", platform: "X", label: "Profile 400×400", w: 400, h: 400 },
  { key: "li-post", platform: "LinkedIn", label: "Post 1200×627", w: 1200, h: 627 },
  { key: "li-cover", platform: "LinkedIn", label: "Cover 1584×396", w: 1584, h: 396 },
  { key: "li-profile", platform: "LinkedIn", label: "Profile 400×400", w: 400, h: 400 },
  { key: "yt-thumb", platform: "YouTube", label: "Thumbnail 1280×720", w: 1280, h: 720 },
  { key: "yt-banner", platform: "YouTube", label: "Banner 2560×1440", w: 2560, h: 1440 },
  { key: "tiktok", platform: "TikTok", label: "Video 1080×1920", w: 1080, h: 1920 },
];

type Fit = "cover" | "contain";

interface ResizerStrings {
  description: string;
  helper: string;
  empty: string;
  emptyDesc: string;
  presetLabel: string;
  fitLabel: string;
  fitCover: string;
  fitContain: string;
  bgLabel: string;
  preview: string;
  downloadOne: string;
  downloadAll: string;
  working: string;
  needImage: string;
  failed: string;
  doneOne: string;
  doneAll: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, ResizerStrings> = {
  en: {
    description: "Resize one image for 14 social presets across Instagram, Facebook, X, LinkedIn, YouTube, and TikTok. Cover or contain fit, live preview, single or ZIP download — all in your browser.",
    helper: "One image up to 25 MB — JPG, PNG, WebP.",
    empty: "No image yet",
    emptyDesc: "Upload an image above, pick a preset, and the live preview appears here.",
    presetLabel: "Platform preset",
    fitLabel: "Fit mode",
    fitCover: "Cover (crop to fill)",
    fitContain: "Contain (fit + background)",
    bgLabel: "Background color",
    preview: "Preview",
    downloadOne: "Download this size",
    downloadAll: "Download all 14 as ZIP",
    working: "Working…",
    needImage: "Upload an image first.",
    failed: "Could not process the image.",
    doneOne: "Image downloaded.",
    doneAll: "ZIP with all sizes downloaded.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. Resizing happens on a <canvas> in your browser with drawImage. Nothing leaves your device.",
    faqQ2: "Cover vs contain — which should I pick?",
    faqA2: "Cover center-crops to fill every pixel (best for photos). Contain fits the whole image and fills leftover space with your background color (best for logos).",
    faqQ3: "What is inside the ZIP?",
    faqA3: "All 14 presets as PNG files named by platform and dimensions, e.g. x-post-1600x900.png.",
  },
  id: {
    description: "Ubah ukuran satu gambar untuk 14 preset sosial di Instagram, Facebook, X, LinkedIn, YouTube, dan TikTok. Mode cover/contain, pratinjau langsung, unduh satuan atau ZIP — semua di browser.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    empty: "Belum ada gambar",
    emptyDesc: "Unggah gambar di atas, pilih preset, dan pratinjau langsung muncul di sini.",
    presetLabel: "Preset platform",
    fitLabel: "Mode fit",
    fitCover: "Cover (crop hingga penuh)",
    fitContain: "Contain (pas + background)",
    bgLabel: "Warna background",
    preview: "Pratinjau",
    downloadOne: "Unduh ukuran ini",
    downloadAll: "Unduh semua (14) sebagai ZIP",
    working: "Memproses…",
    needImage: "Unggah gambar terlebih dahulu.",
    failed: "Gagal memproses gambar.",
    doneOne: "Gambar terunduh.",
    doneAll: "ZIP berisi semua ukuran terunduh.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Resize terjadi pada <canvas> di browser dengan drawImage. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Cover vs contain — pilih yang mana?",
    faqA2: "Cover mem-crop tengah hingga memenuhi setiap piksel (terbaik untuk foto). Contain memuat seluruh gambar dan mengisi sisa ruang dengan warna background (terbaik untuk logo).",
    faqQ3: "Apa isi ZIP-nya?",
    faqA3: "Semua 14 preset sebagai file PNG bernama sesuai platform dan dimensi, mis. x-post-1600x900.png.",
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode-failed"));
      el.src = src;
    } catch (e) {
      reject(e);
    }
  });
}

function paint(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  w: number,
  h: number,
  fit: Fit,
  bg: string,
): void {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-2d-unavailable");
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) throw new Error("decode-failed");
  if (fit === "cover") {
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("encode-failed"));
      }, "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
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
}

export default function SocialResizerPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState("ig-post");
  const [fit, setFit] = useState<Fit>("cover");
  const [bg, setBg] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const [natSize, setNatSize] = useState("—");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(true);
  const urlRef = useRef<string | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const active = PRESETS.find((p) => p.key === activeKey) ?? PRESETS[0];

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        try {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        } catch {
          // ignore
        }
        const url = URL.createObjectURL(f);
        urlRef.current = url;
        setSrcUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Live preview for the active preset
  useEffect(() => {
    if (!srcUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const img = await loadImage(srcUrl);
        if (cancelled || !mountedRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        paint(canvas, img, active.w, active.h, fit, bg);
        if (!cancelled && mountedRef.current) {
          setNatSize(`${img.naturalWidth || img.width}×${img.naturalHeight || img.height}`);
        }
      } catch {
        if (!cancelled && mountedRef.current) toast.error(s.failed);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl, activeKey, fit, bg]);

  const downloadOne = useCallback(async () => {
    if (!srcUrl) {
      toast.error(s.needImage);
      return;
    }
    try {
      setBusy(true);
      const img = await loadImage(srcUrl);
      const canvas = document.createElement("canvas");
      paint(canvas, img, active.w, active.h, fit, bg);
      saveBlob(await canvasToBlob(canvas), `${active.key}-${active.w}x${active.h}.png`);
      toast.success(s.doneOne);
    } catch {
      toast.error(s.failed);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [srcUrl, active, fit, bg, s]);

  const downloadAll = useCallback(async () => {
    if (!srcUrl) {
      toast.error(s.needImage);
      return;
    }
    try {
      setBusy(true);
      const img = await loadImage(srcUrl);
      const zip = new JSZip();
      for (const p of PRESETS) {
        const canvas = document.createElement("canvas");
        paint(canvas, img, p.w, p.h, fit, bg);
        zip.file(`${p.key}-${p.w}x${p.h}.png`, await canvasToBlob(canvas));
      }
      saveBlob(await zip.generateAsync({ type: "blob" }), "social-sizes.zip");
      toast.success(s.doneAll);
    } catch {
      toast.error(s.failed);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [srcUrl, fit, bg, s]);

  return (
    <ToolLayout
      title="Social Media Image Resizer"
      description={s.description}
      descriptionId={s.description}
      iconName="Images"
      slug="design/social-resizer"
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
          onFiles={(f) => {
            handleFiles(f);
          }}
          helperText={s.helper}
        />

        {!srcUrl ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.empty}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.emptyDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <label htmlFor="sr-preset" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.presetLabel}
                  </label>
                  <select
                    id="sr-preset"
                    value={activeKey}
                    onChange={(e) => {
                      try {
                        setActiveKey(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.platform} — {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={s.fitLabel}>
                  {(["cover", "contain"] as Fit[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        try {
                          setFit(m);
                        } catch {
                          // ignore
                        }
                      }}
                      aria-pressed={fit === m}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        fit === m
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                      )}
                    >
                      {m === "cover" ? s.fitCover : s.fitContain}
                    </button>
                  ))}
                </div>
                {fit === "contain" && (
                  <div className="flex items-center gap-3">
                    <label htmlFor="sr-bg" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.bgLabel}
                    </label>
                    <input
                      id="sr-bg"
                      type="color"
                      value={bg}
                      onChange={(e) => {
                        try {
                          setBg(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    <span className="text-xs uppercase tabular-nums text-zinc-500 dark:text-zinc-400">{bg}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.preview}</span>
                  <span className="tabular-nums">
                    {active.platform} · {active.w}×{active.h} · {natSize}
                  </span>
                </div>
                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <canvas
                    ref={canvasRef}
                    className="mx-auto h-auto max-h-[60vh] w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button onClick={() => void downloadOne()} disabled={busy} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                    {busy ? s.working : s.downloadOne}
                  </Button>
                  <Button onClick={() => void downloadAll()} disabled={busy} size="lg" variant="outline" className="w-full">
                    <Package className="h-4 w-4" aria-hidden />
                    {s.downloadAll}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
