"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownWideNarrow, Eraser } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SortBy = "alpha" | "numeric" | "natural" | "length";
type Direction = "asc" | "desc";

function sortLines(
  text: string,
  opts: { by: SortBy; dir: Direction; ignoreCase: boolean; dedupe: boolean },
): string[] {
  try {
    let lines = text.split("\n");
    if (opts.dedupe) {
      const seen = new Set<string>();
      const uniq: string[] = [];
      for (const l of lines) {
        const k = opts.ignoreCase ? l.toLowerCase() : l;
        if (!seen.has(k)) {
          seen.add(k);
          uniq.push(l);
        }
      }
      lines = uniq;
    }
    const norm = (l: string): string => (opts.ignoreCase ? l.toLowerCase() : l);
    const cmp = (a: string, b: string): number => {
      try {
        if (opts.by === "numeric") {
          const na = parseFloat(a);
          const nb = parseFloat(b);
          const xa = Number.isNaN(na) ? Number.POSITIVE_INFINITY : na;
          const xb = Number.isNaN(nb) ? Number.POSITIVE_INFINITY : nb;
          return xa - xb;
        }
        if (opts.by === "length") return a.length - b.length;
        if (opts.by === "natural") return norm(a).localeCompare(norm(b), undefined, { numeric: true });
        return norm(a) < norm(b) ? -1 : norm(a) > norm(b) ? 1 : 0;
      } catch {
        return 0;
      }
    };
    const sorted = [...lines].sort(cmp);
    if (opts.dir === "desc") sorted.reverse();
    return sorted;
  } catch {
    return [];
  }
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    sortBy: string;
    byAlpha: string;
    byNumeric: string;
    byNatural: string;
    byLength: string;
    direction: string;
    asc: string;
    desc: string;
    ignoreCase: string;
    dedupe: string;
    sort: string;
    copy: string;
    clear: string;
    emptyInput: string;
    done: string;
    copied: string;
    error: string;
    lines: string;
  }
