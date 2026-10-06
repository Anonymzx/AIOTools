"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont } from "pdf-lib";
import { toast } from "sonner";
import { Download, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FontId = "helvetica" | "times" | "courier";
type PositionId = "center" | "diagonal" | "tiled";
type PagesMode = "all" | "range";
type ColorId = "gray" | "red" | "blue" | "black";

const FONTS: FontId[] = ["helvetica", "times", "courier"];
const POSITIONS: PositionId[] = ["center", "diagonal", "tiled"];
const COLORS: ColorId[] = ["gray", "red", "blue", "black"];

const STD_FONT: Record<FontId, (typeof StandardFonts)[keyof typeof StandardFonts]> = {
  helvetica: StandardFonts.Helvetica,
  times: StandardFonts.TimesRoman,
  courier: StandardFonts.Courier,
};

const COLOR_RGB: Record<ColorId, { r: number; g: number; b: number }> = {
  gray: { r: 0.5, g: 0.5, b: 0.5 },
  red: { r: 0.8, g: 0.1, b: 0.1 },
  blue: { r: 0.15, g: 0.35, b: 0.85 },
  black: { r: 0, g: 0, b: 0 },
};

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    encryptedPdf: (name: string) => string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    loading: string;
    applying: string;
    textLabel: string;
    textPlaceholder: string;
    fontLabel: string;
    fontName: (f: FontId) => string;
    sizeLabel: (n: number) => string;
    opacityLabel: (n: number) => string;
    colorLabel: string;
    colorName: (c: ColorId) => string;
    positionLabel: string;
    positionName: (p: PositionId) => string;
    positionDesc: (p: PositionId) => string;
    pagesLabel: string;
    pagesAll: string;
    pagesRange: string;
    rangePlaceholder: string;
    rangeHint: string;
    rangeInvalid: string;
    noText: string;
    apply: string;
    applySuccess: string;
    applyFailed: string;
    noFile: string;
    error: string;
    pagesUnit: string;
  }
