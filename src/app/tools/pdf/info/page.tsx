"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Check, Copy, Download, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";

interface PdfInfo {
  fileName: string;
  pages: number;
  size: number;
  version: string;
  encrypted: boolean;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  created: string;
  modified: string;
}

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    loading: string;
    error: string;
    pagesUnit: string;
    labelPages: string;
    labelSize: string;
    labelVersion: string;
    labelEncrypted: string;
    labelTitle: string;
    labelAuthor: string;
    labelSubject: string;
    labelCreator: string;
    labelProducer: string;
    labelCreated: string;
    labelModified: string;
    yes: string;
    no: string;
    notSet: string;
    unknown: string;
    copyAll: string;
    copied: string;
    copyFailed: string;
    downloadTxt: string;
    downloaded: string;
    encryptedNote: string;
  }
> = {
  en: {
    title: "PDF Info",
    description:
      "Pages, version, encryption, and metadata at a glance. Copy the summary or download it as text — everything runs locally in your browser.",
    descriptionId:
      "Halaman, versi, enkripsi, dan metadata sekilas. Salin ringkasan atau unduh sebagai teks — semua berjalan lokal di browser.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Reading document info...",
    error: "Something went wrong.",
    pagesUnit: "pages",
    labelPages: "Pages",
    labelSize: "File size",
    labelVersion: "PDF version",
    labelEncrypted: "Encrypted",
    labelTitle: "Title",
    labelAuthor: "Author",
    labelSubject: "Subject",
    labelCreator: "Creator",
    labelProducer: "Producer",
    labelCreated: "Created",
    labelModified: "Modified",
    yes: "Yes",
    no: "No",
    notSet: "Not set",
    unknown: "Unknown",
    copyAll: "Copy summary",
    copied: "Summary copied to clipboard.",
    copyFailed: "Failed to copy. Select and copy the text manually.",
    downloadTxt: "Download .txt",
    downloaded: "Info downloaded as pdf-info.txt.",
    encryptedNote: "This PDF is password-protected. Only basic info (size, version) could be read.",
  },
  id: {
    title: "Info PDF",
    description:
      "Halaman, versi, enkripsi, dan metadata sekilas. Salin ringkasan atau unduh sebagai teks — semua berjalan lokal di browser.",
    descriptionId:
      "Halaman, versi, enkripsi, dan metadata sekilas. Salin ringkasan atau unduh sebagai teks — semua berjalan lokal di browser.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Membaca info dokumen...",
    error: "Terjadi kesalahan.",
    pagesUnit: "halaman",
    labelPages: "Halaman",
    labelSize: "Ukuran file",
    labelVersion: "Versi PDF",
    labelEncrypted: "Terenkripsi",
    labelTitle: "Judul",
    labelAuthor: "Penulis",
    labelSubject: "Subjek",
    labelCreator: "Kreator",
    labelProducer: "Produser",
    labelCreated: "Dibuat",
    labelModified: "Diubah",
    yes: "Ya",
    no: "Tidak",
    notSet: "Belum diatur",
    unknown: "Tidak diketahui",
    copyAll: "Salin ringkasan",
    copied: "Ringkasan disalin ke clipboard.",
    copyFailed: "Gagal menyalin. Pilih dan salin teks secara manual.",
    downloadTxt: "Unduh .txt",
    downloaded: "Info diunduh sebagai pdf-info.txt.",
    encryptedNote: "PDF ini diproteksi kata sandi. Hanya info dasar (ukuran, versi) yang bisa dibaca.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How do you detect the PDF version and encryption?",
      a: "The version comes from the %PDF-x.y header bytes at the start of the file. Encryption is probed by trying a normal load first — if that fails but a password-bypass load succeeds, the file is encrypted.",
    },
    id: {
      q: "Bagaimana versi dan enkripsi PDF dideteksi?",
      a: "Versi dibaca dari byte header %PDF-x.y di awal file. Enkripsi diuji dengan mencoba load normal dulu — jika gagal tetapi load bypass kata sandi berhasil, file berarti terenkripsi.",
    },
  },
  {
    en: {
      q: "Why are some fields “Not set”?",
      a: "Metadata fields are optional — many tools only write Producer and dates. If a field was never filled in, there is nothing to display. Use the PDF Metadata tool to add missing values.",
    },
    id: {
      q: "Mengapa beberapa kolom “Belum diatur”?",
      a: "Kolom metadata bersifat opsional — banyak tool hanya menulis Produser dan tanggal. Jika kolom tidak pernah diisi, tidak ada yang bisa ditampilkan. Gunakan tool Metadata PDF untuk menambahkan nilai yang hilang.",
    },
  },
  {
    en: {
      q: "Is my PDF uploaded to a server?",
      a: "No. All inspection runs on your device with pdf-lib. Your document never leaves your browser — the summary copy and .txt download are generated locally too.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Semua pemeriksaan berjalan di perangkatmu dengan pdf-lib. Dokumen tidak pernah meninggalkan browser — salinan ringkasan dan unduhan .txt juga dibuat secara lokal.",
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

function formatDate(d: Date | undefined): string {
  try {
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function readVersion(bytes: ArrayBuffer): string {
  try {
    const head = new TextDecoder("latin1").decode(bytes.slice(0, 16));
    const m = /%PDF-(\d\.\d)/.exec(head);
    return m?.[1] ?? "";
  } catch {
    return "";
  }
}

export default function PdfInfoPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const buildSummary = (i: PdfInfo): string => {
    const v = (label: string, value: string | number): string => `${label}: ${value}`;
    return [
      `PDF Info — ${i.fileName}`,
      v(s.labelPages, i.encrypted ? s.unknown : String(i.pages)),
      v(s.labelSize, formatSize(i.size)),
      v(s.labelVersion, i.version || s.unknown),
      v(s.labelEncrypted, i.encrypted ? s.yes : s.no),
      v(s.labelTitle, i.title || s.notSet),
      v(s.labelAuthor, i.author || s.notSet),
      v(s.labelSubject, i.subject || s.notSet),
      v(s.labelCreator, i.creator || s.notSet),
      v(s.labelProducer, i.producer || s.notSet),
      v(s.labelCreated, i.created || s.unknown),
      v(s.labelModified, i.modified || s.unknown),
    ].join("\n");
  };

  const loadFile = async (picked: File): Promise<void> => {
    setLoading(true);
    setInfo(null);
    setCopied(false);
    try {
      const bytes = await picked.arrayBuffer();
      if (!mountedRef.current) return;
      const version = readVersion(bytes);
      let doc: PDFDocument | null = null;
      let encrypted = false;
      try {
        doc = await PDFDocument.load(bytes);
      } catch {
        try {
          doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          encrypted = true;
        } catch {
          if (!mountedRef.current) return;
          toast.error(`${picked.name} ${s.invalidPdf}`);
          setFile(null);
          setDzKey((k) => k + 1);
          return;
        }
      }
      if (!doc || doc.getPageCount() === 0) throw new Error(s.invalidPdf);
      let title = "";
      let author = "";
      let subject = "";
      let creator = "";
      let producer = "";
      let created = "";
      let modified = "";
      let pages = 0;
      try {
        pages = doc.getPageCount();
        title = doc.getTitle() ?? "";
        author = doc.getAuthor() ?? "";
        subject = doc.getSubject() ?? "";
        creator = doc.getCreator() ?? "";
        producer = doc.getProducer() ?? "";
        created = formatDate(doc.getCreationDate());
        modified = formatDate(doc.getModificationDate());
      } catch {
        // keep whatever was read; encrypted docs may throw on metadata access
      }
      if (!mountedRef.current) return;
      setInfo({
        fileName: picked.name,
        pages,
        size: picked.size,
        version,
        encrypted,
        title,
        author,
        subject,
        creator,
        producer,
        created,
        modified,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error && err.message ? ` ${err.message}` : "";
      toast.error(`${picked.name} ${s.invalidPdf}${msg}`);
      setFile(null);
      setInfo(null);
      setDzKey((k) => k + 1);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
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
      void loadFile(picked);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReset = (): void => {
    try {
      setFile(null);
      setInfo(null);
      setCopied(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(buildSummary(info));
      if (!mountedRef.current) return;
      setCopied(true);
      toast.success(s.copied);
      window.setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 2500);
    } catch {
      toast.error(s.copyFailed);
    }
  };

  const handleDownloadTxt = (): void => {
    if (!info) return;
    try {
      const blob = new Blob([buildSummary(info)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "pdf-info.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.error);
        return;
      }
      toast.success(s.downloaded);
    } catch {
      toast.error(s.error);
    }
  };

  const stat = (
    label: string,
    value: React.ReactNode,
    opts?: { mono?: boolean; empty?: boolean },
  ): React.JSX.Element => (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd
        className={
          opts?.mono
            ? "mt-0.5 break-words font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100"
            : "mt-0.5 break-words text-sm text-zinc-900 dark:text-zinc-100"
        }
      >
        {opts?.empty ? <span className="italic text-zinc-400">{value}</span> : value}
      </dd>
    </div>
  );

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="Info"
      slug="pdf/info"
      faq={FAQ}
    >
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
                    {info && !info.encrypted ? ` · ${info.pages} ${s.pagesUnit}` : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={loading}
                  aria-label={`${s.removeFile}: ${file.name}`}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X aria-hidden />
                </Button>
              </div>
            )}

            {loading && (
              <p role="status" className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {s.loading}
              </p>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              100% processed in your browser. Files never leave your device.
            </p>
          </CardContent>
        </Card>

        {info && (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-6">
              {info.encrypted && (
                <p
                  role="note"
                  className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 sm:text-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                >
                  {s.encryptedNote}
                </p>
              )}
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stat(
                  s.labelPages,
                  info.encrypted ? (
                    s.unknown
                  ) : (
                    <AnimatedNumber value={info.pages} className="font-mono font-bold" />
                  ),
                  { mono: true },
                )}
                {stat(s.labelSize, formatSize(info.size), { mono: true })}
                {stat(s.labelVersion, info.version ? `PDF ${info.version}` : s.unknown, { mono: true })}
                {stat(s.labelEncrypted, info.encrypted ? s.yes : s.no, { mono: true })}
                {stat(s.labelTitle, info.title || s.notSet, { empty: !info.title })}
                {stat(s.labelAuthor, info.author || s.notSet, { empty: !info.author })}
                {stat(s.labelSubject, info.subject || s.notSet, { empty: !info.subject })}
                {stat(s.labelCreator, info.creator || s.notSet, { empty: !info.creator })}
                {stat(s.labelProducer, info.producer || s.notSet, { empty: !info.producer })}
                {stat(s.labelCreated, info.created || s.unknown)}
                {stat(s.labelModified, info.modified || s.unknown)}
              </dl>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void handleCopy()}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {s.copyAll}
                </Button>
                <Button onClick={handleDownloadTxt} size="lg" className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                  <Download aria-hidden />
                  {s.downloadTxt}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
