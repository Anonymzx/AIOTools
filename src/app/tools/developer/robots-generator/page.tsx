"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eraser, Plus, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RuleRow { id: number; agent: string; kind: "Allow" | "Disallow"; path: string; }

const STR: Record<Locale, {
  title: string; description: string;
  builder: string; rawMode: string; visualMode: string;
  agent: string; type: string; path: string; add: string; remove: string;
  sitemap: string; output: string; download: string; clear: string;
  copied: string; empty: string; error: string; saved: string; parseError: string;
  rawPlaceholder: string; hint: string;
}> = {
  en: {
    title: "Robots.txt Generator", description: "Build crawler rules visually or paste raw text. Sitemap line included. All local.",
    builder: "Rule builder", rawMode: "Raw text mode", visualMode: "Visual builder",
    agent: "User-agent", type: "Type", path: "Path", add: "Add rule", remove: "Remove",
    sitemap: "Sitemap URL (optional)", output: "robots.txt output", download: "Download robots.txt",
    clear: "Clear", copied: "Copied to clipboard.", empty: "Nothing to copy yet.",
    error: "Something went wrong.", saved: "robots.txt downloaded.", parseError: "Could not parse raw text — kept your last good rules.",
    rawPlaceholder: "User-agent: *\nDisallow: /admin/\nAllow: /public/\n\nSitemap: https://example.com/sitemap.xml",
    hint: "One User-agent per group. Blank Disallow (/) means allow all.",
  },
  id: {
    title: "Generator Robots.txt", description: "Susun aturan crawler secara visual atau tempel teks mentah. Baris sitemap disertakan. Semua lokal.",
    builder: "Pembuat aturan", rawMode: "Mode teks mentah", visualMode: "Builder visual",
    agent: "User-agent", type: "Tipe", path: "Path", add: "Tambah aturan", remove: "Hapus",
    sitemap: "URL Sitemap (opsional)", output: "Keluaran robots.txt", download: "Unduh robots.txt",
    clear: "Bersihkan", copied: "Disalin ke clipboard.", empty: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.", saved: "robots.txt diunduh.", parseError: "Teks mentah gagal diparse — aturan terakhir yang valid dipertahankan.",
    rawPlaceholder: "User-agent: *\nDisallow: /admin/\nAllow: /public/\n\nSitemap: https://example.com/sitemap.xml",
    hint: "Satu User-agent per grup. Disallow kosong (/) berarti izinkan semua.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "Will robots.txt hide pages from Google?", a: "No. It only asks polite crawlers to skip paths. Sensitive pages need real access control, not just Disallow lines." },
    id: { q: "Apakah robots.txt menyembunyikan halaman dari Google?", a: "Tidak. Ia hanya meminta crawler sopan melewati path tertentu. Halaman sensitif butuh kontrol akses nyata, bukan sekadar baris Disallow." },
  },
  {
    en: { q: "Where do I put robots.txt?", a: "At the domain root (https://example.com/robots.txt). The Sitemap line must be an absolute URL." },
    id: { q: "Di mana menaruh robots.txt?", a: "Di root domain (https://example.com/robots.txt). Baris Sitemap harus URL absolut." },
  },
  {
    en: { q: "Is my ruleset uploaded anywhere?", a: "No. Building and raw-text parsing run entirely in your browser." },
    id: { q: "Apakah aturanku diunggah ke mana pun?", a: "Tidak. Pembuatan dan parsing teks mentah berjalan sepenuhnya di browser-mu." },
  },
];

const INPUT_CLS = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";
const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

function buildText(rules: RuleRow[], sitemap: string): string {
  const lines: string[] = [];
  for (const r of rules) {
    lines.push(`User-agent: ${r.agent.trim() || "*"}`);
    lines.push(`${r.kind}: ${r.path.trim() || "/"}`);
    lines.push("");
  }
  if (sitemap.trim()) lines.push(`Sitemap: ${sitemap.trim()}`);
  return lines.join("\n").trim() + "\n";
}

function parseRaw(raw: string): { rules: RuleRow[]; sitemap: string } {
  const rules: RuleRow[] = [];
  let sitemap = "";
  let agent = "";
  let id = 1;
  const lines = raw.split("\n");
  for (const ln of lines) {
    const t = ln.trim();
    if (t === "" || t.startsWith("#")) continue;
    const m = t.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) throw new Error("bad-line");
    const key = m[1].toLowerCase();
    const val = (m[2] ?? "").trim();
    if (key === "user-agent") { agent = val || "*"; }
    else if (key === "allow" || key === "disallow") {
      if (!agent) throw new Error("orphan-rule");
      rules.push({ id: id++, agent, kind: key === "allow" ? "Allow" : "Disallow", path: val || "/" });
    } else if (key === "sitemap") { sitemap = val; }
    else throw new Error("unknown-key");
  }
  if (rules.length === 0 && sitemap === "" && raw.trim() !== "") throw new Error("empty-rules");
  return { rules, sitemap };
}

