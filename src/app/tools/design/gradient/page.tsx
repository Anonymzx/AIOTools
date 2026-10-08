"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Dices, Download, Plus, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type Mode = "linear" | "radial";

interface Stop {
  id: number;
  color: string;
  pos: number;
}

interface Preset {
  name: string;
  mode: Mode;
  angle: number;
  stops: { color: string; pos: number }[];
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    stopsLabel: string;
    addStop: string;
    maxStops: string;
    minStops: string;
    minStopsMsg: string;
    maxStopsMsg: string;
    removeStop: string;
    position: string;
    modeLabel: string;
    linear: string;
    radial: string;
    angle: string;
    preview: string;
    cssOutput: string;
    copy: string;
    copied: string;
    random: string;
    randomOk: string;
    presets: string;
    presetApplied: string;
    exportPng: string;
    exported: string;
    emptyNothing: string;
    error: string;
  }
> = {
  en: {
    title: "Gradient Generator",
    description:
      "Build linear or radial CSS gradients with 2–5 color stops, live preview, presets, and one-click PNG export — all in your browser.",
    stopsLabel: "Color stops",
    addStop: "Add stop",
    maxStops: "Maximum 5 stops.",
    minStops: "Keep at least 2 stops.",
    minStopsMsg: "A gradient needs at least 2 stops.",
    maxStopsMsg: "Maximum 5 stops allowed.",
    removeStop: "Remove stop",
    position: "Position",
    modeLabel: "Type",
    linear: "Linear",
    radial: "Radial",
    angle: "Angle",
    preview: "Live preview",
    cssOutput: "CSS output",
    copy: "Copy CSS",
    copied: "CSS copied to clipboard.",
    random: "Random",
    randomOk: "Random gradient generated.",
    presets: "Presets",
    presetApplied: "Preset applied.",
    exportPng: "Export PNG",
    exported: "Gradient exported as PNG.",
    emptyNothing: "Nothing to copy yet.",
    error: "Something went wrong.",
  },
  id: {
    title: "Gradient Generator",
    description:
      "Buat gradien CSS linear atau radial dengan 2–5 color stop, pratinjau langsung, preset, dan ekspor PNG sekali klik — semua di browser.",
    stopsLabel: "Color stop",
    addStop: "Tambah stop",
    maxStops: "Maksimal 5 stop.",
    minStops: "Pertahankan minimal 2 stop.",
    minStopsMsg: "Gradien butuh minimal 2 stop.",
    maxStopsMsg: "Maksimal 5 stop diizinkan.",
    removeStop: "Hapus stop",
    position: "Posisi",
    modeLabel: "Tipe",
    linear: "Linear",
    radial: "Radial",
    angle: "Sudut",
    preview: "Pratinjau langsung",
    cssOutput: "Output CSS",
    copy: "Salin CSS",
    copied: "CSS disalin ke clipboard.",
    random: "Acak",
    randomOk: "Gradien acak dibuat.",
    presets: "Preset",
    presetApplied: "Preset diterapkan.",
    exportPng: "Ekspor PNG",
    exported: "Gradien diekspor sebagai PNG.",
    emptyNothing: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What CSS does this tool output?",
      a: "A standard linear-gradient(angle, …) or radial-gradient(circle, …) declaration with each stop as color + percentage. Paste it straight into any stylesheet — no prefixes needed for modern browsers.",
    },
    id: {
      q: "CSS apa yang dihasilkan tool ini?",
      a: "Deklarasi standar linear-gradient(angle, …) atau radial-gradient(circle, …) dengan tiap stop berupa warna + persentase. Tempel langsung ke stylesheet — tanpa prefix untuk browser modern.",
    },
  },
  {
    en: {
      q: "How is the PNG export rendered?",
      a: "The gradient is painted onto a 1200×630 canvas with the Canvas Gradient API using the same stops and angle, then downloaded as a PNG file.",
    },
    id: {
      q: "Bagaimana ekspor PNG di-render?",
      a: "Gradien digambar ke canvas 1200×630 dengan Canvas Gradient API memakai stop dan sudut yang sama, lalu diunduh sebagai file PNG.",
    },
  },
  {
    en: {
      q: "Is my work uploaded anywhere?",
      a: "No. Stops, preview, and PNG export are computed entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah hasil kerjaku diunggah ke mana pun?",
      a: "Tidak. Stop, pratinjau, dan ekspor PNG dihitung sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const PRESETS: Preset[] = [
  {
    name: "Instagram",
    mode: "linear",
    angle: 45,
    stops: [
      { color: "#feda75", pos: 0 },
      { color: "#fa7e1e", pos: 30 },
      { color: "#d62976", pos: 60 },
      { color: "#962fbf", pos: 100 },
    ],
  },
  {
    name: "Sunset",
    mode: "linear",
    angle: 135,
    stops: [
      { color: "#ff512f", pos: 0 },
      { color: "#dd2476", pos: 100 },
    ],
  },
  {
    name: "Ocean",
    mode: "linear",
    angle: 135,
    stops: [
      { color: "#2193b0", pos: 0 },
      { color: "#6dd5ed", pos: 100 },
    ],
  },
  {
    name: "Forest",
    mode: "linear",
    angle: 135,
    stops: [
      { color: "#11998e", pos: 0 },
      { color: "#38ef7d", pos: 100 },
    ],
  },
  {
    name: "Peach",
    mode: "linear",
    angle: 135,
    stops: [
      { color: "#ff9a9c", pos: 0 },
      { color: "#fecfef", pos: 100 },
    ],
  },
  {
    name: "Glow",
    mode: "radial",
    angle: 135,
    stops: [
      { color: "#a78bfa", pos: 0 },
      { color: "#4c1d95", pos: 70 },
      { color: "#0f0a2e", pos: 100 },
    ],
  },
];

const INITIAL_STOPS: Stop[] = [
  { id: 1, color: "#6366f1", pos: 0 },
  { id: 2, color: "#8b5cf6", pos: 50 },
  { id: 3, color: "#10b981", pos: 100 },
];

function buildCss(mode: Mode, angle: number, stops: Stop[]): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const list = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
  return mode === "linear"
    ? `background: linear-gradient(${angle}deg, ${list});`
    : `background: radial-gradient(circle, ${list});`;
}

