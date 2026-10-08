"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Monitor, Mic, Video, Square, Download, Trash2, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type RecMode = "screen" | "both" | "mic";
type RecStatus = "idle" | "recording" | "done";

interface RecResult {
  url: string;
  size: number;
  durationSec: number;
  mime: string;
  mode: RecMode;
}

interface RecStrings {
  description: string;
  screenTitle: string;
  screenDesc: string;
  bothTitle: string;
  bothDesc: string;
  micTitle: string;
  micDesc: string;
  start: string;
  stop: string;
  recording: string;
  needMode: string;
  denied: string;
  unsupported: string;
  startFailed: string;
  stopFailed: string;
  stopped: string;
  guideTitle: string;
  guideDesc: string;
  guideSteps: string[];
  resultTitle: string;
  sizeLabel: string;
  durationLabel: string;
  download: string;
  discard: string;
  recordNew: string;
  liveLabel: string;
  audioOnly: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, RecStrings> = {
  en: {
    description: "Record your screen, microphone, or both — free, right in your browser. Live preview with timer, then preview and download as .webm.",
    screenTitle: "Screen Only",
    screenDesc: "Capture a tab, window or full screen. No audio.",
    bothTitle: "Screen + Mic",
    bothDesc: "Screen video with microphone narration.",
    micTitle: "Mic Only",
    micDesc: "Audio-only voice recording.",
    start: "Start recording",
    stop: "Stop",
    recording: "Recording",
    needMode: "Pick a recording mode first.",
    denied: "Permission denied. Follow the steps below to allow access, then try again.",
    unsupported: "Recording is not supported in this browser. Try Chrome or Edge on desktop.",
    startFailed: "Could not start recording.",
    stopFailed: "Could not stop recording cleanly.",
    stopped: "Recording saved — preview it below.",
    guideTitle: "Permission blocked — how to allow",
    guideDesc: "Your browser blocked screen or microphone access. Fix it in seconds:",
    guideSteps: [
      "Click the camera/screen icon in the address bar and set permissions to Allow.",
      "Chrome / Edge: Settings → Privacy and security → Site Settings → Camera / Microphone / Screen capture → Allow for this site.",
      "Firefox: click the crossed-out mic/screen icon in the address bar → Allow, then retry.",
      "macOS: System Settings → Privacy & Security → Screen Recording / Microphone → enable your browser, then restart it.",
    ],
    resultTitle: "Your recording",
    sizeLabel: "Size",
    durationLabel: "Duration",
    download: "Download .webm",
    discard: "Discard",
    recordNew: "Record new",
    liveLabel: "Live preview",
    audioOnly: "Audio-only mode — your voice is being captured. No video preview.",
    faqQ1: "Where is my recording stored?",
    faqA1: "Only in your browser's memory. The MediaRecorder API writes chunks locally and the .webm file is generated on your device — nothing is uploaded anywhere.",
    faqQ2: "Which browsers support this?",
    faqA2: "Screen capture needs a desktop Chromium browser (Chrome, Edge, Brave) or Firefox. Microphone-only recording also works on mobile. Safari support for screen capture is limited.",
    faqQ3: "Why is the file .webm?",
    faqA3: "WebM (VP9/VP8) is the format browsers can encode natively without plugins or servers. It plays in all modern browsers and converts easily with tools like HandBrake or ffmpeg.",
  },
  id: {
    description: "Rekam layar, mikrofon, atau keduanya — gratis, langsung di browser. Pratinjau live dengan timer, lalu putar ulang dan unduh sebagai .webm.",
    screenTitle: "Layar Saja",
    screenDesc: "Rekam tab, jendela, atau seluruh layar. Tanpa audio.",
    bothTitle: "Layar + Mic",
    bothDesc: "Video layar dengan narasi mikrofon.",
    micTitle: "Mic Saja",
    micDesc: "Rekaman suara saja.",
    start: "Mulai merekam",
    stop: "Berhenti",
    recording: "Merekam",
    needMode: "Pilih mode perekaman dulu.",
    denied: "Izin ditolak. Ikuti langkah di bawah untuk mengizinkan akses, lalu coba lagi.",
    unsupported: "Perekaman tidak didukung di browser ini. Coba Chrome atau Edge di desktop.",
    startFailed: "Gagal memulai perekaman.",
    stopFailed: "Gagal menghentikan perekaman dengan bersih.",
    stopped: "Rekaman tersimpan — putar di bawah.",
    guideTitle: "Izin diblokir — cara mengizinkan",
    guideDesc: "Browser memblokir akses layar atau mikrofon. Perbaiki dalam hitungan detik:",
    guideSteps: [
      "Klik ikon kamera/layar di address bar lalu setel izin ke Allow/Izinkan.",
      "Chrome / Edge: Settings → Privacy and security → Site Settings → Camera / Microphone / Screen capture → Allow untuk situs ini.",
      "Firefox: klik ikon mic/layar yang dicoret di address bar → Allow, lalu coba lagi.",
      "macOS: System Settings → Privacy & Security → Screen Recording / Microphone → aktifkan browser-mu, lalu restart.",
    ],
    resultTitle: "Hasil rekamanmu",
    sizeLabel: "Ukuran",
    durationLabel: "Durasi",
    download: "Unduh .webm",
    discard: "Buang",
    recordNew: "Rekam baru",
    liveLabel: "Pratinjau langsung",
    audioOnly: "Mode audio saja — suaramu sedang direkam. Tidak ada pratinjau video.",
    faqQ1: "Di mana rekaman saya disimpan?",
    faqA1: "Hanya di memori browser-mu. MediaRecorder API menulis potongan data secara lokal dan file .webm dibuat di perangkatmu — tidak ada yang diunggah ke mana pun.",
    faqQ2: "Browser apa yang mendukung ini?",
    faqA2: "Tangkap layar butuh browser Chromium desktop (Chrome, Edge, Brave) atau Firefox. Rekaman mic saja juga bisa di HP. Dukungan Safari untuk tangkap layar masih terbatas.",
    faqQ3: "Kenapa filenya .webm?",
    faqA3: "WebM (VP9/VP8) adalah format yang bisa di-encode browser secara native tanpa plugin atau server. Bisa diputar di semua browser modern dan mudah dikonversi dengan HandBrake atau ffmpeg.",
  },
};

const MIME_CANDIDATES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "audio/webm"];

