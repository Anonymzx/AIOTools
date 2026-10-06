"use client";

import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, Loader2, Package, Trash2, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TOTAL_CAP = 200 * 1024 * 1024;
const MAX_FILES = 50;

type Compression = "store" | "fast" | "best";

interface ZipItem {
  id: string;
  file: File;
  name: string;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    listTitle: string;
    capReached: string;
    capNote: string;
    capLabel: string;
    renameLabel: string;
    renamePlaceholder: string;
    sanitizedNote: string;
    emptyName: string;
    needOne: string;
    compressionLabel: string;
    storeLabel: string;
    storeDesc: string;
    fastLabel: string;
    fastDesc: string;
    bestLabel: string;
    bestDesc: string;
    zipNameLabel: string;
    generate: string;
    generating: string;
    success: string;
    generateFailed: string;
    reset: string;
    error: string;
    remove: string;
    totalLabel: string;
    filesLabel: string;
  }
> = {
  en: {
    title: "ZIP Maker",
    description:
      "Bundle any files into a single ZIP archive. Rename entries, pick a compression level, and name your archive — everything runs locally in your browser.",
    dropHint: "Drop any files here, or click to browse (200 MB total cap)",
    listTitle: "Files in the archive",
    capReached: "200 MB total cap reached — extra files were skipped.",
    capNote: "Total size across all files may not exceed 200 MB.",
    capLabel: "of 200 MB used",
    renameLabel: "Archive name",
    renamePlaceholder: "archive/folder/file.zip",
    sanitizedNote: "/ and \\ are replaced with _; empty names fall back to the original.",
    emptyName: "Name cannot be empty — reverted.",
    needOne: "Add at least 1 file to build a ZIP.",
    compressionLabel: "Compression",
    storeLabel: "Store",
    storeDesc: "No compression, fastest",
    fastLabel: "Fast",
    fastDesc: "Quick DEFLATE",
    bestLabel: "Best",
    bestDesc: "Smallest DEFLATE",
    zipNameLabel: "ZIP file name",
    generate: "Generate ZIP",
    generating: "Compressing…",
    success: "ZIP archive ready.",
    generateFailed: "Failed to build the ZIP.",
    reset: "Clear all",
    error: "Something went wrong.",
    remove: "Remove file",
    totalLabel: "Total",
    filesLabel: "files",
  },
  id: {
    title: "Pembuat ZIP",
    description:
      "Gabung file apa pun menjadi satu arsip ZIP. Ganti nama entri, pilih level kompresi, dan beri nama arsipmu — semuanya berjalan lokal di browser.",
    dropHint: "Letakkan file apa pun di sini, atau klik untuk memilih (batas total 200 MB)",
    listTitle: "File dalam arsip",
    capReached: "Batas total 200 MB tercapai — file berlebih dilewati.",
    capNote: "Total ukuran semua file tidak boleh melebihi 200 MB.",
    capLabel: "dari 200 MB terpakai",
    renameLabel: "Nama arsip",
    renamePlaceholder: "arsip/folder/file.zip",
    sanitizedNote: "/ dan \\ diganti dengan _; nama kosong kembali ke aslinya.",
    emptyName: "Nama tidak boleh kosong — dikembalikan.",
    needOne: "Tambahkan minimal 1 file untuk membuat ZIP.",
    compressionLabel: "Kompresi",
    storeLabel: "Simpan",
    storeDesc: "Tanpa kompresi, tercepat",
    fastLabel: "Cepat",
    fastDesc: "DEFLATE cepat",
    bestLabel: "Terbaik",
    bestDesc: "DEFLATE terkecil",
    zipNameLabel: "Nama file ZIP",
    generate: "Buat ZIP",
    generating: "Mengompresi…",
    success: "Arsip ZIP siap.",
    generateFailed: "Gagal membuat ZIP.",
    reset: "Hapus semua",
    error: "Terjadi kesalahan.",
    remove: "Hapus file",
    totalLabel: "Total",
    filesLabel: "file",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Which compression level should I choose?",
      a: "Store writes files as-is — fastest, but the ZIP is no smaller. Fast applies light DEFLATE for a good speed/size balance. Best squeezes the smallest size but takes longer. For already-compressed files (JPG, MP4, PDF) all three give similar sizes, so prefer Store or Fast.",
    },
    id: {
      q: "Level kompresi mana yang harus dipilih?",
      a: "Store menulis file apa adanya — tercepat, tapi ZIP tidak lebih kecil. Fast memakai DEFLATE ringan untuk keseimbangan kecepatan/ukuran. Best menghasilkan ukuran terkecil tapi lebih lama. Untuk file yang sudah terkompresi (JPG, MP4, PDF) ketiganya mirip, jadi pilih Store atau Fast.",
    },
  },
  {
    en: {
      q: "Why are slashes removed from rename entries?",
      a: "A slash inside a ZIP entry creates subfolders, which can surprise recipients or enable path tricks on extraction. Slashes are replaced with underscores so every entry stays a flat, predictable file name.",
    },
    id: {
      q: "Kenapa garis miring dihapus dari nama entri?",
      a: "Garis miring di dalam entri ZIP membuat subfolder, yang bisa mengejutkan penerima atau disalahgunakan saat ekstraksi. Garis miring diganti garis bawah agar tiap entri tetap nama file datar yang terprediksi.",
    },
  },
  {
    en: {
      q: "Are my files uploaded anywhere?",
      a: "No. Reading files and building the ZIP with JSZip happen entirely in your browser tab. Nothing leaves your device.",
    },
    id: {
      q: "Apakah file-ku diunggah ke mana pun?",
      a: "Tidak. Membaca file dan membuat ZIP dengan JSZip sepenuhnya terjadi di tab browser. Tidak ada yang keluar dari perangkatmu.",
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

function sanitizeEntry(name: string, fallback: string): string {
  try {
    const cleaned = name.replace(/[\\/]/g, "_").trim();
    return cleaned.length > 0 ? cleaned : fallback;
  } catch {
    return fallback;
  }
}

export default function ZipMakerPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [items, setItems] = useState<ZipItem[]>([]);
  const [compression, setCompression] = useState<Compression>("best");
  const [zipName, setZipName] = useState("archive.zip");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalBytes = items.reduce((acc, it) => acc + it.file.size, 0);

  const handleFiles = (files: File[]): void => {
    try {
      setItems((prev) => {
        try {
          let used = prev.reduce((acc, it) => acc + it.file.size, 0);
          const next = [...prev];
          for (const f of files) {
            if (next.length >= MAX_FILES) break;
            if (used + f.size > TOTAL_CAP) {
              toast.error(s.capReached);
              break;
            }
            used += f.size;
            next.push({
              id: `${f.name}-${f.size}-${Date.now()}-${next.length}`,
              file: f,
              name: f.name,
            });
          }
          return next;
        } catch {
          toast.error(s.error);
          return prev;
        }
      });
    } catch {
      toast.error(s.error);
    }
  };

  const rename = (id: string, value: string): void => {
    try {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: value } : it)));
    } catch {
      toast.error(s.error);
    }
  };

  const commitRename = (id: string): void => {
    try {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const clean = it.name.replace(/[\\/]/g, "_").trim();
          if (clean.length === 0) {
            toast.error(s.emptyName);
            return { ...it, name: it.file.name };
          }
          return { ...it, name: clean };
        }),
      );
    } catch {
      toast.error(s.error);
    }
  };

  const removeAt = (id: string): void => {
    try {
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setItems([]);
      setProgress(0);
    } catch {
      toast.error(s.error);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (busy) return;
    try {
      if (items.length === 0) {
        toast.error(s.needOne);
        return;
      }
      setBusy(true);
      setProgress(0);
      const zip = new JSZip();
      const usedNames = new Set<string>();
      for (const it of items) {
        let name = sanitizeEntry(it.name, it.file.name);
        if (usedNames.has(name)) {
          let k = 1;
          const dot = name.lastIndexOf(".");
          const base = dot > 0 ? name.slice(0, dot) : name;
          const ext = dot > 0 ? name.slice(dot) : "";
          while (usedNames.has(`${base} (${k})${ext}`)) k++;
          name = `${base} (${k})${ext}`;
        }
        usedNames.add(name);
        zip.file(name, it.file);
      }
      const opts =
        compression === "store"
          ? { type: "blob" as const, compression: "STORE" as const }
          : {
              type: "blob" as const,
              compression: "DEFLATE" as const,
              compressionOptions: { level: compression === "fast" ? 1 : 9 },
            };
      const blob = await zip.generateAsync(opts, (meta) => {
        try {
          setProgress(Math.round(meta.percent));
        } catch {
          // ignore progress errors
        }
      });
      let outName = zipName.replace(/[\\/]/g, "_").trim() || "archive.zip";
      if (!outName.toLowerCase().endsWith(".zip")) outName += ".zip";
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(s.success);
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
      toast.error(s.generateFailed);
    } finally {
      setBusy(false);
    }
  };

  const pct = Math.min(100, Math.round((totalBytes / TOTAL_CAP) * 100));

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Files"
      slug="files/zip-maker"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FileDropzone
              multiple
              maxSizeMB={200}
              maxFiles={MAX_FILES}
              onFiles={handleFiles}
              helperText={s.dropHint}
            />

            <div
              role="meter"
              aria-valuenow={totalBytes}
              aria-valuemin={0}
              aria-valuemax={TOTAL_CAP}
              aria-label={s.capLabel}
              className="space-y-1"
            >
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {formatSize(totalBytes)} / 200 MB ({pct}%) · {items.length} {s.filesLabel}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.capNote}</p>
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.listTitle}{" "}
                  <Badge variant="secondary" className="font-mono">
                    {items.length}
                  </Badge>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.sanitizedNote}</p>
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <Package className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 space-y-1">
                        <input
                          value={it.name}
                          onChange={(e) => rename(it.id, e.target.value)}
                          onBlur={() => commitRename(it.id)}
                          aria-label={`${s.renameLabel}: ${it.file.name}`}
                          spellCheck={false}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {it.file.name} · {formatSize(it.file.size)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAt(it.id)}
                        aria-label={`${s.remove}: ${it.file.name}`}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="zip-comp"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.compressionLabel}
                </label>
                <select
                  id="zip-comp"
                  value={compression}
                  onChange={(e) => {
                    try {
                      const v = e.target.value;
                      setCompression(v === "store" ? "store" : v === "fast" ? "fast" : "best");
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="store">
                    {s.storeLabel} — {s.storeDesc}
                  </option>
                  <option value="fast">
                    {s.fastLabel} — {s.fastDesc}
                  </option>
                  <option value="best">
                    {s.bestLabel} — {s.bestDesc}
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="zip-name"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.zipNameLabel}
                </label>
                <input
                  id="zip-name"
                  value={zipName}
                  onChange={(e) => {
                    try {
                      setZipName(e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.renamePlaceholder}
                  spellCheck={false}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>

            {busy && (
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="space-y-1"
              >
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{progress}%</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleGenerate()}
                disabled={busy || items.length === 0}
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {s.generating} {progress}%
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" aria-hidden />
                    {s.generate} ({items.length})
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={busy}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.reset}
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Download className="h-3.5 w-3.5" aria-hidden />
              {s.totalLabel}: {formatSize(totalBytes)}
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
