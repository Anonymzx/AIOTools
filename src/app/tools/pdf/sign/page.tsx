"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  FileText,
  Loader2,
  PenLine,
  ShieldCheck,
  Type,
  Upload,
  X,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SigTab = "draw" | "type" | "upload";

const TYPE_FONTS = [
  { id: "script", stack: '"Brush Script MT", "Segoe Script", cursive' },
  { id: "hand", stack: '"Lucida Handwriting", cursive' },
  { id: "serif", stack: 'italic Georgia, "Times New Roman", serif' },
] as const;

const INKS = ["#111827", "#1d4ed8", "#0f766e", "#b91c1c", "#6d28d9"];

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
    tabDraw: string;
    tabType: string;
    tabUpload: string;
    penWidth: string;
    ink: string;
    clear: string;
    typePlaceholder: string;
    fontLabel: string;
    sizeLabel: string;
    uploadHint: string;
    uploadTooBig: string;
    uploadBadType: string;
    noSignature: string;
    targetLabel: string;
    pageOf: (n: number, total: number) => string;
    prev: string;
    next: string;
    scaleLabel: string;
    dragHint: string;
    apply: string;
    applying: string;
    applySuccess: string;
    applyFailed: string;
    noFile: string;
    error: string;
  }
> = {
  en: {
    title: "Sign PDF",
    description:
      "Draw, type, or upload a signature, place it on any page, and download the signed PDF. Everything runs locally in your browser.",
    privacy: "100% private — files never leave your device",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Loading PDF...",
    rendering: "Rendering page...",
    tabDraw: "Draw",
    tabType: "Type",
    tabUpload: "Upload",
    penWidth: "Pen width",
    ink: "Ink color",
    clear: "Clear",
    typePlaceholder: "Type your name",
    fontLabel: "Handwriting style",
    sizeLabel: "Text size",
    uploadHint: "PNG with transparency, up to 5 MB",
    uploadTooBig: "exceeds the 5 MB PNG limit.",
    uploadBadType: "is not a PNG image.",
    noSignature: "Create or upload a signature first.",
    targetLabel: "Placement",
    pageOf: (n, total) => `Page ${n} of ${total}`,
    prev: "Previous page",
    next: "Next page",
    scaleLabel: "Signature size",
    dragHint: "Drag the signature box to position it on the page.",
    apply: "Apply signature & download",
    applying: "Signing...",
    applySuccess: "Signed PDF downloaded as signed.pdf.",
    applyFailed: "Failed to sign the PDF. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Tanda Tangani PDF (Sign PDF)",
    description:
      "Gambar, ketik, atau unggah tanda tangan, letakkan di halaman mana pun, lalu unduh PDF bertanda tangan. Semua berjalan lokal di browser.",
    privacy: "100% privat — file tidak pernah meninggalkan perangkatmu",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Memuat PDF...",
    rendering: "Merender halaman...",
    tabDraw: "Gambar",
    tabType: "Ketik",
    tabUpload: "Unggah",
    penWidth: "Ketebalan pena",
    ink: "Warna tinta",
    clear: "Hapus",
    typePlaceholder: "Ketik namamu",
    fontLabel: "Gaya tulisan tangan",
    sizeLabel: "Ukuran teks",
    uploadHint: "PNG dengan transparansi, hingga 5 MB",
    uploadTooBig: "melebihi batas PNG 5 MB.",
    uploadBadType: "bukan gambar PNG.",
    noSignature: "Buat atau unggah tanda tangan terlebih dahulu.",
    targetLabel: "Penempatan",
    pageOf: (n, total) => `Halaman ${n} dari ${total}`,
    prev: "Halaman sebelumnya",
    next: "Halaman berikutnya",
    scaleLabel: "Ukuran tanda tangan",
    dragHint: "Seret kotak tanda tangan untuk menempatkannya di halaman.",
    apply: "Terapkan tanda tangan & unduh",
    applying: "Menandatangani...",
    applySuccess: "PDF bertanda tangan diunduh sebagai signed.pdf.",
    applyFailed: "Gagal menandatangani PDF. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I place my signature?",
      a: "Pick a tab — Draw with your mouse or finger, Type your name in a handwriting style, or Upload a transparent PNG. Then flip through pages with Prev/Next, drag the signature box where you want it, adjust the size slider, and press Apply signature & download.",
    },
    id: {
      q: "Bagaimana cara menempatkan tanda tangan?",
      a: "Pilih tab — Gambar dengan mouse atau jari, Ketik namamu dengan gaya tulisan tangan, atau Unggah PNG transparan. Lalu jelajahi halaman dengan Sebelumnya/Berikutnya, seret kotak tanda tangan ke posisi yang diinginkan, atur slider ukuran, dan tekan Terapkan tanda tangan & unduh.",
    },
  },
  {
    en: {
      q: "Is my signature uploaded anywhere?",
      a: "No. Drawing, typing, placement, and the final pdf-lib embedding all happen on your device. Your signature image never leaves your browser.",
    },
    id: {
      q: "Apakah tanda tangan saya diunggah ke mana pun?",
      a: "Tidak. Menggambar, mengetik, penempatan, dan penyematan pdf-lib final semuanya terjadi di perangkatmu. Gambar tanda tangan tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "Is this signature legally binding?",
      a: "It depends on your jurisdiction and the document — this tool places a visible signature image, not a certified cryptographic digital signature. For contracts that require certified signing, use a qualified e-signature provider.",
    },
    id: {
      q: "Apakah tanda tangan ini sah secara hukum?",
      a: "Tergantung yurisdiksi dan dokumenmu — tool ini menempatkan gambar tanda tangan yang terlihat, bukan tanda tangan digital kriptografis tersertifikasi. Untuk kontrak yang mewajibkan penandatanganan tersertifikasi, gunakan penyedia e-signature yang memenuhi syarat.",
    },
  },
  {
    en: {
      q: "Why does my PDF fail to open?",
      a: "The usual causes are password protection or corruption. Remove the password (re-export or print to PDF without security) and try again.",
    },
    id: {
      q: "Mengapa PDF saya gagal dibuka?",
      a: "Penyebab umum adalah proteksi kata sandi atau file rusak. Hapus kata sandinya (ekspor ulang atau cetak ke PDF tanpa keamanan) lalu coba lagi.",
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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export default function SignPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragOffRef = useRef<{ dx: number; dy: number } | null>(null);
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

  const [tab, setTab] = useState<SigTab>("draw");
  const [penWidth, setPenWidth] = useState(3);
  const [ink, setInk] = useState(INKS[0]);
  const [typed, setTyped] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const [typeSize, setTypeSize] = useState(64);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [sigAspect, setSigAspect] = useState(2.5);

  const [box, setBox] = useState({ x: 0.6, y: 0.72 });
  const [scalePct, setScalePct] = useState(0.25);

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

  const setSigFromDataUrl = (url: string | null): void => {
    try {
      if (!url) {
        setSigDataUrl(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            if (mountedRef.current) setSigAspect(img.naturalWidth / img.naturalHeight);
          }
          if (mountedRef.current) setSigDataUrl(url);
        } catch {
          // ignore
        }
      };
      img.onerror = () => {
        if (mountedRef.current) toast.error(s.error);
      };
      img.src = url;
    } catch {
      toast.error(s.error);
    }
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
            const viewport = page.getViewport({ scale: 0.5 });
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
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  // ---- Draw tab: pointer drawing ----
  const drawPoint = (canvas: HTMLCanvasElement, x: number, y: number): void => {
    try {
      const rect = canvas.getBoundingClientRect();
      const px = ((x - rect.left) / rect.width) * canvas.width;
      const py = ((y - rect.top) / rect.height) * canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = ink;
      ctx.lineWidth = penWidth * (canvas.width / rect.width);
      const last = lastPtRef.current;
      ctx.beginPath();
      if (last) ctx.moveTo(last.x, last.y);
      else ctx.moveTo(px, py);
      ctx.lineTo(px, py);
      ctx.stroke();
      lastPtRef.current = { x: px, y: py };
    } catch {
      // ignore stroke errors
    }
  };

  const handleClearDraw = (): void => {
    try {
      const canvas = drawCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      setSigDataUrl(null);
    } catch {
      toast.error(s.error);
    }
  };

  // ---- Type tab: render text to transparent PNG ----
  useEffect(() => {
    if (tab !== "type") return;
    try {
      const name = typed.trim();
      if (!name) {
        setSigDataUrl(null);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = Math.ceil(typeSize * 2.1);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      ctx.font = `${typeSize}px ${TYPE_FONTS[fontIdx].stack}`;
      ctx.textBaseline = "middle";
      ctx.fillText(name, 16, canvas.height / 2);
      setSigFromDataUrl(canvas.toDataURL("image/png"));
    } catch {
      toast.error(s.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, fontIdx, typeSize, ink, tab]);

  const handleUploadSig = (f: File | undefined): void => {
    try {
      if (!f) return;
      if (f.type !== "image/png" && !/\.png$/i.test(f.name)) {
        toast.error(`${f.name} ${s.uploadBadType}`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} ${s.uploadTooBig}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const url = typeof reader.result === "string" ? reader.result : null;
          setSigFromDataUrl(url);
        } catch {
          toast.error(s.error);
        }
      };
      reader.onerror = () => toast.error(s.error);
      reader.readAsDataURL(f);
    } catch {
      toast.error(s.error);
    }
  };

  // ---- Draggable signature box (% coords) ----
  const boxHfrac = pageAspect > 0 && sigAspect > 0 ? scalePct * pageAspect * (1 / sigAspect) : 0.1;

  const previewPos = (clientX: number, clientY: number): { x: number; y: number } | null => {
    try {
      const el = previewRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
    } catch {
      return null;
    }
  };

  const handleApply = async (): Promise<void> => {
    if (!file || applying) {
      if (!file) toast.error(s.noFile);
      return;
    }
    if (!sigDataUrl) {
      toast.error(s.noSignature);
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
      const sigBytes = dataUrlToBytes(sigDataUrl);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      for (const p of copied) out.addPage(p);
      const target = out.getPage(pageNum - 1);
      const { width: pageW, height: pageH } = target.getSize();
      const png = await out.embedPng(sigBytes);
      const sigW = scalePct * pageW;
      const sigH = sigW / (sigAspect > 0 ? sigAspect : 2.5);
      const sigX = Math.min(Math.max(box.x, 0), 1) * pageW;
      const topY = Math.min(Math.max(box.y, 0), 1) * pageH;
      const pdfY = pageH - topY - sigH; // FLIP Y: preview top-left origin -> PDF bottom-left
      target.drawImage(png, { x: sigX, y: pdfY, width: sigW, height: sigH });
      const saved = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
      trackDownloadUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = "signed.pdf";
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

  return (
    <ToolLayout title={s.title} description={s.description} iconName="PenLine" slug="pdf/sign" faq={FAQ}>
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

        {file && pageCount > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Signature tabs */}
              <AnimatedTabs
                ariaLabel="signature"
                value={tab}
                onChange={(id) => {
                  try {
                    setTab(id as SigTab);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                tabs={[
                  { id: "draw", label: s.tabDraw, icon: <PenLine className="h-4 w-4" aria-hidden /> },
                  { id: "type", label: s.tabType, icon: <Type className="h-4 w-4" aria-hidden /> },
                  { id: "upload", label: s.tabUpload, icon: <Upload className="h-4 w-4" aria-hidden /> },
                ]}
              />

              <AnimatedTabPanel tabKey={tab}>
              {tab === "draw" && (
                <div>
                  <canvas
                    ref={drawCanvasRef}
                    width={720}
                    height={260}
                    className="w-full cursor-crosshair touch-none rounded-xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                    style={{ aspectRatio: "720 / 260" }}
                    onPointerDown={(e) => {
                      try {
                        const c = drawCanvasRef.current;
                        if (!c) return;
                        c.setPointerCapture(e.pointerId);
                        drawingRef.current = true;
                        lastPtRef.current = null;
                        drawPoint(c, e.clientX, e.clientY);
                      } catch {
                        // ignore
                      }
                    }}
                    onPointerMove={(e) => {
                      try {
                        if (!drawingRef.current) return;
                        const c = drawCanvasRef.current;
                        if (!c) return;
                        drawPoint(c, e.clientX, e.clientY);
                      } catch {
                        // ignore
                      }
                    }}
                    onPointerUp={() => {
                      try {
                        drawingRef.current = false;
                        lastPtRef.current = null;
                        const c = drawCanvasRef.current;
                        if (c) setSigFromDataUrl(c.toDataURL("image/png"));
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    onPointerCancel={() => {
                      drawingRef.current = false;
                      lastPtRef.current = null;
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {s.penWidth}
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={penWidth}
                        onChange={(e) => {
                          try {
                            setPenWidth(Number(e.target.value));
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className="w-28 accent-indigo-600"
                      />
                      <span className="font-mono">{penWidth}px</span>
                    </label>
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {s.ink}
                      <span className="flex items-center gap-1.5">
                        {INKS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={c}
                            onClick={() => {
                              try {
                                setInk(c);
                              } catch {
                                toast.error(s.error);
                              }
                            }}
                            className={cn(
                              "h-6 w-6 rounded-full border-2",
                              ink === c ? "border-indigo-600" : "border-transparent",
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleClearDraw} className="ml-auto">
                      <Eraser className="h-3.5 w-3.5" aria-hidden />
                      {s.clear}
                    </Button>
                  </div>
                </div>
              )}

              {tab === "type" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typed}
                    maxLength={60}
                    placeholder={s.typePlaceholder}
                    onChange={(e) => {
                      try {
                        setTyped(e.target.value);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-lg text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    style={{ fontFamily: TYPE_FONTS[fontIdx].stack }}
                  />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {s.fontLabel}
                      <select
                        value={fontIdx}
                        onChange={(e) => {
                          try {
                            setFontIdx(Number(e.target.value));
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                      >
                        {TYPE_FONTS.map((f, i) => (
                          <option key={f.id} value={i} style={{ fontFamily: f.stack }}>
                            {f.id === "script" ? "Script" : f.id === "hand" ? "Handwriting" : "Italic serif"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {s.sizeLabel}
                      <input
                        type="range"
                        min={32}
                        max={120}
                        step={4}
                        value={typeSize}
                        onChange={(e) => {
                          try {
                            setTypeSize(Number(e.target.value));
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className="w-28 accent-indigo-600"
                      />
                      <span className="font-mono">{typeSize}px</span>
                    </label>
                  </div>
                </div>
              )}

              {tab === "upload" && (
                <div>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
                    <Upload className="h-6 w-6 text-zinc-400" aria-hidden />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{s.tabUpload} PNG</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.uploadHint}</span>
                    <input
                      type="file"
                      accept=".png,image/png"
                      className="sr-only"
                      onChange={(e) => {
                        try {
                          handleUploadSig(e.target.files?.[0]);
                          e.target.value = "";
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                    />
                  </label>
                  {sigDataUrl && tab === "upload" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sigDataUrl} alt="signature" className="mx-auto mt-3 max-h-32 object-contain" />
                  )}
                </div>
              )}
              </AnimatedTabPanel>

              {!sigDataUrl && <p className="text-xs text-amber-600 dark:text-amber-400">{s.noSignature}</p>}
            </CardContent>
          </Card>
        )}

        {pageImg && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.targetLabel}</span>
                <Badge variant="secondary" className="rounded-lg font-mono">
                  {s.pageOf(pageNum, pageCount)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => gotoPage(pageNum - 1)} disabled={busy || pageNum <= 1} aria-label={s.prev}>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="outline" size="sm" onClick={() => gotoPage(pageNum + 1)} disabled={busy || pageNum >= pageCount} aria-label={s.next}>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
                <label className="ml-auto flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 sm:max-w-[240px]">
                  {s.scaleLabel}
                  <input
                    type="range"
                    min={0.1}
                    max={0.6}
                    step={0.01}
                    value={scalePct}
                    onChange={(e) => {
                      try {
                        setScalePct(Number(e.target.value));
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-mono">{Math.round(scalePct * 100)}%</span>
                </label>
              </div>

              <div
                ref={previewRef}
                className="relative w-full touch-none overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
                style={{ aspectRatio: `${pageAspect}` }}
                onPointerMove={(e) => {
                  try {
                    if (!dragOffRef.current) return;
                    const p = previewPos(e.clientX, e.clientY);
                    if (!p) return;
                    setBox({
                      x: Math.min(Math.max(p.x - dragOffRef.current.dx, 0), 1 - scalePct),
                      y: Math.min(Math.max(p.y - dragOffRef.current.dy, 0), 1 - boxHfrac),
                    });
                  } catch {
                    // ignore
                  }
                }}
                onPointerUp={() => {
                  dragOffRef.current = null;
                }}
                onPointerCancel={() => {
                  dragOffRef.current = null;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pageImg} alt={s.pageOf(pageNum, pageCount)} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
                {sigDataUrl && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={s.dragHint}
                    className="absolute cursor-move rounded border-2 border-dashed border-indigo-500 bg-indigo-500/10"
                    style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${scalePct * 100}%`, aspectRatio: `${sigAspect}` }}
                    onPointerDown={(e) => {
                      try {
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                        const el = previewRef.current?.getBoundingClientRect();
                        if (!el) return;
                        const px = (e.clientX - el.left) / el.width;
                        const py = (e.clientY - el.top) / el.height;
                        dragOffRef.current = { dx: px - box.x, dy: py - box.y };
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sigDataUrl} alt="" className="h-full w-full object-contain" draggable={false} />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.dragHint}</p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleApply()}
                  disabled={busy || !sigDataUrl}
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
