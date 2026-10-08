"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, Share2, Sparkles, ChevronRight, Globe, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function humanize(segment: string): string {
  try {
    const spaced = decodeURIComponent(segment).replace(/-/g, " ");
    return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return segment;
  }
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    setMounted(true);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const isDark = mounted ? resolvedTheme === "dark" || theme === "dark" : false;

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success(t.header.shareCopied);
    } catch {
      toast.error(t.header.shareFailed);
    }
  };

  const handleLocale = (next: Locale) => {
    try {
      setLocale(next);
    } catch {
      toast.error(t.common.error);
    }
  };

  const toggleTheme = () => {
    try {
      setTheme(isDark ? "light" : "dark");
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <motion.button
          type="button"
          onClick={onMenuClick}
          aria-label={t.header.menu}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </motion.button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1 text-sm">
            {segments.length === 0 ? (
              <li className="truncate font-medium text-zinc-900 dark:text-zinc-100">{t.header.home}</li>
            ) : (
              <>
                <li className="shrink-0">
                  <Link
                    href="/"
                    className="rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-zinc-200"
                  >
                    {t.header.home}
                  </Link>
                </li>
                {segments.map((seg, i) => {
                  const href = `/${segments.slice(0, i + 1).join("/")}`;
                  const isLast = i === segments.length - 1;
                  return (
                    <li key={href} className="flex min-w-0 items-center gap-1">
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden />
                      {isLast ? (
                        <span aria-current="page" className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {humanize(seg)}
                        </span>
                      ) : (
                        <Link
                          href={href}
                          className="shrink-0 rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-zinc-200"
                        >
                          {humanize(seg)}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </>
            )}
          </ol>
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                type="button"
                aria-label={t.header.language}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="inline-flex items-center gap-1 rounded-lg p-2 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Globe className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold uppercase">{locale}</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem onSelect={() => handleLocale("en")}>
                <span className="flex-1">{t.header.english}</span>
                {locale === "en" && <Check className="h-4 w-4" aria-hidden />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLocale("id")}>
                <span className="flex-1">{t.header.indonesian}</span>
                {locale === "id" && <Check className="h-4 w-4" aria-hidden />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <motion.button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t.header.enableLight : t.header.enableDark}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-lg p-2 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <AnimatePresence mode="wait" initial={false}>
          <motion.span
                key={!mounted ? "ssr-sun" : isDark ? "sun" : "moon"}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                {!mounted ? (
                  <Sun className="h-4 w-4" aria-hidden />
                ) : isDark ? (
                  <Sun className="h-4 w-4" aria-hidden />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            onClick={handleShare}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm",
              "hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:inline-flex",
              "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300",
            )}
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            {t.header.share}
          </motion.button>

          <motion.span
            initial={false}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            {t.header.pro}
          </motion.span>
        </div>
      </div>
    </header>
  );
}

export { Header };
