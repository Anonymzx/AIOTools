"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eraser, LayoutGrid } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    preview: string;
    tapHint: string;
    columns: string;
    rows: string;
    gap: string;
    trackSize: string;
    trackFlex: string;
    trackMin: string;
    trackFixed: string;
    trackAuto: string;
    items: string;
    fillAll: string;
    clear: string;
    cssOutput: string;
    copy: string;
    copied: string;
    emptyNothing: string;
    error: string;
  }
> = {
  en: {
    title: "CSS Grid Generator",
    description:
      "Design a CSS grid visually: columns, rows, gaps, and track sizes. Click cells to add or remove items, then copy the CSS.",
    preview: "Interactive preview — click a cell to add or remove an item",
    tapHint: "Tap cells on mobile to toggle items.",
    columns: "Columns",
    rows: "Rows",
    gap: "Gap",
    trackSize: "Track size",
    trackFlex: "Flexible (1fr)",
    trackMin: "Min 120px (minmax)",
    trackFixed: "Fixed 160px",
    trackAuto: "Content (auto)",
    items: "Items",
    fillAll: "Fill all",
    clear: "Clear",
    cssOutput: "CSS output",
    copy: "Copy CSS",
    copied: "CSS copied to clipboard.",
    emptyNothing: "Nothing to copy yet.",
    error: "Something went wrong.",
  },
  id: {
    title: "CSS Grid Generator",
    description:
      "Rancang CSS grid secara visual: kolom, baris, gap, dan ukuran track. Klik sel untuk menambah/menghapus item, lalu salin CSS-nya.",
    preview: "Pratinjau interaktif — klik sel untuk menambah atau menghapus item",
    tapHint: "Ketuk sel di HP untuk toggle item.",
    columns: "Kolom",
    rows: "Baris",
    gap: "Gap",
    trackSize: "Ukuran track",
    trackFlex: "Fleksibel (1fr)",
    trackMin: "Min 120px (minmax)",
    trackFixed: "Tetap 160px",
    trackAuto: "Konten (auto)",
    items: "Item",
    fillAll: "Isi semua",
    clear: "Bersihkan",
    cssOutput: "Output CSS",
    copy: "Salin CSS",
    copied: "CSS disalin ke clipboard.",
    emptyNothing: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What CSS does this tool generate?",
      a: "A display: grid container with repeat() track definitions for columns and rows plus a gap value. Item placement uses automatic flow, so the markup order matches the filled cells.",
    },
    id: {
      q: "CSS apa yang dihasilkan tool ini?",
      a: "Kontainer display: grid dengan definisi track repeat() untuk kolom dan baris plus nilai gap. Penempatan item memakai alur otomatis, jadi urutan markup mengikuti sel yang terisi.",
    },
  },
  {
    en: {
      q: "What do the track size options mean?",
      a: "Flexible (1fr) shares space equally; Min 120px keeps tracks at least 120px wide; Fixed uses 160px tracks; Content sizes tracks to their content.",
    },
    id: {
      q: "Apa arti opsi ukuran track?",
      a: "Fleksibel (1fr) membagi ruang sama rata; Min 120px menjaga track minimal 120px; Tetap memakai track 160px; Konten menyesuaikan ukuran isi.",
    },
  },
  {
    en: {
      q: "Is my layout uploaded anywhere?",
      a: "No. The grid, cells, and CSS are computed entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah layout-ku diunggah ke mana pun?",
      a: "Tidak. Grid, sel, dan CSS dihitung sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

type TrackId = "flex" | "min" | "fixed" | "auto";

function trackTemplate(track: TrackId, n: number): string {
  if (track === "min") return `repeat(${n}, minmax(120px, 1fr))`;
  if (track === "fixed") return `repeat(${n}, 160px)`;
  if (track === "auto") return `repeat(${n}, auto)`;
  return `repeat(${n}, 1fr)`;
}

function resizeCells(prev: boolean[], total: number): boolean[] {
  const next: boolean[] = [];
  for (let i = 0; i < total; i++) next.push(prev[i] ?? true);
  return next;
}

export default function GridPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [gap, setGap] = useState(16);
  const [track, setTrack] = useState<TrackId>("flex");
  const [cells, setCells] = useState<boolean[]>([
    true, true, true, true, true, true, true, true, true,
  ]);

  const total = cols * rows;
  const itemCount = cells.filter(Boolean).length;

  const css =
    `display: grid;\n` +
    `grid-template-columns: ${trackTemplate(track, cols)};\n` +
    `grid-template-rows: ${trackTemplate(track, rows)};\n` +
    `gap: ${gap}px;`;

  const handleCols = (v: number): void => {
    try {
      setCols(v);
      setCells((prev) => resizeCells(prev, v * rows));
    } catch {
      toast.error(s.error);
    }
  };

  const handleRows = (v: number): void => {
    try {
      setRows(v);
      setCells((prev) => resizeCells(prev, cols * v));
    } catch {
      toast.error(s.error);
    }
  };

  const toggleCell = (i: number): void => {
    try {
      setCells((prev) => prev.map((c, j) => (j === i ? !c : c)));
    } catch {
      toast.error(s.error);
    }
  };

  const handleFill = (): void => {
    try {
      setCells(resizeCells([], total).map(() => true));
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setCells(resizeCells([], total).map(() => false));
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="LayoutGrid"
      slug="design/grid"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.preview}
              </p>
              <Badge variant="secondary" className="font-mono">
                {s.items}: {itemCount}/{total}
              </Badge>
            </div>
            <div
              className="min-h-[16rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950"
              style={{
                display: "grid",
                gridTemplateColumns: trackTemplate(track, cols),
                gridTemplateRows: trackTemplate(track, rows),
                gap: `${gap}px`,
              }}
            >
              {cells.map((filled, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCell(i)}
                  aria-pressed={filled}
                  aria-label={`Cell ${i + 1}`}
                  className={cn(
                    "flex min-h-[3.5rem] items-center justify-center rounded-lg font-mono text-sm transition",
                    filled
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-dashed border-zinc-300 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:hover:border-indigo-500",
                  )}
                >
                  {filled ? i + 1 : "+"}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.tapHint}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="grid-cols"
                  className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.columns}: <span className="font-mono">{cols}</span>
                </label>
                <input
                  id="grid-cols"
                  type="range"
                  min={1}
                  max={12}
                  value={cols}
                  onChange={(e) => handleCols(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="grid-rows"
                  className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.rows}: <span className="font-mono">{rows}</span>
                </label>
                <input
                  id="grid-rows"
                  type="range"
                  min={1}
                  max={8}
                  value={rows}
                  onChange={(e) => handleRows(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="grid-gap"
                  className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.gap}: <span className="font-mono">{gap}px</span>
                </label>
                <input
                  id="grid-gap"
                  type="range"
                  min={0}
                  max={48}
                  value={gap}
                  onChange={(e) => {
                    try {
                      setGap(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="grid-track"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                {s.trackSize}
              </label>
              <select
                id="grid-track"
                value={track}
                onChange={(e) => {
                  try {
                    setTrack(e.target.value as TrackId);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 sm:w-auto"
              >
                <option value="flex">{s.trackFlex}</option>
                <option value="min">{s.trackMin}</option>
                <option value="fixed">{s.trackFixed}</option>
                <option value="auto">{s.trackAuto}</option>
              </select>
              <div className="flex gap-2 sm:ml-auto">
                <Button size="sm" variant="secondary" onClick={handleFill}>
                  <LayoutGrid aria-hidden />
                  {s.fillAll}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  <Eraser aria-hidden />
                  {s.clear}
                </Button>
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
