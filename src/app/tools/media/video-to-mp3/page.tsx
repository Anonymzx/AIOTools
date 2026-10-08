"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileAudio, Loader2, RotateCcw } from "lucide-react";
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

type Status = "idle" | "loading-engine" | "ready" | "converting" | "done";
type Quality = "128" | "192" | "320";
type OutFormat = "mp3" | "wav";

const ACCEPT = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

interface Strings {
  description: string;
  helper: string;
  engineNote: string;
  engineLoading: string;
  compatTitle: string;
  compatDesc: string;
  quality: string;
  format: string;
  q128: string;
  q192: string;
  q320: string;
  duration: string;
  nobrk: string;
  extractBtn: string;
  extracting: string;
  download: string;
  again: string;
  emptyTitle: string;
  emptyDesc: string;
  noFile: string;
  metaOk: string;
  metaFail: string;
  extractOk: string;
  extractFail: string;
  stepUpload: string;
  stepProcess: string;
  stepDownload: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, Strings> = {
  en: {
    description: "Pull the audio track out of any MP4, WebM, or MOV video. Pick quality and format, then download the audio.",
    helper: "One video up to 500 MB — MP4, WebM, or MOV.",
    engineNote: "First run downloads a ~25 MB engine once, then it works offline from cache.",
    engineLoading: "Loading audio engine…",
    compatTitle: "Browser not supported",
    compatDesc: "WebAssembly is unavailable here. Please use the latest Chrome or Edge on desktop.",
    quality: "Audio quality",
    format: "Output format",
    q128: "128 kbps — smaller file",
    q192: "192 kbps — balanced",
    q320: "320 kbps — best quality",
    duration: "Duration",
    nobrk: "Size",
    extractBtn: "Extract audio",
    extracting: "Extracting…",
    download: "Download audio",
    again: "Convert another",
    emptyTitle: "No video yet",
    emptyDesc: "Upload a video above. Extraction runs locally — your file never leaves this device.",
    noFile: "Please upload a video first.",
    metaOk: "Video loaded.",
    metaFail: "Could not read this video file.",
    extractOk: "Audio extracted successfully.",
    extractFail: "Extraction failed. Please try again.",
    stepUpload: "Upload",
    stepProcess: "Extract",
    stepDownload: "Download",
    faqQ1: "Is my video uploaded to a server?",
    faqA1: "No. The video never leaves your device — extraction runs entirely in your browser.",
    faqQ2: "MP3 or WAV — which should I choose?",
    faqA2: "MP3 is much smaller and plays everywhere. WAV is lossless but roughly 10× larger — pick it only for editing.",
    faqQ3: "Why is the first extraction slow?",
    faqA3: "The browser downloads a ~25 MB engine once. After that it is cached and runs start instantly.",
  },
  id: {
    description: "Ambil trek audio dari video MP4, WebM, atau MOV apa pun. Pilih kualitas dan format, lalu unduh audionya.",
    helper: "Satu video hingga 500 MB — MP4, WebM, atau MOV.",
    engineNote: "Jalankan pertama mengunduh engine ~25 MB sekali, lalu bekerja offline dari cache.",
    engineLoading: "Memuat engine audio…",
    compatTitle: "Browser tidak didukung",
    compatDesc: "WebAssembly tidak tersedia di sini. Gunakan Chrome atau Edge terbaru di desktop.",
    quality: "Kualitas audio",
    format: "Format output",
    q128: "128 kbps — file lebih kecil",
    q192: "192 kbps — seimbang",
    q320: "320 kbps — kualitas terbaik",
    duration: "Durasi",
    nobrk: "Ukuran",
    extractBtn: "Ekstrak audio",
    extracting: "Mengekstrak…",
    download: "Unduh audio",
    again: "Konversi lainnya",
    emptyTitle: "Belum ada video",
    emptyDesc: "Unggah video di atas. Ekstraksi berjalan lokal — file tidak pernah keluar dari perangkat ini.",
    noFile: "Silakan unggah video terlebih dahulu.",
    metaOk: "Video berhasil dimuat.",
    metaFail: "File video ini tidak bisa dibaca.",
    extractOk: "Audio berhasil diekstrak.",
    extractFail: "Ekstraksi gagal. Coba lagi.",
    stepUpload: "Unggah",
    stepProcess: "Ekstrak",
    stepDownload: "Unduh",
    faqQ1: "Apakah video saya diunggah ke server?",
    faqA1: "Tidak. Video tidak pernah keluar dari perangkatmu — ekstraksi 100% berjalan di browser.",
    faqQ2: "MP3 atau WAV — mana yang dipilih?",
    faqA2: "MP3 jauh lebih kecil dan bisa diputar di mana saja. WAV lossless tapi sekitar 10× lebih besar — pilih hanya untuk editing.",
    faqQ3: "Kenapa ekstraksi pertama lambat?",
    faqA3: "Browser mengunduh engine ~25 MB sekali saja. Setelah itu tersimpan di cache dan langsung mulai.",
  },
};

function inExtOf(file: File): string {
  try {
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    const dot = file.name.lastIndexOf(".");
    const e = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "mp4";
    return e === "mov" ? "mov" : e === "webm" ? "webm" : "mp4";
  } catch {
    return "mp4";
  }
}

export default function VideoToMp3Page() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [quality, setQuality] = useState<Quality>("192");
  const [format, setFormat] = useState<OutFormat>("mp3");
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
        setDuration(null);
        setProgress(0);
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
        toast.error(s.metaFail);
      }
    },
    [revokeUrl, trackUrl, s.metaFail, s.metaOk],
  );

  const runExtract = useCallback(async () => {
    if (!file) {
      toast.error(s.noFile);
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
      setStatus("converting");
      const inName = `input.${inExtOf(file)}`;
      const outName = format === "wav" ? "output.wav" : "output.mp3";
      await writeInput(ffmpeg, inName, file);
      const args =
        format === "wav"
          ? ["-i", inName, "-vn", "-c:a", "pcm_s16le", outName]
          : ["-i", inName, "-vn", "-c:a", "libmp3lame", "-b:a", `${quality}k`, outName];
      const onProg = ({ progress, time }: { progress: number; time: number }) => {
        try {
          void time;
          setProgress(Math.round(Math.min(1, Math.max(0, progress)) * 100));
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
      const blob = toBlob(data, format === "wav" ? "audio/wav" : "audio/mpeg");
      const url = URL.createObjectURL(blob);
      trackUrl(url);
      setResultUrl((prev) => {
        if (prev) revokeUrl(prev);
        return url;
      });
      const base = file.name.replace(/\.[^.]+$/, "") || "video";
      setResultName(`${base}.${format}`);
      setResultSize(blob.size);
      setProgress(100);
      setStatus("done");
      toast.success(`${s.extractOk} (${formatBytes(blob.size)})`);
      await deleteFFmpegFile(ffmpeg, inName);
      await deleteFFmpegFile(ffmpeg, outName);
    } catch {
      setStatus("ready");
      toast.error(s.extractFail);
    }
  }, [file, format, quality, revokeUrl, trackUrl, s]);

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
      setDropzoneKey((k) => k + 1);
    } catch {
      toast.error(s.extractFail);
    }
  }, [revokeUrl, s.extractFail]);

  const stage: 0 | 1 | 2 | 3 =
    status === "done" ? 3 : status === "converting" || status === "loading-engine" ? 2 : file ? 1 : 0;

  const qualities: Quality[] = ["128", "192", "320"];
  const qLabel = (q: Quality) => (q === "128" ? s.q128 : q === "192" ? s.q192 : s.q320);

  return (
    <ToolLayout
      title="Video to MP3"
      description={s.description}
      descriptionId={s.description}
      iconName="FileAudio"
      slug="media/video-to-mp3"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
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
                <span>{file.name}</span>
                <span>•</span>
                <span>{formatBytes(file.size)}</span>
                {duration !== null ? (
                  <>
                    <span>•</span>
                    <span>{s.duration}: {formatTime(duration)}</span>
                  </>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{s.quality}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {qualities.map((q) => (
                    <Button
                      key={q}
                      variant={quality === q ? "default" : "outline"}
                      onClick={() => {
                        try {
                          setQuality(q);
                        } catch {
                          // ignore
                        }
                      }}
                      className={quality === q ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                      {qLabel(q)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{s.format}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["mp3", "wav"] as OutFormat[]).map((f) => (
                    <Button
                      key={f}
                      variant={format === f ? "default" : "outline"}
                      onClick={() => {
                        try {
                          setFormat(f);
                        } catch {
                          // ignore
                        }
                      }}
                      className={format === f ? "bg-indigo-600 uppercase hover:bg-indigo-700" : "uppercase"}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => void runExtract()}
                disabled={status === "converting" || status === "loading-engine"}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {status === "converting" || status === "loading-engine" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {status === "loading-engine" ? s.engineLoading : `${s.extracting} ${progress}%`}
                  </>
                ) : (
                  <>
                    <FileAudio className="h-4 w-4" aria-hidden />
                    {s.extractBtn}
                  </>
                )}
              </Button>
              {status === "converting" || status === "loading-engine" ? (
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
            icon={<FileAudio className="h-6 w-6" aria-hidden />}
            title={s.emptyTitle}
            hint={s.emptyDesc}
          />
        )}
      </div>
    </ToolLayout>
  );
}
