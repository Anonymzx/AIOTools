"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownUp, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useToolClear, useToolPaste } from "@/hooks/useToolClipboard";

type CaseMode = "upper" | "lower" | "title" | "camel" | "snake";

const TEXTAREA_CLS =
  "min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    emptyHint: string;
    chars: string;
    words: string;
    lines: string;
    copy: string;
    clear: string;
    copied: string;
    copyFailed: string;
    cleared: string;
    nothingToCopy: string;
    modeUpper: string;
    modeLower: string;
    modeTitle: string;
    modeCamel: string;
    modeSnake: string;
  }
> = {
  en: {
    title: "Case Converter",
    description:
      "Convert text between UPPER CASE, lower case, Title Case, camelCase, and snake_case instantly — 100% in your browser.",
    inputLabel: "Input",
    inputPlaceholder: "Type or paste your text here…",
    outputLabel: "Output preview",
    emptyHint: "Start typing above — the converted result will appear here live.",
    chars: "chars",
    words: "words",
    lines: "lines",
    copy: "Copy",
    clear: "Clear",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    cleared: "Input cleared.",
    nothingToCopy: "Nothing to copy yet.",
    modeUpper: "UPPER",
    modeLower: "lower",
    modeTitle: "Title Case",
    modeCamel: "camelCase",
    modeSnake: "snake_case",
  },
  id: {
    title: "Pengubah Huruf (Case Converter)",
    description:
      "Ubah teks ke UPPER CASE, lower case, Title Case, camelCase, dan snake_case secara instan — 100% di browser Anda.",
    inputLabel: "Masukan",
    inputPlaceholder: "Ketik atau tempel teks Anda di sini…",
    outputLabel: "Pratinjau hasil",
    emptyHint: "Mulai mengetik di atas — hasil konversi akan muncul di sini secara langsung.",
    chars: "karakter",
    words: "kata",
    lines: "baris",
    copy: "Salin",
    clear: "Hapus",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    cleared: "Masukan dihapus.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    modeUpper: "UPPER",
    modeLower: "lower",
    modeTitle: "Title Case",
    modeCamel: "camelCase",
    modeSnake: "snake_case",
  },
};

function collapseLine(line: string): string {
  return line.replace(/[ \t\u00a0]+/g, " ").trim();
}

function normalizeLines(input: string): string[] {
  return input.split("\n").map(collapseLine);
}

function toUpper(input: string): string {
  return normalizeLines(input).join("\n").trim().toUpperCase();
}

function toLower(input: string): string {
  return normalizeLines(input).join("\n").trim().toLowerCase();
}

function toTitle(input: string): string {
  const lines = normalizeLines(input);
  return lines
    .join("\n")
    .trim()
    .split("\n")
    .map((line) =>
      line
        .split(" ")
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" "),
    )
    .join("\n");
}

function wordsOf(line: string): string[] {
  return line
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(" ")
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 0);
}

function toCamel(input: string): string {
  const lines = normalizeLines(input).join("\n").trim().split("\n");
  return lines
    .map((line) => {
      const words = wordsOf(line);
      if (words.length === 0) return "";
      const [first, ...rest] = words;
      return (
        (first ?? "") + rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")
      );
    })
    .join("\n");
}

function toSnake(input: string): string {
  const lines = normalizeLines(input).join("\n").trim().split("\n");
  return lines.map((line) => wordsOf(line).join("_")).join("\n");
}

function convert(input: string, mode: CaseMode): string {
  if (input.trim() === "") return "";
  switch (mode) {
    case "upper":
      return toUpper(input);
    case "lower":
      return toLower(input);
    case "title":
      return toTitle(input);
    case "camel":
      return toCamel(input);
    case "snake":
      return toSnake(input);
  }
}

