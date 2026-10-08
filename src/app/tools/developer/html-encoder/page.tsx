"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function escapeHtml(input: string, numeric: boolean): string {
  try {
    let out = "";
    for (const ch of input) {
      if (ch === "&") out += "&amp;";
      else if (ch === "<") out += "&lt;";
      else if (ch === ">") out += "&gt;";
      else if (ch === '"') out += "&quot;";
      else if (ch === "'") out += "&#39;";
      else if (numeric && (ch.codePointAt(0) ?? 0) > 127) out += `&#${ch.codePointAt(0)};`;
      else out += ch;
    }
    return out;
  } catch {
    return "";
  }
}

function unescapeHtml(input: string): string {
  try {
    let out = input;
    try {
      out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
        const code = parseInt(hex, 16);
        return Number.isNaN(code) ? _ : String.fromCodePoint(code);
      });
    } catch {
      // keep original on hex failures
    }
    try {
      out = out.replace(/&#(\d+);/g, (_, dec: string) => {
        const code = parseInt(dec, 10);
        return Number.isNaN(code) ? _ : String.fromCodePoint(code);
      });
    } catch {
      // keep original on decimal failures
    }
    out = out.split("&lt;").join("<");
    out = out.split("&gt;").join(">");
    out = out.split("&quot;").join('"');
    out = out.split("&#39;").join("'");
    out = out.split("&#x27;").join("'");
    out = out.split("&apos;").join("'");
    out = out.split("&nbsp;").join(" ");
    out = out.split("&amp;").join("&");
    return out;
  } catch {
    return "";
  }
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    escapedLabel: string;
    unescapedLabel: string;
    numeric: string;
    numericHint: string;
    copy: string;
    clear: string;
    swap: string;
    copied: string;
    emptyInput: string;
    error: string;
    chars: string;
  }
> = {
  en: {
    title: "HTML Encoder / Decoder",
    description:
      "Escape HTML entities (& < > \" ') and unescape them back, live as you type. Everything runs locally in your browser.",
    inputLabel: "Input",
    inputPlaceholder: "Type or paste HTML or text here…",
    escapedLabel: "Escaped (safe for HTML)",
    unescapedLabel: "Unescaped (raw text)",
    numeric: "Also encode non-ASCII as numeric entities (é → &#233;)",
    numericHint: "Useful when the target page has no UTF-8 charset declared.",
    copy: "Copy",
    clear: "Clear",
    swap: "Use output as input",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    error: "Something went wrong.",
    chars: "chars",
  },
  id: {
    title: "HTML Encoder / Decoder",
    description:
      "Escape entity HTML (& < > \" ') dan unescape kembali, langsung saat mengetik. Semuanya berjalan lokal di browser.",
    inputLabel: "Masukan",
    inputPlaceholder: "Ketik atau tempel HTML atau teks di sini…",
    escapedLabel: "Escaped (aman untuk HTML)",
    unescapedLabel: "Unescaped (teks mentah)",
    numeric: "Juga encode non-ASCII sebagai entity numerik (é → &#233;)",
    numericHint: "Berguna bila halaman target tidak mendeklarasikan charset UTF-8.",
    copy: "Salin",
    clear: "Bersihkan",
    swap: "Jadikan keluaran sebagai masukan",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
    chars: "karakter",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Why must I escape HTML before inserting user text?",
      a: "Unescaped <, >, and & let injected markup or scripts run in the page (XSS). Escaping turns them into harmless entities (&lt; &gt; &amp;) so user text displays literally instead of executing.",
    },
    id: {
      q: "Kenapa harus escape HTML sebelum memasukkan teks pengguna?",
      a: "Karakter <, >, dan & yang tidak di-escape memungkinkan markup atau skrip suntikan berjalan di halaman (XSS). Escaping mengubahnya menjadi entity tak berbahaya (&lt; &gt; &amp;) sehingga teks tampil apa adanya, bukan dieksekusi.",
    },
  },
  {
    en: {
      q: "What does the numeric entities toggle do?",
      a: "It additionally converts every non-ASCII character (é, 中, emoji) into decimal entities like &#233;. Use it for legacy pages without a UTF-8 charset; leave it off for modern UTF-8 pages.",
    },
    id: {
      q: "Apa fungsi toggle entity numerik?",
      a: "Ia mengubah setiap karakter non-ASCII (é, 中, emoji) menjadi entity desimal seperti &#233;. Pakai untuk halaman lawas tanpa charset UTF-8; matikan untuk halaman UTF-8 modern.",
    },
  },
  {
    en: {
      q: "Is my text uploaded anywhere?",
      a: "No. Escaping and unescaping are pure string operations in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah teksku diunggah ke mana pun?",
      a: "Tidak. Escape dan unescape adalah operasi string murni di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const TEXTAREA_CLS =
  "mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function HtmlEncoderPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [input, setInput] = useState("");
  const [numeric, setNumeric] = useState(false);

  const escaped = useMemo(() => escapeHtml(input, numeric), [input, numeric]);
  const unescaped = useMemo(() => unescapeHtml(input), [input]);

  const handleSwapEscaped = (): void => {
    try {
      setInput(escaped);
    } catch {
      toast.error(s.error);
    }
  };

  const handleSwapUnescaped = (): void => {
    try {
      setInput(unescaped);
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setInput("");
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="FileCode" slug="developer/html-encoder" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="html-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.inputLabel}
                </label>
                <Badge variant="secondary" className="font-mono">
                  {input.length} {s.chars}
                </Badge>
              </div>
              <textarea
                id="html-in"
                value={input}
                onChange={(e) => {
                  try {
                    setInput(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder={s.inputPlaceholder}
                rows={5}
                spellCheck={false}
                className={TEXTAREA_CLS}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={numeric}
                onChange={(e) => {
                  try {
                    setNumeric(e.target.checked);
                  } catch {
                    // ignore
                  }
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span>
                {s.numeric}
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">{s.numericHint}</span>
              </span>
            </label>
            <Button variant="ghost" onClick={handleClear}>
              <Eraser aria-hidden />
              {s.clear}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.escapedLabel}</h2>
                <Badge variant="secondary" className="font-mono">
                  {escaped.length} {s.chars}
                </Badge>
              </div>
              <pre className="max-h-56 min-h-[6rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {escaped}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton
                  text={escaped}
                  label={s.copy}
                  variant="secondary"
                  size="sm"
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyInput}
                  errorMessage={s.error}
                />
                <Button variant="outline" size="sm" onClick={handleSwapEscaped} disabled={escaped.length === 0}>
                  {s.swap}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.unescapedLabel}</h2>
                <Badge variant="secondary" className="font-mono">
                  {unescaped.length} {s.chars}
                </Badge>
              </div>
              <pre className="max-h-56 min-h-[6rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {unescaped}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton
                  text={unescaped}
                  label={s.copy}
                  variant="secondary"
                  size="sm"
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyInput}
                  errorMessage={s.error}
                />
                <Button variant="outline" size="sm" onClick={handleSwapUnescaped} disabled={unescaped.length === 0}>
                  {s.swap}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
