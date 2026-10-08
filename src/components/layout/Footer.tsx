"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ShieldCheck } from "lucide-react";
import { categories, tools, getCategoryName } from "@/lib/tools-config";
import { useLocale } from "@/lib/i18n/store";

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
