"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import { Search, CornerDownLeft } from "lucide-react";
import { categories, searchTools } from "@/lib/tools-config";

interface SearchCommandProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  const results = useMemo(() => searchTools(query), [query]);
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
        aria-label="Search tools"
      >
        <Command label="Search tools" className="w-full">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Cari tools… (mis. compress, qr, json)"
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
                Ketik untuk mencari tools...
              </p>
            )}
            {hasQuery && results.length === 0 && (
              <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Tidak ada tools yang cocok untuk &ldquo;{query}&rdquo;.
              </Command.Empty>
            )}
            {grouped.map((group) => (
              <Command.Group
                key={group.category.id}
                heading={group.category.name}
                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {group.items.map((tool) => (
                  <Command.Item
                    key={tool.slug}
                    value={`${tool.title} ${tool.description} ${tool.slug}`}
                    onSelect={() => navigate(tool.slug)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm",
                      "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                      "aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="truncate font-medium">{tool.title}</span>
                      <span className="hidden truncate text-xs text-zinc-400 sm:inline">
                        /tools/{tool.slug}
                      </span>
                    </span>
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            <span>{results.length} tools</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 px-1 dark:border-zinc-700">↵</kbd>
              untuk membuka
              <span className="mx-1">•</span>
              <kbd className="rounded border border-zinc-200 px-1 dark:border-zinc-700">Esc</kbd>
              untuk tutup
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

export { SearchCommand };
