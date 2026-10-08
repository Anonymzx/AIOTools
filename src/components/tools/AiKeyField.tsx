"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { clearAiKey, hasAiKey, loadAiKey, maskKey, saveAiKey } from "@/lib/ai-key";

const STR: Record<
  Locale,
  {
    title: string;
    hint: string;
    placeholder: string;
    save: string;
    clear: string;
    savedLabel: string;
    savedToast: string;
    clearedToast: string;
    saveFailed: string;
    tooShort: string;
    show: string;
    hide: string;
    storedNote: string;
  }
> = {
  en: {
    title: "OpenAI API key (BYOK)",
    hint: "Stored encrypted in this browser only. Billed to your OpenAI account.",
    placeholder: "sk-…",
    save: "Save key",
    clear: "Clear",
    savedLabel: "Saved key",
    savedToast: "API key saved (encrypted).",
    clearedToast: "Saved API key removed.",
    saveFailed: "Could not save key in this browser.",
    tooShort: "That key looks too short — paste the full key.",
    show: "Show key input",
    hide: "Hide key input",
    storedNote: "Only the key text leaves your browser — sent directly to OpenAI.",
  },
  id: {
    title: "Kunci API OpenAI (BYOK)",
    hint: "Disimpan terenkripsi hanya di browser ini. Ditagih ke akun OpenAI Anda.",
    placeholder: "sk-…",
    save: "Simpan kunci",
    clear: "Hapus",
    savedLabel: "Kunci tersimpan",
    savedToast: "Kunci API tersimpan (terenkripsi).",
    clearedToast: "Kunci API tersimpan dihapus.",
    saveFailed: "Tidak bisa menyimpan kunci di browser ini.",
    tooShort: "Kunci tampak terlalu pendek — tempel kunci lengkap.",
    show: "Tampilkan input kunci",
    hide: "Sembunyikan input kunci",
    storedNote: "Hanya teks kunci yang keluar dari browser — dikirim langsung ke OpenAI.",
  },
};

const INPUT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function AiKeyField({
  onKey,
}: {
  onKey?: (key: string | null) => void;
}): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stored, setStored] = useState<string | null>(null);

  // HYDRATION LAW: decrypt only after mount; initial render is key-less.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        if (!hasAiKey()) return;
        const key = await loadAiKey();
        if (!alive) return;
        if (key) {
          setStored(maskKey(key));
          onKey?.(key);
        }
      } catch {
        // Missing/unreadable key = act as if none is saved.
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(): Promise<void> {
    if (busy) return;
    try {
      const trimmed = draft.trim();
      if (trimmed.length < 8) {
        toast.error(s.tooShort);
        return;
      }
      setBusy(true);
      const ok = await saveAiKey(trimmed);
      if (!ok) {
        toast.error(s.saveFailed);
        return;
      }
      setDraft("");
      setShow(false);
      setStored(maskKey(trimmed));
      onKey?.(trimmed);
      toast.success(s.savedToast);
    } catch {
      toast.error(s.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function handleClear(): void {
    try {
      clearAiKey();
      setStored(null);
      setDraft("");
      onKey?.(null);
      toast.success(s.clearedToast);
    } catch {
      toast.error(s.saveFailed);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {s.title}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {s.hint} {s.storedNote}
        </p>
        {stored !== null && (
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
            aria-live="polite"
          >
            {s.savedLabel}: {stored}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={s.placeholder}
              autoComplete="off"
              spellCheck={false}
              aria-label={s.title}
              className={INPUT_CLS}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? s.hide : s.show}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-zinc-200"
            >
              {show ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={busy}>
              {s.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={stored === null && draft === ""}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {s.clear}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { AiKeyField };
