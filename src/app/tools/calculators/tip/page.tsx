"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Currency = "USD" | "IDR";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    bill: string;
    tipPct: string;
    custom: string;
    customPlaceholder: string;
    people: string;
    currency: string;
    tipPerPerson: string;
    totalPerPerson: string;
    totalTip: string;
    grandTotal: string;
    reset: string;
    resetDone: string;
    error: string;
    presets: number[];
  }
> = {
  en: {
    title: "Tip Calculator",
    description:
      "Split the bill fairly — slider or custom tip %, people stepper, per-person breakdown in USD or IDR. All math stays in your browser.",
    bill: "Bill amount",
    tipPct: "Tip",
    custom: "Custom %",
    customPlaceholder: "e.g. 12.5",
    people: "People",
    currency: "Currency",
    tipPerPerson: "Tip / person",
    totalPerPerson: "Total / person",
    totalTip: "Total tip",
    grandTotal: "Grand total",
    reset: "Reset",
    resetDone: "Inputs reset.",
    error: "Something went wrong.",
    presets: [5, 10, 12, 15, 20, 25],
  },
  id: {
    title: "Kalkulator Tip",
    description:
      "Bagi tagihan dengan adil — slider atau tip % kustom, stepper jumlah orang, rincian per orang dalam USD atau IDR. Semua hitungan di browser.",
    bill: "Jumlah tagihan",
    tipPct: "Tip",
    custom: "Kustom %",
    customPlaceholder: "mis. 12,5",
    people: "Orang",
    currency: "Mata uang",
    tipPerPerson: "Tip / orang",
    totalPerPerson: "Total / orang",
    totalTip: "Total tip",
    grandTotal: "Total keseluruhan",
    reset: "Atur ulang",
    resetDone: "Masukan diatur ulang.",
    error: "Terjadi kesalahan.",
    presets: [5, 10, 12, 15, 20, 25],
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is the per-person share computed?",
      a: "Total tip = bill × tip%. Grand total = bill + total tip. Both are divided evenly by the people count: tip/person = total tip ÷ people, total/person = grand total ÷ people. Rounding follows your currency's standard fraction digits (2 for USD, 0 for IDR).",
    },
    id: {
      q: "Bagaimana bagian per orang dihitung?",
      a: "Total tip = tagihan × % tip. Total keseluruhan = tagihan + total tip. Keduanya dibagi rata dengan jumlah orang: tip/orang = total tip ÷ orang, total/orang = total keseluruhan ÷ orang. Pembulatan mengikuti digit fraksi standar mata uang (2 untuk USD, 0 untuk IDR).",
    },
  },
  {
    en: {
      q: "What is a good tip percentage?",
      a: "It depends on local custom: 15–20% is standard for US restaurant service, 10% is common in Indonesia for good service (often a service charge is already included — check your receipt first). Use the custom field for anything in between.",
    },
    id: {
      q: "Berapa persen tip yang wajar?",
      a: "Tergantung kebiasaan lokal: 15–20% standar untuk layanan restoran di AS, 10% umum di Indonesia untuk layanan yang baik (sering kali service charge sudah termasuk — cek struk dulu). Gunakan kolom kustom untuk nilai di antaranya.",
    },
  },
  {
    en: {
      q: "Is my bill amount sent anywhere?",
      a: "No. The bill, tip %, and people count are plain React state evaluated locally with useMemo. Currency formatting uses Intl.NumberFormat on-device; nothing is uploaded.",
    },
    id: {
      q: "Apakah jumlah tagihan saya dikirim ke mana pun?",
      a: "Tidak. Tagihan, % tip, dan jumlah orang adalah state React biasa yang dievaluasi lokal dengan useMemo. Format mata uang memakai Intl.NumberFormat di perangkat; tidak ada yang diunggah.",
    },
  },
];

function formatMoney(value: number, currency: Currency): string {
  try {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(value);
  } catch {
    return String(Math.round(value * 100) / 100);
  }
}

