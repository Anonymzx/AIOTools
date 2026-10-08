"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowRight, Download, Eraser, Table2 } from "lucide-react";
import Papa from "papaparse";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SAMPLE_CSV = `name,age,city
Anya,28,Jakarta
Budi,34,Bandung
Citra,25,Surabaya`;

const DELIMS: Record<string, string> = {
  comma: ",",
  semicolon: ";",
  tab: "\t",
  pipe: "|",
};

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    delimiter: string;
    delimComma: string;
    delimSemicolon: string;
    delimTab: string;
    delimPipe: string;
    convert: string;
    sample: string;
    clear: string;
    copy: string;
    download: string;
    dropHint: string;
    previewTitle: string;
    jsonTitle: string;
    rows: string;
    cols: string;
    showing: string;
    emptyInput: string;
    parseOk: string;
    parseWarn: string;
    parseEmpty: string;
    copied: string;
    downloaded: string;
    error: string;
  }
> = {
  en: {
    title: "CSV to JSON",
    description:
      "Convert CSV to JSON instantly with delimiter detection options and a live table preview. Everything runs locally in your browser.",
    inputLabel: "CSV input",
    inputPlaceholder: "Paste CSV here, or drop a .csv file below…",
    delimiter: "Delimiter",
    delimComma: "Comma (,)",
    delimSemicolon: "Semicolon (;)",
    delimTab: "Tab (⇥)",
    delimPipe: "Pipe (|)",
    convert: "Convert to JSON",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy JSON",
    download: "Download .json",
    dropHint: "Drop a .csv file here, or click to browse",
    previewTitle: "Table preview",
    jsonTitle: "JSON output",
    rows: "rows",
    cols: "columns",
    showing: "showing first 50",
    emptyInput: "Enter CSV text or drop a file first.",
    parseOk: "CSV converted to JSON.",
    parseWarn: "Converted with warnings — check the first error below.",
    parseEmpty: "No data rows found (header only or empty input).",
    copied: "Copied to clipboard.",
    downloaded: "JSON file downloaded.",
    error: "Something went wrong.",
  },
  id: {
    title: "CSV ke JSON",
    description:
      "Ubah CSV menjadi JSON secara instan dengan pilihan delimiter dan pratinjau tabel langsung. Semuanya berjalan lokal di browser.",
    inputLabel: "Masukan CSV",
    inputPlaceholder: "Tempel CSV di sini, atau letakkan file .csv di bawah…",
    delimiter: "Pemisah",
    delimComma: "Koma (,)",
    delimSemicolon: "Titik koma (;)",
    delimTab: "Tab (⇥)",
    delimPipe: "Pipe (|)",
    convert: "Ubah ke JSON",
    sample: "Contoh",
    clear: "Bersihkan",
    copy: "Salin JSON",
    download: "Unduh .json",
    dropHint: "Letakkan file .csv di sini, atau klik untuk memilih",
    previewTitle: "Pratinjau tabel",
    jsonTitle: "Keluaran JSON",
    rows: "baris",
    cols: "kolom",
    showing: "menampilkan 50 pertama",
    emptyInput: "Isi teks CSV atau letakkan file terlebih dahulu.",
    parseOk: "CSV berhasil diubah ke JSON.",
    parseWarn: "Berhasil diubah dengan peringatan — periksa error pertama di bawah.",
    parseEmpty: "Tidak ada baris data (hanya header atau masukan kosong).",
    copied: "Disalin ke clipboard.",
    downloaded: "File JSON diunduh.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Which delimiter should I choose?",
      a: "Pick the character that separates your columns: comma for standard CSV, semicolon for Excel exports in many locales, tab for TSV pastes from spreadsheets, pipe for logs. If columns merge into one, you picked the wrong delimiter.",
    },
    id: {
      q: "Delimiter mana yang harus kupilih?",
      a: "Pilih karakter pemisah kolommu: koma untuk CSV standar, titik koma untuk ekspor Excel di banyak lokal, tab untuk tempelan TSV dari spreadsheet, pipe untuk log. Jika kolom menyatu menjadi satu, delimiter yang dipilih salah.",
    },
  },
  {
    en: {
      q: "Does the first row become the JSON keys?",
      a: "Yes. The first row is treated as the header and becomes the key of every JSON object. Make sure header names are unique; duplicates get suffixed automatically by the parser.",
    },
    id: {
      q: "Apakah baris pertama menjadi kunci JSON?",
      a: "Ya. Baris pertama dianggap header dan menjadi kunci setiap objek JSON. Pastikan nama header unik; duplikat diberi akhiran otomatis oleh parser.",
    },
  },
  {
    en: {
      q: "Is my CSV uploaded anywhere?",
      a: "No. Parsing runs entirely in your browser with PapaParse. Files never leave your device.",
    },
    id: {
      q: "Apakah CSV-ku diunggah ke mana pun?",
      a: "Tidak. Parsing berjalan sepenuhnya di browser dengan PapaParse. File tidak pernah keluar dari perangkatmu.",
    },
  },
];