> = {
  en: {
    title: "Sort Lines",
    description:
      "Sort lines alphabetically, numerically, naturally, or by length — ascending or descending, with optional dedupe. Everything runs locally.",
    inputLabel: "Input",
    inputPlaceholder: "Paste lines here, one per line…",
    outputLabel: "Sorted output",
    sortBy: "Sort by",
    byAlpha: "Alphabetical (A–Z)",
    byNumeric: "Numeric (10 < 20)",
    byNatural: "Natural (file2 < file10)",
    byLength: "Length (short first)",
    direction: "Direction",
    asc: "Ascending",
    desc: "Descending",
    ignoreCase: "Case-insensitive",
    dedupe: "Remove duplicates after sort",
    sort: "Sort lines",
    copy: "Copy result",
    clear: "Clear",
    emptyInput: "Enter some lines first.",
    done: "Lines sorted.",
    copied: "Copied to clipboard.",
    error: "Something went wrong.",
    lines: "lines",
  },
  id: {
    title: "Urutkan Baris",
    description:
      "Urutkan baris secara alfabetis, numerik, natural, atau berdasarkan panjang — menaik atau menurun, dengan opsi dedupe. Semuanya berjalan lokal.",
    inputLabel: "Masukan",
    inputPlaceholder: "Tempel baris di sini, satu per baris…",
    outputLabel: "Keluaran terurut",
    sortBy: "Urut berdasarkan",
    byAlpha: "Alfabet (A–Z)",
    byNumeric: "Numerik (10 < 20)",
    byNatural: "Natural (file2 < file10)",
    byLength: "Panjang (pendek dulu)",
    direction: "Arah",
    asc: "Menaik",
    desc: "Menurun",
    ignoreCase: "Abaikan huruf besar-kecil",
    dedupe: "Hapus duplikat setelah urut",
    sort: "Urutkan baris",
    copy: "Salin hasil",
    clear: "Bersihkan",
    emptyInput: "Isi beberapa baris terlebih dahulu.",
    done: "Baris terurut.",
    copied: "Disalin ke clipboard.",
    error: "Terjadi kesalahan.",
    lines: "baris",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Alphabetical vs natural sort — what's the difference?",
      a: "Alphabetical compares character by character, so file10 comes before file2 (because '1' < '2'). Natural sort understands embedded numbers, ordering file2 before file10 — ideal for filenames and versioned lists.",
    },
    id: {
      q: "Bedanya sort alfabet vs natural?",
      a: "Alfabet membandingkan per karakter, sehingga file10 muncul sebelum file2 (karena '1' < '2'). Sort natural memahami angka di dalam teks, mengurutkan file2 sebelum file10 — ideal untuk nama file dan daftar berversi.",
    },
  },
  {
    en: {
      q: "How does numeric sort handle non-numbers?",
      a: "Lines are compared by their leading number (parseFloat). Lines without a number sort after all numeric lines, keeping their relative order. Mixed lists like prices or scores work out of the box.",
    },
    id: {
      q: "Bagaimana sort numerik menangani non-angka?",
      a: "Baris dibandingkan berdasarkan angka di awalnya (parseFloat). Baris tanpa angka diurutkan setelah semua baris numerik dengan urutan relatif tetap. Daftar campuran seperti harga atau skor langsung bekerja.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Sorting is a pure in-browser operation. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Pengurutan adalah operasi murni di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const SELECT_CLS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export default function SortLinesPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [input, setInput] = useState("");
  const [by, setBy] = useState("alpha");
  const [dir, setDir] = useState("asc");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [dedupeAfter, setDedupeAfter] = useState(false);
  const [output, setOutput] = useState("");

  const live = useMemo(
    () =>
      sortLines(input, {
        by: (by === "numeric" || by === "natural" || by === "length" ? by : "alpha") as SortBy,
        dir: dir === "desc" ? "desc" : "asc",
        ignoreCase,
        dedupe: dedupeAfter,
      }),
    [input, by, dir, ignoreCase, dedupeAfter],
  );

  const handleSort = (): void => {
    try {
      if (input.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      setOutput(live.join("\n"));
      toast.success(s.done);
    } catch {
      toast.error(s.error);
    }
  };

  const shown = output !== "" ? output : live.join("\n");
  const lineCount = input.length === 0 ? 0 : input.split("\n").length;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="ArrowDownWideNarrow" slug="developer/sort-lines" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="sort-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.inputLabel}
                </label>
                <Badge variant="secondary" className="font-mono">
                  {lineCount} {s.lines}
                </Badge>
              </div>
              <textarea
                id="sort-in"
                value={input}
                onChange={(e) => {
                  try {
                    setInput(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder={s.inputPlaceholder}
                rows={8}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sort-by" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.sortBy}
                </label>
                <select
                  id="sort-by"
                  value={by}
                  onChange={(e) => {
                    try {
                      setBy(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className={SELECT_CLS}
                >
                  <option value="alpha">{s.byAlpha}</option>
                  <option value="numeric">{s.byNumeric}</option>
                  <option value="natural">{s.byNatural}</option>
                  <option value="length">{s.byLength}</option>
                </select>
              </div>
              <div>
                <label htmlFor="sort-dir" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.direction}
                </label>
                <select
                  id="sort-dir"
                  value={dir}
                  onChange={(e) => {
                    try {
                      setDir(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className={SELECT_CLS}
                >
                  <option value="asc">{s.asc}</option>
                  <option value="desc">{s.desc}</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={ignoreCase}
                  onChange={(e) => {
                    try {
                      setIgnoreCase(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.ignoreCase}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={dedupeAfter}
                  onChange={(e) => {
                    try {
                      setDedupeAfter(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.dedupe}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleSort}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <ArrowDownWideNarrow aria-hidden />
                {s.sort}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  try {
                    setInput("");
                    setOutput("");
                  } catch {
                    toast.error(s.error);
                  }
                }}
              >
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        {shown !== "" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.outputLabel}</h2>
              <pre className="max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {shown}
              </pre>
              <CopyButton
                text={shown}
                label={s.copy}
                variant="secondary"
                copiedMessage={s.copied}
                emptyMessage={s.emptyInput}
                errorMessage={s.error}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
