"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, Copy, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

interface UnitDef {
  id: string;
  label: { en: string; id: string };
  toBase: number;
}

interface CategoryDef {
  id: string;
  name: { en: string; id: string };
  base: string;
  units: UnitDef[];
  temperature?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    name: { en: "Length", id: "Panjang" },
    base: "m",
    units: [
      { id: "mm", label: { en: "Millimeter (mm)", id: "Milimeter (mm)" }, toBase: 0.001 },
      { id: "cm", label: { en: "Centimeter (cm)", id: "Sentimeter (cm)" }, toBase: 0.01 },
      { id: "m", label: { en: "Meter (m)", id: "Meter (m)" }, toBase: 1 },
      { id: "km", label: { en: "Kilometer (km)", id: "Kilometer (km)" }, toBase: 1000 },
      { id: "in", label: { en: "Inch (in)", id: "Inci (in)" }, toBase: 0.0254 },
      { id: "ft", label: { en: "Foot (ft)", id: "Kaki (ft)" }, toBase: 0.3048 },
      { id: "yd", label: { en: "Yard (yd)", id: "Yard (yd)" }, toBase: 0.9144 },
      { id: "mi", label: { en: "Mile (mi)", id: "Mil (mi)" }, toBase: 1609.344 },
    ],
  },
  {
    id: "weight",
    name: { en: "Weight", id: "Berat" },
    base: "kg",
    units: [
      { id: "mg", label: { en: "Milligram (mg)", id: "Miligram (mg)" }, toBase: 0.000001 },
      { id: "g", label: { en: "Gram (g)", id: "Gram (g)" }, toBase: 0.001 },
      { id: "kg", label: { en: "Kilogram (kg)", id: "Kilogram (kg)" }, toBase: 1 },
      { id: "oz", label: { en: "Ounce (oz)", id: "Ons (oz)" }, toBase: 0.028349523125 },
      { id: "lb", label: { en: "Pound (lb)", id: "Pon (lb)" }, toBase: 0.45359237 },
      { id: "t", label: { en: "Ton (t)", id: "Ton (t)" }, toBase: 1000 },
    ],
  },
  {
    id: "temperature",
    name: { en: "Temperature", id: "Suhu" },
    base: "C",
    temperature: true,
    units: [
      { id: "C", label: { en: "Celsius (°C)", id: "Celsius (°C)" }, toBase: 1 },
      { id: "F", label: { en: "Fahrenheit (°F)", id: "Fahrenheit (°F)" }, toBase: 1 },
      { id: "K", label: { en: "Kelvin (K)", id: "Kelvin (K)" }, toBase: 1 },
    ],
  },
  {
    id: "volume",
    name: { en: "Volume", id: "Volume" },
    base: "L",
    units: [
      { id: "ml", label: { en: "Milliliter (ml)", id: "Mililiter (ml)" }, toBase: 0.001 },
      { id: "L", label: { en: "Liter (L)", id: "Liter (L)" }, toBase: 1 },
      { id: "cup", label: { en: "Cup", id: "Cangkir" }, toBase: 0.2365882365 },
      { id: "pt", label: { en: "Pint (pt)", id: "Pint (pt)" }, toBase: 0.473176473 },
      { id: "qt", label: { en: "Quart (qt)", id: "Quart (qt)" }, toBase: 0.946352946 },
      { id: "gal", label: { en: "Gallon (gal)", id: "Galon (gal)" }, toBase: 3.785411784 },
    ],
  },
  {
    id: "area",
    name: { en: "Area", id: "Luas" },
    base: "m2",
    units: [
      { id: "mm2", label: { en: "Sq. millimeter (mm²)", id: "Milimeter² (mm²)" }, toBase: 0.000001 },
      { id: "cm2", label: { en: "Sq. centimeter (cm²)", id: "Sentimeter² (cm²)" }, toBase: 0.0001 },
      { id: "m2", label: { en: "Sq. meter (m²)", id: "Meter² (m²)" }, toBase: 1 },
      { id: "km2", label: { en: "Sq. kilometer (km²)", id: "Kilometer² (km²)" }, toBase: 1000000 },
      { id: "ft2", label: { en: "Sq. foot (ft²)", id: "Kaki² (ft²)" }, toBase: 0.09290304 },
      { id: "ac", label: { en: "Acre (ac)", id: "Acre (ac)" }, toBase: 4046.8564224 },
      { id: "ha", label: { en: "Hectare (ha)", id: "Hektar (ha)" }, toBase: 10000 },
    ],
  },
  {
    id: "speed",
    name: { en: "Speed", id: "Kecepatan" },
    base: "ms",
    units: [
      { id: "ms", label: { en: "Meter/sec (m/s)", id: "Meter/detik (m/s)" }, toBase: 1 },
      { id: "kmh", label: { en: "Kilometer/hour (km/h)", id: "Kilometer/jam (km/jam)" }, toBase: 1 / 3.6 },
      { id: "mph", label: { en: "Mile/hour (mph)", id: "Mil/jam (mph)" }, toBase: 0.44704 },
      { id: "kn", label: { en: "Knot (kn)", id: "Knot (kn)" }, toBase: 0.5144444444 },
    ],
  },
  {
    id: "time",
    name: { en: "Time", id: "Waktu" },
    base: "s",
    units: [
      { id: "ms", label: { en: "Millisecond (ms)", id: "Milidetik (ms)" }, toBase: 0.001 },
      { id: "s", label: { en: "Second (s)", id: "Detik (s)" }, toBase: 1 },
      { id: "min", label: { en: "Minute (min)", id: "Menit (mnt)" }, toBase: 60 },
      { id: "h", label: { en: "Hour (h)", id: "Jam (j)" }, toBase: 3600 },
      { id: "d", label: { en: "Day", id: "Hari" }, toBase: 86400 },
      { id: "wk", label: { en: "Week", id: "Minggu" }, toBase: 604800 },
      { id: "mo", label: { en: "Month (30.44 d)", id: "Bulan (30,44 hr)" }, toBase: 2629800 },
      { id: "yr", label: { en: "Year (365.25 d)", id: "Tahun (365,25 hr)" }, toBase: 31557600 },
    ],
  },
  {
    id: "data",
    name: { en: "Data", id: "Data" },
    base: "B",
    units: [
      { id: "bit", label: { en: "Bit", id: "Bit" }, toBase: 0.125 },
      { id: "B", label: { en: "Byte (B)", id: "Byte (B)" }, toBase: 1 },
      { id: "KB", label: { en: "Kilobyte (KB)", id: "Kilobyte (KB)" }, toBase: 1024 },
      { id: "MB", label: { en: "Megabyte (MB)", id: "Megabyte (MB)" }, toBase: 1048576 },
      { id: "GB", label: { en: "Gigabyte (GB)", id: "Gigabyte (GB)" }, toBase: 1073741824 },
      { id: "TB", label: { en: "Terabyte (TB)", id: "Terabyte (TB)" }, toBase: 1099511627776 },
      { id: "PB", label: { en: "Petabyte (PB)", id: "Petabyte (PB)" }, toBase: 1125899906842624 },
    ],
  },
];

