"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileImage,
  GripVertical,
  ImagePlus,
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
import { cn } from "@/lib/utils";

const MAX_FILES = 30;
const MM_TO_PT = 72 / 25.4;
const PX_TO_PT = 72 / 96;

type PaperSize = "A4" | "Letter" | "Legal";
type Orientation = "portrait" | "landscape";
type FitMode = "fit" | "original";

const PAPER_PT: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  Legal: { w: 612, h: 1008 },
};

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    listTitle: string;
    invalidType: string;
    decodeFailed: string;
    limitReached: string;
    needOne: string;
    paperLabel: string;
    orientationLabel: string;
    portrait: string;
    landscape: string;
    marginLabel: string;
    modeLabel: string;
    fitMode: string;
    fitDesc: string;
    originalMode: string;
    originalDesc: string;
    generate: string;
    generating: string;
    reset: string;
    success: (pages: number) => string;
    generateFailed: string;
    error: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    dropReorderHint: string;
  }
> = {
  en: {
    title: "Images to PDF",
    description:
      "Turn JPG, PNG, WebP, or GIF images into a multi-page PDF. Reorder with drag & drop, pick paper size and margins — everything runs locally in your browser.",
    dropHint: "Drop images here, or click to browse (JPG, PNG, WebP, GIF — up to 30)",
    listTitle: "Images in document order",
    invalidType: "is not a supported image and was skipped.",
    decodeFailed: "could not be decoded and was skipped.",
    limitReached: "Maximum of 30 images reached.",
    needOne: "Add at least 1 image to generate a PDF.",
    paperLabel: "Paper size",
    orientationLabel: "Orientation",
    portrait: "Portrait",
    landscape: "Landscape",
    marginLabel: "Margin",
    modeLabel: "Image sizing",
    fitMode: "Fit to page",
    fitDesc: "Scale each image to fill the page",
    originalMode: "Original size",
    originalDesc: "Keep 96 DPI size, centered",
    generate: "Generate PDF",
    generating: "Generating...",
    reset: "Clear all",
    success: (pages) => `Generated a ${pages}-page PDF.`,
    generateFailed: "Failed to generate the PDF. One of the images may be corrupted.",
    error: "Something went wrong.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove image",
    dropReorderHint: "Drag rows to reorder, or use the arrow buttons on touch screens.",
  },
  id: {
    title: "Gambar ke PDF",
    description:
      "Ubah gambar JPG, PNG, WebP, atau GIF menjadi PDF multi-halaman. Susun ulang dengan drag & drop, pilih ukuran kertas dan margin — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan gambar di sini, atau klik untuk memilih (JPG, PNG, WebP, GIF — maks. 30)",
    listTitle: "Gambar sesuai urutan dokumen",
    invalidType: "bukan gambar yang didukung dan dilewati.",
    decodeFailed: "tidak dapat dibaca dan dilewati.",
    limitReached: "Batas maksimal 30 gambar tercapai.",
    needOne: "Tambahkan minimal 1 gambar untuk membuat PDF.",
    paperLabel: "Ukuran kertas",
    orientationLabel: "Orientasi",
    portrait: "Potret",
    landscape: "Lanskap",
    marginLabel: "Margin",
    modeLabel: "Ukuran gambar",
    fitMode: "Penuhi halaman",
    fitDesc: "Skalakan tiap gambar memenuhi halaman",
    originalMode: "Ukuran asli",
    originalDesc: "Pertahankan ukuran 96 DPI, di tengah",
    generate: "Buat PDF",
    generating: "Membuat...",
    reset: "Hapus semua",
    success: (pages) => `Berhasil membuat PDF ${pages} halaman.`,
    generateFailed: "Gagal membuat PDF. Salah satu gambar mungkin rusak.",
    error: "Terjadi kesalahan.",
    moveUp: "Pindah ke atas",
    moveDown: "Pindah ke bawah",
    remove: "Hapus gambar",
    dropReorderHint: "Seret baris untuk menyusun ulang, atau gunakan tombol panah di layar sentuh.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Which image formats can I convert to PDF?",
      a: "JPG and PNG are embedded directly without quality loss. WebP, GIF, and BMP are decoded in your browser and re-encoded as PNG first, so they still work — the whole process stays 100% local.",
    },
    id: {
      q: "Format gambar apa saja yang bisa diubah ke PDF?",
      a: "JPG dan PNG disematkan langsung tanpa kehilangan kualitas. WebP, GIF, dan BMP didekode di browser lalu di-encode ulang sebagai PNG, jadi tetap berfungsi — seluruh proses 100% lokal.",
    },
  },
  {
    en: {
      q: "What is the difference between Fit to page and Original size?",
      a: "Fit to page scales each image to fill the printable area while keeping its aspect ratio. Original size draws the image at 96 DPI (pixels × 72/96 points) centered on the page, shrinking only if it would overflow the margins.",
    },
    id: {
      q: "Apa bedanya Penuhi halaman dan Ukuran asli?",
      a: "Penuhi halaman menskalakan tiap gambar agar mengisi area cetak dengan rasio aspek tetap. Ukuran asli menggambar gambar pada 96 DPI (piksel × 72/96 poin) di tengah halaman, diperkecil hanya jika melebihi margin.",
    },
  },
  {
    en: {
      q: "How do I change the page order?",
      a: "Drag any row by its grip handle to a new position, or use the up/down arrow buttons on touch screens. The top image becomes page 1 of the PDF.",
    },
    id: {
      q: "Bagaimana cara mengubah urutan halaman?",
      a: "Seret baris mana pun lewat gagang grip ke posisi baru, atau gunakan tombol panah atas/bawah di layar sentuh. Gambar teratas menjadi halaman 1 PDF.",
    },
  },
  {
    en: {
      q: "Are my images uploaded to a server?",
      a: "Never. Decoding, reordering, and PDF generation all happen in your browser with pdf-lib. Your images never leave your device.",
    },
    id: {
      q: "Apakah gambarku diunggah ke server?",
      a: "Tidak pernah. Decoding, penyusunan ulang, dan pembuatan PDF semuanya terjadi di browser memakai pdf-lib. Gambarmu tidak pernah meninggalkan perangkatmu.",
    },
  },
];

