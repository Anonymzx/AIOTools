"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    modeStopwatch: string;
    modeCountdown: string;
    start: string;
    pause: string;
    resume: string;
    reset: string;
    lap: string;
    cdMin: string;
    cdSec: string;
    setCountdown: string;
    laps: string;
    lapCol: string;
    totalCol: string;
    deltaCol: string;
    fastest: string;
    slowest: string;
    noLaps: string;
    finished: string;
    resetOk: string;
    invalidCd: string;
    error: string;
  }
> = {
  en: {
    title: "Stopwatch & Countdown",
    description:
      "Precise stopwatch with centisecond display, lap splits with fastest/slowest highlights, plus a countdown mode with sound alert. 100% in your browser.",
    modeStopwatch: "Stopwatch",
    modeCountdown: "Countdown",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    lap: "Lap",
    cdMin: "Minutes",
    cdSec: "Seconds",
    setCountdown: "Set",
    laps: "Laps",
    lapCol: "#",
    totalCol: "Total",
    deltaCol: "Split",
    fastest: "Fastest",
    slowest: "Slowest",
    noLaps: "No laps yet — press Lap while running.",
    finished: "Time's up!",
    resetOk: "Timer reset.",
    invalidCd: "Enter a countdown duration greater than 0 seconds.",
    error: "Something went wrong.",
  },
  id: {
    title: "Stopwatch & Hitung Mundur",
    description:
      "Stopwatch presisi dengan tampilan centisecond, split lap dengan penanda tercepat/terlambat, plus mode hitung mundur dengan bunyi. 100% di browser.",
    modeStopwatch: "Stopwatch",
    modeCountdown: "Hitung mundur",
    start: "Mulai",
    pause: "Jeda",
    resume: "Lanjut",
    reset: "Atur ulang",
    lap: "Putaran",
    cdMin: "Menit",
    cdSec: "Detik",
    setCountdown: "Atur",
    laps: "Putaran",
    lapCol: "#",
    totalCol: "Total",
    deltaCol: "Split",
    fastest: "Tercepat",
    slowest: "Terlambat",
    noLaps: "Belum ada putaran — tekan Putaran saat berjalan.",
    finished: "Waktu habis!",
    resetOk: "Timer diatur ulang.",
    invalidCd: "Masukkan durasi hitung mundur lebih dari 0 detik.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How precise is the stopwatch?",
      a: "The display updates every 10ms (centiseconds) and elapsed time is computed from wall-clock timestamps, so pausing, tab switches, or slow frames don't accumulate drift.",
    },
    id: {
      q: "Seberapa presisi stopwatch ini?",
      a: "Tampilan diperbarui tiap 10ms (centisecond) dan waktu dihitung dari timestamp jam dinding, sehingga jeda, pindah tab, atau frame lambat tidak menumpuk drift.",
    },
  },
  {
    en: {
      q: "What do fastest/slowest lap highlights mean?",
      a: "Each lap's split (delta since the previous lap) is compared: the shortest split gets the green fastest badge and the longest gets the red slowest badge.",
    },
    id: {
      q: "Apa arti penanda lap tercepat/terlambat?",
      a: "Setiap split lap (selisih sejak lap sebelumnya) dibandingkan: split terpendek mendapat badge hijau tercepat dan terpanjang mendapat badge merah terlambat.",
    },
  },
  {
    en: {
      q: "Is any timing data uploaded?",
      a: "No. Elapsed time, laps, and countdown settings live only in this page's memory. Nothing leaves your browser.",
    },
    id: {
      q: "Apakah data waktu diunggah?",
      a: "Tidak. Waktu tempuh, lap, dan pengaturan hitung mundur hanya ada di memori halaman ini. Tidak ada yang keluar dari browser Anda.",
    },
  },
];

interface Lap {
  total: number;
  delta: number;
}

