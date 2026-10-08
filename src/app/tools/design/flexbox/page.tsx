"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type Direction = "row" | "row-reverse" | "column" | "column-reverse";
type Wrap = "nowrap" | "wrap" | "wrap-reverse";
type Justify =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";
type Align = "stretch" | "flex-start" | "center" | "flex-end" | "baseline";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    preview: string;
    direction: string;
    wrap: string;
    justify: string;
    align: string;
    gap: string;
    items: string;
    cssOutput: string;
    copy: string;
    copied: string;
    emptyNothing: string;
    error: string;
  }
> = {
  en: {
    title: "Flexbox Generator",
    description:
      "Learn and build CSS flexbox layouts visually: direction, wrap, alignment, and gap — with a live preview and copy-ready CSS.",
    preview: "Live preview",
    direction: "Direction",
    wrap: "Wrap",
    justify: "Justify content",
    align: "Align items",
    gap: "Gap",
    items: "Items",
    cssOutput: "CSS output",
    copy: "Copy CSS",
    copied: "CSS copied to clipboard.",
    emptyNothing: "Nothing to copy yet.",
    error: "Something went wrong.",
  },
  id: {
    title: "Flexbox Generator",
    description:
      "Pelajari dan buat layout flexbox CSS secara visual: direction, wrap, alignment, dan gap — dengan pratinjau langsung dan CSS siap salin.",
    preview: "Pratinjau langsung",
    direction: "Direction",
    wrap: "Wrap",
    justify: "Justify content",
    align: "Align items",
    gap: "Gap",
    items: "Item",
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
      q: "What is the difference between justify-content and align-items?",
      a: "Justify-content aligns items along the main axis (the flex direction), while align-items aligns them along the cross axis. Try switching direction to row vs column and watch the axes swap.",
    },
    id: {
      q: "Apa beda justify-content dan align-items?",
      a: "Justify-content menyejajarkan item di sepanjang main axis (arah flex), sedangkan align-items di cross axis. Coba ganti direction row vs column dan perhatikan sumbunya bertukar.",
    },
  },
  {
    en: {
      q: "When should I use wrap?",
      a: "Use wrap when items should flow onto new lines instead of shrinking on narrow screens — essential for responsive rows of cards or chips.",
    },
    id: {
      q: "Kapan harus memakai wrap?",
      a: "Pakai wrap saat item harus turun ke baris baru alih-alih menyusut di layar sempit — penting untuk baris kartu atau chip yang responsif.",
    },
  },
  {
    en: {
      q: "Is my layout uploaded anywhere?",
      a: "No. The preview and CSS are computed entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah layout-ku diunggah ke mana pun?",
      a: "Tidak. Pratinjau dan CSS dihitung sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const SELECT_CLS =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function SelectField(props: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <label
        htmlFor={props.id}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
      >
        {props.label}
      </label>
      <select
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={SELECT_CLS}
      >
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FlexboxPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [direction, setDirection] = useState<Direction>("row");
  const [wrap, setWrap] = useState<Wrap>("wrap");
  const [justify, setJustify] = useState<Justify>("center");
  const [align, setAlign] = useState<Align>("center");
  const [gap, setGap] = useState(12);
  const [count, setCount] = useState(5);

  const css =
    `display: flex;\n` +
    `flex-direction: ${direction};\n` +
    `flex-wrap: ${wrap};\n` +
    `justify-content: ${justify};\n` +
    `align-items: ${align};\n` +
    `gap: ${gap}px;`;

  const items: number[] = [];
  for (let i = 0; i < count; i++) items.push(i + 1);

  const safeSet = (fn: () => void): void => {
    try {
      fn();
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="AlignLeft"
      slug="design/flexbox"
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
                {s.items}: {count}
              </Badge>
            </div>
            <div className="min-h-[16rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
              <div
                style={{
                  display: "flex",
                  flexDirection: direction,
                  flexWrap: wrap,
                  justifyContent: justify,
                  alignItems: align,
                  gap: `${gap}px`,
                  minHeight: "13rem",
                }}
              >
                {items.map((n) => (
                  <div
                    key={n}
                    className="flex min-h-[3.5rem] min-w-[3.5rem] items-center justify-center rounded-lg bg-indigo-600 px-4 font-mono text-sm font-semibold text-white"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                id="flex-dir"
                label={s.direction}
                value={direction}
                options={["row", "row-reverse", "column", "column-reverse"]}
                onChange={(v) => safeSet(() => setDirection(v as Direction))}
              />
              <SelectField
                id="flex-wrap"
                label={s.wrap}
                value={wrap}
                options={["nowrap", "wrap", "wrap-reverse"]}
                onChange={(v) => safeSet(() => setWrap(v as Wrap))}
              />
              <SelectField
                id="flex-justify"
                label={s.justify}
                value={justify}
                options={[
                  "flex-start",
                  "center",
                  "flex-end",
                  "space-between",
                  "space-around",
                  "space-evenly",
                ]}
                onChange={(v) => safeSet(() => setJustify(v as Justify))}
              />
              <SelectField
                id="flex-align"
                label={s.align}
                value={align}
                options={["stretch", "flex-start", "center", "flex-end", "baseline"]}
                onChange={(v) => safeSet(() => setAlign(v as Align))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="flex-gap"
                  className="w-24 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.gap}: <span className="font-mono">{gap}px</span>
                </label>
                <input
                  id="flex-gap"
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
              <div className="flex items-center gap-2">
                <label
                  htmlFor="flex-count"
                  className="w-24 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.items}: <span className="font-mono">{count}</span>
                </label>
                <input
                  id="flex-count"
                  type="range"
                  min={1}
                  max={12}
                  value={count}
                  onChange={(e) => {
                    try {
                      setCount(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
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
