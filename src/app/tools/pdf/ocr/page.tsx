"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Copy,
  Check,
  Download,
  FileText,
  Loader2,
  ScanText,
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

const MAX_PAGES = 20;
const RENDER_SCALE = 2.0;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    langLabel: string;
    langEn: string;
    langId: string;
    start: string;
    working: string;
    cancel: string;
    reset: string;
    fileLabel: string;
    removeFile: string;
    modelNote: string;
    staged: (page: number, total: number, pct: number) => string;
    preparing: string;
    buildingPdf: string;
    success: (n: number) => string;
    fail: string;
    tooMany: (n: number) => string;
    noFile: string;
    cancelled: string;
    tabText: string;
    tabPdf: string;
    copy: string;
    copied: string;
    downloadTxt: string;
    downloadPdf: string;
    copyOk: string;
    copyFail: string;
    pageBadge: (n: number) => string;
    confBadge: (n: number) => string;
    combinedLabel: string;
    searchableHint: string;
    statsChars: (n: number) => string;
    statsWords: (n: number) => string;
    privacy: string;
    error: string;
  }
> = {
  en: {
    title: "PDF OCR",
    description:
      "Recognize text in scanned PDFs and photos with on-device OCR. Get plain text plus a searchable PDF with an invisible text layer — all locally in your browser.",
    dropHint: "Drop a PDF, PNG, or JPG here, or click to browse",
    langLabel: "OCR language",
    langEn: "English",
    langId: "Indonesian",
    start: "Run OCR",
    working: "Recognizing…",
    cancel: "Cancel",
    reset: "Start over",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    modelNote:
      "First run downloads a ~10MB language model from CDN and caches it in your browser; later runs start instantly. PDFs are capped at 20 pages to protect device memory.",
    staged: (page, total, pct) => `OCR page ${page} of ${total} — ${pct}%`,
    preparing: "Preparing pages…",
    buildingPdf: "Building searchable PDF…",
    success: (n) => `OCR finished for ${n} page${n === 1 ? "" : "s"}.`,
    fail: "OCR failed. The file may be corrupted, or the model download was blocked.",
    tooMany: (n) => `PDF has ${n} pages — capped at ${MAX_PAGES} to protect memory.`,
    noFile: "Select a PDF or image file first.",
    cancelled: "OCR cancelled.",
    tabText: "Text",
    tabPdf: "Searchable PDF",
    copy: "Copy",
    copied: "Copied",
    downloadTxt: "Download .txt",
    downloadPdf: "Download searchable.pdf",
    copyOk: "Text copied to clipboard.",
    copyFail: "Copy failed — select the text manually.",
    pageBadge: (n) => `Page ${n}`,
    confBadge: (n) => `${n}% confidence`,
    combinedLabel: "Recognized text",
    searchableHint:
      "Each original page image is embedded as the page background with an invisible, selectable text layer drawn over it (sized to each word box), so the PDF looks identical but is fully searchable.",
    statsChars: (n) => `${n.toLocaleString("en-US")} chars`,
    statsWords: (n) => `${n.toLocaleString("en-US")} words`,
    privacy: "Private — runs 100% in your browser",
    error: "Something went wrong.",
  },
  id: {
    title: "OCR PDF",
    description:
      "Kenali teks dalam PDF pindaian dan foto dengan OCR di perangkat. Dapatkan teks biasa plus PDF yang bisa dicari dengan lapisan teks tak terlihat — semuanya lokal di browser.",
    dropHint: "Letakkan PDF, PNG, atau JPG di sini, atau klik untuk memilih",
    langLabel: "Bahasa OCR",
    langEn: "Inggris",
    langId: "Indonesia",
    start: "Jalankan OCR",
    working: "Mengenali…",
    cancel: "Batal",
    reset: "Mulai ulang",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    modelNote:
      "Jalankan pertama mengunduh model bahasa ~10MB dari CDN dan menyimpannya di browser; proses berikutnya langsung mulai. PDF dibatasi 20 halaman untuk melindungi memori perangkat.",
    staged: (page, total, pct) => `OCR halaman ${page} dari ${total} — ${pct}%`,
    preparing: "Menyiapkan halaman…",
    buildingPdf: "Membuat PDF yang bisa dicari…",
    success: (n) => `OCR selesai untuk ${n} halaman.`,
    fail: "OCR gagal. File mungkin rusak, atau unduhan model diblokir.",
    tooMany: (n) => `PDF memiliki ${n} halaman — dibatasi ${MAX_PAGES} demi memori.`,
    noFile: "Pilih file PDF atau gambar terlebih dahulu.",
    cancelled: "OCR dibatalkan.",
    tabText: "Teks",
    tabPdf: "PDF Dicari",
    copy: "Salin",
    copied: "Disalin",
    downloadTxt: "Unduh .txt",
    downloadPdf: "Unduh searchable.pdf",
    copyOk: "Teks disalin ke clipboard.",
    copyFail: "Gagal menyalin — pilih teks secara manual.",
    pageBadge: (n) => `Halaman ${n}`,
    confBadge: (n) => `keyakinan ${n}%`,
    combinedLabel: "Teks hasil pengenalan",
    searchableHint:
      "Setiap gambar halaman asli disematkan sebagai latar dengan lapisan teks tak terlihat yang bisa dipilih di atasnya (disesuaikan dengan kotak tiap kata), sehingga PDF tampak identik namun sepenuhnya bisa dicari.",
    statsChars: (n) => `${n.toLocaleString("id-ID")} karakter`,
    statsWords: (n) => `${n.toLocaleString("id-ID")} kata`,
    privacy: "Privat — 100% berjalan di browser",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Why does the first run take a while?",
      a: "Tesseract.js downloads a ~10MB language model (English or Indonesian) from CDN on first use and caches it in your browser. Later runs skip the download and start recognizing immediately.",
    },
    id: {
      q: "Mengapa proses pertama agak lama?",
      a: "Tesseract.js mengunduh model bahasa ~10MB (Inggris atau Indonesia) dari CDN saat pertama dipakai dan menyimpannya di browser. Proses berikutnya melewati unduhan dan langsung mengenali.",
    },
  },
  {
    en: {
      q: "What is the searchable PDF?",
      a: "It embeds each original page image as the page background, then draws every recognized word as invisible text (opacity 0) sized to its bounding box. The file looks pixel-identical but you can select, copy, and Ctrl+F the text.",
    },
    id: {
      q: "Apa itu PDF yang bisa dicari?",
      a: "Ia menyematkan tiap gambar halaman asli sebagai latar, lalu menggambar setiap kata yang dikenali sebagai teks tak terlihat (opacity 0) seukuran kotak pembatasnya. File tampak identik pikselnya namun teksnya bisa dipilih, disalin, dan dicari dengan Ctrl+F.",
    },
  },
  {
    en: {
      q: "Which language should I pick?",
      a: "Choose the language the document is mostly written in — the matching model is loaded on demand. Mixed documents still work, but accuracy is best when the dominant language matches the selection.",
    },
    id: {
      q: "Bahasa mana yang harus dipilih?",
      a: "Pilih bahasa yang paling banyak dipakai dokumen — model yang cocok dimuat sesuai kebutuhan. Dokumen campuran tetap bisa diproses, tetapi akurasi terbaik saat bahasa dominan sesuai pilihan.",
    },
  },
  {
    en: {
      q: "Why is there a 20-page cap?",
      a: "Each page is rendered at 2x scale and OCR'd in memory, which can exhaust phones and low-end laptops. The 20-page cap keeps the tool reliable; split larger PDFs first, then OCR each part.",
    },
    id: {
      q: "Mengapa dibatasi 20 halaman?",
      a: "Setiap halaman dirender pada skala 2x dan di-OCR dalam memori, yang bisa menghabiskan memori HP dan laptop kelas bawah. Batas 20 halaman menjaga tool tetap andal; bagi PDF besar terlebih dahulu, lalu OCR tiap bagian.",
    },
  },
];

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface OcrPage {
  n: number;
  text: string;
  confidence: number;
  imgBlob: Blob;
  imgUrl: string;
  imgW: number;
  imgH: number;
  words: OcrWord[];
}

