"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Download,
  Eraser,
  FileCode2,
  ImagePlus,
  LockKeyhole,
  TriangleAlert,
} from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tab = "text" | "image";

const BASE64_RE = /^[A-Za-z0-9+/=\s]+$/;
const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+);base64,/i;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    textTab: string;
    imageTab: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    outputPlaceholder: string;
    encode: string;
    decode: string;
    copy: string;
    copied: string;
    clear: string;
    swap: string;
    invalidBase64: string;
    emptyInput: string;
    encodeOk: string;
    decodeOk: string;
    inputSize: string;
    outputSize: string;
    dropHint: string;
    imagePreview: string;
    copyString: string;
    copyDataUri: string;
    fileSize: string;
    stringSize: string;
    reverseLabel: string;
    reversePlaceholder: string;
    reversePreview: string;
    invalidDataUrl: string;
    downloadFile: string;
    decodeImageOk: string;
    error: string;
  }
> = {
  en: {
    title: "Base64 Encoder / Decoder",
    description:
      "Encode text or images to Base64 and decode it back. Large inputs are chunked so the tab never freezes — everything runs locally in your browser.",
    textTab: "Text",
    imageTab: "Image",
    inputLabel: "Input",
    inputPlaceholder: "Type or paste text here — or a Base64 string to decode…",
    outputLabel: "Output",
    outputPlaceholder: "Result appears here…",
    encode: "Encode",
    decode: "Decode",
    copy: "Copy",
    copied: "Copied to clipboard.",
    clear: "Clear",
    swap: "Swap",
    invalidBase64:
      "Invalid Base64: only A–Z, a–z, 0–9, +, /, = (and whitespace) are allowed, length must be a multiple of 4.",
    emptyInput: "Enter something first.",
    encodeOk: "Encoded to Base64.",
    decodeOk: "Decoded from Base64.",
    inputSize: "Input",
    outputSize: "Output",
    dropHint: "Drop an image here, or click to browse (any image type)",
    imagePreview: "Encoded image preview",
    copyString: "Copy String",
    copyDataUri: "Copy Data URI",
    fileSize: "File",
    stringSize: "Base64",
    reverseLabel: "Or paste a Data URI to decode",
    reversePlaceholder: "Paste data:image/png;base64,iVBORw0… here",
    reversePreview: "Decoded image preview",
    invalidDataUrl: "Invalid Data URI: it must start with data:<mime>;base64,",
    downloadFile: "Download file",
    decodeImageOk: "Data URI decoded.",
    error: "Something went wrong.",
  },
  id: {
    title: "Base64 Encoder / Decoder",
    description:
      "Encode teks atau gambar ke Base64 dan decode kembali. Input besar diproses bertahap agar tab tidak macet — semuanya berjalan lokal di browser.",
    textTab: "Teks",
    imageTab: "Gambar",
    inputLabel: "Masukan",
    inputPlaceholder: "Ketik atau tempel teks di sini — atau string Base64 untuk di-decode…",
    outputLabel: "Keluaran",
    outputPlaceholder: "Hasil muncul di sini…",
    encode: "Encode",
    decode: "Decode",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    clear: "Bersihkan",
    swap: "Tukar",
    invalidBase64:
      "Base64 tidak valid: hanya A–Z, a–z, 0–9, +, /, = (dan spasi) yang diizinkan, panjang harus kelipatan 4.",
    emptyInput: "Isi sesuatu terlebih dahulu.",
    encodeOk: "Berhasil di-encode ke Base64.",
    decodeOk: "Berhasil di-decode dari Base64.",
    inputSize: "Masukan",
    outputSize: "Keluaran",
    dropHint: "Letakkan gambar di sini, atau klik untuk memilih (semua jenis gambar)",
    imagePreview: "Pratinjau gambar ter-encode",
    copyString: "Salin String",
    copyDataUri: "Salin Data URI",
    fileSize: "File",
    stringSize: "Base64",
    reverseLabel: "Atau tempel Data URI untuk di-decode",
    reversePlaceholder: "Tempel data:image/png;base64,iVBORw0… di sini",
    reversePreview: "Pratinjau gambar hasil decode",
    invalidDataUrl: "Data URI tidak valid: harus diawali data:<mime>;base64,",
    downloadFile: "Unduh file",
    decodeImageOk: "Data URI berhasil di-decode.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "What is Base64 used for?",
      a: "Base64 turns binary data into plain ASCII text so it can travel inside JSON, HTML, CSS, or URLs. Common uses: embedding small images as data URIs, and safely transporting tokens or binary payloads through text-only channels.",
    },
    id: {
      q: "Base64 dipakai untuk apa?",
      a: "Base64 mengubah data biner menjadi teks ASCII biasa agar bisa dikirim lewat JSON, HTML, CSS, atau URL. Kegunaan umum: menyematkan gambar kecil sebagai data URI, dan mengirim token atau payload biner lewat kanal khusus teks.",
    },
  },
  {
    en: {
      q: "Is Base64 encryption?",
      a: "No. Base64 is just an encoding — anyone can decode it instantly. Never use it to hide passwords or secrets; it offers zero confidentiality.",
    },
    id: {
      q: "Apakah Base64 itu enkripsi?",
      a: "Bukan. Base64 hanyalah encoding — siapa pun bisa men-decode-nya seketika. Jangan pakai untuk menyembunyikan kata sandi atau rahasia; ia tidak memberi kerahasiaan sama sekali.",
    },
  },
  {
    en: {
      q: "Why does decoding fail with 'Invalid Base64'?",
      a: "The string contains characters outside A–Z, a–z, 0–9, +, /, = (for example - and _ from the URL-safe variant), or its length is not a multiple of 4. Remove line breaks issues by re-copying the full string, or convert URL-safe Base64 by replacing - with + and _ with / first.",
    },
    id: {
      q: "Kenapa decoding gagal dengan pesan 'Invalid Base64'?",
      a: "String mengandung karakter di luar A–Z, a–z, 0–9, +, /, = (misalnya - dan _ dari varian URL-safe), atau panjangnya bukan kelipatan 4. Salin ulang string secara utuh, atau ubah Base64 URL-safe dengan mengganti - menjadi + dan _ menjadi / terlebih dahulu.",
    },
  },
  {
    en: {
      q: "Are my text and images uploaded anywhere?",
      a: "No. Encoding and decoding run entirely in your browser with chunked processing for large inputs. Nothing ever leaves your device.",
    },
    id: {
      q: "Apakah teks dan gambarku diunggah ke mana pun?",
      a: "Tidak. Encoding dan decoding berjalan sepenuhnya di browser dengan pemrosesan bertahap untuk input besar. Tidak ada yang keluar dari perangkatmu.",
    },
  },
];

