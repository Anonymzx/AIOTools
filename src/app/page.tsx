"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { MotionConfig, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  FileImage,
  Repeat,
  Files,
  FileOutput,
  CaseSensitive,
  QrCode,
  Braces,
  Hash,
  Regex,
  KeyRound,
  Scissors,
  Eraser,
  Lock,
  AlignLeft,
  RotateCw,
  Stamp,
  Crop,
  Video,
  Images,
  Binary,
  Layers,
  ListOrdered,
  LockOpen,
  FileType,
  Scaling,
  RefreshCcw,
  Circle,
  LayoutGrid,
  PenLine,
  Clapperboard,
  Film,
  Package,
  PackageOpen,
  Barcode,
  Archive,
  ScanLine,
  Tags,
  Signature,
  EyeOff,
  Droplets,
  GitCompare,
  FileCode,
  ScanText,
  Info,
  Wrench,
  Calculator,
  CalendarDays,
  Cake,
  Gauge,
  Landmark,
  Percent,
  Receipt,
  BadgePercent,
  Globe2,
  Clock,
  Fingerprint,
  WholeWord,
  FileCode2,
  FileDown,
  FileJson2,
  Database,
  FileCog,
  Table,
  TableProperties,
  Link2,
  Link as LinkIcon,
  ListX,
  ArrowDownAZ,
  Replace,
  AppWindow,
  Share2,
  Laugh,
  PaintBucket,
  Square,
  Columns3,
  Camera,
  Sparkles,
  Languages,
  FileAudio,
  FileVideo,
  MonitorPlay,
  Timer,
  Keyboard,
  AlarmClock,
  Dices,
  Sigma,
  ChartLine,
  Network,
  Globe,
  Palette,
  Image,
  FileText,
  Type,
  Code2,
  ShieldCheck,
  Zap,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";
import {
  categories,
  tools,
  getCategoryName,
  getCategoryDescription,
  getToolDescription,
} from "@/lib/tools-config";
import { useLocale } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";
import { useMagnetic } from "@/hooks/use-magnetic";
import { TiltCard } from "@/components/ui/tilt-card";
import { Marquee } from "@/components/ui/marquee";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const ParticleBackground = dynamic(() => import("@/components/ui/particle-background"), {
  ssr: false,
});

const TOOL_ICONS: Record<string, LucideIcon> = {
  FileImage,
  Repeat,
  RefreshCw: Repeat,
  Files,
  FileOutput,
  CaseSensitive,
  QrCode,
  Braces,
  Hash,
  Regex,
  KeyRound,
  Scissors,
  Eraser,
  Lock,
  AlignLeft,
  RotateCw,
  Stamp,
  Crop,
  Video,
  Images,
  Binary,
  Layers,
  ListOrdered,
  LockOpen,
  FileType,
  Scaling,
  RefreshCcw,
  Circle,
  LayoutGrid,
  PenLine,
  Clapperboard,
  Film,
  Package,
  PackageOpen,
  Barcode,
  Archive,
  ScanLine,
  Tags,
  Signature,
  EyeOff,
  Droplets,
  GitCompare,
  FileCode,
  ScanText,
  Info,
  Calculator,
  CalendarDays,
  Cake,
  Gauge,
  Landmark,
  Percent,
  Receipt,
  BadgePercent,
  Globe2,
  Clock,
  Fingerprint,
  WholeWord,
  FileCode2,
  FileDown,
  FileJson2,
  Database,
  FileCog,
  Table,
  TableProperties,
  Link2,
  Link: LinkIcon,
  Code2,
  ListX,
  ArrowDownAZ,
  Replace,
  AppWindow,
  Share2,
  Laugh,
  Type,
  Palette,
  PaintBucket,
  Square,
  Columns3,
  Camera,
  Sparkles,
  Languages,
  FileAudio,
  FileVideo,
  MonitorPlay,
  Timer,
  Keyboard,
  AlarmClock,
  Dices,
  Sigma,
  ChartLine,
  Network,
  Globe,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Image,
  FileText,
  Type,
  Code2,
  Archive: Archive,
  Calculator,
  Palette,
  MonitorPlay,
  Timer,
};

