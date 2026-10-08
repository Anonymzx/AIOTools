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

const W = 800;
const H = 600;

interface BgTemplate {
  key: string;
  label: string;
  c1: string;
  c2: string;
}

const TEMPLATES: BgTemplate[] = [
  { key: "sunset", label: "Sunset", c1: "#ff512f", c2: "#dd2476" },
  { key: "ocean", label: "Ocean", c1: "#2193b0", c2: "#6dd5ed" },
  { key: "forest", label: "Forest", c1: "#134e5e", c2: "#71b280" },
  { key: "grape", label: "Grape", c1: "#654ea3", c2: "#eaafc8" },
  { key: "slate", label: "Slate", c1: "#232526", c2: "#414345" },
];

interface MemeStrings {
  description: string;
  helper: string;
  background: string;
  uploadNote: string;
  topText: string;
  bottomText: string;
  topPh: string;
  bottomPh: string;
  sizeLabel: string;
  colorLabel: string;
  strokeLabel: string;
  dragHint: string;
  download: string;
  needBg: string;
  failed: string;
  done: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, MemeStrings> = {
  en: {
    description: "Make memes with top/bottom captions on your photo or 5 built-in gradient backgrounds. Drag text on canvas, auto-wrap, outline control — download PNG, all in your browser.",
    helper: "Optional photo up to 10 MB — or just use a built-in background.",
    background: "Background",
    uploadNote: "Upload a photo, or pick a built-in gradient below.",
    topText: "Top text",
    bottomText: "Bottom text",
    topPh: "TOP TEXT",
    bottomPh: "BOTTOM TEXT",
    sizeLabel: "Font size",
    colorLabel: "Text color",
    strokeLabel: "Outline width",
    dragHint: "Tip: drag the captions directly on the canvas to reposition them.",
    download: "Download PNG",
    needBg: "Pick a background or upload a photo first.",
    failed: "Could not render the meme.",
    done: "Meme downloaded.",
    faqQ1: "Is my photo uploaded anywhere?",
    faqA1: "No. Compositing happens on a <canvas> in your browser. Nothing leaves your device.",
    faqQ2: "How do I move the text?",
    faqA2: "Press/touch a caption on the canvas and drag it. The outline color auto-contrasts against your text color for readability.",
    faqQ3: "Does long text wrap?",
    faqA3: "Yes. Captions auto-wrap to the canvas width and stay centered, classic meme style.",
  },
  id: {
    description: "Buat meme dengan teks atas/bawah di foto Anda atau 5 background gradien bawaan. Geser teks di canvas, wrap otomatis, kontrol outline — unduh PNG, semua di browser.",
    helper: "Foto opsional hingga 10 MB — atau cukup pakai background bawaan.",
    background: "Background",
    uploadNote: "Unggah foto, atau pilih gradien bawaan di bawah.",
    topText: "Teks atas",
    bottomText: "Teks bawah",
    topPh: "TEKS ATAS",
    bottomPh: "TEKS BAWAH",
    sizeLabel: "Ukuran font",
    colorLabel: "Warna teks",
    strokeLabel: "Lebar outline",
    dragHint: "Tips: seret teks langsung di canvas untuk memindahkan posisinya.",
    download: "Unduh PNG",
    needBg: "Pilih background atau unggah foto terlebih dahulu.",
    failed: "Gagal me-render meme.",
    done: "Meme terunduh.",
    faqQ1: "Apakah foto saya diunggah ke mana pun?",
    faqA1: "Tidak. Komposit terjadi pada <canvas> di browser. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Bagaimana cara memindahkan teks?",
    faqA2: "Tekan/sentuh teks pada canvas lalu seret. Warna outline otomatis kontras terhadap warna teks agar mudah dibaca.",
    faqQ3: "Apakah teks panjang ter-wrap?",
    faqA3: "Ya. Teks otomatis wrap mengikuti lebar canvas dan tetap di tengah, gaya meme klasik.",
  },
};

function luminance(hex: string): number {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 1;
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function paintMeme(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  tpl: BgTemplate,
  top: string,
  bottom: string,
  topY: number,
  botY: number,
  fontSize: number,
  color: string,
  stroke: number,
): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-2d-unavailable");
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) throw new Error("decode-failed");
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, tpl.c1);
    g.addColorStop(1, tpl.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const strokeColor = luminance(color) > 0.5 ? "#000000" : "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", Arial, sans-serif`;
  const maxWidth = W - 48;
  const lineH = fontSize * 1.15;
  const blocks: Array<{ lines: string[]; cy: number }> = [
    { lines: wrapLines(ctx, top.toUpperCase(), maxWidth), cy: topY },
    { lines: wrapLines(ctx, bottom.toUpperCase(), maxWidth), cy: botY },
  ];
  for (const b of blocks) {
    const startY = b.cy - ((b.lines.length - 1) * lineH) / 2;
    b.lines.forEach((line, i) => {
      const y = startY + i * lineH;
      if (stroke > 0) {
        ctx.lineWidth = stroke;
        ctx.strokeStyle = strokeColor;
        ctx.lineJoin = "round";
        ctx.strokeText(line, W / 2, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, W / 2, y);
    });
  }
}

export default function MemePage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState("sunset");
  const [top, setTop] = useState("TOP TEXT");
  const [bottom, setBottom] = useState("BOTTOM TEXT");
  const [fontSize, setFontSize] = useState(56);
  const [color, setColor] = useState("#ffffff");
  const [stroke, setStroke] = useState(4);
  const [topY, setTopY] = useState(80);
  const [botY, setBotY] = useState(520);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<"top" | "bottom" | null>(null);
  const mountedRef = useRef(true);
  const urlRef = useRef<string | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const tpl = TEMPLATES.find((t) => t.key === template) ?? TEMPLATES[0];

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        try {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        } catch {
          // ignore
        }
        const url = URL.createObjectURL(f);
        urlRef.current = url;
        setSrcUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Render meme on every control change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let img: HTMLImageElement | null = null;
        if (srcUrl) {
          img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("decode-failed"));
            el.src = srcUrl;
          });
        }
        if (cancelled || !mountedRef.current) return;
        paintMeme(canvas, img, tpl, top, bottom, topY, botY, fontSize, color, stroke);
      } catch {
        if (!cancelled && mountedRef.current) toast.error(s.failed);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl, template, top, bottom, topY, botY, fontSize, color, stroke]);

  const canvasY = useCallback((clientY: number): number | null => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.height === 0) return null;
      return ((clientY - rect.top) / rect.height) * H;
    } catch {
      return null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        const y = canvasY(e.clientY);
        if (y == null) return;
        if (Math.abs(y - topY) <= Math.max(fontSize, 28)) dragRef.current = "top";
        else if (Math.abs(y - botY) <= Math.max(fontSize, 28)) dragRef.current = "bottom";
        else return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    },
    [canvasY, topY, botY, fontSize],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        if (!dragRef.current) return;
        const y = canvasY(e.clientY);
        if (y == null) return;
        const clamped = Math.min(H - 20, Math.max(20, Math.round(y)));
        if (dragRef.current === "top") setTopY(clamped);
        else setBotY(clamped);
      } catch {
        // ignore
      }
    },
    [canvasY],
  );

  const onPointerUp = useCallback(() => {
    try {
      dragRef.current = null;
    } catch {
      // ignore
    }
  }, []);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error(s.needBg);
        return;
      }
      canvas.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "meme.png";
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
  }, [s]);

  return (
    <ToolLayout
      title="Meme Generator"
      description={s.description}
      descriptionId={s.description}
      iconName="Clapperboard"
      slug="design/meme"
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
          maxSizeMB={10}
          maxFiles={1}
          onFiles={(f) => {
            handleFiles(f);
          }}
          helperText={s.helper}
        />

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.background}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.uploadNote}</p>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label={s.background}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={template === t.key && !srcUrl}
                  onClick={() => {
                    try {
                      setTemplate(t.key);
                      try {
                        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                      } catch {
                        // ignore
                      }
                      urlRef.current = null;
                      setSrcUrl(null);
                    } catch {
                      // ignore
                    }
                  }}
                  className={cn(
                    "h-12 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:h-14",
                    template === t.key && !srcUrl
                      ? "border-indigo-600 shadow-md"
                      : "border-transparent hover:border-indigo-300",
                  )}
                  style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})` }}
                />
              ))}
            </div>
            {srcUrl && (
              <button
                type="button"
                onClick={() => {
                  try {
                    try {
                      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                    } catch {
                      // ignore
                    }
                    urlRef.current = null;
                    setSrcUrl(null);
                  } catch {
                    // ignore
                  }
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <ImagePlus className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                {s.background}: {tpl.label}
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="meme-top" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.topText}
                </label>
                <input
                  id="meme-top"
                  type="text"
                  value={top}
                  maxLength={120}
                  placeholder={s.topPh}
                  onChange={(e) => {
                    try {
                      setTop(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <label htmlFor="meme-bottom" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.bottomText}
                </label>
                <input
                  id="meme-bottom"
                  type="text"
                  value={bottom}
                  maxLength={120}
                  placeholder={s.bottomPh}
                  onChange={(e) => {
                    try {
                      setBottom(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="meme-size" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.sizeLabel}: <span className="tabular-nums">{fontSize}px</span>
              </label>
              <input
                id="meme-size"
                type="range"
                min={20}
                max={120}
                step={1}
                value={fontSize}
                onChange={(e) => {
                  try {
                    setFontSize(Number(e.target.value));
                  } catch {
                    // ignore
                  }
                }}
                className="mt-2 w-full accent-indigo-600"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <label htmlFor="meme-color" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.colorLabel}
                </label>
                <input
                  id="meme-color"
                  type="color"
                  value={color}
                  onChange={(e) => {
                    try {
                      setColor(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
                <span className="text-xs uppercase tabular-nums text-zinc-500 dark:text-zinc-400">{color}</span>
              </div>
              <div>
                <label htmlFor="meme-stroke" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.strokeLabel}: <span className="tabular-nums">{stroke}px</span>
                </label>
                <input
                  id="meme-stroke"
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={stroke}
                  onChange={(e) => {
                    try {
                      setStroke(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="mx-auto h-auto w-full max-w-[800px] cursor-move touch-none"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.dragHint}</p>
            <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4" aria-hidden />
              {s.download} · {W}×{H}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
