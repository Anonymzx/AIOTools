"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dices, Download, Eraser } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GenType = "paragraphs" | "sentences" | "words" | "lists";
type Lang = "latin" | "english" | "indonesian";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    typeLabel: string;
    paragraphs: string;
    sentences: string;
    words: string;
    lists: string;
    countLabel: string;
    classicLabel: string;
    classicHint: string;
    htmlLabel: string;
    htmlHint: string;
    langLabel: string;
    latin: string;
    english: string;
    indonesian: string;
    regenerate: string;
    download: string;
    clear: string;
    copy: string;
    copied: string;
    emptyInput: string;
    invalidCount: string;
    regenerateOk: string;
    downloadOk: string;
    clearOk: string;
    error: string;
    outputTitle: string;
    wordsCount: string;
  }
> = {
  en: {
    title: "Lorem Ipsum Generator",
    description:
      "Generate placeholder text for designs and drafts. Paragraphs, sentences, words, or lists — in Latin, English, or Indonesian — all from built-in word banks, locally in your browser.",
    typeLabel: "Type",
    paragraphs: "Paragraphs",
    sentences: "Sentences",
    words: "Words",
    lists: "Lists",
    countLabel: "Count (1–100)",
    classicLabel: 'Start with classic "Lorem ipsum…"',
    classicHint: "First sentence begins with the traditional opening.",
    htmlLabel: "Wrap in HTML tags",
    htmlHint: "Paragraphs in <p>, list items in <ul><li>.",
    langLabel: "Language",
    latin: "Latin",
    english: "English",
    indonesian: "Indonesian",
    regenerate: "Regenerate",
    download: "Download .txt",
    clear: "Clear",
    copy: "Copy",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    invalidCount: "Count must be a whole number between 1 and 100.",
    regenerateOk: "New text generated.",
    downloadOk: "File downloaded.",
    clearOk: "Cleared.",
    error: "Something went wrong.",
    outputTitle: "Output",
    wordsCount: "words",
  },
  id: {
    title: "Generator Lorem Ipsum",
    description:
      "Buat teks placeholder untuk desain dan draf. Paragraf, kalimat, kata, atau daftar — dalam Latin, Inggris, atau Indonesia — semua dari bank kata bawaan, lokal di browser.",
    typeLabel: "Jenis",
    paragraphs: "Paragraf",
    sentences: "Kalimat",
    words: "Kata",
    lists: "Daftar",
    countLabel: "Jumlah (1–100)",
    classicLabel: 'Awali dengan "Lorem ipsum…" klasik',
    classicHint: "Kalimat pertama diawali pembuka tradisional.",
    htmlLabel: "Bungkus dengan tag HTML",
    htmlHint: "Paragraf dalam <p>, item daftar dalam <ul><li>.",
    langLabel: "Bahasa",
    latin: "Latin",
    english: "Inggris",
    indonesian: "Indonesia",
    regenerate: "Buat ulang",
    download: "Unduh .txt",
    clear: "Bersihkan",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    invalidCount: "Jumlah harus bilangan bulat antara 1 dan 100.",
    regenerateOk: "Teks baru dibuat.",
    downloadOk: "File berhasil diunduh.",
    clearOk: "Dibersihkan.",
    error: "Terjadi kesalahan.",
    outputTitle: "Keluaran",
    wordsCount: "kata",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What is Lorem Ipsum used for?",
      a: "It is placeholder text that holds layout space while real copy is not ready, so designers and reviewers judge spacing, rhythm, and hierarchy without being distracted by readable content.",
    },
    id: {
      q: "Lorem Ipsum dipakai untuk apa?",
      a: "Ia teks pengganti yang mengisi ruang tata letak selagi tulisan asli belum siap, agar desainer dan peninjau menilai spasi, ritme, dan hierarki tanpa terdistraksi konten yang terbaca.",
    },
  },
  {
    en: {
      q: "Where does the text come from?",
      a: "From small word banks built into this page (Latin, English, Indonesian) combined with a seeded random picker. No library or network request is involved, so output is instant and private.",
    },
    id: {
      q: "Teksnya berasal dari mana?",
      a: "Dari bank kata kecil yang tertanam di halaman ini (Latin, Inggris, Indonesia) yang digabung pemilih acak berbibit. Tanpa library atau permintaan jaringan, sehingga keluaran instan dan privat.",
    },
  },
  {
    en: {
      q: "Is my output sent anywhere?",
      a: "No. Generation, copy, and download all run entirely in your browser. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah hasilku dikirim ke mana pun?",
      a: "Tidak. Pembuatan, penyalinan, dan unduhan berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const CLASSIC = ["lorem", "ipsum", "dolor", "sit", "amet"];

const BANKS: Record<Lang, string[]> = {
  latin: [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
    "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
    "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum", "perspiciatis", "unde", "omnis", "iste", "natus", "accusantium", "doloremque", "laudantium",
  ],
  english: [
    "quick", "bright", "silent", "river", "mountain", "garden", "window", "morning", "journey", "lantern",
    "harbor", "meadow", "thunder", "feather", "compass", "orchard", "bridge", "candle", "forest", "summit",
    "wander", "gather", "build", "paint", "follow", "discover", "wander", "shine", "echo", "drift",
    "amber", "crimson", "golden", "misty", "gentle", "sturdy", "vivid", "calm", "eager", "patient",
    "above", "below", "through", "across", "beyond", "within", "along", "toward", "between", "around",
    "story", "moment", "season", "pattern", "signal", "horizon", "trail", "village", "harvest", "breeze",
  ],
  indonesian: [
    "pagi", "sore", "jalan", "rumah", "taman", "sungai", "gunung", "pantai", "angin", "hujan",
    "cerita", "langkah", "cahaya", "bayang", "suara", "warna", "rasa", "waktu", "mimpi", "harap",
    "berjalan", "berlari", "melihat", "mendengar", "menulis", "menggambar", "membangun", "menanam", "menuai", "bernyanyi",
    "indah", "tenang", "ramai", "hangat", "sejuk", "terang", "gelap", "luas", "sempit", "tinggi",
    "di", "ke", "dari", "untuk", "dengan", "tanpa", "antara", "selama", "setelah", "sebelum",
    "kota", "desa", "pasar", "sekolah", "kantor", "ladang", "hutan", "danau", "pulau", "awan",
  ],
};

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildText(type: GenType, count: number, lang: Lang, classic: boolean, seed: number): string[] {
  const rand = mulberry32(seed);
  const bank = BANKS[lang];
  const pick = (): string => bank[Math.floor(rand() * bank.length)] as string;
  const sentence = (first: boolean): string => {
    const len = 6 + Math.floor(rand() * 9);
    const words: string[] = [];
    for (let i = 0; i < len; i++) {
      if (first && classic && i < CLASSIC.length) {
        words.push(CLASSIC[i] as string);
      } else {
        words.push(pick());
      }
    }
    return `${capitalize(words.join(" "))}.`;
  };
  if (type === "words") {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      if (classic && i < CLASSIC.length) words.push(CLASSIC[i] as string);
      else words.push(pick());
    }
    return [words.join(" ")];
  }
  if (type === "sentences") {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(sentence(i === 0));
    return [out.join(" ")];
  }
  if (type === "lists") {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const len = 3 + Math.floor(rand() * 5);
      const words: string[] = [];
      for (let j = 0; j < len; j++) {
        if (classic && i === 0 && j < CLASSIC.length) words.push(CLASSIC[j] as string);
        else words.push(pick());
      }
      out.push(capitalize(words.join(" ")));
    }
    return out;
  }
  const paras: string[] = [];
  for (let p = 0; p < count; p++) {
    const nSent = 4 + Math.floor(rand() * 4);
    const sents: string[] = [];
    for (let i = 0; i < nSent; i++) sents.push(sentence(p === 0 && i === 0));
    paras.push(sents.join(" "));
  }
  return paras;
}

