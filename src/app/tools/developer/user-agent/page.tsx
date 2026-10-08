"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STR: Record<Locale, {
  title: string; description: string;
  detected: string; custom: string; customPlaceholder: string;
  browser: string; os: string; device: string; engine: string; bot: string; raw: string;
  mobile: string; tablet: string; desktop: string; isBot: string; notBot: string;
  copied: string; empty: string; error: string;
}> = {
  en: {
    title: "User-Agent Parser", description: "Your user-agent auto-read on load, parsed into browser, OS, device, engine and bot detection. Paste any UA to parse it.",
    detected: "Detected user-agent", custom: "Custom UA to parse (overrides detected)",
    customPlaceholder: "Paste any User-Agent string here…",
    browser: "Browser", os: "OS", device: "Device type", engine: "Engine", bot: "Bot", raw: "Parsed JSON",
    mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", isBot: "Bot detected", notBot: "Not a bot",
    copied: "Copied to clipboard.", empty: "Nothing to copy yet.", error: "Something went wrong.",
  },
  id: {
    title: "Parser User-Agent", description: "User-agent-mu terbaca otomatis saat dimuat, di-parse menjadi browser, OS, perangkat, engine, dan deteksi bot. Tempel UA apa pun untuk di-parse.",
    detected: "User-agent terdeteksi", custom: "UA kustom untuk di-parse (menggantikan yang terdeteksi)",
    customPlaceholder: "Tempel string User-Agent apa pun di sini…",
    browser: "Browser", os: "OS", device: "Tipe perangkat", engine: "Engine", bot: "Bot", raw: "JSON hasil parse",
    mobile: "Ponsel", tablet: "Tablet", desktop: "Desktop", isBot: "Bot terdeteksi", notBot: "Bukan bot",
    copied: "Disalin ke clipboard.", empty: "Belum ada yang bisa disalin.", error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "How accurate is the parsing?", a: "It covers mainstream browsers, OSes, and known crawlers with plain regexes. Spoofed or brand-new UA strings may fall back to dashes — the raw string is always shown." },
    id: { q: "Seberapa akurat parsing-nya?", a: "Mencakup browser umum, OS, dan crawler dikenal dengan regex biasa. String UA palsu atau sangat baru bisa kembali ke strip — string mentah selalu ditampilkan." },
  },
  {
    en: { q: "Which bots are detected?", a: "Googlebot, Bingbot, Slurp, DuckDuckBot, Baiduspider, Yandex, Sogou, Facebook, Twitter, LinkedIn, Applebot, and generic bot/crawler/spider markers." },
    id: { q: "Bot apa saja yang terdeteksi?", a: "Googlebot, Bingbot, Slurp, DuckDuckBot, Baiduspider, Yandex, Sogou, Facebook, Twitter, LinkedIn, Applebot, dan penanda umum bot/crawler/spider." },
  },
  {
    en: { q: "Is my user-agent uploaded?", a: "No. Reading and parsing happen locally with string matching in your browser." },
    id: { q: "Apakah user-agent-ku diunggah?", a: "Tidak. Pembacaan dan parsing terjadi lokal dengan pencocokan string di browser-mu." },
  },
];

const BOTS = ["googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot", "sogou", "facebookexternalhit", "twitterbot", "linkedinbot", "applebot", "bot", "crawler", "spider", "mediapartners"];

interface Parsed { browser: string; os: string; device: string; engine: string; isBot: boolean; botName: string; }

