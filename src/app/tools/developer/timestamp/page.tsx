"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, CalendarClock, Eraser, Timer } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tab = "toDate" | "toStamp";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    toDateTab: string;
    toStampTab: string;
    stampLabel: string;
    stampPlaceholder: string;
    convert: string;
    clear: string;
    detectedSec: string;
    detectedMs: string;
    invalidStamp: string;
    emptyInput: string;
    convertOk: string;
    error: string;
    isoLabel: string;
    utcLabel: string;
    localeLabel: string;
    relativeLabel: string;
    dateLabel: string;
    secLabel: string;
    msLabel: string;
    invalidDate: string;
    nowTitle: string;
    nowSec: string;
    nowMs: string;
    nowIso: string;
    copy: string;
    copied: string;
  }
> = {
  en: {
    title: "Unix Timestamp Converter",
    description:
      "Convert Unix timestamps to readable dates and back. Seconds vs milliseconds are auto-detected by magnitude — everything runs locally in your browser.",
    toDateTab: "Timestamp → Date",
    toStampTab: "Date → Timestamp",
    stampLabel: "Unix timestamp",
    stampPlaceholder: "e.g. 1728192000 or 1728192000000",
    convert: "Convert",
    clear: "Clear",
    detectedSec: "detected: seconds",
    detectedMs: "detected: milliseconds",
    invalidStamp: "Invalid timestamp: enter a finite number (seconds or milliseconds).",
    emptyInput: "Enter something first.",
    convertOk: "Converted.",
    error: "Something went wrong.",
    isoLabel: "ISO 8601",
    utcLabel: "UTC",
    localeLabel: "Local",
    relativeLabel: "Relative",
    dateLabel: "Date & time",
    secLabel: "Seconds (s)",
    msLabel: "Milliseconds (ms)",
    invalidDate: "Invalid date: pick a valid date and time.",
    nowTitle: "Current timestamp (live)",
    nowSec: "Seconds",
    nowMs: "Milliseconds",
    nowIso: "ISO",
    copy: "Copy",
    copied: "Copied to clipboard.",
  },
  id: {
    title: "Konverter Unix Timestamp",
    description:
      "Ubah Unix timestamp menjadi tanggal yang mudah dibaca dan sebaliknya. Detik vs milidetik terdeteksi otomatis dari besarnya angka — semuanya berjalan lokal di browser.",
    toDateTab: "Timestamp → Tanggal",
    toStampTab: "Tanggal → Timestamp",
    stampLabel: "Unix timestamp",
    stampPlaceholder: "mis. 1728192000 atau 1728192000000",
    convert: "Konversi",
    clear: "Bersihkan",
    detectedSec: "terdeteksi: detik",
    detectedMs: "terdeteksi: milidetik",
    invalidStamp: "Timestamp tidak valid: masukkan angka berhingga (detik atau milidetik).",
    emptyInput: "Isi sesuatu terlebih dahulu.",
    convertOk: "Berhasil dikonversi.",
    error: "Terjadi kesalahan.",
    isoLabel: "ISO 8601",
    utcLabel: "UTC",
    localeLabel: "Lokal",
    relativeLabel: "Relatif",
    dateLabel: "Tanggal & waktu",
    secLabel: "Detik (s)",
    msLabel: "Milidetik (ms)",
    invalidDate: "Tanggal tidak valid: pilih tanggal dan waktu yang benar.",
    nowTitle: "Timestamp saat ini (live)",
    nowSec: "Detik",
    nowMs: "Milidetik",
    nowIso: "ISO",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are seconds vs milliseconds auto-detected?",
      a: "By magnitude: an absolute value of 1,000,000,000,000 or more is treated as milliseconds, anything smaller as seconds. A 10-digit value like 1728192000 is seconds; a 13-digit value like 1728192000000 is milliseconds.",
    },
    id: {
      q: "Bagaimana detik vs milidetik dideteksi otomatis?",
      a: "Berdasarkan besarnya angka: nilai absolut 1.000.000.000.000 atau lebih dianggap milidetik, yang lebih kecil dianggap detik. Nilai 10 digit seperti 1728192000 adalah detik; 13 digit seperti 1728192000000 adalah milidetik.",
    },
  },
  {
    en: {
      q: "What is a Unix timestamp?",
      a: "The number of seconds (or milliseconds) elapsed since 1 January 1970 00:00:00 UTC. It is timezone-independent, which is why APIs and databases use it for storing time.",
    },
    id: {
      q: "Apa itu Unix timestamp?",
      a: "Jumlah detik (atau milidetik) sejak 1 Januari 1970 00:00:00 UTC. Ia tidak bergantung zona waktu, sehingga API dan database memakainya untuk menyimpan waktu.",
    },
  },
  {
    en: {
      q: "Is my input sent anywhere?",
      a: "No. Detection, formatting, and the live clock all run entirely in your browser. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah masukanku dikirim ke mana pun?",
      a: "Tidak. Deteksi, pemformatan, dan jam live berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function stampToMs(raw: string): { ms: number; unit: "s" | "ms" } | null {
  const v = Number(raw.trim());
  if (!Number.isFinite(v)) return null;
  if (Math.abs(v) >= 1_000_000_000_000) return { ms: v, unit: "ms" };
  return { ms: v * 1000, unit: "s" };
}

function relativeTime(ts: number, now: number, locale: Locale): string {
  try {
    const diffSec = Math.round((ts - now) / 1000);
    const abs = Math.abs(diffSec);
    const future = diffSec > 0;
    const table: Array<[number, string, string]> = [
      [60, "second", "detik"],
      [3600, "minute", "menit"],
      [86400, "hour", "jam"],
      [604800, "day", "hari"],
      [2592000, "week", "minggu"],
      [31536000, "month", "bulan"],
      [Number.POSITIVE_INFINITY, "year", "tahun"],
    ];
    let value = abs;
    let unitEn = "second";
    let unitId = "detik";
    let div = 1;
    for (const [limit, en, id] of table) {
      if (abs < limit) {
        unitEn = en;
        unitId = id;
        break;
      }
      if (limit === 60) div = 60;
      else if (limit === 3600) div = 3600;
      else if (limit === 86400) div = 86400;
      else if (limit === 604800) div = 604800;
      else if (limit === 2592000) div = 2592000;
      else if (limit === 31536000) div = 31536000;
    }
    value = Math.max(0, Math.floor(abs / div));
    if (locale === "id") {
      if (value === 0) return "baru saja";
      return future ? `dalam ${value} ${unitId}` : `${value} ${unitId} yang lalu`;
    }
    if (value === 0) return "just now";
    const plural = value === 1 ? "" : "s";
    return future ? `in ${value} ${unitEn}${plural}` : `${value} ${unitEn}${plural} ago`;
  } catch {
    return "";
  }
}

const inputCls =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function TimestampPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [tab, setTab] = useState<Tab>("toDate");
  const [stampInput, setStampInput] = useState("");
  const [detected, setDetected] = useState<"s" | "ms" | null>(null);
  const [iso, setIso] = useState("");
  const [utc, setUtc] = useState("");
  const [localStr, setLocalStr] = useState("");
  const [relative, setRelative] = useState("");
  const [convertError, setConvertError] = useState<string | null>(null);

  const [dateInput, setDateInput] = useState("");
  const [outSec, setOutSec] = useState("");
  const [outMs, setOutMs] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const [liveNow, setLiveNow] = useState(0);

  useEffect(() => {
    try {
      setLiveNow(Date.now());
      const id = window.setInterval(() => {
        try {
          setLiveNow(Date.now());
        } catch {
          // ignore tick errors
        }
      }, 1000);
      return () => window.clearInterval(id);
    } catch {
      return;
    }
  }, []);

  const handleToDate = (): void => {
    try {
      setConvertError(null);
      if (stampInput.trim().length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const parsed = stampToMs(stampInput);
      if (!parsed) {
        setConvertError(s.invalidStamp);
        toast.error(s.invalidStamp);
        return;
      }
      const d = new Date(parsed.ms);
      if (Number.isNaN(d.getTime())) {
        setConvertError(s.invalidStamp);
        toast.error(s.invalidStamp);
        return;
      }
      setDetected(parsed.unit);
      setIso(d.toISOString());
      setUtc(d.toUTCString());
      setLocalStr(d.toLocaleString(locale === "id" ? "id-ID" : "en-US"));
      setRelative(relativeTime(d.getTime(), Date.now(), locale));
      toast.success(s.convertOk);
    } catch {
      setConvertError(s.error);
      toast.error(s.error);
    }
  };

  const handleToStamp = (): void => {
    try {
      setDateError(null);
      if (dateInput.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const ms = new Date(dateInput).getTime();
      if (!Number.isFinite(ms)) {
        setDateError(s.invalidDate);
        toast.error(s.invalidDate);
        return;
      }
      setOutSec(String(Math.floor(ms / 1000)));
      setOutMs(String(ms));
      toast.success(s.convertOk);
    } catch {
      setDateError(s.error);
      toast.error(s.error);
    }
  };

  const handleClearToDate = (): void => {
    try {
      setStampInput("");
      setDetected(null);
      setIso("");
      setUtc("");
      setLocalStr("");
      setRelative("");
      setConvertError(null);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClearToStamp = (): void => {
    try {
      setDateInput("");
      setOutSec("");
      setOutMs("");
      setDateError(null);
    } catch {
      toast.error(s.error);
    }
  };

  const liveSec = liveNow === 0 ? "" : String(Math.floor(liveNow / 1000));
  const liveMs = liveNow === 0 ? "" : String(liveNow);
  const liveIso = liveNow === 0 ? "" : new Date(liveNow).toISOString();

  const rows: Array<{ label: string; value: string }> = [
    { label: s.isoLabel, value: iso },
    { label: s.utcLabel, value: utc },
    { label: s.localeLabel, value: localStr },
    { label: s.relativeLabel, value: relative },
  ];

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Stamp" slug="developer/timestamp" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Timer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {s.nowTitle}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{s.nowSec}</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {liveSec || "…"}
                </p>
                <CopyButton text={liveSec} label={s.copy} size="sm" className="mt-2" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={liveSec.length === 0} />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{s.nowMs}</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {liveMs || "…"}
                </p>
                <CopyButton text={liveMs} label={s.copy} size="sm" className="mt-2" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={liveMs.length === 0} />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{s.nowIso}</p>
                <p className="mt-1 break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">{liveIso || "…"}</p>
                <CopyButton text={liveIso} label={s.copy} size="sm" className="mt-2" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={liveIso.length === 0} />
              </div>
            </div>
          </CardContent>
        </Card>

        <AnimatedTabs
          ariaLabel={s.title}
          value={tab}
          onChange={(id) => {
            try {
              setTab(id as Tab);
            } catch {
              toast.error(s.error);
            }
          }}
          tabs={[
            { id: "toDate", label: s.toDateTab },
            { id: "toStamp", label: s.toStampTab },
          ]}
        />

        <AnimatedTabPanel tabKey={tab}>
          {tab === "toDate" ? (
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="ts-input" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.stampLabel}
                    </label>
                    {detected && (
                      <Badge variant="secondary" className="font-mono">
                        <ArrowRightLeft className="mr-1 h-3 w-3" aria-hidden />
                        {detected === "ms" ? s.detectedMs : s.detectedSec}
                      </Badge>
                    )}
                  </div>
                  <input
                    id="ts-input"
                    value={stampInput}
                    onChange={(e) => {
                      try {
                        setStampInput(e.target.value);
                        setConvertError(null);
                      } catch {
                        // ignore
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleToDate();
                    }}
                    placeholder={s.stampPlaceholder}
                    inputMode="numeric"
                    spellCheck={false}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleToDate} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                    <CalendarClock aria-hidden />
                    {s.convert}
                  </Button>
                  <Button onClick={handleClearToDate} variant="outline">
                    <Eraser aria-hidden />
                    {s.clear}
                  </Button>
                </div>
                {convertError ? (
                  <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {convertError}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rows.map((r) => (
                      <div key={r.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{r.label}</p>
                          <CopyButton text={r.value} label={s.copy} size="sm" variant="ghost" className="max-w-28 flex-none" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={r.value.length === 0} />
                        </div>
                        <p className="mt-1 break-all font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          {r.value || "…"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <label htmlFor="ts-date" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.dateLabel}
                  </label>
                  <input
                    id="ts-date"
                    type="datetime-local"
                    value={dateInput}
                    onChange={(e) => {
                      try {
                        setDateInput(e.target.value);
                        setDateError(null);
                      } catch {
                        // ignore
                      }
                    }}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleToStamp} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                    <CalendarClock aria-hidden />
                    {s.convert}
                  </Button>
                  <Button onClick={handleClearToStamp} variant="outline">
                    <Eraser aria-hidden />
                    {s.clear}
                  </Button>
                </div>
                {dateError ? (
                  <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {dateError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.secLabel}</p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {outSec || "…"}
                      </p>
                      <CopyButton text={outSec} label={s.copy} size="sm" className="mt-2" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={outSec.length === 0} />
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.msLabel}</p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {outMs || "…"}
                      </p>
                      <CopyButton text={outMs} label={s.copy} size="sm" className="mt-2" copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} disabled={outMs.length === 0} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatedTabPanel>
      </div>
    </ToolLayout>
  );
}
