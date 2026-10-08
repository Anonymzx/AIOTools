"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileVideo, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolSteps } from "@/components/ui/tool-steps";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import {
  FFmpegCompatError,
  deleteFFmpegFile,
  formatBytes,
  formatTime,
  isWasmSupported,
  loadFFmpeg,
  readOutput,
  terminateFFmpeg,
  toBlob,
  writeInput,
} from "@/lib/ffmpeg";

type Status = "idle" | "loading-engine" | "ready" | "compressing" | "done";
type Preset = "low" | "med" | "high";
type Res = "original" | "1080" | "720" | "480";

const ACCEPT = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

const CRF: Record<Preset, string> = { low: "32", med: "26", high: "20" };

interface Strings {
  description: string;
  helper: string;
  engineNote: string;
  engineLoading: string;
  compatTitle: string;
  compatDesc: string;
  preset: string;
  low: string;
  med: string;
  high: string;
  resolution: string;
  mute: string;
  muteHint: string;
  eta: string;
  before: string;
  after: string;
  compressBtn: string;
  compressing: string;
  download: string;
  again: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  metaOk: string;
  compressOk: string;
  compressFail: string;
  stepUpload: string;
  stepProcess: string;
  stepDownload: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  faqQ4: string;
  faqA4: string;
}

const STR: Record<Locale, Strings> = {
  en: {
    description: "Shrink MP4, WebM, or MOV videos in your browser. Pick a quality preset, resolution, and mute option — no upload needed.",
    helper: "One video up to 500 MB — MP4, WebM, or MOV.",
    engineNote: "First run downloads a ~25 MB engine once, then it works offline from cache.",
    engineLoading: "Loading video engine…",
    compatTitle: "Browser not supported",
    compatDesc: "WebAssembly is unavailable here. Please use the latest Chrome or Edge on desktop.",
    preset: "Quality preset",
    low: "Low — smallest file (CRF 32)",
    med: "Medium — balanced (CRF 26)",
    high: "High — near original (CRF 20)",
    resolution: "Resolution",
    mute: "Remove audio (mute)",
    muteHint: "Muting shrinks the file further — great for silent clips.",
    eta: "elapsed",
    before: "Before",
    after: "After",
    compressBtn: "Compress video",
    compressing: "Compressing…",
    download: "Download MP4",
    again: "Compress another",
    emptyTitle: "No video yet",
    emptyDesc: "Upload a video above. Compression runs locally — your file never leaves this device.",
    noFile: "Please upload a video first.",
    metaOk: "Video loaded.",
    compressOk: "Video compressed successfully.",
    compressFail: "Compression failed. Try a smaller file or lower preset.",
    stepUpload: "Upload",
    stepProcess: "Compress",
    stepDownload: "Download",
    faqQ1: "Is my video uploaded to a server?",
    faqA1: "No. Encoding runs 100% in your browser with ffmpeg.wasm. Your file never leaves your device.",
    faqQ2: "Which preset should I choose?",
    faqA2: "Medium (CRF 26) is the sweet spot for sharing. Low (CRF 32) gives the smallest file for previews; High (CRF 20) keeps near-original quality at a larger size.",
    faqQ3: "Why is the first run slow?",
    faqA3: "The browser downloads a ~25 MB video engine once. After that it is cached, though encoding itself still takes a while on large files.",
    faqQ4: "Why is the output MP4?",
    faqA4: "MP4 with H.264 plays on virtually every device and browser, so we standardize on it for maximum compatibility.",
  },
  id: {
    description: "Perkecil video MP4, WebM, atau MOV di browser. Pilih preset kualitas, resolusi, dan opsi bisu — tanpa unggah.",
    helper: "Satu video hingga 500 MB — MP4, WebM, atau MOV.",
    engineNote: "Jalankan pertama mengunduh engine ~25 MB sekali, lalu bekerja offline dari cache.",
    engineLoading: "Memuat engine video…",
    compatTitle: "Browser tidak didukung",
    compatDesc: "WebAssembly tidak tersedia di sini. Gunakan Chrome atau Edge terbaru di desktop.",
    preset: "Preset kualitas",
    low: "Rendah — file terkecil (CRF 32)",
    med: "Sedang — seimbang (CRF 26)",
    high: "Tinggi — nyaris asli (CRF 20)",
    resolution: "Resolusi",
    mute: "Hapus audio (bisu)",
    muteHint: "Membisukan memperkecil file — cocok untuk klip tanpa suara.",
    eta: "berjalan",
    before: "Sebelum",
    after: "Sesudah",
    compressBtn: "Kompres video",
    compressing: "Mengompres…",
    download: "Unduh MP4",
    again: "Kompres lainnya",
    emptyTitle: "Belum ada video",
    emptyDesc: "Unggah video di atas. Kompresi berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah video terlebih dahulu.",
    metaOk: "Video berhasil dimuat.",
    compressOk: "Video berhasil dikompres.",
    compressFail: "Kompresi gagal. Coba file lebih kecil atau preset lebih rendah.",
    stepUpload: "Unggah",
    stepProcess: "Kompres",
    stepDownload: "Unduh",
    faqQ1: "Apakah video saya diunggah ke server?",
    faqA1: "Tidak. Encoding 100% berjalan di browser memakai ffmpeg.wasm. File tidak pernah keluar dari perangkatmu.",
    faqQ2: "Preset mana yang sebaiknya dipilih?",
    faqA2: "Sedang (CRF 26) adalah titik ideal untuk berbagi. Rendah (CRF 32) memberi file terkecil untuk pratinjau; Tinggi (CRF 20) menjaga kualitas nyaris asli dengan ukuran lebih besar.",
    faqQ3: "Kenapa jalankan pertama lambat?",
    faqA3: "Browser mengunduh engine video ~25 MB sekali saja. Setelah itu tersimpan di cache, walau encoding file besar tetap butuh waktu.",
    faqQ4: "Kenapa output-nya MP4?",
    faqA4: "MP4 dengan H.264 bisa diputar di hampir semua perangkat dan browser, jadi kami standarkan demi kompatibilitas maksimal.",
  },
};

