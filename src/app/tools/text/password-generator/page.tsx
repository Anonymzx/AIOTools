"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import zxcvbn from "zxcvbn";
import { toast } from "sonner";
import { Check, Copy, RefreshCw } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { ToolSteps } from "@/components/ui/tool-steps";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/~";
const AMBIGUOUS = new Set(["I", "l", "1", "O", "0"]);

const SCORE_COLORS = [
  "bg-red-500",
  "bg-red-400",
  "bg-yellow-400",
  "bg-lime-500",
  "bg-emerald-500",
];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    lengthLabel: string;
    charsLabel: string;
    uppercase: string;
    lowercase: string;
    numbers: string;
    symbols: string;
    customLabel: string;
    customPlaceholder: string;
    excludeAmbiguous: string;
    excludeHint: string;
    generate: string;
    regenerate: string;
    copy: string;
    copied: string;
    copyFailed: string;
    minOne: string;
    generated: string;
    outputLabel: string;
    emptyOutput: string;
    strengthLabel: string;
    crackLabel: string;
    historyLabel: string;
    historyHint: string;
    historyCopied: string;
    emptyHistory: string;
    scoreLabels: [string, string, string, string, string];
    error: string;
    stepUpload: string;
    stepProcess: string;
    stepDownload: string;
  }
> = {
  en: {
    title: "Password Generator",
    description:
      "Generate cryptographically secure passwords with a live strength meter. Uses Web Crypto — never Math.random — 100% in your browser.",
    lengthLabel: "Length",
    charsLabel: "Characters",
    uppercase: "Uppercase (A–Z)",
    lowercase: "Lowercase (a–z)",
    numbers: "Numbers (0–9)",
    symbols: "Symbols (!@#…)",
    customLabel: "Custom characters (appended to the pool)",
    customPlaceholder: "e.g. €£¥…",
    excludeAmbiguous: "Exclude ambiguous (Il1O0)",
    excludeHint: "Removes characters that look alike: I, l, 1, O, 0.",
    generate: "Generate",
    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Password copied to clipboard.",
    copyFailed: "Failed to copy.",
    minOne: "Select at least one character set.",
    generated: "New password generated.",
    outputLabel: "Generated password",
    emptyOutput: "Press Generate to create a password.",
    strengthLabel: "Strength",
    crackLabel: "Crack time",
    historyLabel: "History (last 5)",
    historyHint: "Click any entry to copy it.",
    historyCopied: "Copied from history.",
    emptyHistory: "No passwords generated yet.",
    scoreLabels: ["Very weak", "Weak", "Fair", "Strong", "Very strong"],
    error: "Something went wrong.",
    stepUpload: "Setup",
    stepProcess: "Generate",
    stepDownload: "Copy",
  },
  id: {
    title: "Pembuat Password (Password Generator)",
    description:
      "Buat password aman kriptografis dengan meter kekuatan real-time. Memakai Web Crypto — bukan Math.random — 100% di browser Anda.",
    lengthLabel: "Panjang",
    charsLabel: "Karakter",
    uppercase: "Huruf besar (A–Z)",
    lowercase: "Huruf kecil (a–z)",
    numbers: "Angka (0–9)",
    symbols: "Simbol (!@#…)",
    customLabel: "Karakter kustom (ditambahkan ke pool)",
    customPlaceholder: "mis. €£¥…",
    excludeAmbiguous: "Kecualikan ambigu (Il1O0)",
    excludeHint: "Menghapus karakter yang mirip: I, l, 1, O, 0.",
    generate: "Buat",
    regenerate: "Buat ulang",
    copy: "Salin",
    copied: "Password disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    minOne: "Pilih minimal satu set karakter.",
    generated: "Password baru dibuat.",
    outputLabel: "Password yang dibuat",
    emptyOutput: "Tekan Buat untuk membuat password.",
    strengthLabel: "Kekuatan",
    crackLabel: "Waktu retas",
    historyLabel: "Riwayat (5 terakhir)",
    historyHint: "Klik entri mana pun untuk menyalinnya.",
    historyCopied: "Disalin dari riwayat.",
    emptyHistory: "Belum ada password yang dibuat.",
    scoreLabels: ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"],
    error: "Terjadi kesalahan.",
    stepUpload: "Atur",
    stepProcess: "Buat",
    stepDownload: "Salin",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Is this password generator really secure?",
      a: "Yes. Passwords are drawn with crypto.getRandomValues() — the browser's cryptographically secure random source — never Math.random(), which is predictable. Everything runs locally; nothing is sent anywhere.",
    },
    id: {
      q: "Apakah pembuat password ini benar-benar aman?",
      a: "Ya. Password diambil dengan crypto.getRandomValues() — sumber acak aman kriptografis dari browser — bukan Math.random() yang bisa diprediksi. Semuanya berjalan lokal; tidak ada yang dikirim ke mana pun.",
    },
  },
  {
    en: {
      q: "What does the strength meter measure?",
      a: "The live meter uses zxcvbn, the industry-standard estimator: it checks your password against common passwords, dictionary words, keyboard patterns, and repetitions, then estimates crack time. Aim for score 3–4 (green) with 16+ characters.",
    },
    id: {
      q: "Apa yang diukur oleh meter kekuatan?",
      a: "Meter real-time memakai zxcvbn, estimator standar industri: memeriksa password terhadap password umum, kata kamus, pola keyboard, dan pengulangan, lalu mengestimasi waktu retas. Targetkan skor 3–4 (hijau) dengan 16+ karakter.",
    },
  },
  {
    en: {
      q: "Why exclude ambiguous characters?",
      a: "Characters like I, l, 1, O, and 0 look identical in many fonts, which causes typos when passwords are read or typed manually. Excluding them slightly shrinks the pool but makes passwords much easier to transcribe correctly.",
    },
    id: {
      q: "Mengapa mengecualikan karakter ambigu?",
      a: "Karakter seperti I, l, 1, O, dan 0 terlihat identik di banyak font, sehingga rawan salah ketik saat password dibaca atau diketik manual. Mengecualikannya sedikit memperkecil pool tetapi membuat password jauh lebih mudah disalin dengan benar.",
    },
  },
  {
    en: {
      q: "How long should my password be?",
      a: "16 characters from all four sets is a solid default for most accounts. For master passwords and crypto wallets, use 24–32+ characters. Longer always beats more complex — each extra character multiplies the search space.",
    },
    id: {
      q: "Berapa panjang password yang ideal?",
      a: "16 karakter dari keempat set sudah solid untuk kebanyakan akun. Untuk password master dan dompet kripto, gunakan 24–32+ karakter. Lebih panjang selalu mengalahkan lebih kompleks — setiap karakter tambahan melipatgandakan ruang pencarian.",
    },
  },
];

