"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { diffLines, diffWords, type Change } from "diff";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    labelA: string;
    labelB: string;
    dropHint: string;
    compare: string;
    comparing: string;
    reset: string;
    modeLabel: string;
    modeLines: string;
    modeWords: string;
    added: (n: number) => string;
    removed: (n: number) => string;
    changedPages: (n: number) => string;
    changesTitle: (n: number) => string;
    noChanges: string;
    prev: string;
    next: string;
    goTo: (i: number, total: number) => string;
    jumpTo: (i: number) => string;
    addedTag: string;
    removedTag: string;
    paneA: string;
    paneB: string;
    scrollNote: string;
    extracting: (which: string, done: number, total: number) => string;
    success: string;
    fail: string;
    needFiles: string;
    emptyA: string;
    emptyB: string;
    emptyBody: string;
    emptyCta: string;
    privacy: string;
    error: string;
  }
> = {
  en: {
    title: "PDF Compare",
    description:
      "Spot every change between two PDF revisions. Text is extracted locally per page, then diffed line-by-line or word-by-word — additions in green, deletions in red.",
    labelA: "Original (A)",
    labelB: "Revised (B)",
    dropHint: "Drop a PDF here, or click to browse",
    compare: "Compare PDFs",
    comparing: "Extracting & comparing…",
    reset: "Reset",
    modeLabel: "Detail",
    modeLines: "Lines",
    modeWords: "Words",
    added: (n) => `+${n} added`,
    removed: (n) => `−${n} removed`,
    changedPages: (n) => `${n} changed page${n === 1 ? "" : "s"}`,
    changesTitle: (n) => `Changes (${n})`,
    noChanges: "No differences found — the texts are identical.",
    prev: "Prev",
    next: "Next",
    goTo: (i, total) => `Go to change ${i} of ${total}`,
    jumpTo: (i) => `Jump to change ${i}`,
    addedTag: "added",
    removedTag: "removed",
    paneA: "A — Original",
    paneB: "B — Revised",
    scrollNote: "Note: panes scroll independently.",
    extracting: (which, done, total) =>
      `Extracting ${which} — page ${done} of ${total}…`,
    success: "Comparison ready.",
    fail: "Failed to extract text. The file may be corrupted, encrypted, or image-only.",
    needFiles: "Select both PDF files first.",
    emptyA: "Original PDF has no selectable text.",
    emptyB: "Revised PDF has no selectable text.",
    emptyBody:
      "It is probably a scanned document. Run it through OCR first, then compare again.",
    emptyCta: "Open OCR tool",
    privacy: "Private — runs 100% in your browser",
    error: "Something went wrong.",
  },
  id: {
    title: "Bandingkan PDF",
    description:
      "Temukan setiap perubahan antara dua revisi PDF. Teks diekstrak secara lokal per halaman, lalu dibandingkan per baris atau per kata — tambahan berwarna hijau, hapusan berwarna merah.",
    labelA: "Asli (A)",
    labelB: "Revisi (B)",
    dropHint: "Letakkan PDF di sini, atau klik untuk memilih",
    compare: "Bandingkan PDF",
    comparing: "Mengekstrak & membandingkan…",
    reset: "Atur ulang",
    modeLabel: "Detail",
    modeLines: "Baris",
    modeWords: "Kata",
    added: (n) => `+${n} ditambah`,
    removed: (n) => `−${n} dihapus`,
    changedPages: (n) => `${n} halaman berubah`,
    changesTitle: (n) => `Perubahan (${n})`,
    noChanges: "Tidak ada perbedaan — teks identik.",
    prev: "Sblm",
    next: "Ljt",
    goTo: (i, total) => `Ke perubahan ${i} dari ${total}`,
    jumpTo: (i) => `Lompat ke perubahan ${i}`,
    addedTag: "ditambah",
    removedTag: "dihapus",
    paneA: "A — Asli",
    paneB: "B — Revisi",
    scrollNote: "Catatan: panel bergulir masing-masing.",
    extracting: (which, done, total) =>
      `Mengekstrak ${which} — halaman ${done} dari ${total}…`,
    success: "Perbandingan siap.",
    fail: "Gagal mengekstrak teks. File mungkin rusak, terenkripsi, atau hanya gambar.",
    needFiles: "Pilih kedua file PDF terlebih dahulu.",
    emptyA: "PDF Asli tidak memiliki teks yang bisa dipilih.",
    emptyB: "PDF Revisi tidak memiliki teks yang bisa dipilih.",
    emptyBody:
      "Kemungkinan dokumen hasil pindaian. Jalankan OCR terlebih dahulu, lalu bandingkan lagi.",
    emptyCta: "Buka tool OCR",
    privacy: "Privat — 100% berjalan di browser",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does the comparison work?",
      a: "Each PDF's text is extracted per page with pdf.js getTextContent (joining every item's str), then the two texts are diffed with the diff library in Lines or Words mode. Removed passages highlight red in pane A, added passages highlight green in pane B.",
    },
    id: {
      q: "Bagaimana cara kerja perbandingan ini?",
      a: "Teks setiap PDF diekstrak per halaman dengan pdf.js getTextContent (menggabungkan str tiap item), lalu kedua teks dibandingkan dengan pustaka diff dalam mode Baris atau Kata. Bagian yang dihapus disorot merah di panel A, bagian tambahan disorot hijau di panel B.",
    },
  },
  {
    en: {
      q: "Why does my PDF show “no selectable text”?",
      a: "Scanned PDFs are just page images with no text layer, so there is nothing to diff. Use the OCR tool (/tools/pdf/ocr) to recognize the text first, export it, and compare the results instead.",
    },
    id: {
      q: "Mengapa PDF saya “tidak memiliki teks yang bisa dipilih”?",
      a: "PDF hasil pindaian hanyalah gambar halaman tanpa lapisan teks, jadi tidak ada yang bisa dibandingkan. Gunakan tool OCR (/tools/pdf/ocr) untuk mengenali teksnya terlebih dahulu, lalu bandingkan hasilnya.",
    },
  },
  {
    en: {
      q: "Should I use Lines or Words mode?",
      a: "Lines mode is best for spotting moved or rewritten paragraphs; Words mode pinpoints small edits inside a sentence, such as a changed number or name. Switch freely — the diff recomputes instantly without re-extracting.",
    },
    id: {
      q: "Kapan memakai mode Baris atau Kata?",
      a: "Mode Baris paling baik untuk menemukan paragraf yang dipindah atau ditulis ulang; mode Kata menunjukkan edit kecil dalam kalimat, misalnya angka atau nama yang berubah. Ganti kapan saja — diff dihitung ulang seketika tanpa ekstraksi ulang.",
    },
  },
  {
    en: {
      q: "Are my documents uploaded anywhere?",
      a: "No. Extraction and diffing run entirely in your browser with pdf.js served locally. Your PDFs never leave your device.",
    },
    id: {
      q: "Apakah dokumen saya diunggah ke mana pun?",
      a: "Tidak. Ekstraksi dan perbandingan berjalan sepenuhnya di browser dengan pdf.js yang dimuat lokal. PDF tidak pernah meninggalkan perangkatmu.",
    },
  },
];