// --- Motion presets (transform/opacity only, 60fps) ---
const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: "60%" },
  show: { opacity: 1, y: "0%", transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Inline TextReveal fallback (same API as @/components/ui/text-reveal):
 * word-by-word stagger reveal; last `gradientWords` rendered as animated
 * indigo→purple→emerald gradient text (backgroundPosition animation).
 * NOTE: used because text-reveal.tsx was absent at write time (parallel agent
 * owns it). Swap the import below when it lands; this keeps `tsc` green.
 */
function TextReveal({
  text,
  className,
  gradientWords = 0,
}: {
  text: string;
  className?: string;
  gradientWords?: number;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      variants={wordContainer}
      initial="hidden"
      animate="show"
      aria-label={text}
    >
      {words.map((w, i) => {
        const isGradient = gradientWords > 0 && i >= words.length - gradientWords;
        return (
          <span key={`${w}-${i}`}>
            <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
              <motion.span variants={wordReveal} aria-hidden className="inline-block will-change-transform">
                {isGradient ? (
                  <motion.span
                    className="inline-block bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 bg-[length:200%_auto] bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400"
                    animate={{ backgroundPosition: ["0% center", "200% center"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    {w}
                  </motion.span>
                ) : (
                  w
                )}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </motion.span>
  );
}

export default function Home() {
  const { locale, t } = useLocale();
  const L = t.landing;
  const ctaPrimaryMag = useMagnetic<HTMLSpanElement>(0.3);
  const ctaSecondaryMag = useMagnetic<HTMLSpanElement>(0.3);

  const stats = [
    { value: String(tools.length), label: L.statsTools },
    { value: String(categories.length), label: L.statsCategories },
    { value: "0%", label: L.statsPrivate },
  ];

  const steps = [
    { step: "1", title: L.step1Title, desc: L.step1Desc },
    { step: "2", title: L.step2Title, desc: L.step2Desc },
    { step: "3", title: L.step3Title, desc: L.step3Desc },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-zinc-50 dark:bg-zinc-950">
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <ParticleBackground />
          <div className="relative mx-auto max-w-2xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {L.badge}
            </motion.span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              <TextReveal text={L.heroTitle} gradientWords={1} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
              className="mt-4 text-base leading-relaxed text-zinc-500 sm:text-lg dark:text-zinc-400"
            >
              {L.heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
              className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
            >
              <motion.span
                ref={ctaPrimaryMag.ref}
                style={{ x: ctaPrimaryMag.x, y: ctaPrimaryMag.y }}
                className="inline-block w-full sm:w-auto"
              >
                <Link
                  href="#kategori"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-zinc-950"
                >
                  {L.exploreTools}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.span>
              <motion.span
                ref={ctaSecondaryMag.ref}
                style={{ x: ctaSecondaryMag.x, y: ctaSecondaryMag.y }}
                className="inline-block w-full sm:w-auto"
              >
                <Link
                  href="#cara-kerja"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
                >
                  <MousePointerClick className="h-4 w-4" aria-hidden />
                  {L.howItWorks}
                </Link>
              </motion.span>
            </motion.div>

            {/* Stats */}
            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2"
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <dt className="order-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.label}</dt>
                  <dd className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{s.value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* Tool marquee band */}
        <section
          aria-label="All tools"
          className="border-y border-zinc-200 bg-white/60 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <Marquee items={tools.map((t) => t.title)} />
        </section>

        {/* Category grid */}
        <section id="kategori" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 sm:px-6">
          <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {L.browseByCategory}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{L.browseSubtitle}</p>
          <motion.div
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-64px" }}
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] ?? Wrench;
              const catTools = tools.filter((t) => t.category === cat.id);
              return (
                <motion.div key={cat.id} variants={gridItem}>
                  <TiltCard className="h-full">
                    <div className="h-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        {getCategoryName(cat, locale)}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {catTools.length} {L.toolsCountSuffix} • {getCategoryDescription(cat, locale)}
                      </p>
                      <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                        {catTools.map((t) => (
                          <li key={t.slug}>
                            <Link
                              href={`/tools/${t.slug}`}
                              className="group flex items-center justify-between rounded-lg text-sm text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                            >
                              <span className="truncate">{t.title}</span>
                              <ArrowRight
                                className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-zinc-600"
                                aria-hidden
                              />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Featured tools grid */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {L.popularTools}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{L.popularSubtitle}</p>
          <motion.div
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-64px" }}
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {tools.map((tool) => {
              const Icon = TOOL_ICONS[tool.icon] ?? Wrench;
              return (
                <motion.div key={tool.slug} variants={gridItem}>
                  <SpotlightCard className="h-full">
                  <TiltCard className="h-full">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className={cn(
                        "group block h-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors",
                        "hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600",
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="mt-3 flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                          {tool.title}
                        </span>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-zinc-600"
                          aria-hidden
                        />
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {getToolDescription(tool, locale)}
                      </span>
                    </Link>
                  </TiltCard>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* How it works + privacy */}
        <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-50">
                  {L.privacyTitle}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {L.privacySubtitle}
                </p>
              </div>
            </div>
            <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {steps.map((s) => (
                <li
                  key={s.step}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    {s.step}
                  </span>
                  <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                  <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="h-8" />
      </div>
    </MotionConfig>
  );
}
