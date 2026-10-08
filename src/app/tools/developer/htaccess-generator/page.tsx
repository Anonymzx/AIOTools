"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STR: Record<Locale, {
  title: string; description: string;
  https: string; httpsNote: string;
  www: string; wwwNone: string; wwwWww: string; wwwNon: string;
  compress: string; compressNote: string;
  caching: string; cachingNote: string;
  security: string; securityNote: string;
  notFound: string; notFoundPlaceholder: string;
  blockXmlrpc: string; blockEnv: string;
  output: string; download: string;
  copied: string; empty: string; error: string; saved: string;
  danger: string; on: string; off: string;
}> = {
  en: {
    title: ".htaccess Generator", description: "Assemble HTTPS, canonical, compression, caching, security headers, 404 and block rules. Copy or download.",
    https: "Force HTTPS redirect", httpsNote: "301 redirect all HTTP traffic to HTTPS.",
    www: "www canonical", wwwNone: "Leave as-is", wwwWww: "Force www", wwwNon: "Force non-www",
    compress: "Gzip / Brotli compression", compressNote: "Compress text, CSS, JS, SVG, fonts via mod_deflate.",
    caching: "Browser caching (1 year assets)", cachingNote: "Expires + Cache-Control for images, fonts, CSS, JS.",
    security: "Security headers", securityNote: "X-Frame-Options, X-Content-Type-Options, Referrer-Policy + basic CSP.",
    notFound: "Custom 404 page", notFoundPlaceholder: "/404.html",
    blockXmlrpc: "Block xmlrpc.php (WordPress)", blockEnv: "Block .env / .git / sensitive files",
    output: "Assembled .htaccess", download: "Download .htaccess",
    copied: "Copied to clipboard.", empty: "Nothing to copy yet.", error: "Something went wrong.", saved: ".htaccess downloaded.",
    danger: "Test on staging first — a bad .htaccess can take your site down (500 errors). Keep a backup and edit via FTP/SSH so you can revert.",
    on: "ON", off: "OFF",
  },
  id: {
    title: "Generator .htaccess", description: "Susun redirect HTTPS, kanonis, kompresi, caching, header keamanan, 404, dan aturan blokir. Salin atau unduh.",
    https: "Paksa redirect HTTPS", httpsNote: "Redirect 301 semua trafik HTTP ke HTTPS.",
    www: "Kanonis www", wwwNone: "Biarkan apa adanya", wwwWww: "Paksa www", wwwNon: "Paksa non-www",
    compress: "Kompresi Gzip / Brotli", compressNote: "Kompres teks, CSS, JS, SVG, font via mod_deflate.",
    caching: "Caching browser (aset 1 tahun)", cachingNote: "Expires + Cache-Control untuk gambar, font, CSS, JS.",
    security: "Header keamanan", securityNote: "X-Frame-Options, X-Content-Type-Options, Referrer-Policy + CSP dasar.",
    notFound: "Halaman 404 kustom", notFoundPlaceholder: "/404.html",
    blockXmlrpc: "Blokir xmlrpc.php (WordPress)", blockEnv: "Blokir file .env / .git / sensitif",
    output: ".htaccess hasil rakitan", download: "Unduh .htaccess",
    copied: "Disalin ke clipboard.", empty: "Belum ada yang bisa disalin.", error: "Terjadi kesalahan.", saved: ".htaccess diunduh.",
    danger: "Uji di staging dulu — .htaccess yang salah bisa menumbangkan situs (error 500). Simpan cadangan dan edit via FTP/SSH agar bisa dikembalikan.",
    on: "AKTIF", off: "MATI",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "Where do I upload .htaccess?", a: "To your site's document root over FTP/SSH (Apache + mod_rewrite). Nginx and most static hosts ignore .htaccess — use their own redirect settings instead." },
    id: { q: "Ke mana mengunggah .htaccess?", a: "Ke document root situs via FTP/SSH (Apache + mod_rewrite). Nginx dan kebanyakan host statis mengabaikan .htaccess — gunakan pengaturan redirect masing-masing." },
  },
  {
    en: { q: "Why do I get a 500 error after editing?", a: "Usually an unsupported directive or typo. Restore your backup, then re-enable sections one by one on staging until you find the culprit." },
    id: { q: "Kenapa muncul error 500 setelah mengedit?", a: "Biasanya direktif tak didukung atau salah ketik. Kembalikan cadangan, lalu aktifkan bagian satu per satu di staging sampai ketemu penyebabnya." },
  },
  {
    en: { q: "Is anything uploaded?", a: "No. The file is assembled from your toggles with plain string templates in your browser." },
    id: { q: "Apakah ada yang diunggah?", a: "Tidak. File dirakit dari togglemu dengan template string biasa di browser-mu." },
  },
];

const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const NOTE_CLS = "text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";