async function extractPdfText(
  file: File,
  onPage: (done: number, total: number) => void,
): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const attempt = async (buf: ArrayBuffer): Promise<string[]> => {
    const task = pdfjs.getDocument({ data: new Uint8Array(buf) });
    const pdf = await task.promise;
    try {
      const out: string[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        try {
          const tc = await page.getTextContent();
          const strs: string[] = [];
          for (const it of tc.items) {
            try {
              const rec = it as unknown as { str?: unknown };
              if (typeof rec.str === "string" && rec.str.length > 0)
                strs.push(rec.str);
            } catch {
              // ignore malformed items
            }
          }
          out.push(strs.join(" ").replace(/\s+/g, " ").trim());
        } finally {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
        onPage(p, pdf.numPages);
      }
      return out;
    } finally {
      try {
        await task.destroy();
      } catch {
        // ignore
      }
    }
  };
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return await attempt(await file.arrayBuffer());
  } catch (err) {
    // Retry once with the CDN worker if the local one failed to boot.
    pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
    try {
      return await attempt(await file.arrayBuffer());
    } catch {
      throw err;
    }
  }
}

function excerpt(value: string, max = 140): string {
  try {
    const oneLine = value.replace(/\s+/g, " ").trim();
    return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
  } catch {
    return "";
  }
}

