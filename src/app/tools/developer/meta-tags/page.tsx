"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eraser } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STR: Record<Locale, {
  title: string; description: string;
  fTitle: string; fDesc: string; fUrl: string; fImage: string; fAuthor: string;
  fKeywords: string; fRobots: string; fTheme: string; fCard: string;
  cardSummary: string; cardLarge: string;
  outputLabel: string; fbPreview: string; xPreview: string;
  download: string; clear: string; copied: string; empty: string; error: string; saved: string;
}> = {
  en: {
    title: "Meta Tag Generator",
    description: "Generate SEO + Open Graph + Twitter meta tags and preview share cards. All local, nothing uploaded.",
    fTitle: "Title", fDesc: "Description", fUrl: "Canonical URL", fImage: "OG image URL",
    fAuthor: "Author", fKeywords: "Keywords (comma separated)", fRobots: "Robots",
    fTheme: "Theme color", fCard: "Twitter card",
    cardSummary: "Summary", cardLarge: "Summary large image",
    outputLabel: "Generated <head> snippet", fbPreview: "Facebook / LinkedIn preview", xPreview: "X (Twitter) preview",
    download: "Download meta.html", clear: "Clear", copied: "Copied to clipboard.",
    empty: "Nothing to copy yet.", error: "Something went wrong.", saved: "meta.html downloaded.",
  },
  id: {
    title: "Meta Tag Generator",
    description: "Buat meta tag SEO + Open Graph + Twitter dan pratinjau kartu share. Semua lokal, tanpa unggah.",
    fTitle: "Judul", fDesc: "Deskripsi", fUrl: "URL kanonis", fImage: "URL gambar OG",
    fAuthor: "Penulis", fKeywords: "Kata kunci (pisahkan koma)", fRobots: "Robots",
    fTheme: "Warna tema", fCard: "Kartu Twitter",
    cardSummary: "Ringkasan", cardLarge: "Gambar besar ringkasan",
    outputLabel: "Cuplikan <head> yang dihasilkan", fbPreview: "Pratinjau Facebook / LinkedIn", xPreview: "Pratinjau X (Twitter)",
    download: "Unduh meta.html", clear: "Bersihkan", copied: "Disalin ke clipboard.",
    empty: "Belum ada yang bisa disalin.", error: "Terjadi kesalahan.", saved: "meta.html diunduh.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "Which tags are essential for link previews?", a: "og:title, og:description, og:image, og:url plus twitter:card. This generator emits all of them with SEO basics (title, description, canonical, robots, theme-color)." },
    id: { q: "Tag apa yang wajib untuk pratinjau tautan?", a: "og:title, og:description, og:image, og:url plus twitter:card. Generator ini mengeluarkan semuanya beserta dasar SEO (title, description, canonical, robots, theme-color)." },
  },
  {
    en: { q: "What image size works best for OG?", a: "Use 1200x630 JPG/PNG under ~1MB with an absolute https URL so Facebook, X, and LinkedIn can fetch it." },
    id: { q: "Ukuran gambar OG yang ideal?", a: "Gunakan 1200x630 JPG/PNG di bawah ~1MB dengan URL https absolut agar bisa diambil Facebook, X, dan LinkedIn." },
  },
  {
    en: { q: "Is my input sent anywhere?", a: "No. The snippet is built with plain string interpolation in your browser. Nothing leaves your device." },
    id: { q: "Apakah input-ku dikirim ke mana pun?", a: "Tidak. Cuplikan dibuat dengan interpolasi string biasa di browser-mu. Tidak ada yang keluar dari perangkat." },
  },
];

function esc(s: string): string {
  try {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  } catch {
    return "";
  }
}

const INPUT_CLS = "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";
const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