function parseUa(ua: string, mobile: string, tablet: string, desktop: string): Parsed {
  try {
    if (ua.trim() === "" || ua === "—") return { browser: "—", os: "—", device: "—", engine: "—", isBot: false, botName: "—" };
    let browser = "—";
    let m = ua.match(/Edg\/([\d.]+)/); if (m) browser = `Edge ${m[1]}`;
    else { m = ua.match(/OPR\/([\d.]+)/); if (m) browser = `Opera ${m[1]}`; }
    if (browser === "—") { m = ua.match(/Chrome\/([\d.]+)/); if (m) browser = `Chrome ${m[1]}`; }
    if (browser === "—") { m = ua.match(/Firefox\/([\d.]+)/); if (m) browser = `Firefox ${m[1]}`; }
    if (browser === "—") { m = ua.match(/Version\/([\d.]+).*Safari/); if (m) browser = `Safari ${m[1]}`; }
    let os = "—";
    if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Android/i.test(ua)) { const a = ua.match(/Android\s([\d.]+)/); os = a ? `Android ${a[1]}` : "Android"; }
    else if (/iPhone|iPad/i.test(ua)) { const a = ua.match(/OS\s([\d_]+)/); os = a ? `iOS ${a[1].replace(/_/g, ".")}` : "iOS"; }
    else if (/Mac OS X/i.test(ua)) { const a = ua.match(/Mac OS X\s([\d_]+)/); os = a ? `macOS ${a[1].replace(/_/g, ".")}` : "macOS"; }
    else if (/Linux/i.test(ua)) os = "Linux";
    let device = desktop;
    if (/Tablet|iPad/i.test(ua)) device = tablet;
    else if (/Mobi|Android|iPhone/i.test(ua)) device = mobile;
    let engine = "—";
    if (/AppleWebKit/i.test(ua) && /Chrome|Edg|OPR/i.test(ua)) engine = "Blink";
    else if (/AppleWebKit/i.test(ua)) engine = "WebKit";
    else if (/Gecko/i.test(ua) && /Firefox/i.test(ua)) engine = "Gecko";
    else if (/Trident|MSIE/i.test(ua)) engine = "Trident";
    const low = ua.toLowerCase();
    let botName = "—";
    for (const b of BOTS) { if (low.includes(b)) { botName = b; break; } }
    return { browser, os, device, engine, isBot: botName !== "—", botName };
  } catch {
    return { browser: "—", os: "—", device: "—", engine: "—", isBot: false, botName: "—" };
  }
}

const TEXTAREA_CLS = "mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs break-all text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";
const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const CARD_CLS = "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";
const DT_CLS = "text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const DD_CLS = "truncate font-mono text-sm text-zinc-900 dark:text-zinc-100";

export default function UserAgentPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [detected, setDetected] = useState("—");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    try {
      setDetected(navigator.userAgent);
    } catch {
      // keep dash — SSR-safe
    }
  }, []);

  const effective = custom.trim() !== "" ? custom.trim() : detected;

  const parsed = useMemo(
    () => parseUa(effective, s.mobile, s.tablet, s.desktop),
    [effective, s.mobile, s.tablet, s.desktop],
  );

  const json = useMemo(() => {
    try {
      return JSON.stringify({ userAgent: effective, ...parsed }, null, 2);
    } catch {
      return "{}";
    }
  }, [effective, parsed]);

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Fingerprint" slug="developer/user-agent" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div>
              <p className={LABEL_CLS}>{s.detected}</p>
              <pre className="mt-1.5 max-h-28 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">{detected}</pre>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="ua-custom">{s.custom}</label>
              <textarea id="ua-custom" value={custom} onChange={(e) => { try { setCustom(e.target.value); } catch { toast.error(s.error); } }}
                rows={4} spellCheck={false} placeholder={s.customPlaceholder} className={TEXTAREA_CLS} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={CARD_CLS}><dt className={DT_CLS}>{s.browser}</dt><dd className={DD_CLS} title={parsed.browser}>{parsed.browser}</dd></div>
              <div className={CARD_CLS}><dt className={DT_CLS}>{s.os}</dt><dd className={DD_CLS} title={parsed.os}>{parsed.os}</dd></div>
              <div className={CARD_CLS}><dt className={DT_CLS}>{s.device}</dt><dd className={DD_CLS}>{parsed.device}</dd></div>
              <div className={CARD_CLS}><dt className={DT_CLS}>{s.engine}</dt><dd className={DD_CLS}>{parsed.engine}</dd></div>
              <div className={`${CARD_CLS} sm:col-span-2`}>
                <dt className={DT_CLS}>{s.bot}</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  {parsed.isBot ? (
                    <Badge variant="destructive" className="font-mono"><Bot aria-hidden className="mr-1 h-3 w-3" />{s.isBot}: {parsed.botName}</Badge>
                  ) : (
                    <Badge variant="secondary" className="font-mono">{s.notBot}</Badge>
                  )}
                </dd>
              </div>
            </dl>
            <div>
              <p className={LABEL_CLS}>{s.raw}</p>
              <pre className="mt-1.5 max-h-56 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700">{json}</pre>
            </div>
            <CopyButton text={json} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
