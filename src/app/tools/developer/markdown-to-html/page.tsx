"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { marked } from "marked";
import {
  Bold,
  Code2,
  Download,
  Eraser,
  Eye,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  PencilLine,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SAMPLE = `# Hello Markdown

Type on the left, see the **live preview** on the right.

## Features

- *Italic* and **bold** text
- [Links](https://example.com) and \`inline code\`

\`\`\`
const hello = "world";
\`\`\`

> Blockquotes work too.
`;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    editorTitle: string;
    previewTitle: string;
    rawTitle: string;
    placeholder: string;
    copy: string;
    copied: string;
    emptyInput: string;
    download: string;
    clear: string;
    sanitizeNote: string;
    parseError: string;
    downloadOk: string;
    clearOk: string;
    error: string;
    bold: string;
    italic: string;
    code: string;
    link: string;
    list: string;
  }
> = {
  en: {
    title: "Markdown to HTML",
    description:
      "Convert Markdown to HTML with a live split preview. Toolbar included, raw HTML output ready to copy — everything runs locally in your browser.",
    editorTitle: "Markdown",
    previewTitle: "Preview",
    rawTitle: "Raw HTML",
    placeholder: "Type Markdown here…",
    copy: "Copy",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    download: "Download .html",
    clear: "Clear",
    sanitizeNote:
      "Safety note: raw <script> and <iframe> tags are escaped to inert text before rendering, so pasted Markdown cannot run code here.",
    parseError: "Could not parse Markdown.",
    downloadOk: "File downloaded.",
    clearOk: "Cleared.",
    error: "Something went wrong.",
    bold: "Bold",
    italic: "Italic",
    code: "Code",
    link: "Link",
    list: "List",
  },
  id: {
    title: "Markdown ke HTML",
    description:
      "Ubah Markdown menjadi HTML dengan pratinjau split live. Toolbar tersedia, keluaran HTML mentah siap disalin — semuanya berjalan lokal di browser.",
    editorTitle: "Markdown",
    previewTitle: "Pratinjau",
    rawTitle: "HTML Mentah",
    placeholder: "Ketik Markdown di sini…",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    download: "Unduh .html",
    clear: "Bersihkan",
    sanitizeNote:
      "Catatan keamanan: tag <script> dan <iframe> mentah dinetralkan menjadi teks sebelum dirender, sehingga Markdown yang ditempel tidak bisa menjalankan kode di sini.",
    parseError: "Markdown tidak bisa diuraikan.",
    downloadOk: "File berhasil diunduh.",
    clearOk: "Dibersihkan.",
    error: "Terjadi kesalahan.",
    bold: "Tebal",
    italic: "Miring",
    code: "Kode",
    link: "Tautan",
    list: "Daftar",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is the Markdown converted?",
      a: "With the marked parser running entirely in your browser: headings, bold, italic, links, lists, code blocks, blockquotes, and tables become HTML instantly as you type.",
    },
    id: {
      q: "Bagaimana Markdown dikonversi?",
      a: "Dengan parser marked yang berjalan sepenuhnya di browser: heading, tebal, miring, tautan, daftar, blok kode, blockquote, dan tabel menjadi HTML seketika saat kamu mengetik.",
    },
  },
  {
    en: {
      q: "Is the preview safe from injected scripts?",
      a: "Yes, for the common case: raw <script> and <iframe> tags are escaped to harmless text before rendering. For untrusted content you publish elsewhere, still run the HTML through a full sanitizer on your own site.",
    },
    id: {
      q: "Apakah pratinjau aman dari skrip injeksi?",
      a: "Ya, untuk kasus umum: tag <script> dan <iframe> mentah dinetralkan menjadi teks tak berbahaya sebelum dirender. Untuk konten tak tepercaya yang kamu publikasikan di tempat lain, tetap jalankan HTML lewat sanitizer penuh di situsmu sendiri.",
    },
  },
  {
    en: {
      q: "Is my Markdown uploaded anywhere?",
      a: "No. Parsing, preview, copy, and download all run entirely in your browser. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah Markdown-ku diunggah ke mana pun?",
      a: "Tidak. Penguraian, pratinjau, penyalinan, dan unduhan berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function sanitizeHtml(html: string): string {
  try {
    return html
      .replace(/<script[\s>]/gi, "&lt;script&gt;")
      .replace(/<\/script\s*>/gi, "&lt;/script&gt;")
      .replace(/<iframe[\s>]/gi, "&lt;iframe&gt;")
      .replace(/<\/iframe\s*>/gi, "&lt;/iframe&gt;");
  } catch {
    return "";
  }
}

function parseMarkdown(src: string): string {
  const out = marked.parse(src);
  if (typeof out === "string") return out;
  return "";
}

const areaCls =
  "h-72 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:h-96 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function MarkdownToHtmlPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [markdown, setMarkdown] = useState(SAMPLE);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const html = useMemo(() => {
    try {
      if (markdown.trim().length === 0) return "";
      return sanitizeHtml(parseMarkdown(markdown));
    } catch {
      return "";
    }
  }, [markdown]);

  const wrapSelection = (before: string, after: string, placeholder: string): void => {
    try {
      const ta = taRef.current;
      if (!ta) {
        setMarkdown((prev) => `${prev}${before}${placeholder}${after}`);
        return;
      }
      const start = ta.selectionStart ?? markdown.length;
      const end = ta.selectionEnd ?? markdown.length;
      const selected = markdown.slice(start, end) || placeholder;
      const next = `${markdown.slice(0, start)}${before}${selected}${after}${markdown.slice(end)}`;
      setMarkdown(next);
      window.requestAnimationFrame(() => {
        try {
          ta.focus();
          const pos = start + before.length + selected.length + after.length;
          ta.setSelectionRange(pos, pos);
        } catch {
          // ignore caret errors
        }
      });
    } catch {
      toast.error(s.error);
    }
  };

  const insertLinePrefix = (prefix: string): void => {
    try {
      const ta = taRef.current;
      if (!ta) {
        setMarkdown((prev) => `${prefix} ${prev}`);
        return;
      }
      const start = ta.selectionStart ?? 0;
      const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
      const next = `${markdown.slice(0, lineStart)}${prefix} ${markdown.slice(lineStart)}`;
      setMarkdown(next);
      window.requestAnimationFrame(() => {
        try {
          ta.focus();
        } catch {
          // ignore
        }
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      if (html.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const doc = `<!DOCTYPE html>\n<html lang="${locale}">\n<head>\n<meta charset="utf-8">\n<title>Markdown Export</title>\n</head>\n<body>\n${html}\n</body>\n</html>\n`;
      const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "markdown-export.html";
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
      toast.success(s.downloadOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setMarkdown("");
      toast.success(s.clearOk);
    } catch {
      toast.error(s.error);
    }
  };

  const tools: Array<{ label: string; icon: React.ReactNode; run: () => void }> = [
    { label: s.bold, icon: <Bold className="h-4 w-4" aria-hidden />, run: () => wrapSelection("**", "**", "bold") },
    { label: s.italic, icon: <Italic className="h-4 w-4" aria-hidden />, run: () => wrapSelection("*", "*", "italic") },
    { label: "H1", icon: <Heading1 className="h-4 w-4" aria-hidden />, run: () => insertLinePrefix("#") },
    { label: "H2", icon: <Heading2 className="h-4 w-4" aria-hidden />, run: () => insertLinePrefix("##") },
    { label: "H3", icon: <Heading3 className="h-4 w-4" aria-hidden />, run: () => insertLinePrefix("###") },
    { label: s.link, icon: <Link2 className="h-4 w-4" aria-hidden />, run: () => wrapSelection("[", "](https://example.com)", "text") },
    { label: s.list, icon: <List className="h-4 w-4" aria-hidden />, run: () => insertLinePrefix("-") },
    { label: s.code, icon: <Code2 className="h-4 w-4" aria-hidden />, run: () => wrapSelection("`", "`", "code") },
  ];

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileCode" slug="developer/markdown-to-html" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label={s.editorTitle}>
              {tools.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  onClick={t.run}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <PencilLine className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  {s.editorTitle}
                </p>
                <textarea
                  ref={taRef}
                  value={markdown}
                  onChange={(e) => {
                    try {
                      setMarkdown(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.placeholder}
                  spellCheck={false}
                  className={areaCls}
                />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  {s.previewTitle}
                </p>
                <div className="prose prose-sm dark:prose-invert h-72 max-w-none overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 break-words sm:h-96 dark:border-zinc-700 dark:bg-zinc-950">
                  {html.length === 0 ? (
                    <p className="font-mono text-xs text-zinc-400">{s.placeholder}</p>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  )}
                </div>
              </div>
            </div>
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              {s.sanitizeNote}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CopyButton text={html} label={s.copy} variant="secondary" disabled={html.length === 0} copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} />
              <Button onClick={handleDownload} variant="outline" disabled={html.length === 0}>
                <Download aria-hidden />
                .html
              </Button>
              <Button onClick={handleClear} variant="ghost" disabled={markdown.length === 0}>
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <FileCode2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {s.rawTitle}
            </p>
            <pre className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-emerald-200 dark:border-zinc-700">
              {html || s.placeholder}
            </pre>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
