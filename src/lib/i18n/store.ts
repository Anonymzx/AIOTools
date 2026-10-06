"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dictionaries, type Locale } from "./dictionaries";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function safeStorage() {
  try {
    return createJSONStorage(() => window.localStorage);
  } catch {
    return undefined;
  }
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale: Locale) => {
        try {
          set({ locale });
        } catch {
          // ignore state errors
        }
      },
    }),
    {
      name: "aiotools-locale",
      storage: typeof window !== "undefined" ? safeStorage() : undefined,
      // Defer rehydration until after mount (rehydrate() called in an effect):
      // first client render must equal server HTML ("en") or hydration fails.
      skipHydration: true,
    },
  ),
);

export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, setLocale, t: dictionaries[locale] };
}
