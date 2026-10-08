"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Dices, FileJson, FileText, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CaseMode = "lower" | "upper";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    countLabel: string;
    caseLabel: string;
    lower: string;
    upper: string;
    hyphensLabel: string;
    hyphensOn: string;
    hyphensOff: string;
    generate: string;
    clear: string;
    copyAll: string;
    downloadTxt: string;
    downloadJson: string;
    empty: string;
    emptyInput: string;
    invalidCount: string;
    generateOk: string;
    copied: string;
    copy: string;
    downloadOk: string;
    clearOk: string;
    error: string;
    generatedCount: string;
  }
> = {
  en: {
    title: "UUID Generator",
    description:
      "Generate UUID v4 identifiers in bulk with crypto-grade randomness. Case and hyphen formatting included — everything runs locally in your browser.",
    countLabel: "Quantity (1–100)",
    caseLabel: "Letter case",
    lower: "lowercase",
    upper: "UPPERCASE",
    hyphensLabel: "Hyphens",
    hyphensOn: "with hyphens",
    hyphensOff: "without hyphens",
    generate: "Generate",
    clear: "Clear",
    copyAll: "Copy all",
    downloadTxt: "Download .txt",
    downloadJson: "Download .json",
    empty: "No UUIDs yet — press Generate.",
    emptyInput: "Nothing to copy yet.",
    invalidCount: "Quantity must be a whole number between 1 and 100.",
    generateOk: "UUIDs generated.",
    copied: "Copied to clipboard.",
    copy: "Copy",
    downloadOk: "File downloaded.",
    clearOk: "Cleared.",
    error: "Something went wrong.",
    generatedCount: "generated",
  },
  id: {
    title: "Generator UUID",
    description:
      "Buat pengenal UUID v4 dalam jumlah banyak dengan keacakan setara kripto. Format huruf dan tanda hubung tersedia — semuanya berjalan lokal di browser.",
    countLabel: "Jumlah (1–100)",
    caseLabel: "Bentuk huruf",
    lower: "huruf kecil",
    upper: "HURUF BESAR",
    hyphensLabel: "Tanda hubung",
    hyphensOn: "dengan tanda hubung",
    hyphensOff: "tanpa tanda hubung",
    generate: "Buat",
    clear: "Bersihkan",
    copyAll: "Salin semua",
    downloadTxt: "Unduh .txt",
    downloadJson: "Unduh .json",
    empty: "Belum ada UUID — tekan Buat.",
    emptyInput: "Belum ada yang bisa disalin.",
    invalidCount: "Jumlah harus bilangan bulat antara 1 dan 100.",
    generateOk: "UUID berhasil dibuat.",
    copied: "Disalin ke clipboard.",
    copy: "Salin",
    downloadOk: "File berhasil diunduh.",
    clearOk: "Dibersihkan.",
    error: "Terjadi kesalahan.",
    generatedCount: "dibuat",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What is a UUID v4?",
      a: "A 128-bit Universally Unique Identifier with random (version 4) bits, written as 32 hex digits in five groups (e.g. 550e8400-e29b-41d4-a716-446655440000). Collisions are so unlikely you can treat every value as globally unique.",
    },
    id: {
      q: "Apa itu UUID v4?",
      a: "Pengenal Unik Universal 128-bit dengan bit acak (versi 4), ditulis sebagai 32 digit hex dalam lima kelompok (mis. 550e8400-e29b-41d4-a716-446655440000). Tabrakan sangat tidak mungkin sehingga tiap nilai bisa dianggap unik secara global.",
    },
  },
  {
    en: {
      q: "How random are these values?",
      a: "They come from crypto.getRandomValues via crypto.randomUUID when available, with a manual RFC-4122 v4 fallback using the same CSPRNG. That is the same randomness quality browsers use for their own security features.",
    },
    id: {
      q: "Seberapa acak nilai-nilai ini?",
      a: "Berasal dari crypto.getRandomValues lewat crypto.randomUUID bila tersedia, dengan fallback v4 RFC-4122 manual memakai CSPRNG yang sama. Kualitas keacakannya sama dengan yang dipakai browser untuk fitur keamanannya.",
    },
  },
  {
    en: {
      q: "Are my UUIDs uploaded anywhere?",
      a: "No. Generation, formatting, copy, and download all run entirely in your browser. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah UUID-ku diunggah ke mana pun?",
      a: "Tidak. Pembuatan, pemformatan, penyalinan, dan unduhan berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function fallbackV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] as number).toString(16).padStart(2, "0"));
  }
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function makeUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to manual v4
  }
  return fallbackV4();
}

