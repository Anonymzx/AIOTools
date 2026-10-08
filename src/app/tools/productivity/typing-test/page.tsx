"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    source: string;
    bank: string;
    custom: string;
    customPh: string;
    duration: string;
    seconds: string;
    newText: string;
    restart: string;
    startHint: string;
    wpm: string;
    cpm: string;
    accuracy: string;
    timeLeft: string;
    progress: string;
    results: string;
    correct: string;
    wrong: string;
    typed: string;
    spark: string;
    finished: string;
    emptyCustom: string;
    error: string;
    enterRestart: string;
  }
> = {
  en: {
    title: "Typing Speed Test",
    description:
      "Measure WPM, CPM, and accuracy with live per-character feedback, a results dashboard, and a WPM sparkline. English + Indonesian texts included.",
    source: "Text source",
    bank: "Built-in paragraph",
    custom: "Custom text",
    customPh: "Paste or type your own text here (min 20 characters)…",
    duration: "Duration",
    seconds: "seconds",
    newText: "New text",
    restart: "Restart",
    startHint: "Click the box below and start typing — the timer begins on your first keystroke.",
    wpm: "WPM",
    cpm: "CPM",
    accuracy: "Accuracy",
    timeLeft: "Time left",
    progress: "Progress",
    results: "Results",
    correct: "Correct",
    wrong: "Errors",
    typed: "Typed",
    spark: "WPM every 10s",
    finished: "Time's up — great effort!",
    emptyCustom: "Custom text needs at least 20 characters.",
    error: "Something went wrong.",
    enterRestart: "Press Enter to try again.",
  },
  id: {
    title: "Tes Kecepatan Mengetik",
    description:
      "Ukur WPM, CPM, dan akurasi dengan umpan balik per karakter live, dasbor hasil, dan sparkline WPM. Teks Inggris + Indonesia tersedia.",
    source: "Sumber teks",
    bank: "Paragraf bawaan",
    custom: "Teks kustom",
    customPh: "Tempel atau ketik teks sendiri di sini (min 20 karakter)…",
    duration: "Durasi",
    seconds: "detik",
    newText: "Teks baru",
    restart: "Ulangi",
    startHint: "Klik kotak di bawah lalu mulai mengetik — timer berjalan sejak ketikan pertama.",
    wpm: "WPM",
    cpm: "CPM",
    accuracy: "Akurasi",
    timeLeft: "Sisa waktu",
    progress: "Progres",
    results: "Hasil",
    correct: "Benar",
    wrong: "Salah",
    typed: "Diketik",
    spark: "WPM tiap 10 dtk",
    finished: "Waktu habis — usaha yang bagus!",
    emptyCustom: "Teks kustom butuh minimal 20 karakter.",
    error: "Terjadi kesalahan.",
    enterRestart: "Tekan Enter untuk mencoba lagi.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are WPM and accuracy calculated?",
      a: "WPM is (correct characters / 5) divided by elapsed minutes; CPM is correct characters per minute. Accuracy is correct characters divided by total typed characters, computed live as you type.",
    },
    id: {
      q: "Bagaimana WPM dan akurasi dihitung?",
      a: "WPM adalah (karakter benar / 5) dibagi menit berjalan; CPM adalah karakter benar per menit. Akurasi adalah karakter benar dibagi total karakter yang diketik, dihitung live saat Anda mengetik.",
    },
  },
  {
    en: {
      q: "When does the timer start?",
      a: "On your very first keystroke in the typing box. Changing duration, language, or text resets the test so every attempt is measured fairly.",
    },
    id: {
      q: "Kapan timer mulai?",
      a: "Pada ketikan pertama Anda di kotak mengetik. Mengganti durasi, bahasa, atau teks akan mengatur ulang tes agar setiap percobaan terukur adil.",
    },
  },
  {
    en: {
      q: "Is my typing sent anywhere?",
      a: "No. The paragraph bank, keystroke comparison, statistics, and sparkline all run locally in your browser.",
    },
    id: {
      q: "Apakah ketikan saya dikirim ke mana pun?",
      a: "Tidak. Bank paragraf, perbandingan ketikan, statistik, dan sparkline semuanya berjalan lokal di browser Anda.",
    },
  },
];

const BANK_EN: string[] = [
  "The morning sun warmed the quiet village as children walked to school with bright smiles and heavy bags full of books and dreams about the future they wanted to build together.",
  "Technology changes how people work every single day, yet the most important skill remains the ability to focus deeply, think clearly, and communicate ideas with honesty and care.",
  "A small river flowed behind the old house where grandmother planted mango trees many years ago, and now their sweet fruit brings the whole family home every harvest season.",
];

