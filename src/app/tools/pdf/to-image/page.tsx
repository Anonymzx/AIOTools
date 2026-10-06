"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Download,
  FileText,
  Images,
  Loader2,
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

const RENDER_SCALE = 2.0;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    invalidType: string;
    convert: string;
    converting: string;
    reset: string;
    resetFile: string;
    qualityNote: string;
    fileLabel: string;
    outputLabel: string;
    progressLabel: (done: number, total: number) => string;
    pageLabel: (n: number) => string;
    downloadPage: (n: number) => string;
    downloadAll: string;
    zipping: string;
    convertSuccess: (n: number) => string;
    convertFailed: string;
    zipFailed: string;
    workerFailed: string;
    noCanvas: string;
    renderFailed: (n: number) => string;
    noFile: string;
    error: string;
  }
> = {
  en: {
    title: "PDF to Image",
    description:
      "Convert every page of a PDF into high-quality PNG images. Rendered at fixed 2x scale locally in your browser — download pages individually or as a ZIP.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    convert: "Convert to PNG",
    converting: "Converting...",
    reset: "Start over",
    resetFile: "Remove file",
    qualityNote:
      "Quality note: pages render at a fixed 2x scale (≈192 DPI), giving sharp PNGs suitable for sharing, slides, and printing. Everything runs locally — your PDF never leaves your device.",
    fileLabel: "Selected file",
    outputLabel: "Page images",
    progressLabel: (done, total) => `Rendering page ${done} of ${total}...`,
    pageLabel: (n) => `Page ${n}`,
    downloadPage: (n) => `Download page ${n} as PNG`,
    downloadAll: "Download All (ZIP)",
    zipping: "Creating ZIP...",
    convertSuccess: (n) => `Converted ${n} pages to PNG images.`,
    convertFailed: "Failed to convert PDF. The file may be corrupted or encrypted.",
    zipFailed: "Failed to create ZIP archive.",
    workerFailed: "Failed to load the PDF renderer. Check your connection and try again.",
    noCanvas: "Canvas rendering is not supported in this browser.",
    renderFailed: (n) => `Failed to render page ${n}.`,
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
  },
  id: {
    title: "PDF ke Gambar",
    description:
      "Ubah setiap halaman PDF menjadi gambar PNG berkualitas tinggi. Dirender pada skala tetap 2x secara lokal di browser — unduh per halaman atau sekaligus sebagai ZIP.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    convert: "Ubah ke PNG",
    converting: "Mengubah...",
    reset: "Mulai ulang",
    resetFile: "Hapus file",
    qualityNote:
      "Catatan kualitas: halaman dirender pada skala tetap 2x (≈192 DPI), menghasilkan PNG tajam yang cocok untuk dibagikan, slide, dan cetak. Semua berjalan lokal — PDF tidak pernah meninggalkan perangkatmu.",
    fileLabel: "File terpilih",
    outputLabel: "Gambar halaman",
    progressLabel: (done, total) => `Merender halaman ${done} dari ${total}...`,
    pageLabel: (n) => `Halaman ${n}`,
    downloadPage: (n) => `Unduh halaman ${n} sebagai PNG`,
    downloadAll: "Unduh Semua (ZIP)",
    zipping: "Membuat ZIP...",
    convertSuccess: (n) => `Berhasil mengubah ${n} halaman menjadi gambar PNG.`,
    convertFailed: "Gagal mengubah PDF. File mungkin rusak atau terenkripsi.",
    zipFailed: "Gagal membuat arsip ZIP.",
    workerFailed: "Gagal memuat perender PDF. Periksa koneksimu dan coba lagi.",
    noCanvas: "Render canvas tidak didukung di browser ini.",
    renderFailed: (n) => `Gagal merender halaman ${n}.`,
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What image quality do I get?",
      a: "Every page renders at a fixed 2x scale (about 192 DPI) and exports as PNG, which is lossless. The result is sharp enough for slides, documents, and prints — much crisper than a screenshot.",
    },
    id: {
      q: "Bagaimana kualitas gambar yang dihasilkan?",
      a: "Setiap halaman dirender pada skala tetap 2x (sekitar 192 DPI) dan diekspor sebagai PNG yang lossless. Hasilnya tajam untuk slide, dokumen, dan cetakan — jauh lebih jernih daripada tangkapan layar.",
    },
  },
  {
    en: {
      q: "How do I download all pages at once?",
      a: "Use the “Download All (ZIP)” button after conversion. Pages are named page-01.png, page-02.png, and so on, in reading order — ready to extract anywhere.",
    },
    id: {
      q: "Bagaimana cara mengunduh semua halaman sekaligus?",
      a: "Gunakan tombol “Unduh Semua (ZIP)” setelah konversi. Halaman diberi nama page-01.png, page-02.png, dan seterusnya sesuai urutan baca — siap diekstrak di mana saja.",
    },
  },
  {
    en: {
      q: "Are my PDFs uploaded anywhere?",
      a: "No. Rendering uses pdf.js entirely on your device, and even the PDF worker script is loaded locally with a CDN fallback. Your documents never leave your browser.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke mana pun?",
      a: "Tidak. Rendering memakai pdf.js sepenuhnya di perangkatmu, bahkan skrip worker PDF dimuat secara lokal dengan cadangan CDN. Dokumen tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "Why does conversion fail on some PDFs?",
      a: "The usual causes are password protection, corruption, or extremely large pages that exhaust device memory. Remove the password or re-export the PDF, then try again with a smaller file.",
    },
    id: {
      q: "Mengapa konversi gagal pada beberapa PDF?",
      a: "Penyebab umum adalah proteksi kata sandi, file rusak, atau halaman yang sangat besar sehingga menghabiskan memori perangkat. Hapus kata sandinya atau ekspor ulang PDF, lalu coba lagi dengan file yang lebih kecil.",
    },
  },
];

