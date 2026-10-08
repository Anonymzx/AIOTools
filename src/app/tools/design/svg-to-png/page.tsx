"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Eraser, FileArchive, Image as ImageIcon, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    pasteLabel: string;
    pastePlaceholder: string;
    dropHint: string;
    width: string;
    height: string;
    scale: string;
    background: string;
    transparent: string;
    solidColor: string;
    rasterize: string;
    rasterized: string;
    preview: string;
    download: string;
    downloadZip: string;
    zipped: string;
    clear: string;
    cleared: string;
    emptySvg: string;
    invalidSvg: string;
    taintWarn: string;
    rasterFail: string;
    batchTitle: string;
    batchHint: string;
    filesQueued: string;
    error: string;
  }
> = {
  en: {
    title: "SVG to PNG",
    description:
      "Paste SVG code or drop .svg files to rasterize them at any size and scale — with transparent or solid backgrounds, plus batch ZIP export.",
    pasteLabel: "Paste SVG code",
    pastePlaceholder: "<svg xmlns=… width=… height=…>…</svg>",
    dropHint: "Drop .svg files here, or click to browse (batch supported)",
    width: "Width",
    height: "Height",
    scale: "Scale",
    background: "Background",
    transparent: "Transparent",
    solidColor: "Solid color",
    rasterize: "Convert to PNG",
    rasterized: "SVG rasterized.",
    preview: "PNG preview",
    download: "Download PNG",
    downloadZip: "Convert all & download ZIP",
    zipped: "Batch converted and zipped.",
    clear: "Clear",
    cleared: "Cleared.",
    emptySvg: "Paste SVG code or drop a file first.",
    invalidSvg: "Invalid SVG: it must contain an <svg> root element.",
    taintWarn:
      "Warning: this SVG references external content (http link or foreignObject) which may taint the canvas — export can fail in some browsers.",
    rasterFail:
      "Rasterization failed — the SVG may reference external resources that taint the canvas, or contain unsupported content.",
    batchTitle: "Batch convert",
    batchHint: "Drop multiple .svg files above, or use the single converter below.",
    filesQueued: "files queued",
    error: "Something went wrong.",
  },
  id: {
    title: "SVG ke PNG",
    description:
      "Tempel kode SVG atau letakkan file .svg untuk di-raster ke ukuran dan skala apa pun — dengan latar transparan atau solid, plus ekspor ZIP batch.",
    pasteLabel: "Tempel kode SVG",
    pastePlaceholder: "<svg xmlns=… width=… height=…>…</svg>",
    dropHint: "Letakkan file .svg di sini, atau klik untuk memilih (mendukung batch)",
    width: "Lebar",
    height: "Tinggi",
    scale: "Skala",
    background: "Latar",
    transparent: "Transparan",
    solidColor: "Warna solid",
    rasterize: "Konversi ke PNG",
    rasterized: "SVG berhasil di-raster.",
    preview: "Pratinjau PNG",
    download: "Unduh PNG",
    downloadZip: "Konversi semua & unduh ZIP",
    zipped: "Batch berhasil dikonversi dan di-zip.",
    clear: "Bersihkan",
    cleared: "Dibersihkan.",
    emptySvg: "Tempel kode SVG atau letakkan file terlebih dahulu.",
    invalidSvg: "SVG tidak valid: harus mengandung elemen root <svg>.",
    taintWarn:
      "Peringatan: SVG ini merujuk konten eksternal (tautan http atau foreignObject) yang dapat menodai canvas — ekspor bisa gagal di sebagian browser.",
    rasterFail:
      "Rasterisasi gagal — SVG mungkin merujuk resource eksternal yang menodai canvas, atau berisi konten tak didukung.",
    batchTitle: "Konversi batch",
    batchHint: "Letakkan banyak file .svg di atas, atau pakai konverter tunggal di bawah.",
    filesQueued: "file antre",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does SVG to PNG conversion work?",
      a: "The SVG is loaded through a Blob URL into an Image element, painted onto a canvas at width × height × scale, then exported as a PNG. Larger scales give sharper, print-ready output.",
    },
    id: {
      q: "Bagaimana cara kerja konversi SVG ke PNG?",
      a: "SVG dimuat lewat Blob URL ke elemen Image, digambar ke canvas pada ukuran lebar × tinggi × skala, lalu diekspor sebagai PNG. Skala besar memberi hasil tajam siap cetak.",
    },
  },
  {
    en: {
      q: "Why can export fail for some SVGs?",
      a: "SVGs that embed external images, fonts, or foreignObject content can taint the canvas, and browsers then block pixel export for security. Inline all assets (e.g. data URIs) to avoid this.",
    },
    id: {
      q: "Kenapa ekspor bisa gagal untuk sebagian SVG?",
      a: "SVG yang menyematkan gambar, font, atau konten foreignObject eksternal dapat menodai canvas, lalu browser memblokir ekspor piksel demi keamanan. Inline semua aset (mis. data URI) untuk menghindarinya.",
    },
  },
  {
    en: {
      q: "Are my SVG files uploaded anywhere?",
      a: "No. Parsing, rasterization, and ZIP packaging all run locally in your browser. Nothing leaves your device.",
    },
    id: {
      q: "Apakah file SVG-ku diunggah ke mana pun?",
      a: "Tidak. Parsing, rasterisasi, dan pengemasan ZIP semuanya berjalan lokal di browser. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

const TAINT_RE = /<foreignObject|https?:\/\/|xlink:href\s*=\s*"http/i;
const SVG_RE = /<svg[\s>]/i;

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
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
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img-load"));
    img.src = url;
  });
}