const BANK_ID: string[] = [
  "Pagi hari yang cerah membuat anak-anak berangkat ke sekolah dengan semangat baru membawa tas berisi buku dan mimpi besar tentang masa depan yang ingin mereka raih bersama.",
  "Teknologi mengubah cara orang bekerja setiap hari, tetapi kemampuan terpenting tetaplah fokus yang dalam, berpikir jernih, serta menyampaikan gagasan dengan jujur dan peduli.",
  "Sungai kecil mengalir di belakang rumah tua tempat nenek menanam pohon mangga bertahun-tahun lalu, dan kini buahnya yang manis selalu membawa seluruh keluarga pulang setiap musim panen.",
];

type Mode = "bank" | "custom";
type BankLang = "en" | "id";

export default function TypingTestPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [mode, setMode] = useState<Mode>("bank");
  const [bankLang, setBankLang] = useState<BankLang>("en");
  const [bankIndex, setBankIndex] = useState(0);
  const [customText, setCustomText] = useState("");
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [snapshots, setSnapshots] = useState<number[]>([]);
  const elapsedRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const bank = bankLang === "en" ? BANK_EN : BANK_ID;
  const target = useMemo(() => {
    if (mode === "custom") return customText.trim();
    return bank[bankIndex % bank.length] as string;
  }, [mode, customText, bank, bankIndex]);

  const reset = (nextDuration: number): void => {
    setTimeLeft(nextDuration);
    setTyped("");
    setStarted(false);
    setFinished(false);
    setSnapshots([]);
    elapsedRef.current = 0;
  };

  const handleNewText = (): void => {
    try {
      const list = bankLang === "en" ? BANK_EN : BANK_ID;
      setBankIndex((i) => (i + 1) % list.length);
      reset(duration);
      inputRef.current?.focus();
    } catch {
      toast.error(s.error);
    }
  };

  // 1s ticker — only while running; cleanup on unmount or stop.
  useEffect(() => {
    if (!started || finished) return undefined;
    try {
      const id = window.setInterval(() => {
        try {
          elapsedRef.current += 1;
          setTimeLeft((prev) => {
            if (prev <= 1) {
              window.clearInterval(id);
              setFinished(true);
              return 0;
            }
            return prev - 1;
          });
          if (elapsedRef.current % 10 === 0) {
            setTyped((cur) => {
              const mins = elapsedRef.current / 60;
              let correct = 0;
              for (let i = 0; i < cur.length && i < target.length; i += 1) {
                if (cur[i] === target[i]) correct += 1;
              }
              const wpm = mins > 0 ? Math.round(correct / 5 / mins) : 0;
              setSnapshots((prev) => [...prev.slice(-11), wpm]);
              return cur;
            });
          }
        } catch {
          // ignore tick errors
        }
      }, 1000);
      return () => window.clearInterval(id);
    } catch {
      return undefined;
    }
  }, [started, finished, target]);

  // Enter restarts a finished test.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      try {
        if (finished && e.key === "Enter") {
          e.preventDefault();
          reset(duration);
          inputRef.current?.focus();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, duration]);

  const stats = useMemo(() => {
    try {
      let correct = 0;
      const n = Math.min(typed.length, target.length);
      for (let i = 0; i < n; i += 1) {
        if (typed[i] === target[i]) correct += 1;
      }
      const mins = elapsedRef.current > 0 ? elapsedRef.current / 60 : 0;
      const wpm = mins > 0 ? Math.round(correct / 5 / mins) : 0;
      const cpm = mins > 0 ? Math.round(correct / mins) : 0;
      const acc = typed.length > 0 ? (correct / typed.length) * 100 : 100;
      return { correct, wrong: typed.length - correct, wpm, cpm, acc };
    } catch {
      return { correct: 0, wrong: 0, wpm: 0, cpm: 0, acc: 100 };
    }
  }, [typed, target]);

  // Live tick re-render for stats: mirror timeLeft into elapsed via a second counter.
  const elapsed = duration - timeLeft;

  const onType = (value: string): void => {
    try {
      if (finished) return;
      if (mode === "custom" && customText.trim().length < 20) {
        toast.error(s.emptyCustom);
        return;
      }
      if (value.length > target.length + 20) return;
      if (!started && value.length > 0) setStarted(true);
      setTyped(value);
      if (value.length >= target.length) {
        setFinished(true);
      }
    } catch {
      toast.error(s.error);
    }
  };

  const sparkMax = Math.max(10, ...snapshots, stats.wpm);
  const sparkPoints: string[] = [];
  const all = [...snapshots, stats.wpm];
  for (let i = 0; i < all.length; i += 1) {
    const x = all.length === 1 ? 0 : (i / (all.length - 1)) * 280;
    const y = 56 - ((all[i] as number) / sparkMax) * 52;
    sparkPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const selCls =
    "rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Gauge"
      slug="productivity/typing-test"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="flex flex-wrap items-end gap-3 p-4 sm:p-6">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {s.source}
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={mode === "bank" ? "default" : "outline"}
                  onClick={() => {
                    try {
                      setMode("bank");
                      reset(duration);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.bank}
                </Button>
                <Button
                  size="sm"
                  variant={mode === "custom" ? "default" : "outline"}
                  onClick={() => {
                    try {
                      setMode("custom");
                      reset(duration);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.custom}
                </Button>
              </div>
            </div>
            {mode === "bank" && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {bankLang === "en" ? "English" : "Indonesia"}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={bankLang === "en" ? "default" : "outline"}
                    onClick={() => {
                      try {
                        setBankLang("en");
                        setBankIndex(0);
                        reset(duration);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                  >
                    EN
                  </Button>
                  <Button
                    size="sm"
                    variant={bankLang === "id" ? "default" : "outline"}
                    onClick={() => {
                      try {
                        setBankLang("id");
                        setBankIndex(0);
                        reset(duration);
                      } catch {
                        toast.error(s.error);
                      }
                    }}
                  >
                    ID
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleNewText}>
                    {s.newText}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label
                htmlFor="tt-duration"
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                {s.duration} ({s.seconds})
              </label>
              <select
                id="tt-duration"
                value={duration}
                onChange={(e) => {
                  try {
                    const v = Number(e.target.value);
                    setDuration(v);
                    reset(v);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={selCls}
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={120}>120</option>
              </select>
            </div>
            <div className="ms-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    reset(duration);
                    inputRef.current?.focus();
                  } catch {
                    toast.error(s.error);
                  }
                }}
              >
                {s.restart}
              </Button>
            </div>
          </CardContent>
        </Card>

        {mode === "custom" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <textarea
                value={customText}
                onChange={(e) => {
                  try {
                    setCustomText(e.target.value);
                    reset(duration);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                placeholder={s.customPh}
                rows={3}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: s.wpm, value: String(stats.wpm) },
            { label: s.cpm, value: String(stats.cpm) },
            { label: s.accuracy, value: `${stats.acc.toFixed(1)}%` },
            { label: s.timeLeft, value: `${timeLeft}s` },
          ].map((k) => (
            <Card
              key={k.label}
              className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <CardContent className="p-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {k.label}
                </p>
                <p
                  className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50"
                  aria-live="polite"
                >
                  {k.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.startHint}</p>
            <div
              aria-label={s.progress}
              className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all dark:bg-indigo-500"
                style={{
                  width: `${target.length > 0 ? Math.min(100, (typed.length / target.length) * 100) : 0}%`,
                }}
              />
            </div>
            <div
              aria-live="polite"
              className="rounded-xl bg-zinc-50 p-4 font-mono text-base leading-8 tracking-wide dark:bg-zinc-950"
            >
              {target.length === 0 ? (
                <span className="font-sans text-sm text-zinc-400">{s.customPh}</span>
              ) : (
                target.split("").map((ch, i) => {
                  let cls = "text-zinc-400 dark:text-zinc-500";
                  if (i < typed.length) {
                    cls =
                      typed[i] === ch
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "rounded bg-red-500/20 text-red-600 dark:text-red-400";
                  } else if (i === typed.length && !finished) {
                    cls =
                      "rounded bg-indigo-500/20 text-zinc-900 underline decoration-indigo-500 decoration-2 underline-offset-4 dark:text-zinc-100";
                  }
                  return (
                    <span key={i} className={cls}>
                      {ch}
                    </span>
                  );
                })
              )}
            </div>
            <textarea
              ref={inputRef}
              value={typed}
              disabled={finished || target.length === 0}
              onChange={(e) => onType(e.target.value)}
              placeholder={s.startHint}
              rows={2}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
            {finished && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {s.finished} {s.enterRestart}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {s.correct}: <b className="tabular-nums">{stats.correct}</b>
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {s.wrong}: <b className="tabular-nums">{stats.wrong}</b>
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {s.typed}: <b className="tabular-nums">{typed.length}</b>
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {s.spark} ({s.seconds}: {elapsed}s)
                  </p>
                  <svg
                    viewBox="0 0 280 60"
                    className="mt-1 w-full rounded-lg bg-white dark:bg-zinc-900"
                    role="img"
                    aria-label={s.spark}
                  >
                    <polyline
                      points={sparkPoints.join(" ")}
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="stroke-indigo-600 dark:stroke-indigo-400"
                    />
                  </svg>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => {
                    try {
                      reset(duration);
                      inputRef.current?.focus();
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                >
                  {s.restart}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
