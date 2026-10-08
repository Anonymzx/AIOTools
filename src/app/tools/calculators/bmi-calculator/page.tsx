"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    weight: string;
    height: string;
    kg: string;
    lb: string;
    cm: string;
    ftIn: string;
    feet: string;
    inches: string;
    yourBmi: string;
    healthyRange: string;
    disclaimer: string;
    copied: string;
    copyFailed: string;
    copy: string;
    invalid: string;
    underweight: string;
    normal: string;
    overweight: string;
    obese: string;
  }
> = {
  en: {
    title: "BMI Calculator",
    description: "Body Mass Index with color-coded category, animated gauge, and healthy weight range for your height.",
    weight: "Weight",
    height: "Height",
    kg: "kg",
    lb: "lb",
    cm: "cm",
    ftIn: "ft + in",
    feet: "Feet",
    inches: "Inches",
    yourBmi: "Your BMI",
    healthyRange: "Healthy range for your height",
    disclaimer: "For information only — not medical advice. Consult a health professional for personal guidance.",
    copied: "BMI copied.",
    copyFailed: "Failed to copy.",
    copy: "Copy result",
    invalid: "Enter valid weight and height.",
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obese: "Obese",
  },
  id: {
    title: "Kalkulator BMI",
    description: "Indeks Massa Tubuh dengan kategori berkode warna, pengukur animasi, dan rentang berat sehat sesuai tinggi Anda.",
    weight: "Berat",
    height: "Tinggi",
    kg: "kg",
    lb: "lb",
    cm: "cm",
    ftIn: "kaki + inci",
    feet: "Kaki",
    inches: "Inci",
    yourBmi: "BMI Anda",
    healthyRange: "Rentang sehat untuk tinggi Anda",
    disclaimer: "Hanya untuk informasi — bukan nasihat medis. Konsultasikan ke tenaga kesehatan untuk panduan pribadi.",
    copied: "BMI disalin.",
    copyFailed: "Gagal menyalin.",
    copy: "Salin hasil",
    invalid: "Masukkan berat dan tinggi yang valid.",
    underweight: "Kurus",
    normal: "Normal",
    overweight: "Gemuk",
    obese: "Obesitas",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "How is BMI calculated?", a: "BMI = weight in kilograms divided by height in meters squared. Pounds are converted at 0.45359237 kg/lb and feet+inches to total meters before applying the same formula." },
    id: { q: "Bagaimana BMI dihitung?", a: "BMI = berat dalam kilogram dibagi tinggi dalam meter kuadrat. Pon dikonversi 0,45359237 kg/lb dan kaki+inci ke total meter sebelum memakai rumus yang sama." },
  },
  {
    en: { q: "What do the categories mean?", a: "Underweight is below 18.5, Normal is 18.5–24.9, Overweight is 25–29.9, and Obese is 30 or above (WHO cut-offs). Athletes with high muscle mass can score high without excess fat." },
    id: { q: "Apa arti kategorinya?", a: "Kurus di bawah 18,5, Normal 18,5–24,9, Gemuk 25–29,9, dan Obesitas 30 ke atas (batas WHO). Atlet berotot bisa bernilai tinggi tanpa lemak berlebih." },
  },
  {
    en: { q: "Is my data uploaded?", a: "No. Weight and height stay in this page's state and the BMI is computed locally in your browser." },
    id: { q: "Apakah data saya diunggah?", a: "Tidak. Berat dan tinggi hanya ada di state halaman ini dan BMI dihitung lokal di browser Anda." },
  },
];

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function categoryFor(bmi: number): { key: "underweight" | "normal" | "overweight" | "obese"; color: string; stroke: string } {
  if (bmi < 18.5) return { key: "underweight", color: "text-sky-600 dark:text-sky-400", stroke: "stroke-sky-500" };
  if (bmi < 25) return { key: "normal", color: "text-emerald-600 dark:text-emerald-400", stroke: "stroke-emerald-500" };
  if (bmi < 30) return { key: "overweight", color: "text-amber-600 dark:text-amber-400", stroke: "stroke-amber-500" };
  return { key: "obese", color: "text-red-600 dark:text-red-400", stroke: "stroke-red-500" };
}

