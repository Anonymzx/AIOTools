"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  ShieldAlert,
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

interface RedactRect {
  id: number;
  page: number; // 1-based
  x: number;
  y: number;
  w: number;
  h: number;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    privacy: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    loading: string;
    rendering: string;
    drawHint: string;
    colorNote: string;
    previewOn: string;
    previewOff: string;
    rectsLabel: (n: number) => string;
    rectLabel: (page: number, i: number) => string;
    removeRect: string;
    emptyRects: string;
    pageOf: (n: number, total: number) => string;
    prev: string;
    next: string;
    warnTitle: string;
    warnBody: string;
    understand: string;
    apply: string;
    applying: string;
    applySuccess: string;
    applyFailed: string;
    needUnderstand: string;
    needRects: string;
    noFile: string;
    error: string;
  }
> = {
  en: {
    title: "Redact PDF",
    description:
      "Black out sensitive regions of a PDF by drawing boxes over any page. Everything runs locally in your browser.",
    privacy: "100% private — files never leave your device",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Loading PDF...",
    rendering: "Rendering page...",
    drawHint: "Drag on the page to draw black redaction boxes. Add as many as you need.",
    colorNote: "Redaction color is fixed black.",
    previewOn: "Hide preview",
    previewOff: "Show preview",
    rectsLabel: (n) => `Redactions (${n})`,
    rectLabel: (page, i) => `Box ${i} — page ${page}`,
    removeRect: "Remove",
    emptyRects: "No redaction boxes yet — draw on the page above.",
    pageOf: (n, total) => `Page ${n} of ${total}`,
    prev: "Previous page",
    next: "Next page",
    warnTitle: "Irreversible action",
    warnBody:
      "Redaction permanently covers the selected areas in the downloaded file. Keep a backup of your original — this cannot be undone.",
    understand: "I understand this cannot be undone",
    apply: "Apply redactions & download",
    applying: "Redacting...",
    applySuccess: "Redacted PDF downloaded as redacted.pdf.",
    applyFailed: "Failed to redact the PDF. The file may be corrupted or encrypted.",
    needUnderstand: "Please tick “I understand” before applying.",
    needRects: "Draw at least one redaction box first.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Sensor PDF (Redact PDF)",
    description:
      "Hitamkan area sensitif PDF dengan menggambar kotak pada halaman mana pun. Semua berjalan lokal di browser.",
    privacy: "100% privat — file tidak pernah meninggalkan perangkatmu",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Memuat PDF...",
    rendering: "Merender halaman...",
    drawHint: "Seret pada halaman untuk menggambar kotak sensor hitam. Tambahkan sebanyak yang kamu butuhkan.",
    colorNote: "Warna sensor tetap hitam.",
    previewOn: "Sembunyikan pratinjau",
    previewOff: "Tampilkan pratinjau",
    rectsLabel: (n) => `Sensor (${n})`,
    rectLabel: (page, i) => `Kotak ${i} — halaman ${page}`,
    removeRect: "Hapus",
    emptyRects: "Belum ada kotak sensor — gambar pada halaman di atas.",
    pageOf: (n, total) => `Halaman ${n} dari ${total}`,
    prev: "Halaman sebelumnya",
    next: "Halaman berikutnya",
    warnTitle: "Tindakan yang tidak dapat dibatalkan",
    warnBody:
      "Sensor menutupi area terpilih secara permanen pada file yang diunduh. Simpan cadangan file aslimu — ini tidak dapat diurungkan.",
    understand: "Saya paham ini tidak dapat dibatalkan",
    apply: "Terapkan sensor & unduh",
    applying: "Menyensor...",
    applySuccess: "PDF tersensor diunduh sebagai redacted.pdf.",
    applyFailed: "Gagal menyensor PDF. File mungkin rusak atau terenkripsi.",
    needUnderstand: "Centang “Saya paham” sebelum menerapkan.",
    needRects: "Gambar setidaknya satu kotak sensor terlebih dahulu.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I redact a PDF?",
      a: "Open your PDF, flip to the right page, then drag boxes over every sensitive region — names, ID numbers, signatures. Toggle Show preview to check coverage, tick “I understand”, then press Apply redactions & download.",
    },
    id: {
      q: "Bagaimana cara menyensor PDF?",
      a: "Buka PDF-mu, buka halaman yang tepat, lalu seret kotak menutupi setiap area sensitif — nama, nomor identitas, tanda tangan. Aktifkan Tampilkan pratinjau untuk memeriksa cakupan, centang “Saya paham”, lalu tekan Terapkan sensor & unduh.",
    },
  },
  {
    en: {
      q: "Is redaction truly permanent?",
      a: "Be honest about the limits: this tool flattens opaque black rectangles over the selected areas, which covers the content visually in normal readers. Determined forensic recovery of the underlying text layer is generally not possible from the exported file's appearance, but for legally sensitive documents you should still verify the output and prefer certified redaction software when required.",
    },
    id: {
      q: "Apakah sensor benar-benar permanen?",
      a: "Jujur soal batasnya: tool ini meratakan persegi hitam opak di atas area terpilih, yang menutupi konten secara visual di pembaca normal. Pemulihan forensik lapisan teks di bawahnya umumnya tidak dimungkinkan dari tampilan file hasil ekspor, tetapi untuk dokumen yang sensitif secara hukum kamu tetap harus memverifikasi hasilnya dan memakai perangkat lunak sensor tersertifikasi bila diwajibkan.",
    },
  },
  {
    en: {
      q: "Is my document uploaded anywhere?",
      a: "No. Drawing, preview, and the final pdf-lib flattening all run on your device. The PDF never leaves your browser.",
    },
    id: {
      q: "Apakah dokumen saya diunggah ke mana pun?",
      a: "Tidak. Menggambar, pratinjau, dan perataan pdf-lib final semuanya berjalan di perangkatmu. PDF tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "Can I change the redaction color?",
      a: "No — the color is fixed black, the standard for redaction. If you need decorative cover-ups in other colors, use the watermark or image tools instead.",
    },
    id: {
      q: "Bisakah saya mengubah warna sensor?",
      a: "Tidak — warnanya tetap hitam, standar untuk sensor. Jika butuh penutup dekoratif warna lain, gunakan tool watermark atau gambar sebagai gantinya.",
    },
  },
];

