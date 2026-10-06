"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolSteps } from "@/components/ui/tool-steps";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_FILES = 20;

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    listTitle: string;
    pagesSuffix: string;
    invalidType: string;
    invalidPdf: string;
    limitReached: string;
    needTwo: string;
    merge: string;
    merging: string;
    reset: string;
    mergeSuccess: (files: number, pages: number) => string;
    mergeFailed: string;
    error: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    totalLabel: string;
    dropReorderHint: string;
    stepUpload: string;
    stepProcess: string;
    stepDownload: string;
  }
> = {
  en: {
    title: "Merge PDF",
    description:
      "Combine multiple PDF files into one document. Reorder with drag & drop or arrow buttons — everything runs locally in your browser.",
    dropHint: "Drop PDF files here, or click to browse (up to 20 files)",
    listTitle: "Files to merge",
    pagesSuffix: "pages",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    limitReached: "Maximum of 20 files reached.",
    needTwo: "Add at least 2 PDF files to merge.",
    merge: "Merge PDFs",
    merging: "Merging...",
    reset: "Clear all",
    mergeSuccess: (files, pages) =>
      `Merged ${files} files (${pages} pages) into one PDF.`,
    mergeFailed: "Failed to merge PDFs. One of the files may be corrupted or encrypted.",
    error: "Something went wrong.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove file",
    totalLabel: "Total",
    dropReorderHint: "Drag rows to reorder, or use the arrow buttons.",
    stepUpload: "Upload",
    stepProcess: "Merge",
    stepDownload: "Download",
  },
  id: {
    title: "Gabung PDF",
    description:
      "Gabungkan beberapa file PDF menjadi satu dokumen. Susun ulang dengan drag & drop atau tombol panah — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih (maks. 20 file)",
    listTitle: "File yang akan digabung",
    pagesSuffix: "halaman",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    limitReached: "Batas maksimal 20 file tercapai.",
    needTwo: "Tambahkan minimal 2 file PDF untuk digabung.",
    merge: "Gabungkan PDF",
    merging: "Menggabungkan...",
    reset: "Hapus semua",
    mergeSuccess: (files, pages) =>
      `Berhasil menggabungkan ${files} file (${pages} halaman) menjadi satu PDF.`,
    mergeFailed: "Gagal menggabungkan PDF. Salah satu file mungkin rusak atau terenkripsi.",
    error: "Terjadi kesalahan.",
    moveUp: "Pindah ke atas",
    moveDown: "Pindah ke bawah",
    remove: "Hapus file",
    totalLabel: "Total",
    dropReorderHint: "Seret baris untuk menyusun ulang, atau gunakan tombol panah.",
    stepUpload: "Unggah",
    stepProcess: "Gabung",
    stepDownload: "Unduh",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Will merging change the quality of my PDFs?",
      a: "No. Pages are copied losslessly with pdf-lib, so text, images, and vector graphics keep their original quality. No re-compression happens during a merge.",
    },
    id: {
      q: "Apakah penggabungan mengubah kualitas PDF saya?",
      a: "Tidak. Halaman disalin secara lossless dengan pdf-lib, sehingga teks, gambar, dan grafik vektor tetap mempertahankan kualitas aslinya. Tidak ada kompresi ulang saat penggabungan.",
    },
  },
  {
    en: {
      q: "How do I change the order of files in the merged PDF?",
      a: "Drag any row by its grip handle to a new position, or use the up/down arrow buttons — ideal on touch screens. The top file becomes the first pages of the merged document.",
    },
    id: {
      q: "Bagaimana cara mengubah urutan file dalam PDF gabungan?",
      a: "Seret baris mana pun lewat gagang grip ke posisi baru, atau gunakan tombol panah atas/bawah — cocok untuk layar sentuh. File teratas menjadi halaman pertama dokumen gabungan.",
    },
  },
  {
    en: {
      q: "Are my files uploaded to a server?",
      a: "Never. All merging happens 100% in your browser using pdf-lib. Your documents never leave your device, so the tool even works offline after the page loads.",
    },
    id: {
      q: "Apakah file saya diunggah ke server?",
      a: "Tidak pernah. Semua penggabungan terjadi 100% di browser memakai pdf-lib. Dokumen tidak pernah meninggalkan perangkatmu, sehingga tool ini tetap berfungsi offline setelah halaman termuat.",
    },
  },
  {
    en: {
      q: "Why does a file fail with 'could not be read'?",
      a: "The file is usually corrupted, password-protected, or not actually a PDF despite its extension. Try re-exporting it from its source app or removing the password first, then merge again.",
    },
    id: {
      q: "Mengapa file gagal dengan pesan 'tidak dapat dibaca'?",
      a: "File biasanya rusak, diproteksi kata sandi, atau sebenarnya bukan PDF walau ekstensinya .pdf. Coba ekspor ulang dari aplikasi sumbernya atau hapus kata sandinya dulu, lalu gabungkan lagi.",
    },
  },
];

