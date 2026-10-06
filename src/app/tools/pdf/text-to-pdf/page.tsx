"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { toast } from "sonner";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FontId = "helvetica" | "times" | "courier";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const LINE_HEIGHT_FACTOR = 1.4;
const MAX_CHARS = 200000;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    textLabel: string;
    textPlaceholder: string;
    loadTxt: string;
    clear: string;
    txtLoaded: (n: number) => string;
    txtFailed: string;
    txtTooBig: string;
    fontLabel: string;
    fontName: (f: FontId) => string;
    sizeLabel: (n: number) => string;
    marginLabel: (n: number) => string;
    headerLabel: string;
    headerPlaceholder: string;
    footerLabel: string;
    footerPlaceholder: string;
    estimate: (pages: number, lines: number) => string;
    generate: string;
    generating: string;
    generateSuccess: (n: number) => string;
    generateFailed: string;
    emptyText: string;
    tooLong: string;
    error: string;
  }
> = {
  en: {
    title: "Text to PDF",
    description:
      "Turn plain text into a clean A4 PDF with your choice of font, size, and margins. Everything runs locally in your browser.",
    textLabel: "Your text",
    textPlaceholder: "Type or paste your text here…",
    loadTxt: "Load .txt file",
    clear: "Clear",
    txtLoaded: (n) => `Loaded ${n} characters from the text file.`,
    txtFailed: "Could not read that text file.",
    txtTooBig: "Text is too long — keeping the first 200,000 characters.",
    fontLabel: "Font",
    fontName: (f) =>
      ({ helvetica: "Helvetica (sans-serif)", times: "Times (serif)", courier: "Courier (mono)" })[f],
    sizeLabel: (n) => `Font size · ${n}pt`,
    marginLabel: (n) => `Margin · ${n}pt`,
    headerLabel: "Header (optional)",
    headerPlaceholder: "e.g. Meeting notes — shown on every page",
    footerLabel: "Footer (optional)",
    footerPlaceholder: "e.g. Confidential — shown on every page",
    estimate: (pages, lines) => `≈ ${pages} ${pages === 1 ? "page" : "pages"} · ${lines} lines`,
    generate: "Download PDF",
    generating: "Generating...",
    generateSuccess: (n) => `Generated ${n} ${n === 1 ? "page" : "pages"} as text.pdf.`,
    generateFailed: "Failed to generate the PDF. Try shorter text or larger margins.",
    emptyText: "Type or load some text first.",
    tooLong: "Text exceeds the 200,000 character limit.",
    error: "Something went wrong.",
  },
  id: {
    title: "Teks ke PDF",
    description:
      "Ubah teks biasa menjadi PDF A4 yang rapi dengan pilihan font, ukuran, dan margin. Semua berjalan lokal di browser.",
    textLabel: "Teks kamu",
    textPlaceholder: "Ketik atau tempel teksmu di sini…",
    loadTxt: "Muat file .txt",
    clear: "Hapus",
    txtLoaded: (n) => `Memuat ${n} karakter dari file teks.`,
    txtFailed: "Tidak dapat membaca file teks tersebut.",
    txtTooBig: "Teks terlalu panjang — hanya 200.000 karakter pertama yang dipakai.",
    fontLabel: "Font",
    fontName: (f) =>
      ({ helvetica: "Helvetica (sans-serif)", times: "Times (serif)", courier: "Courier (mono)" })[f],
    sizeLabel: (n) => `Ukuran font · ${n}pt`,
    marginLabel: (n) => `Margin · ${n}pt`,
    headerLabel: "Header (opsional)",
    headerPlaceholder: "cth. Notulen rapat — tampil di setiap halaman",
    footerLabel: "Footer (opsional)",
    footerPlaceholder: "cth. Rahasia — tampil di setiap halaman",
    estimate: (pages, lines) => `≈ ${pages} halaman · ${lines} baris`,
    generate: "Unduh PDF",
    generating: "Membuat...",
    generateSuccess: (n) => `Berhasil membuat ${n} halaman sebagai text.pdf.`,
    generateFailed: "Gagal membuat PDF. Coba teks lebih pendek atau margin lebih besar.",
    emptyText: "Ketik atau muat teks terlebih dahulu.",
    tooLong: "Teks melebihi batas 200.000 karakter.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is my text laid out on the page?",
      a: "Your text flows onto A4 pages with word wrapping measured against the real font metrics, so lines never overflow the margins. Line height is fixed at 1.4× the font size for comfortable reading, and a new page starts automatically when the content no longer fits.",
    },
    id: {
      q: "Bagaimana teks saya ditata di halaman?",
      a: "Teks mengalir ke halaman A4 dengan pembungkusan kata yang diukur dari metrik font asli, sehingga baris tidak pernah meluber melewati margin. Tinggi baris ditetapkan 1,4× ukuran font agar nyaman dibaca, dan halaman baru dimulai otomatis saat konten tidak muat.",
    },
  },
  {
    en: {
      q: "Can I use a .txt file instead of typing?",
      a: "Yes — press Load .txt file and pick any plain-text file. Its contents fill the textarea, where you can still edit before generating. Files are read locally and capped at 200,000 characters.",
    },
    id: {
      q: "Bisakah memakai file .txt alih-alih mengetik?",
      a: "Bisa — tekan Muat file .txt dan pilih file teks biasa. Isinya mengisi textarea dan masih bisa kamu edit sebelum dibuat. File dibaca secara lokal dan dibatasi 200.000 karakter.",
    },
  },
  {
    en: {
      q: "Which fonts are available?",
      a: "Three classic PDF fonts: Helvetica (clean sans-serif), Times (formal serif), and Courier (monospace). They are embedded by the PDF library itself, so the file looks identical on any device without downloading web fonts.",
    },
    id: {
      q: "Font apa saja yang tersedia?",
      a: "Tiga font PDF klasik: Helvetica (sans-serif bersih), Times (serif formal), dan Courier (monospace). Font disematkan oleh library PDF itu sendiri, sehingga file tampil identik di perangkat mana pun tanpa mengunduh web font.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Pagination and PDF generation run with pdf-lib entirely in your browser. Your text never leaves your device.",
    },
    id: {
      q: "Apakah teks saya diunggah ke mana pun?",
      a: "Tidak. Penomoran halaman dan pembuatan PDF berjalan dengan pdf-lib sepenuhnya di browser. Teks tidak pernah meninggalkan perangkatmu.",
    },
  },
];