const MIN_FRAC = 0.015;

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

let rectId = 0;

export default function RedactPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const drawRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef<{ x0: number; y0: number } | null>(null);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageImg, setPageImg] = useState<string | null>(null);
  const [pageAspect, setPageAspect] = useState(3 / 4);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [applying, setApplying] = useState(false);

  const [rects, setRects] = useState<RedactRect[]>([]);
  const [draft, setDraft] = useState<RedactRect | null>(null);
  const [preview, setPreview] = useState(true);
  const [understood, setUnderstood] = useState(false);

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

  const renderPage = async (raw: Uint8Array, target: number): Promise<void> => {
    setRendering(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const exec = async (): Promise<void> => {
        const task = pdfjs.getDocument({ data: new Uint8Array(raw) });
        const pdf = await task.promise;
        try {
          const page = await pdf.getPage(target);
          try {
            const viewport = page.getViewport({ scale: 0.8 });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("no-ctx");
            await page.render({ canvas, viewport }).promise;
            if (!mountedRef.current) return;
            setPageAspect(viewport.width / viewport.height);
            setPageImg(canvas.toDataURL("image/jpeg", 0.85));
          } finally {
            try {
              page.cleanup();
            } catch {
              // ignore
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
      try {
        await exec();
      } catch {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        await exec();
      }
    } catch {
      if (mountedRef.current) toast.error(s.invalidPdf);
    } finally {
      if (mountedRef.current) setRendering(false);
    }
  };

  const loadPdf = async (picked: File): Promise<void> => {
    setLoading(true);
    try {
      const buf = await picked.arrayBuffer();
      const raw = new Uint8Array(buf);
      try {
        const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
        if (doc.getPageCount() === 0) throw new Error("empty");
        if (!mountedRef.current) return;
        const n = doc.getPageCount();
        pdfBytesRef.current = raw;
        setPageCount(n);
        setPageNum(1);
        setRects([]);
        setDraft(null);
        setUnderstood(false);
        await renderPage(raw, 1);
      } catch {
        if (!mountedRef.current) return;
        toast.error(`${picked.name} ${s.invalidPdf}`);
        setFile(null);
        pdfBytesRef.current = null;
        setPageCount(0);
        setPageImg(null);
        setDzKey((k) => k + 1);
      }
    } catch {
      if (mountedRef.current) toast.error(s.error);
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
      setPageImg(null);
      setPageNum(1);
      void loadPdf(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const gotoPage = (n: number): void => {
    try {
      const raw = pdfBytesRef.current;
      if (!raw || pageCount === 0) return;
      const clamped = Math.min(pageCount, Math.max(1, n));
      setPageNum(clamped);
      setDraft(null);
      void renderPage(raw, clamped);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setFile(null);
      pdfBytesRef.current = null;
      setPageCount(0);
      setPageNum(1);
      setPageImg(null);
      setRects([]);
      setDraft(null);
      setUnderstood(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const fracPos = (clientX: number, clientY: number): { x: number; y: number } | null => {
    try {
      const el = drawRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      return {
        x: Math.min(Math.max((clientX - r.left) / r.width, 0), 1),
        y: Math.min(Math.max((clientY - r.top) / r.height, 0), 1),
      };
    } catch {
      return null;
    }
  };

  const removeRect = (id: number): void => {
    try {
      setRects((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error(s.error);
    }
  };

  const handleApply = async (): Promise<void> => {
    if (!file || applying) {
      if (!file) toast.error(s.noFile);
      return;
    }
    if (rects.length === 0) {
      toast.error(s.needRects);
      return;
    }
    if (!understood) {
      toast.error(s.needUnderstand);
      return;
    }
    setApplying(true);
    try {
      const raw = pdfBytesRef.current ?? new Uint8Array(await file.arrayBuffer());
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(raw, { ignoreEncryption: true });
      } catch {
        toast.error(s.applyFailed);
        return;
      }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      for (const p of copied) out.addPage(p);
      const black = rgb(0, 0, 0);
      for (const r of rects) {
        try {
          if (r.page < 1 || r.page > out.getPageCount()) continue;
          const page = out.getPage(r.page - 1);
          const { width: pw, height: ph } = page.getSize();
          page.drawRectangle({
            x: r.x * pw,
            y: ph - (r.y + r.h) * ph,
            width: r.w * pw,
            height: r.h * ph,
            color: black,
            opacity: 1,
            borderWidth: 0,
          });
        } catch {
          // skip unmappable rect, keep others
        }
      }
      const saved = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
      trackDownloadUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = "redacted.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(s.applySuccess);
    } catch {
      if (mountedRef.current) toast.error(s.applyFailed);
    } finally {
      if (mountedRef.current) setApplying(false);
    }
  };

  const busy = loading || rendering || applying;
  const pageRects = rects.filter((r) => r.page === pageNum);

  return (
    <ToolLayout title={s.title} description={s.description} iconName="EyeOff" slug="pdf/redact" faq={FAQ}>
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {s.privacy}
        </p>

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
                    {pageCount > 0 ? ` · ${pageCount}` : ""}
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
            {(loading || rendering) && (
              <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400" role="status">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {loading ? s.loading : s.rendering}
              </p>
            )}
          </CardContent>
        </Card>

        {pageImg && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => gotoPage(pageNum - 1)} disabled={busy || pageNum <= 1} aria-label={s.prev}>
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => gotoPage(pageNum + 1)} disabled={busy || pageNum >= pageCount} aria-label={s.next}>
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <Badge variant="secondary" className="rounded-lg font-mono">
                  {s.pageOf(pageNum, pageCount)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      setPreview((v) => !v);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {preview ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                  {preview ? s.previewOn : s.previewOff}
                </Button>
              </div>

              <div
                ref={drawRef}
                className="relative w-full touch-none cursor-crosshair overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 select-none dark:border-zinc-800 dark:bg-zinc-800"
                style={{ aspectRatio: `${pageAspect}` }}
                onPointerDown={(e) => {
                  try {
                    const p = fracPos(e.clientX, e.clientY);
                    if (!p) return;
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    drawingRef.current = { x0: p.x, y0: p.y };
                    rectId += 1;
                    setDraft({ id: rectId, page: pageNum, x: p.x, y: p.y, w: 0, h: 0 });
                  } catch {
                    // ignore
                  }
                }}
                onPointerMove={(e) => {
                  try {
                    const start = drawingRef.current;
                    if (!start) return;
                    const p = fracPos(e.clientX, e.clientY);
                    if (!p) return;
                    setDraft({
                      id: rectId,
                      page: pageNum,
                      x: Math.min(start.x0, p.x),
                      y: Math.min(start.y0, p.y),
                      w: Math.abs(p.x - start.x0),
                      h: Math.abs(p.y - start.y0),
                    });
                  } catch {
                    // ignore
                  }
                }}
                onPointerUp={() => {
                  try {
                    const d = draft;
                    drawingRef.current = null;
                    setDraft(null);
                    if (d && d.w >= MIN_FRAC && d.h >= MIN_FRAC) {
                      setRects((prev) => [...prev, d]);
                    }
                  } catch {
                    toast.error(s.error);
                  }
                }}
                onPointerCancel={() => {
                  drawingRef.current = null;
                  setDraft(null);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pageImg} alt={s.pageOf(pageNum, pageCount)} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
                {preview &&
                  pageRects.map((r) => (
                    <div
                      key={r.id}
                      className="absolute bg-black"
                      style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                    />
                  ))}
                {draft && draft.w > 0 && draft.h > 0 && (
                  <div
                    className="absolute border-2 border-dashed border-red-500 bg-black/60"
                    style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.drawHint} <span className="font-medium text-zinc-700 dark:text-zinc-200">{s.colorNote}</span>
              </p>

              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.rectsLabel(rects.length)}</p>
                {rects.length === 0 ? (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.emptyRects}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {rects.map((r, i) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-black dark:border dark:border-zinc-600" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium text-zinc-700 dark:text-zinc-200">
                          {s.rectLabel(r.page, i + 1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRect(r.id)}
                          aria-label={`${s.removeRect} ${i + 1}`}
                          className="flex items-center gap-1 font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {s.removeRect}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <strong>{s.warnTitle}. </strong>
                  {s.warnBody}
                </span>
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => {
                    try {
                      setUnderstood(e.target.checked);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                {s.understand}
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleApply()}
                  disabled={busy || rects.length === 0 || !understood}
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