export default function RobotsGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [rules, setRules] = useState<RuleRow[]>([
    { id: 1, agent: "*", kind: "Disallow", path: "/admin/" },
    { id: 2, agent: "*", kind: "Allow", path: "/" },
  ]);
  const [nextId, setNextId] = useState(3);
  const [sitemap, setSitemap] = useState("");
  const [rawMode, setRawMode] = useState(false);
  const [raw, setRaw] = useState("");

  const output = useMemo(() => {
    try {
      if (rawMode) return raw;
      return buildText(rules, sitemap);
    } catch {
      return "";
    }
  }, [rawMode, raw, rules, sitemap]);

  const toggleMode = (): void => {
    try {
      if (!rawMode) {
        setRaw(buildText(rules, sitemap));
        setRawMode(true);
      } else {
        try {
          const parsed = parseRaw(raw);
          setRules(parsed.rules.length > 0 ? parsed.rules : [{ id: 1, agent: "*", kind: "Disallow", path: "/" }]);
          setSitemap(parsed.sitemap);
          let max = 1;
          for (const r of parsed.rules) { if (r.id > max) max = r.id; }
          setNextId(max + 1);
          setRawMode(false);
        } catch {
          toast.error(s.parseError);
        }
      }
    } catch {
      toast.error(s.error);
    }
  };

  const addRule = (): void => {
    try {
      setRules((prev) => [...prev, { id: nextId, agent: "*", kind: "Disallow", path: "/" }]);
      setNextId((n) => n + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const updateRule = (id: number, patch: Partial<RuleRow>): void => {
    try {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    } catch {
      toast.error(s.error);
    }
  };

  const removeRule = (id: number): void => {
    try {
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      if (output.trim() === "") { toast.info(s.empty); return; }
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "robots.txt";
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
      setRules([{ id: 1, agent: "*", kind: "Disallow", path: "/" }]);
      setNextId(2);
      setSitemap("");
      setRaw("");
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="AppWindow" slug="developer/robots-generator" faq={FAQ}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className={LABEL_CLS}>{rawMode ? s.rawMode : s.builder}</p>
          <Button type="button" variant="outline" size="sm" onClick={toggleMode}>
            {rawMode ? s.visualMode : s.rawMode}
          </Button>
        </div>

        {rawMode ? (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <textarea value={raw} onChange={(e) => { try { setRaw(e.target.value); } catch { toast.error(s.error); } }}
                rows={12} spellCheck={false} placeholder={s.rawPlaceholder}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.hint}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              {rules.map((r) => (
                <div key={r.id} className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[1fr_130px_1fr_auto] dark:border-zinc-700">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.agent}</label>
                    <input value={r.agent} onChange={(e) => updateRule(r.id, { agent: e.target.value })} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.type}</label>
                    <select value={r.kind} onChange={(e) => updateRule(r.id, { kind: e.target.value === "Allow" ? "Allow" : "Disallow" })} className={INPUT_CLS}>
                      <option value="Allow">Allow</option>
                      <option value="Disallow">Disallow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.path}</label>
                    <input value={r.path} onChange={(e) => updateRule(r.id, { path: e.target.value })} className={INPUT_CLS} />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(r.id)} aria-label={s.remove}>
                      <Trash2 aria-hidden />{s.remove}
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRule}><Plus aria-hidden />{s.add}</Button>
              <div>
                <label className={LABEL_CLS} htmlFor="robots-sitemap">{s.sitemap}</label>
                <input id="robots-sitemap" value={sitemap} onChange={(e) => { try { setSitemap(e.target.value); } catch { toast.error(s.error); } }}
                  inputMode="url" className={INPUT_CLS} />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.hint}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className={LABEL_CLS}>{s.output}</p>
            <pre className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 dark:border-zinc-700">{output || "—"}</pre>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={output} copiedMessage={s.copied} emptyMessage={s.empty} errorMessage={s.error} />
              <Button type="button" variant="secondary" onClick={handleDownload}><Download aria-hidden />{s.download}</Button>
            </div>
            <Button type="button" variant="ghost" onClick={handleClear}><Eraser aria-hidden />{s.clear}</Button>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
