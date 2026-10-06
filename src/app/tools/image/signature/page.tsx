"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type SigPreset = "2x2cm" | "35x45cm" | "300px" | "600px" | "custom";
type BgMode = "white" | "transparent";

interface SigStrings {
  description: string;
  helper: string;
  presetLabel: string;
  customW: string;
  customH: string;
  dpi: string;
  dpiNote: string;
  bgLabel: string;
  bgWhite: string;
  bgTransparent: string;
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

const STR: Record<Locale, SigStrings> = {
  en: {
    description: "Prepare signature and stamp photos at exact document sizes — cm presets scaled by DPI, pixel presets, or custom dimensions with white or transparent background.",
    helper: "Single image up to 25 MB — JPG, PNG, WebP.",
    presetLabel: "Size preset",
    customW: "Custom width (px)",
    customH: "Custom height (px)",
    dpi: "DPI",
    dpiNote: "cm presets scale as px = cm ÷ 2.54 × DPI. DPI is stored as a print note.",
    bgLabel: "Background",
    bgWhite: "White",
    bgTransparent: "Transparent",
    output: "Output",
    download: "Download PNG",
    noImage: "No image yet",
    noImageDesc: "Upload a signature or stamp photo, pick a preset or custom size, and the preview appears here.",
    failed: "Could not prepare the signature photo.",
    needImage: "Upload an image first.",
    done: "Signature photo ready.",
    faqQ1: "Is my photo uploaded anywhere?",
    faqA1: "No. The photo is fitted on a <canvas> in your browser at the exact output size. Nothing is sent to a server.",
    faqQ2: "How do cm presets and DPI work?",
    faqA2: "Centimeters convert to pixels as px = cm ÷ 2.54 × DPI, so higher DPI means more pixels. DPI is kept as a print note; the PNG itself carries the exact pixel dimensions.",
    faqQ3: "White or transparent background?",
    faqA3: "Choose white for printed forms and official documents. Choose transparent to overlay the signature on any colored document or digital form.",
  },
  id: {
    description: "Siapkan foto tanda tangan dan stempel pada ukuran dokumen yang tepat — preset cm yang diskalakan DPI, preset piksel, atau ukuran kustom dengan latar putih atau transparan.",
    helper: "Satu gambar hingga 25 MB — JPG, PNG, WebP.",
    presetLabel: "Preset ukuran",
    customW: "Lebar kustom (px)",
    customH: "Tinggi kustom (px)",
    dpi: "DPI",
    dpiNote: "Preset cm diskalakan sebagai px = cm ÷ 2,54 × DPI. DPI disimpan sebagai catatan cetak.",
    bgLabel: "Latar",
    bgWhite: "Putih",
    bgTransparent: "Transparan",
    output: "Hasil",
    download: "Unduh PNG",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah foto tanda tangan atau stempel, pilih preset atau ukuran kustom, dan pratinjau muncul di sini.",
    failed: "Gagal menyiapkan foto tanda tangan.",
    needImage: "Unggah gambar terlebih dahulu.",
    done: "Foto tanda tangan siap.",
    faqQ1: "Apakah foto saya diunggah ke mana pun?",
    faqA1: "Tidak. Foto dipaskan pada <canvas> di browser dengan ukuran output yang tepat. Tidak ada yang dikirim ke server.",
    faqQ2: "Bagaimana cara kerja preset cm dan DPI?",
    faqA2: "Sentimeter dikonversi ke piksel sebagai px = cm ÷ 2,54 × DPI, jadi DPI lebih tinggi berarti lebih banyak piksel. DPI disimpan sebagai catatan cetak; PNG-nya sendiri membawa dimensi piksel yang tepat.",
    faqQ3: "Latar putih atau transparan?",
    faqA3: "Pilih putih untuk formulir cetak dan dokumen resmi. Pilih transparan untuk menempelkan tanda tangan pada dokumen berwarna atau formulir digital.",
  },
};

const CM_PER_INCH = 2.54;
const DPIS = [72, 150, 300];

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

function presetLabel(p: SigPreset, dpi: number): string {
  try {
    if (p === "2x2cm") {
      const px = Math.round((2 / CM_PER_INCH) * dpi);
      return `2×2 cm (${px}×${px}px @${dpi})`;
    }
    if (p === "35x45cm") {
      const w = Math.round((3.5 / CM_PER_INCH) * dpi);
      const h = Math.round((4.5 / CM_PER_INCH) * dpi);
      return `3.5×4.5 cm (${w}×${h}px @${dpi})`;
    }
    if (p === "300px") return "300×300 px";
    if (p === "600px") return "600×600 px";
    return "Custom";
  } catch {
    return p;
  }
}

export default function SignaturePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [preset, setPreset] = useState<SigPreset>("2x2cm");
  const [customW, setCustomW] = useState(600);
  const [customH, setCustomH] = useState(600);
  const [dpi, setDpi] = useState(300);
  const [bg, setBg] = useState<BgMode>("white");

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

