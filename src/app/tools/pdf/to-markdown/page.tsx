"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Download,
  FileText,
  FileType,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    convert: string;
    converting: string;
    reset: string;
    removeFile: string;
    fileLabel: string;
    heuristicNote: string;
    progress: (done: number, total: number) => string;
    outputLabel: string;
    copy: string;
    copied: string;
    download: string;
    chars: (n: number) => string;
    words: (n: number) => string;
    pages: (n: number) => string;
    success: (n: number) => string;
    fail: string;
    noFile: string;
    copyOk: string;
    copyFail: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    privacy: string;
    error: string;
  }
> = {
  en: {
    title: "PDF to Markdown",
    description:
      "Turn a PDF into clean Markdown. Positioned text is grouped into lines, large type becomes # / ## headings, and lists are preserved — all locally in your browser.",
    dropHint: "Drop a PDF here, or click to browse",
    convert: "Convert to Markdown",
    converting: "Converting…",
    reset: "Start over",
    removeFile: "Remove file",
    fileLabel: "Selected file",
    heuristicNote:
      "How it works: text items are grouped into lines by Y position, the two largest type sizes above the body median (gap > 20%) become # / ## headings, and list markers are kept. Tables are not reconstructed — they fall through as plain paragraphs. No turndown is used because the source is positioned text, so a heuristic builder is the correct approach.",
    progress: (done, total) => `Reading page ${done} of ${total}…`,
    outputLabel: "Markdown preview",
    copy: "Copy",
    copied: "Copied",
    download: "Download .md",
    chars: (n) => `${n.toLocaleString("en-US")} chars`,
    words: (n) => `${n.toLocaleString("en-US")} words`,
    pages: (n) => `${n} pages`,
    success: (n) => `Converted ${n} pages to Markdown.`,
    fail: "Failed to read PDF. The file may be corrupted, encrypted, or image-only.",
    noFile: "Select a PDF file first.",
    copyOk: "Markdown copied to clipboard.",
    copyFail: "Copy failed — select the preview text manually.",
    emptyTitle: "No selectable text found.",
    emptyBody:
      "This PDF is probably scanned (page images with no text layer). Recognize it with OCR first, then convert the result.",
    emptyCta: "Open OCR tool",
    privacy: "Private — runs 100% in your browser",
    error: "Something went wrong.",
  },
  id: {
    title: "PDF ke Markdown",
    description:
      "Ubah PDF menjadi Markdown yang rapi. Teks berposisi dikelompokkan menjadi baris, huruf besar menjadi heading # / ##, dan daftar dipertahankan — semuanya lokal di browser.",
    dropHint: "Letakkan PDF di sini, atau klik untuk memilih",
    convert: "Ubah ke Markdown",
    converting: "Mengubah…",
    reset: "Mulai ulang",
    removeFile: "Hapus file",
    fileLabel: "File terpilih",
    heuristicNote:
      "Cara kerja: item teks dikelompokkan menjadi baris berdasarkan posisi Y, dua ukuran huruf terbesar di atas median isi (selisih > 20%) menjadi heading # / ##, dan penanda daftar dipertahankan. Tabel tidak direkonstruksi — menjadi paragraf biasa. Turndown tidak dipakai karena sumbernya teks berposisi, jadi pembangun heuristik adalah pendekatan yang tepat.",
    progress: (done, total) => `Membaca halaman ${done} dari ${total}…`,
    outputLabel: "Pratinjau Markdown",
    copy: "Salin",
    copied: "Disalin",
    download: "Unduh .md",
    chars: (n) => `${n.toLocaleString("id-ID")} karakter`,
    words: (n) => `${n.toLocaleString("id-ID")} kata`,
    pages: (n) => `${n} halaman`,
    success: (n) => `Berhasil mengubah ${n} halaman menjadi Markdown.`,
    fail: "Gagal membaca PDF. File mungkin rusak, terenkripsi, atau hanya gambar.",
    noFile: "Pilih file PDF terlebih dahulu.",
    copyOk: "Markdown disalin ke clipboard.",
    copyFail: "Gagal menyalin — pilih teks pratinjau secara manual.",
    emptyTitle: "Tidak ada teks yang bisa dipilih.",
    emptyBody:
      "PDF ini kemungkinan hasil pindaian (gambar halaman tanpa lapisan teks). Kenali dulu dengan OCR, lalu konversi hasilnya.",
    emptyCta: "Buka tool OCR",
    privacy: "Privat — 100% berjalan di browser",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are headings detected?",
      a: "Every line's type size is measured from its pdf.js transform, and the body size is taken as the median. The two largest distinct sizes sitting more than 20% above that median become # and ## headings. Body-sized text stays a plain paragraph, so normal documents don't get false headings.",
    },
    id: {
      q: "Bagaimana heading dideteksi?",
      a: "Ukuran huruf tiap baris diukur dari transform pdf.js, dan ukuran isi diambil sebagai median. Dua ukuran berbeda terbesar yang lebih dari 20% di atas median menjadi heading # dan ##. Teks seukuran isi tetap paragraf biasa, sehingga dokumen normal tidak mendapat heading palsu.",
    },
  },
  {
    en: {
      q: "What happens to tables?",
      a: "Tables are not reconstructed — cell structure can't be recovered reliably from positioned text, so table rows fall through as plain paragraphs. If you need table data, the OCR tool plus manual cleanup is a better route.",
    },
    id: {
      q: "Bagaimana dengan tabel?",
      a: "Tabel tidak direkonstruksi — struktur sel tidak bisa dipulihkan andal dari teks berposisi, sehingga baris tabel menjadi paragraf biasa. Jika butuh data tabel, tool OCR plus rapikan manual adalah rute yang lebih baik.",
    },
  },
  {
    en: {
      q: "Are bullet and numbered lists kept?",
      a: "Yes. Lines starting with -, *, •, or a number like 1. / 1) are preserved as Markdown lists (• is normalized to -, and 1) to 1.). Indentation levels are flattened to a single level.",
    },
    id: {
      q: "Apakah daftar bullet dan bernomor dipertahankan?",
      a: "Ya. Baris yang diawali -, *, •, atau angka seperti 1. / 1) dipertahankan sebagai daftar Markdown (• dinormalkan menjadi -, dan 1) menjadi 1.). Level indentasi diratakan ke satu level.",
    },
  },
  {
    en: {
      q: "Why is my scanned PDF empty?",
      a: "Scanned PDFs are page images with no text layer, so there are no positioned text items to build from. Use the OCR tool (/tools/pdf/ocr) to recognize the text first.",
    },
    id: {
      q: "Mengapa PDF pindaian saya kosong?",
      a: "PDF pindaian adalah gambar halaman tanpa lapisan teks, sehingga tidak ada item teks berposisi untuk dibangun. Gunakan tool OCR (/tools/pdf/ocr) untuk mengenali teksnya terlebih dahulu.",
    },
  },
];

