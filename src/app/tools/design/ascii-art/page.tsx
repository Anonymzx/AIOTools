"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type CharsetKey = "simple" | "detailed" | "blocks";
type ColorMode = "mono" | "colored";

const CHARSETS: Record<CharsetKey, string> = {
  simple: "@%#*+=-:. ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocks: "█▓▒░ ",
};

interface AsciiStrings {
  description: string;
  helper: string;
  empty: string;
  emptyDesc: string;
  widthLabel: string;
  charsetLabel: string;
  simpleName: string;
  detailedName: string;
  blocksName: string;
  modeLabel: string;
  monoName: string;
  coloredName: string;
  result: string;
  dims: string;
  copy: string;
  copied: string;
  download: string;
  needImage: string;
  failed: string;
  done: string;
  copyFailed: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, AsciiStrings> = {
  en: {
    description: "Convert any photo into ASCII art text. Tune width, pick a charset, choose mono or colored mode — copy or download as TXT/HTML, all in your browser.",
    helper: "One image up to 15 MB — JPG, PNG, WebP.",
    empty: "No image yet",
    emptyDesc: "Upload an image above and the ASCII preview appears here in real time.",
    widthLabel: "Width (characters)",
    charsetLabel: "Character set",
    simpleName: "Simple",
    detailedName: "Detailed",
    blocksName: "Blocks",
    modeLabel: "Color mode",
    monoName: "Mono (TXT)",
    coloredName: "Colored (HTML)",
    result: "Result",
    dims: "columns × rows",
    copy: "Copy",
    copied: "ASCII art copied.",
    download: "Download",
    needImage: "Upload an image first.",
    failed: "Could not convert the image.",
    done: "File downloaded.",
    copyFailed: "Copy failed in this browser.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. Pixels are read on a <canvas> in your browser and mapped to characters locally. Nothing leaves your device.",
    faqQ2: "Mono vs colored — what is the difference?",
    faqA2: "Mono maps brightness to characters and downloads as plain TXT. Colored keeps each pixel's color in HTML spans and downloads as a styled HTML file.",
    faqQ3: "Why does the preview use a tiny font?",
    faqA3: "ASCII art only looks right in a monospace font at small sizes. Zoom your browser or widen the character count for more detail.",
  },
  id: {
    description: "Ubah foto apa pun menjadi teks ASCII art. Atur lebar, pilih charset, pilih mode mono atau berwarna — salin atau unduh sebagai TXT/HTML, semua di browser.",
    helper: "Satu gambar hingga 15 MB — JPG, PNG, WebP.",
    empty: "Belum ada gambar",
    emptyDesc: "Unggah gambar di atas dan pratinjau ASCII muncul di sini secara real-time.",
    widthLabel: "Lebar (karakter)",
    charsetLabel: "Set karakter",
    simpleName: "Simpel",
    detailedName: "Detail",
    blocksName: "Blok",
    modeLabel: "Mode warna",
    monoName: "Mono (TXT)",
    coloredName: "Berwarna (HTML)",
    result: "Hasil",
    dims: "kolom × baris",
    copy: "Salin",
    copied: "ASCII art disalin.",
    download: "Unduh",
    needImage: "Unggah gambar terlebih dahulu.",
    failed: "Gagal mengonversi gambar.",
    done: "File terunduh.",
    copyFailed: "Gagal menyalin di browser ini.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Piksel dibaca pada <canvas> di browser dan dipetakan ke karakter secara lokal. Tidak ada yang keluar dari perangkat Anda.",
    faqQ2: "Mono vs berwarna — apa bedanya?",
    faqA2: "Mono memetakan kecerahan ke karakter dan diunduh sebagai TXT biasa. Berwarna mempertahankan warna tiap piksel dalam span HTML dan diunduh sebagai file HTML bergaya.",
    faqQ3: "Mengapa pratinjau memakai font kecil?",
    faqA3: "ASCII art hanya terlihat benar dengan font monospace berukuran kecil. Zoom browser atau naikkan jumlah karakter untuk detail lebih.",
  },
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function AsciiArtPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [widthChars, setWidthChars] = useState(100);
  const [charset, setCharset] = useState<CharsetKey>("detailed");
  const [mode, setMode] = useState<ColorMode>("mono");
  const [output, setOutput] = useState("");
  const [htmlOut, setHtmlOut] = useState("");
  const [rows, setRows] = useState(0);

  const mountedRef = useRef(true);
  const urlRef = useRef<string | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        try {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        } catch {
          // ignore
        }
        const url = URL.createObjectURL(f);
        urlRef.current = url;
        setSrcUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [s.failed],
  );

