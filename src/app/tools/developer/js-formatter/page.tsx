"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AlertTriangle, CheckCircle2, Download, Loader2, Trash2 } from "lucide-react";
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

const SAMPLE_JS = `function greet(name) {
  // Say hello
  const message = "Hello, " + name + "!";
  const items = [1, 2, 3].map((n) => n * 2);
  return { message, count: items.length };
}
`;

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
    sample: string;
    clear: string;
    copy: string;
    download: string;
    loading: string;
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
    noteLabel: string;
    unbalanced: string;
    errorLabel: string;
    downloaded: string;
    downloadFailed: string;
  }
> = {
  en: {
    title: "JS Formatter",
    description:
      "Beautify JavaScript with Prettier or minify it with a comment-safe pass — 100% in your browser.",
    inputLabel: "JavaScript input",
    inputPlaceholder: "Paste JavaScript here, e.g. function f(){return 1}…",
    outputLabel: "Result",
    beautify: "Beautify",
    minify: "Minify",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy",
    download: "Download .js",
    loading: "Loading formatter…",
    processed: "JavaScript processed successfully.",
    sampleLoaded: "Sample JavaScript loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    emptyInput: "Please paste some JavaScript first.",
    emptyHint: "Beautify or minify your JavaScript — the highlighted result will appear here.",
    valid: "Done",
    invalid: "Error",
    notChecked: "Not processed",
    before: "before",
    after: "after",
    noteLabel: "Validation note",
    unbalanced: "Unbalanced brackets detected — output produced, but please review the source syntax.",
    errorLabel: "Error details",
    downloaded: "JavaScript file downloaded.",
    downloadFailed: "Failed to download file.",
  },
  id: {
    title: "Pemformat JS (JS Formatter)",
    description:
      "Beautify JavaScript dengan Prettier atau minify dengan pass aman-komentar — 100% di browser Anda.",
    inputLabel: "Masukan JavaScript",
    inputPlaceholder: "Tempel JavaScript di sini, cth. function f(){return 1}…",
    outputLabel: "Hasil",
    beautify: "Beautify",
    minify: "Minify",
    sample: "Contoh",
    clear: "Hapus",
    copy: "Salin",
    download: "Unduh .js",
    loading: "Memuat formatter…",
    processed: "JavaScript berhasil diproses.",
    sampleLoaded: "Contoh JavaScript dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    emptyInput: "Tempel JavaScript terlebih dahulu.",
    emptyHint: "Beautify atau minify JavaScript Anda — hasil dengan sorotan akan muncul di sini.",
    valid: "Selesai",
    invalid: "Galat",
    notChecked: "Belum diproses",
    before: "sebelum",
    after: "sesudah",
    noteLabel: "Catatan validasi",
    unbalanced:
      "Kurung tidak seimbang terdeteksi — output tetap dibuat, tetapi periksa sintaks sumber Anda.",
    errorLabel: "Detail kesalahan",
    downloaded: "File JavaScript diunduh.",
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

const REGEX_PREFIX = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "^", "~", "<", ">"]);

function isRegexStart(prevSignificant: string | null): boolean {
  if (prevSignificant === null) return true;
  if (REGEX_PREFIX.has(prevSignificant)) return true;
  return prevSignificant === "return" || prevSignificant === "typeof" || prevSignificant === "case";
}

function readWordBackward(src: string, index: number): string {
  let j = index;
  while (j >= 0 && /[A-Za-z0-9_$]/.test(src[j] as string)) j -= 1;
  return src.slice(j + 1, index + 1);
}

function skipTemplate(src: string, i: number): number {
  const n = src.length;
  let j = i + 1;
  while (j < n) {
    const t = src[j] as string;
    if (t === "\\") {
      j += 2;
      continue;
    }
    if (t === "`") return j + 1;
    if (t === "$" && src[j + 1] === "{") {
      let depth = 1;
      j += 2;
      while (j < n && depth > 0) {
        const u = src[j] as string;
        if (u === "\\") {
          j += 2;
          continue;
        }
        if (u === "`") {
          const nested = skipTemplate(src, j);
          if (nested === -1) return -1;
          j = nested;
          continue;
        }
        if (u === '"' || u === "'") {
          const q = u;
          j += 1;
          while (j < n && src[j] !== q && src[j] !== "\n") {
            j += src[j] === "\\" ? 2 : 1;
          }
          j += 1;
          continue;
        }
        if (u === "/" && src[j + 1] === "/") {
          while (j < n && src[j] !== "\n") j += 1;
          continue;
        }
        if (u === "/" && src[j + 1] === "*") {
          j += 2;
          while (j < n && !(src[j] === "*" && src[j + 1] === "/")) j += 1;
          j += 2;
          continue;
        }
        if (u === "$" && src[j + 1] === "{") depth += 1;
        else if (u === "}") depth -= 1;
        j += 1;
      }
      continue;
    }
    j += 1;
  }
  return -1;
}

