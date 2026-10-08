"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    updated: string;
    intro: string;
    noUploadTitle: string;
    noUploadBody: string;
    storageTitle: string;
    storageBody: string;
    byokTitle: string;
    byokBody: string;
    analyticsTitle: string;
    analyticsBody: string;
    thirdPartyTitle: string;
    thirdPartyBody: string;
    contactTitle: string;
    contactBody: string;
    backHome: string;
  }
> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 2026",
    intro:
      "AIOTools is privacy-first by architecture: every tool runs 100% in your browser. Your files are processed on your device and never uploaded to any server.",
    noUploadTitle: "No uploads, ever",
    noUploadBody:
      "PDFs, images, archives, and text you drop into any tool are read with browser APIs (FileReader, Canvas, Web Workers, WebAssembly) and stay on your device. There is no upload endpoint — disconnect the internet after the page loads and tools keep working.",
    storageTitle: "localStorage: preferences only",
    storageBody:
      "The only data stored in your browser is UI preferences: language (aiotools-locale), theme, and transient UI state. No file contents, no history, no identifiers. Clear it anytime via your browser's site-data settings.",
    byokTitle: "BYOK API keys (future AI features)",
    byokBody:
      "If a Bring-Your-Own-Key AI feature is ever enabled, any API key you paste is kept in your own browser storage and sent only to the provider you chose, only when you explicitly run the feature. Keys are never logged, never shared, and can be cleared by removing site data. No AI feature runs without your explicit opt-in.",
    analyticsTitle: "No analytics, no tracking",
    analyticsBody:
      "AIOTools ships zero analytics libraries — no Google Analytics, Plausible, Fathom, beacons, or fingerprinting. We cannot see what you do because nothing is reported back.",
    thirdPartyTitle: "Third-party contacts",
    thirdPartyBody:
      "Two exceptions contact third parties: (1) the pdf.js worker CDN fallback, used only if the bundled local worker fails to load; (2) AI provider APIs, only when you opt into a BYOK feature with your own key. Everything else is same-origin and offline-capable.",
    contactTitle: "Questions",
    contactBody:
      "This policy covers the static AIOTools site. If you self-host or deploy a fork, you are responsible for your own deployment's practices.",
    backHome: "Back to home",
  },
  id: {
    title: "Kebijakan Privasi",
    updated: "Terakhir diperbarui: Oktober 2026",
    intro:
      "AIOTools mengutamakan privasi secara arsitektural: setiap tool berjalan 100% di browser Anda. File Anda diproses di perangkat dan tidak pernah diunggah ke server mana pun.",
    noUploadTitle: "Tanpa unggahan, selalu",
    noUploadBody:
      "PDF, gambar, arsip, dan teks yang Anda masukkan ke tool dibaca dengan API browser (FileReader, Canvas, Web Workers, WebAssembly) dan tetap di perangkat Anda. Tidak ada endpoint unggahan — cabut internet setelah halaman termuat pun tool tetap berfungsi.",
    storageTitle: "localStorage: hanya preferensi",
    storageBody:
      "Satu-satunya data yang disimpan di browser adalah preferensi UI: bahasa (aiotools-locale), tema, dan state UI sementara. Tanpa isi file, tanpa riwayat, tanpa pengenal. Hapus kapan saja lewat pengaturan data situs browser Anda.",
    byokTitle: "Kunci API BYOK (fitur AI mendatang)",
    byokBody:
      "Jika fitur AI Bring-Your-Own-Key diaktifkan, kunci API yang Anda tempel hanya disimpan di browser Anda dan dikirim hanya ke provider pilihan Anda, hanya saat Anda menjalankan fitur tersebut. Kunci tidak pernah dicatat, tidak dibagikan, dan bisa dihapus via data situs. Tidak ada fitur AI yang berjalan tanpa opt-in eksplisit Anda.",
    analyticsTitle: "Tanpa analitik, tanpa pelacakan",
    analyticsBody:
      "AIOTools tidak menyertakan pustaka analitik apa pun — tanpa Google Analytics, Plausible, Fathom, beacon, atau fingerprinting. Kami tidak bisa melihat aktivitas Anda karena tidak ada yang dilaporkan kembali.",
    thirdPartyTitle: "Kontak pihak ketiga",
    thirdPartyBody:
      "Dua pengecualian menghubungi pihak ketiga: (1) fallback CDN worker pdf.js, hanya dipakai jika worker lokal bawaan gagal dimuat; (2) API provider AI, hanya saat Anda ikut serta dalam fitur BYOK dengan kunci sendiri. Selebihnya same-origin dan bisa offline.",
    contactTitle: "Pertanyaan",
    contactBody:
      "Kebijakan ini mencakup situs statis AIOTools. Jika Anda self-host atau deploy fork, Anda bertanggung jawab atas praktik deployment Anda sendiri.",
    backHome: "Kembali ke beranda",
  },
};

export default function PrivacyPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  useEffect(() => {
    try {
      document.title = `${s.title} | AIOTools`;
    } catch {
      // title update must never break the page
    }
  }, [s.title]);

  const sections = [
    { title: s.noUploadTitle, body: s.noUploadBody },
    { title: s.storageTitle, body: s.storageBody },
    { title: s.byokTitle, body: s.byokBody },
    { title: s.analyticsTitle, body: s.analyticsBody },
    { title: s.thirdPartyTitle, body: s.thirdPartyBody },
    { title: s.contactTitle, body: s.contactBody },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <ShieldCheck className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        {s.title}
      </h1>
      <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">{s.updated}</p>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
        {s.intro}
      </p>

      <div className="mt-8 space-y-3">
        {sections.map((sec) => (
          <section
            key={sec.title}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{sec.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {sec.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-400"
        >
          ← {s.backHome}
        </Link>
      </div>
    </div>
  );
}
