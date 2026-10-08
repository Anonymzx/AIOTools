"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Play, RotateCcw, Scissors, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSlider } from "@/components/ui/animated-slider";
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

type Status = "idle" | "loading-engine" | "ready" | "exporting" | "done";

const ACCEPT = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];
const EXT_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
};
const MIME_BY_EXT: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

interface Strings {
  description: string;
  helper: string;
  engineNote: string;
  engineLoading: string;
  compatTitle: string;
  compatDesc: string;
  start: string;
  end: string;
  duration: string;
  selection: string;
  playSel: string;
  stop: string;
  exportBtn: string;
  exporting: string;
  download: string;
  again: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  decodeOk: string;
  decodeFail: string;
  exportOk: string;
  exportFail: string;
  engineFail: string;
  stepUpload: string;
  stepProcess: string;
  stepDownload: string;
  dragHint: string;
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
    description: "Cut MP3, WAV, OGG, or M4A right in your browser. Drag the handles on the waveform, preview the slice, then export.",
    helper: "One audio file up to 100 MB — MP3, WAV, OGG, or M4A.",
    engineNote: "First export downloads a ~25 MB engine once, then it works offline from cache.",
    engineLoading: "Loading audio engine…",
    compatTitle: "Browser not supported",
    compatDesc: "WebAssembly is unavailable here. Please use the latest Chrome or Edge on desktop.",
    start: "Start",
    end: "End",
    duration: "Duration",
    selection: "Selection",
    playSel: "Play selection",
    stop: "Stop",
    exportBtn: "Trim & download",
    exporting: "Trimming…",
    download: "Download trimmed audio",
    again: "Trim another",
    emptyTitle: "No audio yet",
    emptyDesc: "Upload an audio file above. Everything runs locally — your file never leaves this device.",
    noFile: "Please upload an audio file first.",
    decodeOk: "Audio loaded.",
    decodeFail: "Could not decode this audio file.",
    exportOk: "Audio trimmed successfully.",
    exportFail: "Trim failed. Please try again.",
    engineFail: "Could not load the audio engine. Check your connection and retry.",
    stepUpload: "Upload",
    stepProcess: "Select & trim",
    stepDownload: "Download",
    dragHint: "Drag the handles to select the part to keep (min 0.5s).",
    faqQ1: "Is my audio uploaded to a server?",
    faqA1: "No. Waveform decoding and trimming run 100% in your browser. Your file never leaves your device.",
    faqQ2: "Does trimming reduce quality?",
    faqA2: "No. The default export copies the audio stream without re-encoding, so quality is identical. If the format needs it, we fall back to a high-quality 192 kbps MP3 re-encode.",
    faqQ3: "Why is the first export slow?",
    faqA3: "The browser downloads a ~25 MB audio engine once. After that it is cached and exports start instantly.",
    faqQ4: "Which formats are supported?",
    faqA4: "MP3, WAV, OGG, and M4A uploads. The trimmed file keeps your original format.",
  },
  id: {
    description: "Potong MP3, WAV, OGG, atau M4A langsung di browser. Seret handle pada waveform, pratinjau potongan, lalu ekspor.",
    helper: "Satu file audio hingga 100 MB — MP3, WAV, OGG, atau M4A.",
    engineNote: "Ekspor pertama mengunduh engine ~25 MB sekali, lalu bekerja offline dari cache.",
    engineLoading: "Memuat engine audio…",
    compatTitle: "Browser tidak didukung",
    compatDesc: "WebAssembly tidak tersedia di sini. Gunakan Chrome atau Edge terbaru di desktop.",
    start: "Mulai",
    end: "Selesai",
    duration: "Durasi",
    selection: "Pilihan",
    playSel: "Putar pilihan",
    stop: "Berhenti",
    exportBtn: "Potong & unduh",
    exporting: "Memotong…",
    download: "Unduh audio hasil potongan",
    again: "Potong lainnya",
    emptyTitle: "Belum ada audio",
    emptyDesc: "Unggah file audio di atas. Semua berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah file audio terlebih dahulu.",
    decodeOk: "Audio berhasil dimuat.",
    decodeFail: "File audio ini tidak bisa di-decode.",
    exportOk: "Audio berhasil dipotong.",
    exportFail: "Pemotongan gagal. Coba lagi.",
    engineFail: "Gagal memuat engine audio. Periksa koneksi dan coba lagi.",
    stepUpload: "Unggah",
    stepProcess: "Pilih & potong",
    stepDownload: "Unduh",
    dragHint: "Seret handle untuk memilih bagian yang disimpan (min 0,5 dtk).",
    faqQ1: "Apakah audio saya diunggah ke server?",
    faqA1: "Tidak. Decode waveform dan pemotongan 100% berjalan di browser. File tidak pernah keluar dari perangkatmu.",
    faqQ2: "Apakah pemotongan menurunkan kualitas?",
    faqA2: "Tidak. Ekspor default menyalin stream audio tanpa re-encode sehingga kualitas identik. Jika format membutuhkannya, kami fallback ke re-encode MP3 192 kbps berkualitas tinggi.",
    faqQ3: "Kenapa ekspor pertama lambat?",
    faqA3: "Browser mengunduh engine audio ~25 MB sekali saja. Setelah itu tersimpan di cache dan ekspor berikutnya langsung mulai.",
    faqQ4: "Format apa yang didukung?",
    faqA4: "Unggahan MP3, WAV, OGG, dan M4A. File hasil potongan mempertahankan format aslimu.",
  },
};