function formatTime(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const m = Math.floor(clamped / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const cs = Math.floor((clamped % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function beep(ctx: AudioContext): void {
  try {
    for (let k = 0; k < 3; k += 1) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + k * 0.25;
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.22);
    }
  } catch {
    // sound must never break the timer
  }
}

type Mode = "stopwatch" | "countdown";

export default function StopwatchPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [cdMin, setCdMin] = useState(1);
  const [cdSec, setCdSec] = useState(0);
  const [cdTarget, setCdTarget] = useState(60000);
  const accRef = useRef(0);
  const startRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const firedRef = useRef(false);

  const unlockAudio = (): void => {
    try {
      if (!audioRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return;
        audioRef.current = new Ctor();
      }
      if (audioRef.current.state === "suspended") {
        void audioRef.current.resume();
      }
    } catch {
      // ignore — beep is best-effort
    }
  };

  // 10ms ticker — interval only inside effect, always cleaned up.
  useEffect(() => {
    if (!running) return undefined;
    try {
      const id = window.setInterval(() => {
        try {
          const now = performance.now();
          const cur = accRef.current + (now - startRef.current);
          if (mode === "countdown") {
            const remain = cdTarget - cur;
            if (remain <= 0) {
              window.clearInterval(id);
              accRef.current = cdTarget;
              setElapsed(cdTarget);
              setRunning(false);
              setPaused(false);
              if (!firedRef.current) {
                firedRef.current = true;
                if (audioRef.current) beep(audioRef.current);
                toast.success(s.finished);
              }
              return;
            }
            setElapsed(cur);
          } else {
            setElapsed(cur);
          }
        } catch {
          // ignore tick errors
        }
      }, 10);
      return () => window.clearInterval(id);
    } catch {
      return undefined;
    }
  }, [running, mode, cdTarget, s.finished]);

  const handleStart = (): void => {
    try {
      unlockAudio();
      if (mode === "countdown") {
        const total = Math.max(0, cdMin) * 60000 + Math.max(0, cdSec) * 1000;
        if (total <= 0) {
          toast.error(s.invalidCd);
          return;
        }
        setCdTarget(total);
      } else {
        setCdTarget(0);
      }
      firedRef.current = false;
      accRef.current = paused ? accRef.current : 0;
      if (!paused) setElapsed(0);
      startRef.current = performance.now();
      setPaused(false);
      setRunning(true);
    } catch {
      toast.error(s.error);
    }
  };

  const handlePause = (): void => {
    try {
      accRef.current += performance.now() - startRef.current;
      setElapsed(accRef.current);
      setRunning(false);
      setPaused(true);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setRunning(false);
      setPaused(false);
      accRef.current = 0;
      setElapsed(0);
      setLaps([]);
      firedRef.current = false;
      toast.success(s.resetOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleLap = (): void => {
    try {
      const total = elapsed;
      setLaps((prev) => {
        const prevTotal = prev.length > 0 ? (prev[prev.length - 1] as Lap).total : 0;
        return [...prev, { total, delta: total - prevTotal }];
      });
    } catch {
      toast.error(s.error);
    }
  };

  const handleSetCountdown = (): void => {
    try {
      const total = Math.max(0, Math.floor(cdMin)) * 60000 + Math.max(0, Math.floor(cdSec)) * 1000;
      if (total <= 0) {
        toast.error(s.invalidCd);
        return;
      }
      setCdTarget(total);
      setRunning(false);
      setPaused(false);
      accRef.current = 0;
      setElapsed(0);
      firedRef.current = false;
    } catch {
      toast.error(s.error);
    }
  };

  // Deterministic display: countdown shows remaining, stopwatch shows elapsed.
  const displayMs = mode === "countdown" ? Math.max(0, cdTarget - elapsed) : elapsed;

  let fastestIdx = -1;
  let slowestIdx = -1;
  if (laps.length >= 2) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < laps.length; i += 1) {
      const d = (laps[i] as Lap).delta;
      if (d < min) {
        min = d;
        fastestIdx = i;
      }
      if (d > max) {
        max = d;
        slowestIdx = i;
      }
    }
    if (min === max) slowestIdx = -1;
  }

  const numCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";
  const labelCls = "text-xs font-semibold text-zinc-600 dark:text-zinc-300";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Clock"
      slug="productivity/stopwatch"
      faq={FAQ}
    >
      <div className="space-y-4">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant={mode === "stopwatch" ? "default" : "outline"}
            onClick={() => {
              try {
                setRunning(false);
                setPaused(false);
                accRef.current = 0;
                setElapsed(0);
                setLaps([]);
                setMode("stopwatch");
              } catch {
                toast.error(s.error);
              }
            }}
          >
            {s.modeStopwatch}
          </Button>
          <Button
            size="sm"
            variant={mode === "countdown" ? "default" : "outline"}
            onClick={() => {
              try {
                setRunning(false);
                setPaused(false);
                accRef.current = 0;
                setElapsed(0);
                setLaps([]);
                setMode("countdown");
              } catch {
                toast.error(s.error);
              }
            }}
          >
            {s.modeCountdown}
          </Button>
        </div>

        {mode === "countdown" && !running && !paused && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="flex flex-wrap items-end gap-3 p-4 sm:p-6">
              <div className="space-y-1.5">
                <label htmlFor="sw-cdmin" className={labelCls}>
                  {s.cdMin}
                </label>
                <input
                  id="sw-cdmin"
                  type="number"
                  min={0}
                  max={999}
                  value={cdMin}
                  onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setCdMin(Number.isFinite(v) ? Math.min(999, Math.max(0, Math.floor(v))) : 0);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={numCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sw-cdsec" className={labelCls}>
                  {s.cdSec}
                </label>
                <input
                  id="sw-cdsec"
                  type="number"
                  min={0}
                  max={59}
                  value={cdSec}
                  onChange={(e) => {
                    try {
                      const v = Number(e.target.value);
                      setCdSec(Number.isFinite(v) ? Math.min(59, Math.max(0, Math.floor(v))) : 0);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={numCls}
                />
              </div>
              <Button size="sm" variant="outline" onClick={handleSetCountdown}>
                {s.setCountdown}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="flex flex-col items-center gap-4 p-4 sm:p-6">
            <span
              aria-live="polite"
              className="font-mono text-5xl font-extrabold tabular-nums tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50"
            >
              {formatTime(displayMs)}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!running && !paused && (
                <Button onClick={handleStart} className="min-w-24">
                  {s.start}
                </Button>
              )}
              {running && <Button onClick={handlePause}>{s.pause}</Button>}
              {paused && !running && (
                <Button onClick={handleStart} className="min-w-24">
                  {s.resume}
                </Button>
              )}
              {(running || paused) && (
                <Button variant="outline" onClick={handleReset}>
                  {s.reset}
                </Button>
              )}
              {mode === "stopwatch" && running && (
                <Button variant="secondary" onClick={handleLap}>
                  {s.lap}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {mode === "stopwatch" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {s.laps} ({laps.length})
              </h2>
              {laps.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">{s.noLaps}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm tabular-nums">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        <th className="py-1 pr-2 font-medium">{s.lapCol}</th>
                        <th className="py-1 pr-2 font-medium">{s.totalCol}</th>
                        <th className="py-1 pr-2 font-medium">{s.deltaCol}</th>
                        <th className="py-1 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {laps.map((lap, i) => (
                        <tr
                          key={i}
                          className="border-t border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                        >
                          <td className="py-1.5 pr-2">{i + 1}</td>
                          <td className="py-1.5 pr-2 font-mono">{formatTime(lap.total)}</td>
                          <td className="py-1.5 pr-2 font-mono">{formatTime(lap.delta)}</td>
                          <td className="py-1.5">
                            {i === fastestIdx && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {s.fastest}
                              </span>
                            )}
                            {i === slowestIdx && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                                {s.slowest}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
