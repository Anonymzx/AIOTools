"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { toast } from "sonner";
import { Barcode, Download, Eraser, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BarcodeFormat = "CODE128" | "CODE39" | "EAN13" | "UPC" | "ITF";

const FORMATS: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13" },
  { value: "UPC", label: "UPC-A" },
  { value: "ITF", label: "ITF" },
];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    valueLabel: string;
    valuePlaceholder: string;
    formatLabel: string;
    widthLabel: string;
    heightLabel: string;
    fgLabel: string;
    bgLabel: string;
    showTextLabel: string;
    fontSizeLabel: string;
    on: string;
    off: string;
    previewLabel: string;
    emptyPreview: string;
    downloadSvg: string;
    downloadPng: string;
    downloadedSvg: string;
    downloadedPng: string;
    downloadFailed: string;
    nothingToDownload: string;
    clear: string;
    cleared: string;
    error: string;
    qrNote: string;
    errRequired: string;
    errCode39: string;
    errEan13: string;
    errUpc: string;
    errItfDigits: string;
    errItfEven: string;
    errAscii: string;
    invalidTitle: string;
  }
> = {
  en: {
    title: "Barcode Generator",
    description:
      "Create Code 128, Code 39, EAN-13, UPC-A, and ITF barcodes with live preview. Tune bar width, height, colors, and labels — everything runs locally in your browser.",
    valueLabel: "Text / number",
    valuePlaceholder: "Type the value to encode…",
    formatLabel: "Format",
    widthLabel: "Bar width",
    heightLabel: "Height",
    fgLabel: "Bars",
    bgLabel: "Background",
    showTextLabel: "Show value text",
    fontSizeLabel: "Text size",
    on: "On",
    off: "Off",
    previewLabel: "Live preview",
    emptyPreview: "Enter a valid value above to preview the barcode.",
    downloadSvg: "Download SVG",
    downloadPng: "Download PNG (3×)",
    downloadedSvg: "Barcode SVG downloaded.",
    downloadedPng: "Barcode PNG downloaded.",
    downloadFailed: "Failed to download the barcode.",
    nothingToDownload: "Enter a valid value first.",
    clear: "Clear",
    cleared: "Input cleared.",
    error: "Something went wrong.",
    qrNote: "Need a QR code instead? Use the QR Code Generator tool — this one covers linear (1D) barcodes only.",
    errRequired: "Enter a value first.",
    errCode39: "Code 39 allows only A–Z, 0–9, space and - . $ / + %.",
    errEan13: "EAN-13 needs 12 or 13 digits (numbers only).",
    errUpc: "UPC-A needs 11 or 12 digits (numbers only).",
    errItfDigits: "ITF needs digits only (numbers 0–9).",
    errItfEven: "ITF needs an even number of digits.",
    errAscii: "Code 128 needs plain ASCII text (no emoji or non-Latin characters).",
    invalidTitle: "Invalid value for this format.",
  },
  id: {
    title: "Pembuat Barcode",
    description:
      "Buat barcode Code 128, Code 39, EAN-13, UPC-A, dan ITF dengan pratinjau langsung. Atur lebar bar, tinggi, warna, dan label — semuanya berjalan lokal di browser.",
    valueLabel: "Teks / angka",
    valuePlaceholder: "Ketik nilai untuk di-encode…",
    formatLabel: "Format",
    widthLabel: "Lebar bar",
    heightLabel: "Tinggi",
    fgLabel: "Bar",
    bgLabel: "Latar",
    showTextLabel: "Tampilkan teks nilai",
    fontSizeLabel: "Ukuran teks",
    on: "Nyala",
    off: "Mati",
    previewLabel: "Pratinjau langsung",
    emptyPreview: "Masukkan nilai valid di atas untuk pratinjau barcode.",
    downloadSvg: "Unduh SVG",
    downloadPng: "Unduh PNG (3×)",
    downloadedSvg: "Barcode SVG terunduh.",
    downloadedPng: "Barcode PNG terunduh.",
    downloadFailed: "Gagal mengunduh barcode.",
    nothingToDownload: "Masukkan nilai valid terlebih dahulu.",
    clear: "Bersihkan",
    cleared: "Masukan dibersihkan.",
    error: "Terjadi kesalahan.",
    qrNote: "Butuh kode QR? Pakai tool QR Code Generator — tool ini khusus barcode linear (1D).",
    errRequired: "Isi nilai terlebih dahulu.",
    errCode39: "Code 39 hanya mengizinkan A–Z, 0–9, spasi dan - . $ / + %.",
    errEan13: "EAN-13 butuh 12 atau 13 digit (angka saja).",
    errUpc: "UPC-A butuh 11 atau 12 digit (angka saja).",
    errItfDigits: "ITF butuh digit saja (angka 0–9).",
    errItfEven: "ITF butuh jumlah digit genap.",
    errAscii: "Code 128 butuh teks ASCII biasa (tanpa emoji atau karakter non-Latin).",
    invalidTitle: "Nilai tidak valid untuk format ini.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Which format should I choose?",
      a: "Code 128 is the best general choice — compact and accepts any ASCII text. Code 39 is older and limited to 43 characters. EAN-13 (12–13 digits) is the retail standard outside North America, UPC-A (11–12 digits) inside it, and ITF encodes even-length digit pairs for cartons. For QR codes, use the separate QR Code Generator.",
    },
    id: {
      q: "Format mana yang harus dipilih?",
      a: "Code 128 pilihan umum terbaik — ringkas dan menerima teks ASCII apa pun. Code 39 lebih tua dan terbatas 43 karakter. EAN-13 (12–13 digit) standar ritel di luar Amerika Utara, UPC-A (11–12 digit) di dalamnya, dan ITF meng-encode pasangan digit genap untuk karton. Untuk kode QR, pakai QR Code Generator terpisah.",
    },
  },
  {
    en: {
      q: "Why does my EAN-13 / UPC-A / ITF value get rejected?",
      a: "These formats carry strict rules: EAN-13 needs 12–13 digits, UPC-A needs 11–12 digits, and ITF needs digits only in an even count. The check digit is computed automatically when you enter one digit short. Anything else is rejected inline before rendering so the barcode never silently mis-encodes.",
    },
    id: {
      q: "Kenapa nilai EAN-13 / UPC-A / ITF-ku ditolak?",
      a: "Format ini punya aturan ketat: EAN-13 butuh 12–13 digit, UPC-A butuh 11–12 digit, dan ITF butuh digit saja berjumlah genap. Digit cek dihitung otomatis bila kamu memasukkan kurang satu digit. Selain itu ditolak langsung sebelum render agar barcode tak salah encode diam-diam.",
    },
  },
  {
    en: {
      q: "What is the difference between SVG and PNG download?",
      a: "SVG is vector — infinitely scalable with tiny size, ideal for print and packaging. PNG is rasterized at 3× scale for apps that need pixels (marketplaces, documents). Both use your exact colors and label settings.",
    },
    id: {
      q: "Apa beda unduhan SVG dan PNG?",
      a: "SVG adalah vektor — bisa diperbesar tanpa batas dengan ukuran mungil, ideal untuk cetak dan kemasan. PNG di-raster pada skala 3× untuk aplikasi yang butuh piksel (marketplace, dokumen). Keduanya memakai warna dan pengaturan label yang persis sama.",
    },
  },
  {
    en: {
      q: "Is my data uploaded anywhere?",
      a: "No. Rendering with JsBarcode and both export paths run entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah dataku diunggah ke mana pun?",
      a: "Tidak. Rendering dengan JsBarcode dan kedua jalur ekspor berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const CODE39_RE = /^[A-Z0-9 \-.+/$%]*$/;
const DIGITS_RE = /^[0-9]+$/;

function validateValue(value: string, format: BarcodeFormat, s: (typeof STR)["en"]): string | null {
  try {
    const v = value.trim();
    if (v.length === 0) return s.errRequired;
    switch (format) {
      case "CODE128":
        // eslint-disable-next-line no-control-regex
        return /^[\x20-\x7E]*$/.test(v) && v.length > 0 ? null : s.errAscii;
      case "CODE39":
        return CODE39_RE.test(v.toUpperCase()) ? null : s.errCode39;
      case "EAN13":
        return DIGITS_RE.test(v) && (v.length === 12 || v.length === 13) ? null : s.errEan13;
      case "UPC":
        return DIGITS_RE.test(v) && (v.length === 11 || v.length === 12) ? null : s.errUpc;
      case "ITF":
        if (!DIGITS_RE.test(v)) return s.errItfDigits;
        return v.length % 2 === 0 ? null : s.errItfEven;
      default:
        return s.errRequired;
    }
  } catch {
    return s.errRequired;
  }
}

export default function BarcodePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [value, setValue] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");
  const [showText, setShowText] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [renderError, setRenderError] = useState<string | null>(null);

  const validationError = validateValue(value, format, s);
  const canRender = validationError === null;

  useEffect(() => {
    try {
      setRenderError(null);
      const node = svgRef.current;
      if (!node || !canRender) return;
      JsBarcode(node, format === "CODE39" ? value.trim().toUpperCase() : value.trim(), {
        format,
        width: barWidth,
        height,
        displayValue: showText,
        fontSize,
        lineColor: fg,
        background: bg,
        margin: 10,
      });
    } catch {
      try {
        setRenderError(s.invalidTitle);
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format, barWidth, height, fg, bg, showText, fontSize, canRender]);

  const handleClear = (): void => {
    try {
      setValue("");
      setRenderError(null);
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownloadSvg = (): void => {
    try {
      const node = svgRef.current;
      if (!node || !canRender) {
        toast.error(s.nothingToDownload);
        return;
      }
      const markup = new XMLSerializer().serializeToString(node);
      const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode-${format.toLowerCase()}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(s.downloadedSvg);
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
      toast.error(s.downloadFailed);
    }
  };

  const handleDownloadPng = async (): Promise<void> => {
    try {
      const node = svgRef.current;
      if (!node || !canRender) {
        toast.error(s.nothingToDownload);
        return;
      }
      const markup = new XMLSerializer().serializeToString(node);
      const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          try {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error("raster-failed"));
            im.src = svgUrl;
          } catch {
            reject(new Error("raster-failed"));
          }
        });
        const SCALE = 3;
        const w = Math.max(1, (img.naturalWidth || 300) * SCALE);
        const h = Math.max(1, (img.naturalHeight || 150) * SCALE);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-2d-context");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const blob = await new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob((b) => resolve(b), "image/png");
          } catch {
            resolve(null);
          }
        });
        if (!blob) throw new Error("encode-failed");
        const url = URL.createObjectURL(blob);
        try {
          const a = document.createElement("a");
          a.href = url;
          a.download = `barcode-${format.toLowerCase()}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast.success(s.downloadedPng);
        } finally {
          window.setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // ignore
            }
          }, 4000);
        }
      } finally {
        try {
          URL.revokeObjectURL(svgUrl);
        } catch {
          // ignore
        }
      }
    } catch {
      toast.error(s.downloadFailed);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Binary"
      slug="text/barcode"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="bc-value"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.valueLabel}
                </label>
                <input
                  id="bc-value"
                  value={value}
                  onChange={(e) => {
                    try {
                      setValue(e.target.value);
                      setRenderError(null);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.valuePlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
                {value.length > 0 && validationError && (
                  <div
                    role="alert"
                    className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                  >
                    <p className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {validationError}
                    </p>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.formatLabel}
                </p>
                <div role="group" aria-label={s.formatLabel} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => {
                        try {
                          setFormat(f.value);
                          setRenderError(null);
                        } catch {
                          // ignore
                        }
                      }}
                      aria-pressed={format === f.value}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-center text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        format === f.value
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="bc-width"
                  className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.widthLabel}
                  <Badge variant="secondary" className="font-mono">
                    {barWidth}
                  </Badge>
                </label>
                <input
                  id="bc-width"
                  type="range"
                  min={1}
                  max={4}
                  step={0.5}
                  value={barWidth}
                  onChange={(e) => {
                    try {
                      setBarWidth(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
              <div>
                <label
                  htmlFor="bc-height"
                  className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.heightLabel}
                  <Badge variant="secondary" className="font-mono">
                    {height}px
                  </Badge>
                </label>
                <input
                  id="bc-height"
                  type="range"
                  min={40}
                  max={200}
                  step={5}
                  value={height}
                  onChange={(e) => {
                    try {
                      setHeight(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="bc-fg"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.fgLabel}
                  </label>
                  <span className="mt-2 flex items-center gap-2">
                    <input
                      id="bc-fg"
                      type="color"
                      value={fg}
                      onChange={(e) => {
                        try {
                          setFg(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
                    />
                    <code className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{fg}</code>
                  </span>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="bc-bg"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.bgLabel}
                  </label>
                  <span className="mt-2 flex items-center gap-2">
                    <input
                      id="bc-bg"
                      type="color"
                      value={bg}
                      onChange={(e) => {
                        try {
                          setBg(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
                    />
                    <code className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{bg}</code>
                  </span>
                </div>
              </div>

              <div>
                <span className="flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.showTextLabel}
                  <Badge variant="secondary">{showText ? s.on : s.off}</Badge>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showText}
                  aria-label={s.showTextLabel}
                  onClick={() => {
                    try {
                      setShowText((v) => !v);
                    } catch {
                      // ignore
                    }
                  }}
                  className={cn(
                    "mt-2 flex h-9 w-full items-center rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                    showText
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400",
                  )}
                >
                  {showText ? s.on : s.off}
                </button>
                <label
                  htmlFor="bc-font"
                  className="mt-3 flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.fontSizeLabel}
                  <Badge variant="secondary" className="font-mono">
                    {fontSize}px
                  </Badge>
                </label>
                <input
                  id="bc-font"
                  type="range"
                  min={10}
                  max={36}
                  step={1}
                  value={fontSize}
                  disabled={!showText}
                  onChange={(e) => {
                    try {
                      setFontSize(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600 disabled:opacity-40"
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.qrNote}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.previewLabel}
            </p>
            {canRender && !renderError ? (
              <svg
                ref={svgRef}
                role="img"
                aria-label={`${s.previewLabel}: ${value.trim()}`}
                className="max-h-64 w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Barcode className="h-6 w-6" aria-hidden />
                </span>
                <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {renderError ?? s.emptyPreview}
                </p>
                {/* Hidden svg keeps ref mounted so JsBarcode never dereferences null */}
                <svg ref={svgRef} aria-hidden className="hidden" />
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                onClick={handleDownloadSvg}
                disabled={!canRender}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <Download aria-hidden />
                {s.downloadSvg}
              </Button>
              <Button
                onClick={() => void handleDownloadPng()}
                disabled={!canRender}
                variant="secondary"
              >
                <Download aria-hidden />
                {s.downloadPng}
              </Button>
              <Button onClick={handleClear} variant="outline" disabled={value.length === 0}>
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