interface PageImage {
  page: number;
  url: string;
  blob: Blob;
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

function downloadUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function PdfToImagePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const mounted = mountedRef;
  const imagesRef = useRef<PageImage[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [images, setImages] = useState<PageImage[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const snapshot = imagesRef.current;
      imagesRef.current = [];
      for (const im of snapshot) {
        try {
          URL.revokeObjectURL(im.url);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const pushImage = (im: PageImage): void => {
    imagesRef.current = [...imagesRef.current, im];
    setImages([...imagesRef.current]);
  };

  const clearImages = (): void => {
    const snapshot = imagesRef.current;
    imagesRef.current = [];
    setImages([]);
    for (const im of snapshot) {
      try {
        URL.revokeObjectURL(im.url);
      } catch {
        // ignore
      }
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
      clearImages();
      setDone(0);
      setTotal(0);
      setFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRemoveFile = (): void => {
    try {
      clearImages();
      setFile(null);
      setDone(0);
      setTotal(0);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      clearImages();
      setFile(null);
      setDone(0);
      setTotal(0);
      setConverting(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const renderAll = async (
    pdfjs: typeof import("pdfjs-dist"),
    raw: ArrayBuffer,
  ): Promise<number> => {
    const task = pdfjs.getDocument({ data: new Uint8Array(raw) });
    const pdf = await task.promise;
    try {
      const pageCount: number = pdf.numPages;
      if (!mounted.current) return 0;
      setTotal(pageCount);
      setDone(0);
      for (let p = 1; p <= pageCount; p++) {
        const page = await pdf.getPage(p);
        try {
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error(s.noCanvas);
          await page.render({ canvas, viewport }).promise;
          const blob: Blob = await new Promise((resolve, reject) => {
            try {
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error(s.renderFailed(p)))),
                "image/png",
              );
            } catch (err) {
              reject(err instanceof Error ? err : new Error(s.renderFailed(p)));
            }
          });
          if (!mounted.current) return 0;
          const url = URL.createObjectURL(blob);
          pushImage({ page: p, url, blob });
          setDone(p);
        } finally {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
      }
      return pageCount;
    } finally {
      try {
        await task.destroy();
      } catch {
        // ignore
      }
    }
  };

  const handleConvert = async (): Promise<void> => {
    if (!file || converting) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setConverting(true);
    clearImages();
    setDone(0);
    setTotal(0);
    try {
      // Dynamic import keeps pdf.js out of the initial page bundle.
      // NOTE: the worker is served from /public (copied from
      // node_modules/pdfjs-dist on install — re-copy after upgrading pdfjs-dist).
      // A `new URL(..., import.meta.url)` reference would make webpack bundle
      // pdf.worker.min.mjs and Terser fails on its `import.meta` usage.
      const pdfjs = await import("pdfjs-dist");
      const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const raw = await file.arrayBuffer();
      if (!mounted.current) return;

      let count = 0;
      try {
        count = await renderAll(pdfjs, raw);
      } catch (err) {
        // Fallback: retry once with the CDN worker if the local one failed.
        clearImages();
        setDone(0);
        setTotal(0);
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        const rawRetry = await file.arrayBuffer();
        if (!mounted.current) return;
        try {
          count = await renderAll(pdfjs, rawRetry);
        } catch {
          throw err;
        }
      }
      if (!mounted.current) return;
      if (count > 0) toast.success(s.convertSuccess(count));
    } catch (err) {
      if (!mounted.current) return;
      const msg = err instanceof Error && err.message ? err.message : s.convertFailed;
      // A worker bootstrap failure surfaces as a generic error; hint at connectivity.
      toast.error(msg === s.convertFailed ? msg : `${s.convertFailed} ${msg}`);
      try {
        if (imagesRef.current.length === 0) {
          toast.error(s.workerFailed);
        }
      } catch {
        // ignore
      }
    } finally {
      if (mounted.current) setConverting(false);
    }
  };

  const handleDownloadAll = async (): Promise<void> => {
    if (images.length === 0 || zipping) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const im of images) {
        zip.file(`page-${String(im.page).padStart(2, "0")}.png`, im.blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      try {
        downloadUrl(url, "pdf-images.zip");
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
      if (mounted.current) toast.error(s.zipFailed);
    } finally {
      if (mounted.current) setZipping(false);
    }
  };

  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileOutput"
      slug="to-image"
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
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {s.qualityNote}
            </p>

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
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={converting}
                  aria-label={`${s.resetFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleConvert()}
                disabled={!file || converting}
                size="lg"
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {converting ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Images aria-hidden />
                )}
                {converting ? s.converting : s.convert}
              </Button>
              {(file || images.length > 0) && (
                <Button variant="outline" size="lg" onClick={handleReset} disabled={converting}>
                  <Trash2 aria-hidden />
                  {s.reset}
                </Button>
              )}
            </div>

            {(converting || total > 0) && (
              <div className="mt-4" role="status" aria-label={s.converting}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {total > 0 ? s.progressLabel(done, total) : s.converting} {percent}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {images.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.outputLabel} ({images.length})
                </h2>
                <Button
                  onClick={() => void handleDownloadAll()}
                  disabled={zipping || converting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {zipping ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Archive aria-hidden />
                  )}
                  {zipping ? s.zipping : s.downloadAll}
                </Button>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((im) => (
                  <li
                    key={im.page}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={im.url}
                        alt={s.pageLabel(im.page)}
                        className="aspect-[3/4] w-full object-contain"
                        loading="lazy"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute left-2 top-2 rounded-lg font-mono"
                      >
                        {im.page}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2">
                      <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {s.pageLabel(im.page)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          try {
                            downloadUrl(
                              im.url,
                              `page-${String(im.page).padStart(2, "0")}.png`,
                            );
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        aria-label={s.downloadPage(im.page)}
                      >
                        <Download aria-hidden />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
