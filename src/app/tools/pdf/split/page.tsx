"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Check, Download, FileText, Loader2, Trash2, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const THUMB_SCALE = 0.35;

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
    renderingLabel: (done: number, total: number) => string;
    extracting: string;
    selectAll: string;
    selectNone: string;
    invert: string;
    selectedCount: (n: number, m: number) => string;
    extract: string;
    extractSuccess: (n: number) => string;
    extractFailed: string;
    nothingSelected: string;
    noFile: string;
    workerFailed: string;
    pageLabel: (n: number) => string;
    togglePage: (n: number) => string;
    error: string;
  }
> = {
  en: {
    title: "Split PDF",
    description:
      "Pick pages visually and extract them into a new PDF. Thumbnails render locally in your browser — nothing is ever uploaded.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    encryptedPdf: (name) =>
      `Could not open "${name}" — it is encrypted or password-protected. Remove the password first, then try again.`,
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Loading pages...",
    renderingLabel: (done, total) => `Rendering page ${done} of ${total}...`,
    extracting: "Extracting...",
    selectAll: "Select all",
    selectNone: "None",
    invert: "Invert",
    selectedCount: (n, m) => `${n} of ${m} selected`,
    extract: "Extract selected",
    extractSuccess: (n) =>
      `Extracted ${n} ${n === 1 ? "page" : "pages"} into split.pdf.`,
    extractFailed: "Failed to extract pages. The file may be corrupted or encrypted.",
    nothingSelected: "Select at least one page to extract.",
    noFile: "Select a PDF file first.",
    workerFailed: "Failed to load the PDF renderer. Check your connection and try again.",
    pageLabel: (n) => `Page ${n}`,
    togglePage: (n) => `Toggle page ${n}`,
    error: "Something went wrong.",
  },
  id: {
    title: "Pisah PDF",
    description:
      "Pilih halaman secara visual dan ekstrak menjadi PDF baru. Thumbnail dirender lokal di browser — tidak ada yang diunggah.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    encryptedPdf: (name) =>
      `Tidak dapat membuka "${name}" — file terenkripsi atau diproteksi kata sandi. Hapus kata sandinya dulu, lalu coba lagi.`,
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Memuat halaman...",
    renderingLabel: (done, total) => `Merender halaman ${done} dari ${total}...`,
    extracting: "Mengekstrak...",
    selectAll: "Pilih semua",
    selectNone: "Batalkan",
    invert: "Balikkan",
    selectedCount: (n, m) => `${n} dari ${m} dipilih`,
    extract: "Ekstrak yang dipilih",
    extractSuccess: (n) => `Berhasil mengekstrak ${n} halaman menjadi split.pdf.`,
    extractFailed: "Gagal mengekstrak halaman. File mungkin rusak atau terenkripsi.",
    nothingSelected: "Pilih minimal satu halaman untuk diekstrak.",
    noFile: "Pilih file PDF terlebih dahulu.",
    workerFailed: "Gagal memuat perender PDF. Periksa koneksimu dan coba lagi.",
    pageLabel: (n) => `Halaman ${n}`,
    togglePage: (n) => `Aktifkan halaman ${n}`,
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I extract only certain pages?",
      a: "Click thumbnails to select the pages you want to keep — selected pages show an indigo ring and a check badge. Use Select all / None / Invert to adjust quickly, then press Extract selected to download a new PDF with just those pages, in original order.",
    },
    id: {
      q: "Bagaimana cara mengekstrak halaman tertentu saja?",
      a: "Klik thumbnail untuk memilih halaman yang ingin dipertahankan — halaman terpilih menampilkan ring indigo dan lencana centang. Gunakan Pilih semua / Batalkan / Balikkan untuk menyesuaikan cepat, lalu tekan Ekstrak yang dipilih untuk mengunduh PDF baru berisi halaman tersebut sesuai urutan aslinya.",
    },
  },
  {
    en: {
      q: "Are my PDFs uploaded to a server?",
      a: "No. Page counting uses pdf-lib and thumbnails render with pdf.js entirely on your device. Your document never leaves your browser, so the tool works offline after the page loads.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Penghitungan halaman memakai pdf-lib dan thumbnail dirender dengan pdf.js sepenuhnya di perangkatmu. Dokumen tidak pernah meninggalkan browser, sehingga tool tetap berfungsi offline setelah halaman termuat.",
    },
  },
  {
    en: {
      q: "Why does my PDF fail to open?",
      a: "The usual causes are password protection or corruption. If you see an encryption error naming your file, remove the password (e.g. re-export or print to PDF without security) and try again.",
    },
    id: {
      q: "Mengapa PDF saya gagal dibuka?",
      a: "Penyebab umum adalah proteksi kata sandi atau file rusak. Jika muncul error enkripsi yang menyebut nama filemu, hapus kata sandinya (mis. ekspor ulang atau cetak ke PDF tanpa keamanan) lalu coba lagi.",
    },
  },
  {
    en: {
      q: "Will the extracted PDF keep its original quality?",
      a: "Yes. Selected pages are copied losslessly with pdf-lib — text, images, and vectors keep their original quality. Thumbnails are only low-resolution previews; the download uses the full-quality source pages.",
    },
    id: {
      q: "Apakah PDF hasil ekstrak mempertahankan kualitas asli?",
      a: "Ya. Halaman terpilih disalin secara lossless dengan pdf-lib — teks, gambar, dan vektor tetap berkualitas asli. Thumbnail hanyalah pratinjau resolusi rendah; file unduhan memakai halaman sumber kualitas penuh.",
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

export default function SplitPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rendering, setRendering] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [done, setDone] = useState(0);

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

  const renderThumbs = async (
    pdfjs: typeof import("pdfjs-dist"),
    raw: ArrayBuffer,
  ): Promise<void> => {
    const task = pdfjs.getDocument({ data: new Uint8Array(raw) });
    const pdf = await task.promise;
    try {
      const n: number = pdf.numPages;
      if (!mountedRef.current) return;
      setPageCount(n);
      setThumbs([]);
      setSelected(new Set());
      setDone(0);
      const out: string[] = [];
      for (let p = 1; p <= n; p++) {
        const page = await pdf.getPage(p);
        try {
          const viewport = page.getViewport({ scale: THUMB_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error(s.workerFailed);
          await page.render({ canvas, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          out.push(dataUrl);
          if (!mountedRef.current) return;
          setThumbs([...out]);
          setDone(p);
        } finally {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
      }
    } finally {
      try {
        await task.destroy();
      } catch {
        // ignore
      }
    }
  };

  const loadFile = async (picked: File): Promise<void> => {
    setRendering(true);
    setPageCount(0);
    setThumbs([]);
    setSelected(new Set());
    setDone(0);
    try {
      // Page count via pdf-lib first (fast); encrypted PDFs fail loudly here.
      try {
        const bytes = await picked.arrayBuffer();
        if (!mountedRef.current) return;
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (doc.getPageCount() === 0) throw new Error(s.invalidPdf);
      } catch {
        if (!mountedRef.current) return;
        toast.error(s.encryptedPdf(picked.name));
        setFile(null);
        setDzKey((k) => k + 1);
        return;
      }

      // Thumbnails via pdf.js (dynamic import keeps it out of the initial bundle).
      // NOTE: the worker is served from /public. Do NOT use
      // `new URL(..., import.meta.url)` — it breaks the production build.
      const pdfjs = await import("pdfjs-dist");
      const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const raw = await picked.arrayBuffer();
      if (!mountedRef.current) return;
      try {
        await renderThumbs(pdfjs, raw);
      } catch (err) {
        // Retry once with the CDN worker if the local one failed.
        if (!mountedRef.current) return;
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        const rawRetry = await picked.arrayBuffer();
        if (!mountedRef.current) return;
        try {
          await renderThumbs(pdfjs, rawRetry);
        } catch {
          throw err;
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error && err.message ? err.message : s.workerFailed;
      toast.error(`${picked.name} ${s.invalidPdf} ${msg}`);
      setFile(null);
      setPageCount(0);
      setThumbs([]);
      setSelected(new Set());
      setDzKey((k) => k + 1);
    } finally {
      if (mountedRef.current) setRendering(false);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      // Clear the dropzone's internal list so this page owns all display.
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
      setThumbs([]);
      setSelected(new Set());
      setDone(0);
      setExtracting(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const togglePage = (index: number): void => {
    try {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleSelectAll = (): void => {
    try {
      setSelected(new Set(thumbs.map((_, i) => i)));
    } catch {
      toast.error(s.error);
    }
  };

  const handleSelectNone = (): void => {
    try {
      setSelected(new Set());
    } catch {
      toast.error(s.error);
    }
  };

  const handleInvert = (): void => {
    try {
      setSelected((prev) => {
        const next = new Set<number>();
        for (let i = 0; i < thumbs.length; i++) {
          if (!prev.has(i)) next.add(i);
        }
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleExtract = async (): Promise<void> => {
    if (!file || extracting) {
      if (!file) toast.error(s.noFile);
      return;
    }
    if (selected.size === 0) {
      toast.error(s.nothingSelected);
      return;
    }
    setExtracting(true);
    try {
      const indices = Array.from(selected).sort((a, b) => a - b);
      const bytes = await file.arrayBuffer();
      if (!mountedRef.current) return;
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        toast.error(s.encryptedPdf(file.name));
        return;
      }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      for (const p of copied) out.addPage(p);
      if (mountedRef.current) setDone(indices.length);
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
        a.download = "split.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.extractFailed);
        return;
      }
      toast.success(s.extractSuccess(indices.length));
    } catch {
      if (mountedRef.current) toast.error(s.extractFailed);
    } finally {
      if (mountedRef.current) setExtracting(false);
    }
  };

  const busy = rendering || extracting;
  const progressPct = rendering
    ? pageCount > 0
      ? Math.round((done / pageCount) * 100)
      : 0
    : extracting
      ? 100
      : 0;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Files" slug="pdf/split" faq={FAQ}>
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
                    {pageCount > 0 ? ` · ${s.selectedCount(selected.size, pageCount)}` : ""}
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

            {(rendering || extracting) && (
              <div className="mt-4" role="status" aria-label={rendering ? s.loading : s.extracting}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {rendering
                    ? pageCount > 0
                      ? s.renderingLabel(done, pageCount)
                      : s.loading
                    : `${s.extracting} ${progressPct}%`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {thumbs.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={busy}>
                  {s.selectAll}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone} disabled={busy}>
                  {s.selectNone}
                </Button>
                <Button variant="outline" size="sm" onClick={handleInvert} disabled={busy}>
                  {s.invert}
                </Button>
                <Badge variant="secondary" className="ml-auto rounded-lg font-mono">
                  {s.selectedCount(selected.size, thumbs.length)}
                </Badge>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {thumbs.map((src, i) => {
                  const isSelected = selected.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => togglePage(i)}
                        aria-pressed={isSelected}
                        aria-label={s.togglePage(i + 1)}
                        className={cn(
                          "relative block w-full overflow-hidden rounded-xl border-2 bg-zinc-100 transition-all dark:bg-zinc-800",
                          isSelected
                            ? "border-indigo-600 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={s.pageLabel(i + 1)}
                          className="aspect-[3/4] w-full object-contain"
                          loading="lazy"
                        />
                        <span className="absolute left-2 top-2 rounded-lg bg-zinc-900/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                          {i + 1}
                        </span>
                        {isSelected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                            <Check className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleExtract()}
                  disabled={selected.size === 0 || busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {extracting ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Download aria-hidden />
                  )}
                  {extracting ? s.extracting : s.extract}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} disabled={busy}>
                  <Trash2 aria-hidden />
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