async function rasterizeSvg(
  svgText: string,
  w: number,
  h: number,
  scale: number,
  bg: string | null,
): Promise<Blob> {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-ctx");
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out: Blob = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("to-blob"));
        }, "image/png");
      } catch (e) {
        reject(e instanceof Error ? e : new Error("to-blob"));
      }
    });
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function SvgToPngPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [svgText, setSvgText] = useState("");
  const [fileName, setFileName] = useState("graphic");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [scale, setScale] = useState(2);
  const [bgMode, setBgMode] = useState<"transparent" | "solid">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dzKey, setDzKey] = useState(0);

  const bg = bgMode === "solid" ? bgColor : null;

  const handleFiles = (files: File[]): void => {
    try {
      const svgs = files.filter(
        (f) => f.type === "image/svg+xml" || f.name.toLowerCase().endsWith(".svg"),
      );
      if (svgs.length === 0) {
        toast.error(s.invalidSvg);
        setDzKey((k) => k + 1);
        return;
      }
      setBatchFiles((prev) => [...prev, ...svgs]);
      const first = svgs[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result;
          if (typeof text === "string" && SVG_RE.test(text)) {
            setSvgText(text);
            setFileName(first.name.replace(/\.svg$/i, "") || "graphic");
            if (TAINT_RE.test(text)) toast.warning(s.taintWarn);
          }
        } catch {
          toast.error(s.error);
        }
      };
      reader.onerror = () => toast.error(s.error);
      reader.readAsText(first);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleRasterize = async (): Promise<void> => {
    if (busy) return;
    try {
      const v = svgText.trim();
      if (v.length === 0) {
        toast.error(s.emptySvg);
        return;
      }
      if (!SVG_RE.test(v)) {
        toast.error(s.invalidSvg);
        return;
      }
      if (TAINT_RE.test(v)) toast.warning(s.taintWarn);
      setBusy(true);
      try {
        const out = await rasterizeSvg(v, width, height, scale, bg);
        if (previewUrl) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {
            // ignore
          }
        }
        setPreviewUrl(URL.createObjectURL(out));
        setPreviewSize(`${Math.round(width * scale)}×${Math.round(height * scale)}px`);
        toast.success(s.rasterized);
      } catch {
        toast.error(s.rasterFail);
      } finally {
        setBusy(false);
      }
    } catch {
      setBusy(false);
      toast.error(s.error);
    }
  };

  const handleDownload = async (): Promise<void> => {
    try {
      const v = svgText.trim();
      if (v.length === 0 || !SVG_RE.test(v)) {
        toast.error(v.length === 0 ? s.emptySvg : s.invalidSvg);
        return;
      }
      const out = await rasterizeSvg(v, width, height, scale, bg);
      downloadBlob(out, `${fileName || "graphic"}@${scale}x.png`);
    } catch {
      toast.error(s.rasterFail);
    }
  };

  const handleBatchZip = async (): Promise<void> => {
    if (busy) return;
    try {
      if (batchFiles.length === 0) {
        toast.error(s.emptySvg);
        return;
      }
      setBusy(true);
      try {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const f of batchFiles) {
          const text: string = await f.text();
          if (!SVG_RE.test(text)) continue;
          const out = await rasterizeSvg(text, width, height, scale, bg);
          zip.file(`${f.name.replace(/\.svg$/i, "")}@${scale}x.png`, out);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `svg-batch@${scale}x.zip`);
        toast.success(s.zipped);
      } catch {
        toast.error(s.rasterFail);
      } finally {
        setBusy(false);
      }
    } catch {
      setBusy(false);
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setSvgText("");
      setBatchFiles([]);
      setPreviewSize(null);
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          // ignore
        }
      }
      setPreviewUrl(null);
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileImage"
      slug="design/svg-to-png"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={[".svg"]}
              multiple
              maxSizeMB={25}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />
            {batchFiles.length > 0 && (
              <p className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-mono">
                  {batchFiles.length} {s.filesQueued}
                </Badge>
                {batchFiles.slice(0, 6).map((f) => (
                  <Badge key={f.name + f.size} variant="outline" className="font-mono">
                    {f.name}
                  </Badge>
                ))}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label
                htmlFor="svg-input"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.pasteLabel}
              </label>
              <textarea
                id="svg-input"
                value={svgText}
                onChange={(e) => {
                  try {
                    setSvgText(e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder={s.pastePlaceholder}
                rows={7}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs break-all text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label
                  htmlFor="svg-w"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.width} (px)
                </label>
                <input
                  id="svg-w"
                  type="number"
                  min={1}
                  max={4096}
                  value={width}
                  onChange={(e) => {
                    try {
                      setWidth(Math.min(4096, Math.max(1, Number(e.target.value) || 1)));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="svg-h"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.height} (px)
                </label>
                <input
                  id="svg-h"
                  type="number"
                  min={1}
                  max={4096}
                  value={height}
                  onChange={(e) => {
                    try {
                      setHeight(Math.min(4096, Math.max(1, Number(e.target.value) || 1)));
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="svg-bg"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {s.background}
                </label>
                <select
                  id="svg-bg"
                  value={bgMode}
                  onChange={(e) => {
                    try {
                      setBgMode(e.target.value as "transparent" | "solid");
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="transparent">{s.transparent}</option>
                  <option value="solid">{s.solidColor}</option>
                </select>
              </div>
              {bgMode === "solid" ? (
                <div className="space-y-1">
                  <label
                    htmlFor="svg-bgcolor"
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    {s.solidColor}
                  </label>
                  <input
                    id="svg-bgcolor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      try {
                        setBgColor(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    className="h-[2.6rem] w-full cursor-pointer rounded-xl border border-zinc-200 bg-transparent dark:border-zinc-700"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <Badge variant="secondary" className="font-mono">
                    {width * scale}×{height * scale}px
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="svg-scale"
                className="w-28 shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
              >
                {s.scale}: <span className="font-mono">{scale}x</span>
              </label>
              <input
                id="svg-scale"
                type="range"
                min={1}
                max={4}
                step={1}
                value={scale}
                onChange={(e) => {
                  try {
                    setScale(Number(e.target.value));
                  } catch {
                    // ignore
                  }
                }}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => void handleRasterize()}
                disabled={busy}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <ImageIcon aria-hidden />
                {s.rasterize}
              </Button>
              <Button onClick={() => void handleDownload()} variant="secondary" disabled={busy}>
                <Download aria-hidden />
                {s.download}
              </Button>
              <Button
                onClick={() => void handleBatchZip()}
                variant="secondary"
                disabled={busy || batchFiles.length === 0}
                title={s.batchHint}
              >
                <FileArchive aria-hidden />
                {s.downloadZip}
              </Button>
              <Button onClick={handleClear} variant="ghost">
                <Eraser aria-hidden />
                {s.clear}
              </Button>
            </div>

            {previewUrl ? (
              <div className="space-y-2">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.preview}
                  {previewSize && (
                    <Badge variant="secondary" className="font-mono">
                      {previewSize}
                    </Badge>
                  )}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={s.preview}
                  className="max-h-80 w-full rounded-xl border border-zinc-200 object-contain bg-[repeating-conic-gradient(#e4e4e7_0%_25%,#fff_0%_50%)] bg-[length:1.25rem_1.25rem] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,#09090b_0%_50%)]"
                />
              </div>
            ) : (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {s.batchHint}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
