"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { differenceInDays, differenceInHours, format, intervalToDuration } from "date-fns";
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
    birthdate: string;
    birthTime: string;
    optional: string;
    years: string;
    months: string;
    days: string;
    totalDays: string;
    totalHours: string;
    bornWeekday: string;
    nextBirthday: string;
    zodiac: string;
    funFacts: string;
    heartbeats: string;
    breaths: string;
    copied: string;
    copyFailed: string;
    copy: string;
    pick: string;
    future: string;
    daysLabel: string;
    hoursLabel: string;
    minutesLabel: string;
    secondsLabel: string;
  }
> = {
  en: {
    title: "Age Calculator",
    description: "Exact age in years, months, and days plus live countdown to your next birthday, zodiac sign, and fun lifetime stats.",
    birthdate: "Birth date",
    birthTime: "Birth time",
    optional: "optional",
    years: "Years",
    months: "Months",
    days: "Days",
    totalDays: "Total days alive",
    totalHours: "Total hours alive",
    bornWeekday: "Born on",
    nextBirthday: "Next birthday in",
    zodiac: "Western zodiac",
    funFacts: "Fun facts",
    heartbeats: "Heartbeats (~70 bpm)",
    breaths: "Breaths (~16/min)",
    copied: "Result copied.",
    copyFailed: "Failed to copy.",
    copy: "Copy result",
    pick: "Pick your birth date above to see the result.",
    future: "Birth date cannot be in the future.",
    daysLabel: "days",
    hoursLabel: "hrs",
    minutesLabel: "min",
    secondsLabel: "sec",
  },
  id: {
    title: "Kalkulator Umur",
    description: "Umur tepat dalam tahun, bulan, dan hari plus hitung mundur live ke ulang tahun berikutnya, zodiak, dan statistik hidup yang seru.",
    birthdate: "Tanggal lahir",
    birthTime: "Jam lahir",
    optional: "opsional",
    years: "Tahun",
    months: "Bulan",
    days: "Hari",
    totalDays: "Total hari hidup",
    totalHours: "Total jam hidup",
    bornWeekday: "Lahir pada",
    nextBirthday: "Ulang tahun berikutnya dalam",
    zodiac: "Zodiak barat",
    funFacts: "Fakta seru",
    heartbeats: "Detak jantung (~70 bpm)",
    breaths: "Napas (~16/mnt)",
    copied: "Hasil disalin.",
    copyFailed: "Gagal menyalin.",
    copy: "Salin hasil",
    pick: "Pilih tanggal lahir di atas untuk melihat hasil.",
    future: "Tanggal lahir tidak boleh di masa depan.",
    daysLabel: "hari",
    hoursLabel: "jam",
    minutesLabel: "mnt",
    secondsLabel: "dtk",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "How is the exact age computed?", a: "intervalToDuration from date-fns splits the birth-to-now interval into calendar years, months, and days, correctly handling leap years and varying month lengths. Adding an optional birth time refines the hour count." },
    id: { q: "Bagaimana umur tepat dihitung?", a: "intervalToDuration dari date-fns memecah rentang lahir-ke-sekarang menjadi tahun, bulan, dan hari kalender, dengan penanganan tahun kabisat dan panjang bulan yang benar. Menambah jam lahir opsional menyempurnakan hitungan jam." },
  },
  {
    en: { q: "Where do the fun facts come from?", a: "They are rough lifetime estimates: heartbeats at ~70 beats per minute and breaths at ~16 per minute, multiplied by your total minutes alive. For entertainment only, not medical data." },
    id: { q: "Dari mana fakta seru berasal?", a: "Itu estimasi kasar seumur hidup: detak jantung ~70 denyut per menit dan napas ~16 per menit, dikali total menit hidup Anda. Hanya untuk hiburan, bukan data medis." },
  },
  {
    en: { q: "Is my birth date stored anywhere?", a: "No. It lives only in this page's React state while you use it and is never uploaded, saved, or tracked." },
    id: { q: "Apakah tanggal lahir saya disimpan di mana pun?", a: "Tidak. Ia hanya ada di state React halaman ini selama Anda menggunakannya dan tidak pernah diunggah, disimpan, atau dilacak." },
  },
];