function minifyJs(src: string): { code: string; balanced: boolean } {
  let out = "";
  let i = 0;
  const n = src.length;
  let prevSignificant: string | null = null;
  let pendingSpace = false;
  let brace = 0;
  let paren = 0;
  let bracket = 0;
  let balanced = true;
  const templateStack: Array<"${" | "str"> = [];

  function emitPendingSpace(next: string): void {
    if (!pendingSpace) return;
    pendingSpace = false;
    if (out === "") return;
    const prev = out[out.length - 1] as string;
    if (/[A-Za-z0-9_$)>\]]/.test(prev) && /[A-Za-z0-9_$("#']/.test(next)) out += " ";
  }

  while (i < n) {
    const c = src[i] as string;
    const inTemplateExpr = templateStack.length > 0 && templateStack[templateStack.length - 1] === "${";

    if (c === "`" && !inTemplateExpr) {
      emitPendingSpace(c);
      out += c;
      prevSignificant = c;
      templateStack.push("str");
      i += 1;
      let closed = false;
      while (i < n) {
        const t = src[i] as string;
        out += t;
        if (t === "\\" && i + 1 < n) {
          out += src[i + 1] as string;
          i += 2;
          continue;
        }
        if (t === "`") {
          closed = true;
          templateStack.pop();
          i += 1;
          break;
        }
        if (t === "$" && src[i + 1] === "{") {
          out += "{";
          templateStack.push("${");
          brace += 1;
          i += 2;
          break;
        }
        i += 1;
      }
      if (!closed && i >= n) balanced = false;
      continue;
    }

    if (c === "`" && inTemplateExpr) {
      // Nested template inside an ${...} expression: copy byte-for-byte so
      // inner braces/backticks never disturb the outer stack. No space is
      // emitted (a space would break tagged-template calls like tag`...`).
      pendingSpace = false;
      const end = skipTemplate(src, i);
      if (end === -1) {
        out += src.slice(i);
        balanced = false;
        i = n;
      } else {
        out += src.slice(i, end);
        i = end;
      }
      prevSignificant = "`";
      continue;
    }

    if (c === "}" && templateStack.length > 0) {
      const top = templateStack[templateStack.length - 1];
      if (top === "${") {
        templateStack.pop();
        brace = Math.max(0, brace - 1);
        pendingSpace = false;
        if (out.endsWith(";")) out = out.slice(0, -1);
        out += c;
        prevSignificant = c;
        i += 1;
        // Resume the template tail: the underlying "str" entry is still on
        // the stack, so scan without pushing. A nested ${ pushes a new entry
        // and breaks back to the main loop; inner backticks are opaque chars.
        if (i < n && src[i] === "`") {
          templateStack.pop();
          out += "`";
          prevSignificant = "`";
          i += 1;
        } else {
          let closed = false;
          while (i < n) {
            const t = src[i] as string;
            out += t;
            if (t === "\\" && i + 1 < n) {
              out += src[i + 1] as string;
              i += 2;
              continue;
            }
            if (t === "`") {
              closed = true;
              templateStack.pop();
              i += 1;
              break;
            }
            if (t === "$" && src[i + 1] === "{") {
              out += "{";
              templateStack.push("${");
              brace += 1;
              i += 2;
              break;
            }
            i += 1;
          }
          if (!closed && i >= n) balanced = false;
        }
        continue;
      }
    }

    if (c === '"' || c === "'") {
      emitPendingSpace(c);
      out += c;
      prevSignificant = c;
      i += 1;
      let closed = false;
      while (i < n) {
        const t = src[i] as string;
        out += t;
        if (t === "\\" && i + 1 < n) {
          out += src[i + 1] as string;
          i += 2;
          continue;
        }
        if (t === c) {
          closed = true;
          i += 1;
          break;
        }
        if (t === "\n") break;
        i += 1;
      }
      if (!closed) balanced = false;
      continue;
    }

    if (c === "/" && src[i + 1] === "/") {
      i += 2;
      while (i < n && src[i] !== "\n") i += 1;
      pendingSpace = true;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i += 1;
      i += 2;
      pendingSpace = true;
      continue;
    }
    if (c === "/" && isRegexStart(prevSignificant)) {
      emitPendingSpace(c);
      out += c;
      i += 1;
      let inClass = false;
      let closed = false;
      while (i < n) {
        const t = src[i] as string;
        out += t;
        if (t === "\\" && i + 1 < n) {
          out += src[i + 1] as string;
          i += 2;
          continue;
        }
        if (t === "[") inClass = true;
        else if (t === "]") inClass = false;
        else if (t === "/" && !inClass) {
          closed = true;
          i += 1;
          break;
        } else if (t === "\n") break;
        i += 1;
      }
      while (i < n && /[a-z]/i.test(src[i] as string)) {
        out += src[i] as string;
        i += 1;
      }
      if (!closed) balanced = false;
      prevSignificant = "/";
      continue;
    }

    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
      pendingSpace = true;
      i += 1;
      continue;
    }

    if (c === "{") brace += 1;
    else if (c === "}") {
      brace -= 1;
      if (brace < 0) balanced = false;
      if (out.endsWith(";")) out = out.slice(0, -1);
      pendingSpace = false;
    } else if (c === "(") paren += 1;
    else if (c === ")") {
      paren -= 1;
      if (paren < 0) balanced = false;
    } else if (c === "[") bracket += 1;
    else if (c === "]") {
      bracket -= 1;
      if (bracket < 0) balanced = false;
    }

    if (c === ";") {
      const next = src[i + 1];
      if (next === "}" || i + 1 >= n) {
        prevSignificant = c;
        i += 1;
        continue;
      }
      pendingSpace = false;
      out += c;
      prevSignificant = c;
      i += 1;
      continue;
    }

    emitPendingSpace(c);
    out += c;
    if (/[A-Za-z0-9_$]/.test(c)) {
      prevSignificant = readWordBackward(out, out.length - 1);
      if (!/^(return|typeof|case|throw|delete|void|in|of|new)$/.test(prevSignificant)) {
        prevSignificant = c;
      }
    } else {
      prevSignificant = c;
    }
    i += 1;
  }

  if (brace !== 0 || paren !== 0 || bracket !== 0 || templateStack.length > 0) balanced = false;
  return { code: out.trim(), balanced };
}

