"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronsLeft,
  ChevronsRight,
  Image,
  FileText,
  Type,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { categories, tools, getCategoryName } from "@/lib/tools-config";
import { useLocale } from "@/lib/i18n/store";
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
  ListX,
  ArrowDownAZ,
  Replace,
  AppWindow,
  Share2,
  Laugh,
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
  Type,
  Code2,
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

const STORAGE_KEY = "aiotools-sidebar-collapsed";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
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
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-300 ease-out motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label={t.sidebar.tools}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-3 dark:border-zinc-800">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          aria-label="AIOTools home"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" aria-hidden />
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="logo-label"
                className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.2 }}
              >
                AIOTools
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? t.sidebar.expand : t.sidebar.collapse}
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
          aria-label={t.sidebar.searchHint}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="search-label"
                className="flex-1 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {t.sidebar.search}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.kbd
                key="search-kbd"
                className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                ⌘K
              </motion.kbd>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Nav */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label={t.sidebar.tools}>
        {categories.map((cat) => {
          const CatIcon = CATEGORY_ICONS[cat.icon] ?? Wrench;
          const catTools = tools.filter((t) => t.category === cat.id);
          return (
            <div key={cat.id} className="mt-3 first:mt-1">
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.p
                    key={`cat-${cat.id}`}
                    className="flex items-center gap-1.5 overflow-hidden px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CatIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{getCategoryName(cat, locale)}</span>
                  </motion.p>
                )}
              </AnimatePresence>
              {collapsed && <CatIcon className="mx-auto mb-1 h-4 w-4 text-zinc-300 dark:text-zinc-600" aria-hidden />}
              <ul className="space-y-0.5">
                {catTools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.icon] ?? Wrench;
                  const href = `/tools/${tool.slug}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <motion.li
                      key={tool.slug}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={href}
                        title={collapsed ? tool.title : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-indigo-600 dark:bg-indigo-400"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            aria-hidden
                          />
                        )}
                        <motion.span
                          className="flex shrink-0 items-center justify-center"
                           whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          aria-hidden
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        </motion.span>
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              key="tool-label"
                              className="truncate"
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              {tool.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Version caption */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={collapsed ? "short" : "full"}
            className={cn(
              "text-[11px] text-zinc-400 dark:text-zinc-500",
              collapsed ? "text-center" : "",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {collapsed ? "v0.2" : t.sidebar.version}
          </motion.p>
        </AnimatePresence>
      </div>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </aside>
  );
}

export { Sidebar };
