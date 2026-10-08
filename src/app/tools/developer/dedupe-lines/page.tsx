"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Download, Eraser, ListChecks } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function dedupe(
  text: string,
  opts: { ignoreCase: boolean; keep: "first" | "last"; removeBlank: boolean },
): { lines: string[]; total: number; removed: number } {
  try {
    const raw = text.split("\n");
    const total = raw.length;
    const items = opts.removeBlank ? raw.filter((l) => l.trim() !== "") : raw;
    const seen = new Set<string>();
    const key = (l: string): string => (opts.ignoreCase ? l.toLowerCase() : l);
    let unique: string[];
    if (opts.keep === "last") {
      const rev: string[] = [];
      for (let i = items.length - 1; i >= 0; i--) {
        const line = items[i] ?? "";
        const k = key(line);
        if (!seen.has(k)) {
          seen.add(k);
          rev.push(line);
        }
      }
      unique = rev.reverse();
    } else {
      unique = [];
      for (const line of items) {
        const k = key(line);
        if (!seen.has(k)) {
          seen.add(k);
          unique.push(line);
        }
      }
    }
    return { lines: unique, total, removed: total - unique.length };
  } catch {
    return { lines: [], total: 0, removed: 0 };
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
    ignoreCase: string;
    keep: string;
    keepFirst: string;
    keepLast: string;
    removeBlank: string;
    process: string;
    copy: string;
    download: string;
    clear: string;
    total: string;
    removed: string;
    kept: string;
    emptyInput: string;
    done: string;
    copied: string;
    downloaded: string;
    error: string;
  }
> = {
  en: {
    title: "Remove Duplicate Lines",
    description:
      "Delete repeated lines with case, order, and blank-line control — plus live stats. Everything runs locally in your browser.",
    inputLabel: "Input",
    inputPlaceholder: "Paste lines here, one per line…",
    outputLabel: "Deduplicated output",
    ignoreCase: "Case-insensitive (Apple = apple)",
    keep: "Keep",
    keepFirst: "First occurrence",
    keepLast: "Last occurrence",
    removeBlank: "Remove blank lines",
    process: "Remove duplicates",
    copy: "Copy result",
    download: "Download .txt",
    clear: "Clear",
    total: "total",
    removed: "removed",
    kept: "kept",
    emptyInput: "Enter some lines first.",
    done: "Duplicates removed.",
    copied: "Copied to clipboard.",
    downloaded: "File downloaded.",
    error: "Something went wrong.",
  },
  id: {
    title: "Hapus Baris Duplikat",
    description:
      "Hapus baris berulang dengan kontrol huruf, urutan, dan baris kosong — plus statistik langsung. Semuanya berjalan lokal di browser.",
    inputLabel: "Masukan",
    inputPlaceholder: "Tempel baris di sini, satu per baris…",
    outputLabel: "Keluaran tanpa duplikat",
    ignoreCase: "Abaikan huruf besar-kecil (Apple = apple)",
    keep: "Pertahankan",
    keepFirst: "Kemunculan pertama",
    keepLast: "Kemunculan terakhir",
    removeBlank: "Hapus baris kosong",
    process: "Hapus duplikat",
    copy: "Salin hasil",
    download: "Unduh .txt",
    clear: "Bersihkan",
    total: "total",
    removed: "dihapus",
    kept: "tersisa",
    emptyInput: "Isi beberapa baris terlebih dahulu.",
    done: "Duplikat dihapus.",
    copied: "Disalin ke clipboard.",
    downloaded: "File diunduh.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Does keep-first vs keep-last matter?",
      a: "Yes when duplicates differ in surrounding context or you care about order. Keep-first preserves the original top-down order; keep-last keeps the final occurrence, useful when the last entry holds the newest value.",
    },
    id: {
      q: "Apakah keep-first vs keep-last berpengaruh?",
      a: "Ya bila duplikat berada dalam konteks berbeda atau urutan penting. Keep-first menjaga urutan asli dari atas; keep-last menyimpan kemunculan terakhir, berguna bila entri terakhir memegang nilai terbaru.",
    },
  },
  {
    en: {
      q: "Whitespace differences: same line or not?",
      a: "Lines are compared exactly, so trailing spaces make two lines different. Trim your input first if spacing is inconsistent; case-insensitivity only affects letter casing, not whitespace.",
    },
    id: {
      q: "Perbedaan spasi: dihitung sama atau tidak?",
      a: "Baris dibandingkan persis apa adanya, jadi spasi di ujung membuat dua baris berbeda. Rapikan input dulu bila spasi tidak konsisten; mode abaikan-huruf hanya memengaruhi kapitalisasi, bukan spasi.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Deduplication is a pure in-browser operation. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Dedup adalah operasi murni di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const TEXTAREA_CLS =
  "mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function DedupeLinesPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [input, setInput] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [keep, setKeep] = useState("first");
  const [removeBlank, setRemoveBlank] = useState(false);
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState({ total: 0, removed: 0 });

  const liveStats = useMemo(() => dedupe(input, { ignoreCase, keep: keep === "last" ? "last" : "first", removeBlank }), [input, ignoreCase, keep, removeBlank]);
  const liveOutput = useMemo(() => liveStats.lines.join("\n"), [liveStats]);

  const handleProcess = (): void => {
    try {
      if (input.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      setOutput(liveOutput);
      setStats({ total: liveStats.total, removed: liveStats.removed });
      toast.success(s.done);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      const text = output !== "" ? output : liveOutput;
      if (text.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "deduped.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }, 4000);
      }
      toast.success(s.downloaded);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="ListChecks" slug="developer/dedupe-lines" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="dedupe-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.inputLabel}
                </label>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {liveStats.total} {s.total}
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    −{liveStats.removed} {s.removed}
                  </Badge>
                </div>
              </div>
              <textarea
                id="dedupe-in"
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
                className={TEXTAREA_CLS}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  checked={removeBlank}
                  onChange={(e) => {
                    try {
                      setRemoveBlank(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.removeBlank}
              </label>
              <div>
                <label htmlFor="dedupe-keep" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.keep}
                </label>
                <select
                  id="dedupe-keep"
                  value={keep}
                  onChange={(e) => {
                    try {
                      setKeep(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="first">{s.keepFirst}</option>
                  <option value="last">{s.keepLast}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleProcess}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <ArrowRight aria-hidden />
                {s.process}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  try {
                    setInput("");
                    setOutput("");
                    setStats({ total: 0, removed: 0 });
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

        {(output !== "" || liveOutput !== "") && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <ListChecks className="h-4 w-4" aria-hidden />
                  {s.outputLabel}
                </h2>
                <Badge variant="secondary" className="font-mono">
                  {stats.total > 0 ? stats.total : liveStats.total} {s.total}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  −{stats.total > 0 ? stats.removed : liveStats.removed} {s.removed}
                </Badge>
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {output !== "" ? output : liveOutput}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton
                  text={output !== "" ? output : liveOutput}
                  label={s.copy}
                  variant="secondary"
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyInput}
                  errorMessage={s.error}
                />
                <Button onClick={handleDownload} variant="default">
                  <Download aria-hidden />
                  {s.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