export default function BmiCalculatorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [wUnit, setWUnit] = useState<"kg" | "lb">("kg");
  const [hUnit, setHUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("70");
  const [heightCm, setHeightCm] = useState("170");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("7");

  const data = useMemo(() => {
    try {
      const w = Number(weight);
      const kg = wUnit === "kg" ? w : w * 0.45359237;
      let meters = 0;
      if (hUnit === "cm") {
        const cm = Number(heightCm);
        if (!Number.isFinite(cm) || cm <= 0) return null;
        meters = cm / 100;
      } else {
        const f = Number(feet);
        const inch = Number(inches);
        if (!Number.isFinite(f) || !Number.isFinite(inch) || f < 0 || inch < 0 || (f === 0 && inch === 0)) return null;
        meters = (f * 12 + inch) * 0.0254;
      }
      if (!Number.isFinite(kg) || kg <= 0 || meters <= 0) return null;
      const bmi = kg / (meters * meters);
      if (!Number.isFinite(bmi)) return null;
      const lo = 18.5 * meters * meters;
      const hi = 24.9 * meters * meters;
      const frac = Math.min(1, Math.max(0, (bmi - 10) / 30));
      return { bmi, lo, hi, frac, cat: categoryFor(bmi) };
    } catch {
      return null;
    }
  }, [weight, wUnit, heightCm, feet, inches, hUnit]);

  async function handleCopy(): Promise<void> {
    try {
      if (!data) {
        toast.info(s.invalid);
        return;
      }
      await navigator.clipboard.writeText(`BMI: ${data.bmi.toFixed(1)} (${s[data.cat.key]})`);
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  const R = 70;
  const ARC = Math.PI * R;

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Gauge" slug="calculators/bmi-calculator" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="bmi-w" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.weight}</label>
                <div className="flex gap-1" role="group" aria-label={s.weight}>
                  {(["kg", "lb"] as const).map((u) => (
                    <Button key={u} type="button" size="sm" variant={wUnit === u ? "default" : "outline"} onClick={() => setWUnit(u)}>{s[u]}</Button>
                  ))}
                </div>
              </div>
              <input id="bmi-w" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={hUnit === "cm" ? "bmi-h" : "bmi-ft"} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.height}</label>
                <div className="flex gap-1" role="group" aria-label={s.height}>
                  <Button type="button" size="sm" variant={hUnit === "cm" ? "default" : "outline"} onClick={() => setHUnit("cm")}>{s.cm}</Button>
                  <Button type="button" size="sm" variant={hUnit === "ft" ? "default" : "outline"} onClick={() => setHUnit("ft")}>{s.ftIn}</Button>
                </div>
              </div>
              {hUnit === "cm" ? (
                <input id="bmi-h" type="number" min="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputCls} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="bmi-ft" className="text-xs text-zinc-400">{s.feet}</label>
                    <input id="bmi-ft" type="number" min="0" value={feet} onChange={(e) => setFeet(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="bmi-in" className="text-xs text-zinc-400">{s.inches}</label>
                    <input id="bmi-in" type="number" min="0" max="11" value={inches} onChange={(e) => setInches(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {data ? (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 text-center sm:p-6" aria-live="polite">
              <svg viewBox="0 0 180 100" className="mx-auto w-full max-w-xs" role="img" aria-label={`${s.yourBmi}: ${data.bmi.toFixed(1)}`}>
                <path d={`M 20 90 A ${R} ${R} 0 0 1 160 90`} fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <motion.path
                  d={`M 20 90 A ${R} ${R} 0 0 1 160 90`}
                  fill="none"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className={data.cat.stroke}
                  strokeDasharray={ARC}
                  initial={{ strokeDashoffset: ARC }}
                  animate={{ strokeDashoffset: ARC * (1 - data.frac) }}
                  transition={{ type: "spring", stiffness: 60, damping: 18 }}
                />
                <text x="90" y="72" textAnchor="middle" className="fill-zinc-900 font-mono text-2xl font-bold dark:fill-zinc-50">
                  {data.bmi.toFixed(1)}
                </text>
              </svg>
              <p className={`text-lg font-bold ${data.cat.color}`}>{s[data.cat.key]}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {s.healthyRange}: <span className="font-mono font-semibold tabular-nums">{data.lo.toFixed(1)}–{data.hi.toFixed(1)} kg</span>
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
                  <Copy className="h-4 w-4" aria-hidden />
                  {s.copy}
                </Button>
                <p className="max-w-md text-xs text-zinc-400 dark:text-zinc-500">{s.disclaimer}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">{s.invalid}</p>
        )}
      </div>
    </ToolLayout>
  );
}
