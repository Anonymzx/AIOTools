"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    price: string;
    discount1: string;
    discount2: string;
    discount2Hint: string;
    finalPrice: string;
    saved: string;
    effective: string;
    breakdown: string;
    afterFirst: string;
    afterSecond: string;
    copyResult: string;
    copied: string;
    copyFailed: string;
    empty: string;
    invalid: string;
    error: string;
  }
> = {
  en: {
    title: "Discount Calculator",
    description:
      "Final price, amount saved, and effective % — with an optional second stacked discount applied sequentially. Live math, 100% in your browser.",
    price: "Original price",
    discount1: "Discount 1 (%)",
    discount2: "Discount 2 — stacked (%)",
    discount2Hint: "Optional. Applied to the already-discounted price, not the original.",
    finalPrice: "Final price",
    saved: "You save",
    effective: "Effective discount",
    breakdown: "Breakdown",
    afterFirst: "After discount 1",
    afterSecond: "After discount 2",
    copyResult: "Copy result",
    copied: "Result copied to clipboard.",
    copyFailed: "Failed to copy.",
    empty: "Enter a price to see the live result.",
    invalid: "Enter a valid price and 0–100% discounts.",
    error: "Something went wrong.",
  },
  id: {
    title: "Kalkulator Diskon (Discount Calculator)",
    description:
      "Harga akhir, jumlah hemat, dan % efektif — dengan opsi diskon kedua bertumpuk yang diterapkan berurutan. Hitungan live, 100% di browser.",
    price: "Harga awal",
    discount1: "Diskon 1 (%)",
    discount2: "Diskon 2 — bertumpuk (%)",
    discount2Hint: "Opsional. Diterapkan ke harga yang sudah didiskon, bukan harga awal.",
    finalPrice: "Harga akhir",
    saved: "Anda hemat",
    effective: "Diskon efektif",
    breakdown: "Rincian",
    afterFirst: "Setelah diskon 1",
    afterSecond: "Setelah diskon 2",
    copyResult: "Salin hasil",
    copied: "Hasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    empty: "Masukkan harga untuk melihat hasil live.",
    invalid: "Masukkan harga valid dan diskon 0–100%.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do stacked discounts work?",
      a: "Sequentially, not additively: discount 2 applies to the price after discount 1. Example: Rp100.000 with 20% then 10% → Rp80.000 after the first, Rp72.000 after the second. The effective discount is 28%, not 30%.",
    },
    id: {
      q: "Bagaimana cara kerja diskon bertumpuk?",
      a: "Berurutan, bukan penjumlahan: diskon 2 diterapkan ke harga setelah diskon 1. Contoh: Rp100.000 dengan 20% lalu 10% → Rp80.000 setelah yang pertama, Rp72.000 setelah yang kedua. Diskon efektifnya 28%, bukan 30%.",
    },
  },
  {
    en: {
      q: "What is the effective discount %?",
      a: "Effective % = (amount saved ÷ original price) × 100. With a single discount it equals the discount itself; with two stacked discounts it is always slightly less than their sum — 1 − (1−d1)(1−d2).",
    },
    id: {
      q: "Apa itu % diskon efektif?",
      a: "% efektif = (jumlah hemat ÷ harga awal) × 100. Dengan satu diskon nilainya sama dengan diskon itu sendiri; dengan dua diskon bertumpuk selalu sedikit lebih kecil dari penjumlahannya — 1 − (1−d1)(1−d2).",
    },
  },
  {
    en: {
      q: "Is my pricing data sent anywhere?",
      a: "No. Price and discounts are plain React state computed locally with useMemo on every keystroke. Nothing leaves your device.",
    },
    id: {
      q: "Apakah data harga saya dikirim ke mana pun?",
      a: "Tidak. Harga dan diskon adalah state React biasa yang dihitung lokal dengan useMemo di setiap ketikan. Tidak ada yang meninggalkan perangkat Anda.",
    },
  },
];

