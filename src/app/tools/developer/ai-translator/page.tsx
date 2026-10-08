"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Languages, Loader2, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { AiKeyField } from "@/components/tools/AiKeyField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { loadAiKey } from "@/lib/ai-key";

const CHUNK_CHARS = 8_000;
const FETCH_TIMEOUT_MS = 60_000;

const TARGETS = [
  "English",
  "Indonesian",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Arabic",
  "Hindi",
  "Turkish",
  "Thai",
  "Vietnamese",
  "Malay",
  "Filipino",
] as const;

type TargetLang = (typeof TARGETS)[number];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    extract: string;
    extracting: string;
    noFile: string;
    extractOk: string;
    extractFail: string;
    emptyPdf: string;
    inputLabel: string;
    chars: (n: number) => string;
    targetLabel: string;
    translate: string;
    translating: string;
    progress: (done: number, total: number) => string;
    needKey: string;
    needText: string;
    unauthorized: string;
    tooMany: string;
    requestFailed: (code: number) => string;
    networkError: string;
    timeout: string;
    badResponse: string;
    done: string;
    outputLabel: string;
    emptyHint: string;
    copy: string;
    copied: string;
    copyFail: string;
    nothingToCopy: string;
    download: string;
    downloaded: string;
    downloadFailed: string;
    clearAll: string;
    cleared: string;
    chunkNote: string;
    error: string;
  }