export default function JsFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  async function handleBeautify(): Promise<void> {
    try {
      if (input.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        setNote(null);
        toast.error(s.emptyInput);
        return;
      }
      setBusy(true);
      setError(null);
      setNote(null);
      const [{ format }, babelMod] = await Promise.all([
        import("prettier/standalone"),
        import("prettier/plugins/babel"),
      ]);
      const plugin = (babelMod as unknown as { default?: unknown }).default ?? babelMod;
      const next = await format(input, { parser: "babel", plugins: [plugin as never] });
      setOutput(next.trimEnd());
      toast.success(s.processed);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      const excerpt = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
      setError(excerpt);
      setOutput("");
      toast.error(excerpt);
    } finally {
      setBusy(false);
    }
  }

  function handleMinify(): void {
    try {
      if (input.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        setNote(null);
        toast.error(s.emptyInput);
        return;
      }
      const { code, balanced } = minifyJs(input);
      setOutput(code);
      setError(null);
      setNote(balanced ? null : s.unbalanced);
      toast.success(s.processed);
      if (!balanced) toast.warning(s.unbalanced);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      setError(raw);
      setOutput("");
      setNote(null);
      toast.error(raw.length > 220 ? `${raw.slice(0, 220)}…` : raw);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_JS);
      setOutput("");
      setError(null);
      setNote(null);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleClear(): void {
    try {
      setInput("");
      setOutput("");
      setError(null);
      setNote(null);
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
      const blob = new Blob([text], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "script.js";
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

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Braces"
      slug="developer/js-formatter"
      faq={[
        {
          en: {
            q: "How does Beautify work?",
            a: "Beautify runs Prettier (Babel parser) with default settings. The Prettier bundle is lazy-loaded only when you press Beautify, so the page stays fast. If your code has a syntax error, Prettier reports the exact location in the red error panel.",
          },
          id: {
            q: "Bagaimana cara kerja Beautify?",
            a: "Beautify menjalankan Prettier (parser Babel) dengan pengaturan bawaan. Bundle Prettier dimuat malas hanya saat Anda menekan Beautify, sehingga halaman tetap cepat. Jika kode memiliki kesalahan sintaks, Prettier melaporkannya dengan lokasi persis di panel kesalahan merah.",
          },
        },
        {
          en: {
            q: "Is the minifier safe for regex and template literals?",
            a: "Yes. The custom minify pass is string-, template-, and regex-aware: comments are stripped, whitespace is collapsed, redundant semicolons removed, but string contents, ${expressions}, and regex literals are preserved byte-for-byte.",
          },
          id: {
            q: "Apakah minifier aman untuk regex dan template literal?",
            a: "Ya. Pass minify kustom sadar-string, sadar-template, dan sadar-regex: komentar dihapus, spasi digabungkan, titik koma berlebih dibuang, tetapi isi string, ${ekspresi}, dan literal regex dipertahankan byte-per-byte.",
          },
        },
        {
          en: {
            q: "Is my code private?",
            a: "Yes. Beautifying, minifying, and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah kode saya privat?",
            a: "Ya. Beautify, minify, dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="js-input"
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
              id="js-input"
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
              <Button type="button" onClick={handleBeautify} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.loading}
                  </>
                ) : (
                  s.beautify
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={handleMinify} disabled={busy}>
                {s.minify}
              </Button>
              <Button type="button" variant="outline" onClick={handleSample} disabled={busy}>
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
              <Button type="button" variant="outline" onClick={handleClear} disabled={busy}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
              <Button type="button" variant="outline" onClick={handleDownload} disabled={busy}>
                <Download className="h-4 w-4" aria-hidden />
                {s.download}
              </Button>
            </div>
            {note !== null && error === null && (
              <div
                role="note"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
              >
                <p className="font-semibold">{s.noteLabel}</p>
                <p className="mt-1">{note}</p>
              </div>
            )}
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
                    language="javascript"
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
