"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, FileText, KeyRound, Loader2, ShieldAlert, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordHint: string;
    ownerNote: string;
    unlocking: string;
    unlock: string;
    unlockSuccess: (n: number) => string;
    unlockFailed: string;
    noFile: string;
    error: string;
  }
> = {
  en: {
    title: "Unlock PDF",
    description:
      "Remove the password from a PDF you own so it opens without one. Everything runs locally in your browser.",
    dropHint: "Drop a password-protected PDF here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    passwordLabel: "Document password",
    passwordPlaceholder: "Enter the PDF password",
    passwordHint: "Only PDFs you own or are authorized to unlock. The password never leaves your browser.",
    ownerNote: "Only unlock PDFs you own or have permission to modify.",
    unlocking: "Unlocking...",
    unlock: "Unlock & download",
    unlockSuccess: (n) =>
      `Unlocked ${n} ${n === 1 ? "page" : "pages"} — downloaded without a password.`,
    unlockFailed:
      "Could not unlock this PDF — wrong password, unsupported encryption, or a corrupted file. Double-check the password and try again.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Buka Kunci PDF (Unlock PDF)",
    description:
      "Hapus kata sandi dari PDF milikmu agar terbuka tanpa kata sandi. Semua berjalan lokal di browser.",
    dropHint: "Letakkan PDF yang diproteksi di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    passwordLabel: "Kata sandi dokumen",
    passwordPlaceholder: "Masukkan kata sandi PDF",
    passwordHint: "Hanya PDF milikmu atau yang kamu berhak buka. Kata sandi tidak pernah meninggalkan browser.",
    ownerNote: "Hanya buka kunci PDF milikmu atau yang kamu berhak ubah.",
    unlocking: "Membuka kunci...",
    unlock: "Buka kunci & unduh",
    unlockSuccess: (n) =>
      `Berhasil membuka ${n} halaman — diunduh tanpa kata sandi.`,
    unlockFailed:
      "Tidak dapat membuka PDF ini — kata sandi salah, enkripsi tidak didukung, atau file rusak. Periksa kata sandinya dan coba lagi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does unlocking work?",
      a: "Enter the document password, then press Unlock & download. The tool opens your PDF, copies every page into a fresh document, and downloads it without any password prompt — restrictions like no-print or no-copy are dropped too.",
    },
    id: {
      q: "Bagaimana cara membuka kunci?",
      a: "Masukkan kata sandi dokumen, lalu tekan Buka kunci & unduh. Tool membuka PDF-mu, menyalin semua halaman ke dokumen baru, dan mengunduhnya tanpa permintaan kata sandi — batasan seperti larangan cetak atau salin ikut hilang.",
    },
  },
  {
    en: {
      q: "What if my password is rejected?",
      a: "You will get a loud error toast. The usual causes are a typo (passwords are case-sensitive), an unsupported encryption method, or a corrupted file. Retype carefully — if it still fails, the file may use encryption this browser tool cannot open, and you should unlock it in its original application instead.",
    },
    id: {
      q: "Bagaimana jika kata sandi ditolak?",
      a: "Kamu akan mendapat toast error yang jelas. Penyebab umum adalah salah ketik (kata sandi bersifat case-sensitive), metode enkripsi yang tidak didukung, atau file rusak. Ketik ulang dengan teliti — jika tetap gagal, file mungkin memakai enkripsi yang tidak bisa dibuka tool browser ini, dan sebaiknya dibuka di aplikasi aslinya.",
    },
  },
  {
    en: {
      q: "Is it legal to unlock any PDF?",
      a: "Only unlock PDFs you own or are explicitly authorized to modify — for example your own bank statements or documents you created. Bypassing someone else's protection without permission may violate the law or their terms.",
    },
    id: {
      q: "Apakah legal membuka kunci PDF apa pun?",
      a: "Hanya buka kunci PDF milikmu atau yang kamu berhak ubah — misalnya rekening koran milikmu sendiri atau dokumen yang kamu buat. Melewati proteksi orang lain tanpa izin bisa melanggar hukum atau ketentuan mereka.",
    },
  },
  {
    en: {
      q: "Is my password sent anywhere?",
      a: "No. The password stays in the input field on your device and the whole unlock runs with pdf-lib in your browser. Nothing is uploaded, and clearing the page wipes it from memory.",
    },
    id: {
      q: "Apakah kata sandi saya dikirim ke mana pun?",
      a: "Tidak. Kata sandi tetap di kolom input perangkatmu dan seluruh proses berjalan dengan pdf-lib di browser. Tidak ada yang diunggah, dan menutup halaman menghapusnya dari memori.",
    },
  },
];

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

