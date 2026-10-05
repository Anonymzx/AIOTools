import Link from "next/link";
import { Zap, ShieldCheck } from "lucide-react";
import { categories, tools } from "@/lib/tools-config";

export default function Footer() {
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
            Kumpulan tools online gratis yang berjalan 100% di browser. Cepat, aman, tanpa antre
            upload.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Data tidak pernah meninggalkan perangkatmu
          </p>
        </div>

        {/* Kategori */}
        <nav aria-label="Kategori tools">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Kategori
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((cat) => {
              const firstTool = tools.find((t) => t.category === cat.id);
              const href = firstTool ? `/tools/${firstTool.slug}` : "/";
              return (
                <li key={cat.id}>
                  <Link
                    href={href}
                    className="rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Developer */}
        <nav aria-label="Tautan developer">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Developer
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/tools/developer/json-formatter"
                className="rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
              >
                JSON Formatter
              </Link>
            </li>
            <li>
              <Link
                href="/tools/developer/hash-generator"
                className="rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
              >
                Hash Generator
              </Link>
            </li>
            <li>
              <Link
                href="/tools/text/qr-generator"
                className="rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
              >
                QR Generator
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="rounded text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
              >
                Semua Tools
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-zinc-400 sm:flex-row sm:px-6 dark:text-zinc-500">
          <p>© 2026 AIOTools. Semua hak dilindungi.</p>
          <p>100% Client-Side • Privasi Terjaga</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
