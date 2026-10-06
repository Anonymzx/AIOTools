"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AlertTriangle, CheckCircle2, Download, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useToolClear, useToolPaste } from "@/hooks/useToolClipboard";

const TEXTAREA_CLS =
  "min-h-[180px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const SAMPLE_JSON = `{
  "name": "AIOTools",
  "version": 3,
  "free": true,
  "tags": ["json", "formatter", "tools"],
  "meta": {
    "author": "AIOTools",
    "nested": { "depth": 3 }
  }
}`;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    format: string;
    minify: string;
    copy: string;
    clear: string;
    sample: string;
    download: string;
    formatted: string;
    minified: string;
    sampleLoaded: string;
    cleared: string;
    copied: string;
    copyFailed: string;
    nothingToCopy: string;
    invalidTitle: string;
    invalidGeneric: string;
    emptyHint: string;
    valid: string;
    invalid: string;
    notChecked: string;
    size: string;
    keys: string;
    depth: string;
    downloaded: string;
    downloadFailed: string;
    errorLabel: string;
  }
> = {
  en: {
    title: "JSON Formatter",
    description:
      "Format, minify, validate, and inspect JSON instantly — with syntax highlighting, 100% in your browser.",
    inputLabel: "JSON input",
    inputPlaceholder: 'Paste JSON here, e.g. {"name": "AIOTools"}…',
    outputLabel: "Formatted output",
    format: "Format (2-space)",
    minify: "Minify",
    copy: "Copy",
    clear: "Clear",
    sample: "Sample",
    download: "Download .json",
    formatted: "JSON formatted successfully.",
    minified: "JSON minified successfully.",
    sampleLoaded: "Sample JSON loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    invalidTitle: "Invalid JSON",
    invalidGeneric: "Invalid JSON.",
    emptyHint: "Format or minify your JSON — the highlighted result will appear here.",
    valid: "Valid",
    invalid: "Invalid",
    notChecked: "Not checked",
    size: "size",
    keys: "top-level keys",
    depth: "depth",
    downloaded: "JSON file downloaded.",
    downloadFailed: "Failed to download file.",
    errorLabel: "Error details",
  },
  id: {
    title: "Pemformat JSON (JSON Formatter)",
    description:
      "Format, minify, validasi, dan periksa JSON secara instan — dengan sorotan sintaks, 100% di browser Anda.",
    inputLabel: "Masukan JSON",
    inputPlaceholder: 'Tempel JSON di sini, cth. {"name": "AIOTools"}…',
    outputLabel: "Hasil terformat",
    format: "Format (2-spasi)",
    minify: "Minify",
    copy: "Salin",
    clear: "Hapus",
    sample: "Contoh",
    download: "Unduh .json",
    formatted: "JSON berhasil diformat.",
    minified: "JSON berhasil di-minify.",
    sampleLoaded: "Contoh JSON dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    invalidTitle: "JSON tidak valid",
    invalidGeneric: "JSON tidak valid.",
    emptyHint: "Format atau minify JSON Anda — hasil dengan sorotan akan muncul di sini.",
    valid: "Valid",
    invalid: "Tidak valid",
    notChecked: "Belum diperiksa",
    size: "ukuran",
    keys: "kunci level-atas",
    depth: "kedalaman",
    downloaded: "File JSON diunduh.",
    downloadFailed: "Gagal mengunduh file.",
    errorLabel: "Detail kesalahan",
  },
};

function extractPosition(message: string): string | null {
  try {
    const m = /position (\d+)/i.exec(message);
    return m?.[1] ? `position ${m[1]}` : null;
  } catch {
    return null;
  }
}

function calcDepth(value: unknown, seen = new Set<unknown>()): number {
  if (value === null || typeof value !== "object") return 0;
  if (seen.has(value)) return 0;
  seen.add(value);
  try {
    const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
    if (children.length === 0) return 1;
    let max = 0;
    for (const child of children) {
      max = Math.max(max, calcDepth(child, seen));
    }
    return 1 + max;
  } finally {
    seen.delete(value);
  }
}

function byteSize(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return str.length;
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

export default function JsonFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useToolPaste(setInput);
  useToolClear(() => {
    setInput("");
    setOutput("");
    setError(null);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const stats = useMemo(() => {
    try {
      if (error || output === "") return null;
      const parsed: unknown = JSON.parse(output);
      let keys = 0;
      try {
        if (parsed !== null && typeof parsed === "object") {
          keys = Array.isArray(parsed)
            ? (parsed as unknown[]).length
            : Object.keys(parsed as Record<string, unknown>).length;
        } else {
          keys = 1;
        }
      } catch {
        keys = 0;
      }
      let depth = 0;
      try {
        depth = calcDepth(parsed);
      } catch {
        depth = 0;
      }
      return { size: byteSize(output), keys, depth };
    } catch {
      return null;
    }
  }, [output, error]);

  function runTransform(mode: "format" | "minify"): void {
    try {
      if (input.trim() === "") {
        const msg = s.invalidGeneric;
        setError(msg);
        setOutput("");
        toast.error(`${s.invalidTitle}: ${msg}`);
        return;
      }
      const parsed: unknown = JSON.parse(input);
      const next = mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      setOutput(next);
      setError(null);
      toast.success(mode === "format" ? s.formatted : s.minified);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.invalidGeneric;
      const excerpt = raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
      setError(raw);
      setOutput("");
      toast.error(`${s.invalidTitle}: ${excerpt}`);
    }
  }

  function handleClear(): void {
    try {
      setInput("");
      setOutput("");
      setError(null);
      toast.success(s.cleared);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_JSON);
      setOutput(JSON.stringify(JSON.parse(SAMPLE_JSON), null, 2));
      setError(null);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.invalidGeneric);
    }
  }

  function handleDownload(): void {
    try {
      const text = output !== "" ? output : input;
      if (text.trim() === "") {
        toast.info(s.nothingToCopy);
        return;
      }
      JSON.parse(text);
      const blob = new Blob([output !== "" ? output : text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "formatted.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(s.downloaded);
    } catch (e) {
      if (e instanceof SyntaxError) {
        const raw = e.message;
        setError(raw);
        setOutput("");
        toast.error(`${s.invalidTitle}: ${raw}`);
      } else {
        toast.error(s.downloadFailed);
      }
    }
  }

  const positionHint = error ? extractPosition(error) : null;
  const status: "valid" | "invalid" | "idle" =
    error !== null ? "invalid" : output !== "" ? "valid" : "idle";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Braces"
      slug="json-formatter"
      faq={[
        {
          en: {
            q: "What is the difference between Format and Minify?",
            a: "Format pretty-prints JSON with 2-space indentation for readability. Minify strips all unnecessary whitespace to produce the smallest possible single-line JSON for APIs and storage.",
          },
          id: {
            q: "Apa bedanya Format dan Minify?",
            a: "Format merapikan JSON dengan indentasi 2-spasi agar mudah dibaca. Minify menghapus semua spasi yang tidak perlu untuk menghasilkan JSON satu baris terkecil untuk API dan penyimpanan.",
          },
        },
        {
          en: {
            q: "Why does my JSON fail validation?",
            a: "Common causes are trailing commas, single quotes instead of double quotes, unquoted keys, or comments. The red error panel shows the parser message plus a position hint when available so you can locate the issue.",
          },
          id: {
            q: "Mengapa JSON saya gagal divalidasi?",
            a: "Penyebab umum adalah koma di akhir, tanda kutip tunggal bukan ganda, kunci tanpa kutip, atau komentar. Panel kesalahan merah menampilkan pesan parser plus petunjuk posisi jika tersedia agar mudah menemukan masalahnya.",
          },
        },
        {
          en: {
            q: "Is my JSON data private?",
            a: "Yes. Parsing, formatting, and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah data JSON saya privat?",
            a: "Ya. Penguraian, pemformatan, dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="json-input"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.inputLabel}
              </label>
              {status === "valid" ? (
                <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  {s.valid}
                </Badge>
              ) : status === "invalid" ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {s.invalid}
                </Badge>
              ) : (
                <Badge variant="secondary">{s.notChecked}</Badge>
              )}
            </div>
            <textarea
              id="json-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              placeholder={s.inputPlaceholder}
              rows={8}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className={TEXTAREA_CLS}
              aria-label={s.inputLabel}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button type="button" onClick={() => runTransform("format")}>
                {s.format}
              </Button>
              <Button type="button" variant="secondary" onClick={() => runTransform("minify")}>
                {s.minify}
              </Button>
              <Button type="button" variant="outline" onClick={handleSample}>
                {s.sample}
              </Button>
              <CopyButton
                text={output !== "" ? output : input}
                label={s.copy}
                copiedMessage={s.copied}
                emptyMessage={s.nothingToCopy}
                errorMessage={s.copyFailed}
                className="flex-none"
              />
              <Button type="button" variant="outline" onClick={handleClear}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" aria-hidden />
                {s.download}
              </Button>
            </div>
            {error !== null && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
              >
                <p className="font-semibold">
                  {s.errorLabel}
                  {positionHint ? ` · ${positionHint}` : ""}
                </p>
                <p className="mt-1 break-words font-mono text-xs leading-relaxed">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.outputLabel}
              </span>
              {stats !== null && (
                <div className="flex flex-wrap gap-1.5" aria-label="stats">
                  <Badge variant="secondary">
                    {formatBytes(stats.size)} {s.size}
                  </Badge>
                  <Badge variant="secondary">
                    {stats.keys} {s.keys}
                  </Badge>
                  <Badge variant="secondary">
                    {s.depth}: {stats.depth}
                  </Badge>
                </div>
              )}
            </div>
            {output === "" ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {s.emptyHint}
              </p>
            ) : (
              <div
                className={cn(
                  "overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800",
                  "[&>pre]:!m-0 [&>pre]:max-h-[420px] [&>pre]:!rounded-lg [&>pre]:!text-[13px] [&>pre]:!leading-relaxed",
                )}
              >
                {mounted ? (
                  <SyntaxHighlighter
                    language="json"
                    style={isDark ? oneDark : oneLight}
                    customStyle={{ margin: 0 }}
                    showLineNumbers={false}
                  >
                    {output}
                  </SyntaxHighlighter>
                ) : (
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words bg-zinc-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                    {output}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