interface Parsed {
  rows: Record<string, string>[];
  columns: string[];
  error: string | null;
}

export default function CsvToJsonPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();

  const [csv, setCsv] = useState("");
  const [delimKey, setDelimKey] = useState("comma");
  const [dzKey, setDzKey] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);

  const jsonText = useMemo(() => {
    try {
      if (!parsed || parsed.rows.length === 0) return "";
      return JSON.stringify(parsed.rows, null, 2);
    } catch {
      return "";
    }
  }, [parsed]);

  const previewRows = useMemo(() => {
    try {
      return parsed ? parsed.rows.slice(0, 50) : [];
    } catch {
      return [];
    }
  }, [parsed]);

  const handleConvert = (): void => {
    try {
      if (csv.trim().length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const delimiter = DELIMS[delimKey] ?? ",";
      const result = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
        delimiter,
      });
      const firstError = result.errors.length > 0 ? (result.errors[0]?.message ?? null) : null;
      const rows = result.data.filter((r) => {
        try {
          return Object.values(r).some((v) => String(v ?? "").trim() !== "");
        } catch {
          return false;
        }
      });
      const columns = result.meta.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
      if (rows.length === 0) {
        setParsed({ rows: [], columns, error: firstError });
        toast.error(s.parseEmpty);
        return;
      }
      setParsed({ rows, columns, error: firstError });
      if (firstError) toast.warning(`${s.parseWarn} ${firstError}`);
      else toast.success(s.parseOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const f = files[0];
      setDzKey((k) => k + 1);
      if (!f) return;
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result;
          if (typeof text !== "string") {
            toast.error(s.error);
            return;
          }
          setCsv(text);
          toast.success(s.parseOk);
        } catch {
          toast.error(s.error);
        }
      };
      reader.onerror = () => {
        try {
          toast.error(s.error);
        } catch {
          // ignore
        }
      };
      reader.readAsText(f);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      if (jsonText.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }, 4000);
      }
      toast.success(s.downloaded);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setCsv("");
      setParsed(null);
      setFileName(null);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Table2" slug="developer/csv-to-json" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label htmlFor="csv-input" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.inputLabel}
              </label>
              <textarea
                id="csv-input"
                value={csv}
                onChange={(e) => {
                  try {
                    setCsv(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder={s.inputPlaceholder}
                rows={7}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              />
            </div>
            <FileDropzone
              key={dzKey}
              accept={[".csv", "text/csv"]}
              multiple={false}
              maxSizeMB={25}
              preview={false}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />
            {fileName && (
              <Badge variant="secondary" className="font-mono">
                {fileName}
              </Badge>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="csv-delim" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.delimiter}
                </label>
                <select
                  id="csv-delim"
                  value={delimKey}
                  onChange={(e) => {
                    try {
                      setDelimKey(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="comma">{s.delimComma}</option>
                  <option value="semicolon">{s.delimSemicolon}</option>
                  <option value="tab">{s.delimTab}</option>
                  <option value="pipe">{s.delimPipe}</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex">
                <Button
                  onClick={handleConvert}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <ArrowRight aria-hidden />
                  {s.convert}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      setCsv(SAMPLE_CSV);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.sample}
                </Button>
                <Button variant="ghost" onClick={handleClear}>
                  <Eraser aria-hidden />
                  {s.clear}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {parsed && parsed.rows.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <Table2 className="h-4 w-4" aria-hidden />
                  {s.previewTitle}
                </h2>
                <Badge variant="secondary" className="font-mono">
                  {parsed.rows.length} {s.rows}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {parsed.columns.length} {s.cols}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {s.showing}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                <table className="w-full min-w-[480px] border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      {parsed.columns.map((c) => (
                        <th
                          key={c}
                          className="border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                        {parsed.columns.map((c) => (
                          <td key={c} className="max-w-[240px] truncate border-b border-zinc-100 px-3 py-1.5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            {String(row[c] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {jsonText && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.jsonTitle}</h2>
              <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                <SyntaxHighlighter
                  language="json"
                  style={resolvedTheme === "dark" ? oneDark : oneLight}
                  customStyle={{ margin: 0, fontSize: 12 }}
                >
                  {jsonText}
                </SyntaxHighlighter>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton
                  text={jsonText}
                  label={s.copy}
                  variant="secondary"
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyInput}
                  errorMessage={s.error}
                />
                <Button onClick={handleDownload} variant="default">
                  <Download aria-hidden />
                  {s.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
