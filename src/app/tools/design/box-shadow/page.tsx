"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

interface Shadow {
  id: number;
  ox: number;
  oy: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

interface ShadowPreset {
  name: string;
  shadow: Omit<Shadow, "id">;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    preview: string;
    shadows: string;
    addShadow: string;
    removeShadow: string;
    moveUp: string;
    moveDown: string;
    offsetX: string;
    offsetY: string;
    blur: string;
    spread: string;
    color: string;
    opacity: string;
    inset: string;
    cssOutput: string;
    copy: string;
    copied: string;
    presets: string;
    presetApplied: string;
    maxShadows: string;
    minShadows: string;
    emptyNothing: string;
    error: string;
  }
> = {
  en: {
    title: "Box Shadow Generator",
    description:
      "Craft single or layered CSS box-shadows with sliders, opacity control, and inset mode — live preview, presets, and copy-ready CSS.",
    preview: "Live preview",
    shadows: "Shadows",
    addShadow: "Add shadow",
    removeShadow: "Remove shadow",
    moveUp: "Move up",
    moveDown: "Move down",
    offsetX: "Offset X",
    offsetY: "Offset Y",
    blur: "Blur",
    spread: "Spread",
    color: "Color",
    opacity: "Opacity",
    inset: "Inset",
    cssOutput: "CSS output",
    copy: "Copy CSS",
    copied: "CSS copied to clipboard.",
    presets: "Presets",
    presetApplied: "Preset applied.",
    maxShadows: "Maximum 5 shadows.",
    minShadows: "Keep at least 1 shadow.",
    emptyNothing: "Nothing to copy yet.",
    error: "Something went wrong.",
  },
  id: {
    title: "Box Shadow Generator",
    description:
      "Racik satu atau banyak box-shadow CSS berlapis dengan slider, kontrol opacity, dan mode inset — pratinjau langsung, preset, dan CSS siap salin.",
    preview: "Pratinjau langsung",
    shadows: "Shadow",
    addShadow: "Tambah shadow",
    removeShadow: "Hapus shadow",
    moveUp: "Pindah ke atas",
    moveDown: "Pindah ke bawah",
    offsetX: "Offset X",
    offsetY: "Offset Y",
    blur: "Blur",
    spread: "Spread",
    color: "Warna",
    opacity: "Opacity",
    inset: "Inset",
    cssOutput: "Output CSS",
    copy: "Salin CSS",
    copied: "CSS disalin ke clipboard.",
    presets: "Preset",
    presetApplied: "Preset diterapkan.",
    maxShadows: "Maksimal 5 shadow.",
    minShadows: "Pertahankan minimal 1 shadow.",
    emptyNothing: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do multiple shadows work?",
      a: "Shadows are comma-separated and painted front-to-back: the first shadow in the list renders on top. Use the up/down buttons to reorder layers.",
    },
    id: {
      q: "Bagaimana cara kerja banyak shadow?",
      a: "Shadow dipisahkan koma dan digambar depan-ke-belakang: shadow pertama di daftar tampil paling atas. Pakai tombol atas/bawah untuk menyusun ulang lapisan.",
    },
  },
  {
    en: {
      q: "What does the inset toggle do?",
      a: "Inset flips the shadow inside the box instead of outside — useful for pressed or inner-glow effects.",
    },
    id: {
      q: "Apa fungsi toggle inset?",
      a: "Inset membalik shadow ke dalam kotak, bukan ke luar — cocok untuk efek pressed atau inner-glow.",
    },
  },
  {
    en: {
      q: "Is my design uploaded anywhere?",
      a: "No. Everything is computed live in your browser from slider values. Nothing leaves your device.",
    },
    id: {
      q: "Apakah desainku diunggah ke mana pun?",
      a: "Tidak. Semua dihitung langsung di browser dari nilai slider. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const INITIAL: Omit<Shadow, "id"> = {
  ox: 0,
  oy: 8,
  blur: 24,
  spread: 0,
  color: "#000000",
  opacity: 25,
  inset: false,
};

const PRESETS: ShadowPreset[] = [
  {
    name: "Subtle",
    shadow: { ox: 0, oy: 1, blur: 3, spread: 0, color: "#000000", opacity: 12, inset: false },
  },
  {
    name: "Elevated",
    shadow: { ox: 0, oy: 12, blur: 32, spread: -4, color: "#000000", opacity: 22, inset: false },
  },
  {
    name: "Dramatic",
    shadow: { ox: 0, oy: 24, blur: 64, spread: -8, color: "#4f46e5", opacity: 40, inset: false },
  },
  {
    name: "Inner",
    shadow: { ox: 0, oy: 2, blur: 8, spread: 0, color: "#000000", opacity: 18, inset: true },
  },
];

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, opacity / 100));
  const safe = (n: number): number => (Number.isNaN(n) ? 0 : n);
  return `rgba(${safe(r)}, ${safe(g)}, ${safe(b)}, ${a.toFixed(2)})`;
}

function shadowToCss(sh: Shadow): string {
  const inset = sh.inset ? "inset " : "";
  return `${inset}${sh.ox}px ${sh.oy}px ${sh.blur}px ${sh.spread}px ${hexToRgba(sh.color, sh.opacity)}`;
}

function buildCss(shadows: Shadow[]): string {
  return `box-shadow: ${shadows.map(shadowToCss).join(",\n  ")};`;
}

