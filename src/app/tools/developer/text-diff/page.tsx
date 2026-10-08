"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser, GitCompare, Minus, Plus } from "lucide-react";
import { diffLines, type Change } from "diff";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MAX_LINES = 2000;

const SAMPLE_A = `AIOTools is fast.
It runs in your browser.
Nothing is uploaded.
Dark mode looks great.`;

const SAMPLE_B = `AIOTools is very fast.
It runs in your browser.
Everything stays private.
Dark mode looks great.`;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    textA: string;
    textB: string;
    placeholderA: string;
    placeholderB: string;
    compare: string;
    sample: string;
    clear: string;
    changedOnly: string;
    added: string;
    removed: string;
    unchanged: string;
    noDiff: string;
    notCompared: string;
    tooLarge: string;
    emptyInput: string;
    compared: string;
    error: string;
    lines: string;
  }
> = {
  en: {
    title: "Text Diff Checker",
    description:
      "Compare two texts line by line with red/green highlighting and change stats. Everything runs locally in your browser.",
    textA: "Text A (original)",
    textB: "Text B (modified)",
    placeholderA: "Paste the original text here…",
    placeholderB: "Paste the modified text here…",
    compare: "Compare",
    sample: "Sample",
    clear: "Clear",
    changedOnly: "Show changed lines only",
    added: "added",
    removed: "removed",
    unchanged: "unchanged",
    noDiff: "Texts are identical — no differences found.",
    notCompared: "Enter both texts and press Compare…",
    tooLarge: "Too large: each side is capped at 2000 lines. Split the input and try again.",
    emptyInput: "Enter both texts first.",
    compared: "Diff computed.",
    error: "Something went wrong.",
    lines: "lines",
  },
  id: {
    title: "Pembanding Teks (Diff)",
    description:
      "Bandingkan dua teks baris per baris dengan sorotan merah/hijau dan statistik perubahan. Semuanya berjalan lokal di browser.",
    textA: "Teks A (asli)",
    textB: "Teks B (diubah)",
    placeholderA: "Tempel teks asli di sini…",
    placeholderB: "Tempel teks yang diubah di sini…",
    compare: "Bandingkan",
    sample: "Contoh",
    clear: "Bersihkan",
    changedOnly: "Tampilkan baris berubah saja",
    added: "ditambah",
    removed: "dihapus",
    unchanged: "tak berubah",
    noDiff: "Teks identik — tidak ada perbedaan.",
    notCompared: "Isi kedua teks lalu tekan Bandingkan…",
    tooLarge: "Terlalu besar: tiap sisi dibatasi 2000 baris. Bagi input lalu coba lagi.",
    emptyInput: "Isi kedua teks terlebih dahulu.",
    compared: "Diff berhasil dihitung.",
    error: "Terjadi kesalahan.",
    lines: "baris",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does the diff work?",
      a: "The tool splits both texts into lines and runs a line-level diff (Myers algorithm via the diff package). Added lines show green with +, removed lines show red with −, unchanged lines stay neutral for context.",
    },
    id: {
      q: "Bagaimana cara kerja diff?",
      a: "Tool membagi kedua teks menjadi baris lalu menjalankan diff tingkat baris (algoritma Myers via paket diff). Baris tambahan tampil hijau dengan +, baris terhapus tampil merah dengan −, baris tak berubah netral sebagai konteks.",
    },
  },
  {
    en: {
      q: "Why is there a 2000-line limit per side?",
      a: "Diffing is quadratic-ish work in the browser; beyond 2000 lines a single compare could freeze the tab. Split large files into chunks and compare section by section.",
    },
    id: {
      q: "Kenapa ada batas 2000 baris per sisi?",
      a: "Diffing membebani browser secara kuadratis; di atas 2000 baris satu perbandingan bisa membekukan tab. Bagi file besar menjadi potongan dan bandingkan per bagian.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. The diff runs entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Diff berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const TEXTAREA_CLS =
  "mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function TextDiffPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [compared, setCompared] = useState(false);
  const [changedOnly, setChangedOnly] = useState(false);

  const parts: Change[] = useMemo(() => {
    try {
      if (!compared) return [];
      return diffLines(textA, textB);
    } catch {
      return [];
    }
  }, [compared, textA, textB]);

  const stats = useMemo(() => {
    try {
      let added = 0;
      let removed = 0;
      let unchanged = 0;
      for (const p of parts) {
        const n = p.count ?? 0;
        if (p.added) added += n;
        else if (p.removed) removed += n;
        else unchanged += n;
      }
      return { added, removed, unchanged };
    } catch {
      return { added: 0, removed: 0, unchanged: 0 };
    }
  }, [parts]);

  const visible = useMemo(() => {
    try {
      if (!changedOnly) return parts;
      return parts.filter((p) => {
        try {
          return p.added === true || p.removed === true;
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }, [parts, changedOnly]);

  const hasChange = stats.added > 0 || stats.removed > 0;

  const handleCompare = (): void => {
    try {
      if (textA.length === 0 && textB.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const linesA = textA.split("\n").length;
      const linesB = textB.split("\n").length;
      if (linesA > MAX_LINES || linesB > MAX_LINES) {
        toast.error(s.tooLarge);
        return;
      }
      setCompared(true);
      toast.success(s.compared);
    } catch {
      toast.error(s.error);
    }
  };

  const handleSample = (): void => {
    try {
      setTextA(SAMPLE_A);
      setTextB(SAMPLE_B);
      setCompared(false);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setTextA("");
      setTextB("");
      setCompared(false);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="GitCompare" slug="developer/text-diff" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="diff-a" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.textA}
                  </label>
                  <Badge variant="secondary" className="font-mono">
                    {textA.length === 0 ? 0 : textA.split("\n").length} {s.lines}
                  </Badge>
                </div>
                <textarea
                  id="diff-a"
                  value={textA}
                  onChange={(e) => {
                    try {
                      setTextA(e.target.value);
                      setCompared(false);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.placeholderA}
                  rows={8}
                  spellCheck={false}
                  className={TEXTAREA_CLS}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="diff-b" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.textB}
                  </label>
                  <Badge variant="secondary" className="font-mono">
                    {textB.length === 0 ? 0 : textB.split("\n").length} {s.lines}
                  </Badge>
                </div>
                <textarea
                  id="diff-b"
                  value={textB}
                  onChange={(e) => {
                    try {
                      setTextB(e.target.value);
                      setCompared(false);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.placeholderB}
                  rows={8}
                  spellCheck={false}
                  className={TEXTAREA_CLS}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleCompare}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <GitCompare aria-hidden />
                {s.compare}
              </Button>
              <Button variant="secondary" onClick={handleSample}>
                {s.sample}
              </Button>
              <Button variant="ghost" onClick={handleClear}>
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-emerald-700 dark:text-emerald-300">
                <Plus className="mr-1 h-3 w-3" aria-hidden />
                {stats.added} {s.added}
              </Badge>
              <Badge variant="secondary" className="font-mono text-red-700 dark:text-red-300">
                <Minus className="mr-1 h-3 w-3" aria-hidden />
                {stats.removed} {s.removed}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {stats.unchanged} {s.unchanged}
              </Badge>
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={changedOnly}
                  onChange={(e) => {
                    try {
                      setChangedOnly(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.changedOnly}
              </label>
            </div>
            {!compared ? (
              <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">{s.notCompared}</p>
            ) : !hasChange ? (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                {s.noDiff}
              </p>
            ) : (
              <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200 font-mono text-xs leading-relaxed dark:border-zinc-700">
                {visible.map((p, i) => {
                  try {
                    const lines = p.value.endsWith("\n") ? p.value.slice(0, -1).split("\n") : p.value.split("\n");
                    const cls = p.added
                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      : p.removed
                        ? "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
                        : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400";
                    const sign = p.added ? "+" : p.removed ? "−" : " ";
                    return (
                      <div key={i}>
                        {lines.map((line, j) => (
                          <div key={j} className={`flex gap-2 overflow-x-auto whitespace-pre px-3 py-0.5 ${cls}`}>
                            <span className="w-4 shrink-0 select-none text-center opacity-60">{sign}</span>
                            <span className="break-all">{line === "" ? " " : line}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
