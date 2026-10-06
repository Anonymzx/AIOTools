"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type CollageLayout = "auto" | "grid2" | "grid3" | "hstrip" | "vstrip";
type OutFormat = "jpg" | "png";

interface CollageStrings {
  description: string;
  helper: string;
  layout: string;
  auto: string;
  grid2: string;
  grid3: string;
  hstrip: string;
  vstrip: string;
  gap: string;
  bg: string;
  formatLabel: string;
  qualityLabel: string;
  download: string;
  noImage: string;
  noImageDesc: string;
  needTwo: string;
  failed: string;
  needImage: string;
  done: string;
  count: string;
  output: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, CollageStrings> = {
  en: {
    description: "Combine 2–9 photos into one collage: grids or strips with adjustable gap and background color. All composited on canvas in your browser.",
    helper: "2–9 images up to 25 MB each — JPG, PNG, WebP.",
    layout: "Layout",
    auto: "Auto",
    grid2: "2×2 grid",
    grid3: "3×3 grid",
    hstrip: "Horizontal strip",
    vstrip: "Vertical strip",
    gap: "Gap",
    bg: "Background color",
    formatLabel: "Output format",
    qualityLabel: "Quality",
    download: "Download",
    noImage: "No images yet",
    noImageDesc: "Drop 2–9 images above. The layout auto-picks by count, or override it manually below.",
    needTwo: "Add at least 2 images for a collage.",
    failed: "Could not build the collage.",
    needImage: "Add at least 2 images first.",
    done: "Collage ready.",
    count: "Photos",
    output: "Output",
    faqQ1: "Are my photos uploaded anywhere?",
    faqA1: "No. Every photo is decoded and composited on a <canvas> in your browser. Nothing leaves your device.",
    faqQ2: "How does Auto layout work?",
    faqA2: "Auto picks a 2×2 grid for up to 4 photos, a 3×3 grid for 5 or more, and a horizontal strip for 2 photos. You can override it any time.",
    faqQ3: "How are different-sized photos fitted?",
    faqA3: "Each photo cover-crops into a uniform square cell — centered and scaled to fill, so there are no stretched or squished images.",
  },
  id: {
    description: "Gabung 2–9 foto menjadi satu kolase: grid atau strip dengan gap dan warna latar yang bisa diatur. Semua dikomposit pada canvas di browser.",
    helper: "2–9 gambar hingga 25 MB tiap file — JPG, PNG, WebP.",
    layout: "Tata letak",
    auto: "Otomatis",
    grid2: "Grid 2×2",
    grid3: "Grid 3×3",
    hstrip: "Strip horizontal",
    vstrip: "Strip vertikal",
    gap: "Jarak",
    bg: "Warna latar",
    formatLabel: "Format output",
    qualityLabel: "Kualitas",
    download: "Unduh",
    noImage: "Belum ada gambar",
    noImageDesc: "Jatuhkan 2–9 gambar di atas. Tata letak otomatis mengikuti jumlah, atau ubah manual di bawah.",
    needTwo: "Tambahkan minimal 2 gambar untuk kolase.",
    failed: "Gagal membuat kolase.",
    needImage: "Tambahkan minimal 2 gambar terlebih dahulu.",
    done: "Kolase siap.",
    count: "Foto",
    output: "Hasil",
    faqQ1: "Apakah foto saya diunggah ke mana pun?",
    faqA1: "Tidak. Setiap foto di-decode dan dikomposit pada <canvas> di browser. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Bagaimana cara kerja tata letak Otomatis?",
    faqA2: "Otomatis memilih grid 2×2 untuk hingga 4 foto, grid 3×3 untuk 5 foto atau lebih, dan strip horizontal untuk 2 foto. Anda bisa mengubahnya kapan saja.",
    faqQ3: "Bagaimana foto beda ukuran dipaskan?",
    faqA3: "Setiap foto di-cover-crop ke sel persegi yang seragam — dipusatkan dan diskalakan hingga penuh, jadi tidak ada gambar yang melar atau gepeng.",
  },
};

const MIME: Record<OutFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
};

const CELL = 500;
const LAYOUTS: CollageLayout[] = ["auto", "grid2", "grid3", "hstrip", "vstrip"];

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

function resolveLayout(layout: CollageLayout, count: number): Exclude<CollageLayout, "auto"> {
  try {
    if (layout !== "auto") return layout;
    if (count <= 2) return "hstrip";
    if (count <= 4) return "grid2";
    return "grid3";
  } catch {
    return "hstrip";
  }
}