function formatMoney(n: number): string {
  try {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch {
    return "—";
  }
}

function clampPct(n: number): number {
  try {
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  } catch {
    return 0;
  }
}

export default function DiscountPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [price, setPrice] = useState("");
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");

  const computed = useMemo(() => {
    try {
      if (price.trim() === "") return { ok: false as const, empty: true as const };
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) return { ok: false as const, empty: false as const };
      const r1 = d1.trim() === "" ? 0 : Number(d1);
      const r2 = d2.trim() === "" ? 0 : Number(d2);
      if (!Number.isFinite(r1) || !Number.isFinite(r2) || r1 < 0 || r1 > 100 || r2 < 0 || r2 > 100) {
        return { ok: false as const, empty: false as const };
      }
      const c1 = clampPct(r1);
      const c2 = clampPct(r2);
      const after1 = p * (1 - c1 / 100);
      const final = after1 * (1 - c2 / 100);
      const saved = p - final;
      const effective = p === 0 ? 0 : (saved / p) * 100;
      return { ok: true as const, after1, final, saved, effective, c1, c2 };
    } catch {
      return { ok: false as const, empty: false as const };
    }
  }, [price, d1, d2]);

  function handleSlider(which: 1 | 2, v: number): void {
    try {
      if (which === 1) setD1(String(v));
      else setD2(String(v));
    } catch {
      toast.error(s.error);
    }
  }

  const copyText =
    computed.ok === true
      ? `${s.finalPrice}: ${formatMoney(computed.final)} | ${s.saved}: ${formatMoney(computed.saved)} | ${s.effective}: ${formatMoney(computed.effective)}%`
      : "";

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Tags"
      slug="calculators/discount"
      faq={FAQ}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <label htmlFor="disc-price" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.price}
              </label>
              <input
                id="disc-price"
                type="number"
                inputMode="decimal"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                autoComplete="off"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="disc-d1" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.discount1}
                </label>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-sm font-bold tabular-nums text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {d1.trim() === "" ? 0 : (Number(d1) || 0)}%
                </span>
              </div>
              <input
                id="disc-d1"
                type="range"
                min={0}
                max={90}
                step={1}
                value={Math.min(90, Number(d1) || 0)}
                onChange={(e) => handleSlider(1, Number(e.target.value))}
                aria-label={s.discount1}
                className="w-full accent-indigo-600"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={d1}
                onChange={(e) => setD1(e.target.value)}
                placeholder="0"
                autoComplete="off"
                aria-label={s.discount1}
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="disc-d2" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.discount2}
                </label>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-sm font-bold tabular-nums text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {d2.trim() === "" ? 0 : (Number(d2) || 0)}%
                </span>
              </div>
              <input
                id="disc-d2"
                type="range"
                min={0}
                max={90}
                step={1}
                value={Math.min(90, Number(d2) || 0)}
                onChange={(e) => handleSlider(2, Number(e.target.value))}
                aria-label={s.discount2}
                className="w-full accent-indigo-600"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={d2}
                onChange={(e) => setD2(e.target.value)}
                placeholder="0"
                autoComplete="off"
                aria-label={s.discount2}
                className={inputCls}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.discount2Hint}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6" aria-live="polite">
            {computed.ok === true ? (
              <>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {s.finalPrice}
                  </span>
                  <span className="block truncate font-mono text-3xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {formatMoney(computed.final)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {s.saved}
                    </span>
                    <span className="block truncate font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(computed.saved)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {s.effective}
                    </span>
                    <span className="block truncate font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatMoney(computed.effective)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {s.breakdown}
                  </span>
                  <p className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                    {formatMoney(Number(price))} − {computed.c1}% → {formatMoney(computed.after1)} ({s.afterFirst})
                  </p>
                  {d2.trim() !== "" && Number(d2) > 0 ? (
                    <p className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                      {formatMoney(computed.after1)} − {computed.c2}% → {formatMoney(computed.final)} ({s.afterSecond})
                    </p>
                  ) : null}
                </div>
                <CopyButton
                  text={copyText}
                  label={s.copyResult}
                  copiedMessage={s.copied}
                  emptyMessage={s.empty}
                  errorMessage={s.copyFailed}
                />
              </>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {"empty" in computed && computed.empty ? s.empty : s.invalid}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
