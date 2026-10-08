"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser, Link2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with",
  "yang", "dan", "atau", "di", "ke", "dari", "untuk", "dengan", "pada",
  "adalah", "ini", "itu", "sebuah", "oleh",
]);

function slugify(input: string, opts: { lowercase: boolean; separator: string; maxLength: number; stopWords: boolean }): string {
  try {
    let text = input;
    if (opts.lowercase) text = text.toLowerCase();
    try {
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch {
      // keep original when normalize is unavailable
    }
    const words = text.split(/[^a-zA-Z0-9]+/).filter((w) => w.length > 0);
    const kept = opts.stopWords ? words.filter((w) => !STOP_WORDS.has(w.toLowerCase())) : words;
    const sep = opts.separator === "_" ? "_" : "-";
    let slug = kept.join(sep);
    if (opts.maxLength > 0 && slug.length > opts.maxLength) {
      slug = slug.slice(0, opts.maxLength).replace(/[-_]+$/g, "");
    }
    return slug;
  } catch {
    return "";
  }
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    lowercase: string;
    separator: string;
    sepDash: string;
    sepUnderscore: string;
    maxLength: string;
    maxLengthHint: string;
    stopWords: string;
    stopWordsHint: string;
    copy: string;
    clear: string;
    copied: string;
    emptyInput: string;
    error: string;
    chars: string;
  }
> = {
  en: {
    title: "Text to Slug",
    description:
      "Convert titles to URL-friendly slugs with full control over casing, separators, length, and stop-words (EN + ID). Live as you type.",
    inputLabel: "Input",
    inputPlaceholder: "Type a title, e.g. Cara Membuat Kue Coklat yang Enak!…",
    outputLabel: "Slug",
    lowercase: "Lowercase",
    separator: "Separator",
    sepDash: "Dash (-)",
    sepUnderscore: "Underscore (_)",
    maxLength: "Max length (0 = unlimited)",
    maxLengthHint: "Slugs are trimmed at the limit without leaving a trailing separator.",
    stopWords: "Remove stop-words (EN + ID)",
    stopWordsHint: "Removes the, and, of, yang, dan, untuk, …",
    copy: "Copy slug",
    clear: "Clear",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    error: "Something went wrong.",
    chars: "chars",
  },
  id: {
    title: "Teks ke Slug",
    description:
      "Ubah judul menjadi slug ramah-URL dengan kontrol penuh atas huruf, pemisah, panjang, dan stop-word (EN + ID). Langsung saat mengetik.",
    inputLabel: "Masukan",
    inputPlaceholder: "Ketik judul, cth. Cara Membuat Kue Coklat yang Enak!…",
    outputLabel: "Slug",
    lowercase: "Huruf kecil semua",
    separator: "Pemisah",
    sepDash: "Strip (-)",
    sepUnderscore: "Garis bawah (_)",
    maxLength: "Panjang maks (0 = tanpa batas)",
    maxLengthHint: "Slug dipotong pada batas tanpa menyisakan pemisah di ujung.",
    stopWords: "Hapus stop-word (EN + ID)",
    stopWordsHint: "Menghapus the, and, of, yang, dan, untuk, …",
    copy: "Salin slug",
    clear: "Bersihkan",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
    chars: "karakter",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What makes a good URL slug?",
      a: "Short, lowercase, dash-separated words without stop-words: cara-membuat-kue-coklat. Good slugs are readable, keyword-rich, and stable — avoid changing them after publishing or old links break.",
    },
    id: {
      q: "Seperti apa slug URL yang bagus?",
      a: "Pendek, huruf kecil, kata dipisah strip tanpa stop-word: cara-membuat-kue-coklat. Slug yang bagus mudah dibaca, kaya kata kunci, dan stabil — jangan ubah setelah dipublikasikan agar tautan lama tidak rusak.",
    },
  },
  {
    en: {
      q: "Dash or underscore separator?",
      a: "Use dashes. Search engines treat dashes as word separators but underscores as word joiners, so my-post ranks for both words while my_post is read as one token.",
    },
    id: {
      q: "Pemisah strip atau garis bawah?",
      a: "Pakai strip. Mesin pencari menganggap strip sebagai pemisah kata tetapi garis bawah sebagai penyambung, sehingga my-post terindeks untuk kedua kata sedangkan my_post dibaca sebagai satu token.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Slug generation is a pure string operation in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Pembuatan slug adalah operasi string murni di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

export default function SlugifyPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [input, setInput] = useState("");
  const [lowercase, setLowercase] = useState(true);
  const [separator, setSeparator] = useState("-");
  const [maxLength, setMaxLength] = useState(0);
  const [stopWords, setStopWords] = useState(false);

  const slug = useMemo(
    () => slugify(input, { lowercase, separator, maxLength, stopWords }),
    [input, lowercase, separator, maxLength, stopWords],
  );

  const handleMaxLength = (raw: string): void => {
    try {
      const n = parseInt(raw, 10);
      setMaxLength(Number.isNaN(n) || n < 0 ? 0 : Math.min(n, 500));
    } catch {
      // ignore
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Link2" slug="developer/slugify" faq={FAQ}>
      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="slug-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.inputLabel}
              </label>
              <Badge variant="secondary" className="font-mono">
                {input.length} {s.chars}
              </Badge>
            </div>
            <input
              id="slug-in"
              type="text"
              value={input}
              onChange={(e) => {
                try {
                  setInput(e.target.value);
                } catch {
                  // ignore
                }
              }}
              placeholder={s.inputPlaceholder}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => {
                  try {
                    setLowercase(e.target.checked);
                  } catch {
                    // ignore
                  }
                }}
                className="h-4 w-4 shrink-0 accent-indigo-600"
              />
              {s.lowercase}
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={stopWords}
                onChange={(e) => {
                  try {
                    setStopWords(e.target.checked);
                  } catch {
                    // ignore
                  }
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span>
                {s.stopWords}
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">{s.stopWordsHint}</span>
              </span>
            </label>
            <div>
              <label htmlFor="slug-sep" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.separator}
              </label>
              <select
                id="slug-sep"
                value={separator}
                onChange={(e) => {
                  try {
                    setSeparator(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="-">{s.sepDash}</option>
                <option value="_">{s.sepUnderscore}</option>
              </select>
            </div>
            <div>
              <label htmlFor="slug-max" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.maxLength}
              </label>
              <input
                id="slug-max"
                type="number"
                min={0}
                max={500}
                value={maxLength}
                onChange={(e) => handleMaxLength(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.maxLengthHint}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <Link2 className="h-4 w-4" aria-hidden />
                {s.outputLabel}
              </p>
              <Badge variant="secondary" className="font-mono">
                {slug.length} {s.chars}
              </Badge>
            </div>
            <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-indigo-200 bg-indigo-50 p-3 font-mono text-sm break-all whitespace-pre-wrap text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
              {slug}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <CopyButton
              text={slug}
              label={s.copy}
              variant="secondary"
              copiedMessage={s.copied}
              emptyMessage={s.emptyInput}
              errorMessage={s.error}
            />
            <Button
              variant="ghost"
              onClick={() => {
                try {
                  setInput("");
                } catch {
                  toast.error(s.error);
                }
              }}
            >
              <Eraser aria-hidden />
              {s.clear}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ToolLayout>
  );
}
