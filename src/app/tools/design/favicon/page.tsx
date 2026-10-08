"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Copy, Download, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const FAV_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
const ANDROID_SIZES = [192, 512];
const ALL_SIZES = [16, 32, 48, 180, 192, 512];

interface FaviconStrings {
  description: string;
  helper: string;
  empty: string;
  emptyDesc: string;
  previews: string;
  tabMock: string;
  snippetTitle: string;
  copySnippet: string;
  copied: string;
  downloadZip: string;
  working: string;
  needImage: string;
  failed: string;
  done: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, FaviconStrings> = {
  en: {
    description: "Turn any PNG, JPG, or SVG into a full favicon pack — multi-size PNGs, Apple touch icon, Android icons, webmanifest, and HTML snippet. 100% in your browser.",
    helper: "One image up to 10 MB — PNG, JPG, or SVG.",
    empty: "No image yet",
    emptyDesc: "Upload a square-ish logo above and the icon previews plus browser-tab mockup appear here.",
    previews: "Icon previews",
    tabMock: "Browser tab mockup",
    snippetTitle: "HTML snippet",
    copySnippet: "Copy HTML",
    copied: "HTML snippet copied.",
    downloadZip: "Download ZIP pack",
    working: "Building ZIP…",
    needImage: "Upload an image first.",
    failed: "Could not process the image.",
    done: "Favicon pack downloaded.",
    faqQ1: "Is my logo uploaded anywhere?",
    faqA1: "No. Rasterizing and resizing happen on a <canvas> in your browser via the Image API. Nothing leaves your device.",
    faqQ2: "What is inside the ZIP?",
    faqA2: "favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, apple-touch-icon.png (180), android-chrome-192x192.png, android-chrome-512x512.png, and site.webmanifest.",
    faqQ3: "How do I install the pack?",
    faqA3: "Unzip into your public/ folder, copy the HTML snippet into <head>, and add the manifest link. Non-square logos are center-cropped to a square.",
  },
  id: {
    description: "Ubah PNG, JPG, atau SVG apa pun menjadi paket favicon lengkap — PNG multi-ukuran, ikon Apple touch, ikon Android, webmanifest, dan snippet HTML. 100% di browser.",
    helper: "Satu gambar hingga 10 MB — PNG, JPG, atau SVG.",
    empty: "Belum ada gambar",
    emptyDesc: "Unggah logo (sebaiknya persegi) di atas dan pratinjau ikon beserta mockup tab browser muncul di sini.",
    previews: "Pratinjau ikon",
    tabMock: "Mockup tab browser",
    snippetTitle: "Snippet HTML",
    copySnippet: "Salin HTML",
    copied: "Snippet HTML disalin.",
    downloadZip: "Unduh paket ZIP",
    working: "Membuat ZIP…",
    needImage: "Unggah gambar terlebih dahulu.",
    failed: "Gagal memproses gambar.",
    done: "Paket favicon terunduh.",
    faqQ1: "Apakah logo saya diunggah ke mana pun?",
    faqA1: "Tidak. Rasterisasi dan resize terjadi pada <canvas> di browser via Image API. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Apa isi ZIP-nya?",
    faqA2: "favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, apple-touch-icon.png (180), android-chrome-192x192.png, android-chrome-512x512.png, dan site.webmanifest.",
    faqQ3: "Bagaimana cara memasangnya?",
    faqA3: "Ekstrak ke folder public/, salin snippet HTML ke dalam <head>, dan tambahkan link manifest. Logo non-persegi di-crop tengah menjadi persegi.",
  },
};

function buildManifest(): string {
  return JSON.stringify(
    {
      name: "App",
      short_name: "App",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2,
  );
}

function buildSnippet(): string {
  return [
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
  ].join("\n");
}

function renderSquare(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-2d-unavailable");
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (iw > 0 && ih > 0) {
    const side = Math.min(iw, ih);
    const sx = Math.floor((iw - side) / 2);
    const sy = Math.floor((ih - side) / 2);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  }
  return canvas;
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

export default function FaviconPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [icons, setIcons] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
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

  // Rasterize uploaded image (incl. SVG) into every target size
  useEffect(() => {
    if (!srcUrl) {
      setIcons({});
      return;
    }
    let cancelled = false;
    try {
      const img = new Image();
      img.onload = () => {
        try {
          if (cancelled || !mountedRef.current) return;
          const next: Record<number, string> = {};
          for (const size of ALL_SIZES) {
            next[size] = renderSquare(img, size).toDataURL("image/png");
          }
          if (!cancelled && mountedRef.current) setIcons(next);
        } catch {
          if (!cancelled && mountedRef.current) toast.error(s.failed);
        }
      };
      img.onerror = () => {
        try {
          if (!cancelled && mountedRef.current) toast.error(s.failed);
        } catch {
          // ignore
        }
      };
      img.src = srcUrl;
    } catch {
      toast.error(s.failed);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl]);

  const downloadZip = useCallback(async () => {
    if (!srcUrl) {
      toast.error(s.needImage);
      return;
    }
    try {
      setBusy(true);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode-failed"));
        el.src = srcUrl;
      });
      const zip = new JSZip();
      const entries: Array<[string, number]> = [
        ["favicon-16x16.png", 16],
        ["favicon-32x32.png", 32],
        ["favicon-48x48.png", 48],
        ["apple-touch-icon.png", APPLE_SIZE],
        ["android-chrome-192x192.png", 192],
        ["android-chrome-512x512.png", 512],
      ];
      for (const [name, size] of entries) {
        const blob = await canvasToBlob(renderSquare(img, size));
        zip.file(name, blob);
      }
      zip.file("site.webmanifest", buildManifest());
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicon-pack.zip";
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
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [srcUrl, s]);

  const copySnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildSnippet());
      toast.success(s.copied);
    } catch {
      toast.error(s.failed);
    }
  }, [s]);

  const snippet = buildSnippet();
  const hasIcons = Object.keys(icons).length > 0;

  return (
    <ToolLayout
      title="Favicon Generator"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="design/favicon"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/png", "image/jpeg", "image/svg+xml"]}
          multiple={false}
          maxSizeMB={10}
          maxFiles={1}
          onFiles={(f) => {
            handleFiles(f);
          }}
          helperText={s.helper}
        />

        {!hasIcons ? (
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
              <CardContent className="space-y-3 p-4 sm:p-6">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.tabMock}</p>
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
                  </div>
                  <div className="flex items-end gap-0 bg-white px-3 pt-2 dark:bg-zinc-950">
                    <div className="flex max-w-[220px] items-center gap-2 rounded-t-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                      {icons[16] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icons[16]} alt="favicon 16px" width={16} height={16} className="h-4 w-4 shrink-0" />
                      ) : null}
                      <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">My Site</span>
                      <span className="text-xs text-zinc-400" aria-hidden>×</span>
                    </div>
                    <div className="flex-1 border-b border-zinc-200 dark:border-zinc-800" aria-hidden />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.previews}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {FAV_SIZES.map((size) => (
                    <div
                      key={size}
                      className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {icons[size] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icons[size]} alt={`favicon ${size}px`} width={size} height={size} style={{ width: Math.min(size, 48), height: Math.min(size, 48) }} className="image-rendering-auto" />
                      ) : null}
                      <span className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                        {size}×{size}
                      </span>
                    </div>
                  ))}
                  {[
                    { label: `Apple ${APPLE_SIZE}`, size: APPLE_SIZE },
                    ...ANDROID_SIZES.map((size) => ({ label: `Android ${size}`, size })),
                  ].map(({ label, size }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {icons[size] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icons[size]} alt={label} width={48} height={48} className="h-12 w-12 rounded-lg" />
                      ) : null}
                      <span className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                        {label} · {size}×{size}
                      </span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => void downloadZip()} disabled={busy} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                  {busy ? s.working : s.downloadZip}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.snippetTitle}</p>
                  <Button onClick={() => void copySnippet()} variant="outline" size="sm">
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {s.copySnippet}
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100 dark:border-zinc-800">
                  {snippet}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
