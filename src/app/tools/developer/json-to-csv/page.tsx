"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
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

const SAMPLE_JSON = `[
  { "name": "Anya", "age": 28, "address": { "city": "Jakarta", "zip": "10110" }, "tags": ["admin", "vip"] },
  { "name": "Budi", "age": 34, "address": { "city": "Bandung", "zip": "40111" }, "tags": ["user"] }
]`;

const MAX_DEPTH = 5;

function flattenValue(value: unknown, prefix: string, depth: number, out: Record<string, unknown>): void {
  try {
    if (depth > MAX_DEPTH || value === null || value === undefined) {
      out[prefix] = value === undefined ? "" : value;
      return;
    }
    if (Array.isArray(value)) {
      try {
        out[prefix] = JSON.stringify(value);
      } catch {
        out[prefix] = String(value);
      }
      return;
    }
    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        out[prefix] = "{}";
        return;
      }
      for (const [k, v] of entries) {
        flattenValue(v, prefix === "" ? k : `${prefix}.${k}`, depth + 1, out);
      }
      return;
    }
    out[prefix] = value;
  } catch {
    try {
      out[prefix] = String(value);
    } catch {
      out[prefix] = "";
    }
  }
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    convert: string;
    sample: string;
    clear: string;
    copy: string;
    download: string;
    dropHint: string;
    previewTitle: string;
    csvTitle: string;
    rows: string;
    cols: string;
    showing: string;
    emptyInput: string;
    invalidJson: string;
    notArray: string;
    convertOk: string;
    convertEmpty: string;
    flattenNote: string;
    copied: string;
    downloaded: string;
    error: string;
  }
> = {
  en: {
    title: "JSON to CSV",
    description:
      "Convert JSON arrays to CSV with automatic flattening of nested objects (dot keys, depth 5). Everything runs locally in your browser.",
    inputLabel: "JSON input",
    inputPlaceholder: 'Paste a JSON array of objects, e.g. [{"name":"Anya"}]…',
    convert: "Convert to CSV",
    sample: "Sample",
    clear: "Clear",
    copy: "Copy CSV",
    download: "Download .csv",
    dropHint: "Drop a .json file here, or click to browse",
    previewTitle: "Table preview",
    csvTitle: "CSV output",
    rows: "rows",
    cols: "columns",
    showing: "showing first 50",
    emptyInput: "Enter JSON text or drop a file first.",
    invalidJson: "Invalid JSON: ",
    notArray: "Top level must be an array of objects, or a single object.",
    convertOk: "JSON converted to CSV.",
    convertEmpty: "Nothing to convert — empty array.",
    flattenNote: "Nested objects are flattened with dot keys (address.city); arrays become JSON strings.",
    copied: "Copied to clipboard.",
    downloaded: "CSV file downloaded.",
    error: "Something went wrong.",
  },
  id: {
    title: "JSON ke CSV",
    description:
      "Ubah array JSON menjadi CSV dengan flattening otomatis objek bersarang (kunci titik, kedalaman 5). Semuanya berjalan lokal di browser.",
    inputLabel: "Masukan JSON",
    inputPlaceholder: 'Tempel array JSON berisi objek, cth. [{"name":"Anya"}]…',
    convert: "Ubah ke CSV",
    sample: "Contoh",
    clear: "Bersihkan",
    copy: "Salin CSV",
    download: "Unduh .csv",
    dropHint: "Letakkan file .json di sini, atau klik untuk memilih",
    previewTitle: "Pratinjau tabel",
    csvTitle: "Keluaran CSV",
    rows: "baris",
    cols: "kolom",
    showing: "menampilkan 50 pertama",
    emptyInput: "Isi teks JSON atau letakkan file terlebih dahulu.",
    invalidJson: "JSON tidak valid: ",
    notArray: "Tingkat teratas harus berupa array berisi objek, atau satu objek.",
    convertOk: "JSON berhasil diubah ke CSV.",
    convertEmpty: "Tidak ada yang diubah — array kosong.",
    flattenNote: "Objek bersarang di-flatten dengan kunci titik (address.city); array menjadi string JSON.",
    copied: "Disalin ke clipboard.",
    downloaded: "File CSV diunduh.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are nested objects handled?",
      a: "Nested objects are flattened with dot-separated keys (address.city), up to 5 levels deep. Arrays are kept as compact JSON strings in a single cell so no data is lost.",
    },
    id: {
      q: "Bagaimana objek bersarang ditangani?",
      a: "Objek bersarang di-flatten dengan kunci bertitik (address.city), hingga 5 tingkat. Array disimpan sebagai string JSON ringkas dalam satu sel agar tidak ada data hilang.",
    },
  },
  {
    en: {
      q: "What JSON shape is accepted?",
      a: "A top-level array of objects works best. A single object is wrapped into one row automatically. Primitives, mixed types, or malformed JSON show a clear error instead of crashing.",
    },
    id: {
      q: "Bentuk JSON apa yang diterima?",
      a: "Array berisi objek di tingkat teratas paling ideal. Satu objek dibungkus otomatis menjadi satu baris. Nilai primitif, tipe campuran, atau JSON rusak menampilkan error yang jelas tanpa crash.",
    },
  },
  {
    en: {
      q: "Is my JSON uploaded anywhere?",
      a: "No. Parsing and CSV generation run entirely in your browser. Files never leave your device.",
    },
    id: {
      q: "Apakah JSON-ku diunggah ke mana pun?",
      a: "Tidak. Parsing dan pembuatan CSV berjalan sepenuhnya di browser. File tidak pernah keluar dari perangkatmu.",
    },
  },
];