export default function CaseConverterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");

  useToolPaste(setInput);
  useToolClear(() => setInput(""));

  const output = useMemo(() => {
    try {
      return convert(input, mode);
    } catch {
      return "";
    }
  }, [input, mode]);

  const stats = useMemo(() => {
    try {
      if (output.trim() === "") return { chars: 0, words: 0, lines: 0 };
      const chars = output.length;
      const words = output.trim().split(/\s+/).filter(Boolean).length;
      const lines = output.split("\n").length;
      return { chars, words, lines };
    } catch {
      return { chars: 0, words: 0, lines: 0 };
    }
  }, [output]);

  function handleClear(): void {
    try {
      setInput("");
      toast.success(s.cleared);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  const modes: { key: CaseMode; label: string }[] = [
    { key: "upper", label: s.modeUpper },
    { key: "lower", label: s.modeLower },
    { key: "title", label: s.modeTitle },
    { key: "camel", label: s.modeCamel },
    { key: "snake", label: s.modeSnake },
  ];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="CaseSensitive"
      slug="case-converter"
      faq={[
        {
          en: {
            q: "What does each case style do?",
            a: "UPPER makes everything uppercase, lower makes everything lowercase, Title Case capitalizes each word, camelCase joins words with each new word capitalized (firstWord + CapitalizedRest), and snake_case joins lowercase words with underscores.",
          },
          id: {
            q: "Apa fungsi setiap gaya huruf?",
            a: "UPPER membuat semua huruf kapital, lower membuat semua huruf kecil, Title Case mengapitalkan setiap kata, camelCase menggabung kata tanpa spasi dengan huruf awal tiap kata berikutnya kapital, dan snake_case menggabung kata huruf kecil dengan garis bawah.",
          },
        },
        {
          en: {
            q: "Is my text uploaded to a server?",
            a: "No. All conversion runs locally in your browser with live preview — your text never leaves your device.",
          },
          id: {
            q: "Apakah teks saya diunggah ke server?",
            a: "Tidak. Semua konversi berjalan lokal di browser Anda dengan pratinjau langsung — teks tidak pernah keluar dari perangkat Anda.",
          },
        },
        {
          en: {
            q: "Does it preserve line breaks?",
            a: "Yes. Extra spaces inside each line are collapsed and empty edges trimmed, but line breaks are preserved so multi-line text keeps its structure.",
          },
          id: {
            q: "Apakah jeda baris tetap dipertahankan?",
            a: "Ya. Spasi berlebih di setiap baris dirapikan dan tepi kosong dipangkas, tetapi jeda baris dipertahankan sehingga teks multi-baris tetap terstruktur.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <label
              htmlFor="case-input"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {s.inputLabel}
            </label>
            <textarea
              id="case-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={s.inputPlaceholder}
              rows={6}
              className={cn(TEXTAREA_CLS, "font-mono")}
              aria-label={s.inputLabel}
            />
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
              role="group"
              aria-label={s.outputLabel}
            >
              {modes.map((m) => (
                <Button
                  key={m.key}
                  type="button"
                  variant={mode === m.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode(m.key)}
                  className="font-mono"
                >
                  <ArrowDownUp className="h-3.5 w-3.5" aria-hidden />
                  {m.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.outputLabel}
              </span>
              <div className="flex flex-wrap gap-1.5" aria-label="stats">
                <Badge variant="secondary">
                  {stats.chars} {s.chars}
                </Badge>
                <Badge variant="secondary">
                  {stats.words} {s.words}
                </Badge>
                <Badge variant="secondary">
                  {stats.lines} {s.lines}
                </Badge>
              </div>
            </div>
            {output === "" ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {s.emptyHint}
              </p>
            ) : (
              <pre
                className="max-h-[320px] min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                aria-live="polite"
              >
                {output}
              </pre>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <CopyButton
                text={output}
                label={s.copy}
                variant="default"
                copiedMessage={s.copied}
                emptyMessage={s.nothingToCopy}
                errorMessage={s.copyFailed}
              />
              <Button type="button" variant="outline" onClick={handleClear} className="flex-1">
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