export default function MetaTagsPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [robots, setRobots] = useState("index, follow");
  const [theme, setTheme] = useState("#4f46e5");
  const [card, setCard] = useState("summary_large_image");

  const snippet = useMemo(() => {
    try {
      const lines: string[] = [];
      if (title.trim()) lines.push(`<title>${esc(title.trim())}</title>`);
      if (desc.trim()) lines.push(`<meta name="description" content="${esc(desc.trim())}" />`);
      if (url.trim()) lines.push(`<link rel="canonical" href="${esc(url.trim())}" />`);
      if (author.trim()) lines.push(`<meta name="author" content="${esc(author.trim())}" />`);
      if (keywords.trim()) lines.push(`<meta name="keywords" content="${esc(keywords.trim())}" />`);
      if (robots.trim()) lines.push(`<meta name="robots" content="${esc(robots.trim())}" />`);
      if (theme.trim()) lines.push(`<meta name="theme-color" content="${esc(theme.trim())}" />`);
      if (title.trim()) lines.push(`<meta property="og:title" content="${esc(title.trim())}" />`);
      if (desc.trim()) lines.push(`<meta property="og:description" content="${esc(desc.trim())}" />`);
      lines.push(`<meta property="og:type" content="website" />`);
      if (url.trim()) lines.push(`<meta property="og:url" content="${esc(url.trim())}" />`);
      if (image.trim()) lines.push(`<meta property="og:image" content="${esc(image.trim())}" />`);
      lines.push(`<meta name="twitter:card" content="${esc(card)}" />`);
      if (title.trim()) lines.push(`<meta name="twitter:title" content="${esc(title.trim())}" />`);
      if (desc.trim()) lines.push(`<meta name="twitter:description" content="${esc(desc.trim())}" />`);
      if (image.trim()) lines.push(`<meta name="twitter:image" content="${esc(image.trim())}" />`);
      return lines.join("\n");
    } catch {
      return "";
    }
  }, [title, desc, url, image, author, keywords, robots, theme, card]);

  const handleDownload = (): void => {
    try {
      if (snippet === "") { toast.info(s.empty); return; }
      const blob = new Blob([`<!DOCTYPE html>\n<!-- AIOTools meta tags -->\n<head>\n${snippet}\n</head>\n`], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meta.html";
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
    try {
      setTitle(""); setDesc(""); setUrl(""); setImage("");
      setAuthor(""); setKeywords(""); setRobots("index, follow");
      setTheme("#4f46e5"); setCard("summary_large_image");
    } catch {
      toast.error(s.error);
    }
  };

  const set = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    try { fn(e.target.value); } catch { toast.error(s.error); }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Share2" slug="developer/meta-tags" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <div><label className={LABEL_CLS} htmlFor="mt-title">{s.fTitle}</label><input id="mt-title" value={title} onChange={set(setTitle)} className={INPUT_CLS} maxLength={120} /></div>
            <div><label className={LABEL_CLS} htmlFor="mt-url">{s.fUrl}</label><input id="mt-url" value={url} onChange={set(setUrl)} inputMode="url" className={INPUT_CLS} /></div>
            <div className="sm:col-span-2"><label className={LABEL_CLS} htmlFor="mt-desc">{s.fDesc}</label><textarea id="mt-desc" value={desc} onChange={set(setDesc)} rows={2} className={INPUT_CLS} maxLength={300} /></div>
            <div className="sm:col-span-2"><label className={LABEL_CLS} htmlFor="mt-img">{s.fImage}</label><input id="mt-img" value={image} onChange={set(setImage)} inputMode="url" className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS} htmlFor="mt-author">{s.fAuthor}</label><input id="mt-author" value={author} onChange={set(setAuthor)} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS} htmlFor="mt-kw">{s.fKeywords}</label><input id="mt-kw" value={keywords} onChange={set(setKeywords)} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS} htmlFor="mt-robots">{s.fRobots}</label>
              <select id="mt-robots" value={robots} onChange={set(setRobots)} className={INPUT_CLS}>
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL_CLS} htmlFor="mt-theme">{s.fTheme}</label><input id="mt-theme" type="color" value={theme} onChange={set(setTheme)} className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950" /></div>
              <div><label className={LABEL_CLS} htmlFor="mt-card">{s.fCard}</label>
                <select id="mt-card" value={card} onChange={set(setCard)} className={INPUT_CLS}>
                  <option value="summary">{s.cardSummary}</option>
                  <option value="summary_large_image">{s.cardLarge}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className={LABEL_CLS}>{s.outputLabel}</p>
            <pre className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700">{snippet || "—"}</pre>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={snippet} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
              <Button type="button" variant="secondary" onClick={handleDownload}><Download aria-hidden />{s.download}</Button>
            </div>
            <Button type="button" variant="ghost" onClick={handleClear}><Eraser aria-hidden />{s.clear}</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-2 p-4">
              <p className={LABEL_CLS}>{s.fbPreview}</p>
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                {image.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.trim()} alt="" className="h-40 w-full bg-zinc-100 object-cover dark:bg-zinc-800" onError={(e) => { try { (e.target as HTMLImageElement).style.display = "none"; } catch { /* noop */ } }} />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-zinc-100 font-mono text-xs text-zinc-400 dark:bg-zinc-800">1200 × 630</div>
                )}
                <div className="bg-zinc-50 p-3 dark:bg-zinc-950">
                  <p className="truncate text-[11px] uppercase tracking-wide text-zinc-500">{url.trim() || "example.com"}</p>
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{title.trim() || "—"}</p>
                  <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{desc.trim() || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-2 p-4">
              <p className={LABEL_CLS}>{s.xPreview}</p>
              <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-700">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title.trim() || "—"}</p>
                <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{desc.trim() || "—"}</p>
                {card === "summary_large_image" && (
                  image.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.trim()} alt="" className="mt-2 h-36 w-full rounded-xl bg-zinc-100 object-cover dark:bg-zinc-800" onError={(e) => { try { (e.target as HTMLImageElement).style.display = "none"; } catch { /* noop */ } }} />
                  ) : (
                    <div className="mt-2 flex h-36 w-full items-center justify-center rounded-xl bg-zinc-100 font-mono text-xs text-zinc-400 dark:bg-zinc-800">1200 × 630</div>
                  )
                )}
                <p className="mt-2 truncate font-mono text-xs text-zinc-400">{url.trim() || "example.com"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