function toCelsius(v: number, from: string): number {
  if (from === "C") return v;
  if (from === "F") return ((v - 32) * 5) / 9;
  return v - 273.15;
}

function fromCelsius(v: number, to: string): number {
  if (to === "C") return v;
  if (to === "F") return (v * 9) / 5 + 32;
  return v + 273.15;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    value: string;
    category: string;
    from: string;
    to: string;
    swap: string;
    result: string;
    formula: string;
    history: string;
    clear: string;
    cleared: string;
    copied: string;
    copyFailed: string;
    copy: string;
    invalid: string;
  }
> = {
  en: {
    title: "Unit Converter",
    description: "Convert length, weight, temperature, volume, area, speed, time, and data units instantly — all computed locally in your browser.",
    value: "Value",
    category: "Category",
    from: "From",
    to: "To",
    swap: "Swap units",
    result: "Result",
    formula: "Formula",
    history: "Recent conversions",
    clear: "Clear history",
    cleared: "History cleared.",
    copied: "Result copied.",
    copyFailed: "Failed to copy.",
    copy: "Copy result",
    invalid: "Enter a valid number.",
  },
  id: {
    title: "Konverter Satuan",
    description: "Konversi satuan panjang, berat, suhu, volume, luas, kecepatan, waktu, dan data secara instan — semua dihitung lokal di browser.",
    value: "Nilai",
    category: "Kategori",
    from: "Dari",
    to: "Ke",
    swap: "Tukar satuan",
    result: "Hasil",
    formula: "Rumus",
    history: "Konversi terakhir",
    clear: "Hapus riwayat",
    cleared: "Riwayat dihapus.",
    copied: "Hasil disalin.",
    copyFailed: "Gagal menyalin.",
    copy: "Salin hasil",
    invalid: "Masukkan angka yang valid.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "How is the conversion calculated?", a: "Every unit has a factor-to-base (e.g. meters for length). The value is first converted to the base unit, then divided by the target factor. Temperature uses offset formulas instead: °F = °C × 9/5 + 32 and K = °C + 273.15." },
    id: { q: "Bagaimana konversi dihitung?", a: "Setiap satuan punya faktor-ke-basis (mis. meter untuk panjang). Nilai dikonversi dulu ke satuan basis, lalu dibagi faktor target. Suhu memakai rumus offset: °F = °C × 9/5 + 32 dan K = °C + 273,15." },
  },
  {
    en: { q: "Are month and year exact in Time conversions?", a: "No. A month is defined as 30.44 days (365.25/12) and a year as 365.25 days to account for leap years. Use the Date Calculator for calendar-exact differences." },
    id: { q: "Apakah bulan dan tahun eksak pada konversi Waktu?", a: "Tidak. Satu bulan didefinisikan 30,44 hari (365,25/12) dan satu tahun 365,25 hari untuk memperhitungkan tahun kabisat. Gunakan Kalkulator Tanggal untuk selisih kalender yang eksak." },
  },
  {
    en: { q: "Is my conversion history uploaded anywhere?", a: "No. The last 5 conversions are stored only in your browser's localStorage and never leave your device. Clearing history wipes them permanently." },
    id: { q: "Apakah riwayat konversi saya diunggah ke mana pun?", a: "Tidak. Lima konversi terakhir hanya disimpan di localStorage browser Anda dan tidak pernah keluar dari perangkat. Menghapus riwayat menghilangkannya permanen." },
  },
];

