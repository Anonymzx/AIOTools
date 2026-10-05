"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Zap,
  Search,
  FileImage,
  Repeat,
  Files,
  FileOutput,
  CaseSensitive,
  QrCode,
  Braces,
  Hash,
  Wrench,
  ChevronsLeft,
  ChevronsRight,
  Image,
  FileText,
  Type,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { categories, tools } from "@/lib/tools-config";
import SearchCommand from "./SearchCommand";

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
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Image,
  FileText,
  Type,
  Code2,
};

const STORAGE_KEY = "aiotools-sidebar-collapsed";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isControlled = props.collapsed !== undefined;
  const collapsed = isControlled ? (props.collapsed as boolean) : internalCollapsed;

  const toggle = () => {
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    props.onToggle?.();
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // storage unavailable — ignore
    }
  };

  useEffect(() => {
    if (isControlled) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setInternalCollapsed(true);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label="Sidebar navigasi"
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-3 dark:border-zinc-800">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          aria-label="AIOTools beranda"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" aria-hidden />
          </span>
          {!collapsed && (
            <span className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50">
              AIOTools
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronsLeft className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      {/* Search trigger */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 shadow-sm hover:border-indigo-300 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:border-indigo-700 dark:hover:text-zinc-200",
            collapsed && "justify-center px-0",
          )}
          aria-label="Cari tools (Ctrl+K)"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && <span className="flex-1 text-left">Cari tools...</span>}
          {!collapsed && (
            <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Daftar tools">
        {categories.map((cat) => {
          const CatIcon = CATEGORY_ICONS[cat.icon] ?? Wrench;
          const catTools = tools.filter((t) => t.category === cat.id);
          return (
            <div key={cat.id} className="mt-3 first:mt-1">
              {!collapsed && (
                <p className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  <CatIcon className="h-3.5 w-3.5" aria-hidden />
                  {cat.name}
                </p>
              )}
              {collapsed && <CatIcon className="mx-auto mb-1 h-4 w-4 text-zinc-300 dark:text-zinc-600" aria-hidden />}
              <ul className="space-y-0.5">
                {catTools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.icon] ?? Wrench;
                  const href = `/tools/${tool.slug}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={href}
                        title={collapsed ? tool.title : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {!collapsed && <span className="truncate">{tool.title}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Version caption */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <p
          className={cn(
            "text-[11px] text-zinc-400 dark:text-zinc-500",
            collapsed ? "text-center" : "",
          )}
        >
          {collapsed ? "v0.1" : "v0.1.0 Fase 1"}
        </p>
      </div>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </aside>
  );
}

export { Sidebar };
