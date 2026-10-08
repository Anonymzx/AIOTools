"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, ImagePlus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Tab = "color" | "image";
type HarmonyKey = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic";

const HARMONIES: HarmonyKey[] = ["complementary", "analogous", "triadic", "tetradic", "monochromatic"];

interface PaletteStrings {
  description: string;
  helper: string;
  tabColor: string;
  tabImage: string;
  baseLabel: string;
  harmonyLabel: string;
  complementary: string;
  analogous: string;
  triadic: string;
  tetradic: string;
  monochromatic: string;
  regenerate: string;
  result: string;
  emptyImage: string;
  emptyImageDesc: string;
  copyCss: string;
  downloadCss: string;
  downloadJson: string;
  copied: string;
  failed: string;
  done: string;
  needColors: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, PaletteStrings> = {
  en: {
    description: "Generate harmonious palettes from a base color with real HSL math, or extract the top 8 dominant colors from any image. Click to copy, export CSS variables or JSON — all in your browser.",
    helper: "One image up to 10 MB — JPG, PNG, WebP.",
    tabColor: "From color",
    tabImage: "From image",
    baseLabel: "Base color",
    harmonyLabel: "Harmony rule",
    complementary: "Complementary",
    analogous: "Analogous",
    triadic: "Triadic",
    tetradic: "Tetradic",
    monochromatic: "Monochromatic",
    regenerate: "Regenerate (rotate hue)",
    result: "Palette",
    emptyImage: "No image yet",
    emptyImageDesc: "Upload an image above and its 8 dominant colors appear here.",
    copyCss: "Copy CSS",
    downloadCss: "CSS",
    downloadJson: "JSON",
    copied: "Copied to clipboard.",
    failed: "Could not process the request.",
    done: "File downloaded.",
    needColors: "No colors to export yet.",
    faqQ1: "How are harmonies calculated?",
    faqA1: "Your base color is converted to HSL, then hue rotations are applied: +180° complementary, ±30° analogous, +120°/+240° triadic, +90°/+180°/+270° tetradic, and lightness steps for monochromatic.",
    faqQ2: "How are image colors extracted?",
    faqA2: "The image is downscaled to 64px on a <canvas>, pixels are bucket-quantized, and the 8 most frequent buckets win. Everything runs locally.",
    faqQ3: "Is anything uploaded?",
    faqA3: "No. Color math and image quantization happen entirely in your browser tab.",
  },
  id: {
    description: "Hasilkan palet harmonis dari warna dasar dengan matematika HSL asli, atau ekstrak 8 warna dominan dari gambar apa pun. Klik untuk salin, ekspor CSS variables atau JSON — semua di browser.",
    helper: "Satu gambar hingga 10 MB — JPG, PNG, WebP.",
    tabColor: "Dari warna",
    tabImage: "Dari gambar",
    baseLabel: "Warna dasar",
    harmonyLabel: "Aturan harmoni",
    complementary: "Komplementer",
    analogous: "Analog",
    triadic: "Triadik",
    tetradic: "Tetradik",
    monochromatic: "Monokromatik",
    regenerate: "Regenerasi (putar hue)",
    result: "Palet",
    emptyImage: "Belum ada gambar",
    emptyImageDesc: "Unggah gambar di atas dan 8 warna dominannya muncul di sini.",
    copyCss: "Salin CSS",
    downloadCss: "CSS",
    downloadJson: "JSON",
    copied: "Disalin ke clipboard.",
    failed: "Gagal memproses permintaan.",
    done: "File terunduh.",
    needColors: "Belum ada warna untuk diekspor.",
    faqQ1: "Bagaimana harmoni dihitung?",
    faqA1: "Warna dasar dikonversi ke HSL, lalu rotasi hue diterapkan: +180° komplementer, ±30° analog, +120°/+240° triadik, +90°/+180°/+270° tetradik, dan langkah lightness untuk monokromatik.",
    faqQ2: "Bagaimana warna gambar diekstrak?",
    faqA2: "Gambar di-downscale ke 64px pada <canvas>, piksel dikuantisasi per bucket, dan 8 bucket paling sering menang. Semua berjalan lokal.",
    faqQ3: "Apakah ada yang diunggah?",
    faqA3: "Tidak. Matematika warna dan kuantisasi gambar terjadi sepenuhnya di tab browser Anda.",
  },
};

function clampNum(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const p = (n: number) => clampNum(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = clampNum(s, 0, 1);
  const ln = clampNum(l, 0, 1);
  if (sn === 0) {
    const v = ln * 255;
    return rgbToHex(v, v, v);
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const tc = [hn + 1 / 3, hn, hn - 1 / 3].map((t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  });
  return rgbToHex(tc[0] * 255, tc[1] * 255, tc[2] * 255);
}

function rotateHue(hex: string, deg: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToHex(h + deg, s, l);
}

function harmony(hex: string, kind: HarmonyKey): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  switch (kind) {
    case "complementary":
      return [hex.toLowerCase(), hslToHex(h + 180, s, l)];
    case "analogous":
      return [hslToHex(h - 30, s, l), hex.toLowerCase(), hslToHex(h + 30, s, l)];
    case "triadic":
      return [hex.toLowerCase(), hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)];
    case "tetradic":
      return [hex.toLowerCase(), hslToHex(h + 90, s, l), hslToHex(h + 180, s, l), hslToHex(h + 270, s, l)];
    case "monochromatic":
      return [
        hslToHex(h, s, l - 0.3),
        hslToHex(h, s, l - 0.15),
        hex.toLowerCase(),
        hslToHex(h, s, l + 0.15),
        hslToHex(h, s, l + 0.3),
      ];
  }
}

function fmtRgb(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "—";
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function fmtHsl(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "—";
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function buildCss(colors: string[]): string {
  return `:root {\n${colors.map((c, i) => `  --palette-${i + 1}: ${c};`).join("\n")}\n}`;
}

function buildJson(colors: string[]): string {
  return JSON.stringify(
    colors.map((hex) => ({ hex, rgb: fmtRgb(hex), hsl: fmtHsl(hex) })),
    null,
    2,
  );
}

export default function PalettePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [tab, setTab] = useState<Tab>("color");
  const [base, setBase] = useState("#6366f1");
  const [kind, setKind] = useState<HarmonyKey>("complementary");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgColors, setImgColors] = useState<string[]>([]);

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

  const colors = tab === "color" ? harmony(base, kind) : imgColors;

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
        setImgUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Quantize uploaded image → top 8 dominant colors
  useEffect(() => {
    if (tab !== "image" || !imgUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("decode-failed"));
          el.src = imgUrl;
        });
        if (cancelled || !mountedRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas-2d-unavailable");
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
          const cur = buckets.get(key);
          if (cur) {
            cur.count += 1;
            cur.r += r;
            cur.g += g;
            cur.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }
        const top8 = Array.from(buckets.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map((e) => rgbToHex(e.r / e.count, e.g / e.count, e.b / e.count));
        if (!cancelled && mountedRef.current) setImgColors(top8);
      } catch {
        if (!cancelled && mountedRef.current) toast.error(s.failed);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, imgUrl]);

  const copyHex = useCallback(
    async (hex: string) => {
      try {
        await navigator.clipboard.writeText(hex);
        toast.success(s.copied);
      } catch {
        toast.error(s.failed);
      }
    },
    [s],
  );

  const copyCss = useCallback(async () => {
    if (colors.length === 0) {
      toast.error(s.needColors);
      return;
    }
    try {
      await navigator.clipboard.writeText(buildCss(colors));
      toast.success(s.copied);
    } catch {
      toast.error(s.failed);
    }
  }, [colors, s]);

  const downloadFile = useCallback(
    (content: string, name: string, type: string) => {
      if (colors.length === 0) {
        toast.error(s.needColors);
        return;
      }
      try {
        const blob = new Blob([content], { type });
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
        toast.success(s.done);
      } catch {
        toast.error(s.failed);
      }
    },
    [colors, s],
  );

  const harmonyName = (k: HarmonyKey): string => {
    if (k === "complementary") return s.complementary;
    if (k === "analogous") return s.analogous;
    if (k === "triadic") return s.triadic;
    if (k === "tetradic") return s.tetradic;
    return s.monochromatic;
  };

  return (
    <ToolLayout
      title="Color Palette Generator"
      description={s.description}
      descriptionId={s.description}
      iconName="Droplets"
      slug="design/palette"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <div className="flex gap-2" role="tablist" aria-label="palette-mode">
          {(["color", "image"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                try {
                  setTab(t);
                } catch {
                  // ignore
                }
              }}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                tab === t
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
              )}
            >
              {t === "color" ? s.tabColor : s.tabImage}
            </button>
          ))}
        </div>

        {tab === "color" ? (
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="pal-base" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.baseLabel}
                </label>
                <input
                  id="pal-base"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(base) ? base : "#6366f1"}
                  onChange={(e) => {
                    try {
                      setBase(e.target.value.toLowerCase());
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
                <input
                  type="text"
                  value={base}
                  maxLength={7}
                  spellCheck={false}
                  aria-label={s.baseLabel}
                  onChange={(e) => {
                    try {
                      const v = e.target.value.toLowerCase();
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBase(v);
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-28 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm lowercase text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.harmonyLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.harmonyLabel}>
                  {HARMONIES.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        try {
                          setKind(k);
                        } catch {
                          // ignore
                        }
                      }}
                      aria-pressed={kind === k}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        kind === k
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                      )}
                    >
                      {harmonyName(k)}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => {
                  try {
                    setBase((b) => rotateHue(/^#[0-9a-fA-F]{6}$/.test(b) ? b : "#6366f1", 30));
                  } catch {
                    // ignore
                  }
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Shuffle className="h-4 w-4" aria-hidden />
                {s.regenerate}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FileDropzone
            accept={["image/jpeg", "image/png", "image/webp"]}
            multiple={false}
            maxSizeMB={10}
            maxFiles={1}
            onFiles={(f) => {
              handleFiles(f);
            }}
            helperText={s.helper}
          />
        )}

        {colors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.emptyImage}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.emptyImageDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {s.result} · <span className="tabular-nums">{colors.length}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => void copyHex(c)}
                    className="overflow-hidden rounded-xl border border-zinc-200 text-left transition-all hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800"
                  >
                    <span className="block h-20 w-full" style={{ backgroundColor: c }} aria-hidden />
                    <span className="block space-y-0.5 bg-white p-2 dark:bg-zinc-900">
                      <span className="block font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">{c}</span>
                      <span className="block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{fmtRgb(c)}</span>
                      <span className="block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{fmtHsl(c)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button onClick={() => void copyCss()} variant="outline" className="w-full">
                  <Copy className="h-4 w-4" aria-hidden />
                  {s.copyCss}
                </Button>
                <Button onClick={() => downloadFile(buildCss(colors), "palette.css", "text/css;charset=utf-8")} variant="outline" className="w-full">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.downloadCss}
                </Button>
                <Button onClick={() => downloadFile(buildJson(colors), "palette.json", "application/json;charset=utf-8")} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.downloadJson}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