const HISTORY_KEY = "aiotools-unit-history";

export default function UnitConverterPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [value, setValue] = useState("1");
  const [catId, setCatId] = useState("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [history, setHistory] = useState<string[]>([]);

  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const units = cat.units.map((u) => u.id);
      if (!units.includes(from)) setFrom(units[0]);
      if (!units.includes(to)) setTo(units[1] ?? units[0]);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  function persist(next: string[]): void {
    try {
      setHistory(next);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      setHistory(next);
    }
  }

  const { result, formula, valid } = useMemo(() => {
    try {
      const n = Number(value);
      if (value.trim() === "" || Number.isNaN(n)) {
        return { result: "", formula: "", valid: false };
      }
      if (cat.temperature) {
        const c = toCelsius(n, from);
        const out = fromCelsius(c, to);
        return {
          result: out.toFixed(6),
          formula: `${value} ${from} → ${to} via °C offset formulas`,
          valid: true,
        };
      }
      const f = cat.units.find((u) => u.id === from)?.toBase ?? 1;
      const t = cat.units.find((u) => u.id === to)?.toBase ?? 1;
      const out = (n * f) / t;
      return {
        result: out.toFixed(6),
        formula: `${value} × ${f} ÷ ${t} = ${out.toFixed(6)} ${to}`,
        valid: true,
      };
    } catch {
      return { result: "", formula: "", valid: false };
    }
  }, [value, from, to, cat]);

  useEffect(() => {
    try {
      if (!valid || !result) return;
      const entry = `${value} ${from} = ${result} ${to}`;
      const timer = window.setTimeout(() => {
        setHistory((prev) => {
          if (prev[0] === entry) return prev;
          const next = [entry, ...prev].slice(0, 5);
          try {
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }, 600);
      return () => window.clearTimeout(timer);
    } catch {
      // ignore
    }
    return undefined;
  }, [valid, result, value, from, to]);

  function handleSwap(): void {
    try {
      setFrom(to);
      setTo(from);
    } catch {
      toast.error(s.invalid);
    }
  }

  async function handleCopy(): Promise<void> {
    try {
      if (!valid) {
        toast.info(s.invalid);
        return;
      }
      await navigator.clipboard.writeText(`${value} ${from} = ${result} ${to}`);
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleClear(): void {
    try {
      persist([]);
      toast.success(s.cleared);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  const selectCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Calculator" slug="calculators/unit-converter" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="uc-value" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.value}</label>
                <input
                  id="uc-value"
                  type="number"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={selectCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="uc-cat" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.category}</label>
                <select id="uc-cat" value={catId} onChange={(e) => setCatId(e.target.value)} className={selectCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{locale === "id" ? c.name.id : c.name.en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-1.5">
                <label htmlFor="uc-from" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.from}</label>
                <select id="uc-from" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
                  {cat.units.map((u) => (
                    <option key={u.id} value={u.id}>{locale === "id" ? u.label.id : u.label.en}</option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="outline" onClick={handleSwap} aria-label={s.swap} className="mx-auto">
                <ArrowLeftRight className="h-4 w-4" aria-hidden />
              </Button>
              <div className="space-y-1.5">
                <label htmlFor="uc-to" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.to}</label>
                <select id="uc-to" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls}>
                  {cat.units.map((u) => (
                    <option key={u.id} value={u.id}>{locale === "id" ? u.label.id : u.label.en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div aria-live="polite" className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{s.result}</p>
              <p className="mt-1 break-all font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {valid ? `${result} ${to}` : "—"}
              </p>
              {valid && <p className="mt-1 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">{s.formula}: {formula}</p>}
              {!valid && value.trim() !== "" && <p className="mt-1 text-xs text-red-500">{s.invalid}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()} disabled={!valid} className="mt-3">
                <Copy className="h-4 w-4" aria-hidden />
                {s.copy}
              </Button>
            </div>
          </CardContent>
        </Card>
        {history.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-2 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.history}</h2>
                <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {s.clear}
                </Button>
              </div>
              <ul className="space-y-1">
                {history.map((h, i) => (
                  <li key={i} className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">{h}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