function secureRandomInt(max: number): number {
  // Unbiased rejection sampling on top of Web Crypto.
  const range = 0xffffffff;
  const limit = range - (range % max);
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0] as number;
  } while (x >= limit);
  return x % max;
}

export default function PasswordGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [customChars, setCustomChars] = useState("");
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const pool = useMemo(() => {
    try {
      let p = "";
      if (upper) p += UPPER;
      if (lower) p += LOWER;
      if (numbers) p += NUMBERS;
      if (symbols) p += SYMBOLS;
      p += customChars;
      if (excludeAmbiguous) p = p.split("").filter((c) => !AMBIGUOUS.has(c)).join("");
      return p;
    } catch {
      return "";
    }
  }, [upper, lower, numbers, symbols, customChars, excludeAmbiguous]);

  const hasSet = upper || lower || numbers || symbols || customChars.length > 0;
  const stage: 0 | 1 | 2 | 3 = password ? 3 : 0;

  const generate = useCallback(() => {
    try {
      if (!hasSet || pool.length === 0) {
        toast.error(s.minOne);
        return;
      }
      let out = "";
      for (let i = 0; i < length; i++) out += pool[secureRandomInt(pool.length)];
      setPassword(out);
      setHistory((prev) => [out, ...prev].slice(0, 5));
      toast.success(s.generated);
    } catch {
      toast.error(s.error);
    }
  }, [hasSet, pool, length, s]);

  // Generate once on mount so the page never looks empty.
  useEffect(() => {
    try {
      const p = UPPER + LOWER + NUMBERS + SYMBOLS;
      let out = "";
      for (let i = 0; i < 16; i++) out += p[secureRandomInt(p.length)];
      setPassword(out);
      setHistory([out]);
    } catch {
      // ignore — user can press Generate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo(() => {
    try {
      if (!password) return null;
      return zxcvbn(password);
    } catch {
      return null;
    }
  }, [password]);

  async function handleCopy(text: string, msg: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleLengthChange(v: number): void {
    try {
      const clamped = Math.min(64, Math.max(8, Math.floor(v) || 8));
      setLength(clamped);
    } catch {
      toast.error(s.error);
    }
  }

  const checks = [
    { label: s.uppercase, value: upper, set: setUpper },
    { label: s.lowercase, value: lower, set: setLower },
    { label: s.numbers, value: numbers, set: setNumbers },
    { label: s.symbols, value: symbols, set: setSymbols },
  ];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Lock"
      slug="text/password-generator"
      faq={FAQ}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ToolSteps stage={stage} labels={[s.stepUpload, s.stepProcess, s.stepDownload]} />
        </div>
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="pw-length"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.lengthLabel}
                </label>
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {length} {s.charsLabel.toLowerCase()}
                </Badge>
              </div>
              <input
                id="pw-length"
                type="range"
                min={8}
                max={64}
                step={1}
                value={length}
                onChange={(e) => handleLengthChange(Number(e.target.value))}
                aria-label={s.lengthLabel}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.charsLabel}
              </legend>
              {checks.map((c) => (
                <label
                  key={c.label}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={c.value}
                    onChange={(e) => c.set(e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-indigo-600"
                  />
                  <span className="font-mono">{c.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="pw-custom"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.customLabel}
              </label>
              <input
                id="pw-custom"
                type="text"
                value={customChars}
                onChange={(e) => setCustomChars(e.target.value)}
                placeholder={s.customPlaceholder}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {s.excludeAmbiguous}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {s.excludeHint}
                </span>
              </span>
            </label>

            <Button
              type="button"
              onClick={generate}
              size="lg"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              <RefreshCw aria-hidden />
              {s.generate}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.outputLabel}
              </span>
              <div
                className={cn(
                  "break-all rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-base leading-relaxed dark:border-zinc-800 dark:bg-zinc-950",
                  !password && "text-sm text-zinc-400 dark:text-zinc-500",
                )}
                aria-live="polite"
              >
                {password || s.emptyOutput}
              </div>

              {result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {s.strengthLabel}: {s.scoreLabels[result.score]}
                    </span>
                    <Badge
                      variant={result.score >= 3 ? "default" : "secondary"}
                      className="font-mono"
                    >
                      {result.score}/4
                    </Badge>
                  </div>
                  <div
                    className="flex gap-1"
                    role="img"
                    aria-label={`${s.strengthLabel}: ${s.scoreLabels[result.score]} (${result.score}/4)`}
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-2 flex-1 rounded-full",
                          i <= result.score
                            ? SCORE_COLORS[result.score]
                            : "bg-zinc-200 dark:bg-zinc-800",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s.crackLabel}:{" "}
                    <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {result.crack_times_display.offline_slow_hashing_1e4_per_second}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <CopyButton
                  text={password}
                  label={s.copy}
                  disabled={!password}
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyOutput}
                  errorMessage={s.copyFailed}
                />
                <Button type="button" onClick={generate} className="flex-1">
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {s.regenerate}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-2 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.historyLabel}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.historyHint}
                </span>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">{s.emptyHistory}</p>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((h, i) => (
                    <li key={`${i}-${h.slice(0, 8)}`}>
                      <button
                        type="button"
                        onClick={() => void handleCopy(h, s.historyCopied)}
                        title={s.historyHint}
                        className="group flex w-full items-center gap-2 truncate rounded-lg border border-zinc-200 px-3 py-2 text-left font-mono text-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
                      >
                        <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
                          {h}
                        </span>
                        {i === 0 ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            <Check className="h-3 w-3" aria-hidden />
                          </Badge>
                        ) : (
                          <Copy
                            className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