  // Convert image → ASCII on every parameter change
  useEffect(() => {
    if (!srcUrl) {
      setOutput("");
      setHtmlOut("");
      setRows(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("decode-failed"));
          el.src = srcUrl;
        });
        if (cancelled || !mountedRef.current) return;
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) throw new Error("decode-failed");
        const cols = Math.min(200, Math.max(40, Math.round(widthChars)));
        const rowsCalc = Math.max(1, Math.round((cols * ih) / iw * 0.55));
        const canvas = document.createElement("canvas");
        canvas.width = cols;
        canvas.height = rowsCalc;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas-2d-unavailable");
        ctx.drawImage(img, 0, 0, cols, rowsCalc);
        const data = ctx.getImageData(0, 0, cols, rowsCalc).data;
        const chars = CHARSETS[charset];
        const last = chars.length - 1;
        const lines: string[] = [];
        const htmlLines: string[] = [];
        for (let y = 0; y < rowsCalc; y++) {
          let line = "";
          let htmlLine = "";
          let runColor = "";
          let runText = "";
          const flush = () => {
            if (runText) {
              htmlLine += `<span style="color:${runColor}">${escapeHtml(runText)}</span>`;
              runText = "";
            }
          };
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            const ch = chars[Math.round((1 - lum) * last)] ?? " ";
            line += ch;
            if (mode === "colored") {
              const c = `rgb(${r},${g},${b})`;
              if (c !== runColor) {
                flush();
                runColor = c;
              }
              runText += ch;
            }
          }
          lines.push(line);
          if (mode === "colored") {
            flush();
            htmlLines.push(htmlLine || " ");
          }
        }
        if (cancelled || !mountedRef.current) return;
        setOutput(lines.join("\n"));
        setHtmlOut(htmlLines.join("\n"));
        setRows(rowsCalc);
      } catch {
        if (!cancelled && mountedRef.current) toast.error(s.failed);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl, widthChars, charset, mode]);

  const copy = useCallback(async () => {
    if (!output) {
      toast.error(s.needImage);
      return;
    }
    try {
      await navigator.clipboard.writeText(mode === "colored" ? htmlOut : output);
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }, [output, htmlOut, mode, s]);

  const download = useCallback(() => {
    if (!output) {
      toast.error(s.needImage);
      return;
    }
    try {
      let blob: Blob;
      let name: string;
      if (mode === "colored") {
        const doc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>ASCII Art</title>\n<style>body{background:#000;margin:0;padding:16px}pre{font-family:monospace;font-size:7px;line-height:1;margin:0}</style>\n</head>\n<body>\n<pre>${htmlOut}</pre>\n</body>\n</html>`;
        blob = new Blob([doc], { type: "text/html;charset=utf-8" });
        name = "ascii-art.html";
      } else {
        blob = new Blob([output], { type: "text/plain;charset=utf-8" });
        name = "ascii-art.txt";
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      toast.success(s.done);
    } catch {
      toast.error(s.failed);
    }
  }, [output, htmlOut, mode, s]);

  return (
    <ToolLayout
      title="Image to ASCII Art"
      description={s.description}
      descriptionId={s.description}
      iconName="Binary"
      slug="design/ascii-art"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          maxSizeMB={15}
          maxFiles={1}
          onFiles={(f) => {
            handleFiles(f);
          }}
          helperText={s.helper}
        />

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label htmlFor="ascii-w" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.widthLabel}: <span className="tabular-nums">{widthChars}</span>
              </label>
              <input
                id="ascii-w"
                type="range"
                min={40}
                max={200}
                step={1}
                value={widthChars}
                onChange={(e) => {
                  try {
                    setWidthChars(Number(e.target.value));
                  } catch {
                    // ignore
                  }
                }}
                className="mt-2 w-full accent-indigo-600"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.charsetLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.charsetLabel}>
                {(["simple", "detailed", "blocks"] as CharsetKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      try {
                        setCharset(k);
                      } catch {
                        // ignore
                      }
                    }}
                    aria-pressed={charset === k}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                      charset === k
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                    )}
                  >
                    {k === "simple" ? s.simpleName : k === "detailed" ? s.detailedName : s.blocksName}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.modeLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={s.modeLabel}>
                {(["mono", "colored"] as ColorMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      try {
                        setMode(m);
                      } catch {
                        // ignore
                      }
                    }}
                    aria-pressed={mode === m}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                      mode === m
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
                    )}
                  >
                    {m === "mono" ? s.monoName : s.coloredName}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {!output ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.empty}</p>
              <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.emptyDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.result}</span>
                <span className="tabular-nums">
                  {widthChars} {s.dims} {rows}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-black p-3 dark:border-zinc-800">
                {mode === "mono" ? (
                  <pre className="font-mono text-[7px] leading-none text-zinc-100">{output}</pre>
                ) : (
                  <pre
                    className="font-mono text-[7px] leading-none"
                    dangerouslySetInnerHTML={{ __html: htmlOut }}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void copy()} variant="outline" size="lg" className="w-full">
                  <Copy className="h-4 w-4" aria-hidden />
                  {s.copy}
                </Button>
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download} · {mode === "mono" ? "TXT" : "HTML"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
