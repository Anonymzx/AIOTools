"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import {
  Search,
  CornerDownLeft,
  Moon,
  Sun,
  Languages,
  Share2,
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import { categories, searchTools, getCategoryName, getToolDescription } from "@/lib/tools-config";
import { useLocale } from "@/lib/i18n/store";
import { CLEAR_EVENT, PASTE_EVENT } from "@/hooks/useToolClipboard";

interface SearchCommandProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { setTheme, resolvedTheme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isId = locale === "id";

  const isControlled = open !== undefined;
  const isOpen = isControlled ? (open as boolean) : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
      if (!next) setQuery("");
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null;
        const tag = el?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  const results = useMemo(() => searchTools(query, locale), [query, locale]);
  const hasQuery = query.trim().length > 0;

  const grouped = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: results.filter((t) => t.category === cat.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  const navigate = useCallback(
    (slug: string) => {
      try {
        setOpen(false);
        router.push(`/tools/${slug}`);
      } catch {
        setOpen(false);
      }
    },
    [router, setOpen],
  );

  const runAction = useCallback(
    (fn: () => void) => {
      try {
        fn();
      } catch {
        toast.error(isId ? "Aksi gagal dijalankan." : "Action failed.");
      } finally {
        setOpen(false);
      }
    },
    [isId, setOpen],
  );

  const toggleTheme = useCallback(() => {
    try {
      const next = resolvedTheme === "dark" ? "light" : "dark";
      setTheme(next);
      toast.success(
        isId
          ? next === "dark"
            ? "Mode gelap aktif."
            : "Mode terang aktif."
          : next === "dark"
            ? "Dark mode on."
            : "Light mode on.",
      );
    } catch {
      toast.error(isId ? "Gagal mengganti tema." : "Failed to switch theme.");
    }
  }, [isId, resolvedTheme, setTheme]);

  const toggleLocale = useCallback(() => {
    try {
      const next = isId ? "en" : "id";
      setLocale(next);
      toast.success(next === "id" ? "Bahasa: Bahasa Indonesia." : "Language: English.");
    } catch {
      toast.error(isId ? "Gagal mengganti bahasa." : "Failed to switch language.");
    }
  }, [isId, setLocale]);

  const sharePage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(isId ? "Tautan halaman disalin." : "Page link copied to clipboard.");
    } catch {
      toast.error(isId ? "Gagal menyalin tautan." : "Failed to copy page link.");
    }
  }, [isId]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      window.dispatchEvent(new CustomEvent(PASTE_EVENT, { detail: { text } }));
      toast.success(isId ? "Teks ditempel ke tool." : "Pasted into the current tool.");
    } catch {
      toast.error(
        isId
          ? "Gagal membaca clipboard. Izinkan akses clipboard di browser."
          : "Could not read clipboard. Allow clipboard access in your browser.",
      );
    }
  }, [isId]);

  const clearInputs = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent(CLEAR_EVENT));
      toast.success(isId ? "Semua masukan dihapus." : "All inputs cleared.");
    } catch {
      toast.error(isId ? "Gagal menghapus masukan." : "Failed to clear inputs.");
    }
  }, [isId]);

  const isDark = resolvedTheme === "dark";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/50 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.search.title}
      >
        <Command label={t.search.title} className="w-full">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={t.search.placeholder}
              className="h-12 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) {
                  e.preventDefault();
                  navigate(results[0].slug);
                }
              }}
            />
            <kbd className="hidden shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline-block dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            {!hasQuery && (
              <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t.search.typeToSearch}
              </p>
            )}
            {hasQuery && results.length === 0 && (
              <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t.search.noResults} &ldquo;{query}&rdquo;.
              </Command.Empty>
            )}
            {grouped.map((group) => (
              <Command.Group
                key={group.category.id}
                heading={getCategoryName(group.category, locale)}
                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {group.items.map((tool) => (
                  <Command.Item
                    key={tool.slug}
                    value={`${tool.title} ${tool.description} ${tool.descriptionId} ${tool.slug}`}
                    onSelect={() => navigate(tool.slug)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm",
                      "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                      "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                    )}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{tool.title}</span>
                      <span className="truncate text-xs text-zinc-400">
                        {getToolDescription(tool, locale)}
                      </span>
                    </span>
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            <Command.Group
              heading={isId ? "Aksi" : "Actions"}
              className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              <Command.Item
                value="toggle dark light mode theme tema gelap terang"
                onSelect={() => runAction(toggleTheme)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                )}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                ) : (
                  <Moon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                )}
                <span className="truncate font-medium">
                  {isId
                    ? isDark
                      ? "Ganti ke Mode Terang"
                      : "Ganti ke Mode Gelap"
                    : isDark
                      ? "Switch to Light Mode"
                      : "Switch to Dark Mode"}
                </span>
              </Command.Item>
              <Command.Item
                value="switch language english bahasa indonesia ganti"
                onSelect={() => runAction(toggleLocale)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                )}
              >
                <Languages className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="truncate font-medium">
                  {isId ? "Ganti Bahasa: English" : "Switch Language: Bahasa"}
                </span>
              </Command.Item>
              <Command.Item
                value="share this page copy link bagikan salin tautan"
                onSelect={() => runAction(() => void sharePage())}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                )}
              >
                <Share2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="truncate font-medium">
                  {isId ? "Bagikan Halaman Ini" : "Share This Page"}
                </span>
              </Command.Item>
              <Command.Item
                value="paste from clipboard tempel papan klip"
                onSelect={() => runAction(() => void pasteFromClipboard())}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                )}
              >
                <ClipboardPaste className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="truncate font-medium">
                  {isId ? "Tempel dari Clipboard" : "Paste from Clipboard"}
                </span>
              </Command.Item>
              <Command.Item
                value="clear all inputs reset hapus bersihkan"
                onSelect={() => runAction(clearInputs)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                )}
              >
                <Trash2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="truncate font-medium">
                  {isId ? "Hapus Semua Masukan" : "Clear All Inputs"}
                </span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            <span>
              {results.length} {t.search.toolsCount}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 px-1 dark:border-zinc-700">↵</kbd>
              {t.search.openHint}
              <span className="mx-1">•</span>
              <kbd className="rounded border border-zinc-200 px-1 dark:border-zinc-700">Esc</kbd>
              {t.search.closeHint}
              <span className="mx-1">•</span>
              <kbd className="rounded border border-zinc-200 px-1 dark:border-zinc-700">/</kbd>
              {isId ? "untuk mencari" : "to search"}
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

export { SearchCommand };
