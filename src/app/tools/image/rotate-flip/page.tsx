"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FlipHorizontal2, FlipVertical2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type OutFormat = "jpg" | "png";

interface RotateStrings {
  description: string;
  helper: string;
  angle: string;
  quick: string;
  flipH: string;
  flipV: string;
  output: string;
  formatLabel: string;
  qualityLabel: string;
  download: string;
  noImage: string;
  noImageDesc: string;
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

const STR: Record<Locale, RotateStrings> = {
  en: {
    description: "Rotate images to any angle and flip horizontally or vertically. The canvas expands to fit arbitrary angles — export as PNG or JPG.",
    helper: "Single image up to 25 MB — JPG, PNG, WebP.",
    angle: "Rotation angle",
    quick: "Quick rotate",
    flipH: "Flip H",
    flipV: "Flip V",
    output: "Output",
    formatLabel: "Output format",
    qualityLabel: "Quality",
    download: "Download",
    noImage: "No image yet",
    noImageDesc: "Upload an image above, drag the angle slider or use quick buttons, and the preview updates live.",
    failed: "Could not rotate the image.",
    needImage: "Upload an image first.",
    done: "Rotated image ready.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. Rotation and flips are applied with canvas transforms in your browser. Nothing is sent to a server.",
    faqQ2: "Why does the canvas get bigger at some angles?",
    faqA2: "For arbitrary angles the bounding box expands (width = |w·cos θ| + |h·sin θ|) so no corner is ever cropped. At exact 90° steps it swaps dimensions with no extra padding.",
    faqQ3: "Which format should I choose?",
    faqA3: "PNG is lossless and keeps sharp edges after rotation; JPG is smaller for photos. Quality only applies to JPG.",
  },
  id: {
    description: "Putar gambar ke sudut mana pun dan balik horizontal atau vertikal. Canvas meluas mengikuti sudut bebas — ekspor sebagai PNG atau JPG.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    angle: "Sudut rotasi",
    quick: "Putar cepat",
    flipH: "Balik H",
    flipV: "Balik V",
    output: "Hasil",
    formatLabel: "Format output",
    qualityLabel: "Kualitas",
    download: "Unduh",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah gambar di atas, seret slider sudut atau pakai tombol cepat, dan pratinjau diperbarui langsung.",
    failed: "Gagal memutar gambar.",
    needImage: "Unggah gambar terlebih dahulu.",
    done: "Gambar hasil putar siap.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Rotasi dan flip diterapkan dengan transformasi canvas di browser. Tidak ada yang dikirim ke server.",
    faqQ2: "Mengapa canvas membesar di sudut tertentu?",
    faqA2: "Untuk sudut bebas, bounding box meluas (lebar = |w·cos θ| + |h·sin θ|) agar tidak ada sudut yang terpotong. Pada kelipatan 90° tepat, dimensinya bertukar tanpa padding ekstra.",
    faqQ3: "Format mana yang sebaiknya dipilih?",
    faqA3: "PNG lossless dan menjaga tepi tajam setelah rotasi; JPG lebih kecil untuk foto. Kualitas hanya berlaku untuk JPG.",
  },
};

const MIME: Record<OutFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
};

interface Decoded {
  src: CanvasImageSource;
  w: number;
  h: number;
  cleanup: () => void;
}

async function decodeFile(file: File): Promise<Decoded> {
  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      return { src: bmp, w: bmp.width, h: bmp.height, cleanup: () => bmp.close() };
    }
    throw new Error("no-bitmap");
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode-failed"));
        el.src = url;
      });
      return {
        src: img,
        w: img.naturalWidth,
        h: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
}

const QUICK_ANGLES = [90, 180, 270];

export default function RotateFlipPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<OutFormat>("png");
  const [quality, setQuality] = useState(0.92);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(true);
  const decodedRef = useRef<Decoded | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        decodedRef.current?.cleanup();
      } catch {
        // ignore
      }
    };
  }, []);

  const natW = decoded?.w ?? 0;
  const natH = decoded?.h ?? 0;
  const rad = (angle * Math.PI) / 180;
  const outW = Math.max(1, Math.round(Math.abs(natW * Math.cos(rad)) + Math.abs(natH * Math.sin(rad))));
  const outH = Math.max(1, Math.round(Math.abs(natW * Math.sin(rad)) + Math.abs(natH * Math.cos(rad))));

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        const d = await decodeFile(f);
        if (!mountedRef.current) {
          try {
            d.cleanup();
          } catch {
            // ignore
          }
          return;
        }
        try {
          decodedRef.current?.cleanup();
        } catch {
          // ignore
        }
        decodedRef.current = d;
        setDecoded(d);
        setAngle(0);
        setFlipH(false);
        setFlipV(false);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Render rotated preview (full-res; CSS fits container)
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) return;
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(decoded.src, -natW / 2, -natH / 2, natW, natH);
      ctx.restore();
    } catch {
      toast.error(s.failed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded, angle, flipH, flipV, outW, outH]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) {
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
            a.download = `rotated-${angle}deg.${format}`;
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
  }, [decoded, format, quality, angle, s]);

  return (
    <ToolLayout
      title="Image Rotate & Flip"
      description={s.description}
      descriptionId={s.description}
      iconName="RotateCw"
      slug="image/rotate-flip"
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

        {decoded ? (
          <>
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <label htmlFor="rt-angle" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.angle}: <span className="tabular-nums">{angle}°</span>
                  </label>
                  <input
                    id="rt-angle"
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={angle}
                    onChange={(e) => {
                      try {
                        setAngle(Number(e.target.value));
                      } catch {
                        // ignore
                      }
                    }}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.quick}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.quick}>
                    {[0, ...QUICK_ANGLES].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          try {
                            setAngle(a);
                          } catch {
                            // ignore
                          }
                        }}
                        aria-pressed={angle === a}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          angle === a
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                        )}
                      >
                        {a}°
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="rt-format" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.formatLabel}
                    </label>
                    <select
                      id="rt-format"
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
                      {(["png", "jpg"] as OutFormat[]).map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  {format === "jpg" && (
                    <div>
                      <label htmlFor="rt-quality" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.qualityLabel}: <span className="tabular-nums">{Math.round(quality * 100)}%</span>
                      </label>
                      <input
                        id="rt-quality"
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {s.output}: <span className="font-semibold tabular-nums">{outW}×{outH}</span>
                </p>
                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <canvas
                    ref={canvasRef}
                    className="mx-auto h-auto max-h-[60vh] w-auto max-w-full object-contain"
                  />
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
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.noImage}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.noImageDesc}</p>
            </CardContent>
          </Card>
        )}
        {!decoded && <canvas ref={canvasRef} className="hidden" />}
      </div>
    </ToolLayout>
  );
}