interface BuiltLine {
  y: number;
  size: number;
  text: string;
}

function median(values: number[]): number {
  try {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? (sorted[mid] ?? 0)
      : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  } catch {
    return 0;
  }
}

function normalizeListItem(text: string): string | null {
  try {
    const bullet = text.match(/^([-*•])\s+(.*)$/);
    if (bullet) return `- ${bullet[2]}`;
    const numbered = text.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) return `${numbered[1]}. ${numbered[2]}`;
    return null;
  } catch {
    return null;
  }
}

function buildMarkdown(pages: BuiltLine[][]): string {
  const all = pages.flat();
  if (all.length === 0) return "";
  const sizes = all.map((l) => Math.round(l.size * 2) / 2);
  const bodyMedian = median(sizes) || 10;
  const uniq = Array.from(new Set(sizes)).sort((a, b) => b - a);
  const big = uniq.filter((s) => s > bodyMedian * 1.2).slice(0, 2);
  const h1 = big[0] ?? 0;
  const h2 = big[1] ?? 0;

  const pageBlocks: string[] = [];
  for (const lines of pages) {
    if (lines.length === 0) continue;
    const gaps: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      gaps.push(Math.abs((lines[i - 1]?.y ?? 0) - (lines[i]?.y ?? 0)));
    }
    const gapThreshold = Math.max(median(gaps) * 1.8, 6);
    const out: string[] = [];
    lines.forEach((line, idx) => {
      const rounded = Math.round(line.size * 2) / 2;
      let md: string;
      if (h1 > 0 && rounded >= h1 - 0.26) md = `# ${line.text}`;
      else if (h2 > 0 && rounded >= h2 - 0.26) md = `## ${line.text}`;
      else md = normalizeListItem(line.text) ?? line.text;
      if (idx > 0) {
        const gap = Math.abs((lines[idx - 1]?.y ?? 0) - line.y);
        out.push(gap > gapThreshold ? "\n\n" : "\n");
      }
      out.push(md);
    });
    pageBlocks.push(out.join(""));
  }
  return pageBlocks.join("\n\n---\n\n");
}

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

