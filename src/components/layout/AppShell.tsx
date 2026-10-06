"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ScrollProgress from "./ScrollProgress";
import { useLocaleStore } from "@/lib/i18n/store";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Rehydrate persisted locale AFTER mount so first client render
  // matches server HTML (default "en"). Never rehydrate during render.
  useEffect(() => {
    try {
      void useLocaleStore.persist.rehydrate();
    } catch {
      // ignore — default locale stands
    }
  }, []);
  // Close mobile drawer on route change
  useEffect(() => {
    try {
      setMobileOpen(false);
    } catch {
      // ignore
    }
  }, [pathname]);

  // Keep <html lang> in sync with locale
  useEffect(() => {
    try {
      const unsub = useLocaleStore.subscribe((s) => {
        try {
          document.documentElement.lang = s.locale;
        } catch {
          // ignore
        }
      });
      document.documentElement.lang = useLocaleStore.getState().locale;
      return unsub;
    } catch {
      return undefined;
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ScrollProgress />
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export { AppShell };
