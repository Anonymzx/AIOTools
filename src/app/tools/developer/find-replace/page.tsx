"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser, Replace, Search, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MAX_COUNT = 5000;
const MAX_MARKS = 300;
const PREVIEW_CHARS = 20000;

function escapeRegExp(text: string): string {
  try {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  } catch {
    return "";
  }
}

function buildRegex(find: string, opts: { regex: boolean; ignoreCase: boolean; wholeWord: boolean }): { re: RegExp | null; error: string | null } {
  try {
    if (find.length === 0) return { re: null, error: null };
    const source = opts.regex ? find : escapeRegExp(find);
    const wrapped = opts.wholeWord ? `\\b(?:${source})\\b` : source;
    const flags = opts.ignoreCase ? "gi" : "g";
    try {
      return { re: new RegExp(wrapped, flags), error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "invalid pattern";
      return { re: null, error: msg };
    }
  } catch {
    return { re: null, error: "error" };
  }
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    findLabel: string;
    findPlaceholder: string;
    replaceLabel: string;
    replacePlaceholder: string;
    useRegex: string;
    ignoreCase: string;
    wholeWord: string;
    previewTitle: string;
    resultTitle: string;
    matches: string;
    truncated: string;
    noMatch: string;
    typeToSearch: string;
    invalidRegex: string;
    replaceAll: string;
    copy: string;
    clear: string;
    replaced: string;
    emptyFind: string;
    copied: string;
    emptyInput: string;
    error: string;
  }
> = {
  en: {
    title: "Find and Replace",
    description:
      "Search and replace with live match counts, highlighted preview, and regex + whole-word support. Everything runs locally in your browser.",
    inputLabel: "Text",
    inputPlaceholder: "Paste your text here…",
    findLabel: "Find",
    findPlaceholder: "Text or pattern to find…",
    replaceLabel: "Replace with",
    replacePlaceholder: "Replacement text ($1, $2 work in regex mode)…",
    useRegex: "Regex",
    ignoreCase: "Ignore case",
    wholeWord: "Whole word",
    previewTitle: "Matches preview",
    resultTitle: "Replace-all result",
    matches: "matches",
    truncated: "preview truncated — refine your query",
    noMatch: "No matches found.",
    typeToSearch: "Type a search term to see matches…",
    invalidRegex: "Invalid regex: ",
    replaceAll: "Replace all",
    copy: "Copy result",
    clear: "Clear",
    replaced: "All occurrences replaced.",
    emptyFind: "Enter a find pattern first.",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    error: "Something went wrong.",
  },
  id: {
    title: "Cari dan Ganti",
    description:
      "Cari dan ganti dengan jumlah match langsung, pratinjau tersorot, dan dukungan regex + whole-word. Semuanya berjalan lokal di browser.",
    inputLabel: "Teks",
    inputPlaceholder: "Tempel teksmu di sini…",
    findLabel: "Cari",
    findPlaceholder: "Teks atau pola yang dicari…",
    replaceLabel: "Ganti dengan",
    replacePlaceholder: "Teks pengganti ($1, $2 berlaku di mode regex)…",
    useRegex: "Regex",
    ignoreCase: "Abaikan huruf",
    wholeWord: "Kata utuh",
    previewTitle: "Pratinjau kecocokan",
    resultTitle: "Hasil replace-all",
    matches: "kecocokan",
    truncated: "pratinjau dipotong — persempit kuerimu",
    noMatch: "Tidak ada kecocokan.",
    typeToSearch: "Ketik kata pencarian untuk melihat kecocokan…",
    invalidRegex: "Regex tidak valid: ",
    replaceAll: "Ganti semua",
    copy: "Salin hasil",
    clear: "Bersihkan",
    replaced: "Semua kemunculan diganti.",
    emptyFind: "Isi pola pencarian terlebih dahulu.",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do regex capture groups work in replacement?",
      a: "Enable Regex mode, then use (parentheses) in the pattern and $1, $2 in the replacement — e.g. find (\\d+)-(\\d+) and replace $2/$1 to swap number pairs. $$ inserts a literal dollar sign.",
    },
    id: {
      q: "Bagaimana capture group regex bekerja di pengganti?",
      a: "Aktifkan mode Regex, lalu pakai (kurung) di pola dan $1, $2 di pengganti — cth. cari (\\d+)-(\\d+) dan ganti $2/$1 untuk menukar pasangan angka. $$ menyisipkan tanda dolar literal.",
    },
  },
  {
    en: {
      q: "Why do I get an 'Invalid regex' error?",
      a: "The pattern has unbalanced brackets, a stray backslash, or an invalid quantifier. The inline message shows the exact engine error. Switch off Regex mode to search the text literally instead.",
    },
    id: {
      q: "Kenapa muncul error 'Invalid regex'?",
      a: "Pola memiliki kurung tak seimbang, backslash menyimpang, atau quantifier tidak valid. Pesan inline menunjukkan error persis dari engine. Matikan mode Regex untuk mencari teks secara literal.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Searching and replacing run entirely in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Pencarian dan penggantian berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const INPUT_CLS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export default function FindReplacePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [result, setResult] = useState("");

  const built = useMemo(
    () => buildRegex(find, { regex: useRegex, ignoreCase, wholeWord }),
    [find, useRegex, ignoreCase, wholeWord],
  );

  const matchInfo = useMemo((): { count: number; capped: boolean } => {
    try {
      if (!built.re || text.length === 0) return { count: 0, capped: false };
      const re = new RegExp(built.re.source, built.re.flags);
      let count = 0;
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while (count < MAX_COUNT + 1) {
        try {
          m = re.exec(text);
        } catch {
          break;
        }
        if (!m) break;
        count++;
        if (m[0].length === 0) re.lastIndex++;
        if (re.lastIndex > text.length) break;
      }
      return { count: Math.min(count, MAX_COUNT), capped: count > MAX_COUNT };
    } catch {
      return { count: 0, capped: false };
    }
  }, [built.re, text]);

  const highlighted = useMemo((): React.ReactNode[] => {
    try {
      if (!built.re || text.length === 0 || find.length === 0) return [];
      const slice = text.length > PREVIEW_CHARS ? text.slice(0, PREVIEW_CHARS) : text;
      const re = new RegExp(built.re.source, built.re.flags);
      const nodes: React.ReactNode[] = [];
      let last = 0;
      let marks = 0;
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while (marks < MAX_MARKS) {
        try {
          m = re.exec(slice);
        } catch {
          break;
        }
        if (!m || m.index === undefined) break;
        const start = m.index;
        const matched = m[0];
        if (start > last) nodes.push(slice.slice(last, start));
        nodes.push(
          <mark key={nodes.length} className="rounded bg-yellow-300 px-0.5 text-zinc-900 dark:bg-yellow-500 dark:text-zinc-950">
            {matched === "" ? "∅" : matched}
          </mark>,
        );
        marks++;
        last = start + matched.length;
        if (matched.length === 0) re.lastIndex++;
        if (re.lastIndex > slice.length) break;
      }
      if (last < slice.length) nodes.push(slice.slice(last));
      return nodes;
    } catch {
      return [];
    }
  }, [built.re, text, find]);

  const handleReplaceAll = (): void => {
    try {
      if (!built.re) {
        if (built.error) toast.error(`${s.invalidRegex}${built.error}`);
        else toast.error(s.emptyFind);
        return;
      }
      if (text.length === 0) {
        toast.error(s.emptyFind);
        return;
      }
      let out: string;
      try {
        const re = new RegExp(built.re.source, built.re.flags);
        out = text.replace(re, replace);
      } catch {
        toast.error(s.error);
        return;
      }
      setResult(out);
      toast.success(s.replaced);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Replace" slug="developer/find-replace" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label htmlFor="fr-text" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.inputLabel}
              </label>
              <textarea
                id="fr-text"
                value={text}
                onChange={(e) => {
                  try {
                    setText(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder={s.inputPlaceholder}
                rows={6}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="fr-find" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.findLabel}
                </label>
                <input
                  id="fr-find"
                  type="text"
                  value={find}
                  onChange={(e) => {
                    try {
                      setFind(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.findPlaceholder}
                  spellCheck={false}
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="fr-replace" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.replaceLabel}
                </label>
                <input
                  id="fr-replace"
                  type="text"
                  value={replace}
                  onChange={(e) => {
                    try {
                      setReplace(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.replacePlaceholder}
                  spellCheck={false}
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => {
                    try {
                      setUseRegex(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.useRegex}
              </label>
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
                  checked={wholeWord}
                  onChange={(e) => {
                    try {
                      setWholeWord(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                {s.wholeWord}
              </label>
              <Badge variant="secondary" className="ml-auto font-mono">
                <Search className="mr-1 h-3 w-3" aria-hidden />
                {matchInfo.count}{matchInfo.capped ? "+" : ""} {s.matches}
              </Badge>
            </div>
            {built.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                <p className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {s.invalidRegex}
                  <span className="font-mono text-xs">{built.error}</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleReplaceAll}
                disabled={!built.re}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <Replace aria-hidden />
                {s.replaceAll}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  try {
                    setText("");
                    setFind("");
                    setReplace("");
                    setResult("");
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

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.previewTitle}</h2>
            {find.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.typeToSearch}</p>
            ) : built.error ? (
              <p className="font-mono text-xs text-red-600 dark:text-red-400">
                {s.invalidRegex}
                {built.error}
              </p>
            ) : matchInfo.count === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.noMatch}</p>
            ) : (
              <>
                <div className="max-h-56 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-words whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                  {highlighted}
                  {text.length > PREVIEW_CHARS && <span className="text-zinc-400">…</span>}
                </div>
                {(matchInfo.capped || text.length > PREVIEW_CHARS) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{s.truncated}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {result !== "" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.resultTitle}</h2>
              <pre className="max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {result}
              </pre>
              <CopyButton
                text={result}
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