function zodiacFor(month: number, day: number): string {
  const signs: Array<[string, number, number, number, number]> = [
    ["Capricorn", 12, 22, 1, 19], ["Aquarius", 1, 20, 2, 18], ["Pisces", 2, 19, 3, 20],
    ["Aries", 3, 21, 4, 19], ["Taurus", 4, 20, 5, 20], ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22], ["Leo", 7, 23, 8, 22], ["Virgo", 8, 23, 9, 22],
    ["Libra", 9, 23, 10, 22], ["Scorpio", 10, 23, 11, 21], ["Sagittarius", 11, 22, 12, 21],
  ];
  for (const [name, m1, d1, m2, d2] of signs) {
    if ((month === m1 && day >= d1) || (month === m2 && day <= d2)) return name;
  }
  return "Capricorn";
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function AgeCalculatorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [birth, setBirth] = useState("");
  const [time, setTime] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    try {
      setNow(Date.now());
      const id = window.setInterval(() => {
        try {
          setNow(Date.now());
        } catch {
          // ignore tick errors
        }
      }, 1000);
      return () => window.clearInterval(id);
    } catch {
      return undefined;
    }
  }, []);

  const birthDate = useMemo(() => {
    try {
      if (!birth) return null;
      const d = new Date(time ? `${birth}T${time}:00` : `${birth}T00:00:00`);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  }, [birth, time]);

  const isFuture = birthDate !== null && birthDate.getTime() > Date.now();

  useEffect(() => {
    try {
      if (isFuture) toast.error(s.future);
    } catch {
      // ignore
    }
  }, [isFuture, s.future]);

  const stats = useMemo(() => {
    try {
      if (!birthDate || isFuture) return null;
      const ref = now > 0 ? new Date(now) : new Date();
      const dur = intervalToDuration({ start: birthDate, end: ref });
      const totalDays = differenceInDays(ref, birthDate);
      const totalHours = differenceInHours(ref, birthDate);
      const bornWeekday = format(birthDate, "EEEE");
      const zodiac = zodiacFor(birthDate.getMonth() + 1, birthDate.getDate());
      const totalMinutes = Math.max(0, Math.floor((ref.getTime() - birthDate.getTime()) / 60000));
      const heartbeats = totalMinutes * 70;
      const breaths = totalMinutes * 16;
      const thisYear = ref.getFullYear();
      let next = new Date(thisYear, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0);
      if (next.getTime() <= ref.getTime()) next = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0);
      const diffMs = Math.max(0, next.getTime() - ref.getTime());
      const cd = {
        d: Math.floor(diffMs / 86400000),
        h: Math.floor((diffMs % 86400000) / 3600000),
        m: Math.floor((diffMs % 3600000) / 60000),
        sec: Math.floor((diffMs % 60000) / 1000),
      };
      return { dur, totalDays, totalHours, bornWeekday, zodiac, heartbeats, breaths, cd };
    } catch {
      return null;
    }
  }, [birthDate, isFuture, now]);

  async function handleCopy(): Promise<void> {
    try {
      if (!stats) return;
      await navigator.clipboard.writeText(
        `${stats.dur.years}y ${stats.dur.months}m ${stats.dur.days}d — ${s.totalDays}: ${stats.totalDays}`,
      );
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Cake" slug="calculators/age-calculator" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <label htmlFor="age-birth" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.birthdate}</label>
              <input id="age-birth" type="date" value={birth} max="9999-12-31" onChange={(e) => setBirth(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="age-time" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.birthTime} <span className="font-normal text-zinc-400">({s.optional})</span>
              </label>
              <input id="age-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
          </CardContent>
        </Card>
        {!stats ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">{isFuture ? s.future : s.pick}</p>
        ) : (
          <div className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: s.years, v: String(stats.dur.years ?? 0) },
                { label: s.months, v: String(stats.dur.months ?? 0) },
                { label: s.days, v: String(stats.dur.days ?? 0) },
              ].map((r) => (
                <div key={r.label} className="rounded-xl bg-indigo-50 p-4 text-center dark:bg-indigo-950">
                  <p className="font-mono text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{r.v}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{r.label}</p>
                </div>
              ))}
            </div>
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{s.totalDays}</p>
                  <p className="font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{stats.totalDays.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{s.totalHours}</p>
                  <p className="font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{stats.totalHours.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{s.bornWeekday}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{stats.bornWeekday}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{s.zodiac}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{stats.zodiac}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 sm:col-span-2 dark:bg-emerald-950">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{s.nextBirthday}</p>
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {stats.cd.d}{s.daysLabel} : {stats.cd.h}{s.hoursLabel} : {stats.cd.m}{s.minutesLabel} : {stats.cd.sec}{s.secondsLabel}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 sm:col-span-2 dark:bg-zinc-800/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{s.funFacts}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {s.heartbeats}: <span className="font-mono font-bold tabular-nums">{stats.heartbeats.toLocaleString()}</span>
                    {" · "}
                    {s.breaths}: <span className="font-mono font-bold tabular-nums">{stats.breaths.toLocaleString()}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Button type="button" variant="outline" onClick={() => void handleCopy()}>
              <Copy className="h-4 w-4" aria-hidden />
              {s.copy}
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
