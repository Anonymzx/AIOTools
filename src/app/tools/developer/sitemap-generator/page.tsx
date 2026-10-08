"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eraser } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STR: Record<Locale, {
  title: string; description: string;
  urlsLabel: string; urlsPlaceholder: string;
  freq: string; priority: string; lastmod: string;
  valid: string; invalid: string; capped: string;
  output: string; download: string; clear: string;
  copied: string; empty: string; error: string; saved: string; tooMany: string;
}> = {
  en: {
    title: "Sitemap.xml Generator", description: "Paste URLs, set changefreq + priority, download a valid sitemap.xml. Deduplicated, max 1000 URLs.",
    urlsLabel: "URL list (one per line)", urlsPlaceholder: "https://example.com/\nhttps://example.com/about\nhttps://example.com/blog/hello",
    freq: "Change frequency", priority: "Priority", lastmod: "Include lastmod (today)",
    valid: "valid", invalid: "invalid", capped: "capped at 1000",
    output: "sitemap.xml preview", download: "Download sitemap.xml", clear: "Clear",
    copied: "Copied to clipboard.", empty: "Nothing to copy yet.", error: "Something went wrong.",
    saved: "sitemap.xml downloaded.", tooMany: "List capped at 1000 URLs.",
  },
  id: {
    title: "Generator Sitemap.xml", description: "Tempel URL, atur changefreq + priority, unduh sitemap.xml yang valid. Dideduplikasi, maks 1000 URL.",
    urlsLabel: "Daftar URL (satu per baris)", urlsPlaceholder: "https://example.com/\nhttps://example.com/tentang\nhttps://example.com/blog/halo",
    freq: "Frekuensi perubahan", priority: "Prioritas", lastmod: "Sertakan lastmod (hari ini)",
    valid: "valid", invalid: "tidak valid", capped: "dibatasi 1000",
    output: "Pratinjau sitemap.xml", download: "Unduh sitemap.xml", clear: "Bersihkan",
    copied: "Disalin ke clipboard.", empty: "Belum ada yang bisa disalin.", error: "Terjadi kesalahan.",
    saved: "sitemap.xml diunduh.", tooMany: "Daftar dibatasi 1000 URL.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "What makes a URL valid here?", a: "It must start with http:// or https://. Duplicates are removed automatically and the list is capped at 1000 URLs per the sitemap protocol." },
    id: { q: "Apa yang membuat URL valid di sini?", a: "Harus diawali http:// atau https://. Duplikat dihapus otomatis dan daftar dibatasi 1000 URL sesuai protokol sitemap." },
  },
  {
    en: { q: "Do changefreq and priority affect ranking?", a: "No. They are only crawl hints for search engines. Accurate URLs and fresh lastmod dates matter far more." },
    id: { q: "Apakah changefreq dan priority memengaruhi ranking?", a: "Tidak. Keduanya hanya petunjuk crawl bagi mesin pencari. URL akurat dan tanggal lastmod segar jauh lebih penting." },
  },
  {
    en: { q: "Is my URL list uploaded?", a: "No. Validation, dedupe, and XML escaping run entirely in your browser." },
    id: { q: "Apakah daftar URL-ku diunggah?", a: "Tidak. Validasi, dedupe, dan XML escaping berjalan sepenuhnya di browser-mu." },
  },
];

const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

function xmlEsc(s: string): string {
  try {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  } catch {
    return "";
  }
}

const TEXTAREA_CLS = "mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm break-all text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";
const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

export default function SitemapGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [raw, setRaw] = useState("");
  const [freq, setFreq] = useState("weekly");
  const [priority, setPriority] = useState("0.8");
  const [withDate, setWithDate] = useState(true);
  const [today, setToday] = useState("");

  useEffect(() => {
    try {
      setToday(new Date().toISOString().slice(0, 10));
    } catch {
      // keep empty — lastmod omitted
    }
  }, []);

  const parsed = useMemo(() => {
    try {
      const seen = new Set<string>();
      const valid: string[] = [];
      let invalid = 0;
      const lines = raw.split("\n");
      for (const ln of lines) {
        const t = ln.trim();
        if (t === "") continue;
        if (/^https?:\/\/\S+$/i.test(t)) {
          if (!seen.has(t)) { seen.add(t); valid.push(t); }
        } else {
          invalid += 1;
        }
      }
      const capped = valid.length > 1000;
      return { valid: capped ? valid.slice(0, 1000) : valid, invalid, capped };
    } catch {
      return { valid: [] as string[], invalid: 0, capped: false };
    }
  }, [raw]);

  const xml = useMemo(() => {
    try {
      const dateLine = withDate && today !== "" ? `    <lastmod>${today}</lastmod>\n` : "";
      const body: string[] = [];
      for (const u of parsed.valid) {
        body.push(`  <url>\n    <loc>${xmlEsc(u)}</loc>\n${dateLine}    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
      }
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body.join("\n")}\n</urlset>`;
    } catch {
      return "";
    }
  }, [parsed.valid, freq, priority, withDate, today]);

  const handleDownload = (): void => {
    try {
      if (parsed.valid.length === 0) { toast.info(s.empty); return; }
      if (parsed.capped) toast.info(s.tooMany);
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sitemap.xml";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch { /* noop */ } }, 2000);
      toast.success(s.saved);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try { setRaw(""); } catch { toast.error(s.error); }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Link2" slug="developer/sitemap-generator" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={LABEL_CLS} htmlFor="sm-urls">{s.urlsLabel}</label>
                <div className="flex gap-1.5">
                  <Badge variant="secondary" className="font-mono">{parsed.valid.length} {s.valid}</Badge>
                  <Badge variant="secondary" className="font-mono">{parsed.invalid} {s.invalid}</Badge>
                  {parsed.capped && <Badge variant="destructive" className="font-mono">{s.capped}</Badge>}
                </div>
              </div>
              <textarea id="sm-urls" value={raw} onChange={(e) => { try { setRaw(e.target.value); } catch { toast.error(s.error); } }}
                rows={8} spellCheck={false} placeholder={s.urlsPlaceholder} className={TEXTAREA_CLS} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={LABEL_CLS} htmlFor="sm-freq">{s.freq}</label>
                <select id="sm-freq" value={freq} onChange={(e) => { try { setFreq(e.target.value); } catch { toast.error(s.error); } }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                  {FREQS.map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS} htmlFor="sm-prio">{s.priority}: {priority}</label>
                <input id="sm-prio" type="range" min="0" max="1" step="0.1" value={priority}
                  onChange={(e) => { try { setPriority(e.target.value); } catch { toast.error(s.error); } }}
                  className="mt-3 w-full accent-indigo-600" />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input type="checkbox" checked={withDate} onChange={(e) => { try { setWithDate(e.target.checked); } catch { toast.error(s.error); } }}
                  className="h-4 w-4 accent-indigo-600" />
                {s.lastmod}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className={LABEL_CLS}>{s.output}</p>
            <pre className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700">{xml}</pre>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={parsed.valid.length > 0 ? xml : ""} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
              <Button type="button" variant="secondary" onClick={handleDownload}><Download aria-hidden />{s.download}</Button>
            </div>
            <Button type="button" variant="ghost" onClick={handleClear}><Eraser aria-hidden />{s.clear}</Button>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
