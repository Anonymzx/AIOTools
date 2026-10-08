"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import TurndownService from "turndown";
import { ArrowDownToLine, Download, Eraser, FileCode2, PencilLine } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputTitle: string;
    placeholder: string;
    dropHint: string;
    outputTitle: string;
    outputPlaceholder: string;
    convert: string;
    clear: string;
    copy: string;
    copied: string;
    emptyInput: string;
    invalidHtml: string;
    convertOk: string;
    downloadOk: string;
    clearOk: string;
    error: string;
    optionsTitle: string;
    fileLoaded: string;
    fileTooLarge: string;
    fileReadError: string;
  }
> = {
  en: {
    title: "HTML to Markdown",
    description:
      "Convert HTML into clean Markdown (ATX headings, - bullets, fenced code blocks). Paste markup or drop an .html file — everything runs locally in your browser.",
    inputTitle: "HTML input",
    placeholder: "<h1>Hello</h1>\n<p>Paste HTML here…</p>",
    dropHint: "Drop an .html file here, or click to browse (max 5 MB)",
    outputTitle: "Markdown output",
    outputPlaceholder: "Markdown appears here…",
    convert: "Convert",
    clear: "Clear",
    copy: "Copy",
    copied: "Copied to clipboard.",
    emptyInput: "Enter some HTML first.",
    invalidHtml: "Invalid HTML: input must contain at least one tag.",
    convertOk: "Converted to Markdown.",
    downloadOk: "File downloaded.",
    clearOk: "Cleared.",
    error: "Something went wrong.",
    optionsTitle: "Conversion style",
    fileLoaded: "HTML file loaded.",
    fileTooLarge: "File is too large (max 5 MB).",
    fileReadError: "Could not read that file as text.",
  },
  id: {
    title: "HTML ke Markdown",
    description:
      "Ubah HTML menjadi Markdown yang bersih (heading ATX, bullet -, blok kode fenced). Tempel markup atau letakkan file .html — semuanya berjalan lokal di browser.",
    inputTitle: "Masukan HTML",
    placeholder: "<h1>Halo</h1>\n<p>Tempel HTML di sini…</p>",
    dropHint: "Letakkan file .html di sini, atau klik untuk memilih (maks 5 MB)",
    outputTitle: "Keluaran Markdown",
    outputPlaceholder: "Markdown muncul di sini…",
    convert: "Konversi",
    clear: "Bersihkan",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    emptyInput: "Masukkan HTML terlebih dahulu.",
    invalidHtml: "HTML tidak valid: masukan harus mengandung setidaknya satu tag.",
    convertOk: "Berhasil dikonversi ke Markdown.",
    downloadOk: "File berhasil diunduh.",
    clearOk: "Dibersihkan.",
    error: "Terjadi kesalahan.",
    optionsTitle: "Gaya konversi",
    fileLoaded: "File HTML dimuat.",
    fileTooLarge: "File terlalu besar (maks 5 MB).",
    fileReadError: "File tidak bisa dibaca sebagai teks.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What Markdown style is produced?",
      a: "ATX headings (#), dash (-) bullets, and fenced (```) code blocks. That combination renders correctly on GitHub, GitLab, Notion, and most static-site generators without tweaks.",
    },
    id: {
      q: "Gaya Markdown apa yang dihasilkan?",
      a: "Heading ATX (#), bullet strip (-), dan blok kode fenced (```). Kombinasi itu tampil benar di GitHub, GitLab, Notion, dan kebanyakan static-site generator tanpa penyesuaian.",
    },
  },
  {
    en: {
      q: "What happens to scripts, styles, and complex layouts?",
      a: "Script and style content is dropped since it has no Markdown equivalent. Complex layouts (nested divs, absolute positioning) flatten into their text and image content — structure beyond headings, lists, links, and code is simplified.",
    },
    id: {
      q: "Bagaimana dengan script, style, dan tata letak kompleks?",
      a: "Konten script dan style dibuang karena tidak punya padanan Markdown. Tata letak kompleks (div bersarang, absolute positioning) diratakan menjadi konten teks dan gambarnya — struktur selain heading, daftar, tautan, dan kode disederhanakan.",
    },
  },
  {
    en: {
      q: "Is my HTML uploaded anywhere?",
      a: "No. File reading, conversion, copy, and download all run entirely in your browser. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah HTML-ku diunggah ke mana pun?",
      a: "Tidak. Pembacaan file, konversi, penyalinan, dan unduhan berjalan sepenuhnya di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function convertHtml(source: string): string {
  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  return service.turndown(source);
}

const areaCls =
  "h-56 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:h-64 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function HtmlToMarkdownPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [htmlInput, setHtmlInput] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [dzKey, setDzKey] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (htmlInput.trim().length === 0) {
        setMarkdown("");
        return;
      }
      if (!/<[a-z][\s\S]*>/i.test(htmlInput)) {
        setMarkdown("");
        return;
      }
      setMarkdown(convertHtml(htmlInput));
    } catch {
      // live preview must never break typing; explicit Convert shows the error
    }
  }, [htmlInput]);

  const handleConvert = (): void => {
    try {
      if (htmlInput.trim().length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      if (!/<[a-z][\s\S]*>/i.test(htmlInput)) {
        toast.error(s.invalidHtml);
        return;
      }
      setMarkdown(convertHtml(htmlInput));
      toast.success(s.convertOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const f = files[0];
      setDzKey((k) => k + 1);
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        toast.error(s.fileTooLarge);
        return;
      }
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result;
          if (typeof result !== "string") {
            toast.error(s.fileReadError);
            return;
          }
          setHtmlInput(result);
          toast.success(s.fileLoaded);
        } catch {
          toast.error(s.error);
        }
      };
      reader.onerror = () => {
        try {
          toast.error(s.fileReadError);
        } catch {
          // ignore
        }
      };
      reader.readAsText(f);
    } catch {
      toast.error(s.error);
    }
  };

  const handleDownload = (): void => {
    try {
      if (markdown.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted.md";
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
      setHtmlInput("");
      setMarkdown("");
      setFileName(null);
      toast.success(s.clearOk);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileCode" slug="developer/html-to-markdown" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <PencilLine className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {s.inputTitle}
              {fileName && (
                <Badge variant="secondary" className="ml-1 max-w-48 truncate font-mono">
                  {fileName}
                </Badge>
              )}
            </p>
            <FileDropzone
              key={dzKey}
              accept={["text/html"]}
              multiple={false}
              maxSizeMB={5}
              onFiles={handleFiles}
              preview={false}
              helperText={s.dropHint}
            />
            <textarea
              value={htmlInput}
              onChange={(e) => {
                try {
                  setHtmlInput(e.target.value);
                } catch {
                  // ignore
                }
              }}
              placeholder={s.placeholder}
              spellCheck={false}
              className={areaCls}
            />
            <div className="flex flex-wrap gap-1.5" aria-label={s.optionsTitle}>
              {["# atx", "- bullets", "``` fenced"].map((chip) => (
                <Badge key={chip} variant="secondary" className="font-mono">
                  {chip}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleConvert} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                <ArrowDownToLine aria-hidden />
                {s.convert}
              </Button>
              <Button onClick={handleClear} variant="outline" disabled={htmlInput.length === 0 && markdown.length === 0}>
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <FileCode2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {s.outputTitle}
            </p>
            <pre className="max-h-80 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
              {markdown || s.outputPlaceholder}
            </pre>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={markdown} label={s.copy} variant="secondary" disabled={markdown.length === 0} copiedMessage={s.copied} emptyMessage={s.emptyInput} errorMessage={s.error} />
              <Button onClick={handleDownload} variant="outline" disabled={markdown.length === 0}>
                <Download aria-hidden />
                .md
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