interface OcrWorkerLike {
  recognize: (
    image: string,
  ) => Promise<{ data: { text: string; confidence: number; words?: OcrWord[] } }>;
  terminate: () => Promise<void>;
}

interface LoggerMsg {
  status: string;
  progress: number;
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

export default function PdfOcrPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);
  const workerRef = useRef<OcrWorkerLike | null>(null);
  const pagesRef = useRef<OcrPage[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<"eng" | "ind">("eng");
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const [stage, setStage] = useState("");
  const [prog, setProg] = useState({ page: 0, total: 0, pct: 0 });
  const [pages, setPages] = useState<OcrPage[]>([]);
  const [tab, setTab] = useState<"text" | "pdf">("text");
  const [searchableUrl, setSearchableUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      const wp = workerRef.current;
      workerRef.current = null;
      if (wp) {
        try {
          void wp.terminate();
        } catch {
          // ignore
        }
      }
      const snapshot = pagesRef.current;
      pagesRef.current = [];
      for (const p of snapshot) {
        try {
          URL.revokeObjectURL(p.imgUrl);
        } catch {
          // ignore
        }
      }
      // searchableUrl revoked via its own effect below
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (searchableUrl) URL.revokeObjectURL(searchableUrl);
      } catch {
        // ignore
      }
    };
  }, [searchableUrl]);

  const syncPages = (next: OcrPage[]): void => {
    pagesRef.current = next;
    setPages(next);
  };

  const clearOutputs = (): void => {
    const snapshot = pagesRef.current;
    pagesRef.current = [];
    setPages([]);
    for (const p of snapshot) {
      try {
        URL.revokeObjectURL(p.imgUrl);
      } catch {
        // ignore
      }
    }
    if (searchableUrl) {
      try {
        URL.revokeObjectURL(searchableUrl);
      } catch {
        // ignore
      }
      setSearchableUrl(null);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      setDzKey((k) => k + 1);
      if (!picked) return;
      clearOutputs();
      setProg({ page: 0, total: 0, pct: 0 });
      setStage("");
      setCopied(false);
      setFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      clearOutputs();
      setFile(null);
      setProg({ page: 0, total: 0, pct: 0 });
      setStage("");
      setBusy(false);
      setBuilding(false);
      setCopied(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleCancel = async (): Promise<void> => {
    try {
      cancelledRef.current = true;
      const wp = workerRef.current;
      workerRef.current = null;
      if (wp) {
        try {
          await wp.terminate();
        } catch {
          // ignore
        }
      }
      if (mountedRef.current) {
        setBusy(false);
        setBuilding(false);
        setStage("");
        toast.success(s.cancelled);
      }
    } catch {
      toast.error(s.error);
    }
  };

  const renderPdfPages = async (
    pdfjs: typeof import("pdfjs-dist"),
    buf: ArrayBuffer,
    onRender: (done: number, total: number) => void,
  ): Promise<{ blob: Blob; url: string; w: number; h: number }[]> => {
    const task = pdfjs.getDocument({ data: new Uint8Array(buf) });
    const pdf = await task.promise;
    try {
      if (pdf.numPages > MAX_PAGES) throw new Error(`TOO_MANY:${pdf.numPages}`);
      const out: { blob: Blob; url: string; w: number; h: number }[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        if (cancelledRef.current) throw new Error("CANCELLED");
        const page = await pdf.getPage(p);
        try {
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error(s.fail);
          await page.render({ canvas, viewport }).promise;
          const blob: Blob = await new Promise((resolve, reject) => {
            try {
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error(s.fail))),
                "image/png",
              );
            } catch (err) {
              reject(err instanceof Error ? err : new Error(s.fail));
            }
          });
          out.push({
            blob,
            url: URL.createObjectURL(blob),
            w: canvas.width,
            h: canvas.height,
          });
        } finally {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
        onRender(p, pdf.numPages);
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

  const buildSearchablePdf = async (done: OcrPage[]): Promise<string> => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const pg of done) {
      if (cancelledRef.current) throw new Error("CANCELLED");
      const bytes = await pg.imgBlob.arrayBuffer();
      const embedded = await doc.embedPng(bytes);
      // Rendered at 2x (≈192 DPI): scale pixels back to points.
      const k = 72 / 192;
      const pw = Math.max(1, embedded.width * k);
      const ph = Math.max(1, embedded.height * k);
      const page = doc.addPage([pw, ph]);
      page.drawImage(embedded, { x: 0, y: 0, width: pw, height: ph });
      const sx = pw / Math.max(1, pg.imgW);
      const sy = ph / Math.max(1, pg.imgH);
      for (const w of pg.words) {
        try {
          const text = (w.text ?? "").trim();
          if (!text) continue;
          const x0 = Math.max(0, w.bbox.x0 * sx);
          const y1 = Math.min(pg.imgH, w.bbox.y1) * sy;
          const boxH = Math.max(1, (w.bbox.y1 - w.bbox.y0) * sy);
          page.drawText(text, {
            x: x0,
            y: Math.max(0, ph - y1),
            size: Math.max(4, boxH),
            font,
            color: rgb(0, 0, 0),
            opacity: 0,
          });
        } catch {
          // skip words that fail to embed
        }
      }
    }
    const pdfBytes = await doc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const handleStart = async (): Promise<void> => {
    if (!file || busy) {
      if (!file) toast.error(s.noFile);
      return;
    }
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    setBusy(true);
    setBuilding(false);
    cancelledRef.current = false;
    clearOutputs();
    setProg({ page: 0, total: 0, pct: 0 });
    setStage(s.preparing);
    setCopied(false);
    try {
      // 1) Prepare page images.
      let imgs: { blob: Blob; url: string; w: number; h: number }[];
      if (isPdf) {
        const pdfjs = await import("pdfjs-dist");
        const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        try {
          imgs = await renderPdfPages(pdfjs, await file.arrayBuffer(), (d, t) => {
            if (mountedRef.current) {
              setStage(s.preparing);
              setProg({ page: d, total: t, pct: 0 });
            }
          });
        } catch (firstErr) {
          if (cancelledRef.current) throw firstErr;
          pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
          try {
            imgs = await renderPdfPages(pdfjs, await file.arrayBuffer(), (d, t) => {
              if (mountedRef.current) {
                setStage(s.preparing);
                setProg({ page: d, total: t, pct: 0 });
              }
            });
          } catch {
            throw firstErr;
          }
        }
      } else {
        const url = URL.createObjectURL(file);
        try {
          const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            try {
              const img = new Image();
              img.onload = () =>
                resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
              img.onerror = () => reject(new Error(s.fail));
              img.src = url;
            } catch (err) {
              reject(err instanceof Error ? err : new Error(s.fail));
            }
          });
          imgs = [{ blob: file, url, w: dims.w, h: dims.h }];
        } catch (err) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
          throw err;
        }
      }
      if (cancelledRef.current) throw new Error("CANCELLED");
      if (!mountedRef.current) return;

      // 2) OCR each page. Worker is created on demand with the selected language.
      const mod = await import("tesseract.js");
      const createWorker = mod.createWorker as unknown as (
        lang: string,
        oem?: number,
        opts?: { logger?: (m: LoggerMsg) => void },
      ) => Promise<OcrWorkerLike>;
      const worker = await createWorker(lang, undefined, {
        logger: (m) => {
          try {
            if (!mountedRef.current) return;
            if (typeof m.progress === "number") {
              setProg((prev) => {
                if (prev.total === 0) return prev;
                const pct = Math.round(Math.min(1, Math.max(0, m.progress)) * 100);
                if (mountedRef.current) {
                  setStage(s.staged(prev.page, prev.total, pct));
                }
                return { ...prev, pct };
              });
            }
          } catch {
            // logger must never break OCR
          }
        },
      });
      workerRef.current = worker;
      try {
        const donePages: OcrPage[] = [];
        for (let i = 0; i < imgs.length; i++) {
          if (cancelledRef.current) throw new Error("CANCELLED");
          const im = imgs[i];
          if (!im) continue;
          if (mountedRef.current) {
            setProg({ page: i + 1, total: imgs.length, pct: 0 });
            setStage(s.staged(i + 1, imgs.length, 0));
          }
          const res = await worker.recognize(im.url);
          if (cancelledRef.current) throw new Error("CANCELLED");
          const data = res?.data ?? { text: "", confidence: 0 };
          const words = Array.isArray(data.words) ? data.words : [];
          const next = [
            ...donePages,
            {
              n: i + 1,
              text: (data.text ?? "").trim(),
              confidence:
                typeof data.confidence === "number" && Number.isFinite(data.confidence)
                  ? Math.round(data.confidence)
                  : 0,
              imgBlob: im.blob,
              imgUrl: im.url,
              imgW: im.w,
              imgH: im.h,
              words,
            },
          ];
          donePages.length = 0;
          donePages.push(...next);
          if (mountedRef.current) syncPages([...donePages]);
        }
        // 3) Build the searchable PDF.
        if (mountedRef.current) {
          setBuilding(true);
          setStage(s.buildingPdf);
        }
        const url = await buildSearchablePdf(donePages);
        if (cancelledRef.current) throw new Error("CANCELLED");
        if (!mountedRef.current) return;
        setSearchableUrl(url);
        toast.success(s.success(donePages.length));
      } finally {
        workerRef.current = null;
        try {
          await worker.terminate();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "";
      if (msg === "CANCELLED") {
        toast.success(s.cancelled);
      } else if (msg.startsWith("TOO_MANY:")) {
        const n = Number(msg.split(":")[1] ?? "0") || 0;
        toast.error(s.tooMany(n));
      } else {
        toast.error(s.fail);
      }
    } finally {
      if (mountedRef.current) {
        setBusy(false);
        setBuilding(false);
        setStage("");
      }
    }
  };

  const combined = pages.map((p) => p.text).join("\n\n").trim();
  const charCount = combined.length;
  const wordCount = combined.length === 0 ? 0 : combined.split(/\s+/).length;

  const handleCopy = async (): Promise<void> => {
    if (combined.length === 0) return;
    try {
      await navigator.clipboard.writeText(combined);
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
        ta.value = combined;
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

  const handleDownloadTxt = (): void => {
    if (combined.length === 0) return;
    try {
      const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const base = (file?.name ?? "document").replace(/\.(pdf|png|jpe?g)$/i, "");
        downloadUrl(url, `${base}-ocr.txt`);
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
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="ScanText"
      slug="pdf/ocr"
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
              accept={{
                "application/pdf": [".pdf"],
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
              }}
              multiple={false}
              maxSizeMB={50}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {s.modelNote}
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
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {s.langLabel}
              </span>
              <div
                role="group"
                aria-label={s.langLabel}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800"
              >
                {(
                  [
                    { code: "eng", label: s.langEn },
                    { code: "ind", label: s.langId },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      try {
                        setLang(l.code);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    disabled={busy}
                    aria-pressed={lang === l.code}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                      lang === l.code
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {!busy ? (
                <Button
                  onClick={() => void handleStart()}
                  disabled={!file}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <ScanText aria-hidden />
                  {s.start}
                </Button>
              ) : (
                <Button
                  onClick={() => void handleCancel()}
                  size="lg"
                  variant="destructive"
                  className="flex-1"
                >
                  <Ban aria-hidden />
                  {s.cancel}
                </Button>
              )}
              {(file || pages.length > 0) && !busy && (
                <Button variant="outline" size="lg" onClick={handleReset}>
                  <Trash2 aria-hidden />
                  {s.reset}
                </Button>
              )}
            </div>

            {busy && (
              <div role="status" aria-label={s.working}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{
                      width: `${
                        prog.total > 0
                          ? Math.round(
                              ((prog.page - 1 + prog.pct / 100) / prog.total) * 100,
                            )
                          : 5
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  {stage || s.working}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {pages.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {pages.map((p) => (
                  <Badge key={p.n} variant="secondary" className="gap-1.5 font-mono">
                    {s.pageBadge(p.n)}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {s.confBadge(p.confidence)}
                    </span>
                  </Badge>
                ))}
              </div>

              <div
                role="tablist"
                aria-label={s.title}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800"
              >
                {(
                  [
                    { id: "text", label: s.tabText },
                    { id: "pdf", label: s.tabPdf },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => {
                      try {
                        setTab(t.id);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
                      tab === t.id
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "text" && (
                <div role="tabpanel" className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {s.statsChars(charCount)}
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      {s.statsWords(wordCount)}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {s.combinedLabel}
                  </p>
                  <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {combined}
                  </pre>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => void handleCopy()}
                      variant="outline"
                      className="flex-1"
                      disabled={combined.length === 0}
                    >
                      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                      {copied ? s.copied : s.copy}
                    </Button>
                    <Button
                      onClick={handleDownloadTxt}
                      disabled={combined.length === 0}
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <Download aria-hidden />
                      {s.downloadTxt}
                    </Button>
                  </div>
                </div>
              )}

              {tab === "pdf" && (
                <div role="tabpanel" className="space-y-3">
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {s.searchableHint}
                  </p>
                  {building || (busy && !searchableUrl) ? (
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      {s.buildingPdf}
                    </p>
                  ) : searchableUrl ? (
                    <Button
                      onClick={() => {
                        try {
                          if (searchableUrl) downloadUrl(searchableUrl, "searchable.pdf");
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      size="lg"
                    >
                      <Download aria-hidden />
                      {s.downloadPdf}
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
