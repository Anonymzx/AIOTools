"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AlertTriangle, CheckCircle2, Download, Trash2 } from "lucide-react";
import { dump, loadAll } from "js-yaml";
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

const SAMPLE_YAML = `server:
  host: localhost
  port: 8080
  debug: true
databases:
  - name: app
    replicas: 2
  - name: analytics
    replicas: 1
`;

type View = "yaml" | "json";

interface YamlMark {
  line?: number;
  column?: number;
  snippet?: string;
}

interface YamlErrorShape {
  reason?: string;
  mark?: YamlMark;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    indentSize: string;
    yamlView: string;
    jsonView: string;
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
    emptyDoc: string;
    valid: string;
    invalid: string;
    notChecked: string;
    docs: string;
    errorLabel: string;
    atLine: string;
    invalidYaml: string;
    downloaded: string;
    downloadFailed: string;
  }
> = {
  en: {
    title: "YAML Formatter",
    description:
      "Validate, format, and convert YAML — multi-document aware, YAML or JSON output, 100% in your browser.",
    inputLabel: "YAML input",
    inputPlaceholder: "Paste YAML here, e.g. server:\n  port: 8080…",
    outputLabel: "Result",
    indentSize: "Indent",
    yamlView: "YAML",
    jsonView: "JSON",
    run: "Format YAML",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy",
    download: "Download",
    processed: "YAML formatted successfully.",
    sampleLoaded: "Sample YAML loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    emptyInput: "Please paste some YAML first.",
    emptyHint: "Format your YAML — the highlighted result will appear here.",
    emptyDoc: "The document is empty — nothing to format.",
    valid: "Valid",
    invalid: "Invalid",
    notChecked: "Not checked",
    docs: "documents",
    errorLabel: "Error details",
    atLine: "line",
    invalidYaml: "Invalid YAML",
    downloaded: "File downloaded.",
    downloadFailed: "Failed to download file.",
  },
  id: {
    title: "Pemformat YAML (YAML Formatter)",
    description:
      "Validasi, format, dan konversi YAML — sadar multi-dokumen, output YAML atau JSON, 100% di browser Anda.",
    inputLabel: "Masukan YAML",
    inputPlaceholder: "Tempel YAML di sini, cth. server:\n  port: 8080…",
    outputLabel: "Hasil",
    indentSize: "Indentasi",
    yamlView: "YAML",
    jsonView: "JSON",
    run: "Format YAML",
    sample: "Contoh",
    clear: "Hapus",
    copy: "Salin",
    download: "Unduh",
    processed: "YAML berhasil diformat.",
    sampleLoaded: "Contoh YAML dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    emptyInput: "Tempel YAML terlebih dahulu.",
    emptyHint: "Format YAML Anda — hasil dengan sorotan akan muncul di sini.",
    emptyDoc: "Dokumen kosong — tidak ada yang bisa diformat.",
    valid: "Valid",
    invalid: "Tidak valid",
    notChecked: "Belum diperiksa",
    docs: "dokumen",
    errorLabel: "Detail kesalahan",
    atLine: "baris",
    invalidYaml: "YAML tidak valid",
    downloaded: "File diunduh.",
    downloadFailed: "Gagal mengunduh file.",
  },
};

function toErrorMessage(e: unknown, atLine: string): string {
  if (e instanceof Error) {
    const shaped = e as Error & Partial<YamlErrorShape>;
    const reason = typeof shaped.reason === "string" ? shaped.reason : e.message;
    const mark = shaped.mark;
    const where =
      mark !== undefined && typeof mark.line === "number"
        ? ` (${atLine} ${mark.line + 1}${typeof mark.column === "number" ? `, col ${mark.column + 1}` : ""})`
        : "";
    const snippet =
      mark !== undefined && typeof mark.snippet === "string" && mark.snippet.trim() !== ""
        ? `\n${mark.snippet.length > 200 ? `${mark.snippet.slice(0, 200)}…` : mark.snippet}`
        : "";
    const full = `${reason}${where}${snippet}`;
    return full.length > 400 ? `${full.slice(0, 400)}…` : full;
  }
  return atLine;
}

