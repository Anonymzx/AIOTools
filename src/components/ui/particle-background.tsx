"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const DOT_COUNT = 70;
const MAX_DPR = 1.5;
// indigo-500 / emerald-500 at alpha .25
const COLORS = ["rgba(99,102,241,0.25)", "rgba(16,185,129,0.25)"];

type Dot = { x: number; y: number; vx: number; vy: number; r: number; c: string };

function makeDots(w: number, h: number): Dot[] {
  return Array.from({ length: DOT_COUNT }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.36,
    vy: (Math.random() - 0.5) * 0.36,
    r: 1 + Math.random() * 1.2,
    c: COLORS[i % COLORS.length],
  }));
}

/**
 * Lightweight canvas particle field (~70 slow-drifting dots, wrap-around).
 * Mobile-safe: renders nothing on <sm screens, reduced-motion, or DPR < 1.
 * Perf: DPR capped at 1.5, transform-free 2D arcs (no shadowBlur, no links),
 * rAF loop paused offscreen via IntersectionObserver + tab-hidden.
 */
export default function ParticleBackground({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    // Mobile / a11y guards: <sm, reduced motion, very low DPR
    if (window.innerWidth < 640) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((window.devicePixelRatio || 1) < 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let raf = 0;
    let running = true;
    let visible = true;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = makeDots(w, h);
    };

    const tick = () => {
      if (!running || !visible || document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -4) d.x = w + 4;
        else if (d.x > w + 4) d.x = -4;
        if (d.y < -4) d.y = h + 4;
        else if (d.y > h + 4) d.y = -4;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.c;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    const onVis = () => {
      // rAF loop self-throttles via document.hidden check; nothing to do
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", resize);

    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 hidden overflow-hidden sm:block", className)}
    >
      <canvas ref={canvasRef} className="h-full w-full opacity-60 dark:opacity-40" />
    </div>
  );
}