export default function PdfComparePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const [dzA, setDzA] = useState(0);
  const [dzB, setDzB] = useState(0);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [prog, setProg] = useState({ done: 0, total: 0 });
  const [pagesA, setPagesA] = useState<string[]>([]);
  const [pagesB, setPagesB] = useState<string[]>([]);
  const [compared, setCompared] = useState(false);
  const [mode, setMode] = useState<"lines" | "words">("lines");
  const [active, setActive] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const textA = useMemo(() => pagesA.join("\n\n"), [pagesA]);
  const textB = useMemo(() => pagesB.join("\n\n"), [pagesB]);

  const parts: Change[] = useMemo(() => {
    try {
      if (!compared) return [];
      return mode === "lines"
        ? diffLines(textA, textB)
        : diffWords(textA, textB);
    } catch {
      return [];
    }
  }, [compared, mode, textA, textB]);

  const changeIdxs = useMemo(
    () => parts.map((p, i) => (p.added || p.removed ? i : -1)).filter((i) => i >= 0),
    [parts],
  );

  const addedCount = useMemo(
    () =>
      parts.reduce((n, p) => {
        try {
          return n + (p.added ? (p.count ?? 0) : 0);
        } catch {
          return n;
        }
      }, 0),
    [parts],
  );
  const removedCount = useMemo(
    () =>
      parts.reduce((n, p) => {
        try {
          return n + (p.removed ? (p.count ?? 0) : 0);
        } catch {
          return n;
        }
      }, 0),
    [parts],
  );
  const changedPageCount = useMemo(() => {
    try {
      const n = Math.max(pagesA.length, pagesB.length);
      let c = 0;
      for (let i = 0; i < n; i++) {
        if ((pagesA[i] ?? "") !== (pagesB[i] ?? "")) c++;
      }
      return compared ? c : 0;
    } catch {
      return 0;
    }
  }, [compared, pagesA, pagesB]);

  const emptyA = compared && pagesA.length > 0 && pagesA.every((t) => t.length === 0);
  const emptyB = compared && pagesB.length > 0 && pagesB.every((t) => t.length === 0);

  const handlePickA = (files: File[]): void => {
    try {
      const f = files[0];
      setDzA((k) => k + 1);
      if (!f) return;
      setCompared(false);
      setPagesA([]);
      setPagesB((prev) => prev);
      setFileA(f);
    } catch {
      toast.error(s.error);
    }
  };
  const handlePickB = (files: File[]): void => {
    try {
      const f = files[0];
      setDzB((k) => k + 1);
      if (!f) return;
      setCompared(false);
      setFileB(f);
    } catch {
      toast.error(s.error);
    }
  };

  const handleCompare = async (): Promise<void> => {
    if (!fileA || !fileB || busy) {
      if (!fileA || !fileB) toast.error(s.needFiles);
      return;
    }
    setBusy(true);
    setCompared(false);
    setActive(0);
    try {
      if (mountedRef.current) {
        setPhase(s.labelA);
        setProg({ done: 0, total: 0 });
      }
      const a = await extractPdfText(fileA, (done, total) => {
        if (mountedRef.current) {
          setPhase(s.labelA);
          setProg({ done, total });
        }
      });
      if (mountedRef.current) {
        setPhase(s.labelB);
        setProg({ done: 0, total: 0 });
      }
      const b = await extractPdfText(fileB, (done, total) => {
        if (mountedRef.current) {
          setPhase(s.labelB);
          setProg({ done, total });
        }
      });
      if (!mountedRef.current) return;
      setPagesA(a);
      setPagesB(b);
      setCompared(true);
      setActive(0);
      toast.success(s.success);
    } catch {
      if (mountedRef.current) toast.error(s.fail);
    } finally {
      if (mountedRef.current) {
        setBusy(false);
        setPhase("");
        setProg({ done: 0, total: 0 });
      }
    }
  };

  const handleReset = (): void => {
    try {
      setFileA(null);
      setFileB(null);
      setPagesA([]);
      setPagesB([]);
      setCompared(false);
      setActive(0);
      setBusy(false);
      setPhase("");
      setProg({ done: 0, total: 0 });
      setDzA((k) => k + 1);
      setDzB((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const jumpTo = (idx: number): void => {
    try {
      if (changeIdxs.length === 0) return;
      const clamped = Math.max(0, Math.min(idx, changeIdxs.length - 1));
      setActive(clamped);
      const partIdx = changeIdxs[clamped];
      for (const side of ["a", "b"] as const) {
        try {
          document
            .getElementById(`cmp-${side}-${partIdx}`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch {
          // ignore per-pane scroll errors
        }
      }
    } catch {
      toast.error(s.error);
    }
  };

  const renderPane = (side: "a" | "b"): React.JSX.Element[] =>
    parts.map((p, i) => {
      try {
        if (side === "a" && p.added) return <span key={i} />;
        if (side === "b" && p.removed) return <span key={i} />;
        const changed = Boolean(p.added || p.removed);
        const isActive =
          changed && changeIdxs[active] === i && changeIdxs.length > 0;
        return (
          <span
            key={i}
            id={changed ? `cmp-${side}-${i}` : undefined}
            className={cn(
              changed && p.removed &&
                "rounded bg-red-200/80 text-red-950 dark:bg-red-950/70 dark:text-red-200",
              changed && p.added &&
                "rounded bg-emerald-200/80 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200",
              isActive && "ring-2 ring-indigo-500 ring-offset-1",
            )}
          >
            {p.value}
          </span>
        );
      } catch {
        return <span key={i} />;
      }
    });

  const percent = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Files"
      slug="pdf/compare"
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.labelA}
                </p>
                <FileDropzone
                  key={dzA}
                  accept={{ "application/pdf": [".pdf"] }}
                  multiple={false}
                  maxSizeMB={50}
                  preview={false}
                  helperText={s.dropHint}
                  onFiles={handlePickA}
                />
                {fileA && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{fileA.name}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.labelB}
                </p>
                <FileDropzone
                  key={dzB}
                  accept={{ "application/pdf": [".pdf"] }}
                  multiple={false}
                  maxSizeMB={50}
                  preview={false}
                  helperText={s.dropHint}
                  onFiles={handlePickB}
                />
                {fileB && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{fileB.name}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleCompare()}
                disabled={!fileA || !fileB || busy}
                size="lg"
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <ArrowLeftRight aria-hidden />
                )}
                {busy ? s.comparing : s.compare}
              </Button>
              {(fileA || fileB) && (
                <Button variant="outline" size="lg" onClick={handleReset} disabled={busy}>
                  <Trash2 aria-hidden />
                  {s.reset}
                </Button>
              )}
            </div>

            {busy && (
              <div role="status" aria-label={s.comparing}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {prog.total > 0
                    ? `${s.extracting(phase, prog.done, prog.total)} ${percent}%`
                    : s.comparing}
                </p>
              </div>
            )}

            {(emptyA || emptyB) && (
              <div className="space-y-2">
                {emptyA && (
                  <div
                    role="note"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <p className="font-semibold">{s.emptyA}</p>
                    <p className="mt-1 text-xs leading-relaxed">{s.emptyBody}</p>
                    <Link
                      href="/tools/pdf/ocr"
                      className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      {s.emptyCta}
                    </Link>
                  </div>
                )}
                {emptyB && (
                  <div
                    role="note"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <p className="font-semibold">{s.emptyB}</p>
                    <p className="mt-1 text-xs leading-relaxed">{s.emptyBody}</p>
                    <Link
                      href="/tools/pdf/ocr"
                      className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      {s.emptyCta}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {compared && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-600 font-mono text-white hover:bg-emerald-600">
                    {s.added(addedCount)}
                  </Badge>
                  <Badge className="bg-red-600 font-mono text-white hover:bg-red-600">
                    {s.removed(removedCount)}
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    {s.changedPages(changedPageCount)}
                  </Badge>
                </div>
                <div
                  role="group"
                  aria-label={s.modeLabel}
                  className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800"
                >
                  <span className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {s.modeLabel}
                  </span>
                  {(["lines", "words"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        try {
                          setMode(m);
                          setActive(0);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      aria-pressed={mode === m}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        mode === m
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                      )}
                    >
                      {m === "lines" ? s.modeLines : s.modeWords}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {s.paneA}
                  </p>
                  <div className="h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {renderPane("a")}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {s.paneB}
                  </p>
                  <div className="h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {renderPane("b")}
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.scrollNote}</p>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {s.changesTitle(changeIdxs.length)}
                  </h2>
                  {changeIdxs.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => jumpTo(active - 1)}
                        disabled={changeIdxs.length === 0}
                        aria-label={s.prev}
                      >
                        <ChevronLeft aria-hidden />
                        {s.prev}
                      </Button>
                      <span className="px-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {changeIdxs.length > 0 ? active + 1 : 0}/{changeIdxs.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => jumpTo(active + 1)}
                        disabled={changeIdxs.length === 0}
                        aria-label={s.next}
                      >
                        {s.next}
                        <ChevronRight aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>
                {changeIdxs.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {s.noChanges}
                  </p>
                ) : (
                  <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">
                    {changeIdxs.map((partIdx, listIdx) => {
                      const p = parts[partIdx];
                      const isAdd = Boolean(p?.added);
                      return (
                        <li key={partIdx}>
                          <button
                            type="button"
                            onClick={() => jumpTo(listIdx)}
                            aria-label={s.goTo(listIdx + 1, changeIdxs.length)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-xl border p-2.5 text-left transition-colors",
                              listIdx === active
                                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/50"
                                : "border-zinc-200 bg-white hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900",
                            )}
                          >
                            <Badge
                              className={cn(
                                "mt-0.5 shrink-0 text-white",
                                isAdd
                                  ? "bg-emerald-600 hover:bg-emerald-600"
                                  : "bg-red-600 hover:bg-red-600",
                              )}
                            >
                              {isAdd ? s.addedTag : s.removedTag}
                            </Badge>
                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300">
                              {excerpt(p?.value ?? "")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
