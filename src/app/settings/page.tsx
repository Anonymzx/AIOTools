"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { AlertTriangle, KeyRound, Languages, Moon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { clearAiKey, hasAiKey } from "@/lib/ai-key";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    langTitle: string;
    langHint: string;
    english: string;
    indonesian: string;
    themeTitle: string;
    themeHint: string;
    light: string;
    dark: string;
    system: string;
    motionTitle: string;
    motionBody: string;
    keyTitle: string;
    keyHint: string;
    clearKey: string;
    keyCleared: string;
    noKey: string;
    dangerTitle: string;
    dangerHint: string;
    clearAll: string;
    clearAllDone: string;
    clearAllFailed: string;
    error: string;
  }
> = {
  en: {
    title: "Settings",
    description: "Language, appearance, and local data controls for AIOTools.",
    langTitle: "Language",
    langHint: "Applies to the whole app instantly.",
    english: "English",
    indonesian: "Bahasa Indonesia",
    themeTitle: "Appearance",
    themeHint: "Dark mode is pixel-checked on every tool.",
    light: "Light",
    dark: "Dark",
    system: "System",
    motionTitle: "Motion & animation",
    motionBody:
      "Animations follow your OS setting automatically (prefers-reduced-motion). Turn on Reduce Motion in your OS accessibility settings to disable them — there is no in-app override by design.",
    keyTitle: "Saved AI key",
    keyHint: "Your OpenAI key is encrypted in this browser only.",
    clearKey: "Remove saved AI key",
    keyCleared: "Saved AI key removed.",
    noKey: "No AI key saved in this browser.",
    dangerTitle: "Danger zone",
    dangerHint:
      "Wipes every AIOTools value in this browser's localStorage: language, saved AI key, tool history, and preferences. Cannot be undone.",
    clearAll: "Clear all local data",
    clearAllDone: "All local AIOTools data cleared.",
    clearAllFailed: "Could not clear local data.",
    error: "Something went wrong.",
  },
  id: {
    title: "Pengaturan",
    description: "Kontrol bahasa, tampilan, dan data lokal untuk AIOTools.",
    langTitle: "Bahasa",
    langHint: "Berlaku untuk seluruh aplikasi seketika.",
    english: "English",
    indonesian: "Bahasa Indonesia",
    themeTitle: "Tampilan",
    themeHint: "Mode gelap diperiksa pikselnya di setiap tool.",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    motionTitle: "Gerak & animasi",
    motionBody:
      "Animasi mengikuti pengaturan OS secara otomatis (prefers-reduced-motion). Aktifkan Kurangi Gerakan di pengaturan aksesibilitas OS untuk menonaktifkannya — tidak ada override dalam aplikasi, memang disengaja.",
    keyTitle: "Kunci AI tersimpan",
    keyHint: "Kunci OpenAI-mu terenkripsi hanya di browser ini.",
    clearKey: "Hapus kunci AI tersimpan",
    keyCleared: "Kunci AI tersimpan dihapus.",
    noKey: "Tidak ada kunci AI tersimpan di browser ini.",
    dangerTitle: "Zona berbahaya",
    dangerHint:
      "Menghapus semua nilai AIOTools di localStorage browser ini: bahasa, kunci AI tersimpan, riwayat tool, dan preferensi. Tidak bisa dibatalkan.",
    clearAll: "Hapus semua data lokal",
    clearAllDone: "Semua data lokal AIOTools dihapus.",
    clearAllFailed: "Tidak bisa menghapus data lokal.",
    error: "Terjadi kesalahan.",
  },
};

export default function SettingsPage(): React.JSX.Element {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const s = STR[locale];
  const [clearing, setClearing] = useState(false);

  function handleClearKey(): void {
    try {
      if (!hasAiKey()) {
        toast.info(s.noKey);
        return;
      }
      clearAiKey();
      toast.success(s.keyCleared);
    } catch {
      toast.error(s.error);
    }
  }

  function handleClearAll(): void {
    if (clearing) return;
    try {
      setClearing(true);
      window.localStorage.clear();
      toast.success(s.clearAllDone);
    } catch {
      toast.error(s.clearAllFailed);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          {s.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
          {s.description}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.langTitle}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.langHint}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={locale === "en" ? "default" : "outline"}
                onClick={() => setLocale("en")}
              >
                {s.english}
              </Button>
              <Button
                type="button"
                variant={locale === "id" ? "default" : "outline"}
                onClick={() => setLocale("id")}
              >
                {s.indonesian}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.themeTitle}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.themeHint}</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                {s.light}
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                {s.dark}
              </Button>
              <Button
                type="button"
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
              >
                {s.system}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4 sm:p-6">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.motionTitle}
            </span>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.motionBody}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.keyTitle}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.keyHint}</p>
            <Button type="button" variant="outline" onClick={handleClearKey}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {s.clearKey}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                {s.dangerTitle}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.dangerHint}</p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearAll}
              disabled={clearing}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {s.clearAll}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
