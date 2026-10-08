"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

type Phase = "work" | "short" | "long";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    work: string;
    short: string;
    long: string;
    workMin: string;
    shortMin: string;
    longMin: string;
    cycles: string;
    cyclesHint: string;
    start: string;
    pause: string;
    reset: string;
    skip: string;
    autoNext: string;
    session: string;
    minutes: string;
    phaseDone: string;
    resetOk: string;
    error: string;
    phaseWork: string;
    phaseShort: string;
    phaseLong: string;
  }
> = {
  en: {
    title: "Pomodoro Timer",
    description:
      "Focus in sprints with a customizable Pomodoro timer — circular progress, session dots, sound alerts, and auto-start. Runs 100% in your browser.",
    work: "Focus",
    short: "Short break",
    long: "Long break",
    workMin: "Work (min)",
    shortMin: "Short break (min)",
    longMin: "Long break (min)",
    cycles: "Sessions before long break",
    cyclesHint: "After N focus sessions, take a long break.",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    skip: "Skip",
    autoNext: "Auto-start next phase",
    session: "Session",
    minutes: "min",
    phaseDone: "Phase finished — nice work!",
    resetOk: "Timer reset.",
    error: "Something went wrong.",
    phaseWork: "Focus time — you've got this.",
    phaseShort: "Short break — stretch and breathe.",
    phaseLong: "Long break — recharge fully.",
  },
  id: {
    title: "Timer Pomodoro",
    description:
      "Fokus dalam sprint dengan timer Pomodoro yang bisa dikustom — progres melingkar, titik sesi, bunyi peringatan, dan mulai-otomatis. 100% di browser.",
    work: "Fokus",
    short: "Istirahat pendek",
    long: "Istirahat panjang",
    workMin: "Kerja (mnt)",
    shortMin: "Istirahat pendek (mnt)",
    longMin: "Istirahat panjang (mnt)",
    cycles: "Sesi sebelum istirahat panjang",
    cyclesHint: "Setelah N sesi fokus, ambil istirahat panjang.",
    start: "Mulai",
    pause: "Jeda",
    reset: "Atur ulang",
    skip: "Lewati",
    autoNext: "Otomatis mulai fase berikutnya",
    session: "Sesi",
    minutes: "mnt",
    phaseDone: "Fase selesai — kerja bagus!",
    resetOk: "Timer diatur ulang.",
    error: "Terjadi kesalahan.",
    phaseWork: "Waktunya fokus — kamu bisa.",
    phaseShort: "Istirahat pendek — regangkan badan.",
    phaseLong: "Istirahat panjang — isi ulang energi.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does the Pomodoro cycle work here?",
      a: "You focus for the work duration, then take a short break. After the configured number of focus sessions (default 4), you get a long break and the session dots reset for the next round.",
    },
    id: {
      q: "Bagaimana siklus Pomodoro di sini?",
      a: "Anda fokus selama durasi kerja, lalu istirahat pendek. Setelah jumlah sesi fokus yang dikonfigurasi (default 4), Anda mendapat istirahat panjang dan titik sesi diatur ulang untuk ronde berikutnya.",
    },
  },
  {
    en: {
      q: "Will I hear a sound when a phase ends?",
      a: "Yes — a short Web Audio beep plays on every phase change. Your browser tab title also shows the live countdown, so you can track time from another tab.",
    },
    id: {
      q: "Apakah ada bunyi saat fase berakhir?",
      a: "Ya — bunyi beep Web Audio pendek berbunyi di setiap pergantian fase. Judul tab browser juga menampilkan hitung mundur live sehingga bisa dipantau dari tab lain.",
    },
  },
  {
    en: {
      q: "Is my timer data uploaded anywhere?",
      a: "No. Durations, session counts, and the countdown itself all live in this page's memory only. Nothing is sent to any server.",
    },
    id: {
      q: "Apakah data timer saya diunggah ke mana pun?",
      a: "Tidak. Durasi, jumlah sesi, dan hitung mundur hanya tersimpan di memori halaman ini. Tidak ada yang dikirim ke server mana pun.",
    },
  },
];

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function beepSequence(ctx: AudioContext): void {
  try {
    for (let k = 0; k < 2; k += 1) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + k * 0.28;
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    }
  } catch {
    // sound must never break the timer
  }
}