  const outW =
    preset === "2x2cm"
      ? Math.max(1, Math.round((2 / CM_PER_INCH) * dpi))
      : preset === "35x45cm"
        ? Math.max(1, Math.round((3.5 / CM_PER_INCH) * dpi))
        : preset === "300px"
          ? 300
          : preset === "600px"
            ? 600
            : Math.max(1, Math.round(customW) || 1);
  const outH =
    preset === "2x2cm"
      ? Math.max(1, Math.round((2 / CM_PER_INCH) * dpi))
      : preset === "35x45cm"
        ? Math.max(1, Math.round((4.5 / CM_PER_INCH) * dpi))
        : preset === "300px"
          ? 300
          : preset === "600px"
            ? 600
            : Math.max(1, Math.round(customH) || 1);

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
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Render fitted output (contain; letterbox with bg)
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) return;
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.clearRect(0, 0, outW, outH);
      if (bg === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);
      }
      const scale = Math.min(outW / decoded.w, outH / decoded.h);
      const dw = Math.max(1, Math.round(decoded.w * scale));
      const dh = Math.max(1, Math.round(decoded.h * scale));
      ctx.drawImage(decoded.src, Math.round((outW - dw) / 2), Math.round((outH - dh) / 2), dw, dh);
    } catch {
      toast.error(s.failed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded, outW, outH, bg]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !decoded) {
        toast.error(s.needImage);
        return;
      }
      canvas.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `signature-${outW}x${outH}-${dpi}dpi.png`;
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
  }, [decoded, outW, outH, dpi, s]);

  const presets: SigPreset[] = ["2x2cm", "35x45cm", "300px", "600px", "custom"];

  return (
    <ToolLayout
      title="Signature Photo"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="image/signature"
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
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.presetLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.presetLabel}>
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          try {
                            setPreset(p);
                          } catch {
                            // ignore
                          }
                        }}
                        aria-pressed={preset === p}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          preset === p
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                        )}
                      >
                        {p === "custom" ? "Custom" : presetLabel(p, dpi)}
                      </button>
                    ))}
                  </div>
                </div>

                {preset === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sg-w" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.customW}
                      </label>
                      <input
                        id="sg-w"
                        type="number"
                        min={1}
                        max={8192}
                        value={customW}
                        onChange={(e) => {
                          try {
                            setCustomW(Math.max(1, Math.round(Number(e.target.value)) || 1));
                          } catch {
                            // ignore
                          }
                        }}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="sg-h" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.customH}
                      </label>
                      <input
                        id="sg-h"
                        type="number"
                        min={1}
                        max={8192}
                        value={customH}
                        onChange={(e) => {
                          try {
                            setCustomH(Math.max(1, Math.round(Number(e.target.value)) || 1));
                          } catch {
                            // ignore
                          }
                        }}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.dpi}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.dpi}>
                    {DPIS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          try {
                            setDpi(v);
                          } catch {
                            // ignore
                          }
                        }}
                        aria-pressed={dpi === v}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          dpi === v
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.dpiNote}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.bgLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.bgLabel}>
                    {(["white", "transparent"] as BgMode[]).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          try {
                            setBg(b);
                          } catch {
                            // ignore
                          }
                        }}
                        aria-pressed={bg === b}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          bg === b
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                        )}
                      >
                        {b === "white" ? s.bgWhite : s.bgTransparent}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {s.output}: <span className="font-semibold tabular-nums">{outW}×{outH}px @{dpi} DPI</span>
                </p>
                <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <canvas
                    ref={canvasRef}
                    className="mx-auto h-auto max-h-[60vh] w-auto max-w-full object-contain"
                  />
                </div>
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download} · {outW}×{outH}
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
