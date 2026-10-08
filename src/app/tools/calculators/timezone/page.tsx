"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    datetime: string;
    source: string;
    results: string;
    zone: string;
    converted: string;
    nowRow: string;
    empty: string;
    invalid: string;
    unsupported: string;
    error: string;
  }
> = {
  en: {
    title: "Time Zone Converter",
    description:
      "Convert any local time across WIB, WITA, WIT, UTC and major world zones — plus a live world clock. All conversion runs in your browser.",
    datetime: "Date & time",
    source: "Source time zone",
    results: "Converted times",
    zone: "Zone",
    converted: "Local time",
    nowRow: "Now (live)",
    empty: "Pick a date & time to see conversions.",
    invalid: "Enter a valid date & time.",
    unsupported: "Time-zone conversion is not supported in this browser.",
    error: "Something went wrong.",
  },
  id: {
    title: "Konverter Zona Waktu (Time Zone Converter)",
    description:
      "Konversi waktu lokal apa pun ke WIB, WITA, WIT, UTC, dan zona dunia utama — plus jam dunia live. Semua konversi berjalan di browser.",
    datetime: "Tanggal & waktu",
    source: "Zona waktu sumber",
    results: "Waktu hasil konversi",
    zone: "Zona",
    converted: "Waktu lokal",
    nowRow: "Sekarang (live)",
    empty: "Pilih tanggal & waktu untuk melihat konversi.",
    invalid: "Masukkan tanggal & waktu yang valid.",
    unsupported: "Konversi zona waktu tidak didukung di browser ini.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is a datetime-local interpreted in the source zone?",
      a: "The input has no zone info, so it is read as wall-clock time in the selected source zone and mapped to an exact UTC instant (iterative offset lookup, DST-aware). That instant is then rendered into each target zone with Intl.DateTimeFormat — so half-hour zones like Adelaide and DST shifts are handled correctly.",
    },
    id: {
      q: "Bagaimana datetime-local ditafsirkan dalam zona sumber?",
      a: "Masukan tidak membawa info zona, jadi dibaca sebagai waktu dinding (wall-clock) di zona sumber terpilih lalu dipetakan ke instans UTC yang tepat (pencarian offset iteratif, sadar DST). Instans itu kemudian dirender ke tiap zona target dengan Intl.DateTimeFormat — sehingga zona setengah jam seperti Adelaide dan pergeseran DST tertangani benar.",
    },
  },
  {
    en: {
      q: "Which zones are available?",
      a: "The source picker lists WIB (Asia/Jakarta), WITA (Asia/Makassar), WIT (Asia/Jayapura), UTC, plus London, Paris, Moscow, Dubai, Karachi, Dhaka, Bangkok, Singapore, Tokyo, Sydney, Los Angeles, and New York — extended automatically with Intl.supportedValuesOf where the browser supports it. Results show a fixed 6-zone table: Jakarta, Makassar, Jayapura, UTC, London, New York.",
    },
    id: {
      q: "Zona apa saja yang tersedia?",
      a: "Pemilih sumber mencantumkan WIB (Asia/Jakarta), WITA (Asia/Makassar), WIT (Asia/Jayapura), UTC, plus London, Paris, Moskow, Dubai, Karachi, Dhaka, Bangkok, Singapura, Tokyo, Sydney, Los Angeles, dan New York — diperluas otomatis dengan Intl.supportedValuesOf jika browser mendukung. Hasil menampilkan tabel 6 zona tetap: Jakarta, Makassar, Jayapura, UTC, London, New York.",
    },
  },
  {
    en: {
      q: "Is any time data sent anywhere?",
      a: "No. Parsing, offset math, and formatting all run locally with the Intl API. The live world-clock row is a 1-second setInterval that is cleaned up on unmount; nothing is uploaded.",
    },
    id: {
      q: "Apakah data waktu dikirim ke mana pun?",
      a: "Tidak. Parsing, hitungan offset, dan pemformatan semuanya berjalan lokal dengan Intl API. Baris jam dunia live memakai setInterval 1 detik yang dibersihkan saat unmount; tidak ada yang diunggah.",
    },
  },
];

