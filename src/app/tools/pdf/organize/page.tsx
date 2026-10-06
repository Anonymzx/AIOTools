"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileText,
  GripVertical,
  Loader2,
  RotateCcw,
  RotateCw,
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
import { cn } from "@/lib/utils";

const THUMB_SCALE = 0.35;

interface OrganizeItem {
  id: string;
  src: number;
  rot: number;
}

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
    exporting: string;
    rotateAllLeft: string;
    rotateAllRight: string;
    resetAll: string;
    reorderHint: string;
    pageLabel: (n: number) => string;
    fromPage: (n: number) => string;
    moveLeft: string;
    moveRight: string;
    rotateLeft: (n: number) => string;
    rotateRight: (n: number) => string;
    duplicate: (n: number) => string;
    delete: (n: number) => string;
    keepOne: string;
    duplicated: (n: number) => string;
    deleted: (n: number) => string;
    export: string;
    exportSuccess: (n: number) => string;
    exportFailed: string;
    noFile: string;
    workerFailed: string;
    pagesUnit: string;
    error: string;
  }
> = {
  en: {
    title: "Organize PDF",
    description:
      "Reorder, rotate, duplicate, and delete PDF pages visually. Thumbnails render locally in your browser — nothing is ever uploaded.",
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
    exporting: "Exporting...",
    rotateAllLeft: "All left",
    rotateAllRight: "All right",
    resetAll: "Reset",
    reorderHint: "Drag cards to reorder, or use the arrow buttons. Rotate, duplicate, or delete pages individually.",
    pageLabel: (n) => `Page ${n}`,
    fromPage: (n) => `from p.${n}`,
    moveLeft: "Move earlier",
    moveRight: "Move later",
    rotateLeft: (n) => `Rotate page ${n} left`,
    rotateRight: (n) => `Rotate page ${n} right`,
    duplicate: (n) => `Duplicate page ${n}`,
    delete: (n) => `Delete page ${n}`,
    keepOne: "A PDF needs at least one page — cannot delete the last one.",
    duplicated: (n) => `Duplicated page ${n}.`,
    deleted: (n) => `Deleted page ${n}.`,
    export: "Download organized PDF",
    exportSuccess: (n) => `Exported ${n} ${n === 1 ? "page" : "pages"} as organized.pdf.`,
    exportFailed: "Failed to export. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    workerFailed: "Failed to load the PDF renderer. Check your connection and try again.",
    pagesUnit: "pages",
    error: "Something went wrong.",
  },
  id: {
    title: "Atur PDF (Organize PDF)",
    description:
      "Susun ulang, putar, duplikat, dan hapus halaman PDF secara visual. Thumbnail dirender lokal di browser — tidak ada yang diunggah.",
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
    exporting: "Mengekspor...",
    rotateAllLeft: "Semua kiri",
    rotateAllRight: "Semua kanan",
    resetAll: "Atur ulang",
    reorderHint: "Seret kartu untuk menyusun ulang, atau gunakan tombol panah. Putar, duplikat, atau hapus halaman satu per satu.",
    pageLabel: (n) => `Halaman ${n}`,
    fromPage: (n) => `dari hl.${n}`,
    moveLeft: "Pindah lebih awal",
    moveRight: "Pindah lebih akhir",
    rotateLeft: (n) => `Putar halaman ${n} ke kiri`,
    rotateRight: (n) => `Putar halaman ${n} ke kanan`,
    duplicate: (n) => `Duplikat halaman ${n}`,
    delete: (n) => `Hapus halaman ${n}`,
    keepOne: "PDF membutuhkan minimal satu halaman — tidak bisa menghapus yang terakhir.",
    duplicated: (n) => `Halaman ${n} diduplikat.`,
    deleted: (n) => `Halaman ${n} dihapus.`,
    export: "Unduh PDF yang diatur",
    exportSuccess: (n) => `Berhasil mengekspor ${n} halaman sebagai organized.pdf.`,
    exportFailed: "Gagal mengekspor. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    workerFailed: "Gagal memuat perender PDF. Periksa koneksimu dan coba lagi.",
    pagesUnit: "halaman",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I reorder pages?",
      a: "Drag any page card by its grip handle to a new position, or use the left/right arrow buttons on each card — ideal on touch screens. The first card becomes page 1 of the exported PDF.",
    },
    id: {
      q: "Bagaimana cara menyusun ulang halaman?",
      a: "Seret kartu halaman lewat gagang grip ke posisi baru, atau gunakan tombol panah kiri/kanan pada tiap kartu — ideal untuk layar sentuh. Kartu pertama menjadi halaman 1 PDF hasil ekspor.",
    },
  },
  {
    en: {
      q: "What do rotate, duplicate, and delete do?",
      a: "Rotate turns a single page 90° left or right per click. Duplicate inserts an identical copy right after the page. Delete removes it — at least one page is always kept so the PDF stays valid.",
    },
    id: {
      q: "Apa fungsi putar, duplikat, dan hapus?",
      a: "Putar memutar satu halaman 90° ke kiri atau kanan per klik. Duplikat menyisipkan salinan identik tepat setelah halaman tersebut. Hapus menghilangkannya — minimal satu halaman selalu dipertahankan agar PDF tetap valid.",
    },
  },
  {
    en: {
      q: "Will organizing reduce PDF quality?",
      a: "No. Pages are copied losslessly with pdf-lib in your chosen order, with only the rotation flag changed. Text, images, and vectors keep their original quality.",
    },
    id: {
      q: "Apakah pengaturan menurunkan kualitas PDF?",
      a: "Tidak. Halaman disalin secara lossless dengan pdf-lib sesuai urutan pilihanmu, hanya flag rotasi yang diubah. Teks, gambar, dan vektor tetap berkualitas asli.",
    },
  },
  {
    en: {
      q: "Are my PDFs uploaded to a server?",
      a: "No. Thumbnails render with pdf.js and organizing uses pdf-lib entirely on your device. Your document never leaves your browser.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Thumbnail dirender dengan pdf.js dan pengaturan memakai pdf-lib sepenuhnya di perangkatmu. Dokumen tidak pernah meninggalkan browser.",
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

function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `pg-${Date.now()}-${idCounter}`;
}

export default function OrganizePdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [items, setItems] = useState<OrganizeItem[]>([]);
  const [rendering, setRendering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(0);
  const [dragOver, setDragOver] = useState<number | null>(null);

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
      setItems(
        Array.from({ length: n }, (_, i) => ({ id: makeId(), src: i, rot: 0 })),
      );
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
          out.push(canvas.toDataURL("image/jpeg", 0.7));
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
    setItems([]);
    setDone(0);
    try {
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
      setItems([]);
      setDzKey((k) => k + 1);
    } finally {
      if (mountedRef.current) setRendering(false);
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
      setThumbs([]);
      setItems([]);
      setDone(0);
      setExporting(false);
      setDragOver(null);
      dragIndexRef.current = null;
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const move = (from: number, to: number): void => {
    try {
      setItems((prev) => {
        if (to < 0 || to >= prev.length) return prev;
        const next = [...prev];
        const [m] = next.splice(from, 1);
        if (!m) return prev;
        next.splice(to, 0, m);
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const rotateItem = (index: number, delta: number): void => {
    try {
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, rot: norm(it.rot + delta) } : it)),
      );
    } catch {
      toast.error(s.error);
    }
  };

  const rotateAll = (delta: number): void => {
    try {
      setItems((prev) => prev.map((it) => ({ ...it, rot: norm(it.rot + delta) })));
    } catch {
      toast.error(s.error);
    }
  };

  const resetAll = (): void => {
    try {
      setItems((prev) =>
        Array.from({ length: pageCount }, (_, i) => {
          const existing = prev.find((it) => it.src === i);
          return { id: existing?.id ?? makeId(), src: i, rot: 0 };
        }),
      );
    } catch {
      toast.error(s.error);
    }
  };

  const duplicateItem = (index: number): void => {
    try {
      setItems((prev) => {
        const target = prev[index];
        if (!target) return prev;
        const next = [...prev];
        next.splice(index + 1, 0, { id: makeId(), src: target.src, rot: target.rot });
        return next;
      });
      const target = items[index];
      if (target) toast.success(s.duplicated(target.src + 1));
    } catch {
      toast.error(s.error);
    }
  };

  const deleteItem = (index: number): void => {
    try {
      if (items.length <= 1) {
        toast.error(s.keepOne);
        return;
      }
      const target = items[index];
      setItems((prev) => prev.filter((_, i) => i !== index));
      if (target) toast.success(s.deleted(target.src + 1));
    } catch {
      toast.error(s.error);
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!file || exporting) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setExporting(true);
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
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        items.map((it) => it.src),
      );
      copied.forEach((page, i) => {
        try {
          const item = items[i];
          const base = src.getPage(item?.src ?? 0).getRotation().angle;
          page.setRotation(degrees(norm(base + (item?.rot ?? 0))));
        } catch {
          page.setRotation(degrees(norm(items[i]?.rot ?? 0)));
        }
        out.addPage(page);
        if (mountedRef.current) setDone(i + 1);
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
        a.download = "organized.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.exportFailed);
        return;
      }
      toast.success(s.exportSuccess(items.length));
    } catch {
      if (mountedRef.current) toast.error(s.exportFailed);
    } finally {
      if (mountedRef.current) setExporting(false);
    }
  };

  const busy = rendering || exporting;
  const progressPct = rendering
    ? pageCount > 0
      ? Math.round((done / pageCount) * 100)
      : 0
    : exporting && items.length > 0
      ? Math.min(100, Math.round((done / items.length) * 100))
      : 0;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Layers" slug="pdf/organize" faq={FAQ}>
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

            {(rendering || exporting) && (
              <div className="mt-4" role="status" aria-label={rendering ? s.loading : s.exporting}>
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
                    : `${s.exporting} ${progressPct}%`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => rotateAll(-90)} disabled={busy}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {s.rotateAllLeft}
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotateAll(90)} disabled={busy}>
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  {s.rotateAllRight}
                </Button>
                <Button variant="ghost" size="sm" onClick={resetAll} disabled={busy}>
                  {s.resetAll}
                </Button>
                <Badge variant="secondary" className="ml-auto rounded-lg font-mono">
                  {items.length} {s.pagesUnit}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{s.reorderHint}</p>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((it, i) => {
                  const thumb = thumbs[it.src] ?? "";
                  const deg = norm(it.rot);
                  return (
                    <li
                      key={it.id}
                      draggable={!busy}
                      onDragStart={() => {
                        dragIndexRef.current = i;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(i);
                      }}
                      onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndexRef.current;
                        dragIndexRef.current = null;
                        setDragOver(null);
                        if (from !== null && from !== i) move(from, i);
                      }}
                      onDragEnd={() => {
                        dragIndexRef.current = null;
                        setDragOver(null);
                      }}
                      className={cn(
                        "overflow-hidden rounded-xl border bg-white shadow-sm transition-colors dark:bg-zinc-900",
                        dragOver === i
                          ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                          : "border-zinc-200 dark:border-zinc-800",
                      )}
                    >
                      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-zinc-100 p-2 dark:bg-zinc-800">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={s.pageLabel(it.src + 1)}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain transition-transform duration-200"
                            style={{ transform: `rotate(${deg}deg)` }}
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
                        )}
                        <span className="absolute left-2 top-2 rounded-lg bg-zinc-900/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                          {i + 1}
                        </span>
                        <span className="absolute left-2 top-8 rounded-lg bg-zinc-900/50 px-1.5 py-0.5 text-[10px] text-zinc-200">
                          {s.fromPage(it.src + 1)}
                        </span>
                        {deg !== 0 && (
                          <span className="absolute right-2 top-2 rounded-lg bg-indigo-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                            {deg}°
                          </span>
                        )}
                        <span
                          className="absolute right-2 top-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-zinc-400 active:cursor-grabbing dark:text-zinc-500"
                          aria-hidden
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-0.5 border-t border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-full"
                          onClick={() => move(i, i - 1)} disabled={busy || i === 0}
                          aria-label={`${s.moveLeft} (${i + 1})`}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-full"
                          onClick={() => move(i, i + 1)} disabled={busy || i === items.length - 1}
                          aria-label={`${s.moveRight} (${i + 1})`}
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-full"
                          onClick={() => rotateItem(i, -90)} disabled={busy}
                          aria-label={s.rotateLeft(it.src + 1)}
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-full"
                          onClick={() => rotateItem(i, 90)} disabled={busy}
                          aria-label={s.rotateRight(it.src + 1)}
                        >
                          <RotateCw className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-full"
                          onClick={() => duplicateItem(i)} disabled={busy}
                          aria-label={s.duplicate(it.src + 1)}
                        >
                          <Copy className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-full text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => deleteItem(i)} disabled={busy}
                          aria-label={s.delete(it.src + 1)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleExport()}
                  disabled={busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {exporting ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Download aria-hidden />
                  )}
                  {exporting ? s.exporting : s.export}
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