export default function HtaccessGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [https, setHttps] = useState(true);
  const [www, setWww] = useState("none");
  const [compress, setCompress] = useState(true);
  const [caching, setCaching] = useState(true);
  const [security, setSecurity] = useState(true);
  const [notFound, setNotFound] = useState("/404.html");
  const [use404, setUse404] = useState(false);
  const [blockXmlrpc, setBlockXmlrpc] = useState(false);
  const [blockEnv, setBlockEnv] = useState(true);

  const output = useMemo(() => {
    try {
      const parts: string[] = ["# Generated with AIOTools (.htaccess Generator)", "RewriteEngine On", ""];
      if (https) parts.push("# Force HTTPS", "RewriteCond %{HTTPS} off", "RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]", "");
      if (www === "www") parts.push("# Force www", "RewriteCond %{HTTP_HOST} !^www\\. [NC]", "RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]", "");
      if (www === "non-www") parts.push("# Force non-www", "RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]", "RewriteRule ^(.*)$ https://%1/$1 [L,R=301]", "");
      if (compress) parts.push("# Gzip/Brotli compression", "<IfModule mod_deflate.c>", "  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml font/woff2", "</IfModule>", "");
      if (caching) parts.push("# Browser caching", "<IfModule mod_expires.c>", "  ExpiresActive On", '  ExpiresByType image/* "access plus 1 year"', '  ExpiresByType font/* "access plus 1 year"', '  ExpiresByType text/css "access plus 1 month"', '  ExpiresByType application/javascript "access plus 1 month"', "</IfModule>", "");
      if (security) parts.push("# Security headers", "<IfModule mod_headers.c>", '  Header always set X-Frame-Options "SAMEORIGIN"', '  Header always set X-Content-Type-Options "nosniff"', '  Header always set Referrer-Policy "strict-origin-when-cross-origin"', "  Header always set Content-Security-Policy \"default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'\"", "</IfModule>", "");
      if (use404 && notFound.trim()) parts.push("# Custom 404", `ErrorDocument 404 ${notFound.trim()}`, "");
      if (blockXmlrpc) parts.push("# Block xmlrpc.php", "<Files xmlrpc.php>", "  Require all denied", "</Files>", "");
      if (blockEnv) parts.push("# Block sensitive files", "<FilesMatch \"^(\\.env|\\.git|\\.htaccess|wp-config\\.php|.*\\.sql)$\">", "  Require all denied", "</FilesMatch>", "");
      return parts.join("\n").trim() + "\n";
    } catch {
      return "";
    }
  }, [https, www, compress, caching, security, notFound, use404, blockXmlrpc, blockEnv]);

  const toggle = (fn: (v: boolean) => void, v: boolean) => (): void => {
    try { fn(!v); } catch { toast.error(s.error); }
  };

  const handleDownload = (): void => {
    try {
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ".htaccess";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch { /* noop */ } }, 2000);
      toast.success(s.saved);
    } catch {
      toast.error(s.error);
    }
  };

  const rows: { label: string; note: string; value: boolean; onFlip: () => void; id: string }[] = [
    { label: s.https, note: s.httpsNote, value: https, onFlip: toggle(setHttps, https), id: "ht-https" },
    { label: s.compress, note: s.compressNote, value: compress, onFlip: toggle(setCompress, compress), id: "ht-gzip" },
    { label: s.caching, note: s.cachingNote, value: caching, onFlip: toggle(setCaching, caching), id: "ht-cache" },
    { label: s.security, note: s.securityNote, value: security, onFlip: toggle(setSecurity, security), id: "ht-sec" },
    { label: s.blockXmlrpc, note: "WordPress", value: blockXmlrpc, onFlip: toggle(setBlockXmlrpc, blockXmlrpc), id: "ht-xmlrpc" },
    { label: s.blockEnv, note: ".env / .git", value: blockEnv, onFlip: toggle(setBlockEnv, blockEnv), id: "ht-env" },
  ];

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileCog" slug="developer/htaccess-generator" faq={FAQ}>
      <div className="space-y-4">
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{s.danger}</span>
        </div>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
                <div className="min-w-0">
                  <p className={LABEL_CLS}>{r.label}</p>
                  <p className={NOTE_CLS}>{r.note}</p>
                </div>
                <button type="button" role="switch" aria-checked={r.value} aria-label={r.label} onClick={r.onFlip}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${r.value ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.value ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div>
              <p className={LABEL_CLS}>{s.www}</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[
                  ["none", s.wwwNone],
                  ["www", s.wwwWww],
                  ["non-www", s.wwwNon],
                ].map(([v, label]) => (
                  <button key={v} type="button" onClick={() => { try { setWww(v); } catch { toast.error(s.error); } }}
                    aria-pressed={www === v}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${www === v ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className={LABEL_CLS} htmlFor="ht-404">{s.notFound}</label>
              <button type="button" role="switch" aria-checked={use404} aria-label={s.notFound}
                onClick={toggle(setUse404, use404)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${use404 ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${use404 ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {use404 && (
              <input id="ht-404" value={notFound} onChange={(e) => { try { setNotFound(e.target.value); } catch { toast.error(s.error); } }}
                placeholder={s.notFoundPlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className={LABEL_CLS}>{s.output}</p>
            <pre className="max-h-80 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700">{output}</pre>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={output} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
              <Button type="button" variant="secondary" onClick={handleDownload}><Download aria-hidden />{s.download}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