export default function PdfToMarkdownPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [wasEmpty, setWasEmpty] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stats = useMemo(() => {
    try {
      const chars = markdown.length;
      const words = markdown.trim().length === 0 ? 0 : markdown.trim().split(/\s+/).length;
      return { chars, words };
    } catch {
      return { chars: 0, words: 0 };
    }
  }, [markdown]);

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      setDzKey((k) => k + 1);
      if (!picked) return;
      setMarkdown("");
      setPageCount(0);
      setWasEmpty(false);
      setDone(0);
      setTotal(0);
      setCopied(false);
      setFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRemoveFile = (): void => {
    try {
      setMarkdown("");
      setPageCount(0);
      setWasEmpty(false);
      setDone(0);
      setTotal(0);
      setCopied(false);
      setFile(null);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleConvert = async (): Promise<void> => {
    if (!file || busy) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setBusy(true);
    setMarkdown("");
    setWasEmpty(false);
    setDone(0);
    setTotal(0);
    setCopied(false);
    try {
      const pdfjs = await import("pdfjs-dist");
      const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const run = async (buf: ArrayBuffer): Promise<BuiltLine[][]> => {
        const task = pdfjs.getDocument({ data: new Uint8Array(buf) });
        const pdf = await task.promise;
        try {
          if (mountedRef.current) setTotal(pdf.numPages);
          const pages: BuiltLine[][] = [];
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            try {
              const tc = await page.getTextContent();
              type Raw = { x: number; y: number; size: number; str: string };
              const raws: Raw[] = [];
              for (const it of tc.items) {
                try {
                  const rec = it as unknown as {
                    str?: unknown;
                    transform?: unknown;
                    height?: unknown;
                  };
                  if (typeof rec.str !== "string" || rec.str.trim().length === 0)
                    continue;
                  const t = Array.isArray(rec.transform)
                    ? (rec.transform as number[])
                    : [0, 0, 0, 0, 0, 0];
                  const tx = typeof t[4] === "number" ? t[4] : 0;
                  const ty = typeof t[5] === "number" ? t[5] : 0;
                  const scaled =
                    Math.hypot(
                      typeof t[0] === "number" ? t[0] : 0,
                      typeof t[1] === "number" ? t[1] : 0,
                    ) || 0;
                  const h = typeof rec.height === "number" && rec.height > 0 ? rec.height : 0;
                  raws.push({ x: tx, y: ty, size: scaled > 0 ? scaled : h || 10, str: rec.str });
                } catch {
                  // ignore malformed items
                }
              }
              // Sort top-to-bottom (y desc), then left-to-right.
              raws.sort((a, b) => b.y - a.y || a.x - b.x);
              // Group into lines by Y tolerance.
              const Y_TOL = 3;
              const grouped: { y: number; items: Raw[] }[] = [];
              for (const r of raws) {
                const cur = grouped[grouped.length - 1];
                if (cur && Math.abs(cur.y - r.y) < Y_TOL) cur.items.push(r);
                else grouped.push({ y: r.y, items: [r] });
              }
              const lines: BuiltLine[] = grouped.map((g) => {
                const sorted = [...g.items].sort((a, b) => a.x - b.x);
                return {
                  y: g.y,
                  size: median(sorted.map((w) => w.size)) || 10,
                  text: sorted
                    .map((w) => w.str)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim(),
                };
              });
              pages.push(lines.filter((l) => l.text.length > 0));
            } finally {
              try {
                page.cleanup();
              } catch {
                // ignore
              }
            }
            if (mountedRef.current) setDone(p);
          }
          return pages;
        } finally {
          try {
            await task.destroy();
          } catch {
            // ignore
          }
        }
      };

      let pages: BuiltLine[][];
      try {
        pages = await run(await file.arrayBuffer());
      } catch (firstErr) {
        // Retry once with the CDN worker.
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        try {
          if (mountedRef.current) {
            setDone(0);
            setTotal(0);
          }
          pages = await run(await file.arrayBuffer());
        } catch {
          throw firstErr;
        }
      }
      if (!mountedRef.current) return;
      const md = buildMarkdown(pages);
      setPageCount(pages.length);
      if (md.trim().length === 0) {
        setWasEmpty(true);
        setMarkdown("");
      } else {
        setMarkdown(md);
        toast.success(s.success(pages.length));
      }
    } catch {
      if (mountedRef.current) toast.error(s.fail);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (markdown.length === 0) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success(s.copyOk);
      window.setTimeout(() => {
        try {
          setCopied(false);
        } catch {
          // ignore
        }
      }, 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = markdown;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        toast.success(s.copyOk);
      } catch {
        toast.error(s.copyFail);
      }
    }
  };

  const handleDownload = (): void => {
    if (markdown.length === 0) return;
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const base = (file?.name ?? "document").replace(/\.pdf$/i, "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.md`;
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
    } catch {
      toast.error(s.error);
    }
  };

  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileType"
      slug="pdf/to-markdown"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <Badge variant="secondary" className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {s.privacy}
              </Badge>
            </div>
            <FileDropzone
              key={dzKey}
              accept={{ "application/pdf": [".pdf"] }}
              multiple={false}
              maxSizeMB={50}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {s.heuristicNote}
            </p>

            {file && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={busy}
                  aria-label={`${s.removeFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleConvert()}
                disabled={!file || busy}
                size="lg"
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <FileType aria-hidden />
                )}
                {busy ? s.converting : s.convert}
              </Button>
              {file && (
                <Button variant="outline" size="lg" onClick={handleRemoveFile} disabled={busy}>
                  <Trash2 aria-hidden />
                  {s.reset}
                </Button>
              )}
            </div>

            {busy && (
              <div role="status" aria-label={s.converting}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {total > 0 ? `${s.progress(done, total)} ${percent}%` : s.converting}
                </p>
              </div>
            )}

            {wasEmpty && !busy && (
              <div
                role="note"
                className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <p className="font-semibold">{s.emptyTitle}</p>
                <p className="mt-1 text-xs leading-relaxed">{s.emptyBody}</p>
                <Link
                  href="/tools/pdf/ocr"
                  className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  {s.emptyCta}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {markdown.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.outputLabel}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {s.pages(pageCount)}
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    {s.chars(stats.chars)}
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    {s.words(stats.words)}
                  </Badge>
                </div>
              </div>
              <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {markdown}
              </pre>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleCopy()}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? s.copied : s.copy}
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <Download aria-hidden />
                  {s.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