interface ImageItem {
  id: string;
  file: File;
  url: string;
  dims: string | null;
}

interface DecodedImage {
  bytes: Uint8Array;
  kind: "jpg" | "png";
  w: number;
  h: number;
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
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

function bitmapViaElement(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          void createImageBitmap(img).then(
            (b) => {
              try {
                URL.revokeObjectURL(url);
              } catch {
                // ignore
              }
              resolve(b);
            },
            (e: unknown) => {
              try {
                URL.revokeObjectURL(url);
              } catch {
                // ignore
              }
              reject(e instanceof Error ? e : new Error("decode-failed"));
            },
          );
        } catch (e) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
          reject(e instanceof Error ? e : new Error("decode-failed"));
        }
      };
      img.onerror = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        reject(new Error("decode-failed"));
      };
      img.src = url;
    } catch (e) {
      reject(e instanceof Error ? e : new Error("decode-failed"));
    }
  });
}

async function decodeImage(file: File): Promise<DecodedImage> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const isJpg = buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf.length > 7 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = await bitmapViaElement(file);
  }
  const w = bitmap.width || 1;
  const h = bitmap.height || 1;
  const close = (): void => {
    try {
      bitmap.close();
    } catch {
      // ignore
    }
  };
  if (isJpg || isPng) {
    close();
    return { bytes: buf, kind: isJpg ? "jpg" : "png", w, h };
  }
  // pdf-lib cannot embed WebP/GIF/BMP — re-encode as PNG via canvas first.
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");
    ctx.drawImage(bitmap, 0, 0);
    close();
    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), "image/png");
      } catch {
        resolve(null);
      }
    });
    if (!blob) throw new Error("png-encode-failed");
    return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: "png", w, h };
  } catch (e) {
    close();
    throw e instanceof Error ? e : new Error("decode-failed");
  }
}