function toDisplay(blocks: string[], type: GenType, html: boolean): string {
  if (!html) {
    if (type === "lists") return blocks.map((b) => `• ${b}`).join("\n");
    return blocks.join("\n\n");
  }
  if (type === "lists") {
    return `<ul>\n${blocks.map((b) => `  <li>${b}</li>`).join("\n")}\n</ul>`;
  }
  if (type === "words") return `<p>${blocks[0] ?? ""}</p>`;
  if (type === "sentences") return `<p>${blocks[0] ?? ""}</p>`;
  return blocks.map((b) => `<p>${b}</p>`).join("\n\n");
}

function countWords(text: string): number {
  const m = text.trim().split(/\s+/).filter((w) => w.length > 0);
  return text.trim().length === 0 ? 0 : m.length;
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

function Toggle({
  checked,
  onToggle,
  label,
  hint,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  hint: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
        checked
          ? "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        <span className="block font-mono text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

export default function LoremPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [type, setType] = useState<GenType>("paragraphs");
  const [count, setCount] = useState("3");
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [lang, setLang] = useState<Lang>("latin");
  const [seed, setSeed] = useState(1);
  const [visible, setVisible] = useState(true);

  const parsedCount = useMemo(() => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 100) return null;
    return n;
  }, [count]);

  const output = useMemo(() => {
    if (!visible || parsedCount === null) return "";
    try {
      const key = `${type}|${parsedCount}|${lang}|${classic ? 1 : 0}|${seed}`;
      const blocks = buildText(type, parsedCount, lang, classic, hashSeed(key));
      return toDisplay(blocks, type, html);
    } catch {
      return "";
    }
  }, [type, parsedCount, lang, classic, html, seed, visible]);

  const handleRegenerate = (): void => {
    try {
      if (parsedCount === null) {
        toast.error(s.invalidCount);
        return;
      }
      setVisible(true);
      setSeed((v) => v + 1);
      toast.success(s.regenerateOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      if (output.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "lorem-ipsum.txt";
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
      toast.success(s.downloadOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setVisible(false);
      toast.success(s.clearOk);
    } catch {
      toast.error(s.error);
    }
  };

  const typeTabs: Array<{ id: GenType; label: string }> = [
    { id: "paragraphs", label: s.paragraphs },
    { id: "sentences", label: s.sentences },
    { id: "words", label: s.words },
    { id: "lists", label: s.lists },
  ];
  const langTabs: Array<{ id: Lang; label: string }> = [
    { id: "latin", label: s.latin },
    { id: "english", label: s.english },
    { id: "indonesian", label: s.indonesian },
  ];

  return (
    <ToolLayout title={s.title} description={s.description} iconName="AlignLeft" slug="developer/lorem" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.typeLabel}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-950">
                {typeTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      try {
                        setType(t.id);
                        setVisible(true);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                    aria-pressed={type === t.id}
                    className={`rounded-lg px-2 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                      type === t.id
                        ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lorem-count" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.countLabel}
                </label>
                <input
                  id="lorem-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => {
                    try {
                      setCount(e.target.value);
                      setVisible(true);
                    } catch {
                      // ignore
                    }
                  }}
                  className={`mt-2 ${inputCls}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.langLabel}</p>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                  {langTabs.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        try {
                          setLang(l.id);
                          setVisible(true);
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      aria-pressed={lang === l.id}
                      className={`rounded-lg px-1 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:text-sm ${
                        lang === l.id
                          ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Toggle checked={classic} onToggle={() => {
                try {
                  setClassic((v) => !v);
                  setVisible(true);
                } catch {
                  toast.error(s.error);
                }
              }} label={s.classicLabel} hint={s.classicHint} />
              <Toggle checked={html} onToggle={() => {
                try {
                  setHtml((v) => !v);
                  setVisible(true);
                } catch {
                  toast.error(s.error);
                }
              }} label={s.htmlLabel} hint={s.htmlHint} />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button onClick={handleRegenerate} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                <Dices aria-hidden />
                {s.regenerate}
              </Button>
              <CopyButton text={output} label={s.copy} variant="secondary" disabled={output.length === 0} copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} />
              <Button onClick={handleDownload} variant="outline" disabled={output.length === 0}>
                <Download aria-hidden />
                .txt
              </Button>
              <Button onClick={handleClear} variant="ghost" disabled={output.length === 0}>
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.outputTitle}</p>
              {output.length > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {countWords(output)} {s.wordsCount}
                </Badge>
              )}
            </div>
            <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
              {parsedCount === null ? s.invalidCount : output}
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