function formatUuid(raw: string, caseMode: CaseMode, hyphens: boolean): string {
  let v = hyphens ? raw : raw.replace(/-/g, "");
  v = caseMode === "upper" ? v.toUpperCase() : v.toLowerCase();
  return v;
}

function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function UuidPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [count, setCount] = useState("5");
  const [caseMode, setCaseMode] = useState<CaseMode>("lower");
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);

  const handleGenerate = (): void => {
    try {
      const n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        toast.error(s.invalidCount);
        return;
      }
      const next: string[] = [];
      for (let i = 0; i < n; i++) {
        next.push(formatUuid(makeUuid(), caseMode, hyphens));
      }
      setUuids(next);
      toast.success(s.generateOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleCopyOne = (value: string): void => {
    try {
      if (value.length === 0) {
        toast.info(s.emptyInput);
        return;
      }
      void navigator.clipboard
        .writeText(value)
        .then(() => toast.success(s.copied))
        .catch(() => toast.error(s.error));
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setUuids([]);
      toast.success(s.clearOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (kind: "txt" | "json"): void => {
    try {
      if (uuids.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      if (kind === "txt") {
        downloadTextFile("uuids.txt", `${uuids.join("\n")}\n`, "text/plain");
      } else {
        downloadTextFile("uuids.json", JSON.stringify(uuids, null, 2), "application/json");
      }
      toast.success(s.downloadOk);
    } catch {
      toast.error(s.error);
    }
  };

  const allText = uuids.join("\n");

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Hash" slug="developer/uuid" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="uuid-count" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.countLabel}
                </label>
                <input
                  id="uuid-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => {
                    try {
                      setCount(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  className={`mt-2 ${inputCls}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.caseLabel}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                  {(["lower", "upper"] as CaseMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        try {
                          setCaseMode(m);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      aria-pressed={caseMode === m}
                      className={`rounded-lg px-2 py-2 font-mono text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        caseMode === m
                          ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {m === "lower" ? "abc-123" : "ABC-123"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {caseMode === "lower" ? s.lower : s.upper}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.hyphensLabel}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hyphens}
                  onClick={() => {
                    try {
                      setHyphens((v) => !v);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={`mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    hyphens
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                  }`}
                >
                  <span className="font-mono text-xs">{hyphens ? "8-4-4-4-12" : "32 hex"}</span>
                  <span
                    aria-hidden
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hyphens ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${hyphens ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </span>
                </button>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {hyphens ? s.hyphensOn : s.hyphensOff}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button onClick={handleGenerate} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                <Dices aria-hidden />
                {s.generate}
              </Button>
              <Button onClick={handleClear} variant="outline" disabled={uuids.length === 0}>
                <Trash2 aria-hidden />
                {s.clear}
              </Button>
              <CopyButton text={allText} label={s.copyAll} variant="secondary" disabled={uuids.length === 0} copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} />
              <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:grid-cols-1 lg:grid-cols-2 lg:col-span-2 xl:col-span-1 xl:grid-cols-2">
                <Button onClick={() => handleDownload("txt")} variant="outline" disabled={uuids.length === 0} className="sm:col-span-1">
                  <FileText aria-hidden />
                  .txt
                </Button>
                <Button onClick={() => handleDownload("json")} variant="outline" disabled={uuids.length === 0} className="sm:col-span-1">
                  <FileJson aria-hidden />
                  .json
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                UUID v4
              </p>
              {uuids.length > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {uuids.length} {s.generatedCount}
                </Badge>
              )}
            </div>
            {uuids.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {s.empty}
              </p>
            ) : (
              <ul className="max-h-96 space-y-1.5 overflow-auto">
                {uuids.map((u, i) => (
                  <li
                    key={`${u}-${i}`}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-900 sm:text-sm dark:text-zinc-100">
                      {u}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyOne(u)}
                      aria-label={`${s.copy} ${u}`}
                      className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uuids.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button onClick={() => handleDownload("txt")} variant="outline" size="sm">
                  <Download aria-hidden />
                  {s.downloadTxt}
                </Button>
                <Button onClick={() => handleDownload("json")} variant="outline" size="sm">
                  <Download aria-hidden />
                  {s.downloadJson}
                </Button>
                <CopyButton text={allText} label={s.copyAll} size="sm" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