export default function TipPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [bill, setBill] = useState("");
  const [tipPct, setTipPct] = useState(15);
  const [custom, setCustom] = useState("");
  const [people, setPeople] = useState(2);
  const [currency, setCurrency] = useState<Currency>("USD");

  const billNum = useMemo(() => {
    try {
      const n = Number(bill);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [bill]);

  const computed = useMemo(() => {
    try {
      const p = Math.min(100, Math.max(0, tipPct));
      const n = Math.min(99, Math.max(1, Math.floor(people) || 1));
      const totalTip = (billNum * p) / 100;
      const grand = billNum + totalTip;
      return { tipPer: totalTip / n, totalPer: grand / n, totalTip, grand, pct: p, count: n };
    } catch {
      return { tipPer: 0, totalPer: 0, totalTip: 0, grand: 0, pct: tipPct, count: people };
    }
  }, [billNum, tipPct, people]);

  function applyPreset(p: number): void {
    try {
      setTipPct(p);
      setCustom("");
    } catch {
      toast.error(s.error);
    }
  }

  function handleCustom(v: string): void {
    try {
      setCustom(v);
      const n = Number(v.replace(",", "."));
      if (v.trim() !== "" && Number.isFinite(n)) setTipPct(Math.min(100, Math.max(0, n)));
    } catch {
      toast.error(s.error);
    }
  }

  function stepPeople(delta: number): void {
    try {
      setPeople((prev) => Math.min(99, Math.max(1, (Math.floor(prev) || 1) + delta)));
    } catch {
      toast.error(s.error);
    }
  }

  function handleReset(): void {
    try {
      setBill("");
      setTipPct(15);
      setCustom("");
      setPeople(2);
      toast.success(s.resetDone);
    } catch {
      toast.error(s.error);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const rows = [
    { label: s.tipPerPerson, value: formatMoney(computed.tipPer, currency), big: true },
    { label: s.totalPerPerson, value: formatMoney(computed.totalPer, currency), big: true },
    { label: s.totalTip, value: formatMoney(computed.totalTip, currency), big: false },
    { label: s.grandTotal, value: formatMoney(computed.grand, currency), big: false },
  ];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Circle"
      slug="calculators/tip"
      faq={FAQ}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <label htmlFor="tip-bill" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.bill}
              </label>
              <input
                id="tip-bill"
                type="number"
                inputMode="decimal"
                min={0}
                value={bill}
                onChange={(e) => setBill(e.target.value)}
                placeholder="0"
                autoComplete="off"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="tip-slider" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.tipPct}
                </label>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-sm font-bold tabular-nums text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {computed.pct}%
                </span>
              </div>
              <input
                id="tip-slider"
                type="range"
                min={0}
                max={50}
                step={1}
                value={Math.min(50, computed.pct)}
                onChange={(e) => {
                  try {
                    setTipPct(Number(e.target.value));
                    setCustom("");
                  } catch {
                    toast.error(s.error);
                  }
                }}
                aria-label={s.tipPct}
                className="w-full accent-indigo-600"
              />
              <div className="flex flex-wrap gap-1.5">
                {s.presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    aria-pressed={computed.pct === p && custom === ""}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 font-mono text-xs tabular-nums transition-colors",
                      computed.pct === p && custom === ""
                        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-600"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="tip-custom" className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.custom}
                </label>
                <input
                  id="tip-custom"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  value={custom}
                  onChange={(e) => handleCustom(e.target.value)}
                  placeholder={s.customPlaceholder}
                  autoComplete="off"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span id="tip-people-label" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.people}
              </span>
              <div className="flex items-center gap-2" role="group" aria-labelledby="tip-people-label">
                <Button type="button" variant="outline" size="icon" onClick={() => stepPeople(-1)} disabled={computed.count <= 1} aria-label="-">
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={people}
                  onChange={(e) => {
                    try {
                      const n = Math.floor(Number(e.target.value));
                      setPeople(Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  aria-label={s.people}
                  className={cn(inputCls, "text-center")}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => stepPeople(1)} disabled={computed.count >= 99} aria-label="+">
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span id="tip-currency-label" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.currency}
              </span>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="tip-currency-label">
                {(["USD", "IDR"] as Currency[]).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={currency === c ? "default" : "outline"}
                    onClick={() => setCurrency(c)}
                    aria-pressed={currency === c}
                    className={cn(currency === c && "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500")}
                  >
                    {c === "USD" ? "$ USD" : "Rp IDR"}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="button" variant="outline" onClick={handleReset} className="w-full">
              {s.reset}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6" aria-live="polite">
            {rows.map((r) => (
              <div
                key={r.label}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800",
                  r.big && "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30",
                )}
              >
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{r.label}</span>
                <span
                  className={cn(
                    "truncate font-mono tabular-nums text-zinc-900 dark:text-zinc-100",
                    r.big ? "text-xl font-extrabold text-indigo-600 dark:text-indigo-400" : "text-sm font-bold",
                  )}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
