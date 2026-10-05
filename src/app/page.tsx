import Link from "next/link";
import {
  ArrowRight,
  FileImage,
  Repeat,
  Files,
  FileOutput,
  CaseSensitive,
  QrCode,
  Braces,
  Hash,
  Wrench,
  Image,
  FileText,
  Type,
  Code2,
  ShieldCheck,
  Zap,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";
import { categories, tools } from "@/lib/tools-config";
import { cn } from "@/lib/utils";

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

export default function Home() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            100% Client-Side &amp; Gratis
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Semua Tools Online dalam Satu Tempat
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-500 sm:text-lg dark:text-zinc-400">
            Kompres gambar, gabung PDF, format JSON, buat QR — semuanya berjalan langsung di
            browser. Tanpa antre upload, tanpa akun, tanpa biaya.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              href="#kategori"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-zinc-950"
            >
              Jelajahi Tools
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="#cara-kerja"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
            >
              <MousePointerClick className="h-4 w-4" aria-hidden />
              Cara Kerja
            </Link>
          </div>

          {/* Stats */}
          <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2">
            {[
              { value: "8", label: "Tools" },
              { value: "4", label: "Kategori" },
              { value: "0%", label: "Data Terkirim" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <dt className="order-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.label}</dt>
                <dd className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Category grid */}
      <section id="kategori" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 sm:px-6">
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Jelajahi berdasarkan Kategori
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Empat kategori, delapan tools — semuanya gratis tanpa batas.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] ?? Wrench;
            const catTools = tools.filter((t) => t.category === cat.id);
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{cat.name}</h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {catTools.length} tools • {cat.description}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {catTools.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/tools/${t.slug}`}
                        className="group flex items-center justify-between rounded-lg text-sm text-zinc-600 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                      >
                        <span className="truncate">{t.title}</span>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-zinc-600"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured tools grid */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Semua Tools Populer
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Klik salah satu untuk langsung menggunakannya — tanpa daftar.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = TOOL_ICONS[tool.icon] ?? Wrench;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className={cn(
                  "group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors",
                  "hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                  "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                    {tool.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-zinc-600"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {tool.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Cara kerja + privasi */}
      <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-50">
                Privasi dulu: file-mu tidak pernah diunggah
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Setiap tools berjalan 100% di perangkatmu memakai teknologi browser modern.
                Cabut internet setelah halaman termuat pun tools tetap berfungsi. Tidak ada
                server, tidak ada pelacakan, tidak ada kebocoran data.
              </p>
            </div>
          </div>
          <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              { step: "1", title: "Pilih tool", desc: "Klik tool yang kamu butuhkan dari sidebar atau pencarian ⌘K." },
              { step: "2", title: "Proses lokal", desc: "Seret file atau tempel teks — hasil muncul seketika di browser." },
              { step: "3", title: "Unduh / salin", desc: "Simpan hasilnya. Tidak ada yang tersimpan di server kami." },
            ].map((s) => (
              <li
                key={s.step}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {s.step}
                </span>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}
