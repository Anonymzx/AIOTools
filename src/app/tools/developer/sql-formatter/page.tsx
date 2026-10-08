"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AlertTriangle, CheckCircle2, Download, Trash2 } from "lucide-react";
import { format } from "sql-formatter";
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

const SAMPLE_SQL = `select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = 1 group by u.id, u.name having count(o.id) > 2 order by orders desc limit 10;`;

type Dialect = "mysql" | "postgresql" | "sqlite" | "tsql" | "plsql";

const DIALECTS: Array<{ value: Dialect; label: string }> = [
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "tsql", label: "T-SQL (SQL Server)" },
  { value: "plsql", label: "PL/SQL (Oracle)" },
];

function toLibDialect(d: Dialect): "mysql" | "postgresql" | "sqlite" | "transactsql" | "plsql" {
  if (d === "tsql") return "transactsql";
  return d;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    dialect: string;
    uppercase: string;
    uppercaseHint: string;
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
    chars: string;
    lines: string;
    errorLabel: string;
    parseFailed: string;
    downloaded: string;
    downloadFailed: string;
  }
> = {
  en: {
    title: "SQL Formatter",
    description:
      "Format messy SQL into clean indented queries — 5 dialects, keyword case control, 100% in your browser.",
    inputLabel: "SQL input",
    inputPlaceholder: "Paste SQL here, e.g. select * from users where id = 1;…",
    outputLabel: "Formatted SQL",
    dialect: "Dialect",
    uppercase: "Uppercase keywords",
    uppercaseHint: "SELECT, FROM, WHERE…",
    run: "Format SQL",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy",
    download: "Download .sql",
    processed: "SQL formatted successfully.",
    sampleLoaded: "Sample SQL loaded.",
    cleared: "Editor cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    emptyInput: "Please paste some SQL first.",
    emptyHint: "Format your SQL — the highlighted result will appear here.",
    valid: "Done",
    invalid: "Error",
    notChecked: "Not processed",
    chars: "chars",
    lines: "lines",
    errorLabel: "Error details",
    parseFailed: "Could not format this SQL",
    downloaded: "SQL file downloaded.",
    downloadFailed: "Failed to download file.",
  },
  id: {
    title: "Pemformat SQL (SQL Formatter)",
    description:
      "Format SQL berantakan menjadi kueri rapi berindentasi — 5 dialek, kontrol huruf keyword, 100% di browser Anda.",
    inputLabel: "Masukan SQL",
    inputPlaceholder: "Tempel SQL di sini, cth. select * from users where id = 1;…",
    outputLabel: "SQL terformat",
    dialect: "Dialek",
    uppercase: "Keyword huruf besar",
    uppercaseHint: "SELECT, FROM, WHERE…",
    run: "Format SQL",
    sample: "Contoh",
    clear: "Hapus",
    copy: "Salin",
    download: "Unduh .sql",
    processed: "SQL berhasil diformat.",
    sampleLoaded: "Contoh SQL dimuat.",
    cleared: "Editor dihapus.",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    emptyInput: "Tempel SQL terlebih dahulu.",
    emptyHint: "Format SQL Anda — hasil dengan sorotan akan muncul di sini.",
    valid: "Selesai",
    invalid: "Galat",
    notChecked: "Belum diproses",
    chars: "karakter",
    lines: "baris",
    errorLabel: "Detail kesalahan",
    parseFailed: "SQL ini tidak dapat diformat",
    downloaded: "File SQL diunduh.",
    downloadFailed: "Gagal mengunduh file.",
  },
};

export default function SqlFormatterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("mysql");
  const [uppercase, setUppercase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  function runFormat(source: string, d: Dialect, upper: boolean): void {
    try {
      if (source.trim() === "") {
        setError(s.emptyInput);
        setOutput("");
        toast.error(s.emptyInput);
        return;
      }
      const next = format(source, {
        language: toLibDialect(d),
        keywordCase: upper ? "upper" : "preserve",
      });
      setOutput(next.trimEnd());
      setError(null);
      toast.success(s.processed);
    } catch (e) {
      const raw = e instanceof Error ? e.message : s.errorLabel;
      const excerpt = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
      setError(excerpt);
      setOutput("");
      toast.error(`${s.parseFailed}: ${excerpt}`);
    }
  }

  function handleSample(): void {
    try {
      setInput(SAMPLE_SQL);
      runFormat(SAMPLE_SQL, dialect, uppercase);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.parseFailed);
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
      const blob = new Blob([text], { type: "text/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "query.sql";
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
  const lineCount = output === "" ? 0 : output.split("\n").length;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileType"
      slug="developer/sql-formatter"
      faq={[
        {
          en: {
            q: "Which SQL dialects are supported?",
            a: "MySQL, PostgreSQL, SQLite, T-SQL (SQL Server), and PL/SQL (Oracle). Pick the dialect matching your database so quoting, functions, and placeholders are formatted correctly.",
          },
          id: {
            q: "Dialek SQL apa saja yang didukung?",
            a: "MySQL, PostgreSQL, SQLite, T-SQL (SQL Server), dan PL/SQL (Oracle). Pilih dialek yang sesuai database Anda agar quoting, fungsi, dan placeholder diformat dengan benar.",
          },
        },
        {
          en: {
            q: "Why did formatting fail?",
            a: "The parser is strict about unbalanced quotes, parentheses, or incomplete statements. The red panel shows the parser message — fix the flagged spot and try again.",
          },
          id: {
            q: "Mengapa pemformatan gagal?",
            a: "Parser ketat terhadap kutip, kurung, atau pernyataan tak seimbang/lengkap. Panel merah menampilkan pesan parser — perbaiki bagian yang ditandai lalu coba lagi.",
          },
        },
        {
          en: {
            q: "Is my SQL private?",
            a: "Yes. Formatting and highlighting all run locally in your browser. Nothing is uploaded to any server.",
          },
          id: {
            q: "Apakah SQL saya privat?",
            a: "Ya. Pemformatan dan sorotan sintaks semuanya berjalan lokal di browser Anda. Tidak ada yang diunggah ke server mana pun.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="sql-input"
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
              id="sql-input"
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
              <label className="flex flex-1 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {s.dialect}
                <select
                  value={dialect}
                  onChange={(e) => {
                    const next = e.target.value as Dialect;
                    setDialect(next);
                  }}
                  className={SELECT_CLS}
                  aria-label={s.dialect}
                >
                  {DIALECTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                title={s.uppercaseHint}
              >
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => {
                    setUppercase(e.target.checked);
                  }}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                {s.uppercase}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                onClick={() => {
                  runFormat(input, dialect, uppercase);
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
                    {output.length} {s.chars}
                  </Badge>
                  <Badge variant="secondary">
                    {lineCount} {s.lines}
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
                    language="sql"
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