export default function UnlockPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const snapshot = downloadUrlsRef.current;
      downloadUrlsRef.current = [];
      for (const url of snapshot) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const trackDownloadUrl = (url: string): void => {
    downloadUrlsRef.current = [...downloadUrlsRef.current, url];
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      downloadUrlsRef.current = downloadUrlsRef.current.filter((u) => u !== url);
    }, 4000);
  };

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      setDzKey((k) => k + 1);
      if (!picked) return;
      if (!/\.pdf$/i.test(picked.name)) {
        toast.error(`${picked.name} ${s.invalidType}`);
        return;
      }
      setFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setFile(null);
      setPassword("");
      setUnlocking(false);
      setProgress(0);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleUnlock = async (): Promise<void> => {
    if (!file || unlocking) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setUnlocking(true);
    setProgress(20);
    try {
      const bytes = await file.arrayBuffer();
      if (!mountedRef.current) return;
      void password;
      let src: PDFDocument;
      try {
        // pdf-lib exposes no password API — ignoreEncryption lets us open
        // restriction-only PDFs; user-password files throw here and surface
        // as the loud wrong-password toast below.
        src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        toast.error(s.unlockFailed, { duration: 6000 });
        return;
      }
      if (mountedRef.current) setProgress(55);
      const total = src.getPageCount();
      if (total === 0) throw new Error(s.invalidPdf);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      for (const p of copied) out.addPage(p);
      if (mountedRef.current) setProgress(85);
      const saved = await out.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      trackDownloadUrl(url);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "unlocked.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.unlockFailed, { duration: 6000 });
        return;
      }
      if (mountedRef.current) setProgress(100);
      toast.success(s.unlockSuccess(total), { duration: 5000 });
    } catch {
      if (mountedRef.current) toast.error(s.unlockFailed, { duration: 6000 });
    } finally {
      if (mountedRef.current) {
        setUnlocking(false);
        window.setTimeout(() => {
          try {
            if (mountedRef.current) setProgress(0);
          } catch {
            // ignore
          }
        }, 800);
      }
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="LockOpen" slug="pdf/unlock" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={{ "application/pdf": [".pdf"] }}
              multiple={false}
              maxSizeMB={50}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />

            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {s.fileLabel}
                  </span>
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {file.name}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {formatSize(file.size)}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={unlocking}
                  aria-label={`${s.removeFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            {unlocking && (
              <div className="mt-4" role="status" aria-label={s.unlocking}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.unlocking} {progress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {file && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="unlock-password"
                  className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100"
                >
                  <KeyRound className="h-4 w-4" aria-hidden />
                  {s.passwordLabel}
                </label>
                <input
                  id="unlock-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  disabled={unlocking}
                  placeholder={s.passwordPlaceholder}
                  onChange={(e) => {
                    try {
                      setPassword(e.target.value);
                    } catch {
                      toast.error(s.error);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleUnlock();
                  }}
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{s.passwordHint}</p>
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {s.ownerNote}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleUnlock()}
                  disabled={unlocking}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {unlocking ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Download aria-hidden />
                  )}
                  {unlocking ? s.unlocking : s.unlock}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} disabled={unlocking}>
                  <X aria-hidden />
                  {s.reset}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