function pickMime(isAudioOnly: boolean): string {
  try {
    const MR = window.MediaRecorder;
    if (!MR || typeof MR.isTypeSupported !== "function") return "";
    const list = isAudioOnly
      ? ["audio/webm", "video/webm", ...MIME_CANDIDATES]
      : MIME_CANDIDATES;
    for (const m of list) {
      try {
        if (MR.isTypeSupported(m)) return m;
      } catch {
        // try next
      }
    }
    return "";
  } catch {
    return "";
  }
}

function formatTime(totalSec: number): string {
  try {
    const m = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  } catch {
    return "00:00";
  }
}

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "—";
  }
}

export default function RecordPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [mode, setMode] = useState<RecMode | null>(null);
  const [status, setStatus] = useState<RecStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [result, setResult] = useState<RecResult | null>(null);
  const [busy, setBusy] = useState(false);
  const reduceMotion = useReducedMotion();

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const modeAtStart = useRef<RecMode>("screen");

  const clearTimer = useCallback(() => {
    try {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch {
      // ignore
    }
  }, []);

  const stopTracks = useCallback(() => {
    try {
      const st = streamRef.current;
      if (st) {
        for (const t of st.getTracks()) {
          try {
            t.stop();
          } catch {
            // ignore per-track errors
          }
        }
      }
      streamRef.current = null;
    } catch {
      // ignore
    }
  }, []);

  // Cleanup on unmount: stop recorder + tracks + timer
  useEffect(() => {
    return () => {
      try {
        clearTimer();
        try {
          if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
          }
        } catch {
          // ignore
        }
        const st = streamRef.current;
        if (st) {
          for (const t of st.getTracks()) {
            try {
              t.stop();
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    };
  }, [clearTimer]);

  // Attach live stream to the preview video element
  useEffect(() => {
    try {
      const v = liveVideoRef.current;
      const st = streamRef.current;
      if (v && st && status === "recording" && modeAtStart.current !== "mic") {
        v.srcObject = st;
        void v.play().catch(() => {
          // autoplay with muted is allowed; ignore failures
        });
      }
    } catch {
      // preview attach must never break recording
    }
  }, [status]);

  const start = useCallback(
    (m: RecMode) => {
      if (busy || status === "recording") return;
      setBusy(true);
      setShowGuide(false);
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          toast.error(s.unsupported);
          setBusy(false);
          return;
        }
        const run = async () => {
          try {
            let stream: MediaStream;
            if (m === "screen") {
              stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            } else if (m === "mic") {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } else {
              const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
              try {
                const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream = new MediaStream([...screen.getTracks(), ...audio.getTracks()]);
              } catch (audioErr) {
                // Mic denied but screen granted: stop screen, show guide
                try {
                  for (const t of screen.getTracks()) t.stop();
                } catch {
                  // ignore
                }
                throw audioErr;
              }
            }

            const mime = pickMime(m === "mic");
            const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            chunksRef.current = [];
            rec.ondataavailable = (e) => {
              try {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
              } catch {
                // ignore chunk errors
              }
            };
            const stopped = new Promise<Blob>((resolve) => {
              rec.onstop = () => {
                try {
                  resolve(new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" }));
                } catch {
                  resolve(new Blob(chunksRef.current, { type: "video/webm" }));
                }
              };
            });

            streamRef.current = stream;
            recorderRef.current = rec;
            modeAtStart.current = m;
            startRef.current = Date.now();
            setElapsed(0);
            rec.start(250);
            setStatus("recording");
            clearTimer();
            timerRef.current = window.setInterval(() => {
              try {
                setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
              } catch {
                // ignore tick errors
              }
            }, 1000);

            const blob = await stopped;
            // Reached when stop() resolves onstop
            try {
              const url = URL.createObjectURL(blob);
              const dur = Math.floor((Date.now() - startRef.current) / 1000);
              setResult({
                url,
                size: blob.size,
                durationSec: dur,
                mime: rec.mimeType || "video/webm",
                mode: m,
              });
              setStatus("done");
              toast.success(s.stopped);
            } catch {
              toast.error(s.stopFailed);
            }
          } catch (e) {
            try {
              const name = (e as DOMException)?.name ?? "";
              if (name === "NotAllowedError" || name === "SecurityError") {
                setShowGuide(true);
                toast.error(s.denied);
              } else if (name === "NotFoundError" || name === "OverconstrainedError") {
                toast.error(s.unsupported);
              } else if (name === "AbortError") {
                // user cancelled the picker — silent
              } else {
                toast.error(s.startFailed);
              }
            } catch {
              toast.error(s.startFailed);
            }
            try {
              stopTracks();
            } catch {
              // ignore
            }
            setStatus("idle");
          } finally {
            try {
              clearTimer();
              setBusy(false);
            } catch {
              // ignore
            }
          }
        };
        void run();
      } catch {
        toast.error(s.startFailed);
        setBusy(false);
      }
    },
    [busy, status, clearTimer, stopTracks, s],
  );

  const stop = useCallback(() => {
    try {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") return;
      rec.stop();
      stopTracks();
      clearTimer();
    } catch {
      toast.error(s.stopFailed);
    }
  }, [stopTracks, clearTimer, s.stopFailed]);

  const discard = useCallback(() => {
    try {
      if (result) {
        try {
          URL.revokeObjectURL(result.url);
        } catch {
          // ignore
        }
      }
      setResult(null);
      setStatus("idle");
      setElapsed(0);
    } catch {
      toast.error(s.stopFailed);
    }
  }, [result, s.stopFailed]);

  const modes: { key: RecMode; icon: typeof Monitor; title: string; desc: string }[] = [
    { key: "screen", icon: Monitor, title: s.screenTitle, desc: s.screenDesc },
    { key: "both", icon: Video, title: s.bothTitle, desc: s.bothDesc },
    { key: "mic", icon: Mic, title: s.micTitle, desc: s.micDesc },
  ];

  return (
    <ToolLayout
      title="Screen & Audio Recorder"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="image/record"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={s.start}>
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={status === "recording"}
                onClick={() => {
                  try {
                    setMode(m.key);
                  } catch {
                    // ignore
                  }
                }}
                className={cn(
                  "relative rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-60",
                  active
                    ? "border-indigo-600 bg-indigo-50 shadow-sm dark:bg-indigo-950"
                    : "border-zinc-200 bg-white hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="rec-mode-ring"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 350, damping: 32 }
                    }
                    className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
                    style={{
                      boxShadow: "0 0 24px rgba(99, 102, 241, 0.35)",
                    }}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="mt-2 block text-sm font-bold text-zinc-900 dark:text-zinc-100">{m.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{m.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {status === "recording" ? (
            <Button
              onClick={stop}
              size="lg"
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4" aria-hidden />
              {s.stop} · <span className="tabular-nums">{formatTime(elapsed)}</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                try {
                  if (!mode) {
                    toast.error(s.needMode);
                    return;
                  }
                  start(mode);
                } catch {
                  toast.error(s.startFailed);
                }
              }}
              disabled={busy}
              size="lg"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
              {busy ? s.recording + "…" : s.start}
            </Button>
          )}
          {status === "done" && (
            <Button variant="outline" size="lg" onClick={discard} className="flex-1">
              <Trash2 className="h-4 w-4" aria-hidden />
              {s.discard}
            </Button>
          )}
        </div>

        {showGuide && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardContent className="space-y-2 p-4 sm:p-6">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                <CircleAlert className="h-4 w-4" aria-hidden />
                {s.guideTitle}
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">{s.guideDesc}</p>
              <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {s.guideSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {status === "recording" && (
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <p className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />
                {s.recording} · <span className="tabular-nums">{formatTime(elapsed)}</span>
              </p>
              {modeAtStart.current === "mic" ? (
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.audioOnly}</p>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.liveLabel}</p>
                  <video
                    ref={liveVideoRef}
                    muted
                    playsInline
                    className="h-auto max-h-[50vh] w-full rounded-xl border border-zinc-200 bg-black object-contain dark:border-zinc-800"
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {status === "done" && result && (
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.resultTitle}</p>
              {result.mode === "mic" ? (
                <audio src={result.url} controls className="w-full" />
              ) : (
                <video
                  src={result.url}
                  controls
                  playsInline
                  className="h-auto max-h-[60vh] w-full rounded-xl border border-zinc-200 bg-black object-contain dark:border-zinc-800"
                />
              )}
              <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {s.durationLabel}: {formatTime(result.durationSec)} · {s.sizeLabel}: {formatSize(result.size)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <a href={result.url} download="recording.webm">
                    <Download className="h-4 w-4" aria-hidden />
                    {s.download}
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    try {
                      discard();
                      if (mode) start(mode);
                    } catch {
                      toast.error(s.startFailed);
                    }
                  }}
                >
                  {s.recordNew}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