function paintGradient(
  canvas: HTMLCanvasElement,
  mode: Mode,
  angle: number,
  stops: Stop[],
  w: number,
  h: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-ctx");
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  let g: CanvasGradient;
  if (mode === "linear") {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const diag = Math.sqrt(w * w + h * h) / 2;
    g = ctx.createLinearGradient(
      w / 2 - dx * diag,
      h / 2 - dy * diag,
      w / 2 + dx * diag,
      h / 2 + dy * diag,
    );
  } else {
    const r = Math.sqrt(w * w + h * h) / 2;
    g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
  }
  for (const s of sorted) {
    g.addColorStop(Math.min(1, Math.max(0, s.pos / 100)), s.color);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function randomHex(hue: number, sat: number, light: number): string {
  const s = sat / 100;
  const l = light / 100;
  const k = (n: number): number => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number): string =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

export default function GradientPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const idRef = useRef(100);

  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [mode, setMode] = useState<Mode>("linear");
  const [angle, setAngle] = useState(135);

  const css = buildCss(mode, angle, stops);
  const bgValue = css.replace(/^background:\s*/, "").replace(/;\s*$/, "");

  const handleAdd = (): void => {
    try {
      if (stops.length >= 5) {
        toast.error(s.maxStopsMsg);
        return;
      }
      idRef.current += 1;
      const count = stops.length;
      const pos = Math.round((100 / count) * Math.floor(count / 2));
      setStops((prev) => [...prev, { id: idRef.current, color: "#f59e0b", pos }]);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRemove = (id: number): void => {
    try {
      if (stops.length <= 2) {
        toast.error(s.minStopsMsg);
        return;
      }
      setStops((prev) => prev.filter((st) => st.id !== id));
    } catch {
      toast.error(s.error);
    }
  };

  const handleStopChange = (id: number, patch: Partial<Stop>): void => {
    try {
      setStops((prev) => prev.map((st) => (st.id === id ? { ...st, ...patch } : st)));
    } catch {
      toast.error(s.error);
    }
  };

  const handlePreset = (p: Preset): void => {
    try {
      idRef.current += 1;
      const base = idRef.current;
      setMode(p.mode);
      setAngle(p.angle);
      setStops(p.stops.map((st, i) => ({ id: base + i, color: st.color, pos: st.pos })));
      idRef.current = base + p.stops.length;
      toast.success(s.presetApplied);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRandom = (): void => {
    try {
      const hue = Math.floor(Math.random() * 360);
      idRef.current += 1;
      const base = idRef.current;
      setStops([
        { id: base, color: randomHex(hue, 85, 60), pos: 0 },
        { id: base + 1, color: randomHex((hue + 40) % 360, 80, 55), pos: 50 },
        { id: base + 2, color: randomHex((hue + 90) % 360, 85, 45), pos: 100 },
      ]);
      idRef.current = base + 2;
      toast.success(s.randomOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleExport = (): void => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      paintGradient(canvas, mode, angle, stops, 1200, 630);
      canvas.toBlob((blob) => {
        try {
          if (!blob) {
            toast.error(s.error);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "gradient.png";
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
          toast.success(s.exported);
        } catch {
          toast.error(s.error);
        }
      }, "image/png");
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Droplets"
      slug="design/gradient"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.preview}
            </p>
            <div
              role="img"
              aria-label={s.preview}
              className="h-44 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 sm:h-56"
              style={{ background: bgValue }}
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.modeLabel}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mode === "linear" ? "default" : "secondary"}
                  onClick={() => {
                    try {
                      setMode("linear");
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.linear}
                </Button>
                <Button
                  size="sm"
                  variant={mode === "radial" ? "default" : "secondary"}
                  onClick={() => {
                    try {
                      setMode("radial");
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.radial}
                </Button>
              </div>
              {mode === "linear" && (
                <div className="flex min-w-[12rem] flex-1 items-center gap-2">
                  <label
                    htmlFor="grad-angle"
                    className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {s.angle}: <span className="font-mono">{angle}°</span>
                  </label>
                  <input
                    id="grad-angle"
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => {
                      try {
                        setAngle(Number(e.target.value));
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.stopsLabel}{" "}
                  <Badge variant="secondary" className="font-mono">
                    {stops.length}/5
                  </Badge>
                </p>
                <Button size="sm" variant="outline" onClick={handleAdd}>
                  <Plus aria-hidden />
                  {s.addStop}
                </Button>
              </div>
              {stops.map((st) => (
                <div
                  key={st.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700 sm:flex-row sm:items-center"
                >
                  <input
                    type="color"
                    value={st.color}
                    aria-label={`${s.stopsLabel} ${st.id}`}
                    onChange={(e) => handleStopChange(st.id, { color: e.target.value })}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-700"
                  />
                  <code className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                    {st.color}
                  </code>
                  <div className="flex flex-1 items-center gap-2">
                    <label
                      htmlFor={`grad-pos-${st.id}`}
                      className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      {s.position}: <span className="font-mono">{st.pos}%</span>
                    </label>
                    <input
                      id={`grad-pos-${st.id}`}
                      type="range"
                      min={0}
                      max={100}
                      value={st.pos}
                      onChange={(e) =>
                        handleStopChange(st.id, { pos: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(st.id)}
                    disabled={stops.length <= 2}
                    aria-label={s.removeStop}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.presets}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className="group rounded-xl border border-zinc-200 p-2 text-left transition hover:border-indigo-400 dark:border-zinc-700 dark:hover:border-indigo-500"
                  >
                    <span
                      aria-hidden
                      className="block h-12 w-full rounded-lg"
                      style={{
                        background: buildCss(p.mode, p.angle, p.stops.map((st, i) => ({ id: i, ...st })))
                          .replace(/^background:\s*/, "")
                          .replace(/;\s*$/, ""),
                      }}
                    />
                    <span className="mt-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.cssOutput}
              </p>
              <pre className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {css}
              </pre>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <CopyButton
                  text={css}
                  label={s.copy}
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyNothing}
                  errorMessage={s.error}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                />
                <Button variant="secondary" onClick={handleRandom}>
                  <Dices aria-hidden />
                  {s.random}
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download aria-hidden />
                  {s.exportPng}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
