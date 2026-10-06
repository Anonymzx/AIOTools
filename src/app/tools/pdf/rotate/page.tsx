"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Loader2,
  RotateCcw,
  RotateCw,
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

const THUMB_SCALE = 0.3;

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
    applying: string;
    rotateLeft: string;
    rotateRight: string;
    resetAngles: string;
    pageLabel: (n: number) => string;
    rotatePageLeft: (n: number) => string;
    rotatePageRight: (n: number) => string;
    apply: string;
    applySuccess: string;
    applyFailed: string;
    noFile: string;
    workerFailed: string;
    pagesUnit: string;
    error: string;
  }
> = {
  en: {
    title: "Rotate PDF",
    description:
      "Rotate PDF pages globally or per page, visually. Thumbnails render locally in your browser — nothing is ever uploaded.",
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
    applying: "Rotating...",
    rotateLeft: "All left",
    rotateRight: "All right",
    resetAngles: "Reset",
    pageLabel: (n) => `Page ${n}`,
    rotatePageLeft: (n) => `Rotate page ${n} left`,
    rotatePageRight: (n) => `Rotate page ${n} right`,
    apply: "Download rotated PDF",
    applySuccess: "Rotated PDF downloaded as rotated.pdf.",
    applyFailed: "Failed to rotate pages. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    workerFailed: "Failed to load the PDF renderer. Check your connection and try again.",
    pagesUnit: "pages",
    error: "Something went wrong.",
  },
  id: {
    title: "Putar PDF (Rotate PDF)",
    description:
      "Putar halaman PDF global atau per halaman secara visual. Thumbnail dirender lokal di browser — tidak ada yang diunggah.",
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
    applying: "Memutar...",
    rotateLeft: "Semua kiri",
    rotateRight: "Semua kanan",
    resetAngles: "Atur ulang",
    pageLabel: (n) => `Halaman ${n}`,
    rotatePageLeft: (n) => `Putar halaman ${n} ke kiri`,
    rotatePageRight: (n) => `Putar halaman ${n} ke kanan`,
    apply: "Unduh PDF yang diputar",
    applySuccess: "PDF yang diputar diunduh sebagai rotated.pdf.",
    applyFailed: "Gagal memutar halaman. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    workerFailed: "Gagal memuat perender PDF. Periksa koneksimu dan coba lagi.",
    pagesUnit: "halaman",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I rotate pages?",
      a: "Use All left / All right to rotate every page at once, or the small L/R buttons on each thumbnail to adjust pages individually — each click turns the page 90°. Press Download rotated PDF when the preview looks right.",
    },
    id: {
      q: "Bagaimana cara memutar halaman?",
      a: "Gunakan Semua kiri / Semua kanan untuk memutar semua halaman sekaligus, atau tombol L/R kecil pada tiap thumbnail untuk mengatur halaman satu per satu — tiap klik memutar 90°. Tekan Unduh PDF yang diputar setelah pratinjau terlihat benar.",
    },
  },
  {
    en: {
      q: "Are my PDFs uploaded to a server?",
      a: "No. Rotation uses pdf-lib and thumbnails render with pdf.js entirely on your device. Your document never leaves your browser, so the tool works offline after the page loads.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Rotasi memakai pdf-lib dan thumbnail dirender dengan pdf.js sepenuhnya di perangkatmu. Dokumen tidak pernah meninggalkan browser, sehingga tool tetap berfungsi offline setelah halaman termuat.",
    },
  },
  {
    en: {
      q: "Will rotation reduce PDF quality?",
      a: "No. Rotation only changes each page's rotation flag — text, images, and vectors are untouched, so quality is identical to the original file.",
    },
    id: {
      q: "Apakah rotasi menurunkan kualitas PDF?",
      a: "Tidak. Rotasi hanya mengubah flag rotasi tiap halaman — teks, gambar, dan vektor tidak disentuh, sehingga kualitas identik dengan file asli.",
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

export default function RotatePdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);
  const [rendering, setRendering] = useState(false);
  const [applying, setApplying] = useState(false);
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
      setRotations(new Array<number>(n).fill(0));
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
    setRotations([]);
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
      setRotations([]);
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
      setRotations([]);
      setDone(0);
      setApplying(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const shiftAll = (delta: number): void => {
    try {
      setRotations((prev) => prev.map((r) => norm(r + delta)));
    } catch {
      toast.error(s.error);
    }
  };

  const shiftPage = (index: number, delta: number): void => {
    try {
      setRotations((prev) => prev.map((r, i) => (i === index ? norm(r + delta) : r)));
    } catch {
      toast.error(s.error);
    }
  };

  const handleResetAngles = (): void => {
    try {
      setRotations((prev) => prev.map(() => 0));
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
      const indices = src.getPageIndices();
      const copied = await out.copyPages(src, indices);
      copied.forEach((page, i) => {
        try {
          const base = src.getPage(i).getRotation().angle;
          page.setRotation(degrees(norm(base + (rotations[i] ?? 0))));
        } catch {
          page.setRotation(degrees(norm(rotations[i] ?? 0)));
        }
        out.addPage(page);
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
        a.download = "rotated.pdf";
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

  const busy = rendering || applying;
  const progressPct = rendering
    ? pageCount > 0
      ? Math.round((done / pageCount) * 100)
      : 0
    : applying
      ? 100
      : 0;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="RotateCw" slug="pdf/rotate" faq={FAQ}>
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

            {(rendering || applying) && (
              <div className="mt-4" role="status" aria-label={rendering ? s.loading : s.applying}>
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
                    : `${s.applying} ${progressPct}%`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {thumbs.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftAll(-90)}
                  disabled={busy}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {s.rotateLeft}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftAll(90)}
                  disabled={busy}
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  {s.rotateRight}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAngles}
                  disabled={busy}
                >
                  {s.resetAngles}
                </Button>
                <Badge variant="secondary" className="ml-auto rounded-lg font-mono">
                  {thumbs.length} {s.pagesUnit}
                </Badge>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {thumbs.map((src, i) => {
                  const deg = norm(rotations[i] ?? 0);
                  return (
                    <li
                      key={i}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
                    >
                      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={s.pageLabel(i + 1)}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${deg}deg)` }}
                        />
                        <span className="absolute left-2 top-2 rounded-lg bg-zinc-900/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                          {i + 1}
                        </span>
                        <span
                          className={cn(
                            "absolute right-2 top-2 rounded-lg px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                            deg === 0
                              ? "bg-zinc-900/50 text-zinc-200"
                              : "bg-indigo-600 text-white",
                          )}
                        >
                          {deg}°
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 border-t border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => shiftPage(i, -90)}
                          disabled={busy}
                          aria-label={s.rotatePageLeft(i + 1)}
                          className="h-8 flex-1"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => shiftPage(i, 90)}
                          disabled={busy}
                          aria-label={s.rotatePageRight(i + 1)}
                          className="h-8 flex-1"
                        >
                          <RotateCw className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