function extOf(file: File): string {
  try {
    const byType = EXT_BY_TYPE[file.type];
    if (byType) return byType;
    const dot = file.name.lastIndexOf(".");
    const e = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "mp3";
    return MIME_BY_EXT[e] ? e : "mp3";
  } catch {
    return "mp3";
  }
}

export default function AudioTrimmerPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [enginePct, setEnginePct] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [compat] = useState(false);
  const [showCompat, setShowCompat] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const dragRef = useRef<"start" | "end" | null>(null);
  const startRef = useRef(0);
  const endRef = useRef(0);
  const durationRef = useRef(0);
  startRef.current = start;
  endRef.current = end;
  durationRef.current = duration;

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
    };
  }, []);

  // Draw waveform
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || peaks.length === 0) return;
      const dpr = 1;
      const w = canvas.clientWidth || 600;
      const h = 128;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const dark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = dark ? "#09090b" : "#f4f4f5";
      ctx.fillRect(0, 0, w, h);
      const dur = durationRef.current || 1;
      const selX0 = (startRef.current / dur) * w;
      const selX1 = (endRef.current / dur) * w;
      // dim outside selection
      ctx.fillStyle = dark ? "rgba(63,63,70,0.55)" : "rgba(161,161,170,0.45)";
      ctx.fillRect(0, 0, selX0, h);
      ctx.fillRect(selX1, 0, w - selX1, h);
      const n = peaks.length;
      const barW = Math.max(1, w / n - 0.6);
      for (let i = 0; i < n; i++) {
        const x = (i / n) * w;
        const bh = Math.max(2, peaks[i] * (h - 16));
        const inSel = x >= selX0 && x <= selX1;
        ctx.fillStyle = inSel
          ? "#4f46e5"
          : dark
            ? "#3f3f46"
            : "#a1a1aa";
        ctx.fillRect(x, (h - bh) / 2, barW, bh);
      }
      // handles
      ctx.fillStyle = "#10b981";
      ctx.fillRect(selX0 - 3, 0, 6, h);
      ctx.fillRect(selX1 - 3, 0, 6, h);
    } catch {
      // ignore draw errors
    }
  }, [peaks, start, end]);

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const next = files[0] ?? null;
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        setResultSize(null);
        setStatus("idle");
        setPlaying(false);
        try {
          audioRef.current?.pause();
        } catch {
          // ignore
        }
        if (!next) {
          setFile(null);
          setFileUrl((prev) => {
            if (prev) revokeUrl(prev);
            return null;
          });
          setPeaks([]);
          setDuration(0);
          return;
        }
        setFile(next);
        const url = URL.createObjectURL(next);
        trackUrl(url);
        setFileUrl((prev) => {
          if (prev) revokeUrl(prev);
          return url;
        });
        // decode peaks in handler (window/AudioContext allowed here)
        void (async () => {
          try {
            const buf = await next.arrayBuffer();
            const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AC();
            try {
              const decoded = await ctx.decodeAudioData(buf.slice(0));
              const ch = decoded.getChannelData(0);
              const target = 220;
              const block = Math.max(1, Math.floor(ch.length / target));
              const out: number[] = [];
              for (let i = 0; i < target; i++) {
                let max = 0;
                const off = i * block;
                const lim = Math.min(ch.length, off + block);
                for (let j = off; j < lim; j += Math.max(1, Math.floor(block / 24))) {
                  const v = Math.abs(ch[j]);
                  if (v > max) max = v;
                }
                out.push(Math.min(1, max));
              }
              setPeaks(out);
              setDuration(decoded.duration);
              setStart(0);
              setEnd(decoded.duration);
              setStatus("ready");
              toast.success(s.decodeOk);
            } finally {
              try {
                await ctx.close();
              } catch {
                // ignore
              }
            }
          } catch {
            toast.error(s.decodeFail);
          }
        })();
      } catch {
        toast.error(s.decodeFail);
      }
    },
    [revokeUrl, trackUrl, s.decodeFail, s.decodeOk],
  );

  const canvasPosToTime = useCallback((clientX: number): number => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return frac * (durationRef.current || 0);
    } catch {
      return 0;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        const canvas = canvasRef.current;
        if (!canvas || durationRef.current <= 0) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const w = rect.width;
        const x0 = (startRef.current / durationRef.current) * w;
        const x1 = (endRef.current / durationRef.current) * w;
        dragRef.current = Math.abs(x - x0) <= Math.abs(x - x1) ? "start" : "end";
        canvas.setPointerCapture(e.pointerId);
        const t = canvasPosToTime(e.clientX);
        if (dragRef.current === "start") setStart(Math.min(t, endRef.current - 0.5));
        else setEnd(Math.max(t, startRef.current + 0.5));
      } catch {
        // ignore
      }
    },
    [canvasPosToTime],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        if (!dragRef.current || durationRef.current <= 0) return;
        const t = Math.min(durationRef.current, Math.max(0, canvasPosToTime(e.clientX)));
        if (dragRef.current === "start") setStart(Math.min(t, endRef.current - 0.5));
        else setEnd(Math.max(t, startRef.current + 0.5));
      } catch {
        // ignore
      }
    },
    [canvasPosToTime],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const stopPreview = useCallback(() => {
    try {
      const a = audioRef.current;
      if (a) {
        a.pause();
      }
      setPlaying(false);
    } catch {
      setPlaying(false);
    }
  }, []);

  const playPreview = useCallback(() => {
    try {
      if (!fileUrl) {
        toast.error(s.noFile);
        return;
      }
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        stopPreview();
        return;
      }
      a.src = fileUrl;
      a.currentTime = startRef.current;
      const stopAt = endRef.current;
      const onTick = () => {
        try {
          if (a.currentTime >= stopAt) {
            a.pause();
            a.removeEventListener("timeupdate", onTick);
            setPlaying(false);
          }
        } catch {
          // ignore
        }
      };
      a.removeEventListener("timeupdate", onTick);
      a.addEventListener("timeupdate", onTick);
      void a.play().then(
        () => setPlaying(true),
        () => toast.error(s.decodeFail),
      );
    } catch {
      toast.error(s.decodeFail);
    }
  }, [fileUrl, playing, stopPreview, s.noFile, s.decodeFail]);

  const runExport = useCallback(async () => {
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    const dur = durationRef.current;
    const ss = Math.max(0, startRef.current);
    const to = Math.min(dur, endRef.current);
    if (!(to - ss >= 0.5)) {
      toast.error(s.dragHint);
      return;
    }
    setStatus("loading-engine");
    setEnginePct(0);
    try {
      if (!isWasmSupported()) {
        setShowCompat(true);
        setStatus("ready");
        return;
      }
      let ffmpeg: Awaited<ReturnType<typeof loadFFmpeg>>;
      try {
        ffmpeg = await loadFFmpeg((p) => {
          try {
            setEnginePct(p);
          } catch {
            // ignore
          }
        });
      } catch (e) {
        if (e instanceof FFmpegCompatError) {
          setShowCompat(true);
          setStatus("ready");
          return;
        }
        throw e;
      }
      setStatus("exporting");
      const ext = extOf(file);
      const inName = `input.${ext}`;
      const outName = `trimmed.${ext}`;
      await writeInput(ffmpeg, inName, file);
      const ssStr = ss.toFixed(3);
      const toStr = to.toFixed(3);
      let code = -1;
      try {
        code = await ffmpeg.exec(["-ss", ssStr, "-to", toStr, "-i", inName, "-c", "copy", outName]);
      } catch {
        code = -1;
      }
      if (code !== 0) {
        // re-encode fallback
        const encArgs =
          ext === "wav"
            ? ["-ss", ssStr, "-to", toStr, "-i", inName, "-c:a", "pcm_s16le", outName]
            : ext === "ogg"
              ? ["-ss", ssStr, "-to", toStr, "-i", inName, "-c:a", "libvorbis", "-q:a", "5", outName]
              : ext === "m4a"
                ? ["-ss", ssStr, "-to", toStr, "-i", inName, "-c:a", "aac", "-b:a", "192k", outName]
                : ["-ss", ssStr, "-to", toStr, "-i", inName, "-c:a", "libmp3lame", "-b:a", "192k", outName];
        code = await ffmpeg.exec(encArgs);
      }
      if (code !== 0) throw new Error("ffmpeg exit " + code);
      const data = await readOutput(ffmpeg, outName);
      const blob = toBlob(data, MIME_BY_EXT[ext] ?? "audio/mpeg");
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      const base = file.name.replace(/\.[^.]+$/, "") || "audio";
      setResultName(`${base}-trimmed.${ext}`);
      setResultSize(blob.size);
      setStatus("done");
      toast.success(s.exportOk);
      await deleteFFmpegFile(ffmpeg, inName);
      await deleteFFmpegFile(ffmpeg, outName);
    } catch {
      setStatus("ready");
      toast.error(s.exportFail);
    }
  }, [file, revokeUrl, trackUrl, s]);

  const handleReset = useCallback(() => {
    try {
      stopPreview();
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
      setPeaks([]);
      setDuration(0);
      setStart(0);
      setEnd(0);
      setResultSize(null);
      setResultName("");
      setStatus("idle");
      setEnginePct(0);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.exportFail);
    }
  }, [revokeUrl, stopPreview, s.exportFail]);

  const stage: 0 | 1 | 2 | 3 =
    status === "done" ? 3 : status === "exporting" || status === "loading-engine" ? 2 : file ? 1 : 0;

  return (
    <ToolLayout
      title="Audio Trimmer"
      description={s.description}
      descriptionId={s.description}
      iconName="Scissors"
      slug="media/audio-trimmer"
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
          maxSizeMB={100}
          onFiles={handleFiles}
          helperText={s.helper}
        />
        {showCompat || compat ? (
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
              <canvas
                ref={canvasRef}
                className="h-32 w-full cursor-ew-resize touch-none rounded-xl border border-zinc-200 dark:border-zinc-800"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                role="slider"
                aria-label={s.selection}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.dragHint}</p>
              <div className="grid grid-cols-2 gap-3">
                <AnimatedSlider
                  label={s.start}
                  value={start}
                  min={0}
                  max={Math.max(0.5, duration)}
                  step={0.1}
                  onChange={(v) => {
                    try {
                      setStart(Math.min(Math.max(0, v), end - 0.5));
                    } catch {
                      // ignore
                    }
                  }}
                  format={(v) => formatTime(v)}
                  id="trim-start"
                />
                <AnimatedSlider
                  label={s.end}
                  value={end}
                  min={0}
                  max={Math.max(0.5, duration)}
                  step={0.1}
                  onChange={(v) => {
                    try {
                      setEnd(Math.max(Math.min(duration, v), start + 0.5));
                    } catch {
                      // ignore
                    }
                  }}
                  format={(v) => formatTime(v)}
                  id="trim-end"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                <span>{s.duration}: {formatTime(duration)}</span>
                <span>•</span>
                <span>{s.selection}: {formatTime(Math.max(0, end - start))}</span>
                <span>•</span>
                <span>{file ? formatBytes(file.size) : ""}</span>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio ref={audioRef} preload="metadata" className="hidden" />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={playPreview} className="flex-1" size="lg">
                  {playing ? <Square className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                  {playing ? s.stop : s.playSel}
                </Button>
                <Button
                  onClick={() => void runExport()}
                  disabled={status === "exporting" || status === "loading-engine"}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {status === "exporting" || status === "loading-engine" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {status === "loading-engine" ? s.engineLoading : s.exporting}
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4" aria-hidden />
                      {s.exportBtn}
                    </>
                  )}
                </Button>
              </div>
              {status === "loading-engine" ? (
                <div role="status">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-600" />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{s.engineNote} {enginePct > 0 ? `${enginePct}%` : ""}</p>
                </div>
              ) : null}
              {status === "done" && resultUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{resultName} {resultSize !== null ? `• ${formatBytes(resultSize)}` : ""}</p>
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
            icon={<Scissors className="h-6 w-6" aria-hidden />}
            title={s.emptyTitle}
            hint={s.emptyDesc}
          />
        )}
      </div>
    </ToolLayout>
  );
}
