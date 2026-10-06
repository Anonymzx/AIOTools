"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";
import { Download, RotateCw, FlipHorizontal2, FlipVertical2, Crop as CropIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type OutFormat = "jpg" | "png" | "webp";

interface AspectPreset {
  key: string;
  label: string;
  value: number | undefined;
}

const PRESETS: AspectPreset[] = [
  { key: "free", label: "Free", value: undefined },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
  { key: "3:2", label: "3:2", value: 3 / 2 },
];

interface CropStrings {
  description: string;
  helper: string;
  aspectLabel: string;
  rotate: string;
  flipH: string;
  flipV: string;
  formatLabel: string;
  qualityLabel: string;
  download: string;
  noImage: string;
  noImageDesc: string;
  drawHint: string;
  failed: string;
  needImage: string;
  done: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, CropStrings> = {
  en: {
    description: "Crop, rotate and flip images in your browser. Pick an aspect preset, drag the crop box, then export as JPG, PNG or WebP.",
    helper: "Single image up to 25 MB — JPG, PNG, WebP.",
    aspectLabel: "Aspect ratio",
    rotate: "Rotate 90°",
    flipH: "Flip H",
    flipV: "Flip V",
    formatLabel: "Output format",
    qualityLabel: "Quality",
    download: "Download",
    noImage: "No image yet",
    noImageDesc: "Upload an image above, then drag on it to draw a crop box. Rotation and flips apply to the export.",
    drawHint: "Drag on the image to draw a crop box — the preview below updates live.",
    failed: "Could not process the crop.",
    needImage: "Upload an image first.",
    done: "Cropped image ready.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. The crop is rendered on a <canvas> in your browser using the selected region, rotation and flips. Nothing is sent to a server.",
    faqQ2: "Does rotation change the crop box?",
    faqA2: "The crop box is drawn on the original orientation; rotation and flips are applied at export time. The live preview below always shows the exact final result.",
    faqQ3: "Which format should I choose?",
    faqA3: "JPG is smallest for photos, PNG is lossless and keeps transparency, WebP gives the best size-to-quality ratio in modern browsers.",
  },
  id: {
    description: "Crop, putar, dan balik gambar di browser. Pilih preset aspek, seret kotak crop, lalu ekspor sebagai JPG, PNG, atau WebP.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    aspectLabel: "Rasio aspek",
    rotate: "Putar 90°",
    flipH: "Balik H",
    flipV: "Balik V",
    formatLabel: "Format output",
    qualityLabel: "Kualitas",
    download: "Unduh",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah gambar di atas, lalu seret di atasnya untuk membuat kotak crop. Rotasi dan flip diterapkan saat ekspor.",
    drawHint: "Seret pada gambar untuk membuat kotak crop — pratinjau di bawah diperbarui langsung.",
    failed: "Gagal memproses crop.",
    needImage: "Unggah gambar terlebih dahulu.",
    done: "Gambar crop siap.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Crop di-render pada <canvas> di browser memakai area terpilih, rotasi, dan flip. Tidak ada yang dikirim ke server.",
    faqQ2: "Apakah rotasi mengubah kotak crop?",
    faqA2: "Kotak crop digambar pada orientasi asli; rotasi dan flip diterapkan saat ekspor. Pratinjau langsung di bawah selalu menunjukkan hasil akhir yang tepat.",
    faqQ3: "Format mana yang sebaiknya dipilih?",
    faqA3: "JPG terkecil untuk foto, PNG lossless dan menjaga transparansi, WebP memberi rasio ukuran-kualitas terbaik di browser modern.",
  },
};

const MIME: Record<OutFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export default function CropPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<OutFormat>("jpg");
  const [quality, setQuality] = useState(0.92);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Revoke object URL on change / unmount
  useEffect(() => {
    return () => {
      try {
        if (imgUrl) URL.revokeObjectURL(imgUrl);
      } catch {
        // ignore
      }
    };
  }, [imgUrl]);

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        setImgUrl((prev) => {
          try {
            if (prev) URL.revokeObjectURL(prev);
          } catch {
            // ignore
          }
          return URL.createObjectURL(f);
        });
        setCrop(undefined);
        setCompletedCrop(null);
        setRotate(0);
        setFlipH(false);
        setFlipV(false);
        setImgSize(null);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  const onImageLoaded = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const el = e.currentTarget;
      imgRef.current = el;
      setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
    } catch {
      // ignore
    }
  }, []);

  // Render preview: pixelCrop -> canvas with rotation/flip math
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      const src = imgRef.current;
      if (!canvas || !src || !imgSize) return;
      const pc: PixelCrop = completedCrop ?? {
        unit: "px",
        x: 0,
        y: 0,
        width: imgSize.w,
        height: imgSize.h,
      };
      if (!pc.width || !pc.height) return;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const rot = ((rotate % 360) + 360) % 360;
      const swap = rot === 90 || rot === 270;
      const outW = swap ? pc.height : pc.width;
      const outH = swap ? pc.width : pc.height;
      canvas.width = Math.max(1, Math.round(outW * dpr));
      canvas.height = Math.max(1, Math.round(outH * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(src, pc.x, pc.y, pc.width, pc.height, -pc.width / 2, -pc.height / 2, pc.width, pc.height);
      ctx.restore();
    } catch {
      toast.error(s.failed);
    }
  }, [completedCrop, imgSize, rotate, flipH, flipV, s.failed]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !imgSize) {
        toast.error(s.needImage);
        return;
      }
      const q = format === "png" ? undefined : quality;
      canvas.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `cropped.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => {
              try {
                URL.revokeObjectURL(url);
              } catch {
                // ignore
              }
            }, 4000);
            toast.success(s.done);
          } catch {
            toast.error(s.failed);
          }
        },
        MIME[format],
        q,
      );
    } catch {
      toast.error(s.failed);
    }
  }, [format, quality, imgSize, s]);

  return (
    <ToolLayout
      title="Image Cropper"
      description={s.description}
      descriptionId={s.description}
      iconName="Scissors"
      slug="image/crop"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          maxSizeMB={25}
          maxFiles={1}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        {imgUrl ? (
          <>
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.aspectLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.aspectLabel}>
                    {PRESETS.map((p) => {
                      const active = p.value === aspect;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            try {
                              setAspect(p.value);
                              setCrop(undefined);
                              setCompletedCrop(null);
                            } catch {
                              // ignore
                            }
                          }}
                          aria-pressed={active}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                            active
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      try {
                        setRotate((r) => (r + 90) % 360);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    <RotateCw className="h-4 w-4" aria-hidden />
                    {s.rotate}
                  </Button>
                  <Button
                    type="button"
                    variant={flipH ? "default" : "outline"}
                    aria-pressed={flipH}
                    onClick={() => {
                      try {
                        setFlipH((v) => !v);
                      } catch {
                        // ignore
                      }
                    }}
                    className={cn(flipH && "bg-indigo-600 hover:bg-indigo-700")}
                  >
                    <FlipHorizontal2 className="h-4 w-4" aria-hidden />
                    {s.flipH}
                  </Button>
                  <Button
                    type="button"
                    variant={flipV ? "default" : "outline"}
                    aria-pressed={flipV}
                    onClick={() => {
                      try {
                        setFlipV((v) => !v);
                      } catch {
                        // ignore
                      }
                    }}
                    className={cn(flipV && "bg-indigo-600 hover:bg-indigo-700")}
                  >
                    <FlipVertical2 className="h-4 w-4" aria-hidden />
                    {s.flipV}
                  </Button>
                </div>

                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => {
                      try {
                        setCrop(c);
                      } catch {
                        // ignore
                      }
                    }}
                    onComplete={(pc) => {
                      try {
                        setCompletedCrop(pc.width && pc.height ? pc : null);
                      } catch {
                        // ignore
                      }
                    }}
                    aspect={aspect}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={imgUrl}
                      alt="crop source"
                      onLoad={onImageLoaded}
                      className="max-h-[60vh] w-auto max-w-none"
                    />
                  </ReactCrop>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.drawHint}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <canvas
                  ref={canvasRef}
                  className="h-auto max-h-[60vh] w-full rounded-xl border border-zinc-200 object-contain dark:border-zinc-800"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="crop-format" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.formatLabel}
                    </label>
                    <select
                      id="crop-format"
                      value={format}
                      onChange={(e) => {
                        try {
                          setFormat(e.target.value as OutFormat);
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm uppercase text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {(["jpg", "png", "webp"] as OutFormat[]).map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  {format !== "png" && (
                    <div>
                      <label htmlFor="crop-quality" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.qualityLabel}: <span className="tabular-nums">{Math.round(quality * 100)}%</span>
                      </label>
                      <input
                        id="crop-quality"
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={quality}
                        onChange={(e) => {
                          try {
                            setQuality(Number(e.target.value));
                          } catch {
                            // ignore
                          }
                        }}
                        className="mt-2 w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download} {format.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <CropIcon className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.noImage}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.noImageDesc}</p>
            </CardContent>
          </Card>
        )}
        {/* Keep preview canvas mounted for ref stability when empty */}
        {!imgUrl && <canvas ref={canvasRef} className="hidden" />}
      </div>
    </ToolLayout>
  );
}