export default function PomodoroPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [workMin, setWorkMin] = useState(25);
  const [shortMin, setShortMin] = useState(5);
  const [longMin, setLongMin] = useState(15);
  const [cycles, setCycles] = useState(4);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(1500);
  const [running, setRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [autoNext, setAutoNext] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const firedRef = useRef("");

  const totalFor = (p: Phase): number => {
    if (p === "short") return Math.max(1, shortMin) * 60;
    if (p === "long") return Math.max(1, longMin) * 60;
    return Math.max(1, workMin) * 60;
  };
  const total = totalFor(phase);
  const progress = total > 0 ? 1 - secondsLeft / total : 0;

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

  // 1-second ticker — interval created only inside an effect, cleaned up on unmount/pause.
  useEffect(() => {
    if (!running) return undefined;
    try {
      const id = window.setInterval(() => {
        try {
          setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        } catch {
          // ignore tick errors
        }
      }, 1000);
      return () => window.clearInterval(id);
    } catch {
      return undefined;
    }
  }, [running]);

  // Phase completion watcher.
  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    const key = `${phase}-${sessionsDone}`;
    if (firedRef.current === key) return;
    firedRef.current = key;
    try {
      if (audioRef.current) beepSequence(audioRef.current);
      toast.success(s.phaseDone);
      let next: Phase = "short";
      let nextSessions = sessionsDone;
      if (phase === "work") {
        nextSessions = sessionsDone + 1;
        next = nextSessions % Math.max(1, cycles) === 0 ? "long" : "short";
      } else {
        next = "work";
        if (phase === "long") nextSessions = 0;
      }
      setSessionsDone(nextSessions);
      setPhase(next);
      setSecondsLeft(totalFor(next));
      if (!autoNext) setRunning(false);
    } catch {
      toast.error(s.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft]);

  // Live countdown in the tab title.
  useEffect(() => {
    try {
      if (!running) return undefined;
      const label =
        phase === "work" ? s.work : phase === "short" ? s.short : s.long;
      document.title = `${formatClock(secondsLeft)} · ${label} | AIOTools`;
      return () => {
        document.title = `${s.title} | AIOTools`;
      };
    } catch {
      return undefined;
    }
  }, [running, secondsLeft, phase, s.work, s.short, s.long, s.title]);

  const handleStartPause = (): void => {
    try {
      unlockAudio();
      setRunning((r) => !r);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setRunning(false);
      setPhase("work");
      setSessionsDone(0);
      setSecondsLeft(Math.max(1, workMin) * 60);
      firedRef.current = "";
      toast.success(s.resetOk);
    } catch {
      toast.error(s.error);
    }
  };

  const handleSkip = (): void => {
    try {
      unlockAudio();
      let next: Phase = "short";
      let nextSessions = sessionsDone;
      if (phase === "work") {
        nextSessions = sessionsDone + 1;
        next = nextSessions % Math.max(1, cycles) === 0 ? "long" : "short";
      } else {
        next = "work";
        if (phase === "long") nextSessions = 0;
      }
      setSessionsDone(nextSessions);
      setPhase(next);
      setSecondsLeft(totalFor(next));
    } catch {
      toast.error(s.error);
    }
  };

  const clampNum = (v: number, fallback: number): number => {
    if (!Number.isFinite(v)) return fallback;
    return Math.min(180, Math.max(1, Math.floor(v)));
  };

  const numCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:[color-scheme:dark]";
  const labelCls =
    "text-xs font-semibold text-zinc-600 dark:text-zinc-300";

  const dots: boolean[] = [];
  const dotCount = Math.max(1, cycles);
  for (let i = 0; i < dotCount; i += 1) {
    dots.push(i < sessionsDone % Math.max(1, dotCount) || (sessionsDone > 0 && sessionsDone % Math.max(1, dotCount) === 0 && i < dotCount && phase !== "work"));
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Clock"
      slug="productivity/pomodoro"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-6">
            <div className="space-y-1.5">
              <label htmlFor="pomo-work" className={labelCls}>
                {s.workMin}
              </label>
              <input
                id="pomo-work"
                type="number"
                min={1}
                max={180}
                value={workMin}
                disabled={running}
                onChange={(e) => {
                  try {
                    const v = clampNum(Number(e.target.value), 25);
                    setWorkMin(v);
                    if (phase === "work" && !running) setSecondsLeft(v * 60);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={numCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pomo-short" className={labelCls}>
                {s.shortMin}
              </label>
              <input
                id="pomo-short"
                type="number"
                min={1}
                max={180}
                value={shortMin}
                disabled={running}
                onChange={(e) => {
                  try {
                    const v = clampNum(Number(e.target.value), 5);
                    setShortMin(v);
                    if (phase === "short" && !running) setSecondsLeft(v * 60);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={numCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pomo-long" className={labelCls}>
                {s.longMin}
              </label>
              <input
                id="pomo-long"
                type="number"
                min={1}
                max={180}
                value={longMin}
                disabled={running}
                onChange={(e) => {
                  try {
                    const v = clampNum(Number(e.target.value), 15);
                    setLongMin(v);
                    if (phase === "long" && !running) setSecondsLeft(v * 60);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={numCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pomo-cycles" className={labelCls}>
                {s.cycles}
              </label>
              <input
                id="pomo-cycles"
                type="number"
                min={1}
                max={12}
                value={cycles}
                disabled={running}
                onChange={(e) => {
                  try {
                    const raw = Number(e.target.value);
                    setCycles(
                      Number.isFinite(raw)
                        ? Math.min(12, Math.max(1, Math.floor(raw)))
                        : 4,
                    );
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className={numCls}
              />
            </div>
            <p className="col-span-2 text-xs text-zinc-400 sm:col-span-4 dark:text-zinc-500">
              {s.cyclesHint}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="flex flex-col items-center gap-4 p-4 sm:p-6">
            <div className="flex gap-2" role="tablist" aria-label={s.session}>
              {(["work", "short", "long"] as Phase[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={phase === p}
                  onClick={() => {
                    try {
                      if (running) return;
                      setPhase(p);
                      setSecondsLeft(totalFor(p));
                      firedRef.current = "";
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    phase === p
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {p === "work" ? s.work : p === "short" ? s.short : s.long}
                </button>
              ))}
            </div>

            <div className="relative h-56 w-56" aria-live="polite">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-indigo-600 dark:stroke-indigo-500"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ type: "spring", stiffness: 60, damping: 20 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatClock(secondsLeft)}
                </span>
                <span className="mt-1 max-w-[12rem] text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {phase === "work"
                    ? s.phaseWork
                    : phase === "short"
                      ? s.phaseShort
                      : s.phaseLong}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5" aria-label={s.session}>
              {dots.map((filled, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    filled
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {s.session} {sessionsDone}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={handleStartPause} className="min-w-24">
                {running ? s.pause : s.start}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                {s.reset}
              </Button>
              <Button variant="ghost" onClick={handleSkip}>
                {s.skip}
              </Button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => {
                  try {
                    setAutoNext(e.target.checked);
                  } catch {
                    toast.error(s.error);
                  }
                }}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              {s.autoNext}
            </label>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
