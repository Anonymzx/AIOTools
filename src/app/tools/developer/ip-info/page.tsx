"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface IpData {
  ip: string; isp: string; city: string; country: string;
  org: string; timezone: string; currency: string;
}

const STR: Record<Locale, {
  title: string; description: string;
  loading: string; refresh: string; copyAll: string;
  ip: string; isp: string; city: string; country: string; org: string; timezone: string; currency: string;
  browser: string; os: string; screen: string;
  deviceTitle: string; manualTitle: string; manualPlaceholder: string; lookup: string; dismiss: string;
  adblock: string; copied: string; empty: string; error: string; refreshed: string;
}> = {
  en: {
    title: "My IP Address & Info", description: "Your public IP, ISP, location plus browser, OS and screen size. Auto-detected on load.",
    loading: "Detecting…", refresh: "Refresh", copyAll: "Copy all",
    ip: "IP address", isp: "ISP", city: "City", country: "Country", org: "Organization", timezone: "Timezone", currency: "Currency",
    browser: "Browser", os: "OS", screen: "Screen",
    deviceTitle: "This device", manualTitle: "Auto-detect blocked — enter an IP manually",
    manualPlaceholder: "e.g. 8.8.8.8", lookup: "Look up", dismiss: "Clear error",
    adblock: "Fetch failed (ad-blocker, VPN, or rate limit?). You can still look up an IP manually below.",
    copied: "Copied to clipboard.", empty: "Nothing to copy yet.", error: "Something went wrong.", refreshed: "Info refreshed.",
  },
  id: {
    title: "IP & Info Saya", description: "IP publik, ISP, lokasi plus browser, OS, dan ukuran layar. Terdeteksi otomatis saat dimuat.",
    loading: "Mendeteksi…", refresh: "Muat ulang", copyAll: "Salin semua",
    ip: "Alamat IP", isp: "ISP", city: "Kota", country: "Negara", org: "Organisasi", timezone: "Zona waktu", currency: "Mata uang",
    browser: "Browser", os: "OS", screen: "Layar",
    deviceTitle: "Perangkat ini", manualTitle: "Deteksi otomatis diblokir — masukkan IP manual",
    manualPlaceholder: "cth. 8.8.8.8", lookup: "Cari", dismiss: "Hapus error",
    adblock: "Fetch gagal (ad-blocker, VPN, atau rate limit?). Kamu tetap bisa mencari IP manual di bawah.",
    copied: "Disalin ke clipboard.", empty: "Belum ada yang bisa disalin.", error: "Terjadi kesalahan.", refreshed: "Info dimuat ulang.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "Why is auto-detect blocked?", a: "Ad-blockers, strict VPNs, or API rate limits can block the free lookup. The manual mode below queries the same free endpoints for any IP you type." },
    id: { q: "Kenapa deteksi otomatis diblokir?", a: "Ad-blocker, VPN ketat, atau rate limit API bisa memblokir lookup gratis. Mode manual di bawah memakai endpoint gratis yang sama untuk IP apa pun yang kamu ketik." },
  },
  {
    en: { q: "How is browser/OS detected?", a: "Parsed locally from your user-agent string with plain regexes — no fingerprinting library, nothing uploaded." },
    id: { q: "Bagaimana browser/OS dideteksi?", a: "Di-parse lokal dari string user-agent dengan regex biasa — tanpa library fingerprinting, tanpa unggahan." },
  },
  {
    en: { q: "Is my IP stored anywhere?", a: "No. Lookups go directly from your browser to the free IP API, and results stay on this page." },
    id: { q: "Apakah IP-ku disimpan di mana pun?", a: "Tidak. Lookup berjalan langsung dari browser-mu ke API IP gratis, dan hasilnya tetap di halaman ini." },
  },
];

const EMPTY: IpData = { ip: "—", isp: "—", city: "—", country: "—", org: "—", timezone: "—", currency: "—" };
const CARD_CLS = "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";
const DT_CLS = "text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const DD_CLS = "truncate font-mono text-sm text-zinc-900 dark:text-zinc-100";

function pickStr(v: unknown): string {
  try {
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    return "—";
  } catch {
    return "—";
  }
}

function parseBrowser(ua: string): string {
  try {
    let m = ua.match(/Edg\/([\d.]+)/); if (m) return `Edge ${m[1]}`;
    m = ua.match(/OPR\/([\d.]+)/); if (m) return `Opera ${m[1]}`;
    m = ua.match(/Chrome\/([\d.]+)/); if (m) return `Chrome ${m[1]}`;
    m = ua.match(/Firefox\/([\d.]+)/); if (m) return `Firefox ${m[1]}`;
    m = ua.match(/Version\/([\d.]+).*Safari/); if (m) return `Safari ${m[1]}`;
    return "—";
  } catch {
    return "—";
  }
}

