"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, intervalToDuration, isWeekend, subDays } from "date-fns";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    tabBetween: string;
    tabAdd: string;
    start: string;
    end: string;
    base: string;
    daysCount: string;
    operation: string;
    add: string;
    subtract: string;
    calculate: string;
    days: string;
    weeks: string;
    months: string;
    years: string;
    businessDays: string;
    resultDate: string;
    weekday: string;
    copied: string;
    copyFailed: string;
    copy: string;
    invalid: string;
    duration: string;
  }
> = {
  en: {
    title: "Date Calculator",
    description: "Days between two dates with business-day count, or add/subtract days from any date. Accurate calendar math, computed locally.",
    tabBetween: "Days Between",
    tabAdd: "Add / Subtract",
    start: "Start date",
    end: "End date",
    base: "Base date",
    daysCount: "Number of days",
    operation: "Operation",
    add: "Add (+)",
    subtract: "Subtract (−)",
    calculate: "Calculate",
    days: "Days",
    weeks: "Weeks",
    months: "Months",
    years: "Years",
    businessDays: "Business days (excl. weekends)",
    resultDate: "Result date",
    weekday: "Weekday",
    copied: "Result copied.",
    copyFailed: "Failed to copy.",
    copy: "Copy result",
    invalid: "Please pick valid date(s).",
    duration: "Exact duration",
  },
  id: {
    title: "Kalkulator Tanggal",
    description: "Selisih hari antara dua tanggal dengan hitungan hari kerja, atau tambah/kurangi hari dari tanggal mana pun. Matematika kalender akurat, dihitung lokal.",
    tabBetween: "Selisih Hari",
    tabAdd: "Tambah / Kurang",
    start: "Tanggal awal",
    end: "Tanggal akhir",
    base: "Tanggal dasar",
    daysCount: "Jumlah hari",
    operation: "Operasi",
    add: "Tambah (+)",
    subtract: "Kurang (−)",
    calculate: "Hitung",
    days: "Hari",
    weeks: "Minggu",
    months: "Bulan",
    years: "Tahun",
    businessDays: "Hari kerja (tanpa akhir pekan)",
    resultDate: "Tanggal hasil",
    weekday: "Hari",
    copied: "Hasil disalin.",
    copyFailed: "Gagal menyalin.",
    copy: "Salin hasil",
    invalid: "Pilih tanggal yang valid.",
    duration: "Durasi tepat",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "How are business days counted?", a: "Every calendar day in the interval is checked with date-fns isWeekend; Saturdays and Sundays are excluded. Public holidays are not excluded because they vary by country." },
    id: { q: "Bagaimana hari kerja dihitung?", a: "Setiap hari kalender dalam rentang diperiksa dengan isWeekend dari date-fns; Sabtu dan Minggu dikecualikan. Hari libur nasional tidak dikecualikan karena berbeda tiap negara." },
  },
  {
    en: { q: "Does it handle leap years and DST?", a: "Yes. All math uses date-fns calendar functions (differenceInCalendarDays, addDays, intervalToDuration), which correctly handle leap years and daylight-saving transitions." },
    id: { q: "Apakah tahun kabisat dan DST ditangani?", a: "Ya. Semua perhitungan memakai fungsi kalender date-fns (differenceInCalendarDays, addDays, intervalToDuration) yang menangani tahun kabisat dan transisi daylight-saving dengan benar." },
  },
  {
    en: { q: "What does the Add/Subtract tab output?", a: "It outputs the resulting calendar date plus its weekday name (e.g. Monday), so you can immediately see which day of the week a deadline falls on." },
    id: { q: "Apa output tab Tambah/Kurang?", a: "Ia menampilkan tanggal kalender hasil plus nama harinya (mis. Senin), sehingga Anda langsung tahu hari apa tenggat waktu jatuh." },
  },
];

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function DateCalculatorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [tab, setTab] = useState("between");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [base, setBase] = useState("");
  const [n, setN] = useState("30");
  const [op, setOp] = useState<"add" | "sub">("add");

  const between = useMemo(() => {
    try {
      if (!start || !end) return null;
      const a = new Date(`${start}T00:00:00`);
      const b = new Date(`${end}T00:00:00`);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
      const [from, to] = a <= b ? [a, b] : [b, a];
      const days = differenceInCalendarDays(to, from);
      const business = eachDayOfInterval({ start: from, end: to }).filter((d) => !isWeekend(d)).length;
      const dur = intervalToDuration({ start: from, end: to });
      return { days, business, dur };
    } catch {
      return null;
    }
  }, [start, end]);

  const shifted = useMemo(() => {
    try {
      if (!base) return null;
      const d = new Date(`${base}T00:00:00`);
      if (Number.isNaN(d.getTime())) return null;
      const count = Number(n);
      if (!Number.isFinite(count)) return null;
      const out = op === "add" ? addDays(d, count) : subDays(d, count);
      return { date: format(out, "yyyy-MM-dd"), weekday: format(out, "EEEE") };
    } catch {
      return null;
    }
  }, [base, n, op]);

  async function handleCopy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  return (
    <ToolLayout title={s.title} description={s.description} iconName="CalendarDays" slug="calculators/date-calculator" faq={FAQ}>
      <div className="space-y-4">
        <AnimatedTabs
          tabs={[
            { id: "between", label: s.tabBetween },
            { id: "add", label: s.tabAdd },
          ]}
          value={tab}
          onChange={setTab}
          ariaLabel={s.title}
        />
        {tab === "between" ? (
          <AnimatedTabPanel tabKey="between">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="dc-start" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.start}</label>
                    <input id="dc-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="dc-end" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.end}</label>
                    <input id="dc-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
                  </div>
                </div>
                {between ? (
                  <div aria-live="polite" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: s.days, v: String(between.days) },
                      { label: s.weeks, v: (between.days / 7).toFixed(2) },
                      { label: s.months, v: `${between.dur.years ?? 0}y ${between.dur.months ?? 0}m ${between.dur.days ?? 0}d` },
                      { label: s.years, v: (between.days / 365.25).toFixed(2) },
                      { label: s.businessDays, v: String(between.business) },
                    ].map((r) => (
                      <div key={r.label} className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950">
                        <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{r.label}</p>
                        <p className="mt-1 truncate font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{r.v}</p>
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-full w-full"
                        onClick={() => void handleCopy(`${s.days}: ${between.days}, ${s.businessDays}: ${between.business}`)}
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                        {s.copy}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">{s.invalid}</p>
                )}
              </CardContent>
            </Card>
          </AnimatedTabPanel>
        ) : (
          <AnimatedTabPanel tabKey="add">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label htmlFor="dc-base" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.base}</label>
                    <input id="dc-base" type="date" value={base} onChange={(e) => setBase(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="dc-n" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.daysCount}</label>
                    <input id="dc-n" type="number" value={n} onChange={(e) => setN(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="dc-op" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.operation}</label>
                    <select id="dc-op" value={op} onChange={(e) => setOp(e.target.value as "add" | "sub")} className={inputCls}>
                      <option value="add">{s.add}</option>
                      <option value="sub">{s.subtract}</option>
                    </select>
                  </div>
                </div>
                {shifted ? (
                  <div aria-live="polite" className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{s.resultDate}</p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{shifted.date}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.weekday}: {shifted.weekday}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void handleCopy(`${shifted.date} (${shifted.weekday})`)}>
                      <Copy className="h-4 w-4" aria-hidden />
                      {s.copy}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">{s.invalid}</p>
                )}
              </CardContent>
            </Card>
          </AnimatedTabPanel>
        )}
      </div>
    </ToolLayout>
  );
}