const FALLBACK_ZONES: string[] = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Los_Angeles",
  "America/New_York",
];

const TARGET_ZONES: string[] = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "UTC",
  "Europe/London",
  "America/New_York",
];

function shortLabel(tz: string): string {
  try {
    if (tz === "Asia/Jakarta") return "WIB";
    if (tz === "Asia/Makassar") return "WITA";
    if (tz === "Asia/Jayapura") return "WIT";
    const parts = tz.split("/");
    return parts[parts.length - 1]?.replace(/_/g, " ") ?? tz;
  } catch {
    return tz;
  }
}

function getSourceZones(): string[] {
  try {
    const IntlWithValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof IntlWithValues.supportedValuesOf === "function") {
      const all = IntlWithValues.supportedValuesOf("timeZone");
      const wanted = new Set(FALLBACK_ZONES);
      const matched = all.filter((z) => wanted.has(z));
      if (matched.length >= 8) return matched;
    }
    return FALLBACK_ZONES;
  } catch {
    return FALLBACK_ZONES;
  }
}

function getTzOffsetMs(instantMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(instantMs));
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instantMs;
}

/** Interpret "YYYY-MM-DDTHH:mm" as wall time in `timeZone` → UTC epoch ms. DST-aware. */
function zonedTimeToUtc(input: string, timeZone: string): number | null {
  try {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(input);
    if (!m) return null;
    const [, Y, Mo, D, H, Mi] = m;
    const naiveUtc = Date.UTC(Number(Y), Number(Mo) - 1, Number(D), Number(H), Number(Mi));
    if (!Number.isFinite(naiveUtc)) return null;
    let guess = naiveUtc;
    for (let i = 0; i < 3; i++) {
      guess = naiveUtc - getTzOffsetMs(guess, timeZone);
    }
    return guess;
  } catch {
    return null;
  }
}

function formatInZone(instantMs: number, timeZone: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      timeZone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(instantMs));
  } catch {
    return "—";
  }
}

export default function TimezonePage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [input, setInput] = useState("");
  const [source, setSource] = useState("Asia/Jakarta");
  const [now, setNow] = useState(0);

  const zones = useMemo(() => getSourceZones(), []);

  useEffect(() => {
    try {
      setNow(Date.now());
      const id = setInterval(() => {
        try {
          setNow(Date.now());
        } catch {
          // ignore tick errors
        }
      }, 1000);
      return () => clearInterval(id);
    } catch {
      toast.error(s.error);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const instant = useMemo(() => {
    try {
      if (input.trim() === "") return { state: "empty" as const };
      const ms = zonedTimeToUtc(input, source);
      if (ms === null || !Number.isFinite(ms)) return { state: "invalid" as const };
      return { state: "ok" as const, ms };
    } catch {
      return { state: "invalid" as const };
    }
  }, [input, source]);

  const supported = useMemo(() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: source });
      return true;
    } catch {
      return false;
    }
  }, [source]);

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Repeat"
      slug="calculators/timezone"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2">
              <label htmlFor="tz-input" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.datetime}
              </label>
              <input
                id="tz-input"
                type="datetime-local"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tz-source" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.source}
              </label>
              <select
                id="tz-source"
                value={source}
                onChange={(e) => {
                  try {
                    setSource(e.target.value);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={inputCls}
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {shortLabel(z)} — {z}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {s.results}
            </span>
            {!supported ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">{s.unsupported}</p>
            ) : instant.state !== "ok" ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {instant.state === "empty" ? s.empty : s.invalid}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                      <th scope="col" className="px-4 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        {s.zone}
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        {s.converted}
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        {s.nowRow}
                      </th>
                    </tr>
                  </thead>
                  <tbody aria-live="polite">
                    {TARGET_ZONES.map((tz) => (
                      <tr
                        key={tz}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                      >
                        <td className="px-4 py-2.5">
                          <span className="mr-1.5 inline-block rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            {shortLabel(tz)}
                          </span>
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{tz}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatInZone(instant.ms, tz, locale)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {now > 0 ? formatInZone(now, tz, locale) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
