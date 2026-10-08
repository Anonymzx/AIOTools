"use client";

import { useEffect, useState } from "react";
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

const TEXTAREA_CLS =
  "min-h-[180px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SELECT_CLS =
  "rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const SAMPLE_CSS = `/* Header styles */
.header, .nav {
  background-color: #ffffff;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
    font-size: 14px;
  }
}
`;

type Mode = "beautify" | "minify";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    beautify: string;
    minify: string;
    run: string;
    sample: string;
    clear: string;
    copy: string;
    download: string;
    indentSize: string;
    processed: string;
    sampleLoaded: string;
    cleared: string;
    copied: string;
    copyFailed: string;
    nothingToCopy: string;
    emptyInput: string;
    emptyHint: string;
    valid: string;
    invalid: string;
    notChecked: string;
    before: string;
    after: string;
    ratio: string;
    errorLabel: string;
    downloaded: string;
    downloadFailed: string;
  }
> = {
  en: {
    title: "CSS Formatter",
    description:
      "Minify or beautify CSS instantly — string-aware, comment-safe, 100% in your browser.",
    inputLabel: "CSS input",
    inputPlaceholder: "Paste CSS here, e.g. .card{color:red}…",
    outputLabel: "Result",
    beautify: "Beautify",
    minify: "Minify",
    run: "Format CSS",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy",
    download: "Download .css",
    indentSize: "Indent",
    processed: "CSS processed successfully.",
    sampleLoaded: "Sample CSS loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    emptyInput: "Please paste some CSS first.",
    emptyHint: "Minify or beautify your CSS — the highlighted result will appear here.",
    valid: "Done",
    invalid: "Error",
    notChecked: "Not processed",
    before: "before",
    after: "after",
    ratio: "ratio",
    errorLabel: "Error details",
    downloaded: "CSS file downloaded.",
    downloadFailed: "Failed to download file.",
  },
  id: {
    title: "Pemformat CSS (CSS Formatter)",
    description:
      "Minify atau beautify CSS secara instan — sadar-string, aman-komentar, 100% di browser Anda.",
    inputLabel: "Masukan CSS",
    inputPlaceholder: "Tempel CSS di sini, cth. .card{color:red}…",
    outputLabel: "Hasil",
    beautify: "Beautify",
    minify: "Minify",
    run: "Format CSS",
    sample: "Contoh",
    clear: "Hapus",
    copy: "Salin",
    download: "Unduh .css",
    indentSize: "Indentasi",
    processed: "CSS berhasil diproses.",
    sampleLoaded: "Contoh CSS dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    emptyInput: "Tempel CSS terlebih dahulu.",
    emptyHint: "Minify atau beautify CSS Anda — hasil dengan sorotan akan muncul di sini.",
    valid: "Selesai",
    invalid: "Galat",
    notChecked: "Belum diproses",
    before: "sebelum",
    after: "sesudah",
    ratio: "rasio",
    errorLabel: "Detail kesalahan",
    downloaded: "File CSS diunduh.",
    downloadFailed: "Gagal mengunduh file.",
  },
};

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

const NO_SPACE_NEXT = new Set(["{", "}", ":", ";", ",", ">", "~", "+", "(", ")", "[", "]", "=", "!"]);
const NO_SPACE_PREV = new Set(["{", "}", ":", ";", ",", ">", "~", "+", "(", "[", "=", "!"]);

function minifyCss(src: string): string {
  let out = "";
  let quote: string | null = null;
  let pendingSpace = false;
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i] as string;
    if (quote !== null) {
      if (pendingSpace) pendingSpace = false;
      out += c;
      if (c === "\\" && i + 1 < n) {
        out += src[i + 1] as string;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      if (pendingSpace) {
        const prev = out[out.length - 1];
        if (prev !== undefined && !NO_SPACE_PREV.has(prev)) out += " ";
        pendingSpace = false;
      }
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
      pendingSpace = true;
      i += 1;
      continue;
    }
    if (c === "}") {
      if (out.endsWith(";")) out = out.slice(0, -1);
      pendingSpace = false;
      out += c;
      i += 1;
      continue;
    }
    if (pendingSpace) {
      const prev = out[out.length - 1];
      if (prev !== undefined && out.length > 0 && !NO_SPACE_PREV.has(prev) && !NO_SPACE_NEXT.has(c)) {
        out += " ";
      }
      pendingSpace = false;
    }
    out += c;
    i += 1;
  }
  return out.trim();
}

function beautifyCss(src: string, indentSize: number): string {
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  let current = "";
  let depth = 0;
  let paren = 0;
  let quote: string | null = null;
  let i = 0;
  const n = src.length;

  function pushLine(): void {
    const trimmed = current.trim();
    if (trimmed !== "") lines.push(indent.repeat(Math.max(0, depth)) + trimmed);
    current = "";
  }

  while (i < n) {
    const c = src[i] as string;
    if (quote !== null) {
      current += c;
      if (c === "\\" && i + 1 < n) {
        current += src[i + 1] as string;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      current += c;
      i += 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        comment += src[i] as string;
        i += 1;
      }
      comment += "*/";
      i += 2;
      if (current.trim() !== "") {
        current += ` ${comment}`;
      } else {
        lines.push(indent.repeat(Math.max(0, depth)) + comment);
      }
      continue;
    }
    if (c === "(") {
      paren += 1;
      current += c;
      i += 1;
      continue;
    }
    if (c === ")") {
      paren = Math.max(0, paren - 1);
      current = current.trimEnd() + c;
      i += 1;
      continue;
    }
    if (c === "{") {
      current = current.trim();
      if (current !== "") {
        lines.push(indent.repeat(Math.max(0, depth)) + `${current} {`);
        current = "";
      } else {
        lines.push(indent.repeat(Math.max(0, depth)) + "{");
      }
      depth += 1;
      i += 1;
      continue;
    }
    if (c === "}") {
      const tail = current.trim();
      if (tail !== "") {
        lines.push(indent.repeat(Math.max(0, depth)) + `${tail};`);
        current = "";
      }
      pushLine();
      depth = Math.max(0, depth - 1);
      lines.push(indent.repeat(Math.max(0, depth)) + "}");
      i += 1;
      continue;
    }
    if (c === ";") {
      if (paren === 0) {
        current = current.trim();
        if (current !== "") lines.push(indent.repeat(Math.max(0, depth)) + `${current};`);
        current = "";
      } else {
        current += c;
      }
      i += 1;
      continue;
    }
    if (c === ",") {
      if (paren === 0 && depth === 0) {
        current = current.trim();
        if (current !== "") lines.push(indent.repeat(0) + `${current},`);
        current = "";
      } else {
        current = current.trimEnd() + ", ";
      }
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (current !== "" && !current.endsWith(" ")) current += " ";
      i += 1;
      continue;
    }
    current += c;
    i += 1;
  }
  pushLine();
  return lines.join("\n").replace(/[ \t]+\n/g, "\n").trim();
}

export default function CssFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("beautify");
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  function handleRun(): void {
    try {
      if (input.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        toast.error(s.emptyInput);
        return;
      }
      const next = mode === "minify" ? minifyCss(input) : beautifyCss(input, indentSize);
      setOutput(next);
      setError(null);
      toast.success(s.processed);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      setError(raw);
      setOutput("");
      toast.error(raw.length > 220 ? `${raw.slice(0, 220)}…` : raw);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_CSS);
      setOutput(mode === "minify" ? minifyCss(SAMPLE_CSS) : beautifyCss(SAMPLE_CSS, indentSize));
      setError(null);
      toast.success(s.sampleLoaded);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      toast.error(raw);
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

  function handleDownload(): void {
    try {
      const text = output !== "" ? output : input;
      if (text.trim() === "") {
        toast.info(s.nothingToCopy);
        return;
      }
      const blob = new Blob([text], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "minify" ? "style.min.css" : "style.css";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(s.downloaded);
    } catch {
      toast.error(s.downloadFailed);
    }
  }

  const status: "valid" | "invalid" | "idle" =
    error !== null ? "invalid" : output !== "" ? "valid" : "idle";
  const beforeBytes = input.trim() === "" ? 0 : byteSize(input);
  const afterBytes = output === "" ? 0 : byteSize(output);
  const ratio = beforeBytes > 0 && afterBytes > 0 ? `${Math.round((afterBytes / beforeBytes) * 100)}%` : null;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileCode"
      slug="developer/css-formatter"
      faq={[
        {
          en: {
            q: "What is the difference between Minify and Beautify?",
            a: "Minify strips comments and collapses whitespace into the smallest single-line CSS for production. Beautify expands CSS with brace-aware indentation so rules, media queries, and declarations are easy to read and edit.",
          },
          id: {
            q: "Apa bedanya Minify dan Beautify?",
            a: "Minify menghapus komentar dan menggabungkan spasi menjadi CSS satu baris terkecil untuk produksi. Beautify mengembangkan CSS dengan indentasi sadar-kurung kurawal agar aturan, media query, dan deklarasi mudah dibaca dan disunting.",
          },
        },
        {
          en: {
            q: "Are strings and data URIs kept intact?",
            a: "Yes. Both the minifier and beautifier track single- and double-quoted strings, so content values, URLs, and data URIs are never altered or broken.",
          },
          id: {
            q: "Apakah string dan data URI tetap utuh?",
            a: "Ya. Minifier dan beautifier melacak string kutip tunggal dan ganda, sehingga nilai content, URL, dan data URI tidak pernah diubah atau rusak.",
          },
        },
        {
          en: {
            q: "Is my CSS private?",
            a: "Yes. Minifying, beautifying, and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah CSS saya privat?",
            a: "Ya. Minify, beautify, dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="css-input"
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
              id="css-input"
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div
                className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
                role="group"
                aria-label="mode"
              >
                {(["beautify", "minify"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                    }}
                    aria-pressed={mode === m}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      mode === m
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                  >
                    {m === "beautify" ? s.beautify : s.minify}
                  </button>
                ))}
              </div>
              {mode === "beautify" && (
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {s.indentSize}
                  <select
                    value={indentSize}
                    onChange={(e) => {
                      setIndentSize(Number(e.target.value));
                    }}
                    className={SELECT_CLS}
                    aria-label={s.indentSize}
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                  </select>
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button type="button" onClick={handleRun}>
                {s.run}
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
                <p className="font-semibold">{s.errorLabel}</p>
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
              {output !== "" && (
                <div className="flex flex-wrap gap-1.5" aria-label="stats">
                  <Badge variant="secondary">
                    {formatBytes(beforeBytes)} {s.before}
                  </Badge>
                  <Badge variant="secondary">
                    {formatBytes(afterBytes)} {s.after}
                  </Badge>
                  {ratio !== null && (
                    <Badge variant="secondary">
                      {s.ratio}: {ratio}
                    </Badge>
                  )}
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
                    language="css"
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
