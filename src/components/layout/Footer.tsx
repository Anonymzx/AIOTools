"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Code2, AtSign, MessageCircle, Briefcase, Coffee } from "lucide-react";
import { categories, tools, getCategoryName } from "@/lib/tools-config";
import { useLocale } from "@/lib/i18n/store";

const SOCIALS = [
  { href: "https://github.com/Anonymzx", label: "GitHub", Icon: Code2 },
  { href: "https://instagram.com/_mhmdthoriq_", label: "Instagram", Icon: AtSign },
  { href: "https://wa.me/6285892844703", label: "WhatsApp", Icon: MessageCircle },
  { href: "https://www.linkedin.com/in/mhmdthoriq/", label: "LinkedIn", Icon: Briefcase },
] as const;

const KOFI_URL = "https://ko-fi.com/anonymzx";

const LINK_CLS =
  "group relative rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={LINK_CLS}>
      {children}
      <motion.span
        aria-hidden
        initial={false}
        className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-indigo-600 transition-transform duration-200 group-hover:scale-x-100 dark:bg-indigo-400"
      />
    </Link>
  );
}

export default function Footer() {
  const { locale, t } = useLocale();

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <Zap className="h-4 w-4 text-white" aria-hidden />
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">AIOTools</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t.footer.tagline}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.footer.privacyNote}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <motion.a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </motion.a>
            ))}
          </div>
          <motion.a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:hover:bg-amber-300"
          >
            <Coffee className="h-3.5 w-3.5" aria-hidden />
            {locale === "id" ? "Dukung via Ko-fi" : "Support via Ko-fi"}
          </motion.a>
        </div>

        {/* Categories */}
        <nav aria-label={t.footer.categories}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {t.footer.categories}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((cat, i) => {
              const firstTool = tools.find((t) => t.category === cat.id);
              const href = firstTool ? `/tools/${firstTool.slug}` : "/";
              return (
                <motion.li
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ x: 3 }}
                >
                  <FooterLink href={href}>{getCategoryName(cat, locale)}</FooterLink>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Developer */}
        <nav aria-label={t.footer.developerTools}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {t.footer.developerTools}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { href: "/tools/developer/json-formatter", label: "JSON Formatter" },
              { href: "/tools/developer/hash-generator", label: "Hash Generator" },
              { href: "/tools/text/qr-generator", label: "QR Generator" },
              { href: "/", label: t.footer.allTools },
            ].map((l, i) => (
              <motion.li
                key={l.href + l.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ x: 3 }}
              >
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </motion.li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-zinc-400 sm:flex-row sm:px-6 dark:text-zinc-500">
          <p>{t.footer.rights}</p>
          <p>
            100% Client-Side • {t.footer.privacyNote} •{" "}
            <FooterLink href="/privacy">{locale === "id" ? "Privasi" : "Privacy"}</FooterLink>
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