function parseOs(ua: string): string {
  try {
    if (/Windows NT 10/i.test(ua)) return "Windows 10/11";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Android/i.test(ua)) { const m = ua.match(/Android\s([\d.]+)/); return m ? `Android ${m[1]}` : "Android"; }
    if (/iPhone|iPad/i.test(ua)) { const m = ua.match(/OS\s([\d_]+)/); return m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS"; }
    if (/Mac OS X/i.test(ua)) { const m = ua.match(/Mac OS X\s([\d_]+)/); return m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS"; }
    if (/Linux/i.test(ua)) return "Linux";
    return "—";
  } catch {
    return "—";
  }
}

async function fetchIpapi(): Promise<IpData> {
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) throw new Error(`ipapi ${res.status}`);
  const j = await res.json() as Record<string, unknown>;
  return {
    ip: pickStr(j["ip"]), isp: pickStr(j["org"] ?? j["asn"]),
    city: pickStr(j["city"]), country: pickStr(j["country_name"] ?? j["country"]),
    org: pickStr(j["org"]), timezone: pickStr(j["timezone"]), currency: pickStr(j["currency"]),
  };
}

async function fetchIpwho(target?: string): Promise<IpData> {
  const url = target && target.trim() ? `https://ipwho.is/${target.trim()}` : "https://ipwho.is/";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ipwho ${res.status}`);
  const j = await res.json() as Record<string, unknown>;
  const tz = j["timezone"];
  const tzStr = typeof tz === "object" && tz !== null ? pickStr((tz as Record<string, unknown>)["id"]) : pickStr(tz);
  return {
    ip: pickStr(j["ip"]), isp: pickStr(j["isp"] ?? j["connection"]),
    city: pickStr(j["city"]), country: pickStr(j["country"]),
    org: pickStr(j["org"] ?? j["isp"]), timezone: tzStr, currency: pickStr(j["currency"]),
  };
}

export default function IpInfoPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [data, setData] = useState<IpData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [browser, setBrowser] = useState("—");
  const [os, setOs] = useState("—");
  const [screen, setScreen] = useState("—");
  const [manualIp, setManualIp] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      try {
        setData(await fetchIpapi());
      } catch {
        try {
          setData(await fetchIpwho());
        } catch {
          setError(s.adblock);
        }
      }
    } catch {
      setError(s.adblock);
    } finally {
      try { setLoading(false); } catch { /* noop */ }
    }
  };

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      setBrowser(parseBrowser(ua));
      setOs(parseOs(ua));
    } catch { /* keep dashes */ }
    try {
      setScreen(`${window.screen.width} × ${window.screen.height}`);
    } catch { /* keep dash */ }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = (): void => {
    try {
      toast.info(s.loading);
      void load().then(() => { try { toast.success(s.refreshed); } catch { /* noop */ } });
    } catch {
      toast.error(s.error);
    }
  };

  const handleLookup = (): void => {
    try {
      if (manualIp.trim() === "") { toast.info(s.empty); return; }
      setManualBusy(true);
      setError("");
      void fetchIpwho(manualIp)
        .then((d) => { try { setData(d); toast.success(s.refreshed); } catch { /* noop */ } })
        .catch(() => { try { setError(s.adblock); } catch { /* noop */ } })
        .finally(() => { try { setManualBusy(false); } catch { /* noop */ } });
    } catch {
      toast.error(s.error);
    }
  };

  const summary = `IP: ${data.ip}\nISP: ${data.isp}\nCity: ${data.city}\nCountry: ${data.country}\nOrg: ${data.org}\nTimezone: ${data.timezone}\nCurrency: ${data.currency}\nBrowser: ${browser}\nOS: ${os}\nScreen: ${screen}`;

  const cards: { k: string; v: string }[] = [
    { k: s.ip, v: loading ? s.loading : data.ip },
    { k: s.isp, v: loading ? s.loading : data.isp },
    { k: s.city, v: loading ? s.loading : data.city },
    { k: s.country, v: loading ? s.loading : data.country },
    { k: s.org, v: loading ? s.loading : data.org },
    { k: s.timezone, v: loading ? s.loading : data.timezone },
    { k: s.currency, v: loading ? s.loading : data.currency },
  ];

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Globe2" slug="developer/ip-info" faq={FAQ}>
      <div className="space-y-4">
        {error !== "" && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { try { setError(""); } catch { toast.error(s.error); } }}>
              {s.dismiss}
            </Button>
          </div>
        )}

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.ip}</p>
              <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw aria-hidden />{s.refresh}
              </Button>
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cards.map((c) => (
                <div key={c.k} className={CARD_CLS}>
                  <dt className={DT_CLS}>{c.k}</dt>
                  <dd className={DD_CLS} title={c.v}>{c.v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.deviceTitle}</p>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { k: s.browser, v: browser },
                { k: s.os, v: os },
                { k: s.screen, v: screen },
              ].map((c) => (
                <div key={c.k} className={CARD_CLS}>
                  <dt className={DT_CLS}>{c.k}</dt>
                  <dd className={DD_CLS} title={c.v}>{c.v}</dd>
                </div>
              ))}
            </dl>
            <CopyButton text={loading ? "" : summary} label={s.copyAll} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.manualTitle}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input value={manualIp} onChange={(e) => { try { setManualIp(e.target.value); } catch { toast.error(s.error); } }}
                placeholder={s.manualPlaceholder} inputMode="text" spellCheck={false}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
              <Button type="button" onClick={handleLookup} disabled={manualBusy}>{s.lookup}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