function inExtOf(file: File): string {
  try {
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    return "mp4";
  } catch {
    return "mp4";
  }
}

export default function VideoCompressorPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [preset, setPreset] = useState<Preset>("med");
  const [res, setRes] = useState<Res>("720");
  const [mute, setMute] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [showCompat, setShowCompat] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);
  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url);
  }, []);
  const revokeUrl = useCallback((url: string | null) => {
    try {
      if (url) {
        URL.revokeObjectURL(url);
        urlsRef.current = urlsRef.current.filter((u) => u !== url);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const bag = urlsRef.current;
    return () => {
      try {
        for (const u of bag) {
          try {
            URL.revokeObjectURL(u);
          } catch {
            // ignore
          }
        }
        terminateFFmpeg();
      } catch {
        // ignore
      }
      try {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const next = files[0] ?? null;
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        setResultSize(null);
        setDuration(null);
        setProgress(0);
        setElapsed(0);
        setStatus("idle");
        if (!next) {
          setFile(null);
          setFileUrl((prev) => {
            if (prev) revokeUrl(prev);
            return null;
          });
          return;
        }
        setFile(next);
        const url = URL.createObjectURL(next);
        trackUrl(url);
        setFileUrl((prev) => {
          if (prev) revokeUrl(prev);
          return url;
        });
        setStatus("ready");
        toast.success(s.metaOk);
      } catch {
        toast.error(s.compressFail);
      }
    },
    [revokeUrl, trackUrl, s.compressFail, s.metaOk],
  );

  const runCompress = useCallback(async () => {
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    setStatus("loading-engine");
    setProgress(0);
    setElapsed(0);
    try {
      if (!isWasmSupported()) {
        setShowCompat(true);
        setStatus("ready");
        return;
      }
      let ffmpeg: Awaited<ReturnType<typeof loadFFmpeg>>;
      try {
        ffmpeg = await loadFFmpeg();
      } catch (e) {
        if (e instanceof FFmpegCompatError) {
          setShowCompat(true);
          setStatus("ready");
          return;
        }
        throw e;
      }
      setStatus("compressing");
      const t0 = Date.now();
      try {
        timerRef.current = window.setInterval(() => {
          try {
            setElapsed(Math.floor((Date.now() - t0) / 1000));
          } catch {
            // ignore
          }
        }, 1000);
      } catch {
        // ignore
      }
      const inName = `input.${inExtOf(file)}`;
      const outName = "compressed.mp4";
      await writeInput(ffmpeg, inName, file);
      const vf = res === "original" ? null : `scale=-2:${res === "1080" ? 1080 : res === "720" ? 720 : 480}`;
      const args: string[] = ["-i", inName, "-c:v", "libx264", "-preset", "veryfast", "-crf", CRF[preset]];
      if (vf) args.push("-vf", vf);
      if (mute) args.push("-an");
      else args.push("-c:a", "aac", "-b:a", "128k");
      args.push("-movflags", "+faststart", outName);
      const onProg = ({ progress: p }: { progress: number }) => {
        try {
          setProgress(Math.round(Math.min(1, Math.max(0, p)) * 100));
        } catch {
          // ignore
        }
      };
      try {
        ffmpeg.on("progress", onProg);
      } catch {
        // ignore
      }
      let code = -1;
      try {
        code = await ffmpeg.exec(args);
      } finally {
        try {
          ffmpeg.off("progress", onProg);
        } catch {
          // ignore
        }
        try {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } catch {
          // ignore
        }
      }
      if (code !== 0) throw new Error("ffmpeg exit " + code);
      const data = await readOutput(ffmpeg, outName);
      const blob = toBlob(data, "video/mp4");
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      const base = file.name.replace(/\.[^.]+$/, "") || "video";
      setResultName(`${base}-compressed.mp4`);
      setResultSize(blob.size);
      setProgress(100);
      setStatus("done");
      toast.success(`${s.compressOk} (${formatBytes(blob.size)})`);
      await deleteFFmpegFile(ffmpeg, inName);
      await deleteFFmpegFile(ffmpeg, outName);
    } catch {
      try {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        // ignore
      }
      setStatus("ready");
      toast.error(s.compressFail);
    }
  }, [file, preset, res, mute, revokeUrl, trackUrl, s]);

  const handleReset = useCallback(() => {
    try {
      terminateFFmpeg();
      setFileUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return null;
      });
      setFile(null);
      setDuration(null);
      setResultSize(null);
      setResultName("");
      setStatus("idle");
      setProgress(0);
      setElapsed(0);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.compressFail);
    }
  }, [revokeUrl, s.compressFail]);

  const stage: 0 | 1 | 2 | 3 =
    status === "done" ? 3 : status === "compressing" || status === "loading-engine" ? 2 : file ? 1 : 0;

  const eta =
    progress > 4 && progress < 100 && elapsed > 2
      ? Math.max(0, Math.round((elapsed / progress) * (100 - progress)))
      : null;

  const presets: Preset[] = ["low", "med", "high"];
  const presetLabel = (p: Preset) => (p === "low" ? s.low : p === "med" ? s.med : s.high);
  const resOpts: { v: Res; label: string }[] = [
    { v: "original", label: "Original" },
    { v: "1080", label: "1080p" },
    { v: "720", label: "720p" },
    { v: "480", label: "480p" },
  ];

  return (
    <ToolLayout
      title="Video Compressor"
      description={s.description}
      descriptionId={s.description}
      iconName="FileVideo"
      slug="media/video-compressor"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
        { en: { q: STR.en.faqQ4, a: STR.en.faqA4 }, id: { q: STR.id.faqQ4, a: STR.id.faqA4 } },
      ]}
    >
      <div className="space-y-4">
        <ToolSteps stage={stage} labels={[s.stepUpload, s.stepProcess, s.stepDownload]} />
        <FileDropzone
          key={dropzoneKey}
          accept={ACCEPT}
          multiple={false}
          maxSizeMB={500}
          onFiles={handleFiles}
          helperText={s.helper}
        />
        {showCompat ? (
          <Card className="border-amber-300 dark:border-amber-800">
            <CardContent className="p-4">
              <p className="font-semibold">{s.compatTitle}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.compatDesc}</p>
            </CardContent>
          </Card>
        ) : null}

        {file && fileUrl ? (
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <video
                ref={videoRef}
                src={fileUrl}
                controls
                preload="metadata"
                className="max-h-64 w-full rounded-xl bg-black"
                onLoadedMetadata={() => {
                  try {
                    const d = videoRef.current?.duration;
                    setDuration(typeof d === "number" && isFinite(d) ? d : null);
                  } catch {
                    setDuration(null);
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                <span>{s.before}: {formatBytes(file.size)}</span>
                {duration !== null ? (
                  <>
                    <span>•</span>
                    <span>{formatTime(duration)}</span>
                  </>
                ) : null}
                {resultSize !== null ? (
                  <>
                    <span>•</span>
                    <span>{s.after}: {formatBytes(resultSize)}</span>
                  </>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{s.preset}</p>
                <div className="grid grid-cols-1 gap-2">
                  {presets.map((p) => (
                    <Button
                      key={p}
                      variant={preset === p ? "default" : "outline"}
                      onClick={() => {
                        try {
                          setPreset(p);
                        } catch {
                          // ignore
                        }
                      }}
                      className={preset === p ? "justify-start bg-indigo-600 hover:bg-indigo-700" : "justify-start"}
                    >
                      {presetLabel(p)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{s.resolution}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {resOpts.map((o) => (
                    <Button
                      key={o.v}
                      variant={res === o.v ? "default" : "outline"}
                      onClick={() => {
                        try {
                          setRes(o.v);
                        } catch {
                          // ignore
                        }
                      }}
                      className={res === o.v ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <input
                  type="checkbox"
                  checked={mute}
                  onChange={(e) => {
                    try {
                      setMute(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <span>
                  <span className="block text-sm font-medium">{s.mute}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">{s.muteHint}</span>
                </span>
              </label>
              <Button
                onClick={() => void runCompress()}
                disabled={status === "compressing" || status === "loading-engine"}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {status === "compressing" || status === "loading-engine" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {status === "loading-engine" ? s.engineLoading : `${s.compressing} ${progress}%`}
                  </>
                ) : (
                  <>
                    <FileVideo className="h-4 w-4" aria-hidden />
                    {s.compressBtn}
                  </>
                )}
              </Button>
              {status === "compressing" || status === "loading-engine" ? (
                <div role="status">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    {status === "loading-engine" ? (
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-600" />
                    ) : (
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                  <p className="mt-1.5 text-right text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                    {status === "loading-engine"
                      ? s.engineNote
                      : eta !== null
                        ? `${progress}% • ~${formatTime(eta)} ${s.eta}`
                        : `${progress}% • ${formatTime(elapsed)} ${s.eta}`}
                  </p>
                </div>
              ) : null}
              {status === "done" && resultUrl ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-[11px] font-medium uppercase text-zinc-500 dark:text-zinc-400">{s.before}</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums">{formatBytes(file.size)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950">
                      <p className="text-[11px] font-medium uppercase text-emerald-600 dark:text-emerald-400">{s.after}</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums">{resultSize !== null ? formatBytes(resultSize) : "—"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700" size="lg">
                      <a href={resultUrl} download={resultName}>
                        <Download className="h-4 w-4" aria-hidden />
                        {s.download}
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleReset} size="lg" className="flex-1">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      {s.again}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<FileVideo className="h-6 w-6" aria-hidden />}
            title={s.emptyTitle}
            hint={s.emptyDesc}
          />
        )}
      </div>
    </ToolLayout>
  );
}