> = {
  en: {
    title: "PDF Watermark",
    description:
      "Stamp diagonal or tiled text watermarks onto any PDF — DRAFT, CONFIDENTIAL, your name. Everything runs locally in your browser.",
    descriptionId:
      "Bubuhkan watermark teks diagonal atau ubin pada PDF apa pun — DRAFT, CONFIDENTIAL, namamu. Semua berjalan lokal di browser.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    encryptedPdf: (name) =>
      `Could not open "${name}" — it is encrypted or password-protected. Remove the password first, then try again.`,
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Loading pages...",
    applying: "Stamping...",
    textLabel: "Watermark text",
    textPlaceholder: "e.g. CONFIDENTIAL",
    fontLabel: "Font",
    fontName: (f) => ({ helvetica: "Helvetica", times: "Times", courier: "Courier" })[f],
    sizeLabel: (n) => `Font size · ${n}pt`,
    opacityLabel: (n) => `Opacity · ${Math.round(n * 100)}%`,
    colorLabel: "Color",
    colorName: (c) => ({ gray: "Gray", red: "Red", blue: "Blue", black: "Black" })[c],
    positionLabel: "Position",
    positionName: (p) => ({ center: "Center", diagonal: "Diagonal −45°", tiled: "Tiled 3×3" })[p],
    positionDesc: (p) =>
      ({
        center: "One stamp in the middle of each page.",
        diagonal: "One large stamp rotated −45° across each page.",
        tiled: "Nine stamps in a 3×3 grid on each page.",
      })[p],
    pagesLabel: "Pages",
    pagesAll: "All pages",
    pagesRange: "Page range",
    rangePlaceholder: 'e.g. "1-3,5"',
    rangeHint: 'Comma-separated pages and ranges, e.g. "1-3,5". Numbering starts at 1.',
    rangeInvalid: "Page range is invalid. Use e.g. “1-3,5”.",
    noText: "Enter the watermark text first.",
    apply: "Download watermarked PDF",
    applySuccess: "Watermarked PDF downloaded as watermarked.pdf.",
    applyFailed: "Failed to add the watermark. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
    pagesUnit: "pages",
  },
  id: {
    title: "Watermark PDF",
    description:
      "Bubuhkan watermark teks diagonal atau ubin pada PDF apa pun — DRAFT, CONFIDENTIAL, namamu. Semua berjalan lokal di browser.",
    descriptionId:
      "Bubuhkan watermark teks diagonal atau ubin pada PDF apa pun — DRAFT, CONFIDENTIAL, namamu. Semua berjalan lokal di browser.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    encryptedPdf: (name) =>
      `Tidak dapat membuka "${name}" — file terenkripsi atau diproteksi kata sandi. Hapus kata sandinya dulu, lalu coba lagi.`,
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Memuat halaman...",
    applying: "Membubuhkan...",
    textLabel: "Teks watermark",
    textPlaceholder: "mis. RAHASIA",
    fontLabel: "Font",
    fontName: (f) => ({ helvetica: "Helvetica", times: "Times", courier: "Courier" })[f],
    sizeLabel: (n) => `Ukuran font · ${n}pt`,
    opacityLabel: (n) => `Opasitas · ${Math.round(n * 100)}%`,
    colorLabel: "Warna",
    colorName: (c) => ({ gray: "Abu-abu", red: "Merah", blue: "Biru", black: "Hitam" })[c],
    positionLabel: "Posisi",
    positionName: (p) => ({ center: "Tengah", diagonal: "Diagonal −45°", tiled: "Ubin 3×3" })[p],
    positionDesc: (p) =>
      ({
        center: "Satu cap di tengah tiap halaman.",
        diagonal: "Satu cap besar diputar −45° di tiap halaman.",
        tiled: "Sembilan cap dalam grid 3×3 di tiap halaman.",
      })[p],
    pagesLabel: "Halaman",
    pagesAll: "Semua halaman",
    pagesRange: "Rentang halaman",
    rangePlaceholder: 'mis. "1-3,5"',
    rangeHint: 'Halaman dan rentang dipisah koma, mis. "1-3,5". Penomoran mulai dari 1.',
    rangeInvalid: "Rentang halaman tidak valid. Gunakan mis. “1-3,5”.",
    noText: "Isi teks watermark terlebih dahulu.",
    apply: "Unduh PDF berwatermark",
    applySuccess: "PDF berwatermark diunduh sebagai watermarked.pdf.",
    applyFailed: "Gagal menambahkan watermark. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
    pagesUnit: "halaman",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Will the watermark cover my content?",
      a: "It sits on top of the page, so keep opacity low (20–40%) for reading underneath. Tiled mode repeats the text so it is visible everywhere; Center keeps a single stamp in the middle.",
    },
    id: {
      q: "Apakah watermark menutupi isi dokumen?",
      a: "Watermark berada di atas halaman, jadi gunakan opasitas rendah (20–40%) agar teks di bawahnya tetap terbaca. Mode ubin mengulang teks agar terlihat di mana-mana; Tengah menaruh satu cap di tengah.",
    },
  },
  {
    en: {
      q: "How do I watermark only some pages?",
      a: "Choose Page range and type e.g. “1-3,5” — pages 1, 2, 3, and 5 get stamped. Page numbers start at 1, and anything outside your document is ignored.",
    },
    id: {
      q: "Bagaimana memberi watermark hanya beberapa halaman?",
      a: "Pilih Rentang halaman lalu ketik mis. “1-3,5” — halaman 1, 2, 3, dan 5 diberi cap. Penomoran mulai dari 1, dan nomor di luar dokumen diabaikan.",
    },
  },
  {
    en: {
      q: "Is my PDF uploaded to a server?",
      a: "No. Stamping uses pdf-lib entirely on your device. Your document never leaves your browser.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Pembubuhan memakai pdf-lib sepenuhnya di perangkatmu. Dokumen tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "Can the watermark be removed later?",
      a: "It is drawn as regular page text, not a security feature — anyone with a PDF editor can delete it. For legal protection, keep your original unstamped copy.",
    },
    id: {
      q: "Bisakah watermark dihapus nanti?",
      a: "Watermark digambar sebagai teks halaman biasa, bukan fitur keamanan — siapa pun dengan editor PDF bisa menghapusnya. Untuk perlindungan hukum, simpan salinan aslimu yang belum dicap.",
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

function parseRange(input: string, total: number): number[] | null {
  try {
    const out = new Set<number>();
    const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    for (const part of parts) {
      const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
      if (!m) return null;
      const a = parseInt(m[1] ?? "", 10);
      const bRaw = m[2] ?? "";
      const b = bRaw === "" ? a : parseInt(bRaw, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < 1) return null;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let n = lo; n <= hi; n++) {
        if (n >= 1 && n <= total) out.add(n - 1);
      }
    }
    if (out.size === 0) return null;
    return Array.from(out).sort((x, y) => x - y);
  } catch {
    return null;
  }
}

export default function PdfWatermarkPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const [text, setText] = useState("");
  const [fontId, setFontId] = useState<FontId>("helvetica");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [colorId, setColorId] = useState<ColorId>("gray");
  const [position, setPosition] = useState<PositionId>("diagonal");
  const [pagesMode, setPagesMode] = useState<PagesMode>("all");
  const [range, setRange] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadFile = async (picked: File): Promise<void> => {
    setLoading(true);
    setPageCount(0);
    try {
      const bytes = await picked.arrayBuffer();
      if (!mountedRef.current) return;
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        if (!mountedRef.current) return;
        toast.error(s.encryptedPdf(picked.name));
        setFile(null);
        setDzKey((k) => k + 1);
        return;
      }
      const n = doc.getPageCount();
      if (n === 0) throw new Error(s.invalidPdf);
      if (!mountedRef.current) return;
      setPageCount(n);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error && err.message ? ` ${err.message}` : "";
      toast.error(`${picked.name} ${s.invalidPdf}${msg}`);
      setFile(null);
      setPageCount(0);
      setDzKey((k) => k + 1);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      setDzKey((k) => k + 1);
      if (!picked) return;
      if (!/\.pdf$/i.test(picked.name)) {
        toast.error(`${picked.name} ${s.invalidType}`);
        return;
      }
      setFile(picked);
      void loadFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setFile(null);
      setPageCount(0);
      setApplying(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleApply = async (): Promise<void> => {
    if (!file || applying) {
      if (!file) toast.error(s.noFile);
      return;
    }
    const label = text.trim();
    if (!label) {
      toast.error(s.noText);
      return;
    }
    let targets: number[];
    if (pagesMode === "all") {
      targets = Array.from({ length: pageCount }, (_, i) => i);
    } else {
      const parsed = parseRange(range, pageCount);
      if (!parsed) {
        toast.error(s.rangeInvalid);
        return;
      }
      targets = parsed;
    }
    setApplying(true);
    try {
      const bytes = await file.arrayBuffer();
      if (!mountedRef.current) return;
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        toast.error(s.encryptedPdf(file.name));
        return;
      }
      let font: PDFFont;
      try {
        font = await doc.embedFont(STD_FONT[fontId]);
      } catch {
        toast.error(s.applyFailed);
        return;
      }
      const c = COLOR_RGB[colorId];
      const color = rgb(c.r, c.g, c.b);
      const angle = position === "center" ? 0 : -45;
      for (const idx of targets) {
        try {
          const page = doc.getPage(idx);
          if (!page) continue;
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(label, fontSize);
          if (position === "tiled") {
            for (let gx = 1; gx <= 3; gx++) {
              for (let gy = 1; gy <= 3; gy++) {
                page.drawText(label, {
                  x: (width * gx) / 4 - textWidth / 2,
                  y: (height * gy) / 4,
                  size: fontSize,
                  font,
                  color,
                  opacity,
                  rotate: degrees(angle),
                });
              }
            }
          } else {
            page.drawText(label, {
              x: (width - textWidth) / 2,
              y: height / 2,
              size: fontSize,
              font,
              color,
              opacity,
              rotate: degrees(angle),
            });
          }
        } catch {
          // skip pages that fail to stamp; continue with the rest
        }
      }
      const saved = await doc.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "watermarked.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.applyFailed);
        return;
      }
      toast.success(s.applySuccess);
    } catch {
      if (mountedRef.current) toast.error(s.applyFailed);
    } finally {
      if (mountedRef.current) setApplying(false);
    }
  };

  const busy = loading || applying;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="Droplets"
      slug="pdf/watermark"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={{ "application/pdf": [".pdf"] }}
              multiple={false}
              maxSizeMB={50}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />

            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {s.fileLabel}
                  </span>
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {file.name}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {formatSize(file.size)}
                    {pageCount > 0 ? ` · ${pageCount} ${s.pagesUnit}` : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={busy}
                  aria-label={`${s.removeFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            {loading && (
              <p role="status" className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {s.loading}
              </p>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              100% processed in your browser. Files never leave your device.
            </p>
          </CardContent>
        </Card>

        {file && pageCount > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.textLabel}
                </span>
                <Input
                  value={text}
                  onChange={(e) => {
                    try {
                      setText(e.target.value);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  placeholder={s.textPlaceholder}
                  disabled={busy}
                  maxLength={80}
                  className="w-full"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.fontLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {FONTS.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      variant={fontId === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFontId(f)}
                      disabled={busy}
                      className={cn(fontId === f && "bg-indigo-600 text-white hover:bg-indigo-700")}
                    >
                      {s.fontName(f)}
                    </Button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.sizeLabel(fontSize)}
                </span>
                <input
                  type="range"
                  min={12}
                  max={96}
                  step={1}
                  value={fontSize}
                  disabled={busy}
                  onChange={(e) => {
                    try {
                      setFontSize(Number(e.target.value));
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.opacityLabel(opacity)}
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={opacity}
                  disabled={busy}
                  onChange={(e) => {
                    try {
                      setOpacity(Number(e.target.value));
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.colorLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant={colorId === c ? "default" : "outline"}
                      size="sm"
                      onClick={() => setColorId(c)}
                      disabled={busy}
                      className={cn(colorId === c && "bg-indigo-600 text-white hover:bg-indigo-700")}
                    >
                      <span
                        aria-hidden
                        className="h-3 w-3 rounded-full border border-zinc-300 dark:border-zinc-600"
                        style={{
                          backgroundColor:
                            c === "gray" ? "#808080" : c === "red" ? "#cc1a1a" : c === "blue" ? "#2659d9" : "#000000",
                        }}
                      />
                      {s.colorName(c)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.positionLabel}
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {POSITIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPosition(p)}
                      disabled={busy}
                      aria-pressed={position === p}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        position === p
                          ? "border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                      )}
                    >
                      <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {s.positionName(p)}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {s.positionDesc(p)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.pagesLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={pagesMode === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagesMode("all")}
                    disabled={busy}
                    className={cn(pagesMode === "all" && "bg-indigo-600 text-white hover:bg-indigo-700")}
                  >
                    {s.pagesAll} ({pageCount})
                  </Button>
                  <Button
                    type="button"
                    variant={pagesMode === "range" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagesMode("range")}
                    disabled={busy}
                    className={cn(pagesMode === "range" && "bg-indigo-600 text-white hover:bg-indigo-700")}
                  >
                    {s.pagesRange}
                  </Button>
                </div>
                {pagesMode === "range" && (
                  <div className="mt-2">
                    <Input
                      value={range}
                      onChange={(e) => {
                        try {
                          setRange(e.target.value);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      placeholder={s.rangePlaceholder}
                      disabled={busy}
                      inputMode="text"
                      className="w-full font-mono"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{s.rangeHint}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button
                  onClick={() => void handleApply()}
                  disabled={busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {applying ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                  {applying ? s.applying : s.apply}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} disabled={busy}>
                  <X aria-hidden />
                  {s.reset}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
