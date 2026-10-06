"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  FileText,
  FileWarning,
  Loader2,
  ShieldCheck,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stage = "idle" | "reading" | "validating" | "rebuilding" | "done" | "failed";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    privacy: string;
    dropHint: string;
    invalidType: string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    repair: string;
    repairing: string;
    stageReading: string;
    stageValidating: string;
    stageRebuilding: string;
    stageDone: string;
    stageFailed: string;
    report: (salvaged: number, total: number) => string;
    methodNote: (method: string) => string;
    methodNormal: string;
    methodEncrypted: string;
    methodPartial: string;
    failTitle: string;
    failBody: string;
    alternatives: string[];
    downloadRepaired: string;
    noFile: string;
    error: string;
  }
> = {
  en: {
    title: "Repair PDF",
    description:
      "Recover pages from a damaged or partially corrupted PDF. The tool rebuilds every readable page into a fresh file — all locally in your browser.",
    privacy: "100% private — files never leave your device",
    dropHint: "Drop a damaged PDF here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    repair: "Attempt repair",
    repairing: "Repairing...",
    stageReading: "Reading file",
    stageValidating: "Validating structure",
    stageRebuilding: "Rebuilding pages",
    stageDone: "Done",
    stageFailed: "Repair failed",
    report: (salvaged, total) => `Salvaged ${salvaged} of ${total} pages.`,
    methodNote: (method) => `Recovery method: ${method}.`,
    methodNormal: "full rebuild",
    methodEncrypted: "encryption-tolerant load",
    methodPartial: "partial page salvage",
    failTitle: "Could not repair this file",
    failBody:
      "The PDF is too damaged for the browser repair pipeline — every recovery path was tried and none produced a readable page. Try one of these instead:",
    alternatives: [
      "Re-export the PDF from its original app (Word, Docs, Figma) or print it to PDF again.",
      "Upload it to Google Drive, open with Google Docs, then download as PDF — Drive's converter often fixes broken files.",
      "Open it in a desktop reader (Adobe Acrobat, Foxit) and use Save As / Print to PDF to rebuild it.",
    ],
    downloadRepaired: "Download repaired PDF",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
  },
  id: {
    title: "Perbaiki PDF (Repair PDF)",
    description:
      "Pulihkan halaman dari PDF yang rusak atau korup sebagian. Tool membangun ulang setiap halaman yang terbaca menjadi file baru — semua lokal di browser.",
    privacy: "100% privat — file tidak pernah meninggalkan perangkatmu",
    dropHint: "Letakkan PDF yang rusak di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    repair: "Coba perbaiki",
    repairing: "Memperbaiki...",
    stageReading: "Membaca file",
    stageValidating: "Memvalidasi struktur",
    stageRebuilding: "Membangun ulang halaman",
    stageDone: "Selesai",
    stageFailed: "Perbaikan gagal",
    report: (salvaged, total) => `Berhasil menyelamatkan ${salvaged} dari ${total} halaman.`,
    methodNote: (method) => `Metode pemulihan: ${method}.`,
    methodNormal: "pembangunan ulang penuh",
    methodEncrypted: "pemuatan toleran enkripsi",
    methodPartial: "penyelamatan halaman sebagian",
    failTitle: "File ini tidak dapat diperbaiki",
    failBody:
      "PDF terlalu rusak untuk alur perbaikan browser — semua jalur pemulihan sudah dicoba dan tidak ada yang menghasilkan halaman terbaca. Coba salah satu alternatif ini:",
    alternatives: [
      "Ekspor ulang PDF dari aplikasi aslinya (Word, Docs, Figma) atau cetak ulang ke PDF.",
      "Unggah ke Google Drive, buka dengan Google Docs, lalu unduh sebagai PDF — konverter Drive sering memperbaiki file rusak.",
      "Buka di pembaca desktop (Adobe Acrobat, Foxit) lalu gunakan Save As / Print to PDF untuk membangun ulang.",
    ],
    downloadRepaired: "Unduh PDF yang diperbaiki",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How does repair work?",
      a: "The tool reads your file, validates its structure, then copies every readable page into a brand-new PDF — broken pages are skipped individually so one bad page never kills the rest. You get a repaired.pdf plus a salvaged/total report.",
    },
    id: {
      q: "Bagaimana cara kerja perbaikan?",
      a: "Tool membaca filemu, memvalidasi strukturnya, lalu menyalin setiap halaman yang terbaca ke PDF yang benar-benar baru — halaman rusak dilewati satu per satu sehingga satu halaman jelek tidak menggugurkan sisanya. Kamu mendapat repaired.pdf plus laporan halaman terselamatkan/total.",
    },
  },
  {
    en: {
      q: "What if repair fails completely?",
      a: "You will see a red panel — never a crash — with concrete next steps: re-export from the original app, re-save through Google Drive, or rebuild with a desktop reader like Adobe Acrobat or Foxit.",
    },
    id: {
      q: "Bagaimana jika perbaikan gagal total?",
      a: "Kamu akan melihat panel merah — bukan crash — berisi langkah konkret berikutnya: ekspor ulang dari aplikasi asli, simpan ulang lewat Google Drive, atau bangun ulang dengan pembaca desktop seperti Adobe Acrobat atau Foxit.",
    },
  },
  {
    en: {
      q: "Is my damaged file uploaded anywhere?",
      a: "No. The whole Reading → Validating → Rebuilding pipeline runs with pdf-lib on your device. Nothing is sent to a server.",
    },
    id: {
      q: "Apakah file rusak saya diunggah ke mana pun?",
      a: "Tidak. Seluruh alur Membaca → Memvalidasi → Membangun ulang berjalan dengan pdf-lib di perangkatmu. Tidak ada yang dikirim ke server.",
    },
  },
  {
    en: {
      q: "Will the repaired PDF look identical?",
      a: "Readable pages are copied as-is, so they look the same. Pages that were too corrupted to parse are dropped and counted as lost in the salvaged/total report — always compare against your original source when accuracy matters.",
    },
    id: {
      q: "Apakah PDF hasil perbaikan tampil identik?",
      a: "Halaman yang terbaca disalin apa adanya, sehingga tampilannya sama. Halaman yang terlalu rusak untuk diuraikan dibuang dan dihitung sebagai hilang dalam laporan terselamatkan/total — selalu bandingkan dengan sumber aslimu bila akurasi penting.",
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

export default function RepairPdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const downloadUrlsRef = useRef<string[]>([]);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [salvaged, setSalvaged] = useState(0);
  const [total, setTotal] = useState(0);
  const [method, setMethod] = useState("");
  const [repairedUrl, setRepairedUrl] = useState<string | null>(null);

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

  const handleFiles = (files: File[]): void => {
    try {
      const picked = files[0];
      setDzKey((k) => k + 1);
      if (!picked) return;
      if (!/\.pdf$/i.test(picked.name)) {
        toast.error(`${picked.name} ${s.invalidType}`);
        return;
      }
      if (repairedUrl) {
        try {
          URL.revokeObjectURL(repairedUrl);
        } catch {
          // ignore
        }
      }
      setFile(picked);
      setStage("idle");
      setSalvaged(0);
      setTotal(0);
      setMethod("");
      setRepairedUrl(null);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      if (repairedUrl) {
        try {
          URL.revokeObjectURL(repairedUrl);
        } catch {
          // ignore
        }
      }
      setFile(null);
      setStage("idle");
      setSalvaged(0);
      setTotal(0);
      setMethod("");
      setRepairedUrl(null);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const fail = (): void => {
    if (!mountedRef.current) return;
    setStage("failed");
    toast.error(s.failTitle);
  };

  const handleRepair = async (): Promise<void> => {
    if (!file || stage === "reading" || stage === "validating" || stage === "rebuilding") {
      if (!file) toast.error(s.noFile);
      return;
    }
    try {
      // Stage 1: Reading
      if (mountedRef.current) setStage("reading");
      let bytes: ArrayBuffer;
      try {
        bytes = await file.arrayBuffer();
      } catch {
        fail();
        return;
      }
      if (!mountedRef.current) return;

      // Stage 2: Validating — normal load, then encryption-tolerant load
      setStage("validating");
      let src: PDFDocument | null = null;
      let usedMethod = s.methodNormal;
      try {
        src = await PDFDocument.load(bytes);
      } catch {
        src = null;
      }
      if (!src) {
        try {
          src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          usedMethod = s.methodEncrypted;
        } catch {
          src = null;
        }
      }
      if (!src) {
        fail();
        return;
      }
      if (!mountedRef.current) return;

      // Stage 3: Rebuilding — drop-and-recopy every loadable page into a fresh doc
      setStage("rebuilding");
      let pageTotal = 0;
      try {
        pageTotal = src.getPageCount();
      } catch {
        pageTotal = 0;
      }
      if (mountedRef.current) setTotal(pageTotal);
      const out = await PDFDocument.create();
      let kept = 0;
      for (let i = 0; i < pageTotal; i++) {
        try {
          const [p] = await out.copyPages(src, [i]);
          out.addPage(p);
          kept += 1;
        } catch {
          // skip broken page, keep going
        }
      }
      if (kept === 0) {
        fail();
        return;
      }
      if (kept < pageTotal) usedMethod = s.methodPartial;
      let saved: Uint8Array;
      try {
        saved = await out.save();
      } catch {
        fail();
        return;
      }
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
      downloadUrlsRef.current = [...downloadUrlsRef.current, url];
      setRepairedUrl(url);
      setSalvaged(kept);
      setMethod(usedMethod);
      setStage("done");
      toast.success(s.report(kept, pageTotal));
    } catch {
      fail();
    }
  };

  const busy = stage === "reading" || stage === "validating" || stage === "rebuilding";
  const stages: { id: Stage; label: string }[] = [
    { id: "reading", label: s.stageReading },
    { id: "validating", label: s.stageValidating },
    { id: "rebuilding", label: s.stageRebuilding },
  ];
  const stageRank: Record<Stage, number> = {
    idle: 0,
    reading: 1,
    validating: 2,
    rebuilding: 3,
    done: 4,
    failed: 3,
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Wrench" slug="pdf/repair" faq={FAQ}>
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {s.privacy}
        </p>

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
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">{formatSize(file.size)}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={busy}
                  aria-label={`${s.removeFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            {file && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleRepair()}
                  disabled={busy}
                  size="lg"
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Wrench aria-hidden />}
                  {busy ? s.repairing : s.repair}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} disabled={busy}>
                  <X aria-hidden />
                  {s.reset}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {file && stage !== "idle" && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <ol className="space-y-2">
                {stages.map((st, i) => {
                  const active = stage === st.id;
                  const passed = stageRank[stage] > i + 1 || stage === "done";
                  return (
                    <li key={st.id} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          passed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : active
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                        )}
                      >
                        {passed ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          passed || active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500",
                        )}
                      >
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {stage === "done" && repairedUrl && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {s.stageDone} — {s.report(salvaged, total)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{s.methodNote(method)}</p>
                  <Button asChild size="lg" className="mt-3 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
                    <a href={repairedUrl} download="repaired.pdf">
                      <Download aria-hidden />
                      {s.downloadRepaired}
                    </a>
                  </Button>
                </div>
              )}

              {stage === "failed" && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40" role="alert">
                  <p className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-200">
                    <XCircle className="h-4 w-4" aria-hidden />
                    {s.failTitle}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{s.failBody}</p>
                  <ul className="mt-2 space-y-1.5">
                    {s.alternatives.map((alt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-red-700 dark:text-red-300">
                        <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