/** Cover-crop source into a CELL×CELL square at (dx, dy). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
) {
  try {
    const scale = Math.max(CELL / sw, CELL / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const ox = dx + (CELL - dw) / 2;
    const oy = dy + (CELL - dh) / 2;
    ctx.drawImage(src, ox, oy, dw, dh);
  } catch {
    // ignore single-cell failure
  }
}

export default function CollagePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [items, setItems] = useState<Decoded[]>([]);
  const [layout, setLayout] = useState<CollageLayout>("auto");
  const [gap, setGap] = useState(8);
  const [bg, setBg] = useState("#ffffff");
  const [format, setFormat] = useState<OutFormat>("jpg");
  const [quality, setQuality] = useState(0.92);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedRef = useRef(true);
  const itemsRef = useRef<Decoded[]>([]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        for (const it of itemsRef.current) it.cleanup();
      } catch {
        // ignore
      }
    };
  }, []);

  const count = items.length;
  const active = resolveLayout(layout, Math.max(count, 2));
  const cols = active === "grid2" ? 2 : active === "grid3" ? 3 : active === "vstrip" ? 1 : Math.max(count, 1);
  const rows = active === "hstrip" ? 1 : active === "vstrip" ? Math.max(count, 1) : Math.max(1, Math.ceil(count / cols));
  const outW = cols * CELL + (cols - 1) * gap;
  const outH = rows * CELL + (rows - 1) * gap;

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        const room = 9 - itemsRef.current.length;
        const batch = files.slice(0, Math.max(0, room));
        if (batch.length === 0) return;
        const decodedBatch: Decoded[] = [];
        try {
          for (const f of batch) {
            decodedBatch.push(await decodeFile(f));
          }
        } catch {
          for (const d of decodedBatch) {
            try {
              d.cleanup();
            } catch {
              // ignore
            }
          }
          throw new Error("decode-failed");
        }
        if (!mountedRef.current) {
          for (const d of decodedBatch) {
            try {
              d.cleanup();
            } catch {
              // ignore
            }
          }
          return;
        }
        const next = [...itemsRef.current, ...decodedBatch].slice(0, 9);
        itemsRef.current = next;
        setItems(next);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  const clearAll = useCallback(() => {
    try {
      for (const it of itemsRef.current) {
        try {
          it.cleanup();
        } catch {
          // ignore
        }
      }
      itemsRef.current = [];
      setItems([]);
    } catch {
      // ignore
    }
  }, []);

  // Render composite
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || count < 2) return;
      canvas.width = Math.max(1, outW);
      canvas.height = Math.max(1, outH);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < count; i++) {
        const it = items[i];
        if (!it) continue;
        const col = i % cols;
        const row = Math.floor(i / cols);
        drawCover(ctx, it.src, it.w, it.h, col * (CELL + gap), row * (CELL + gap));
      }
    } catch {
      toast.error(s.failed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, count, cols, rows, outW, outH, gap, bg]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || count < 2) {
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
            a.download = `collage-${cols}x${rows}.${format}`;
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
  }, [count, cols, rows, format, quality, s]);

  const layoutLabel = (l: CollageLayout): string => {
    if (l === "auto") return s.auto;
    if (l === "grid2") return s.grid2;
    if (l === "grid3") return s.grid3;
    if (l === "hstrip") return s.hstrip;
    return s.vstrip;
  };

  return (
    <ToolLayout
      title="Photo Collage"
      description={s.description}
      descriptionId={s.description}
      iconName="Images"
      slug="image/collage"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple
          maxSizeMB={25}
          maxFiles={9}
          onFiles={handleFiles}
          helperText={s.helper}
        />

        {count >= 2 ? (
          <>
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.layout}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.layout}>
                    {LAYOUTS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          try {
                            setLayout(l);
                          } catch {
                            // ignore
                          }
                        }}
                        aria-pressed={layout === l}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          layout === l
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                        )}
                      >
                        {layoutLabel(l)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cl-gap" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.gap}: <span className="tabular-nums">{gap}px</span>
                    </label>
                    <input
                      id="cl-gap"
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={gap}
                      onChange={(e) => {
                        try {
                          setGap(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="cl-bg" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.bg}
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        id="cl-bg"
                        type="color"
                        value={bg}
                        onChange={(e) => {
                          try {
                            setBg(e.target.value);
                          } catch {
                            // ignore
                          }
                        }}
                        className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      />
                      <span className="text-sm tabular-nums uppercase text-zinc-500 dark:text-zinc-400">{bg}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cl-format" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.formatLabel}
                    </label>
                    <select
                      id="cl-format"
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
                      {(["jpg", "png"] as OutFormat[]).map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  {format === "jpg" && (
                    <div>
                      <label htmlFor="cl-quality" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.qualityLabel}: <span className="tabular-nums">{Math.round(quality * 100)}%</span>
                      </label>
                      <input
                        id="cl-quality"
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
                <Button type="button" variant="outline" onClick={clearAll} className="w-full">
                  {count} / 9 — restart
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>
                    {s.count}: <span className="font-semibold tabular-nums">{count}</span>
                  </span>
                  <span>
                    {s.output}: <span className="font-semibold tabular-nums">{outW}×{outH}</span>
                  </span>
                </div>
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
          <EmptyState
            icon={<Images className="h-6 w-6" aria-hidden />}
            title={s.noImage}
            hint={count === 1 ? s.needTwo : s.noImageDesc}
          />
        )}
        {count < 2 && <canvas ref={canvasRef} className="hidden" />}
      </div>
    </ToolLayout>
  );
}