export default function ImagesToPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const dragIndexRef = useRef<number | null>(null);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [dzKey, setDzKey] = useState(0);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [paper, setPaper] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [marginMm, setMarginMm] = useState(10);
  const [mode, setMode] = useState<FitMode>("fit");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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

  const handleFiles = (files: File[]): void => {
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
      const fresh: ImageItem[] = [];
      for (const f of take) {
        try {
          fresh.push({ id: makeId(), file: f, url: URL.createObjectURL(f), dims: null });
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
      const base = PAPER_PT[paper];
      const pageW = orientation === "portrait" ? base.w : base.h;
      const pageH = orientation === "portrait" ? base.h : base.w;
      const margin = Math.min(25, Math.max(0, marginMm)) * MM_TO_PT;
      const out = await PDFDocument.create();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        let decoded: DecodedImage;
        try {
          decoded = await decodeImage(it.file);
        } catch {
          throw new Error(`${it.file.name} ${s.decodeFailed}`);
        }
        if (!mountedRef.current) return;
        const embedded =
          decoded.kind === "jpg"
            ? await out.embedJpg(decoded.bytes)
            : await out.embedPng(decoded.bytes);
        const page = out.addPage([pageW, pageH]);
        const availW = Math.max(1, pageW - margin * 2);
        const availH = Math.max(1, pageH - margin * 2);
        const iw = embedded.width || 1;
        const ih = embedded.height || 1;
        const fitScale = Math.min(availW / iw, availH / ih);
        const scale = mode === "fit" ? fitScale : Math.min(fitScale, PX_TO_PT);
        const drawW = iw * scale;
        const drawH = ih * scale;
        page.drawImage(embedded, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
        if (mountedRef.current) setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      const bytes = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buf).set(bytes);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "images.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        toast.error(s.generateFailed);
        return;
      }
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      toast.success(s.success(items.length));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : s.generateFailed);
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  };

  const canGenerate = items.length >= 1 && !generating;
  const papers: PaperSize[] = ["A4", "Letter", "Legal"];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileOutput"
      slug="pdf/images-to-pdf"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
              multiple
              maxFiles={MAX_FILES}
              maxSizeMB={25}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />
          </CardContent>
        </Card>

        {items.length > 0 && (
          <>
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-5 p-4 sm:p-6">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.paperLabel}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {papers.map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={paper === p ? "default" : "outline"}
                        disabled={generating}
                        onClick={() => {
                          try {
                            setPaper(p);
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className={cn(
                          paper === p &&
                            "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
                        )}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.orientationLabel}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { v: "portrait" as const, label: s.portrait },
                        { v: "landscape" as const, label: s.landscape },
                      ]
                    ).map((o) => (
                      <Button
                        key={o.v}
                        type="button"
                        variant={orientation === o.v ? "default" : "outline"}
                        disabled={generating}
                        onClick={() => {
                          try {
                            setOrientation(o.v);
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className={cn(
                          orientation === o.v &&
                            "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
                        )}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="pdf-margin"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      {s.marginLabel}
                    </label>
                    <Badge variant="secondary" aria-live="polite">
                      {marginMm} mm
                    </Badge>
                  </div>
                  <input
                    id="pdf-margin"
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={marginMm}
                    disabled={generating}
                    onChange={(e) => {
                      try {
                        setMarginMm(Number(e.target.value));
                      } catch {
                        // ignore
                      }
                    }}
                    aria-valuetext={`${marginMm} mm`}
                    className="mt-2 w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>0 mm</span>
                    <span>25 mm</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.modeLabel}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(
                      [
                        { v: "fit" as const, label: s.fitMode, desc: s.fitDesc },
                        { v: "original" as const, label: s.originalMode, desc: s.originalDesc },
                      ]
                    ).map((m) => (
                      <button
                        key={m.v}
                        type="button"
                        disabled={generating}
                        onClick={() => {
                          try {
                            setMode(m.v);
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        aria-pressed={mode === m.v}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          mode === m.v
                            ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950"
                            : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                        )}
                      >
                        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {m.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                          {m.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {s.listTitle} ({items.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleReset} disabled={generating}>
                    <Trash2 aria-hidden />
                    {s.reset}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.dropReorderHint}
                </p>

                <ul className="mt-3 space-y-2">
                  {items.map((it, i) => (
                    <li
                      key={it.id}
                      draggable={!generating}
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
                        "flex items-center gap-2 rounded-xl border bg-white p-2.5 shadow-sm transition-colors dark:bg-zinc-900",
                        dragOver === i
                          ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                          : "border-zinc-200 dark:border-zinc-800",
                      )}
                    >
                      <span
                        className="cursor-grab touch-none text-zinc-400 active:cursor-grabbing"
                        aria-hidden
                      >
                        <GripVertical className="h-5 w-5" />
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-6 w-7 shrink-0 justify-center rounded-lg px-0 font-mono"
                      >
                        {i + 1}
                      </Badge>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.url}
                        alt={it.file.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {it.file.name}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {formatSize(it.file.size)}
                          {it.dims ? ` · ${it.dims}px` : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(i, i - 1)}
                          disabled={generating || i === 0}
                          aria-label={`${s.moveUp}: ${it.file.name}`}
                        >
                          <ArrowUp aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(i, i + 1)}
                          disabled={generating || i === items.length - 1}
                          aria-label={`${s.moveDown}: ${it.file.name}`}
                        >
                          <ArrowDown aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAt(i)}
                          disabled={generating}
                          aria-label={`${s.remove}: ${it.file.name}`}
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X aria-hidden />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>

                {generating && (
                  <div className="mt-4" role="status" aria-label={s.generating}>
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

                <Button
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate}
                  size="lg"
                  className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {generating ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Download aria-hidden />
                  )}
                  {generating ? s.generating : s.generate}
                </Button>
                {!canGenerate && !generating && (
                  <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    {s.needOne}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {items.length === 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <FileImage className="mr-1 inline h-4 w-4" aria-hidden />
                {s.needOne}
              </p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.dropHint}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
