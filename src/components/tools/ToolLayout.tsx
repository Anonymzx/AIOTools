"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/store";
import {
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
  Link,
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
  ShieldCheck,
  Globe,
} from "lucide-react";

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
  Link,
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
  ShieldCheck,
  Globe,
};

const SEO_CATEGORY_BY_PREFIX: Record<string, string> = {
  image: "MultimediaApplication",
  media: "MultimediaApplication",
  pdf: "UtilitiesApplication",
  text: "UtilitiesApplication",
  developer: "DeveloperApplication",
  files: "UtilitiesApplication",
  productivity: "UtilitiesApplication",
};

export interface FaqItem {
  en: { q: string; a: string };
  id: { q: string; a: string };
}

interface ToolLayoutProps {
  title: string;
  description: string;
  descriptionId?: string;
  iconName: string;
  slug: string;
  faq: FaqItem[];
  children: React.ReactNode;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function ToolLayout({
  title,
  description,
  descriptionId,
  iconName,
  slug,
  faq,
  children,
}: ToolLayoutProps) {
  const { locale, t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Icon = TOOL_ICONS[iconName] ?? Wrench;
  const descText = locale === "id" && descriptionId ? descriptionId : description;

  // Client-side SEO: title + canonical + SoftwareApplication JSON-LD.
  // Covers every tool page without touching tool pages. No-op when slug is absent.
  useEffect(() => {
    try {
      if (typeof window === "undefined" || !slug) return;
      document.title = `${title} | AIOTools`;
      const canonical = `${window.location.origin}/tools/${slug}`;

      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;

      const prefix = slug.split("/")[0] ?? "";
      const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: title,
        applicationCategory: SEO_CATEGORY_BY_PREFIX[prefix] ?? "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        url: canonical,
        description: descText,
      };
      let script = document.querySelector<HTMLScriptElement>(
        'script[data-toollayout-jsonld="true"]',
      );
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-toollayout-jsonld", "true");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);

      // FAQPage JSON-LD alongside SoftwareApplication (same slug guard above).
      // No-op (removes stale tag) when the tool has no FAQ items.
      try {
        const existingFaq = document.querySelector<HTMLScriptElement>(
          'script[data-toollayout-faqjsonld="true"]',
        );
        if (faq.length === 0) {
          existingFaq?.remove();
        } else {
          let faqScript = existingFaq;
          if (!faqScript) {
            faqScript = document.createElement("script");
            faqScript.type = "application/ld+json";
            faqScript.setAttribute("data-toollayout-faqjsonld", "true");
            document.head.appendChild(faqScript);
          }
          faqScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => {
              const text = locale === "id" ? item.id : item.en;
              return {
                "@type": "Question",
                name: text.q,
                acceptedAnswer: { "@type": "Answer", text: text.a },
              };
            }),
          });
        }
      } catch {
        // FAQ schema must never break the tool UI; fail silently.
      }
    } catch {
      // SEO head injection must never break the tool UI; fail silently.
    }
  }, [title, slug, descText, faq, locale]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
          {descText}
        </p>
      </motion.div>

      {/* Tool area */}
      <motion.div
        variants={itemVariants}
        className="mt-6"
      >
        {children}
      </motion.div>

      {/* FAQ */}
      {faq.length > 0 && (
        <section aria-label={t.toollayout.faqTitle} className="mt-10">
          <h2 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-50">
            {t.toollayout.faqTitle}
          </h2>
          <div className="mt-4 space-y-2">
            {faq.map((item, i) => {
              const open = openIndex === i;
              const text = locale === "id" ? item.id : item.en;
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 dark:text-zinc-100"
                  >
                    <span className="min-w-0 flex-1">{text.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="flex shrink-0"
                      aria-hidden
                    >
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                          {text.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
}

export { ToolLayout };
