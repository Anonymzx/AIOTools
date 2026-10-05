"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, Share2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const isDark = mounted ? resolvedTheme === "dark" || theme === "dark" : false;

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Tautan disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin tautan.");
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
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu navigasi"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1 text-sm">
            {segments.length === 0 ? (
              <li className="truncate font-medium text-zinc-900 dark:text-zinc-100">Beranda</li>
            ) : (
              <>
                <li className="shrink-0">
                  <Link
                    href="/"
                    className="rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-zinc-200"
                  >
                    Beranda
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
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className="rounded-lg p-2 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {!mounted ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : isDark ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className={cn(
              "hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm",
              "hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:inline-flex",
              "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300",
            )}
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            Bagikan
          </button>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="h-3 w-3" aria-hidden />
            Pro
          </span>
        </div>
      </div>
    </header>
  );
}

export { Header };
