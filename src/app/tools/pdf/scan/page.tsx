"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Download,
  GripVertical,
  Loader2,
  RotateCcw,
  RotateCw,
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
import { cn } from "@/lib/utils";

const MAX_FILES = 20;
const PAGE_W = 595.28;

type FilterId = "original" | "grayscale" | "bw" | "enhanced";

const FILTERS: FilterId[] = ["original", "grayscale", "bw", "enhanced"];

interface ScanItem {
  id: string;
  file: File;
  url: string;
  dims: string | null;
  filter: FilterId;
  rotation: number;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    dropHint: string;
    listTitle: string;
    invalidType: string;
    decodeFailed: string;
    limitReached: string;
    needOne: string;
    filterLabel: string;
    filterName: (f: FilterId) => string;
    rotateLeft: string;
    rotateRight: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    dropReorderHint: string;
    useCamera: string;
    closeCamera: string;
    capture: string;
    captured: string;
    captureFailed: string;
    camDeniedTitle: string;
    camDeniedBody: string;
    camStep1: string;
    camStep2: string;
    camStep3: string;
    camRetry: string;
    camDismiss: string;
    camUnsupported: string;
    generate: string;
    generating: string;
    reset: string;
    success: string;
    generateFailed: string;
    error: string;
    pagesUnit: string;
  }