function utf8Bytes(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return str.length;
  }
}

function encodeText(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    let part = "";
    for (let j = 0; j < sub.length; j++) part += String.fromCharCode(sub[j] ?? 0);
    binary += part;
  }
  return btoa(binary);
}

function decodeText(input: string): string {
  const compact = input.replace(/\s+/g, "");
  if (compact.length === 0 || compact.length % 4 !== 0) throw new Error("invalid-length");
  const binary = atob(compact);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
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

export default function Base64Page(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const mountedRef = useRef(true);

  const [tab, setTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [textOutput, setTextOutput] = useState("");
  const [textError, setTextError] = useState<string | null>(null);

  const [dzKey, setDzKey] = useState(0);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dataFileName, setDataFileName] = useState<string | null>(null);
  const [dataFileSize, setDataFileSize] = useState<number | null>(null);
  const [reverseInput, setReverseInput] = useState("");
  const [reverseUrl, setReverseUrl] = useState<string | null>(null);
  const [reverseMime, setReverseMime] = useState<string | null>(null);
  const [reverseError, setReverseError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleEncode = (): void => {
    try {
      setTextError(null);
      if (textInput.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      setTextOutput(encodeText(textInput));
      toast.success(s.encodeOk);
    } catch {
      setTextError(s.error);
      toast.error(s.error);
    }
  };

  const handleDecode = (): void => {
    try {
      setTextError(null);
      if (textInput.trim().length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      if (!BASE64_RE.test(textInput)) {
        setTextError(s.invalidBase64);
        toast.error(s.invalidBase64);
        return;
      }
      try {
        setTextOutput(decodeText(textInput));
        toast.success(s.decodeOk);
      } catch {
        setTextError(s.invalidBase64);
        toast.error(s.invalidBase64);
      }
    } catch {
      setTextError(s.error);
      toast.error(s.error);
    }
  };

  const handleSwap = (): void => {
    try {
      setTextError(null);
      setTextInput(textOutput);
      setTextOutput("");
    } catch {
      toast.error(s.error);
    }
  };

  const handleClear = (): void => {
    try {
      setTextInput("");
      setTextOutput("");
      setTextError(null);
    } catch {
      toast.error(s.error);
    }
  };

  const handleImageFiles = (files: File[]): void => {
    try {
      const f = files[0];
      if (!f) {
        setDzKey((k) => k + 1);
        return;
      }
      setDataUrl(null);
      setDataFileName(f.name);
      setDataFileSize(f.size);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (!mountedRef.current) return;
          const result = reader.result;
          if (typeof result !== "string" || !DATA_URL_RE.test(result)) {
            toast.error(s.error);
            return;
          }
          setDataUrl(result);
        } catch {
          toast.error(s.error);
        }
      };
      reader.onerror = () => {
        try {
          if (mountedRef.current) toast.error(s.error);
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(f);
      setDzKey((k) => k + 1);
    } catch {
      toast.error(s.error);
    }
  };

  const handleReverse = (): void => {
    try {
      setReverseError(null);
      setReverseUrl(null);
      setReverseMime(null);
      const v = reverseInput.trim();
      if (v.length === 0) {
        toast.error(s.emptyInput);
        return;
      }
      const m = DATA_URL_RE.exec(v);
      if (!m || !m[1]) {
        setReverseError(s.invalidDataUrl);
        toast.error(s.invalidDataUrl);
        return;
      }
      setReverseUrl(v);
      setReverseMime(m[1].toLowerCase());
      toast.success(s.decodeImageOk);
    } catch {
      setReverseError(s.error);
      toast.error(s.error);
    }
  };

  const handleDownloadReverse = async (): Promise<void> => {
    if (!reverseUrl || !reverseMime) return;
    try {
      const res = await fetch(reverseUrl);
      const blob = await res.blob();
      const ext = MIME_EXT[reverseMime] ?? "bin";
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `decoded.${ext}`;
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

  const base64Only = dataUrl ? dataUrl.slice(dataUrl.indexOf(",") + 1) : "";

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Braces"
      slug="developer/base64"
      faq={FAQ}
    >
      <div className="space-y-4">
        <AnimatedTabs
          ariaLabel={s.title}
          value={tab}
          onChange={(id) => {
            try {
              setTab(id as Tab);
            } catch {
              toast.error(s.error);
            }
          }}
          tabs={[
            { id: "text", label: s.textTab },
            { id: "image", label: s.imageTab },
          ]}
        />

        <AnimatedTabPanel tabKey={tab}>
        {tab === "text" ? (
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="b64-input"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {s.inputLabel}
                  </label>
                  <Badge variant="secondary" className="font-mono">
                    {utf8Bytes(textInput)} B
                  </Badge>
                </div>
                <textarea
                  id="b64-input"
                  value={textInput}
                  onChange={(e) => {
                    try {
                      setTextInput(e.target.value);
                      setTextError(null);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.inputPlaceholder}
                  rows={6}
                  spellCheck={false}
                  className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Button
                  onClick={handleEncode}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <LockKeyhole aria-hidden />
                  {s.encode}
                </Button>
                <Button onClick={handleDecode} variant="secondary">
                  <FileCode2 aria-hidden />
                  {s.decode}
                </Button>
                <CopyButton
                  text={textOutput}
                  label={s.copy}
                  variant="outline"
                  disabled={textOutput.length === 0}
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyInput}
                  errorMessage={s.error}
                  className="flex-none"
                />
                <Button onClick={handleSwap} variant="outline" disabled={textOutput.length === 0}>
                  <ArrowLeftRight aria-hidden />
                  {s.swap}
                </Button>
                <Button onClick={handleClear} variant="ghost">
                  <Eraser aria-hidden />
                  {s.clear}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.outputLabel}
                  </p>
                  <Badge variant="secondary" className="font-mono">
                    {utf8Bytes(textOutput)} B
                  </Badge>
                </div>
                {textError ? (
                  <div
                    role="alert"
                    className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                  >
                    <p className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {textError}
                    </p>
                  </div>
                ) : (
                  <pre className="mt-2 max-h-64 min-h-[6rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                    {textOutput || s.outputPlaceholder}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <FileDropzone
                  key={dzKey}
                  accept={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
                  multiple={false}
                  maxSizeMB={25}
                  onFiles={handleImageFiles}
                  helperText={s.dropHint}
                />

                {dataUrl && (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dataUrl}
                      alt={s.imagePreview}
                      className="max-h-64 w-full rounded-xl border border-zinc-200 object-contain bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    <p className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {dataFileName && (
                        <Badge variant="secondary" className="font-mono">
                          {dataFileName}
                        </Badge>
                      )}
                      {dataFileSize !== null && (
                        <Badge variant="secondary" className="font-mono">
                          {s.fileSize}: {formatSize(dataFileSize)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="font-mono">
                        {s.stringSize}: {formatSize(utf8Bytes(dataUrl))}
                      </Badge>
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CopyButton
                        text={base64Only}
                        label={s.copyString}
                        variant="secondary"
                        copiedMessage={s.copied}
                        emptyMessage={s.emptyInput}
                        errorMessage={s.error}
                      />
                      <CopyButton
                        text={dataUrl}
                        label={s.copyDataUri}
                        variant="default"
                        copiedMessage={s.copied}
                        emptyMessage={s.emptyInput}
                        errorMessage={s.error}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-3 p-4 sm:p-6">
                <label
                  htmlFor="b64-reverse"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.reverseLabel}
                </label>
                <textarea
                  id="b64-reverse"
                  value={reverseInput}
                  onChange={(e) => {
                    try {
                      setReverseInput(e.target.value);
                      setReverseError(null);
                    } catch {
                      // ignore
                    }
                  }}
                  placeholder={s.reversePlaceholder}
                  rows={4}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs break-all text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
                />
                <Button
                  onClick={handleReverse}
                  variant="secondary"
                  disabled={reverseInput.trim().length === 0}
                >
                  <FileCode2 aria-hidden />
                  {s.decode}
                </Button>
                {reverseError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                  >
                    <p className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {reverseError}
                    </p>
                  </div>
                )}
                {reverseUrl && reverseMime && !reverseError && (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reverseUrl}
                      alt={s.reversePreview}
                      className="max-h-64 w-full rounded-xl border border-zinc-200 object-contain bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {reverseMime}
                      </Badge>
                      <Button onClick={() => void handleDownloadReverse()} size="sm">
                        <Download aria-hidden />
                        {s.downloadFile} (.{MIME_EXT[reverseMime] ?? "bin"})
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {dataUrl === null && (
              <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <ImagePlus className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {s.dropHint}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </AnimatedTabPanel>
      </div>
    </ToolLayout>
  );
}
