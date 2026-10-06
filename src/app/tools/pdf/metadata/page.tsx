"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MetaKey = "title" | "author" | "subject" | "keywords" | "creator" | "producer";

const META_KEYS: MetaKey[] = ["title", "author", "subject", "keywords", "creator", "producer"];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    dropHint: string;
    invalidType: string;
    invalidPdf: string;
    encryptedPdf: (name: string) => string;
    fileLabel: string;
    removeFile: string;
    reset: string;
    loading: string;
    saving: string;
    currentTitle: string;
    editTitle: string;
    fieldName: (k: MetaKey) => string;
    fieldPlaceholder: (k: MetaKey) => string;
    emptyHint: string;
    apply: string;
    applySuccess: string;
    applyFailed: string;
    noFile: string;
    error: string;
    pagesUnit: string;
    statPages: string;
    statSize: string;
    notSet: string;
  }
> = {
  en: {
    title: "PDF Metadata",
    description:
      "Read and edit PDF title, author, subject, keywords, creator, and producer. Everything runs locally in your browser.",
    descriptionId:
      "Baca dan ubah judul, penulis, subjek, kata kunci, kreator, dan produser PDF. Semua berjalan lokal di browser.",
    dropHint: "Drop a PDF file here, or click to browse",
    invalidType: "is not a PDF and was skipped.",
    invalidPdf: "could not be read as a valid PDF.",
    encryptedPdf: (name) =>
      `Could not open "${name}" — it is encrypted or password-protected. Remove the password first, then try again.`,
    fileLabel: "Selected file",
    removeFile: "Remove file",
    reset: "Start over",
    loading: "Reading metadata...",
    saving: "Saving...",
    currentTitle: "Current metadata",
    editTitle: "Edit metadata",
    fieldName: (k) =>
      ({ title: "Title", author: "Author", subject: "Subject", keywords: "Keywords", creator: "Creator", producer: "Producer" })[k],
    fieldPlaceholder: (k) =>
      ({ title: "e.g. Annual Report 2026", author: "e.g. Jane Doe", subject: "e.g. Finance", keywords: "e.g. report, finance, 2026", creator: "e.g. AIOTools", producer: "e.g. pdf-lib" })[k],
    emptyHint: "Leave a field empty to clear it.",
    apply: "Download with new metadata",
    applySuccess: "Metadata saved — downloaded as metadata.pdf.",
    applyFailed: "Failed to save metadata. The file may be corrupted or encrypted.",
    noFile: "Select a PDF file first.",
    error: "Something went wrong.",
    pagesUnit: "pages",
    statPages: "Pages",
    statSize: "File size",
    notSet: "Not set",
  },
  id: {
    title: "Metadata PDF",
    description:
      "Baca dan ubah judul, penulis, subjek, kata kunci, kreator, dan produser PDF. Semua berjalan lokal di browser.",
    descriptionId:
      "Baca dan ubah judul, penulis, subjek, kata kunci, kreator, dan produser PDF. Semua berjalan lokal di browser.",
    dropHint: "Letakkan file PDF di sini, atau klik untuk memilih",
    invalidType: "bukan PDF dan dilewati.",
    invalidPdf: "tidak dapat dibaca sebagai PDF yang valid.",
    encryptedPdf: (name) =>
      `Tidak dapat membuka "${name}" — file terenkripsi atau diproteksi kata sandi. Hapus kata sandinya dulu, lalu coba lagi.`,
    fileLabel: "File terpilih",
    removeFile: "Hapus file",
    reset: "Mulai ulang",
    loading: "Membaca metadata...",
    saving: "Menyimpan...",
    currentTitle: "Metadata saat ini",
    editTitle: "Ubah metadata",
    fieldName: (k) =>
      ({ title: "Judul", author: "Penulis", subject: "Subjek", keywords: "Kata kunci", creator: "Kreator", producer: "Produser" })[k],
    fieldPlaceholder: (k) =>
      ({ title: "mis. Laporan Tahunan 2026", author: "mis. Jane Doe", subject: "mis. Keuangan", keywords: "mis. laporan, keuangan, 2026", creator: "mis. AIOTools", producer: "mis. pdf-lib" })[k],
    emptyHint: "Kosongkan kolom untuk menghapus nilainya.",
    apply: "Unduh dengan metadata baru",
    applySuccess: "Metadata tersimpan — diunduh sebagai metadata.pdf.",
    applyFailed: "Gagal menyimpan metadata. File mungkin rusak atau terenkripsi.",
    noFile: "Pilih file PDF terlebih dahulu.",
    error: "Terjadi kesalahan.",
    pagesUnit: "halaman",
    statPages: "Halaman",
    statSize: "Ukuran file",
    notSet: "Belum diatur",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What is PDF metadata?",
      a: "Six text fields embedded in every PDF: title, author, subject, keywords, creator, and producer. Readers, search engines, and libraries use them to identify and organize documents.",
    },
    id: {
      q: "Apa itu metadata PDF?",
      a: "Enam kolom teks yang tertanam di setiap PDF: judul, penulis, subjek, kata kunci, kreator, dan produser. Aplikasi pembaca, mesin pencari, dan pustaka memakainya untuk mengenali dan mengorganisasi dokumen.",
    },
  },
  {
    en: {
      q: "How do I clear a field?",
      a: "Leave its input empty and press Download with new metadata. Empty inputs are written as empty values, so the old text is removed from the saved file.",
    },
    id: {
      q: "Bagaimana cara menghapus sebuah kolom?",
      a: "Kosongkan inputnya lalu tekan Unduh dengan metadata baru. Input kosong ditulis sebagai nilai kosong, sehingga teks lama terhapus dari file hasil.",
    },
  },
  {
    en: {
      q: "Is my PDF uploaded to a server?",
      a: "No. Reading and writing metadata uses pdf-lib entirely on your device. Your document never leaves your browser.",
    },
    id: {
      q: "Apakah PDF saya diunggah ke server?",
      a: "Tidak. Membaca dan menulis metadata memakai pdf-lib sepenuhnya di perangkatmu. Dokumen tidak pernah meninggalkan browser.",
    },
  },
  {
    en: {
      q: "Does editing metadata change my content?",
      a: "No. Only the six document-info fields are rewritten — pages, text, images, and fonts are copied over untouched.",
    },
    id: {
      q: "Apakah mengubah metadata mengubah isi dokumen?",
      a: "Tidak. Hanya enam kolom info-dokumen yang ditulis ulang — halaman, teks, gambar, dan font disalin apa adanya.",
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

interface CurrentMeta {
  pages: number;
  size: number;
  values: Record<MetaKey, string>;
}

export default function PdfMetadataPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);

  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [current, setCurrent] = useState<CurrentMeta | null>(null);
  const [draft, setDraft] = useState<Record<MetaKey, string>>({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const readMeta = (doc: PDFDocument, size: number): CurrentMeta => {
    let values: Record<MetaKey, string>;
    try {
      values = {
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: doc.getKeywords() ?? "",
        creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
      };
    } catch {
      values = { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" };
    }
    let pages = 0;
    try {
      pages = doc.getPageCount();
    } catch {
      pages = 0;
    }
    return { pages, size, values };
  };

  const loadFile = async (picked: File): Promise<void> => {
    setLoading(true);
    setCurrent(null);
    try {
      const bytes = await picked.arrayBuffer();
      if (!mountedRef.current) return;
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        if (!mountedRef.current) return;
        toast.error(s.encryptedPdf(picked.name));
        setFile(null);
        setDzKey((k) => k + 1);
        return;
      }
      if (doc.getPageCount() === 0) throw new Error(s.invalidPdf);
      const meta = readMeta(doc, picked.size);
      if (!mountedRef.current) return;
      setCurrent(meta);
      setDraft({ ...meta.values });
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error && err.message ? ` ${err.message}` : "";
      toast.error(`${picked.name} ${s.invalidPdf}${msg}`);
      setFile(null);
      setCurrent(null);
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
      setCurrent(null);
      setDraft({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
      setSaving(false);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!file || saving) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setSaving(true);
    try {
      const bytes = await file.arrayBuffer();
      if (!mountedRef.current) return;
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        toast.error(s.encryptedPdf(file.name));
        return;
      }
      try {
        doc.setTitle(draft.title);
        doc.setAuthor(draft.author);
        doc.setSubject(draft.subject);
        doc.setKeywords(draft.keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean));
        doc.setCreator(draft.creator);
        doc.setProducer(draft.producer);
      } catch {
        toast.error(s.applyFailed);
        return;
      }
      const saved = await doc.save();
      if (!mountedRef.current) return;
      const buf = new ArrayBuffer(saved.byteLength);
      new Uint8Array(buf).set(saved);
      const blob = new Blob([buf], { type: "application/pdf" });
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
        a.download = "metadata.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error(s.applyFailed);
        return;
      }
      setCurrent(readMeta(doc, file.size));
      toast.success(s.applySuccess);
    } catch {
      if (mountedRef.current) toast.error(s.applyFailed);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const busy = loading || saving;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="Tags"
      slug="pdf/metadata"
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
                    {current ? ` · ${current.pages} ${s.pagesUnit}` : ""}
                  </span>
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

        {current && (
          <>
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.currentTitle}</h2>
                <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {s.statPages}
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {current.pages}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {s.statSize}
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatSize(current.size)}
                    </dd>
                  </div>
                  {META_KEYS.map((k) => (
                    <div key={k} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        {s.fieldName(k)}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm text-zinc-900 dark:text-zinc-100">
                        {current.values[k] || <span className="italic text-zinc-400">{s.notSet}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.editTitle}</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.emptyHint}</p>
                <div className="mt-3 space-y-3">
                  {META_KEYS.map((k) => (
                    <label key={k} className="block">
                      <span className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {s.fieldName(k)}
                      </span>
                      <Input
                        value={draft[k]}
                        onChange={(e) => {
                          try {
                            const v = e.target.value;
                            setDraft((prev) => ({ ...prev, [k]: v }));
                          } catch {
                            toast.error(s.error);
                          }
                        }}
                        placeholder={s.fieldPlaceholder(k)}
                        disabled={busy}
                        className="w-full"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => void handleSave()}
                    disabled={busy}
                    size="lg"
                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  >
                    {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                    {saving ? s.saving : s.apply}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleReset} disabled={busy}>
                    <X aria-hidden />
                    {s.reset}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