> = {
  en: {
    title: "Scan to PDF",
    description:
      "Turn photos or camera shots into a clean PDF. Enhance, rotate, and reorder pages — everything runs locally in your browser.",
    descriptionId:
      "Ubah foto atau jepretan kamera menjadi PDF rapi. Tingkatkan, putar, dan susun ulang halaman — semuanya lokal di browser.",
    dropHint: "Drop photos here, or click to browse (JPG, PNG, WebP — up to 20)",
    listTitle: "Scanned pages in document order",
    invalidType: "is not a supported image and was skipped.",
    decodeFailed: "could not be decoded and was skipped.",
    limitReached: "Maximum of 20 images reached.",
    needOne: "Add at least 1 image to generate a PDF.",
    filterLabel: "Filter",
    filterName: (f) =>
      ({ original: "Original", grayscale: "Grayscale", bw: "B&W scan", enhanced: "Enhanced" })[f],
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove image",
    dropReorderHint: "Drag rows to reorder, or use the arrow buttons on touch screens.",
    useCamera: "Use Camera",
    closeCamera: "Close camera",
    capture: "Capture photo",
    captured: "Photo captured and added to the list.",
    captureFailed: "Failed to capture the photo. Try again.",
    camDeniedTitle: "Camera access was blocked",
    camDeniedBody:
      "Your browser refused camera access for this site. Photos stay on your device — allow the camera to scan directly.",
    camStep1: "Chrome / Edge: click the camera icon in the address bar → Always allow → reload the page.",
    camStep2: "Firefox: click the camera-blocked icon in the address bar → Allow → reload the page.",
    camStep3: "Safari (iOS): Settings → Apps → Safari → Camera → Allow; then tap Use Camera again.",
    camRetry: "Try again",
    camDismiss: "Dismiss",
    camUnsupported: "This browser does not support camera capture. Upload photos instead.",
    generate: "Generate scan PDF",
    generating: "Generating...",
    reset: "Clear all",
    success: "Scanned PDF downloaded as scan.pdf.",
    generateFailed: "Failed to generate the PDF. One of the images may be corrupted.",
    error: "Something went wrong.",
    pagesUnit: "pages",
  },
  id: {
    title: "Pindai ke PDF (Scan to PDF)",
    description:
      "Ubah foto atau jepretan kamera menjadi PDF rapi. Tingkatkan, putar, dan susun ulang halaman — semuanya lokal di browser.",
    descriptionId:
      "Ubah foto atau jepretan kamera menjadi PDF rapi. Tingkatkan, putar, dan susun ulang halaman — semuanya lokal di browser.",
    dropHint: "Letakkan foto di sini, atau klik untuk memilih (JPG, PNG, WebP — maks. 20)",
    listTitle: "Halaman pindaian sesuai urutan dokumen",
    invalidType: "bukan gambar yang didukung dan dilewati.",
    decodeFailed: "tidak dapat dibaca dan dilewati.",
    limitReached: "Batas maksimal 20 gambar tercapai.",
    needOne: "Tambahkan minimal 1 gambar untuk membuat PDF.",
    filterLabel: "Filter",
    filterName: (f) =>
      ({ original: "Asli", grayscale: "Grayscale", bw: "Pindaian H&P", enhanced: "Ditingkatkan" })[f],
    rotateLeft: "Putar kiri",
    rotateRight: "Putar kanan",
    moveUp: "Pindah ke atas",
    moveDown: "Pindah ke bawah",
    remove: "Hapus gambar",
    dropReorderHint: "Seret baris untuk menyusun ulang, atau gunakan tombol panah di layar sentuh.",
    useCamera: "Gunakan Kamera",
    closeCamera: "Tutup kamera",
    capture: "Jepret foto",
    captured: "Foto dijepret dan ditambahkan ke daftar.",
    captureFailed: "Gagal menjepret foto. Coba lagi.",
    camDeniedTitle: "Akses kamera diblokir",
    camDeniedBody:
      "Browser menolak akses kamera untuk situs ini. Foto tetap di perangkatmu — izinkan kamera untuk memindai langsung.",
    camStep1: "Chrome / Edge: klik ikon kamera di address bar → Selalu izinkan → muat ulang halaman.",
    camStep2: "Firefox: klik ikon kamera-terblokir di address bar → Izinkan → muat ulang halaman.",
    camStep3: "Safari (iOS): Pengaturan → Aplikasi → Safari → Kamera → Izinkan; lalu ketuk Gunakan Kamera lagi.",
    camRetry: "Coba lagi",
    camDismiss: "Tutup",
    camUnsupported: "Browser ini tidak mendukung jepretan kamera. Unggah foto sebagai gantinya.",
    generate: "Buat PDF pindaian",
    generating: "Membuat...",
    reset: "Hapus semua",
    success: "PDF pindaian diunduh sebagai scan.pdf.",
    generateFailed: "Gagal membuat PDF. Salah satu gambar mungkin rusak.",
    error: "Terjadi kesalahan.",
    pagesUnit: "halaman",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do I scan with my camera?",
      a: "Tap Use Camera (you must tap the button itself so the browser shows its permission prompt), allow access, then press Capture photo for each page. Each shot is appended to the list below, where you can filter, rotate, and reorder before generating the PDF.",
    },
    id: {
      q: "Bagaimana cara memindai dengan kamera?",
      a: "Ketuk Gunakan Kamera (kamu harus mengetuk tombolnya langsung agar browser menampilkan permintaan izin), izinkan akses, lalu tekan Jepret foto untuk tiap halaman. Setiap jepretan ditambahkan ke daftar di bawah, tempat kamu bisa memfilter, memutar, dan menyusun ulang sebelum membuat PDF.",
    },
  },
  {
    en: {
      q: "What do the filters do?",
      a: "Original keeps the photo untouched. Grayscale converts to gray, B&W scan thresholds to pure black-and-white like a flatbed scanner, and Enhanced boosts contrast for faded receipts or documents.",
    },
    id: {
      q: "Apa fungsi tiap filter?",
      a: "Asli membiarkan foto apa adanya. Grayscale mengubah ke abu-abu, Pindaian H&P mengubah ke hitam-putih murni seperti scanner flatbed, dan Ditingkatkan menaikkan kontras untuk struk atau dokumen yang pudar.",
    },
  },
  {
    en: {
      q: "Are my photos uploaded anywhere?",
      a: "No. Decoding, filtering, rotation, and PDF assembly all run on your device with canvas and pdf-lib. Your photos never leave your browser.",
    },
    id: {
      q: "Apakah foto saya diunggah ke mana pun?",
      a: "Tidak. Decoding, filter, rotasi, dan perakitan PDF semuanya berjalan di perangkatmu dengan canvas dan pdf-lib. Fotomu tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "What page size does the PDF use?",
      a: "Each photo gets its own page that matches the photo's aspect ratio at A4 width (595pt), so nothing is stretched or cropped. Portrait photos produce portrait pages automatically.",
    },
    id: {
      q: "Ukuran halaman apa yang dipakai PDF?",
      a: "Setiap foto mendapat halamannya sendiri yang mengikuti rasio aspek foto pada lebar A4 (595pt), sehingga tidak ada yang melar atau terpotong. Foto potret otomatis menghasilkan halaman potret.",
    },
  },
];

