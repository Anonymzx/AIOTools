"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Copy, RotateCcw, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useToolClear, useToolPaste } from "@/hooks/useToolClipboard";

const MONO_INPUT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    patternLabel: string;
    patternPlaceholder: string;
    testLabel: string;
    testPlaceholder: string;
    flagsLabel: string;
    commonLabel: string;
    commonHint: string;
    resultLabel: string;
    matchCount: (n: number) => string;
    noMatches: string;
    emptyPattern: string;
    emptyTest: string;
    invalidTitle: string;
    groupsLabel: string;
    matchLabel: (i: number) => string;
    groupLabel: (i: number) => string;
    fullMatch: string;
    indexLabel: string;
    copyMatches: string;
    copied: string;
    copyFailed: string;
    nothingToCopy: string;
    clear: string;
    cleared: string;
    sample: string;
    sampleLoaded: string;
    truncated: (n: number) => string;
    common: { label: string; pattern: string; flags: string }[];
  }
> = {
  en: {
    title: "Regex Tester",
    description:
      "Test regular expressions live with match highlighting and capture groups — 100% client-side in your browser.",
    descriptionId:
      "Uji regex langsung dengan highlight kecocokan dan grup tangkap — 100% di sisi klien, di browser Anda.",
    patternLabel: "Regex pattern",
    patternPlaceholder: "e.g. (\\w+)@(\\w+\\.\\w+)",
    testLabel: "Test string",
    testPlaceholder: "Paste or type the text to test against…",
    flagsLabel: "Flags",
    commonLabel: "Common Patterns",
    commonHint: "Click a pattern to load it.",
    resultLabel: "Live result",
    matchCount: (n) => `${n} match${n === 1 ? "" : "es"}`,
    noMatches: "No matches found.",
    emptyPattern: "Enter a pattern above — matches will highlight here.",
    emptyTest: "Enter a test string above to see matches.",
    invalidTitle: "Invalid regular expression",
    groupsLabel: "Capture groups",
    matchLabel: (i) => `Match ${i + 1}`,
    groupLabel: (i) => `Group ${i + 1}`,
    fullMatch: "Full match",
    indexLabel: "Index",
    copyMatches: "Copy matches",
    copied: "Matches copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "No matches to copy yet.",
    clear: "Clear",
    cleared: "Inputs cleared.",
    sample: "Sample",
    sampleLoaded: "Sample loaded.",
    truncated: (n) => `Showing first ${n} matches (output capped for performance).`,
    common: [
      { label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", flags: "gi" },
      { label: "URL", pattern: "https?://[^\\s/$.?#].[^\\s]*", flags: "gi" },
      { label: "Phone (ID mobile)", pattern: "(\\+62|0)8\\d{8,11}", flags: "g" },
      { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
      { label: "Date (YYYY-MM-DD)", pattern: "\\b\\d{4}-\\d{2}-\\d{2}\\b", flags: "g" },
      { label: "Hex color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g" },
    ],
  },
  id: {
    title: "Penguji Regex (Regex Tester)",
    description:
      "Uji regex langsung dengan highlight kecocokan dan grup tangkap — 100% di sisi klien, di browser Anda.",
    descriptionId:
      "Uji regex langsung dengan highlight kecocokan dan grup tangkap — 100% di sisi klien, di browser Anda.",
    patternLabel: "Pola regex",
    patternPlaceholder: "mis. (\\w+)@(\\w+\\.\\w+)",
    testLabel: "String uji",
    testPlaceholder: "Tempel atau ketik teks untuk diuji…",
    flagsLabel: "Flag",
    commonLabel: "Pola Umum",
    commonHint: "Klik pola untuk memuatnya.",
    resultLabel: "Hasil langsung",
    matchCount: (n) => `${n} kecocokan`,
    noMatches: "Tidak ada kecocokan.",
    emptyPattern: "Masukkan pola di atas — kecocokan akan disorot di sini.",
    emptyTest: "Masukkan string uji di atas untuk melihat kecocokan.",
    invalidTitle: "Ekspresi reguler tidak valid",
    groupsLabel: "Grup tangkap",
    matchLabel: (i) => `Cocok ${i + 1}`,
    groupLabel: (i) => `Grup ${i + 1}`,
    fullMatch: "Kecocokan penuh",
    indexLabel: "Indeks",
    copyMatches: "Salin kecocokan",
    copied: "Kecocokan disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada kecocokan untuk disalin.",
    clear: "Hapus",
    cleared: "Masukan dihapus.",
    sample: "Contoh",
    sampleLoaded: "Contoh dimuat.",
    truncated: (n) => `Menampilkan ${n} kecocokan pertama (dibatasi demi performa).`,
    common: [
      { label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", flags: "gi" },
      { label: "URL", pattern: "https?://[^\\s/$.?#].[^\\s]*", flags: "gi" },
      { label: "Telepon (HP Indonesia)", pattern: "(\\+62|0)8\\d{8,11}", flags: "g" },
      { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
      { label: "Tanggal (YYYY-MM-DD)", pattern: "\\b\\d{4}-\\d{2}-\\d{2}\\b", flags: "g" },
      { label: "Warna hex", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g" },
    ],
  },
};

interface RegexMatch {
  full: string;
  index: number;
  groups: (string | undefined)[];
}

const MAX_MATCHES = 200;
const FLAG_KEYS = ["g", "i", "m"] as const;

export default function RegexTesterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [testString, setTestString] = useState("");

  useToolPaste(setTestString);
  useToolClear(() => {
    setPattern("");
    setTestString("");
    setFlags({ g: true, i: false, m: false });
  });

  const flagsStr = FLAG_KEYS.filter((f) => flags[f]).join("");

  const { error, matches, truncated } = useMemo(() => {
    try {
      if (pattern === "") return { error: null as string | null, matches: [] as RegexMatch[], truncated: false };
      const re = new RegExp(pattern, flagsStr);
      if (testString === "") return { error: null, matches: [], truncated: false };
      // matchAll requires /g; fall back to repeated exec when flag missing.
      const global = new RegExp(pattern, flagsStr.includes("g") ? flagsStr : flagsStr + "g");
      const out: RegexMatch[] = [];
      let capped = false;
      try {
        // exec loop mirrors String.matchAll semantics without needing downlevelIteration.
        let m: RegExpExecArray | null;
        global.lastIndex = 0;
        while ((m = global.exec(testString)) !== null) {
          if (out.length >= MAX_MATCHES) {
            capped = true;
            break;
          }
          out.push({
            full: m[0] ?? "",
            index: m.index ?? 0,
            groups: Array.prototype.slice.call(m, 1),
          });
          if (m[0] === "") global.lastIndex += 1; // avoid infinite loop on empty matches
          if (!global.global) break;
        }
      } catch {
        // exec edge — fall through with what we have.
      }
      void re;
      return { error: null, matches: out, truncated: capped };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        matches: [],
        truncated: false,
      };
    }
  }, [pattern, flagsStr, testString]);

  const highlighted = useMemo(() => {
    try {
      if (matches.length === 0 || testString === "") return null;
      const nodes: React.ReactNode[] = [];
      let cursor = 0;
      matches.forEach((m, i) => {
        if (m.index > cursor) nodes.push(<span key={`t-${i}`}>{testString.slice(cursor, m.index)}</span>);
        nodes.push(
          <mark
            key={`m-${i}`}
            className="rounded-sm bg-indigo-200 px-0.5 text-indigo-950 dark:bg-indigo-500/40 dark:text-indigo-50"
          >
            {m.full === "" ? "∅" : m.full}
          </mark>,
        );
        cursor = m.index + m.full.length;
      });
      if (cursor < testString.length) nodes.push(<span key="t-end">{testString.slice(cursor)}</span>);
      return nodes;
    } catch {
      return null;
    }
  }, [matches, testString]);

  function toggleFlag(f: (typeof FLAG_KEYS)[number]): void {
    try {
      setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
    } catch {
      // ignore state errors
    }
  }

  function loadCommon(p: string, f: string): void {
    try {
      setPattern(p);
      setFlags({ g: f.includes("g"), i: f.includes("i"), m: f.includes("m") });
    } catch {
      // ignore state errors
    }
  }

  async function handleCopyMatches(): Promise<void> {
    try {
      if (matches.length === 0) {
        toast.info(s.nothingToCopy);
        return;
      }
      await navigator.clipboard.writeText(matches.map((m) => m.full).join("\n"));
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleClear(): void {
    try {
      setPattern("");
      setTestString("");
      setFlags({ g: true, i: false, m: false });
      toast.success(s.cleared);
    } catch {
      // ignore state errors
    }
  }

  function handleSample(): void {
    try {
      setPattern("(\\w+)@([\\w-]+\\.[\\w.]+)");
      setFlags({ g: true, i: true, m: false });
      setTestString("Contact us at support@aiotools.dev or admin@example.co.id for help.");
      toast.success(s.sampleLoaded);
    } catch {
      // ignore state errors
    }
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="Regex"
      slug="developer/regex-tester"
      faq={[
        {
          en: {
            q: "Why is my pattern marked invalid?",
            a: "JavaScript RegExp throws on syntax errors such as unbalanced brackets, stray backslashes, or a bad quantifier (e.g. *+). Fix the highlighted error message — invalid patterns never crash the page, they just show the error panel.",
          },
          id: {
            q: "Mengapa pola saya ditandai tidak valid?",
            a: "RegExp JavaScript melempar error untuk kesalahan sintaks seperti kurung tak seimbang, backslash liar, atau quantifier yang salah (mis. *+). Perbaiki pesan error yang disorot — pola tidak valid tidak akan merusak halaman, hanya menampilkan panel error.",
          },
        },
        {
          en: {
            q: "What do the g, i, and m flags do?",
            a: "g (global) finds all matches instead of stopping at the first; i makes matching case-insensitive; m makes ^ and $ match the start/end of each line instead of the whole string.",
          },
          id: {
            q: "Apa fungsi flag g, i, dan m?",
            a: "g (global) menemukan semua kecocokan, bukan berhenti di yang pertama; i membuat pencocokan tidak peka huruf besar-kecil; m membuat ^ dan $ cocok dengan awal/akhir tiap baris, bukan seluruh string.",
          },
        },
        {
          en: {
            q: "How do I read the capture groups list?",
            a: "Each parenthesized (...) section is one group, numbered from 1 left to right. If a group did not participate in a match (e.g. an unmatched optional group), it shows — instead of a value.",
          },
          id: {
            q: "Bagaimana cara membaca daftar grup tangkap?",
            a: "Setiap bagian dalam kurung (...) adalah satu grup, dinomori dari 1 dari kiri ke kanan. Jika grup tidak ikut dalam kecocokan (mis. grup opsional yang tidak cocok), ia menampilkan — sebagai ganti nilai.",
          },
        },
        {
          en: {
            q: "Is my test data uploaded anywhere?",
            a: "No. The pattern compiles with new RegExp and all matching runs locally in your browser. Nothing leaves your device.",
          },
          id: {
            q: "Apakah data uji saya diunggah ke mana pun?",
            a: "Tidak. Pola dikompilasi dengan new RegExp dan semua pencocokan berjalan lokal di browser Anda. Tidak ada yang meninggalkan perangkat Anda.",
          },
        },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="regex-pattern"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.patternLabel}
                </label>
                <input
                  id="regex-pattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder={s.patternPlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  className={`${MONO_INPUT_CLS} mt-1.5`}
                  aria-label={s.patternLabel}
                  aria-invalid={error !== null}
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.flagsLabel}
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {FLAG_KEYS.map((f) => (
                    <label
                      key={f}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors",
                        flags[f]
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
                          : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={flags[f]}
                        onChange={() => toggleFlag(f)}
                        className="h-4 w-4 accent-indigo-600"
                        aria-label={`flag ${f}`}
                      />
                      {f}
                    </label>
                  ))}
                  <span className="inline-flex items-center font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    /{pattern || "…"}/{flagsStr || "…"}
                  </span>
                </div>
              </fieldset>
              <div>
                <label
                  htmlFor="regex-test"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.testLabel}
                </label>
                <textarea
                  id="regex-test"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder={s.testPlaceholder}
                  rows={5}
                  spellCheck={false}
                  className={`${MONO_INPUT_CLS} mt-1.5 min-h-[120px]`}
                  aria-label={s.testLabel}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleSample}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {s.sample}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={pattern === "" && testString === ""}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {s.clear}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.resultLabel}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {error === null && pattern !== "" && (
                    <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-600/90">
                      {s.matchCount(matches.length)}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMatches}
                    disabled={matches.length === 0}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {s.copyMatches}
                  </Button>
                </div>
              </div>

              {error !== null ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-semibold">{s.invalidTitle}</p>
                    <p className="mt-0.5 break-words font-mono text-xs">{error}</p>
                  </div>
                </div>
              ) : pattern === "" ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  {s.emptyPattern}
                </p>
              ) : testString === "" ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  {s.emptyTest}
                </p>
              ) : matches.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  {s.noMatches}
                </p>
              ) : (
                <>
                  <div
                    aria-live="polite"
                    className="max-h-[240px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-sm leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {highlighted}
                  </div>
                  {truncated && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {s.truncated(MAX_MATCHES)}
                    </p>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {s.groupsLabel}
                    </h3>
                    {matches.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="default">{s.matchLabel(i)}</Badge>
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {s.indexLabel}: {m.index}
                          </span>
                        </div>
                        <p className="mt-2 break-all font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                          <span className="text-zinc-400 dark:text-zinc-500">{s.fullMatch}: </span>
                          {m.full === "" ? "—" : m.full}
                        </p>
                        {m.groups.length > 0 ? (
                          <ul className="mt-1.5 space-y-1">
                            {m.groups.map((g, gi) => (
                              <li
                                key={gi}
                                className="break-all font-mono text-[13px] text-zinc-600 dark:text-zinc-300"
                              >
                                <span className="text-zinc-400 dark:text-zinc-500">
                                  {s.groupLabel(gi)}:{" "}
                                </span>
                                {g === undefined ? "—" : g === "" ? '""' : g}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0">
          <Card className="lg:sticky lg:top-4">
            <CardContent className="space-y-2.5 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.commonLabel}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.commonHint}</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {s.common.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => loadCommon(c.pattern, c.flags)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
                  >
                    <span className="block truncate">{c.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      /{c.pattern}/{c.flags}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </ToolLayout>
  );
}
