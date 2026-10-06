"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlignLeft,
  BookOpen,
  CaseSensitive,
  Copy,
  FileText,
  Pilcrow,
  Trash2,
  Type,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    words: string;
    characters: string;
    charactersNoSpaces: string;
    sentences: string;
    paragraphs: string;
    readingTime: string;
    lessThanSec: string;
    copyStats: string;
    statsCopied: string;
    copyFailed: string;
    clear: string;
    cleared: string;
    nothingToCopy: string;
    error: string;
  }
> = {
  en: {
    title: "Word Counter",
    description:
      "Live word, character and reading-time stats as you type. Everything counts instantly in your browser — nothing is uploaded.",
    inputLabel: "Your text",
    inputPlaceholder: "Start typing or paste your text here…",
    words: "Words",
    characters: "Characters",
    charactersNoSpaces: "Characters (no spaces)",
    sentences: "Sentences",
    paragraphs: "Paragraphs",
    readingTime: "Reading time",
    lessThanSec: "< 1 sec",
    copyStats: "Copy stats",
    statsCopied: "Statistics copied to clipboard.",
    copyFailed: "Failed to copy.",
    clear: "Clear",
    cleared: "Text cleared.",
    nothingToCopy: "Type something first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Penghitung Kata (Word Counter)",
    description:
      "Statistik kata, karakter, dan waktu baca langsung saat mengetik. Semua dihitung instan di browser — tidak ada yang diunggah.",
    inputLabel: "Teks Anda",
    inputPlaceholder: "Ketik atau tempel teks Anda di sini…",
    words: "Kata",
    characters: "Karakter",
    charactersNoSpaces: "Karakter (tanpa spasi)",
    sentences: "Kalimat",
    paragraphs: "Paragraf",
    readingTime: "Waktu baca",
    lessThanSec: "< 1 dtk",
    copyStats: "Salin statistik",
    statsCopied: "Statistik disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    clear: "Hapus",
    cleared: "Teks dihapus.",
    nothingToCopy: "Ketik sesuatu terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are words counted?",
      a: "Text is trimmed and split on any whitespace (spaces, tabs, newlines). An empty input counts as 0 words; consecutive whitespace never inflates the count.",
    },
    id: {
      q: "Bagaimana kata dihitung?",
      a: "Teks di-trim lalu dipecah pada whitespace apa pun (spasi, tab, baris baru). Masukan kosong dihitung 0 kata; whitespace beruntun tidak pernah menggelembungkan hitungan.",
    },
  },
  {
    en: {
      q: "How is reading time estimated?",
      a: "Word count is divided by an average adult reading speed of 200 words per minute, shown as minutes and seconds. Anything under a second shows as < 1 sec.",
    },
    id: {
      q: "Bagaimana estimasi waktu baca dihitung?",
      a: "Jumlah kata dibagi kecepatan baca rata-rata orang dewasa 200 kata per menit, ditampilkan sebagai menit dan detik. Durasi di bawah satu detik tampil sebagai < 1 dtk.",
    },
  },
  {
    en: {
      q: "How are sentences and paragraphs detected?",
      a: "Sentences split on runs of . ! ? and empty fragments are dropped; paragraphs split on one or more newlines. Abbreviations like e.g. can inflate the sentence count slightly — that is expected for a fast local heuristic.",
    },
    id: {
      q: "Bagaimana kalimat dan paragraf dideteksi?",
      a: "Kalimat dipecah pada rangkaian . ! ? dan fragmen kosong dibuang; paragraf dipecah pada satu atau lebih baris baru. Singkatan seperti cth. bisa sedikit menambah hitungan kalimat — itu wajar untuk heuristik lokal yang cepat.",
    },
  },
];

function formatReadingTime(words: number, lessThan: string): string {
  if (words === 0) return lessThan;
  const totalSec = (words / 200) * 60;
  if (totalSec < 1) return lessThan;
  const min = Math.floor(totalSec / 60);
  const sec = Math.round(totalSec % 60);
  if (min === 0) return `${sec} sec`;
  return `${min} min ${sec} sec`;
}

export default function WordCounterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [text, setText] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => {
    try {
      const trimmed = text.trim();
      const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
      const characters = text.length;
      const charactersNoSpaces = text.replace(/\s/g, "").length;
      const sentences =
        trimmed === ""
          ? 0
          : trimmed.split(/[.!?]+/).filter((p) => p.trim().length > 0).length;
      const paragraphs =
        trimmed === ""
          ? 0
          : trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length;
      return { words, characters, charactersNoSpaces, sentences, paragraphs };
    } catch {
      return { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0 };
    }
  }, [text]);

  // Auto-resize: grow with content, cap with max-h + scroll.
  useEffect(() => {
    try {
      const el = areaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    } catch {
      // ignore
    }
  }, [text]);

  async function handleCopyStats(): Promise<void> {
    try {
      if (stats.words === 0 && stats.characters === 0) {
        toast.info(s.nothingToCopy);
        return;
      }
      const reading = formatReadingTime(stats.words, s.lessThanSec);
      const lines = [
        `${s.words}: ${stats.words}`,
        `${s.characters}: ${stats.characters}`,
        `${s.charactersNoSpaces}: ${stats.charactersNoSpaces}`,
        `${s.sentences}: ${stats.sentences}`,
        `${s.paragraphs}: ${stats.paragraphs}`,
        `${s.readingTime}: ${reading}`,
      ].join("\n");
      await navigator.clipboard.writeText(lines);
      toast.success(s.statsCopied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleClear(): void {
    try {
      setText("");
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  }

  const cards = [
    { label: s.words, numeric: stats.words, Icon: Type },
    { label: s.characters, numeric: stats.characters, Icon: CaseSensitive },
    { label: s.charactersNoSpaces, numeric: stats.charactersNoSpaces, Icon: AlignLeft },
    { label: s.sentences, numeric: stats.sentences, Icon: FileText },
    { label: s.paragraphs, numeric: stats.paragraphs, Icon: Pilcrow },
    {
      label: s.readingTime,
      text: formatReadingTime(stats.words, s.lessThanSec),
      Icon: BookOpen,
    },
  ];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="AlignLeft"
      slug="text/word-counter"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <label
              htmlFor="wc-input"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {s.inputLabel}
            </label>
            <textarea
              id="wc-input"
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={s.inputPlaceholder}
              rows={8}
              spellCheck
              aria-label={s.inputLabel}
              className="max-h-[480px] min-h-[200px] w-full resize-none overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopyStats()}
                disabled={stats.words === 0 && stats.characters === 0}
                className="flex-1"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {s.copyStats}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={text.length === 0}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite">
          {cards.map(({ label, Icon, ...rest }) => (
            <Card
              key={label}
              className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {label}
                  </span>
                  <span className="block truncate font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {"numeric" in rest ? (
                      <AnimatedNumber value={rest.numeric ?? 0} />
                    ) : (
                      rest.text
                    )}
                  </span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