interface FlatRow {
  row: Record<string, unknown>;
  columns: string[];
}

export default function JsonToCsvPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [json, setJson] = useState("");
  const [dzKey, setDzKey] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [flat, setFlat] = useState<FlatRow[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  const csvText = useMemo(() => {
    try {
      if (!flat || flat.length === 0) return "";
      return Papa.unparse(
        flat.map((f) => f.row),
        { header: true },
      );
    } catch {
      return "";
    }
  }, [flat]);

  const previewRows = useMemo(() => {
    try {
      return flat ? flat.slice(0, 50) : [];
    } catch {
      return [];
    }
  }, [flat]);

  const handleConvert = (): void => {
    try {
      if (json.trim().length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : s.error;
        toast.error(`${s.invalidJson}${msg}`);
        return;
      }
      const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) {
        setFlat([]);
        setColumns([]);
        toast.error(s.convertEmpty);
        return;
      }
      if (!items.every((it) => it !== null && typeof it === "object" && !Array.isArray(it))) {
        toast.error(s.notArray);
        return;
      }
      const out: FlatRow[] = [];
      const colSet: string[] = [];
      for (const it of items) {
        const row: Record<string, unknown> = {};
        flattenValue(it, "", 0, row);
        for (const k of Object.keys(row)) {
          if (!colSet.includes(k)) colSet.push(k);
        }
        out.push({ row, columns: [] });
      }
      for (const f of out) f.columns = colSet;
      setFlat(out);
      setColumns(colSet);
      toast.success(s.convertOk);
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
          setJson(text);
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
      if (csvText.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted.csv";
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
      setJson("");
      setFlat(null);
      setColumns([]);
      setFileName(null);
    } catch {
      toast.error(s.error);
    }
  };

  const cellText = (v: unknown): string => {
    try {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    } catch {
      return "";
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileOutput" slug="developer/json-to-csv" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label htmlFor="json-input" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.inputLabel}
              </label>
              <textarea
                id="json-input"
                value={json}
                onChange={(e) => {
                  try {
                    setJson(e.target.value);
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
              accept={[".json", "application/json"]}
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
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.flattenNote}</p>
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
                    setJson(SAMPLE_JSON);
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
          </CardContent>
        </Card>

        {flat && flat.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <Table2 className="h-4 w-4" aria-hidden />
                  {s.previewTitle}
                </h2>
                <Badge variant="secondary" className="font-mono">
                  {flat.length} {s.rows}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {columns.length} {s.cols}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {s.showing}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                <table className="w-full min-w-[480px] border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      {columns.map((c) => (
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
                    {previewRows.map((f, i) => (
                      <tr key={i} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                        {columns.map((c) => (
                          <td key={c} className="max-w-[240px] truncate border-b border-zinc-100 px-3 py-1.5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            {cellText(f.row[c])}
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

        {csvText && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.csvTitle}</h2>
              <pre className="max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {csvText}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton
                  text={csvText}
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
