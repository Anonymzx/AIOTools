"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, ImagePlus, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

interface CropCircleStrings {
  description: string;
  helper: string;
  diameter: string;
  centerX: string;
  centerY: string;
  nudge: string;
  output: string;
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

const STR: Record<Locale, CropCircleStrings> = {
  en: {
    description: "Crop any image into a perfect circle with adjustable diameter and center. Transparent background outside the circle — export as PNG.",
    helper: "Single image up to 25 MB — JPG, PNG, WebP.",
    diameter: "Circle diameter",
    centerX: "Center X",
    centerY: "Center Y",
    nudge: "Nudge center (10 px)",
    output: "Output",
    download: "Download PNG",
    noImage: "No image yet",
    noImageDesc: "Upload an image above, adjust the circle size and center with the sliders or nudge buttons.",
    failed: "Could not crop the circle.",
    needImage: "Upload an image first.",
    done: "Circle crop ready.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. The circle is clipped with canvas arc + clip in your browser. Nothing is sent to a server.",
    faqQ2: "What does the checkerboard mean?",
    faqA2: "The checkerboard in the preview marks transparent pixels. The downloaded PNG keeps that transparency, so it blends into any background.",
    faqQ3: "What is this good for?",
    faqA3: "Circular avatars, profile pictures, badges, and logos — anywhere a round image with a transparent background is needed.",
  },
  id: {
    description: "Potong gambar apa pun menjadi lingkaran sempurna dengan diameter dan titik tengah yang bisa diatur. Latar transparan di luar lingkaran — ekspor sebagai PNG.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    diameter: "Diameter lingkaran",
    centerX: "Tengah X",
    centerY: "Tengah Y",
    nudge: "Geser tengah (10 px)",
    output: "Hasil",
    download: "Unduh PNG",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah gambar di atas, atur ukuran dan titik tengah lingkaran lewat slider atau tombol geser.",
    failed: "Gagal memotong lingkaran.",
    needImage: "Unggah gambar terlebih dahulu.",
    done: "Crop lingkaran siap.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Lingkaran di-clip dengan canvas arc + clip di browser. Tidak ada yang dikirim ke server.",
    faqQ2: "Apa arti pola papan catur itu?",
    faqA2: "Pola papan catur di pratinjau menandai piksel transparan. PNG yang diunduh menjaga transparansi itu sehingga menyatu dengan latar apa pun.",
    faqQ3: "Untuk apa tool ini?",
    faqA3: "Avatar lingkaran, foto profil, badge, dan logo — di mana pun gambar bulat berlatar transparan dibutuhkan.",
  },
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

const NUDGE = 10;

export default function CropCirclePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [diameter, setDiameter] = useState(400);
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const [centered, setCentered] = useState(false);

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const exportRef = useRef<HTMLCanvasElement | null>(null);
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
  const maxD = Math.max(1, Math.min(natW || 1, natH || 1) * 2);
  const d = Math.max(2, Math.min(Math.round(diameter) || 2, Math.max(natW, natH, 2)));
  const r = d / 2;
  const x = Math.max(0, Math.min(Math.round(cx), natW));
  const y = Math.max(0, Math.min(Math.round(cy), natH));

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        const dec = await decodeFile(f);
        if (!mountedRef.current) {
          try {
            dec.cleanup();
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
        decodedRef.current = dec;
        setDecoded(dec);
        setDiameter(Math.min(dec.w, dec.h));
        setCx(Math.round(dec.w / 2));
        setCy(Math.round(dec.h / 2));
        setCentered(true);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      try {
        setCx((v) => Math.max(0, Math.min(v + dx, natW)));
        setCy((v) => Math.max(0, Math.min(v + dy, natH)));
      } catch {
        // ignore
      }
    },
    [natW, natH],
  );

  // Render preview (checkerboard) + transparent export canvas
  useEffect(() => {
    try {
      const preview = previewRef.current;
      const exp = exportRef.current;
      if (!preview || !exp || !decoded || !centered) return;
      preview.width = d;
      preview.height = d;
      exp.width = d;
      exp.height = d;

      // Checkerboard on preview
      const pctx = preview.getContext("2d");
      if (!pctx) throw new Error("canvas-2d-unavailable");
      const cell = Math.max(4, Math.round(d / 24));
      pctx.clearRect(0, 0, d, d);
      for (let yy = 0; yy < d; yy += cell) {
        for (let xx = 0; xx < d; xx += cell) {
          const light = ((xx + yy) / cell) % 2 === 0;
          pctx.fillStyle = light ? "#e4e4e7" : "#a1a1aa";
          pctx.fillRect(xx, yy, Math.min(cell, d - xx), Math.min(cell, d - yy));
        }
      }
      pctx.save();
      pctx.beginPath();
      pctx.arc(r, r, r, 0, Math.PI * 2);
      pctx.clip();
      pctx.drawImage(decoded.src, r - x, r - y, natW, natH);
      pctx.restore();

      // Transparent export
      const ectx = exp.getContext("2d");
      if (!ectx) throw new Error("canvas-2d-unavailable");
      ectx.clearRect(0, 0, d, d);
      ectx.save();
      ectx.beginPath();
      ectx.arc(r, r, r, 0, Math.PI * 2);
      ectx.clip();
      ectx.drawImage(decoded.src, r - x, r - y, natW, natH);
      ectx.restore();
    } catch {
      toast.error(s.failed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded, d, x, y, centered]);

  const download = useCallback(() => {
    try {
      const exp = exportRef.current;
      if (!exp || !decoded) {
        toast.error(s.needImage);
        return;
      }
      exp.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `circle-${d}x${d}.png`;
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
        "image/png",
      );
    } catch {
      toast.error(s.failed);
    }
  }, [decoded, d, s]);

  return (
    <ToolLayout
      title="Circle Cropper"
      description={s.description}
      descriptionId={s.description}
      iconName="Crop"
      slug="image/crop-circle"
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
                  <label htmlFor="cc-d" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.diameter}: <span className="tabular-nums">{d} px</span>
                  </label>
                  <input
                    id="cc-d"
                    type="range"
                    min={2}
                    max={maxD}
                    step={1}
                    value={Math.min(Math.round(diameter), maxD)}
                    onChange={(e) => {
                      try {
                        setDiameter(Number(e.target.value));
                      } catch {
                        // ignore
                      }
                    }}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cc-x" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.centerX}: <span className="tabular-nums">{x} px</span>
                    </label>
                    <input
                      id="cc-x"
                      type="range"
                      min={0}
                      max={Math.max(1, natW)}
                      step={1}
                      value={x}
                      onChange={(e) => {
                        try {
                          setCx(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="cc-y" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.centerY}: <span className="tabular-nums">{y} px</span>
                    </label>
                    <input
                      id="cc-y"
                      type="range"
                      min={0}
                      max={Math.max(1, natH)}
                      step={1}
                      value={y}
                      onChange={(e) => {
                        try {
                          setCy(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.nudge}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.nudge}>
                    <Button type="button" variant="outline" size="icon" aria-label="left" onClick={() => nudge(-NUDGE, 0)}>
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="right" onClick={() => nudge(NUDGE, 0)}>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="up" onClick={() => nudge(0, -NUDGE)}>
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="down" onClick={() => nudge(0, NUDGE)}>
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {s.output}: <span className="font-semibold tabular-nums">{d}×{d} PNG</span>
                </p>
                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <canvas
                    ref={previewRef}
                    className="mx-auto h-auto max-h-[60vh] w-auto max-w-full rounded-full object-contain"
                  />
                </div>
                <canvas ref={exportRef} className="hidden" />
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download} · {d}×{d}
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
        {!decoded && (
          <>
            <canvas ref={previewRef} className="hidden" />
            <canvas ref={exportRef} className="hidden" />
          </>
        )}
      </div>
    </ToolLayout>
  );
}
