"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ClipboardCopy, Download, Eraser } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type LangId = "javascript" | "typescript" | "python" | "html" | "css" | "json";
type ThemeId = "dark" | "light";
type BgId = "midnight" | "sunset" | "ocean" | "grape" | "emerald" | "paper";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    codeLabel: string;
    codePlaceholder: string;
    language: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    background: string;
    padding: string;
    fontSize: string;
    macDots: string;
    loadSample: string;
    sampleLoaded: string;
    clear: string;
    cleared: string;
    preview: string;
    exportPng: string;
    exported: string;
    exporting: string;
    copyImage: string;
    imageCopied: string;
    copyUnsupported: string;
    emptyCode: string;
    error: string;
  }
> = {
  en: {
    title: "Code Screenshot",
    description:
      "Turn code into a beautiful shareable image: syntax highlighting, macOS window chrome, gradient backdrops, and 2x PNG export.",
    codeLabel: "Code",
    codePlaceholder: "Paste your code here…",
    language: "Language",
    theme: "Theme",
    themeDark: "Dark (One Dark)",
    themeLight: "Light (One Light)",
    background: "Background",
    padding: "Padding",
    fontSize: "Font size",
    macDots: "macOS window dots",
    loadSample: "Load sample",
    sampleLoaded: "Sample loaded.",
    clear: "Clear",
    cleared: "Cleared.",
    preview: "Preview",
    exportPng: "Export PNG",
    exported: "Screenshot exported as PNG.",
    exporting: "Rendering PNG…",
    copyImage: "Copy image",
    imageCopied: "Image copied to clipboard.",
    copyUnsupported: "Image copy is not supported in this browser — download the PNG instead.",
    emptyCode: "Paste some code first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Code Screenshot",
    description:
      "Ubah kode menjadi gambar cantik siap bagikan: syntax highlighting, bingkai jendela macOS, latar gradien, dan ekspor PNG 2x.",
    codeLabel: "Kode",
    codePlaceholder: "Tempel kodemu di sini…",
    language: "Bahasa",
    theme: "Tema",
    themeDark: "Gelap (One Dark)",
    themeLight: "Terang (One Light)",
    background: "Latar",
    padding: "Padding",
    fontSize: "Ukuran font",
    macDots: "Titik jendela macOS",
    loadSample: "Muat contoh",
    sampleLoaded: "Contoh dimuat.",
    clear: "Bersihkan",
    cleared: "Dibersihkan.",
    preview: "Pratinjau",
    exportPng: "Ekspor PNG",
    exported: "Screenshot diekspor sebagai PNG.",
    exporting: "Me-render PNG…",
    copyImage: "Salin gambar",
    imageCopied: "Gambar disalin ke clipboard.",
    copyUnsupported: "Salin gambar tak didukung browser ini — unduh PNG-nya saja.",
    emptyCode: "Tempel kode terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is the PNG generated?",
      a: "The styled code window is rasterized in your browser with the html-to-image library at 2x pixel density, so text stays crisp on retina displays.",
    },
    id: {
      q: "Bagaimana PNG dibuat?",
      a: "Jendela kode yang sudah di-style di-raster di browser dengan library html-to-image pada kepadatan piksel 2x, sehingga teks tetap tajam di layar retina.",
    },
  },
  {
    en: {
      q: "Why is Copy Image unavailable in my browser?",
      a: "Copying images requires the Async Clipboard API with image support (ClipboardItem). Firefox and older browsers lack it — use Download PNG, which works everywhere.",
    },
    id: {
      q: "Kenapa Salin Gambar tak tersedia di browserku?",
      a: "Menyalin gambar butuh Async Clipboard API dengan dukungan gambar (ClipboardItem). Firefox dan browser lama tidak memilikinya — pakai Unduh PNG yang bekerja di mana saja.",
    },
  },
  {
    en: {
      q: "Is my code uploaded anywhere?",
      a: "No. Highlighting, rendering, and PNG export all run locally in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah kodeku diunggah ke mana pun?",
      a: "Tidak. Highlighting, rendering, dan ekspor PNG semuanya berjalan lokal di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const LANGS: { id: LangId; label: string; prism: string }[] = [
  { id: "javascript", label: "JavaScript", prism: "javascript" },
  { id: "typescript", label: "TypeScript", prism: "typescript" },
  { id: "python", label: "Python", prism: "python" },
  { id: "html", label: "HTML", prism: "markup" },
  { id: "css", label: "CSS", prism: "css" },
  { id: "json", label: "JSON", prism: "json" },
];

const BACKGROUNDS: { id: BgId; label: string; css: string }[] = [
  { id: "midnight", label: "Midnight", css: "linear-gradient(135deg, #1e1b4b, #0f0a2e)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg, #ff512f, #dd2476)" },
  { id: "ocean", label: "Ocean", css: "linear-gradient(135deg, #2193b0, #6dd5ed)" },
  { id: "grape", label: "Grape", css: "linear-gradient(135deg, #7c3aed, #db2777)" },
  { id: "emerald", label: "Emerald", css: "linear-gradient(135deg, #059669, #34d399)" },
  { id: "paper", label: "Paper", css: "linear-gradient(135deg, #f8fafc, #e2e8f0)" },
];

const SAMPLES: Record<LangId, string> = {
  javascript: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55`,
  typescript: `interface User {\n  id: number;\n  name: string;\n  admin?: boolean;\n}\n\nconst greet = (u: User): string =>\n  \`Hello, \${u.name}!\`;`,
  python: `def fibonacci(n: int) -> int:\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nprint(fibonacci(10))  # 55`,
  html: `<main class="card">\n  <h1>Hello, world</h1>\n  <button type="button">Click me</button>\n</main>`,
  css: `.card {\n  display: grid;\n  gap: 1rem;\n  border-radius: 0.75rem;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);\n}`,
  json: `{\n  "name": "AIOTools",\n  "private": true,\n  "features": ["fast", "local", "free"]\n}`,
};

const INPUT_CLS =
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export default function CodeScreenshotPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const shotRef = useRef<HTMLDivElement>(null);

  const [code, setCode] = useState(SAMPLES.javascript);
  const [lang, setLang] = useState<LangId>("javascript");
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [bgId, setBgId] = useState<BgId>("midnight");
  const [padding, setPadding] = useState(32);
  const [fontSize, setFontSize] = useState(14);
  const [dots, setDots] = useState(true);
  const [busy, setBusy] = useState(false);

  const prismLang = LANGS.find((l) => l.id === lang)?.prism ?? "javascript";
  const bgCss = BACKGROUNDS.find((b) => b.id === bgId)?.css ?? BACKGROUNDS[0].css;
  const isDark = theme === "dark";

  const handleSample = (): void => {
    try {
      setCode(SAMPLES[lang]);
      toast.success(s.sampleLoaded);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setCode("");
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  };

  const renderPngBlob = async (): Promise<Blob> => {
    const node = shotRef.current;
    if (!node) throw new Error("no-node");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
    if (!blob) throw new Error("to-blob");
    return blob;
  };

  const handleExport = async (): Promise<void> => {
    if (busy) return;
    try {
      if (code.trim().length === 0) {
        toast.error(s.emptyCode);
        return;
      }
      setBusy(true);
      toast.info(s.exporting);
      try {
        const blob = await renderPngBlob();
        const url = URL.createObjectURL(blob);
        try {
          const a = document.createElement("a");
          a.href = url;
          a.download = `code-${lang}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } finally {
          window.setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // ignore
            }
          }, 4000);
        }
        toast.success(s.exported);
      } catch {
        toast.error(s.error);
      } finally {
        setBusy(false);
      }
    } catch {
      setBusy(false);
      toast.error(s.error);
    }
  };

  const handleCopyImage = async (): Promise<void> => {
    if (busy) return;
    try {
      if (code.trim().length === 0) {
        toast.error(s.emptyCode);
        return;
      }
      if (typeof ClipboardItem === "undefined") {
        toast.error(s.copyUnsupported);
        return;
      }
      setBusy(true);
      try {
        const blob = await renderPngBlob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success(s.imageCopied);
      } catch {
        toast.error(s.copyUnsupported);
      } finally {
        setBusy(false);
      }
    } catch {
      setBusy(false);
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileCode"
      slug="design/code-screenshot"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="cs-code"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.codeLabel}
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleSample}>
                  {s.loadSample}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  <Eraser aria-hidden />
                  {s.clear}
                </Button>
              </div>
            </div>
            <textarea
              id="cs-code"
              value={code}
              onChange={(e) => {
                try {
                  setCode(e.target.value);
                } catch {
                  // ignore
                }
              }}
              placeholder={s.codePlaceholder}
              rows={8}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label
                  htmlFor="cs-lang"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.language}
                </label>
                <select
                  id="cs-lang"
                  value={lang}
                  onChange={(e) => {
                    try {
                      setLang(e.target.value as LangId);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={`w-full ${INPUT_CLS}`}
                >
                  {LANGS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="cs-theme"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.theme}
                </label>
                <select
                  id="cs-theme"
                  value={theme}
                  onChange={(e) => {
                    try {
                      setTheme(e.target.value as ThemeId);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={`w-full ${INPUT_CLS}`}
                >
                  <option value="dark">{s.themeDark}</option>
                  <option value="light">{s.themeLight}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="cs-bg"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.background}
                </label>
                <select
                  id="cs-bg"
                  value={bgId}
                  onChange={(e) => {
                    try {
                      setBgId(e.target.value as BgId);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={`w-full ${INPUT_CLS}`}
                >
                  {BACKGROUNDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={dots}
                    onChange={(e) => {
                      try {
                        setDots(e.target.checked);
                      } catch {
                        // ignore
                      }
                    }}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {s.macDots}
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cs-pad"
                  className="w-28 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.padding}: <span className="font-mono">{padding}px</span>
                </label>
                <input
                  id="cs-pad"
                  type="range"
                  min={8}
                  max={64}
                  value={padding}
                  onChange={(e) => {
                    try {
                      setPadding(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cs-font"
                  className="w-28 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  {s.fontSize}: <span className="font-mono">{fontSize}px</span>
                </label>
                <input
                  id="cs-font"
                  type="range"
                  min={12}
                  max={20}
                  value={fontSize}
                  onChange={(e) => {
                    try {
                      setFontSize(Number(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.preview}
              <Badge variant="secondary" className="font-mono">
                {prismLang} · 2x PNG
              </Badge>
            </p>
            <div className="overflow-auto rounded-xl">
              <div ref={shotRef} style={{ background: bgCss, padding: `${padding}px` }}>
                <div
                  style={{
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    background: isDark ? "#282c34" : "#fafafa",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                  }}
                >
                  {dots && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        padding: "12px 16px",
                        background: isDark ? "#21252b" : "#eaeaea",
                      }}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: 9999, background: "#ff5f57" }} />
                      <span style={{ width: 12, height: 12, borderRadius: 9999, background: "#febc2e" }} />
                      <span style={{ width: 12, height: 12, borderRadius: 9999, background: "#28c840" }} />
                    </div>
                  )}
                  <SyntaxHighlighter
                    language={prismLang}
                    style={isDark ? oneDark : oneLight}
                    customStyle={{
                      background: "transparent",
                      margin: 0,
                      padding: "16px",
                      fontSize: `${fontSize}px`,
                    }}
                    codeTagProps={{
                      style: { fontFamily: "'JetBrains Mono', ui-monospace, monospace" },
                    }}
                  >
                    {code.length > 0 ? code : " "}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                onClick={() => void handleExport()}
                disabled={busy}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <Download aria-hidden />
                {s.exportPng}
              </Button>
              <Button onClick={() => void handleCopyImage()} variant="secondary" disabled={busy}>
                {busy ? <Check aria-hidden /> : <ClipboardCopy aria-hidden />}
                {s.copyImage}
              </Button>
              <Button onClick={handleClear} variant="ghost">
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