interface MergeItem {
  id: string;
  file: File;
  pages: number | null;
  failed: boolean;
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

export default function MergePdfPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const mounted = mountedRef;
  const dragIndexRef = useRef<number | null>(null);
  const [items, setItems] = useState<MergeItem[]>([]);
  const [dzKey, setDzKey] = useState(0);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPageCounts = async (fresh: MergeItem[]): Promise<void> => {
    for (const it of fresh) {
      try {
        const bytes = await it.file.arrayBuffer();
        if (!mounted.current) return;
        let doc: PDFDocument;
        try {
          doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        } catch {
          if (!mounted.current) return;
          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, failed: true } : p)));
          toast.error(`${it.file.name} ${s.invalidPdf}`);
          continue;
        }
        const n = doc.getPageCount();
        if (!mounted.current) return;
        setItems((prev) =>
          prev.map((p) => (p.id === it.id ? { ...p, pages: n } : p)),
        );
      } catch {
        if (!mounted.current) return;
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, failed: true } : p)));
        toast.error(`${it.file.name} ${s.invalidPdf}`);
      }
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const valids = files.filter((f) => /\.pdf$/i.test(f.name));
      const skipped = files.length - valids.length;
      if (skipped > 0) {
        for (const f of files) {
          if (!/\.pdf$/i.test(f.name)) toast.error(`${f.name} ${s.invalidType}`);
        }
      }
      if (valids.length === 0) {
        setDzKey((k) => k + 1);
        return;
      }
      const room = MAX_FILES - items.length;
      if (room <= 0) {
        toast.error(s.limitReached);
        setDzKey((k) => k + 1);
        return;
      }
      const take = valids.slice(0, room);
      if (valids.length > room) toast.error(s.limitReached);
      const fresh: MergeItem[] = take.map((f) => ({
        id: makeId(),
        file: f,
        pages: null,
        failed: false,
      }));
      setItems((prev) => [...prev, ...fresh]);
      // Clear the dropzone's internal list so this page owns all display.
      setDzKey((k) => k + 1);
      void loadPageCounts(fresh);
    } catch {
      toast.error(s.error);
    }
  };

  const move = (from: number, to: number): void => {
    try {
      setItems((prev) => {
        if (to < 0 || to >= prev.length) return prev;
        const next = [...prev];
        const [m] = next.splice(from, 1);
        if (!m) return prev;
        next.splice(to, 0, m);
        return next;
      });
    } catch {
      toast.error(s.error);
    }
  };

  const removeAt = (index: number): void => {
    try {
      setItems((prev) => prev.filter((_, i) => i !== index));
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setItems([]);
      setProgress(0);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleMerge = async (): Promise<void> => {
    if (items.length < 2 || merging) {
      if (items.length < 2) toast.error(s.needTwo);
      return;
    }
    setMerging(true);
    setProgress(0);
    try {
      const out = await PDFDocument.create();
      let totalPages = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let src: PDFDocument;
        try {
          const bytes = await it.file.arrayBuffer();
          if (!mounted.current) return;
          src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        } catch {
          throw new Error(`${it.file.name} ${s.invalidPdf}`);
        }
        const copied = await out.copyPages(src, src.getPageIndices());
        for (const p of copied) out.addPage(p);
        totalPages += src.getPageCount();
        if (mounted.current) setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      const merged = await out.save();
      if (!mounted.current) return;
      const buf = new ArrayBuffer(merged.byteLength);
      new Uint8Array(buf).set(merged);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "merged.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.mergeFailed);
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        return;
      }
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      toast.success(s.mergeSuccess(items.length, totalPages));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : s.mergeFailed);
    } finally {
      if (mounted.current) setMerging(false);
    }
  };

  const totalPages = items.reduce((acc, it) => acc + (it.pages ?? 0), 0);
  const canMerge = items.length >= 2 && !merging;
  const stage: 0 | 1 | 2 | 3 =
    merging ? 2 : items.length === 0 ? 0 : progress === 100 ? 3 : 1;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Files"
      slug="merge"
      faq={FAQ}
    >
      <div className="space-y-4">
        <ToolSteps stage={stage} labels={[s.stepUpload, s.stepProcess, s.stepDownload]} />
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={{ "application/pdf": [".pdf"] }}
              multiple
              maxFiles={MAX_FILES}
              maxSizeMB={50}
              preview={false}
              helperText={s.dropHint}
              onFiles={handleFiles}
            />
          </CardContent>
        </Card>

        {items.length === 0 && (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title={s.listTitle}
            hint={s.needTwo}
          />
        )}

        {items.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {s.listTitle} ({items.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={merging}>
                  <Trash2 aria-hidden />
                  {s.reset}
                </Button>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {s.dropReorderHint}
              </p>

              <ul className="mt-3 space-y-2">
                {items.map((it, i) => (
                  <li
                    key={it.id}
                    draggable={!merging}
                    onDragStart={() => {
                      dragIndexRef.current = i;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(i);
                    }}
                    onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragIndexRef.current;
                      dragIndexRef.current = null;
                      setDragOver(null);
                      if (from !== null && from !== i) move(from, i);
                    }}
                    onDragEnd={() => {
                      dragIndexRef.current = null;
                      setDragOver(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border bg-white p-2.5 shadow-sm transition-colors dark:bg-zinc-900",
                      dragOver === i
                        ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                        : "border-zinc-200 dark:border-zinc-800",
                      it.failed && "border-red-300 dark:border-red-900",
                    )}
                  >
                    <span
                      className="cursor-grab touch-none text-zinc-400 active:cursor-grabbing"
                      aria-hidden
                    >
                      <GripVertical className="h-5 w-5" />
                    </span>
                    <Badge
                      variant="secondary"
                      className="h-6 w-7 shrink-0 justify-center rounded-lg px-0 font-mono"
                    >
                      {i + 1}
                    </Badge>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {it.file.name}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {formatSize(it.file.size)}
                        {" · "}
                        {it.failed ? (
                          <span className="font-medium text-red-500">{s.invalidPdf}</span>
                        ) : it.pages !== null ? (
                          <span>
                            {it.pages} {s.pagesSuffix}
                          </span>
                        ) : (
                          <Skeleton className="inline-block h-3 w-16 align-middle" />
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => move(i, i - 1)}
                        disabled={merging || i === 0}
                        aria-label={`${s.moveUp}: ${it.file.name}`}
                      >
                        <ArrowUp aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => move(i, i + 1)}
                        disabled={merging || i === items.length - 1}
                        aria-label={`${s.moveDown}: ${it.file.name}`}
                      >
                        <ArrowDown aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAt(i)}
                        disabled={merging}
                        aria-label={`${s.remove}: ${it.file.name}`}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X aria-hidden />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>

              {totalPages > 0 && (
                <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {s.totalLabel}: {items.length} files · {totalPages} {s.pagesSuffix}
                </p>
              )}

              {merging && (
                <div className="mt-4" role="status" aria-label={s.merging}>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {s.merging} {progress}%
                  </p>
                </div>
              )}

              <Button
                onClick={() => void handleMerge()}
                disabled={!canMerge}
                size="lg"
                className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {merging ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Download aria-hidden />
                )}
                {merging ? s.merging : s.merge}
              </Button>
              {!canMerge && !merging && (
                <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {s.needTwo}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