function makeId(): string {
  try {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  } catch {
    return `id-${Math.floor(Math.random() * 1e9)}`;
  }
}

function clampByte(n: number): number {
  try {
    if (n < 0) return 0;
    if (n > 255) return 255;
    return Math.round(n);
  } catch {
    return 0;
  }
}

async function bitmapViaElement(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1;
    canvas.height = img.naturalHeight || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((res) => {
      try {
        canvas.toBlob((b) => res(b), "image/png");
      } catch {
        res(null);
      }
    });
    if (!blob) throw new Error("png-encode-failed");
    return await createImageBitmap(blob);
  } finally {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

function applyFilter(ctx: CanvasRenderingContext2D, w: number, h: number, filter: FilterId): void {
  if (filter === "original") return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  if (filter === "enhanced") {
    const contrast = 1.35;
    const brightness = 8;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      d[i] = clampByte(contrast * (r - 128) + 128 + brightness);
      d[i + 1] = clampByte(contrast * (g - 128) + 128 + brightness);
      d[i + 2] = clampByte(contrast * (b - 128) + 128 + brightness);
    }
  } else {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = filter === "bw" ? (gray > 128 ? 255 : 0) : Math.round(gray);
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function rotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  const norm = ((deg % 360) + 360) % 360;
  if (norm === 0) return src;
  const swap = norm === 90 || norm === 270;
  const out = document.createElement("canvas");
  out.width = swap ? src.height : src.width;
  out.height = swap ? src.width : src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((norm * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("png-encode-failed"));
      }, "image/png");
    } catch (e) {
      reject(e instanceof Error ? e : new Error("png-encode-failed"));
    }
  });
}