function SliderRow(props: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={props.id}
        className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
      >
        {props.label}:{" "}
        <span className="font-mono">
          {props.value}
          {props.unit}
        </span>
      </label>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => {
          try {
            props.onChange(Number(e.target.value));
          } catch {
            // ignore
          }
        }}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

export default function BoxShadowPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const idRef = useRef(100);

  const [shadows, setShadows] = useState<Shadow[]>([{ id: 1, ...INITIAL }]);
  const [selectedId, setSelectedId] = useState(1);

  const css = buildCss(shadows);
  const boxShadowValue = shadows.map(shadowToCss).join(", ");
  const selected = shadows.find((sh) => sh.id === selectedId) ?? shadows[0];

  const patchSelected = (patch: Partial<Shadow>): void => {
    try {
      if (!selected) return;
      const id = selected.id;
      setShadows((prev) => prev.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)));
    } catch {
      toast.error(s.error);
    }
  };

  const handleAdd = (): void => {
    try {
      if (shadows.length >= 5) {
        toast.error(s.maxShadows);
        return;
      }
      idRef.current += 1;
      const id = idRef.current;
      setShadows((prev) => [...prev, { id, ...INITIAL }]);
      setSelectedId(id);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRemove = (id: number): void => {
    try {
      if (shadows.length <= 1) {
        toast.error(s.minShadows);
        return;
      }
      setShadows((prev) => {
        const next = prev.filter((sh) => sh.id !== id);
        if (id === selectedId && next.length > 0) setSelectedId(next[0].id);
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleMove = (id: number, dir: -1 | 1): void => {
    try {
      setShadows((prev) => {
        const i = prev.findIndex((sh) => sh.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        const tmp = next[i];
        next[i] = next[j];
        next[j] = tmp;
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handlePreset = (p: ShadowPreset): void => {
    try {
      idRef.current += 1;
      const id = idRef.current;
      setShadows([{ id, ...p.shadow }]);
      setSelectedId(id);
      toast.success(s.presetApplied);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Layers"
      slug="design/box-shadow"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.preview}
            </p>
            <div className="flex items-center justify-center rounded-xl bg-zinc-100 p-10 dark:bg-zinc-950 sm:p-14">
              <div
                className="h-28 w-40 rounded-xl bg-white dark:bg-zinc-800 sm:h-32 sm:w-52"
                style={{ boxShadow: boxShadowValue }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.shadows}{" "}
                <Badge variant="secondary" className="font-mono">
                  {shadows.length}/5
                </Badge>
              </p>
              <Button size="sm" variant="outline" onClick={handleAdd}>
                <Plus aria-hidden />
                {s.addShadow}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {shadows.map((sh, i) => (
                <div key={sh.id} className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={sh.id === selected?.id ? "default" : "secondary"}
                    onClick={() => {
                      try {
                        setSelectedId(sh.id);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                  >
                    #{i + 1}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMove(sh.id, -1)}
                    aria-label={s.moveUp}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMove(sh.id, 1)}
                    aria-label={s.moveDown}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(sh.id)}
                    disabled={shadows.length <= 1}
                    aria-label={s.removeShadow}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
            </div>

            {selected && (
              <div className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <SliderRow
                  id="bs-ox"
                  label={s.offsetX}
                  value={selected.ox}
                  unit="px"
                  min={-50}
                  max={50}
                  onChange={(v) => patchSelected({ ox: v })}
                />
                <SliderRow
                  id="bs-oy"
                  label={s.offsetY}
                  value={selected.oy}
                  unit="px"
                  min={-50}
                  max={50}
                  onChange={(v) => patchSelected({ oy: v })}
                />
                <SliderRow
                  id="bs-blur"
                  label={s.blur}
                  value={selected.blur}
                  unit="px"
                  min={0}
                  max={100}
                  onChange={(v) => patchSelected({ blur: v })}
                />
                <SliderRow
                  id="bs-spread"
                  label={s.spread}
                  value={selected.spread}
                  unit="px"
                  min={-50}
                  max={50}
                  onChange={(v) => patchSelected({ spread: v })}
                />
                <SliderRow
                  id="bs-opacity"
                  label={s.opacity}
                  value={selected.opacity}
                  unit="%"
                  min={0}
                  max={100}
                  onChange={(v) => patchSelected({ opacity: v })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="bs-color"
                      className="text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      {s.color}
                    </label>
                    <input
                      id="bs-color"
                      type="color"
                      value={selected.color}
                      onChange={(e) => patchSelected({ color: e.target.value })}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-700"
                    />
                    <code className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                      {hexToRgba(selected.color, selected.opacity)}
                    </code>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selected.inset}
                      onChange={(e) => patchSelected({ inset: e.target.checked })}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    {s.inset}
                  </label>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.presets}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className="rounded-xl border border-zinc-200 p-3 text-left transition hover:border-indigo-400 dark:border-zinc-700 dark:hover:border-indigo-500"
                  >
                    <span className="flex h-14 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-950">
                      <span
                        aria-hidden
                        className="h-8 w-12 rounded-md bg-white dark:bg-zinc-800"
                        style={{ boxShadow: shadowToCss({ id: 0, ...p.shadow }) }}
                      />
                    </span>
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
              <CopyButton
                text={css}
                label={s.copy}
                copiedMessage={s.copied}
                emptyMessage={s.emptyNothing}
                errorMessage={s.error}
                className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
