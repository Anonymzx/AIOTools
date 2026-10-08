"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    tabNumber: string;
    tabName: string;
    tabColor: string;
    tabDice: string;
    min: string;
    max: string;
    count: string;
    unique: string;
    sorted: string;
    generate: string;
    copyAll: string;
    download: string;
    nameLang: string;
    nameFilter: string;
    nameFilterPh: string;
    colorFormat: string;
    tapToCopy: string;
    coin: string;
    dice: string;
    flip: string;
    roll: string;
    heads: string;
    tails: string;
    results: string;
    empty: string;
    invalidRange: string;
    tooMany: string;
    copied: string;
    downloaded: string;
    error: string;
  }
> = {
  en: {
    title: "Random Generator",
    description:
      "Random numbers, names (EN + ID), colors, coin flips, and dice (d4–d20). Copy or download results — 100% in your browser.",
    tabNumber: "Number",
    tabName: "Name",
    tabColor: "Color",
    tabDice: "Coin & Dice",
    min: "Min",
    max: "Max",
    count: "Count",
    unique: "Unique only",
    sorted: "Sorted",
    generate: "Generate",
    copyAll: "Copy all",
    download: "Download .txt",
    nameLang: "Language",
    nameFilter: "Contains filter (optional)",
    nameFilterPh: "e.g. an — leave empty for all",
    colorFormat: "Format",
    tapToCopy: "Tap a swatch to copy",
    coin: "Coin",
    dice: "Dice",
    flip: "Flip coin",
    roll: "Roll",
    heads: "Heads",
    tails: "Tails",
    results: "Results",
    empty: "Press Generate to see results.",
    invalidRange: "Min must be less than or equal to Max.",
    tooMany: "Count is too large for unique values in this range.",
    copied: "Results copied to clipboard.",
    downloaded: "Results downloaded.",
    error: "Something went wrong.",
  },
  id: {
    title: "Generator Acak",
    description:
      "Angka acak, nama (EN + ID), warna, lempar koin, dan dadu (d4–d20). Salin atau unduh hasil — 100% di browser.",
    tabNumber: "Angka",
    tabName: "Nama",
    tabColor: "Warna",
    tabDice: "Koin & Dadu",
    min: "Min",
    max: "Maks",
    count: "Jumlah",
    unique: "Unik saja",
    sorted: "Urutkan",
    generate: "Buat",
    copyAll: "Salin semua",
    download: "Unduh .txt",
    nameLang: "Bahasa",
    nameFilter: "Filter mengandung (opsional)",
    nameFilterPh: "mis. an — kosongkan untuk semua",
    colorFormat: "Format",
    tapToCopy: "Ketuk swatch untuk menyalin",
    coin: "Koin",
    dice: "Dadu",
    flip: "Lempar koin",
    roll: "Kocok",
    heads: "Kepala",
    tails: "Ekor",
    results: "Hasil",
    empty: "Tekan Buat untuk melihat hasil.",
    invalidRange: "Min harus kurang dari atau sama dengan Maks.",
    tooMany: "Jumlah terlalu besar untuk nilai unik di rentang ini.",
    copied: "Hasil disalin ke clipboard.",
    downloaded: "Hasil diunduh.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How random are the results?",
      a: "Numbers, names, colors, and dice all use crypto.getRandomValues — a cryptographically secure source — not Math.random. Good enough for giveaways, games, and sampling.",
    },
    id: {
      q: "Seberapa acak hasilnya?",
      a: "Angka, nama, warna, dan dadu semuanya memakai crypto.getRandomValues — sumber aman kriptografis — bukan Math.random. Cukup untuk giveaway, game, dan sampling.",
    },
  },
  {
    en: {
      q: "Can I download the generated list?",
      a: "Yes — the Download button saves all current results as a plain .txt file, and Copy all puts them on your clipboard.",
    },
    id: {
      q: "Bisakah mengunduh daftar yang dibuat?",
      a: "Ya — tombol Unduh menyimpan semua hasil saat ini sebagai file .txt biasa, dan Salin semua menaruhnya di clipboard.",
    },
  },
  {
    en: {
      q: "Is anything sent to a server?",
      a: "No. Generation, name lists, and color math run entirely in your browser.",
    },
    id: {
      q: "Apakah ada yang dikirim ke server?",
      a: "Tidak. Pembuatan, daftar nama, dan perhitungan warna berjalan sepenuhnya di browser Anda.",
    },
  },
];

const NAMES_EN: string[] = [
  "Aiden", "Sophia", "Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava",
  "Elijah", "Mia", "James", "Amelia", "Benjamin", "Harper", "Lucas", "Evelyn",
  "Henry", "Abigail", "Alexander", "Ella", "Jack", "Scarlett", "Owen", "Grace",
  "Daniel", "Chloe", "Matthew", "Victoria", "Samuel", "Lily",
];