export default function YamlFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [view, setView] = useState<View>("yaml");
  const [indentSize, setIndentSize] = useState(2);
  const [docCount, setDocCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  function runFormat(source: string, v: View, size: number): void {
    try {
      if (source.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        setDocCount(0);
        toast.error(s.emptyInput);
        return;
      }
      const docs = loadAll(source);
      if (docs.length === 0 || docs.every((d) => d === undefined || d === null)) {
        setError(s.emptyDoc);
        setOutput("");
        setDocCount(0);
        toast.error(s.emptyDoc);
        return;
      }
      let next: string;
      if (v === "json") {
        next = JSON.stringify(docs.length === 1 ? docs[0] : docs, null, 2) ?? "";
      } else if (docs.length === 1) {
        next = dump(docs[0], { indent: size, lineWidth: -1, noRefs: true });
      } else {
        next = docs
          .map((d) => dump(d, { indent: size, lineWidth: -1, noRefs: true }).trimEnd())
          .join("\n---\n");
      }
      setOutput(next.trimEnd());
      setDocCount(docs.length);
      setError(null);
      toast.success(s.processed);
    } catch (e) {
      const raw = toErrorMessage(e, s.atLine);
      setError(raw);
      setOutput("");
      setDocCount(0);
      toast.error(`${s.invalidYaml}: ${raw.length > 220 ? `${raw.slice(0, 220)}…` : raw}`);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_YAML);
      runFormat(SAMPLE_YAML, view, indentSize);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.invalidYaml);
    }
  }

  function handleClear(): void {
    try {
      setInput("");
      setOutput("");
      setError(null);
      setDocCount(0);
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
      const isJson = view === "json";
      const blob = new Blob([text], { type: isJson ? "application/json" : "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isJson ? "data.json" : "data.yaml";
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
      iconName="Braces"
      slug="developer/yaml-formatter"
      faq={[
        {
          en: {
            q: "Are multi-document files supported?",
            a: "Yes. Files with several documents separated by --- lines are parsed with loadAll. YAML output re-emits each document joined by ---, while JSON output returns an array of all documents.",
          },
          id: {
            q: "Apakah file multi-dokumen didukung?",
            a: "Ya. File dengan beberapa dokumen yang dipisahkan baris --- diurai dengan loadAll. Output YAML menulis ulang tiap dokumen digabung ---, sedangkan output JSON mengembalikan array semua dokumen.",
          },
        },
        {
          en: {
            q: "Why did my YAML fail validation?",
            a: "The usual culprits are tabs instead of spaces, inconsistent indentation, or unquoted special characters. The red panel shows the parser reason plus the exact line and a source excerpt.",
          },
          id: {
            q: "Mengapa YAML saya gagal divalidasi?",
            a: "Penyebab umum adalah tab bukan spasi, indentasi tidak konsisten, atau karakter khusus tanpa kutip. Panel merah menampilkan alasan parser plus baris persis dan kutipan sumber.",
          },
        },
        {
          en: {
            q: "Is my YAML private?",
            a: "Yes. Parsing, formatting, conversion, and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah YAML saya privat?",
            a: "Ya. Penguraian, pemformatan, konversi, dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="yaml-input"
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
              id="yaml-input"
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
                aria-label="view"
              >
                {(["yaml", "json"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setView(v);
                    }}
                    aria-pressed={view === v}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      view === v
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                  >
                    {v === "yaml" ? s.yamlView : s.jsonView}
                  </button>
                ))}
              </div>
              {view === "yaml" && (
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
              <Button
                type="button"
                onClick={() => {
                  runFormat(input, view, indentSize);
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
                <p className="mt-1 break-words font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {error}
                </p>
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
                    {docCount} {s.docs}
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
                    language={view === "json" ? "json" : "yaml"}
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
