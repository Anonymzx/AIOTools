"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { Download, FileText, Loader2, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PositionId =
  | "header-left"
  | "header-center"
  | "header-right"
  | "footer-left"
  | "footer-center"
  | "footer-right";

type FormatId = "decimal" | "roman" | "ofN";

const POSITIONS: PositionId[] = [
  "header-left",
  "header-center",
  "header-right",
  "footer-left",
  "footer-center",
  "footer-right",
];

const FORMATS: FormatId[] = ["decimal", "roman", "ofN"];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    encryptedPdf: (name: string) => string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    loading: string;
    applying: string;
    positionLabel: string;
    positionName: (p: PositionId) => string;
    formatLabel: string;
    formatName: (f: FormatId) => string;
    formatExample: (f: FormatId) => string;
    fontSizeLabel: (n: number) => string;
    startFromLabel: string;
    startNumberLabel: string;
    colorNote: string;
    estimate: (from: number, total: number) => string;
    apply: string;
    applySuccess: string;
    applyFailed: string;
    noFile: string;
    error: string;
    pagesUnit: string;
  }
> = {
  en: {
    title: "Add Page Numbers",
    description:
      "Stamp page numbers onto your PDF — header or footer, left, center, or right. Everything runs locally in your browser.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    encryptedPdf: (name) =>
      `Could not open "${name}" — it is encrypted or password-protected. Remove the password first, then try again.`,
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Loading pages...",
    applying: "Numbering...",
    positionLabel: "Position",
    positionName: (p) =>
      ({
        "header-left": "Header · Left",
        "header-center": "Header · Center",
        "header-right": "Header · Right",
        "footer-left": "Footer · Left",
        "footer-center": "Footer · Center",
        "footer-right": "Footer · Right",
      })[p],
    formatLabel: "Number format",
    formatName: (f) => ({ decimal: "1, 2, 3", roman: "i, ii, iii", ofN: "1 of N" })[f],
    formatExample: (f) =>
      ({ decimal: "e.g. 4", roman: "e.g. iv", ofN: "e.g. 4 of 12" })[f],
    fontSizeLabel: (n) => `Font size · ${n}pt`,
    startFromLabel: "Start from page",
    startNumberLabel: "Start numbering at",
    colorNote: "Numbers are drawn in dark gray so they stay readable in both light and dark printouts.",
    estimate: (from, total) => `Pages ${from}–${total} of ${total}`,
    apply: "Download numbered PDF",
    applySuccess: "Numbered PDF downloaded as numbered.pdf.",
    applyFailed: "Failed to add page numbers. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
    pagesUnit: "pages",
  },
  id: {
    title: "Nomor Halaman PDF",
    description:
      "Bubuhkan nomor halaman pada PDF — header atau footer, kiri, tengah, atau kanan. Semua berjalan lokal di browser.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    encryptedPdf: (name) =>
      `Tidak dapat membuka "${name}" — file terenkripsi atau diproteksi kata sandi. Hapus kata sandinya dulu, lalu coba lagi.`,
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Memuat halaman...",
    applying: "Menomori...",
    positionLabel: "Posisi",
    positionName: (p) =>
      ({
        "header-left": "Header · Kiri",
        "header-center": "Header · Tengah",
        "header-right": "Header · Kanan",
        "footer-left": "Footer · Kiri",
        "footer-center": "Footer · Tengah",
        "footer-right": "Footer · Kanan",
      })[p],
    formatLabel: "Format nomor",
    formatName: (f) => ({ decimal: "1, 2, 3", roman: "i, ii, iii", ofN: "1 dari N" })[f],
    formatExample: (f) =>
      ({ decimal: "cth. 4", roman: "cth. iv", ofN: "cth. 4 dari 12" })[f],
    fontSizeLabel: (n) => `Ukuran font · ${n}pt`,
    startFromLabel: "Mulai dari halaman",
    startNumberLabel: "Mulai penomoran dari",
    colorNote: "Nomor digambar dengan abu-abu tua agar tetap terbaca di cetakan terang maupun gelap.",
    estimate: (from, total) => `Halaman ${from}–${total} dari ${total}`,
    apply: "Unduh PDF bernomor",
    applySuccess: "PDF bernomor diunduh sebagai numbered.pdf.",
    applyFailed: "Gagal menambah nomor halaman. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
    pagesUnit: "halaman",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Where will the numbers appear?",
      a: "Pick any of the 6 positions: header or footer combined with left, center, or right. Numbering starts at your chosen page, so front-matter pages can stay unnumbered.",
    },
    id: {
      q: "Di mana nomor akan muncul?",
      a: "Pilih salah satu dari 6 posisi: header atau footer dikombinasikan dengan kiri, tengah, atau kanan. Penomoran dimulai dari halaman pilihanmu, sehingga halaman depan bisa tetap tanpa nomor.",
    },
  },
  {
    en: {
      q: "What number formats are supported?",
      a: "Three formats: plain decimal (1, 2, 3), lowercase roman numerals (i, ii, iii), and “N of total” (1 of 12). The total in “of N” always reflects the full document page count.",
    },
    id: {
      q: "Format nomor apa saja yang didukung?",
      a: "Tiga format: desimal biasa (1, 2, 3), angka romawi kecil (i, ii, iii), dan “N dari total” (1 dari 12). Total pada format tersebut selalu mencerminkan jumlah halaman seluruh dokumen.",
    },
  },
  {
    en: {
      q: "Can I change the number color?",
      a: "The color is fixed to dark gray so numbers stay readable on both white and dark backgrounds when printed or viewed. You can adjust size (8–24pt), position, and the starting number instead.",
    },
    id: {
      q: "Bisakah warna nomor diubah?",
      a: "Warna ditetapkan abu-abu tua agar nomor tetap terbaca di latar putih maupun gelap saat dicetak atau dilihat. Sebagai gantinya kamu bisa mengatur ukuran (8–24pt), posisi, dan angka awal.",
    },
  },
  {
    en: {
      q: "Are my PDFs uploaded to a server?",
      a: "No. Numbering uses pdf-lib entirely on your device with the Helvetica font embedded from the library itself. Your document never leaves your browser.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Penomoran memakai pdf-lib sepenuhnya di perangkatmu dengan font Helvetica dari library itu sendiri. Dokumen tidak pernah meninggalkan browser.",
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

function toRomanLower(n: number): string {
  try {
    if (n < 1) return String(n);
    const table: Array<[number, string]> = [
      [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
      [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
      [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
    ];
    let rest = Math.floor(n);
    let out = "";
    for (const [value, glyph] of table) {
      while (rest >= value) {
        out += glyph;
        rest -= value;
      }
    }
    return out || String(n);
  } catch {
    return String(n);
  }
}

function clampInt(v: number, min: number, max: number, fallback: number): number {
  try {
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(v)));
  } catch {
    return fallback;
  }
}

export default function PageNumberPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [position, setPosition] = useState<PositionId>("footer-center");
  const [format, setFormat] = useState<FormatId>("decimal");
  const [fontSize, setFontSize] = useState(12);
  const [startFrom, setStartFrom] = useState(1);
  const [startNumber, setStartNumber] = useState(1);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const snapshot = downloadUrlsRef.current;
      downloadUrlsRef.current = [];
      for (const url of snapshot) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const trackDownloadUrl = (url: string): void => {
    downloadUrlsRef.current = [...downloadUrlsRef.current, url];
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      downloadUrlsRef.current = downloadUrlsRef.current.filter((u) => u !== url);
    }, 4000);
  };

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
        toast.error(s.encryptedPdf(picked.name));
        setFile(null);
        setDzKey((k) => k + 1);
        return;
      }
      const n = doc.getPageCount();
      if (n === 0) throw new Error(s.invalidPdf);
      setPageCount(n);
      setStartFrom(1);
      setStartNumber(1);
    } catch {
      if (!mountedRef.current) return;
      toast.error(`${picked.name} ${s.invalidPdf}`);
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
      setProgress(0);
      setPosition("footer-center");
      setFormat("decimal");
      setFontSize(12);
      setStartFrom(1);
      setStartNumber(1);
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
    setApplying(true);
    setProgress(0);
    try {
      const bytes = await file.arrayBuffer();
      if (!mountedRef.current) return;
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        toast.error(s.encryptedPdf(file.name));
        return;
      }
      const total = src.getPageCount();
      const from = clampInt(startFrom, 1, Math.max(1, total), 1);
      const first = clampInt(startNumber, 1, 999999, 1);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      const font = await out.embedFont(StandardFonts.Helvetica);
      const gray = rgb(0.25, 0.25, 0.25);
      const isHeader = position.startsWith("header");
      const align = position.endsWith("left")
        ? "left"
        : position.endsWith("right")
          ? "right"
          : "center";

      copied.forEach((page, p) => {
        out.addPage(page);
        if (p < from - 1) return;
        const num = first + (p - (from - 1));
        const text =
          format === "roman"
            ? toRomanLower(num)
            : format === "ofN"
              ? `${num} of ${total}`
              : String(num);
        try {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const margin = 40;
          const x =
            align === "left"
              ? margin
              : align === "right"
                ? width - margin - textWidth
                : (width - textWidth) / 2;
          const y = isHeader ? height - margin : margin - fontSize;
          page.drawText(text, { x, y, size: fontSize, font, color: gray });
        } catch {
          // keep the page even if stamping this one fails
        }
        if (mountedRef.current) setProgress(Math.round(((p + 1) / total) * 100));
      });

      const saved = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      trackDownloadUrl(url);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "numbered.pdf";
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
      if (mountedRef.current) {
        setApplying(false);
        setProgress(0);
      }
    }
  };

  const busy = loading || applying;
  const from = pageCount > 0 ? clampInt(startFrom, 1, pageCount, 1) : 1;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="ListOrdered" slug="pdf/page-number" faq={FAQ}>
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

            {(loading || applying) && (
              <div className="mt-4" role="status" aria-label={loading ? s.loading : s.applying}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${loading ? 50 : progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {loading ? s.loading : `${s.applying} ${progress}%`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {pageCount > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.positionLabel}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={s.positionLabel}>
                  {POSITIONS.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={position === p ? "default" : "outline"}
                      size="sm"
                      disabled={busy}
                      aria-pressed={position === p}
                      onClick={() => {
                        try {
                          setPosition(p);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      className={cn(
                        position === p &&
                          "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
                      )}
                    >
                      {s.positionName(p)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.formatLabel}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={s.formatLabel}>
                  {FORMATS.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      variant={format === f ? "default" : "outline"}
                      size="sm"
                      disabled={busy}
                      aria-pressed={format === f}
                      onClick={() => {
                        try {
                          setFormat(f);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      className={cn(
                        "flex-col gap-0.5 py-2",
                        format === f &&
                          "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
                      )}
                    >
                      <span className="font-semibold">{s.formatName(f)}</span>
                      <span className={cn("text-[11px]", format === f ? "text-indigo-100" : "text-zinc-400")}>
                        {s.formatExample(f)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="pn-fontsize"
                  className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
                >
                  {s.fontSizeLabel(fontSize)}
                </label>
                <input
                  id="pn-fontsize"
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={fontSize}
                  disabled={busy}
                  onChange={(e) => {
                    try {
                      setFontSize(clampInt(Number(e.target.value), 8, 24, 12));
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pn-startfrom"
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.startFromLabel}
                  </label>
                  <input
                    id="pn-startfrom"
                    type="number"
                    min={1}
                    max={pageCount}
                    value={startFrom}
                    disabled={busy}
                    onChange={(e) => {
                      try {
                        setStartFrom(clampInt(Number(e.target.value), 1, pageCount, 1));
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pn-startnum"
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.startNumberLabel}
                  </label>
                  <input
                    id="pn-startnum"
                    type="number"
                    min={1}
                    max={999999}
                    value={startNumber}
                    disabled={busy}
                    onChange={(e) => {
                      try {
                        setStartNumber(clampInt(Number(e.target.value), 1, 999999, 1));
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                  />
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.colorNote}</p>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
                <Badge variant="secondary" className="rounded-lg font-mono">
                  {s.estimate(from, pageCount)}
                </Badge>
                <Badge variant="secondary" className="rounded-lg font-mono">
                  {pageCount} {s.pagesUnit}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleApply()}
                  disabled={busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {applying ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Download aria-hidden />
                  )}
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
