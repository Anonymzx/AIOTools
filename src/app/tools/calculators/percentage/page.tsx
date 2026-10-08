"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Mode = "of" | "is" | "change";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    modeOf: string;
    modeIs: string;
    modeChange: string;
    ofX: string;
    ofY: string;
    isX: string;
    isY: string;
    changeFrom: string;
    changeTo: string;
    result: string;
    formula: string;
    copyResult: string;
    copied: string;
    copyFailed: string;
    empty: string;
    invalid: string;
    error: string;
  }
> = {
  en: {
    title: "Percentage Calculator",
    description:
      "Three instant percentage modes — X% of Y, X is what % of Y, and % change. Live results with formulas, 100% in your browser.",
    modeOf: "X% of Y",
    modeIs: "X is what % of Y?",
    modeChange: "% change X → Y",
    ofX: "Percentage (X %)",
    ofY: "Base value (Y)",
    isX: "Part (X)",
    isY: "Whole (Y)",
    changeFrom: "From (X)",
    changeTo: "To (Y)",
    result: "Result",
    formula: "Formula",
    copyResult: "Copy result",
    copied: "Result copied to clipboard.",
    copyFailed: "Failed to copy.",
    empty: "Enter numbers to see the live result.",
    invalid: "Enter valid numbers (Y cannot be 0 here).",
    error: "Something went wrong.",
  },
  id: {
    title: "Kalkulator Persen (Percentage Calculator)",
    description:
      "Tiga mode persen instan — X% dari Y, X adalah berapa % dari Y, dan % perubahan. Hasil live beserta rumus, 100% di browser.",
    modeOf: "X% dari Y",
    modeIs: "X adalah berapa % dari Y?",
    modeChange: "% perubahan X → Y",
    ofX: "Persentase (X %)",
    ofY: "Nilai dasar (Y)",
    isX: "Bagian (X)",
    isY: "Keseluruhan (Y)",
    changeFrom: "Dari (X)",
    changeTo: "Ke (Y)",
    result: "Hasil",
    formula: "Rumus",
    copyResult: "Salin hasil",
    copied: "Hasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    empty: "Masukkan angka untuk melihat hasil live.",
    invalid: "Masukkan angka yang valid (Y tidak boleh 0 di sini).",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What are the three percentage modes?",
      a: "“X% of Y” computes (X/100)×Y, e.g. 20% of 150 = 30. “X is what % of Y” computes (X/Y)×100, e.g. 30 is 20% of 150. “% change” computes ((Y−X)/|X|)×100, e.g. 100 → 150 is a +50% change.",
    },
    id: {
      q: "Apa tiga mode persen tersebut?",
      a: "“X% dari Y” menghitung (X/100)×Y, mis. 20% dari 150 = 30. “X adalah berapa % dari Y” menghitung (X/Y)×100, mis. 30 adalah 20% dari 150. “% perubahan” menghitung ((Y−X)/|X|)×100, mis. 100 → 150 adalah perubahan +50%.",
    },
  },
  {
    en: {
      q: "Why does division by zero show an error?",
      a: "Both “X is what % of Y” and “% change” divide by Y (or X). Dividing by zero is mathematically undefined, so the tool asks for a non-zero base instead of showing a misleading number.",
    },
    id: {
      q: "Mengapa pembagian dengan nol menampilkan error?",
      a: "Baik “X adalah berapa % dari Y” maupun “% perubahan” membagi dengan Y (atau X). Pembagian dengan nol tidak terdefinisi secara matematis, jadi tool meminta basis bukan nol alih-alih menampilkan angka yang menyesatkan.",
    },
  },
  {
    en: {
      q: "Is my input sent anywhere?",
      a: "No. All three modes are pure arithmetic evaluated locally with useMemo on every keystroke. Nothing leaves your device.",
    },
    id: {
      q: "Apakah masukan saya dikirim ke mana pun?",
      a: "Tidak. Ketiga mode adalah aritmetika murni yang dievaluasi lokal dengan useMemo di setiap ketikan. Tidak ada yang meninggalkan perangkat Anda.",
    },
  },
];

const MODES: Mode[] = ["of", "is", "change"];

function formatNum(n: number): string {
  try {
    if (!Number.isFinite(n)) return "—";
    const rounded = Math.round(n * 10000) / 10000;
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 4 });
  } catch {
    return "—";
  }
}

export default function PercentagePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [mode, setMode] = useState<Mode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const computed = useMemo(() => {
    try {
      if (a.trim() === "" || b.trim() === "") return { ok: false as const, empty: true as const };
      const x = Number(a);
      const y = Number(b);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return { ok: false as const, empty: false as const };
      if (mode === "of") {
        const v = (x / 100) * y;
        return { ok: true as const, value: v, suffix: "", formula: `(${formatNum(x)} ÷ 100) × ${formatNum(y)} = ${formatNum(v)}` };
      }
      if (mode === "is") {
        if (y === 0) return { ok: false as const, empty: false as const };
        const v = (x / y) * 100;
        return { ok: true as const, value: v, suffix: "%", formula: `(${formatNum(x)} ÷ ${formatNum(y)}) × 100 = ${formatNum(v)}%` };
      }
      if (x === 0) return { ok: false as const, empty: false as const };
      const v = ((y - x) / Math.abs(x)) * 100;
      const sign = v > 0 ? "+" : "";
      return { ok: true as const, value: v, suffix: "%", formula: `((${formatNum(y)} − ${formatNum(x)}) ÷ |${formatNum(x)}|) × 100 = ${sign}${formatNum(v)}%` };
    } catch {
      return { ok: false as const, empty: false as const };
    }
  }, [a, b, mode]);

  const labels =
    mode === "of"
      ? { first: s.ofX, second: s.ofY }
      : mode === "is"
        ? { first: s.isX, second: s.isY }
        : { first: s.changeFrom, second: s.changeTo };

  const copyText =
    computed.ok === true
      ? `${computed.formula}`
      : "";

  function handleMode(m: Mode): void {
    try {
      setMode(m);
    } catch {
      toast.error(s.error);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Hash"
      slug="calculators/percentage"
      faq={FAQ}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label={s.title}>
          {MODES.map((m) => (
            <Button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              variant={mode === m ? "default" : "outline"}
              onClick={() => handleMode(m)}
              className={cn(mode === m && "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500")}
            >
              {m === "of" ? s.modeOf : m === "is" ? s.modeIs : s.modeChange}
            </Button>
          ))}
        </div>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2">
              <label htmlFor="pct-a" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {labels.first}
              </label>
              <input
                id="pct-a"
                type="number"
                inputMode="decimal"
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="0"
                autoComplete="off"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pct-b" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {labels.second}
              </label>
              <input
                id="pct-b"
                type="number"
                inputMode="decimal"
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="0"
                autoComplete="off"
                className={inputCls}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {s.result}
            </span>
            <div aria-live="polite">
              {computed.ok === true ? (
                <>
                  <p className="font-mono text-3xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {formatNum(computed.value)}
                    {computed.suffix}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">{s.formula}: </span>
                    {computed.formula}
                  </p>
                  <div className="mt-3">
                    <CopyButton
                      text={copyText}
                      label={s.copyResult}
                      copiedMessage={s.copied}
                      emptyMessage={s.empty}
                      errorMessage={s.copyFailed}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  {"empty" in computed && computed.empty ? s.empty : s.invalid}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
