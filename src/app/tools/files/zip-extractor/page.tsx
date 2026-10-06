"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, FileArchive, Folder, Loader2, PackageOpen, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ZipEntry {
  path: string;
  name: string;
  size: number;
  folder: string | null;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    notZip: string;
    reading: string;
    parsing: string;
    listing: string;
    loadFailed: string;
    emptyZip: string;
    loaded: string;
    tableTitle: string;
    nameCol: string;
    sizeCol: string;
    fileBadge: string;
    perFile: string;
    perFileDone: string;
    perFileFailed: string;
    extractAll: string;
    extractAllDone: string;
    extractAllNote: string;
    summaryFiles: string;
    summaryTotal: string;
    reset: string;
    error: string;
    archiveLabel: string;
  }
> = {
  en: {
    title: "ZIP Extractor",
    description:
      "List and download files inside a ZIP archive without uploading anything. Preview the table, grab single files, or extract all — everything runs locally in your browser.",
    dropHint: "Drop a .zip file here, or click to browse (up to 200 MB)",
    notZip: "Please choose a .zip file.",
    reading: "Reading archive…",
    parsing: "Parsing entries…",
    listing: "Building file list…",
    loadFailed: "Failed to read this ZIP. It may be corrupted or password-protected.",
    emptyZip: "This archive contains no files.",
    loaded: "Archive listed.",
    tableTitle: "Files in the archive",
    nameCol: "Name",
    sizeCol: "Size",
    fileBadge: "file",
    perFile: "Download",
    perFileDone: "File downloaded.",
    perFileFailed: "Failed to download this file.",
    extractAll: "Extract all",
    extractAllDone: "All files downloaded one by one.",
    extractAllNote:
      "Note: browsers download each file separately and may ask permission for multiple downloads — allow it to receive every file.",
    summaryFiles: "files",
    summaryTotal: "Total",
    reset: "Clear",
    error: "Something went wrong.",
    archiveLabel: "Archive",
  },
  id: {
    title: "Ekstrak ZIP",
    description:
      "Lihat dan unduh file di dalam arsip ZIP tanpa mengunggah apa pun. Pratinjau tabel, ambil file satuan, atau ekstrak semua — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan file .zip di sini, atau klik untuk memilih (maks. 200 MB)",
    notZip: "Pilih file .zip.",
    reading: "Membaca arsip…",
    parsing: "Mengurai entri…",
    listing: "Menyusun daftar file…",
    loadFailed: "Gagal membaca ZIP ini. File mungkin rusak atau diproteksi kata sandi.",
    emptyZip: "Arsip ini tidak berisi file.",
    loaded: "Arsip berhasil didaftar.",
    tableTitle: "File dalam arsip",
    nameCol: "Nama",
    sizeCol: "Ukuran",
    fileBadge: "file",
    perFile: "Unduh",
    perFileDone: "File terunduh.",
    perFileFailed: "Gagal mengunduh file ini.",
    extractAll: "Ekstrak semua",
    extractAllDone: "Semua file terunduh satu per satu.",
    extractAllNote:
      "Catatan: browser mengunduh tiap file terpisah dan bisa meminta izin multiple download — izinkan agar semua file diterima.",
    summaryFiles: "file",
    summaryTotal: "Total",
    reset: "Bersihkan",
    error: "Terjadi kesalahan.",
    archiveLabel: "Arsip",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Why does Extract All download files one by one?",
      a: "Browsers cannot save a folder in one click from a web page, so each file is downloaded individually. Your browser may ask permission for multiple downloads — allow it once and every file will land in your download folder.",
    },
    id: {
      q: "Kenapa Ekstrak Semua mengunduh file satu per satu?",
      a: "Browser tidak bisa menyimpan folder dalam sekali klik dari halaman web, jadi tiap file diunduh sendiri-sendiri. Browser bisa meminta izin multiple download — izinkan sekali dan semua file masuk ke folder unduhan.",
    },
  },
  {
    en: {
      q: "What happens to folders and dangerous paths inside the ZIP?",
      a: "Directories are skipped — only real files are listed. On download, any ../ segments and drive prefixes are stripped so entries can never escape into parent folders; folder structure is shown as a badge for context only.",
    },
    id: {
      q: "Bagaimana folder dan path berbahaya di dalam ZIP ditangani?",
      a: "Direktori dilewati — hanya file asli yang didaftar. Saat diunduh, segmen ../ dan prefix drive dibuang sehingga entri tak bisa keluar ke folder induk; struktur folder hanya tampil sebagai badge konteks.",
    },
  },
  {
    en: {
      q: "Are my archives uploaded anywhere?",
      a: "No. Reading the ZIP with JSZip and generating download blobs happen entirely in your browser tab. Nothing leaves your device.",
    },
    id: {
      q: "Apakah arsipku diunggah ke mana pun?",
      a: "Tidak. Membaca ZIP dengan JSZip dan membuat blob unduhan sepenuhnya terjadi di tab browser. Tidak ada yang keluar dari perangkatmu.",
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

function safeFileName(path: string): string {
  try {
    const base = path.split("/").pop() ?? path;
    const cleaned = base.replace(/[\\:*?"<>|]/g, "_").replace(/^\.+/, "").trim();
    return cleaned.length > 0 ? cleaned : "file";
  } catch {
    return "file";
  }
}

function folderOf(path: string): string | null {
  try {
    const idx = path.lastIndexOf("/");
    if (idx <= 0) return null;
    return path.slice(0, idx);
  } catch {
    return null;
  }
}

function yieldToUI(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function entrySize(obj: unknown): number {
  try {
    const data = (obj as { _data?: { uncompressedSize?: unknown } })._data;
    const n = data?.uncompressedSize;
    return typeof n === "number" && Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export default function ZipExtractorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);
  const zipRef = useRef<JSZip | null>(null);

  const [dzKey, setDzKey] = useState(0);
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [busyFile, setBusyFile] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleReset = (): void => {
    try {
      zipRef.current = null;
      setEntries([]);
      setArchiveName(null);
      setStage(null);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleFiles = (files: File[]): void => {
    try {
      const f = files[0];
      setDzKey((k) => k + 1);
      if (!f) return;
      const isZip =
        f.type === "application/zip" ||
        f.type === "application/x-zip-compressed" ||
        f.name.toLowerCase().endsWith(".zip");
      if (!isZip) {
        toast.error(s.notZip);
        return;
      }
      zipRef.current = null;
      setEntries([]);
      setArchiveName(f.name);
      void loadZip(f);
    } catch {
      toast.error(s.error);
    }
  };

  const loadZip = async (file: File): Promise<void> => {
    if (loading) return;
    try {
      setLoading(true);
      setStage(s.reading);
      await yieldToUI();
      const buffer = await file.arrayBuffer();
      if (!mountedRef.current) return;
      setStage(s.parsing);
      await yieldToUI();
      // NOTE: JSZip loadAsync has no progress callback — staged status text
      // (reading → parsing → listing) is shown instead of a fake percentage.
      const zip = await JSZip.loadAsync(buffer);
      if (!mountedRef.current) return;
      setStage(s.listing);
      zipRef.current = zip;
      const out: ZipEntry[] = [];
      const paths = Object.keys(zip.files);
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        if (!p) continue;
        const obj = zip.files[p];
        if (!obj || obj.dir) continue;
        // Size comes from the stored central-directory header — no
        // decompression here; blobs are produced lazily on download.
        out.push({ path: p, name: safeFileName(p), size: entrySize(obj), folder: folderOf(p) });
        if (i % 50 === 0) await yieldToUI();
      }
      if (!mountedRef.current) return;
      if (out.length === 0) {
        toast.error(s.emptyZip);
        setEntries([]);
      } else {
        setEntries(out);
        toast.success(s.loaded);
      }
    } catch {
      if (mountedRef.current) {
        toast.error(s.loadFailed);
        zipRef.current = null;
        setEntries([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setStage(null);
      }
    }
  };

  const downloadBlob = (blob: Blob, name: string): void => {
    try {
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }, 4000);
      }
    } catch {
      toast.error(s.error);
    }
  };

  const handleSingle = async (entry: ZipEntry): Promise<void> => {
    if (!zipRef.current || busyFile) return;
    try {
      setBusyFile(entry.path);
      const obj = zipRef.current.files[entry.path];
      if (!obj || obj.dir) throw new Error("missing-entry");
      const blob = (await obj.async("blob")) as Blob;
      downloadBlob(blob, entry.name);
      toast.success(s.perFileDone);
    } catch {
      toast.error(s.perFileFailed);
    } finally {
      setBusyFile(null);
    }
  };

  const handleExtractAll = async (): Promise<void> => {
    if (!zipRef.current || extracting || entries.length === 0) return;
    try {
      setExtracting(true);
      for (const entry of entries) {
        try {
          const obj = zipRef.current?.files[entry.path];
          if (!obj || obj.dir) continue;
          const blob = (await obj.async("blob")) as Blob;
          downloadBlob(blob, entry.name);
          await new Promise((r) => setTimeout(r, 250));
        } catch {
          toast.error(`${entry.name}: ${s.perFileFailed}`);
        }
      }
      toast.success(s.extractAllDone);
    } catch {
      toast.error(s.error);
    } finally {
      setExtracting(false);
    }
  };

  const totalBytes = entries.reduce((acc, e) => acc + e.size, 0);

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileOutput"
      slug="files/zip-extractor"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={[".zip"]}
              multiple={false}
              maxSizeMB={200}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />

            {loading && stage && (
              <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {stage}
              </p>
            )}

            {entries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {archiveName && (
                  <Badge variant="secondary" className="max-w-full truncate font-mono">
                    {s.archiveLabel}: {archiveName}
                  </Badge>
                )}
                <Badge variant="secondary" className="font-mono">
                  {entries.length} {s.summaryFiles}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {s.summaryTotal}: {formatSize(totalBytes)}
                </Badge>
              </div>
            )}

            {entries.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleExtractAll()}
                  disabled={extracting}
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {extracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <PackageOpen className="h-4 w-4" aria-hidden />
                  )}
                  {s.extractAll} ({entries.length})
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {s.reset}
                </Button>
              </div>
            )}
            {entries.length > 0 && (
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.extractAllNote}
              </p>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-2 p-4 sm:p-6">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.tableTitle}
              </p>
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li
                    key={e.path}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <FileArchive className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {e.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono">{formatSize(e.size)}</span>
                        {e.folder && (
                          <Badge variant="secondary" className="max-w-full truncate font-mono text-[11px]">
                            <Folder className="mr-1 h-3 w-3" aria-hidden />
                            {e.folder}
                          </Badge>
                        )}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleSingle(e)}
                      disabled={busyFile !== null || extracting}
                      className="shrink-0"
                    >
                      {busyFile === e.path ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden />
                      )}
                      {s.perFile}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