export default function ScanToPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const dragIndexRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [items, setItems] = useState<ScanItem[]>([]);
  const [dzKey, setDzKey] = useState(0);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [camDenied, setCamDenied] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        streamRef.current?.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
        streamRef.current = null;
      } catch {
        // ignore
      }
      try {
        setItems((prev) => {
          for (const it of prev) {
            try {
              URL.revokeObjectURL(it.url);
            } catch {
              // ignore
            }
          }
          return prev;
        });
      } catch {
        // ignore
      }
    };
  }, []);

  const stopCamera = (): void => {
    try {
      streamRef.current?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {
      // ignore
    }
  };

  const probeDims = async (id: string, file: File): Promise<void> => {
    try {
      const bmp = await createImageBitmap(file);
      const label = `${bmp.width}×${bmp.height}`;
      try {
        bmp.close();
      } catch {
        // ignore
      }
      if (!mountedRef.current) return;
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, dims: label } : p)));
    } catch {
      // dims stay null; decode will retry at generate time
    }
  };

  const addFiles = (files: File[]): void => {
    try {
      const supported = files.filter((f) => /^image\//i.test(f.type));
      if (supported.length < files.length) {
        for (const f of files) {
          if (!/^image\//i.test(f.type)) toast.error(`${f.name} ${s.invalidType}`);
        }
      }
      if (supported.length === 0) {
        setDzKey((k) => k + 1);
        return;
      }
      const room = MAX_FILES - items.length;
      if (room <= 0) {
        toast.error(s.limitReached);
        setDzKey((k) => k + 1);
        return;
      }
      const take = supported.slice(0, room);
      if (supported.length > room) toast.error(s.limitReached);
      const fresh: ScanItem[] = [];
      for (const f of take) {
        try {
          fresh.push({
            id: makeId(),
            file: f,
            url: URL.createObjectURL(f),
            dims: null,
            filter: "original",
            rotation: 0,
          });
        } catch {
          toast.error(`${f.name} ${s.decodeFailed}`);
        }
      }
      setItems((prev) => [...prev, ...fresh]);
      setDzKey((k) => k + 1);
      for (const it of fresh) void probeDims(it.id, it.file);
    } catch {
      toast.error(s.error);
    }
  };

  const handleCameraToggle = async (): Promise<void> => {
    try {
      if (showCamera) {
        stopCamera();
        setShowCamera(false);
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error(s.camUnsupported);
        return;
      }
      setCamDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
        return;
      }
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      if (mountedRef.current) {
        setCamDenied(true);
        toast.error(s.camDeniedTitle);
      }
    }
  };

  const handleCapture = async (): Promise<void> => {
    const video = videoRef.current;
    if (!video || capturing) return;
    setCapturing(true);
    try {
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.drawImage(video, 0, 0, vw, vh);
      const blob = await new Promise<Blob | null>((res) => {
        try {
          canvas.toBlob((b) => res(b), "image/jpeg", 0.92);
        } catch {
          res(null);
        }
      });
      if (!blob) throw new Error("capture-failed");
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (!mountedRef.current) return;
      if (items.length >= MAX_FILES) {
        toast.error(s.limitReached);
        return;
      }
      const item: ScanItem = {
        id: makeId(),
        file,
        url: URL.createObjectURL(file),
        dims: `${vw}×${vh}`,
        filter: "original",
        rotation: 0,
      };
      setItems((prev) => [...prev, item]);
      toast.success(s.captured);
    } catch {
      if (mountedRef.current) toast.error(s.captureFailed);
    } finally {
      if (mountedRef.current) setCapturing(false);
    }
  };

  const setFilter = (id: string, filter: FilterId): void => {
    try {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, filter } : p)));
    } catch {
      toast.error(s.error);
    }
  };

  const rotateItem = (id: string, delta: number): void => {
    try {
      setItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, rotation: (((p.rotation + delta) % 360) + 360) % 360 } : p,
        ),
      );
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

  const removeAt = (index: number): void => {
    try {
      setItems((prev) => {
        const target = prev[index];
        try {
          if (target) URL.revokeObjectURL(target.url);
        } catch {
          // ignore
        }
        return prev.filter((_, i) => i !== index);
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setItems((prev) => {
        for (const it of prev) {
          try {
            URL.revokeObjectURL(it.url);
          } catch {
            // ignore
          }
        }
        return [];
      });
      setProgress(0);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (items.length < 1 || generating) {
      if (items.length < 1) toast.error(s.needOne);
      return;
    }
    setGenerating(true);
    setProgress(0);
    try {
      const out = await PDFDocument.create();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        let bmp: ImageBitmap;
        try {
          bmp = await createImageBitmap(it.file);
        } catch {
          bmp = await bitmapViaElement(it.file);
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = bmp.width || 1;
          canvas.height = bmp.height || 1;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas-2d-unavailable");
          ctx.drawImage(bmp, 0, 0);
          applyFilter(ctx, canvas.width, canvas.height, it.filter);
          const final = rotateCanvas(canvas, it.rotation);
          const blob = await canvasToBlob(final);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          if (!mountedRef.current) return;
          const embedded = await out.embedPng(bytes);
          const iw = embedded.width || 1;
          const ih = embedded.height || 1;
          let pw = PAGE_W;
          let ph = (PAGE_W * ih) / iw;
          if (ph > 1440) {
            ph = 1440;
            pw = (1440 * iw) / ih;
          } else if (ph < 200) {
            ph = 200;
            pw = (200 * iw) / ih;
          }
          const page = out.addPage([pw, ph]);
          page.drawImage(embedded, { x: 0, y: 0, width: pw, height: ph });
        } finally {
          try {
            bmp.close();
          } catch {
            // ignore
          }
        }
        if (mountedRef.current) setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      const bytes = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buf).set(bytes);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "scan.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.generateFailed);
        return;
      }
      toast.success(s.success);
    } catch {
      if (mountedRef.current) toast.error(s.generateFailed);
    } finally {
      if (mountedRef.current) {
        setGenerating(false);
        setProgress(0);
      }
    }
  };

  const busy = generating;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="ScanLine"
      slug="pdf/scan"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              multiple
              maxSizeMB={25}
              preview={false}
              helperText={s.dropHint}
              onFiles={addFiles}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant={showCamera ? "secondary" : "outline"}
                onClick={() => void handleCameraToggle()}
                className="flex-1"
              >
                <Camera aria-hidden />
                {showCamera ? s.closeCamera : s.useCamera}
              </Button>
            </div>

            {showCamera && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    try {
                      if (el && streamRef.current) el.srcObject = streamRef.current;
                    } catch {
                      // ignore
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex gap-2 bg-zinc-900 p-3">
                  <Button
                    type="button"
                    onClick={() => void handleCapture()}
                    disabled={capturing}
                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {capturing ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
                    {s.capture}
                  </Button>
                </div>
              </div>
            )}

            {camDenied && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
              >
                <p className="font-bold">{s.camDeniedTitle}</p>
                <p className="mt-1 text-xs leading-relaxed sm:text-sm">{s.camDeniedBody}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
                  <li>{s.camStep1}</li>
                  <li>{s.camStep2}</li>
                  <li>{s.camStep3}</li>
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void handleCameraToggle()}>
                    {s.camRetry}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCamDenied(false)}>
                    {s.camDismiss}
                  </Button>
                </div>
              </div>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              100% processed in your browser. Files never leave your device.
            </p>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.listTitle}</h2>
                <Badge variant="secondary" className="ml-auto rounded-lg font-mono">
                  {items.length} {s.pagesUnit}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.dropReorderHint}</p>

              <ul className="mt-3 space-y-2">
                {items.map((it, i) => (
                  <li
                    key={it.id}
                    draggable
                    onDragStart={() => {
                      dragIndexRef.current = i;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(i);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragIndexRef.current;
                      dragIndexRef.current = null;
                      setDragOver(null);
                      if (from !== null && from !== i) move(from, i);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
                      dragOver === i && "border-indigo-500 ring-2 ring-indigo-500/30",
                    )}
                  >
                    <GripVertical
                      className="h-4 w-4 shrink-0 cursor-grab text-zinc-400"
                      aria-hidden
                    />
                    <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.url}
                      alt={`${i + 1}`}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {it.file.name}
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {it.dims ?? ""}
                        {it.rotation !== 0 ? ` · ${it.rotation}°` : ""}
                      </span>
                      <label className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="sr-only">{s.filterLabel}</span>
                        <select
                          value={it.filter}
                          onChange={(e) => setFilter(it.id, e.target.value as FilterId)}
                          disabled={busy}
                          className="max-w-full rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {FILTERS.map((f) => (
                            <option key={f} value={f}>
                              {s.filterName(f)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </span>
                    <span className="flex shrink-0 flex-col gap-1">
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => rotateItem(it.id, -90)}
                          disabled={busy}
                          aria-label={`${s.rotateLeft} ${i + 1}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => rotateItem(it.id, 90)}
                          disabled={busy}
                          aria-label={`${s.rotateRight} ${i + 1}`}
                        >
                          <RotateCw className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </span>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => move(i, i - 1)}
                          disabled={busy || i === 0}
                          aria-label={`${s.moveUp} ${i + 1}`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => move(i, i + 1)}
                          disabled={busy || i === items.length - 1}
                          aria-label={`${s.moveDown} ${i + 1}`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => removeAt(i)}
                          disabled={busy}
                          aria-label={`${s.remove} ${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {generating && (
                <div className="mt-4" role="status">
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

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleGenerate()}
                  disabled={busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {generating ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                  {generating ? s.generating : s.generate}
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