> = {
  en: {
    title: "AI PDF Translator",
    description:
      "Translate PDF text (or any pasted text) into 20 languages with your own OpenAI key — long texts are chunked automatically.",
    dropHint: "Drop a PDF here, or click to browse — or just paste text below",
    extract: "Extract text",
    extracting: "Extracting…",
    noFile: "Select a PDF file first.",
    extractOk: "Text extracted from PDF.",
    extractFail: "Failed to read PDF. It may be corrupted, encrypted, or image-only.",
    emptyPdf: "No selectable text found — this PDF is likely scanned images.",
    inputLabel: "Source text (from PDF or pasted)",
    chars: (n) => `${n.toLocaleString("en-US")} chars`,
    targetLabel: "Target language",
    translate: "Translate",
    translating: "Translating…",
    progress: (done, total) => `Chunk ${done} of ${total}…`,
    needKey: "Save your OpenAI API key first.",
    needText: "Add source text first (extract a PDF or paste text).",
    unauthorized: "OpenAI rejected the key (401) — check it and save again.",
    tooMany: "OpenAI rate limit hit (429) — wait a minute and retry.",
    requestFailed: (code) => `OpenAI request failed (HTTP ${code}).`,
    networkError: "Network error calling OpenAI.",
    timeout: "OpenAI timed out after 60s — retry with shorter text.",
    badResponse: "OpenAI returned an unreadable response.",
    done: "Translation ready.",
    outputLabel: "Translation",
    emptyHint: "Your translation will appear here.",
    copy: "Copy",
    copied: "Copied to clipboard.",
    copyFail: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    download: "Download .txt",
    downloaded: "Translation downloaded.",
    downloadFailed: "Failed to download file.",
    clearAll: "Clear all",
    cleared: "Cleared.",
    chunkNote:
      "Texts over 8,000 chars are split into sequential chunks (one request each, ~60s timeout) and joined. You pay OpenAI per chunk.",
    error: "Something went wrong.",
  },
  id: {
    title: "Penerjemah PDF AI",
    description:
      "Terjemahkan teks PDF (atau teks tempelan apa pun) ke 20 bahasa dengan kunci OpenAI milikmu — teks panjang dipecah otomatis.",
    dropHint: "Letakkan PDF di sini, atau klik untuk memilih — atau tempel teks di bawah",
    extract: "Ekstrak teks",
    extracting: "Mengekstrak…",
    noFile: "Pilih file PDF terlebih dahulu.",
    extractOk: "Teks berhasil diekstrak dari PDF.",
    extractFail: "Gagal membaca PDF. File mungkin rusak, terenkripsi, atau hanya gambar.",
    emptyPdf: "Tidak ada teks yang bisa dipilih — PDF ini kemungkinan hasil pindaian.",
    inputLabel: "Teks sumber (dari PDF atau tempelan)",
    chars: (n) => `${n.toLocaleString("id-ID")} karakter`,
    targetLabel: "Bahasa target",
    translate: "Terjemahkan",
    translating: "Menerjemahkan…",
    progress: (done, total) => `Potongan ${done} dari ${total}…`,
    needKey: "Simpan kunci API OpenAI dulu.",
    needText: "Isi teks sumber dulu (ekstrak PDF atau tempel teks).",
    unauthorized: "OpenAI menolak kunci (401) — periksa lalu simpan ulang.",
    tooMany: "Limit OpenAI tercapai (429) — tunggu semenit lalu coba lagi.",
    requestFailed: (code) => `Permintaan OpenAI gagal (HTTP ${code}).`,
    networkError: "Kesalahan jaringan saat memanggil OpenAI.",
    timeout: "OpenAI timeout setelah 60 dtk — coba dengan teks lebih pendek.",
    badResponse: "OpenAI mengembalikan respons yang tak terbaca.",
    done: "Terjemahan siap.",
    outputLabel: "Terjemahan",
    emptyHint: "Terjemahanmu akan muncul di sini.",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    copyFail: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    download: "Unduh .txt",
    downloaded: "Terjemahan diunduh.",
    downloadFailed: "Gagal mengunduh file.",
    clearAll: "Hapus semua",
    cleared: "Dihapus.",
    chunkNote:
      "Teks di atas 8.000 karakter dipecah menjadi potongan berurutan (satu permintaan tiap potongan, timeout ~60 dtk) lalu digabung. Kamu membayar OpenAI per potongan.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How is my document handled?",
      a: "PDF text extraction runs locally in your browser. Only the text you translate is sent — directly from your browser to api.openai.com using your own key. Nothing passes through our servers.",
    },
    id: {
      q: "Bagaimana dokumen saya ditangani?",
      a: "Ekstraksi teks PDF berjalan lokal di browser. Hanya teks yang diterjemahkan yang dikirim — langsung dari browser ke api.openai.com memakai kuncimu sendiri. Tidak ada yang lewat server kami.",
    },
  },
  {
    en: {
      q: "Why is long text split into chunks?",
      a: "Each 8,000-char chunk is one API request with its own 60s timeout, so a network hiccup fails one chunk instead of the whole document. Progress shows which chunk is being translated; results are joined in order.",
    },
    id: {
      q: "Mengapa teks panjang dipecah menjadi potongan?",
      a: "Setiap potongan 8.000 karakter adalah satu permintaan API dengan timeout 60 dtk sendiri, sehingga gangguan jaringan hanya menggagalkan satu potongan, bukan seluruh dokumen. Progres menunjukkan potongan yang sedang diterjemahkan; hasilnya digabung berurutan.",
    },
  },
  {
    en: {
      q: "Which languages are supported?",
      a: "20 targets: English, Indonesian, Spanish, French, German, Portuguese, Italian, Dutch, Russian, Japanese, Korean, Simplified & Traditional Chinese, Arabic, Hindi, Turkish, Thai, Vietnamese, Malay, and Filipino.",
    },
    id: {
      q: "Bahasa apa saja yang didukung?",
      a: "20 target: Inggris, Indonesia, Spanyol, Prancis, Jerman, Portugis, Italia, Belanda, Rusia, Jepang, Korea, Mandarin Sederhana & Tradisional, Arab, Hindi, Turki, Thai, Vietnam, Melayu, dan Filipino.",
    },
  },
  {
    en: {
      q: "What does it cost?",
      a: "You pay OpenAI directly — translation of 8,000 chars is roughly 2.5k tokens each way, about a fraction of a cent on gpt-4o-mini. Set a spend limit on the OpenAI dashboard before translating large documents.",
    },
    id: {
      q: "Berapa biayanya?",
      a: "Kamu membayar langsung ke OpenAI — terjemahan 8.000 karakter kira-kira 2,5 rb token tiap arah, sekitar sepersekian sen di gpt-4o-mini. Atur batas belanja di dasbor OpenAI sebelum menerjemahkan dokumen besar.",
    },
  },
];

