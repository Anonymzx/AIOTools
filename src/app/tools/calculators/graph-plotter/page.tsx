"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { evaluateExpression } from "@/lib/math-eval";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    fn: string;
    enable: string;
    xmin: string;
    xmax: string;
    ymin: string;
    ymax: string;
    grid: string;
    plot: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    presets: string;
    presetQuad: string;
    presetSin: string;
    presetXCos: string;
    hint: string;
    plotted: string;
    plotFailed: string;
    invalidRange: string;
    error: string;
  }
> = {
  en: {
    title: "Graph Plotter",
    description:
      "Plot up to 3 math functions on a custom canvas — drag to pan, scroll to zoom, adjustable X/Y ranges. Same parser as the scientific calculator. 100% in your browser.",
    fn: "Function",
    enable: "Show",
    xmin: "X min",
    xmax: "X max",
    ymin: "Y min",
    ymax: "Y max",
    grid: "Grid",
    plot: "Plot",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    presets: "Presets",
    presetQuad: "x²",
    presetSin: "sin(x)",
    presetXCos: "x·cos(x)",
    hint: "Drag to pan · scroll or pinch to zoom · uses variable x, e.g. x^2, sin(x)",
    plotted: "Plot updated.",
    plotFailed: "Could not plot — keeping last good plot.",
    invalidRange: "X min must be < X max and Y min must be < Y max.",
    error: "Something went wrong.",
  },
  id: {
    title: "Plotter Grafik",
    description:
      "Plot hingga 3 fungsi matematika di kanvas kustom — seret untuk geser, scroll untuk zoom, rentang X/Y bisa diatur. Parser sama dengan kalkulator ilmiah. 100% di browser.",
    fn: "Fungsi",
    enable: "Tampil",
    xmin: "X min",
    xmax: "X maks",
    ymin: "Y min",
    ymax: "Y maks",
    grid: "Grid",
    plot: "Plot",
    zoomIn: "Perbesar",
    zoomOut: "Perkecil",
    resetView: "Atur ulang tampilan",
    presets: "Preset",
    presetQuad: "x²",
    presetSin: "sin(x)",
    presetXCos: "x·cos(x)",
    hint: "Seret untuk geser · scroll untuk zoom · memakai variabel x, mis. x^2, sin(x)",
    plotted: "Plot diperbarui.",
    plotFailed: "Gagal mem-plot — mempertahankan plot terakhir yang baik.",
    invalidRange: "X min harus < X maks dan Y min harus < Y maks.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What syntax can I type?",
      a: "Anything the scientific calculator accepts with variable x: x^2, sin(x), x*cos(x), sqrt(abs(x)), ln(x), and constants pi/e. Angles are radians.",
    },
    id: {
      q: "Sintaks apa yang bisa diketik?",
      a: "Apa pun yang diterima kalkulator ilmiah dengan variabel x: x^2, sin(x), x*cos(x), sqrt(abs(x)), ln(x), dan konstanta pi/e. Sudut dalam radian.",
    },
  },
  {
    en: {
      q: "How do pan and zoom work?",
      a: "Drag the canvas to pan, use the mouse wheel (or the zoom buttons) to zoom centered on the cursor, and edit the X/Y range inputs for exact bounds. Reset view restores −10…10.",
    },
    id: {
      q: "Bagaimana cara geser dan zoom?",
      a: "Seret kanvas untuk menggeser, gunakan roda mouse (atau tombol zoom) untuk zoom berpusat di kursor, dan edit input rentang X/Y untuk batas persis. Atur ulang tampilan mengembalikan −10…10.",
    },
  },
  {
    en: {
      q: "What happens when my function has an error?",
      a: "A toast explains the problem and the last good plot stays on screen, so a typo never wipes your graph. Fix the expression and press Plot again.",
    },
    id: {
      q: "Apa yang terjadi jika fungsi saya error?",
      a: "Toast menjelaskan masalahnya dan plot terakhir yang baik tetap di layar, sehingga salah ketik tak pernah menghapus grafik. Perbaiki ekspresi lalu tekan Plot lagi.",
    },
  },
];

const FN_COLORS = ["#6366f1", "#10b981", "#f59e0b"];
const DEFAULT_VIEW = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
const SAMPLES = 400;

interface View {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function niceStep(span: number, targetLines: number): number {
  const raw = span / Math.max(1, targetLines);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  if (norm >= 5) return 5 * mag;
  if (norm >= 2) return 2 * mag;
  return mag;
}

export default function GraphPlotterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [exprs, setExprs] = useState<string[]>(["x^2", "", ""]);
  const [enabled, setEnabled] = useState<boolean[]>([true, false, false]);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Last good polylines per function — errors keep these intact.
  const goodRef = useRef<Array<Array<{ x: number; y: number }> | null>>([null, null, null]);
  const panRef = useRef<{ sx: number; sy: number; view: View } | null>(null);

