"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Clapperboard, Download, Loader2, RotateCcw } from "lucide-react";
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

type Status = "idle" | "loading-engine" | "ready" | "trimming" | "done";

const ACCEPT = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

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
  reencode: string;
  reencodeHint: string;
  keyframeNote: string;
  trimBtn: string;
  trimming: string;
  download: string;
  again: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  metaOk: string;
  trimOk: string;
  trimFail: string;
  badRange: string;
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
    description: "Cut MP4, WebM, or MOV clips in your browser. Set start and end, pick fast cut or precise re-encode, then download.",
    helper: "One video up to 500 MB — MP4, WebM, or MOV.",
    engineNote: "First run downloads a ~25 MB engine once, then it works offline from cache.",
    engineLoading: "Loading video engine…",
    compatTitle: "Browser not supported",
    compatDesc: "WebAssembly is unavailable here. Please use the latest Chrome or Edge on desktop.",
    start: "Start (s)",
    end: "End (s)",
    duration: "Duration",
    selection: "Selection",
    reencode: "Precise cut (re-encode)",
    reencodeHint: "Slower but frame-accurate. Off = instant stream copy.",
    keyframeNote: "Fast cut snaps to the nearest keyframe, so the start may shift by a second or two. Enable precise cut for exact timing.",
    trimBtn: "Trim & download",
    trimming: "Trimming…",
    download: "Download trimmed MP4",
    again: "Trim another",
    emptyTitle: "No video yet",
    emptyDesc: "Upload a video above. Trimming runs locally — your file never leaves this device.",
    noFile: "Please upload a video first.",
    metaOk: "Video loaded.",
    trimOk: "Video trimmed successfully.",
    trimFail: "Trim failed. Try precise cut or a smaller file.",
    badRange: "End must be at least 0.5s after start.",
    stepUpload: "Upload",
    stepProcess: "Select & trim",
    stepDownload: "Download",
    faqQ1: "Is my video uploaded to a server?",
    faqA1: "No. Trimming runs 100% in your browser. Your file never leaves your device.",
    faqQ2: "Fast cut vs precise cut?",
    faqA2: "Fast cut copies streams without re-encoding — instant and lossless, but the start snaps to the nearest keyframe. Precise cut re-encodes with H.264 for frame-accurate timing at the cost of speed.",
    faqQ3: "Why is the first run slow?",
    faqA3: "The browser downloads a ~25 MB video engine once. After that it is cached and runs start instantly.",
    faqQ4: "Why is the output MP4?",
    faqA4: "MP4 with H.264 plays on virtually every device, so we standardize on it regardless of the input format.",
  },
  id: {
    description: "Potong klip MP4, WebM, atau MOV di browser. Atur mulai dan selesai, pilih potong cepat atau re-encode presisi, lalu unduh.",
    helper: "Satu video hingga 500 MB — MP4, WebM, atau MOV.",
    engineNote: "Jalankan pertama mengunduh engine ~25 MB sekali, lalu bekerja offline dari cache.",
    engineLoading: "Memuat engine video…",
    compatTitle: "Browser tidak didukung",
    compatDesc: "WebAssembly tidak tersedia di sini. Gunakan Chrome atau Edge terbaru di desktop.",
    start: "Mulai (dtk)",
    end: "Selesai (dtk)",
    duration: "Durasi",
    selection: "Pilihan",
    reencode: "Potong presisi (re-encode)",
    reencodeHint: "Lebih lambat tapi akurat per frame. Mati = salin stream instan.",
    keyframeNote: "Potong cepat menempel ke keyframe terdekat sehingga awal bisa bergeser satu-dua detik. Aktifkan potong presisi untuk timing tepat.",
    trimBtn: "Potong & unduh",
    trimming: "Memotong…",
    download: "Unduh MP4 hasil potongan",
    again: "Potong lainnya",
    emptyTitle: "Belum ada video",
    emptyDesc: "Unggah video di atas. Pemotongan berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah video terlebih dahulu.",
    metaOk: "Video berhasil dimuat.",
    trimOk: "Video berhasil dipotong.",
    trimFail: "Pemotongan gagal. Coba potong presisi atau file lebih kecil.",
    badRange: "Selesai harus minimal 0,5 dtk setelah mulai.",
    stepUpload: "Unggah",
    stepProcess: "Pilih & potong",
    stepDownload: "Unduh",
    faqQ1: "Apakah video saya diunggah ke server?",
    faqA1: "Tidak. Pemotongan 100% berjalan di browser. File tidak pernah keluar dari perangkatmu.",
    faqQ2: "Potong cepat vs potong presisi?",
    faqA2: "Potong cepat menyalin stream tanpa re-encoding — instan dan lossless, tapi awal menempel ke keyframe terdekat. Potong presisi me-re-encode dengan H.264 agar akurat per frame dengan biaya kecepatan.",
    faqQ3: "Kenapa jalankan pertama lambat?",
    faqA3: "Browser mengunduh engine video ~25 MB sekali saja. Setelah itu tersimpan di cache dan langsung mulai.",
    faqQ4: "Kenapa output-nya MP4?",
    faqA4: "MP4 dengan H.264 bisa diputar di hampir semua perangkat, jadi kami standarkan apa pun format inputnya.",
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

export default function VideoTrimmerPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [reencode, setReencode] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [showCompat, setShowCompat] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const urlsRef = useRef<string[]>([]);
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

  const handleFiles = useCallback(
    (files: File[]) => {
      try {
        const next = files[0] ?? null;
        setResultUrl((prev) => {
          if (prev) revokeUrl(prev);
          return null;
        });
        setResultSize(null);
        setProgress(0);
        setStatus("idle");
        if (!next) {
          setFile(null);
          setFileUrl((prev) => {
            if (prev) revokeUrl(prev);
            return null;
          });
          setDuration(0);
          setStart(0);
          setEnd(0);
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
        toast.error(s.trimFail);
      }
    },
    [revokeUrl, trackUrl, s.metaOk, s.trimFail],
  );

  const clampNum = useCallback((raw: string, fallback: number): number => {
    try {
      const v = Number.parseFloat(raw);
      return Number.isFinite(v) && v >= 0 ? v : fallback;
    } catch {
      return fallback;
    }
  }, []);

  const runTrim = useCallback(async () => {
    if (!file) {
      toast.error(s.noFile);
      return;
    }
    const dur = duration > 0 ? duration : 0;
    const ss = Math.max(0, start);
    const ee = dur > 0 ? Math.min(dur, end) : end;
    if (!(ee - ss >= 0.5)) {
      toast.error(s.badRange);
      return;
    }
    setStatus("loading-engine");
    setProgress(0);
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
      setStatus("trimming");
      const inName = `input.${inExtOf(file)}`;
      const outName = "trimmed.mp4";
      await writeInput(ffmpeg, inName, file);
      const ssStr = ss.toFixed(3);
      const lenStr = (ee - ss).toFixed(3);
      const args = reencode
        ? [
            "-ss", ssStr, "-i", inName, "-t", lenStr,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outName,
          ]
        : [
            "-ss", ssStr, "-i", inName, "-t", lenStr,
            "-c", "copy", "-movflags", "+faststart", outName,
          ];
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
      setResultName(`${base}-trimmed.mp4`);
      setResultSize(blob.size);
      setProgress(100);
      setStatus("done");
      toast.success(`${s.trimOk} (${formatBytes(blob.size)})`);
      await deleteFFmpegFile(ffmpeg, inName);
      await deleteFFmpegFile(ffmpeg, outName);
    } catch {
      setStatus("ready");
      toast.error(s.trimFail);
    }
  }, [file, duration, start, end, reencode, revokeUrl, trackUrl, s]);

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
      setDuration(0);
      setStart(0);
      setEnd(0);
      setResultSize(null);
      setResultName("");
      setStatus("idle");
      setProgress(0);
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.trimFail);
    }
  }, [revokeUrl, s.trimFail]);

  const stage: 0 | 1 | 2 | 3 =
    status === "done" ? 3 : status === "trimming" || status === "loading-engine" ? 2 : file ? 1 : 0;

  const maxDur = Math.max(1, duration);

  return (
    <ToolLayout
      title="Video Trimmer"
      description={s.description}
      descriptionId={s.description}
      iconName="Clapperboard"
      slug="media/video-trimmer"
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
                    const safe = typeof d === "number" && isFinite(d) && d > 0 ? d : 0;
                    setDuration(safe);
                    setStart(0);
                    setEnd(safe);
                  } catch {
                    // ignore
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{s.start}</span>
                  <input
                    type="number"
                    min={0}
                    max={maxDur}
                    step={0.1}
                    value={Number(start.toFixed(1))}
                    onChange={(e) => {
                      try {
                        const v = clampNum(e.target.value, start);
                        setStart(Math.min(Math.max(0, v), (duration || v + 0.5) - 0.5));
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{s.end}</span>
                  <input
                    type="number"
                    min={0}
                    max={maxDur}
                    step={0.1}
                    value={Number(end.toFixed(1))}
                    onChange={(e) => {
                      try {
                        const v = clampNum(e.target.value, end);
                        setEnd(Math.max(Math.min(duration || v, v), start + 0.5));
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnimatedSlider
                  label={s.start}
                  value={start}
                  min={0}
                  max={maxDur}
                  step={0.1}
                  onChange={(v) => {
                    try {
                      setStart(Math.min(Math.max(0, v), end - 0.5));
                    } catch {
                      // ignore
                    }
                  }}
                  format={(v) => formatTime(v)}
                  id="vtrim-start"
                />
                <AnimatedSlider
                  label={s.end}
                  value={end}
                  min={0}
                  max={maxDur}
                  step={0.1}
                  onChange={(v) => {
                    try {
                      setEnd(Math.max(Math.min(duration || v, v), start + 0.5));
                    } catch {
                      // ignore
                    }
                  }}
                  format={(v) => formatTime(v)}
                  id="vtrim-end"
                />
              </div>
              <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {s.duration}: {formatTime(duration)} • {s.selection}: {formatTime(Math.max(0, end - start))} • {formatBytes(file.size)}
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <input
                  type="checkbox"
                  checked={reencode}
                  onChange={(e) => {
                    try {
                      setReencode(e.target.checked);
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <span>
                  <span className="block text-sm font-medium">{s.reencode}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {reencode ? s.reencodeHint : s.keyframeNote}
                  </span>
                </span>
              </label>
              <Button
                onClick={() => void runTrim()}
                disabled={status === "trimming" || status === "loading-engine"}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {status === "trimming" || status === "loading-engine" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {status === "loading-engine" ? s.engineLoading : `${s.trimming} ${progress}%`}
                  </>
                ) : (
                  <>
                    <Clapperboard className="h-4 w-4" aria-hidden />
                    {s.trimBtn}
                  </>
                )}
              </Button>
              {status === "trimming" || status === "loading-engine" ? (
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
                    {status === "loading-engine" ? s.engineNote : `${progress}%`}
                  </p>
                </div>
              ) : null}
              {status === "done" && resultUrl ? (
                <div className="space-y-2">
                  <video src={resultUrl} controls preload="metadata" className="max-h-48 w-full rounded-xl bg-black" />
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
            icon={<Clapperboard className="h-6 w-6" aria-hidden />}
            title={s.emptyTitle}
            hint={s.emptyDesc}
          />
        )}
      </div>
    </ToolLayout>
  );
}