const FONT_OPTIONS: FontId[] = ["helvetica", "times", "courier"];

function standardFontFor(id: FontId): StandardFonts {
  if (id === "times") return StandardFonts.TimesRoman;
  if (id === "courier") return StandardFonts.Courier;
  return StandardFonts.Helvetica;
}

function wrapParagraph(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  try {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      lines.push("");
      return lines;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      let w = 0;
      try {
        w = font.widthOfTextAtSize(candidate, size);
      } catch {
        w = candidate.length * size * 0.55;
      }
      if (w <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // Hard-break single words wider than the line.
        let rest = word;
        current = "";
        try {
          while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
            let cut = rest.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) {
              cut -= 1;
            }
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
        } catch {
          // ignore measurement failure, push remainder as-is
        }
        current = rest;
      }
    }
    lines.push(current);
  } catch {
    lines.push(text);
  }
  return lines;
}

export default function TextToPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [fontId, setFontId] = useState<FontId>("helvetica");
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(48);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const handleTxtFile = async (f: File | undefined): Promise<void> => {
    if (!f) return;
    try {
      const raw = await f.text();
      if (!mountedRef.current) return;
      if (raw.length > MAX_CHARS) {
        setText(raw.slice(0, MAX_CHARS));
        toast.error(s.txtTooBig);
      } else {
        setText(raw);
        toast.success(s.txtLoaded(raw.length));
      }
    } catch {
      if (mountedRef.current) toast.error(s.txtFailed);
    } finally {
      try {
        if (txtInputRef.current) txtInputRef.current.value = "";
      } catch {
        // ignore
      }
    }
  };

  const handleGenerate = async (): Promise<void> => {
    const trimmed = text.replace(/\s+$/, "");
    if (!trimmed || generating) {
      if (!trimmed) toast.error(s.emptyText);
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      toast.error(s.tooLong);
      return;
    }
    setGenerating(true);
    setProgress(5);
    try {
      const out = await PDFDocument.create();
      const font = await out.embedFont(standardFontFor(fontId));
      const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
      const usableWidth = A4_WIDTH - margin * 2;
      const headerReserve = header.trim() ? lineHeight + 10 : 0;
      const footerReserve = footer.trim() ? lineHeight + 10 : 0;
      const usableHeight = A4_HEIGHT - margin * 2 - headerReserve - footerReserve;
      if (usableHeight <= lineHeight) throw new Error(s.generateFailed);

      const paragraphs = trimmed.split("\n");
      const lines: string[] = [];
      for (const para of paragraphs) {
        const wrapped = wrapParagraph(font, para, fontSize, usableWidth);
        for (const w of wrapped) lines.push(w);
      }
      const linesPerPage = Math.max(1, Math.floor(usableHeight / lineHeight));
      const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));
      const ink = rgb(0.12, 0.12, 0.14);
      const muted = rgb(0.45, 0.45, 0.48);

      for (let p = 0; p < totalPages; p++) {
        const page = out.addPage([A4_WIDTH, A4_HEIGHT]);
        const chunk = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
        if (header.trim()) {
          page.drawText(header.trim(), {
            x: margin,
            y: A4_HEIGHT - margin - fontSize,
            size: fontSize,
            font,
            color: muted,
            maxWidth: usableWidth,
          });
        }
        let y = A4_HEIGHT - margin - headerReserve - fontSize;
        for (const line of chunk) {
          if (!line) continue;
          try {
            page.drawText(line, { x: margin, y, size: fontSize, font, color: ink, maxWidth: usableWidth });
          } catch {
            // skip unrenderable line, keep the page
          }
          y -= lineHeight;
        }
        if (footer.trim()) {
          page.drawText(footer.trim(), {
            x: margin,
            y: margin - lineHeight + fontSize * 0.4,
            size: fontSize,
            font,
            color: muted,
            maxWidth: usableWidth,
          });
        }
        if (mountedRef.current) setProgress(5 + Math.round(((p + 1) / totalPages) * 90));
      }

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
        a.download = "text.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.generateFailed);
        return;
      }
      if (mountedRef.current) setProgress(100);
      toast.success(s.generateSuccess(totalPages));
    } catch {
      if (mountedRef.current) toast.error(s.generateFailed);
    } finally {
      if (mountedRef.current) {
        setGenerating(false);
        window.setTimeout(() => {
          try {
            if (mountedRef.current) setProgress(0);
          } catch {
            // ignore
          }
        }, 800);
      }
    }
  };

  // Live estimate using the same metrics as generation (approximation: header/footer share space).
  let estimatePages = 0;
  let estimateLines = 0;
  try {
    estimateLines = text ? text.split("\n").length : 0;
    const charsPerLine = Math.max(10, Math.floor((A4_WIDTH - margin * 2) / (fontSize * 0.55)));
    const wrapped = text
      ? Math.ceil(text.replace(/\n/g, " ").length / charsPerLine) + estimateLines
      : 0;
    const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
    const usable = A4_HEIGHT - margin * 2 - (header.trim() ? lineHeight + 10 : 0) - (footer.trim() ? lineHeight + 10 : 0);
    const perPage = Math.max(1, Math.floor(usable / lineHeight));
    estimatePages = text.trim() ? Math.max(1, Math.ceil(Math.max(wrapped, 1) / perPage)) : 0;
  } catch {
    estimatePages = 0;
  }

  const charCount = text.length;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileType" slug="pdf/text-to-pdf" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="ttp-text"
                className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
              >
                {s.textLabel}
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-lg font-mono">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </Badge>
                <input
                  ref={txtInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  aria-hidden
                  tabIndex={-1}
                  onChange={(e) => {
                    try {
                      void handleTxtFile(e.target.files?.[0]);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generating}
                  onClick={() => {
                    try {
                      txtInputRef.current?.click();
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  <FileUp className="h-3.5 w-3.5" aria-hidden />
                  {s.loadTxt}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={generating || !text}
                  onClick={() => {
                    try {
                      setText("");
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {s.clear}
                </Button>
              </div>
            </div>
            <textarea
              id="ttp-text"
              value={text}
              disabled={generating}
              rows={10}
              maxLength={MAX_CHARS + 1000}
              placeholder={s.textPlaceholder}
              onChange={(e) => {
                try {
                  setText(e.target.value.slice(0, MAX_CHARS + 1000));
                } catch {
                  toast.error(s.error);
                }
              }}
              className="min-h-[240px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div>
              <label
                htmlFor="ttp-font"
                className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
              >
                {s.fontLabel}
              </label>
              <select
                id="ttp-font"
                value={fontId}
                disabled={generating}
                onChange={(e) => {
                  try {
                    const v = e.target.value;
                    setFontId(v === "times" || v === "courier" ? v : "helvetica");
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {s.fontName(f)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ttp-size" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {s.sizeLabel(fontSize)}
              </label>
              <input
                id="ttp-size"
                type="range"
                min={10}
                max={16}
                step={1}
                value={fontSize}
                disabled={generating}
                onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    setFontSize(Number.isFinite(v) ? Math.min(16, Math.max(10, Math.round(v))) : 12);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className="mt-2 w-full accent-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="ttp-margin" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {s.marginLabel(margin)}
              </label>
              <input
                id="ttp-margin"
                type="range"
                min={24}
                max={96}
                step={4}
                value={margin}
                disabled={generating}
                onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    setMargin(Number.isFinite(v) ? Math.min(96, Math.max(24, Math.round(v))) : 48);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className="mt-2 w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ttp-header" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.headerLabel}
                </label>
                <input
                  id="ttp-header"
                  type="text"
                  value={header}
                  disabled={generating}
                  maxLength={120}
                  placeholder={s.headerPlaceholder}
                  onChange={(e) => {
                    try {
                      setHeader(e.target.value);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
              </div>
              <div>
                <label htmlFor="ttp-footer" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.footerLabel}
                </label>
                <input
                  id="ttp-footer"
                  type="text"
                  value={footer}
                  disabled={generating}
                  maxLength={120}
                  placeholder={s.footerPlaceholder}
                  onChange={(e) => {
                    try {
                      setFooter(e.target.value);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
              </div>
            </div>

            {estimatePages > 0 && (
              <Badge variant="secondary" className="rounded-lg font-mono">
                {s.estimate(estimatePages, estimateLines)}
              </Badge>
            )}

            {generating && (
              <div role="status" aria-label={s.generating}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.generating} {progress}%
                </p>
              </div>
            )}

            <Button
              onClick={() => void handleGenerate()}
              disabled={generating || !text.trim()}
              size="lg"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {generating ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Download aria-hidden />
              )}
              {generating ? s.generating : s.generate}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