  const sample = useCallback((expr: string, v: View): Array<{ x: number; y: number }> => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= SAMPLES; i += 1) {
      const x = v.xMin + ((v.xMax - v.xMin) * i) / SAMPLES;
      const y = evaluateExpression(expr, { angle: "rad", vars: { x } });
      if (Number.isFinite(y)) pts.push({ x, y });
      else pts.push({ x, y: Number.NaN });
    }
    return pts;
  }, []);

  const handlePlot = useCallback((): void => {
    try {
      if (!(view.xMin < view.xMax && view.yMin < view.yMax)) {
        toast.error(s.invalidRange);
        return;
      }
      let ok = 0;
      let failed = false;
      const next = [...goodRef.current];
      for (let i = 0; i < 3; i += 1) {
        if (!(enabled[i] as boolean)) {
          next[i] = null;
          continue;
        }
        const raw = ((exprs[i] as string) ?? "").trim();
        if (raw === "") {
          next[i] = null;
          continue;
        }
        try {
          next[i] = sample(raw, view);
          ok += 1;
        } catch {
          failed = true;
        }
      }
      goodRef.current = next;
      if (failed) toast.error(s.plotFailed);
      else if (ok > 0) toast.success(s.plotted);
    } catch {
      toast.error(s.error);
    }
  }, [view, exprs, enabled, sample, s.plotFailed, s.plotted, s.invalidRange, s.error]);

  // Initial plot after mount (canvas needs layout size — effect only).
  useEffect(() => {
    handlePlot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on view/grid/data change — canvas painting lives only in effects.
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const dark = document.documentElement.classList.contains("dark");
      const bg = dark ? "#09090b" : "#ffffff";
      const gridCol = dark ? "#27272a" : "#e4e4e7";
      const axisCol = dark ? "#71717a" : "#a1a1aa";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const spanX = view.xMax - view.xMin;
      const spanY = view.yMax - view.yMin;
      if (!(spanX > 0 && spanY > 0)) return;
      const toPx = (x: number): number => ((x - view.xMin) / spanX) * w;
      const toPy = (y: number): number => h - ((y - view.yMin) / spanY) * h;

      if (showGrid) {
        const stepX = niceStep(spanX, 10);
        const stepY = niceStep(spanY, 8);
        ctx.strokeStyle = gridCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = Math.ceil(view.xMin / stepX) * stepX; gx <= view.xMax; gx += stepX) {
          const px = Math.round(toPx(gx)) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, h);
        }
        for (let gy = Math.ceil(view.yMin / stepY) * stepY; gy <= view.yMax; gy += stepY) {
          const py = Math.round(toPy(gy)) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(w, py);
        }
        ctx.stroke();
      }

      // Axes at x=0 / y=0 when in range.
      ctx.strokeStyle = axisCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (view.xMin <= 0 && view.xMax >= 0) {
        const px = Math.round(toPx(0)) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      if (view.yMin <= 0 && view.yMax >= 0) {
        const py = Math.round(toPy(0)) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();

      // Function polylines (last good data only).
      for (let f = 0; f < 3; f += 1) {
        const pts = goodRef.current[f];
        if (!pts) continue;
        ctx.strokeStyle = FN_COLORS[f] as string;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.beginPath();
        let pen = false;
        for (const p of pts) {
          if (!Number.isFinite(p.y)) {
            pen = false;
            continue;
          }
          const px = toPx(p.x);
          const py = toPy(p.y);
          if (!pen) {
            ctx.moveTo(px, py);
            pen = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    } catch {
      // painting must never break the page
    }
  }, [view, showGrid, exprs, enabled]);

  // Pan (pointer) + wheel zoom — listeners attached in effect with cleanup.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onDown = (e: PointerEvent): void => {
      try {
        panRef.current = { sx: e.clientX, sy: e.clientY, view };
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };
    const onMove = (e: PointerEvent): void => {
      try {
        const start = panRef.current;
        if (!start) return;
        const rect = canvas.getBoundingClientRect();
        const dx = ((e.clientX - start.sx) / rect.width) * (start.view.xMax - start.view.xMin);
        const dy = ((e.clientY - start.sy) / rect.height) * (start.view.yMax - start.view.yMin);
        setView({
          xMin: start.view.xMin - dx,
          xMax: start.view.xMax - dx,
          yMin: start.view.yMin + dy,
          yMax: start.view.yMax + dy,
        });
      } catch {
        // ignore
      }
    };
    const onUp = (): void => {
      panRef.current = null;
    };
    const onWheel = (e: WheelEvent): void => {
      try {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
        setView((v) => {
          const cx = v.xMin + (v.xMax - v.xMin) * fx;
          const cy = v.yMax - (v.yMax - v.yMin) * fy;
          const nx = (v.xMax - v.xMin) * factor;
          const ny = (v.yMax - v.yMin) * factor;
          if (!(nx > 1e-6 && ny > 1e-6 && nx < 1e12 && ny < 1e12)) return v;
          return { xMin: cx - nx * fx, xMax: cx + nx * (1 - fx), yMin: cy - ny * (1 - fy), yMax: cy + ny * fy };
        });
      } catch {
        // ignore
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [view]);

  const zoomBy = (factor: number): void => {
    try {
      setView((v) => {
        const cx = (v.xMin + v.xMax) / 2;
        const cy = (v.yMin + v.yMax) / 2;
        const nx = ((v.xMax - v.xMin) * factor);
        const ny = ((v.yMax - v.yMin) * factor);
        if (!(nx > 1e-6 && ny > 1e-6 && nx < 1e12 && ny < 1e12)) return v;
        return { xMin: cx - nx / 2, xMax: cx + nx / 2, yMin: cy - ny / 2, yMax: cy + ny / 2 };
      });
    } catch {
      toast.error(s.error);
    }
  };

  const setExprAt = (i: number, value: string): void => {
    try {
      setExprs((prev) => prev.map((e, k) => (k === i ? value : e)));
    } catch {
      toast.error(s.error);
    }
  };

  const toggleAt = (i: number, on: boolean): void => {
    try {
      setEnabled((prev) => prev.map((e, k) => (k === i ? on : e)));
    } catch {
      toast.error(s.error);
    }
  };

  const applyPreset = (preset: string[]): void => {
    try {
      setExprs([preset[0] ?? "", preset[1] ?? "", preset[2] ?? ""]);
      setEnabled([(preset[0] ?? "") !== "", (preset[1] ?? "") !== "", (preset[2] ?? "") !== ""]);
      setView(DEFAULT_VIEW);
    } catch {
      toast.error(s.error);
    }
  };

  const numCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";
  const labelCls = "text-xs font-semibold text-zinc-600 dark:text-zinc-300";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Calculator"
      slug="calculators/graph-plotter"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ background: FN_COLORS[i] }}
                />
                <label htmlFor={`gp-fn${i}`} className="sr-only">
                  {s.fn} {i + 1}
                </label>
                <input
                  id={`gp-fn${i}`}
                  type="text"
                  value={exprs[i] as string}
                  placeholder={i === 0 ? "x^2" : i === 1 ? "sin(x)" : "x*cos(x)"}
                  onChange={(e) => setExprAt(i, e.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={enabled[i] as boolean}
                    onChange={(e) => toggleAt(i, e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                  />
                  {s.enable}
                </label>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.presets}:</span>
              <Button size="sm" variant="outline" onClick={() => applyPreset(["x^2", "", ""])}>{s.presetQuad}</Button>
              <Button size="sm" variant="outline" onClick={() => applyPreset(["sin(x)", "", ""])}>{s.presetSin}</Button>
              <Button size="sm" variant="outline" onClick={() => applyPreset(["x*cos(x)", "", ""])}>{s.presetXCos}</Button>
              <Button size="sm" onClick={handlePlot} className="ms-auto">{s.plot}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.hint}</p>
            <canvas
              ref={canvasRef}
              className="h-80 w-full cursor-grab touch-none rounded-xl border border-zinc-200 active:cursor-grabbing dark:border-zinc-800"
              aria-label={s.title}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => zoomBy(1 / 1.25)}>{s.zoomIn}</Button>
              <Button size="sm" variant="outline" onClick={() => zoomBy(1.25)}>{s.zoomOut}</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  try {
                    setView(DEFAULT_VIEW);
                  } catch {
                    toast.error(s.error);
                  }
                }}
              >
                {s.resetView}
              </Button>
              <label className="ms-auto flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                {s.grid}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="gp-xmin" className={labelCls}>{s.xmin}</label>
                <input id="gp-xmin" type="number" value={view.xMin} onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setView((p) => ({ ...p, xMin: v }));
                  } catch { toast.error(s.error); }
                }} className={numCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="gp-xmax" className={labelCls}>{s.xmax}</label>
                <input id="gp-xmax" type="number" value={view.xMax} onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setView((p) => ({ ...p, xMax: v }));
                  } catch { toast.error(s.error); }
                }} className={numCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="gp-ymin" className={labelCls}>{s.ymin}</label>
                <input id="gp-ymin" type="number" value={view.yMin} onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setView((p) => ({ ...p, yMin: v }));
                  } catch { toast.error(s.error); }
                }} className={numCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="gp-ymax" className={labelCls}>{s.ymax}</label>
                <input id="gp-ymax" type="number" value={view.yMax} onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setView((p) => ({ ...p, yMax: v }));
                  } catch { toast.error(s.error); }
                }} className={numCls} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
