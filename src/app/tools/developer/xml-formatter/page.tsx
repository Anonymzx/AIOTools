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

const SAMPLE_XML = `<catalog><book id="1"><title>Clean Code</title><author>Robert C. Martin</author><price currency="USD">42.5</price></book><book id="2"><title>The Pragmatic Programmer</title><author>Andrew Hunt</author><price currency="USD">39.99</price></book></catalog>`;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    indentSize: string;
    run: string;
    sample: string;
    clear: string;
    copy: string;
    download: string;
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
    elements: string;
    errorLabel: string;
    invalidXml: string;
    downloaded: string;
    downloadFailed: string;
  }
> = {
  en: {
    title: "XML Formatter",
    description:
      "Validate and pretty-print XML with safe indentation — comments, CDATA, and declarations preserved, 100% in your browser.",
    inputLabel: "XML input",
    inputPlaceholder: "Paste XML here, e.g. <note><to>Ana</to></note>…",
    outputLabel: "Formatted XML",
    indentSize: "Indent",
    run: "Format XML",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy",
    download: "Download .xml",
    processed: "XML formatted successfully.",
    sampleLoaded: "Sample XML loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    emptyInput: "Please paste some XML first.",
    emptyHint: "Format your XML — the highlighted result will appear here.",
    valid: "Valid",
    invalid: "Invalid",
    notChecked: "Not checked",
    elements: "elements",
    errorLabel: "Error details",
    invalidXml: "Invalid XML",
    downloaded: "XML file downloaded.",
    downloadFailed: "Failed to download file.",
  },
  id: {
    title: "Pemformat XML (XML Formatter)",
    description:
      "Validasi dan rapikan XML dengan indentasi aman — komentar, CDATA, dan deklarasi dipertahankan, 100% di browser Anda.",
    inputLabel: "Masukan XML",
    inputPlaceholder: "Tempel XML di sini, cth. <note><to>Ana</to></note>…",
    outputLabel: "XML terformat",
    indentSize: "Indentasi",
    run: "Format XML",
    sample: "Contoh",
    clear: "Hapus",
    copy: "Salin",
    download: "Unduh .xml",
    processed: "XML berhasil diformat.",
    sampleLoaded: "Contoh XML dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    emptyInput: "Tempel XML terlebih dahulu.",
    emptyHint: "Format XML Anda — hasil dengan sorotan akan muncul di sini.",
    valid: "Valid",
    invalid: "Tidak valid",
    notChecked: "Belum diperiksa",
    elements: "elemen",
    errorLabel: "Detail kesalahan",
    invalidXml: "XML tidak valid",
    downloaded: "File XML diunduh.",
    downloadFailed: "Gagal mengunduh file.",
  },
};

function formatXml(src: string, indentSize: number): { text: string; elements: number } {
  const indent = " ".repeat(indentSize);
  const tokens =
    src
      .replace(/>\s+</g, "><")
      .match(
        /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?[A-Za-z_][^<>]*\/?>|[^<]+/g,
      ) ?? [];
  const lines: string[] = [];
  let depth = 0;
  let elements = 0;
  for (let k = 0; k < tokens.length; k += 1) {
    const raw = tokens[k] as string;
    const token = raw.trim();
    if (token === "") continue;
    if (token.startsWith("<!--") || token.startsWith("<![CDATA[") || token.startsWith("<?") || token.startsWith("<!DOCTYPE")) {
      lines.push(indent.repeat(Math.max(0, depth)) + token);
      continue;
    }
    if (token.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      const prev = k > 0 ? (tokens[k - 1] as string).trim() : "";
      const prevIsText = prev !== "" && !prev.startsWith("<");
      if (prevIsText && lines.length > 0) {
        lines[lines.length - 1] = `${lines[lines.length - 1] as string}${token}`;
      } else {
        lines.push(indent.repeat(Math.max(0, depth)) + token);
      }
      continue;
    }
    if (token.startsWith("<")) {
      elements += 1;
      const selfClosing = token.endsWith("/>");
      const next = k + 1 < tokens.length ? (tokens[k + 1] as string).trim() : "";
      const nextIsText = next !== "" && !next.startsWith("<");
      const afterNext =
        k + 2 < tokens.length ? (tokens[k + 2] as string).trim() : "";
      const isInlinePair =
        !selfClosing && nextIsText && afterNext.startsWith("</");
      if (selfClosing) {
        lines.push(indent.repeat(Math.max(0, depth)) + token);
      } else if (isInlinePair) {
        lines.push(indent.repeat(Math.max(0, depth)) + `${token}${next}${afterNext}`);
        k += 2;
      } else {
        lines.push(indent.repeat(Math.max(0, depth)) + token);
        depth += 1;
      }
      continue;
    }
    lines.push(indent.repeat(Math.max(0, depth)) + token);
  }
  return { text: lines.join("\n").trim(), elements };
}

export default function XmlFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [elementCount, setElementCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  function runFormat(source: string, size: number): void {
    try {
      if (source.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        setElementCount(0);
        toast.error(s.emptyInput);
        return;
      }
      const doc = new DOMParser().parseFromString(source, "application/xml");
      const parserErrors = doc.getElementsByTagName("parsererror");
      if (parserErrors.length > 0) {
        const raw =
          parserErrors[0]?.textContent?.replace(/\s+/g, " ").trim() ?? s.invalidXml;
        const excerpt = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
        setError(excerpt);
        setOutput("");
        setElementCount(0);
        toast.error(`${s.invalidXml}: ${excerpt}`);
        return;
      }
      const { text, elements } = formatXml(source, size);
      setOutput(text);
      setElementCount(elements);
      setError(null);
      toast.success(s.processed);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      const excerpt = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
      setError(excerpt);
      setOutput("");
      setElementCount(0);
      toast.error(`${s.invalidXml}: ${excerpt}`);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_XML);
      runFormat(SAMPLE_XML, indentSize);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.invalidXml);
    }
  }

  function handleClear(): void {
    try {
      setInput("");
      setOutput("");
      setError(null);
      setElementCount(0);
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
      const blob = new Blob([text], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.xml";
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

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileCode"
      slug="developer/xml-formatter"
      faq={[
        {
          en: {
            q: "How is my XML validated?",
            a: "Your XML is parsed with the browser's native DOMParser. If the document is malformed — unclosed tags, bad nesting, illegal characters — the red panel shows the exact parser message so you can find the problem fast.",
          },
          id: {
            q: "Bagaimana XML saya divalidasi?",
            a: "XML Anda diurai dengan DOMParser bawaan browser. Jika dokumen cacat — tag tak tertutup, nesting salah, karakter ilegal — panel merah menampilkan pesan parser persisnya agar masalah cepat ditemukan.",
          },
        },
        {
          en: {
            q: "Are comments and CDATA preserved?",
            a: "Yes. Comments, CDATA sections, processing instructions, and DOCTYPE declarations are each placed on their own indented line and never merged into surrounding elements.",
          },
          id: {
            q: "Apakah komentar dan CDATA dipertahankan?",
            a: "Ya. Komentar, seksi CDATA, instruksi pemrosesan, dan deklarasi DOCTYPE masing-masing ditempatkan di baris berindentasi sendiri dan tidak pernah digabung ke elemen sekitarnya.",
          },
        },
        {
          en: {
            q: "Is my XML private?",
            a: "Yes. Validation, formatting, and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah XML saya privat?",
            a: "Ya. Validasi, pemformatan, dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="xml-input"
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
              id="xml-input"
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
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                onClick={() => {
                  runFormat(input, indentSize);
                }}
              >
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
                    {elementCount} {s.elements}
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
                    language="markup"
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