const TEXTAREA_CLS =
  "min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SELECT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function splitChunks(text: string): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= CHUNK_CHARS) {
      out.push(rest);
      break;
    }
    let cut = rest.lastIndexOf("\n\n", CHUNK_CHARS);
    if (cut < CHUNK_CHARS * 0.5) cut = rest.lastIndexOf(" ", CHUNK_CHARS);
    if (cut < CHUNK_CHARS * 0.5) cut = CHUNK_CHARS;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  return out;
}

export default function AiTranslatorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [input, setInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [target, setTarget] = useState<TargetLang>("Indonesian");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [output, setOutput] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stats = useMemo(() => {
    try {
      const chars = input.length;
      const chunks = input.trim().length === 0 ? 0 : splitChunks(input.trim()).length;
      return { chars, chunks };
    } catch {
      return { chars: 0, chunks: 0 };
    }
  }, [input]);

  function handleFiles(files: File[]): void {
    try {
      const picked = files[0] ?? null;
      setDzKey((k) => k + 1);
      setFile(picked);
    } catch {
      toast.error(s.error);
    }
  }

  async function handleExtract(): Promise<void> {
    if (!file || extracting) {
      if (!file) toast.error(s.noFile);
      return;
    }
    setExtracting(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const run = async (buf: ArrayBuffer): Promise<string> => {
        const task = pdfjs.getDocument({ data: new Uint8Array(buf) });
        const pdf = await task.promise;
        try {
          const parts: string[] = [];
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            try {
              const tc = await page.getTextContent();
              const strs: string[] = [];
              for (const it of tc.items) {
                try {
                  const rec = it as unknown as { str?: unknown };
                  if (typeof rec.str === "string" && rec.str.trim().length > 0) {
                    strs.push(rec.str);
                  }
                } catch {
                  // ignore malformed items
                }
              }
              if (strs.length > 0) parts.push(strs.join(" "));
            } finally {
              try {
                page.cleanup();
              } catch {
                // ignore
              }
            }
          }
          return parts.join("\n\n");
        } finally {
          try {
            await task.destroy();
          } catch {
            // ignore
          }
        }
      };

      let full: string;
      try {
        full = await run(await file.arrayBuffer());
      } catch (firstErr) {
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        try {
          full = await run(await file.arrayBuffer());
        } catch {
          throw firstErr;
        }
      }
      if (!mountedRef.current) return;
      const cleaned = full.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (cleaned.length === 0) {
        toast.error(s.emptyPdf);
        return;
      }
      setInput(cleaned);
      toast.success(s.extractOk);
    } catch {
      if (mountedRef.current) toast.error(s.extractFail);
    } finally {
      if (mountedRef.current) setExtracting(false);
    }
  }

  async function translateChunk(key: string, chunk: string, lang: string): Promise<string> {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a faithful translator. Translate the user text into ${lang}. Preserve paragraph breaks, lists, and formatting. Output ONLY the translation, no commentary.`,
            },
            { role: "user", content: chunk },
          ],
          temperature: 0.2,
        }),
      });
      if (res.status === 401) throw new Error("__401__");
      if (res.status === 429) throw new Error("__429__");
      if (!res.ok) throw new Error(`__HTTP_${res.status}__`);
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        throw new Error("__BAD_RESPONSE__");
      }
      return content.trim();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function handleTranslate(): Promise<void> {
    if (busy) return;
    try {
      let key = apiKey;
      if (!key) key = await loadAiKey();
      if (!key) {
        toast.error(s.needKey);
        return;
      }
      const source = input.trim();
      if (source.length === 0) {
        toast.error(s.needText);
        return;
      }
      const chunks = splitChunks(source);
      setBusy(true);
      setOutput("");
      setDone(0);
      setTotal(chunks.length);
      const parts: string[] = [];
      try {
        for (let i = 0; i < chunks.length; i++) {
          if (!mountedRef.current) return;
          const piece = await translateChunk(key, chunks[i] ?? "", target);
          parts.push(piece);
          if (mountedRef.current) setDone(i + 1);
        }
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e instanceof Error ? e.message : "";
        if (msg === "__401__") toast.error(s.unauthorized);
        else if (msg === "__429__") toast.error(s.tooMany);
        else if (msg.startsWith("__HTTP_")) {
          const code = Number(msg.replace("__HTTP_", "").replace("__", "")) || 0;
          toast.error(s.requestFailed(code));
        } else if (e instanceof DOMException && e.name === "AbortError") {
          toast.error(s.timeout);
        } else if (msg === "__BAD_RESPONSE__") {
          toast.error(s.badResponse);
        } else {
          toast.error(s.networkError);
        }
        if (parts.length > 0) setOutput(parts.join("\n\n"));
        return;
      }
      if (!mountedRef.current) return;
      setOutput(parts.join("\n\n"));
      toast.success(s.done);
    } catch {
      toast.error(s.error);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  function handleDownload(): void {
    try {
      if (output.trim() === "") {
        toast.info(s.nothingToCopy);
        return;
      }
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "translation.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(s.downloaded);
    } catch {
      toast.error(s.downloadFailed);
    }
  }

  function handleClearAll(): void {
    try {
      setFile(null);
      setInput("");
      setOutput("");
      setDone(0);
      setTotal(0);
      setDzKey((k) => k + 1);
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="FileType"
      slug="developer/ai-translator"
      faq={FAQ}
    >
      <div className="space-y-4">
        <AiKeyField onKey={setApiKey} />

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <FileDropzone
              key={dzKey}
              accept={[".pdf", "application/pdf"]}
              multiple={false}
              maxSizeMB={25}
              maxFiles={1}
              onFiles={handleFiles}
              preview={false}
              helperText={s.dropHint}
            />
            {file !== null && (
              <p className="flex items-center gap-2 truncate text-sm text-zinc-600 dark:text-zinc-300">
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{file.name}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleExtract()} disabled={extracting || file === null}>
                {extracting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {extracting ? s.extracting : s.extract}
              </Button>
              <Button type="button" variant="outline" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clearAll}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="tr-input"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.inputLabel}
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.chars(stats.chars)}
                {stats.chunks > 1 ? ` · ${stats.chunks} chunks` : ""}
              </span>
            </div>
            <textarea
              id="tr-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              spellCheck={false}
              className={TEXTAREA_CLS}
            />
            <div>
              <label
                htmlFor="tr-target"
                className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {s.targetLabel}
              </label>
              <select
                id="tr-target"
                value={target}
                onChange={(e) => {
                  try {
                    setTarget(e.target.value as TargetLang);
                  } catch {
                    // keep previous target
                  }
                }}
                className={SELECT_CLS}
              >
                {TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={() => void handleTranslate()}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Languages className="h-4 w-4" aria-hidden />
              )}
              {busy ? s.translating : s.translate}
            </Button>
            {busy && total > 0 && (
              <div role="status" aria-live="polite" className="space-y-1">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.progress(done, total)}
                </p>
              </div>
            )}
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.chunkNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {s.outputLabel}
            </span>
            {output === "" ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {s.emptyHint}
              </p>
            ) : (
              <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {output}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <CopyButton
                text={output}
                label={s.copy}
                copiedMessage={s.copied}
                emptyMessage={s.nothingToCopy}
                errorMessage={s.copyFail}
                className="flex-none"
              />
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" aria-hidden />
                {s.download}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