const NAMES_ID: string[] = [
  "Andi", "Siti", "Budi", "Dewi", "Agus", "Rina", "Joko", "Putri",
  "Hendra", "Maya", "Rudi", "Nina", "Dedi", "Fitri", "Yoga", "Intan",
  "Fajar", "Ratna", "Ilham", "Wulan", "Rizky", "Ayu", "Bagus", "Sari",
  "Dimas", "Lestari", "Eko", "Nadia", "Taufik", "Kirana",
];

type Tab = "number" | "name" | "color" | "dice";
type NameLang = "en" | "id";
type ColorFormat = "hex" | "rgb" | "hsl";

function randInt(min: number, max: number): number {
  const span = max - min + 1;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return min + Number((buf[0] as number) % span);
}

function randByte(): number {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return buf[0] as number;
}

function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  const l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = 0;
  if (mx === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (mx === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function RandomGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [tab, setTab] = useState<Tab>("number");
  // Number
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [unique, setUnique] = useState(true);
  const [sorted, setSorted] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  // Name
  const [nameLang, setNameLang] = useState<NameLang>("en");
  const [nameCount, setNameCount] = useState(5);
  const [nameFilter, setNameFilter] = useState("");
  const [names, setNames] = useState<string[]>([]);
  // Color
  const [colorCount, setColorCount] = useState(6);
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [colors, setColors] = useState<string[]>([]);
  // Coin & dice
  const [coin, setCoin] = useState<"H" | "T">("H");
  const [flips, setFlips] = useState(0);
  const [sides, setSides] = useState(6);
  const [die, setDie] = useState(6);
  const [rolling, setRolling] = useState(false);

  const handleNumbers = (): void => {
    try {
      if (min > max) {
        toast.error(s.invalidRange);
        return;
      }
      const n = Math.min(1000, Math.max(1, Math.floor(count)));
      if (unique && n > max - min + 1) {
        toast.error(s.tooMany);
        return;
      }
      const out: number[] = [];
      if (unique) {
        const pool = new Set<number>();
        let guard = 0;
        while (pool.size < n && guard < n * 50 + 100) {
          pool.add(randInt(min, max));
          guard += 1;
        }
        pool.forEach((v) => out.push(v));
      } else {
        for (let i = 0; i < n; i += 1) out.push(randInt(min, max));
      }
      if (sorted) out.sort((a, b) => a - b);
      setNumbers(out);
    } catch {
      toast.error(s.error);
    }
  };

  const handleNames = (): void => {
    try {
      const pool = (nameLang === "en" ? NAMES_EN : NAMES_ID).filter((nm) =>
        nameFilter.trim() === "" ? true : nm.toLowerCase().includes(nameFilter.trim().toLowerCase()),
      );
      if (pool.length === 0) {
        setNames([]);
        return;
      }
      const n = Math.min(100, Math.max(1, Math.floor(nameCount)));
      const out: string[] = [];
      for (let i = 0; i < n; i += 1) out.push(pool[randInt(0, pool.length - 1)] as string);
      setNames(out);
    } catch {
      toast.error(s.error);
    }
  };

  const handleColors = (): void => {
    try {
      const n = Math.min(50, Math.max(1, Math.floor(colorCount)));
      const out: string[] = [];
      for (let i = 0; i < n; i += 1) {
        const r = randByte();
        const g = randByte();
        const b = randByte();
        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        if (colorFormat === "hex") out.push(hex.toUpperCase());
        else if (colorFormat === "rgb") out.push(`rgb(${r}, ${g}, ${b})`);
        else {
          const h = rgbToHsl(r, g, b);
          out.push(hslToCss(h.h, h.s, h.l));
        }
      }
      setColors(out);
    } catch {
      toast.error(s.error);
    }
  };

  const handleFlip = (): void => {
    try {
      const buf = new Uint8Array(1);
      crypto.getRandomValues(buf);
      setCoin((buf[0] as number) % 2 === 0 ? "H" : "T");
      setFlips((f) => f + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRoll = (): void => {
    try {
      if (rolling) return;
      setRolling(true);
      const final = randInt(1, sides);
      let ticks = 0;
      const id = window.setInterval(() => {
        ticks += 1;
        setDie(randInt(1, sides));
        if (ticks >= 8) {
          window.clearInterval(id);
          setDie(final);
          setRolling(false);
        }
      }, 70);
    } catch {
      setRolling(false);
      toast.error(s.error);
    }
  };

  const copyText =
    tab === "number" ? numbers.join(", ") : tab === "name" ? names.join(", ") : colors.join("\n");

  const handleDownload = (): void => {
    try {
      if (copyText === "") {
        toast.info(s.empty);
        return;
      }
      const blob = new Blob([copyText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `random-${tab}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(s.downloaded);
    } catch {
      toast.error(s.error);
    }
  };

  const numCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";
  const labelCls = "text-xs font-semibold text-zinc-600 dark:text-zinc-300";
  const tabs: { id: Tab; label: string }[] = [
    { id: "number", label: s.tabNumber },
    { id: "name", label: s.tabName },
    { id: "color", label: s.tabColor },
    { id: "dice", label: s.tabDice },
  ];

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Hash"
      slug="productivity/random-generator"
      faq={FAQ}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "number" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="rg-min" className={labelCls}>{s.min}</label>
                  <input id="rg-min" type="number" value={min} onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setMin(Number.isFinite(v) ? Math.floor(v) : 1);
                    } catch { toast.error(s.error); }
                  }} className={numCls} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rg-max" className={labelCls}>{s.max}</label>
                  <input id="rg-max" type="number" value={max} onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setMax(Number.isFinite(v) ? Math.floor(v) : 100);
                    } catch { toast.error(s.error); }
                  }} className={numCls} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rg-count" className={labelCls}>{s.count}</label>
                  <input id="rg-count" type="number" min={1} max={1000} value={count} onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setCount(Number.isFinite(v) ? Math.min(1000, Math.max(1, Math.floor(v))) : 5);
                    } catch { toast.error(s.error); }
                  }} className={numCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" />
                  {s.unique}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" />
                  {s.sorted}
                </label>
              </div>
              <Button onClick={handleNumbers}>{s.generate}</Button>
            </CardContent>
          </Card>
        )}

        {tab === "name" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className={labelCls}>{s.nameLang}</span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant={nameLang === "en" ? "default" : "outline"} onClick={() => setNameLang("en")}>EN</Button>
                    <Button size="sm" variant={nameLang === "id" ? "default" : "outline"} onClick={() => setNameLang("id")}>ID</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rg-ncount" className={labelCls}>{s.count}</label>
                  <input id="rg-ncount" type="number" min={1} max={100} value={nameCount} onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setNameCount(Number.isFinite(v) ? Math.min(100, Math.max(1, Math.floor(v))) : 5);
                    } catch { toast.error(s.error); }
                  }} className={numCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rg-nfilter" className={labelCls}>{s.nameFilter}</label>
                <input id="rg-nfilter" type="text" value={nameFilter} placeholder={s.nameFilterPh} onChange={(e) => setNameFilter(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
              <Button onClick={handleNames}>{s.generate}</Button>
            </CardContent>
          </Card>
        )}

        {tab === "color" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="rg-ccount" className={labelCls}>{s.count}</label>
                  <input id="rg-ccount" type="number" min={1} max={50} value={colorCount} onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setColorCount(Number.isFinite(v) ? Math.min(50, Math.max(1, Math.floor(v))) : 6);
                    } catch { toast.error(s.error); }
                  }} className={numCls} />
                </div>
                <div className="space-y-1.5">
                  <span className={labelCls}>{s.colorFormat}</span>
                  <div className="flex gap-1.5">
                    {(["hex", "rgb", "hsl"] as ColorFormat[]).map((f) => (
                      <Button key={f} size="sm" variant={colorFormat === f ? "default" : "outline"} onClick={() => setColorFormat(f)}>
                        {f.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleColors}>{s.generate}</Button>
            </CardContent>
          </Card>
        )}

        {tab === "dice" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="flex flex-col items-center gap-3 p-4 sm:p-6">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.coin}</h2>
                <motion.div
                  key={flips}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 720 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-2xl font-extrabold text-amber-950 shadow-md"
                >
                  {coin}
                </motion.div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {coin === "H" ? s.heads : s.tails}
                </p>
                <Button onClick={handleFlip}>{s.flip}</Button>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="flex flex-col items-center gap-3 p-4 sm:p-6">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.dice}</h2>
                <motion.div
                  key={die}
                  initial={{ scale: 0.7, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 font-mono text-3xl font-extrabold tabular-nums text-white shadow-md"
                >
                  {die}
                </motion.div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[4, 6, 8, 10, 12, 20].map((d) => (
                    <Button key={d} size="sm" variant={sides === d ? "default" : "outline"} onClick={() => setSides(d)}>
                      d{d}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleRoll} disabled={rolling}>{s.roll} d{sides}</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {tab !== "dice" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.results}</h2>
              {tab === "color" && colors.length > 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.tapToCopy}</p>
              )}
              {copyText === "" ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">{s.empty}</p>
              ) : tab === "color" ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {colors.map((c, i) => {
                    const rgb = c.startsWith("#") ? hexToRgb(c) : null;
                    const bg = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : c;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          try {
                            void navigator.clipboard.writeText(c);
                            toast.success(s.copied);
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        className="overflow-hidden rounded-xl border border-zinc-200 text-left dark:border-zinc-700"
                      >
                        <span className="block h-14 w-full" style={{ background: bg }} />
                        <span className="block truncate px-2 py-1.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="break-words font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {copyText}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <CopyButton text={copyText} label={s.copyAll} copiedMessage={s.copied} errorMessage={s.error} className="flex-none" />
                <Button variant="outline" onClick={handleDownload}>
                  {s.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
