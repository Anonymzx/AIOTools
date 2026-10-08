"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { AiKeyField } from "@/components/tools/AiKeyField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { loadAiKey } from "@/lib/ai-key";

const MAX_CHARS = 15_000;
const RATE_LIMIT_MS = 10_000;
const FETCH_TIMEOUT_MS = 60_000;

type ModelId = "gpt-4o-mini" | "gpt-4o" | "gpt-3.5-turbo";
type LengthId = "short" | "medium" | "bulleted";

const MODELS: ModelId[] = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
const LENGTHS: LengthId[] = ["short", "medium", "bulleted"];

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    dropHint: string;
    extract: string;
    extracting: string;
    chars: (n: number) => string;
    truncated: string;
    noText: string;
    noFile: string;
    extractOk: string;
    extractFail: string;
    emptyPdf: string;
    sourceLabel: string;
    modelLabel: string;
    lengthLabel: string;
    short: string;
    medium: string;
    bulleted: string;
    summarize: string;
    summarizing: string;
    needKey: string;
    needText: string;
    rateLimited: string;
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
    costNote: string;
    error: string;
  }
> = {
  en: {
    title: "AI PDF Summarizer",
    description:
      "Upload a PDF, extract its text locally, then summarize it with your own OpenAI key — billed to you, never to us.",
    dropHint: "Drop a PDF here, or click to browse",
    extract: "Extract text",
    extracting: "Extracting…",
    chars: (n) => `${n.toLocaleString("en-US")} chars`,
    truncated: "PDF text capped at 15,000 chars for the API call.",
    noText: "No text to summarize yet — extract a PDF first.",
    noFile: "Select a PDF file first.",
    extractOk: "Text extracted from PDF.",
    extractFail: "Failed to read PDF. It may be corrupted, encrypted, or image-only.",
    emptyPdf: "No selectable text found — this PDF is likely scanned images.",
    sourceLabel: "Source text (editable)",
    modelLabel: "Model",
    lengthLabel: "Summary length",
    short: "Short (2–3 sentences)",
    medium: "Medium (one paragraph)",
    bulleted: "Bulleted key points",
    summarize: "Summarize",
    summarizing: "Summarizing…",
    needKey: "Save your OpenAI API key first.",
    needText: "Extract PDF text first.",
    rateLimited: "Wait 10 seconds between requests.",
    unauthorized: "OpenAI rejected the key (401) — check it and save again.",
    tooMany: "OpenAI rate limit hit (429) — wait a minute and retry.",
    requestFailed: (code) => `OpenAI request failed (HTTP ${code}).`,
    networkError: "Network error calling OpenAI.",
    timeout: "OpenAI timed out after 60s — retry with a shorter text.",
    badResponse: "OpenAI returned an unreadable response.",
    done: "Summary ready.",
    outputLabel: "Summary",
    emptyHint: "Your summary will appear here.",
    copy: "Copy",
    copied: "Copied to clipboard.",
    copyFail: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    download: "Download .txt",
    downloaded: "Summary downloaded.",
    downloadFailed: "Failed to download file.",
    clearAll: "Clear all",
    cleared: "Cleared.",
    costNote:
      "Rough cost hint: ~15k chars ≈ 4k tokens. gpt-4o-mini ≈ $0.001, gpt-4o ≈ $0.01–0.02 per summary. Check OpenAI pricing — you pay OpenAI directly.",
    error: "Something went wrong.",
  },
  id: {
    title: "Perangkum PDF AI",
    description:
      "Unggah PDF, ekstrak teksnya secara lokal, lalu rangkum dengan kunci OpenAI milikmu — ditagih ke kamu, bukan ke kami.",
    dropHint: "Letakkan PDF di sini, atau klik untuk memilih",
    extract: "Ekstrak teks",
    extracting: "Mengekstrak…",
    chars: (n) => `${n.toLocaleString("id-ID")} karakter`,
    truncated: "Teks PDF dibatasi 15.000 karakter untuk panggilan API.",
    noText: "Belum ada teks untuk dirangkum — ekstrak PDF dulu.",
    noFile: "Pilih file PDF terlebih dahulu.",
    extractOk: "Teks berhasil diekstrak dari PDF.",
    extractFail: "Gagal membaca PDF. File mungkin rusak, terenkripsi, atau hanya gambar.",
    emptyPdf: "Tidak ada teks yang bisa dipilih — PDF ini kemungkinan hasil pindaian.",
    sourceLabel: "Teks sumber (bisa diedit)",
    modelLabel: "Model",
    lengthLabel: "Panjang ringkasan",
    short: "Pendek (2–3 kalimat)",
    medium: "Sedang (satu paragraf)",
    bulleted: "Poin-poin penting",
    summarize: "Rangkum",
    summarizing: "Meringkas…",
    needKey: "Simpan kunci API OpenAI dulu.",
    needText: "Ekstrak teks PDF dulu.",
    rateLimited: "Tunggu 10 detik antar permintaan.",
    unauthorized: "OpenAI menolak kunci (401) — periksa lalu simpan ulang.",
    tooMany: "Limit OpenAI tercapai (429) — tunggu semenit lalu coba lagi.",
    requestFailed: (code) => `Permintaan OpenAI gagal (HTTP ${code}).`,
    networkError: "Kesalahan jaringan saat memanggil OpenAI.",
    timeout: "OpenAI timeout setelah 60 dtk — coba dengan teks lebih pendek.",
    badResponse: "OpenAI mengembalikan respons yang tak terbaca.",
    done: "Ringkasan siap.",
    outputLabel: "Ringkasan",
    emptyHint: "Ringkasanmu akan muncul di sini.",
    copy: "Salin",
    copied: "Disalin ke clipboard.",
    copyFail: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    download: "Unduh .txt",
    downloaded: "Ringkasan diunduh.",
    downloadFailed: "Gagal mengunduh file.",
    clearAll: "Hapus semua",
    cleared: "Dihapus.",
    costNote:
      "Perkiraan biaya: ~15 rb karakter ≈ 4 rb token. gpt-4o-mini ≈ $0,001, gpt-4o ≈ $0,01–0,02 per ringkasan. Cek harga OpenAI — kamu membayar langsung ke OpenAI.",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "Where does my API key go?",
      a: "It is AES-GCM encrypted and stored only in this browser's localStorage. When you summarize, your browser sends the text directly to api.openai.com — our servers never see your key or your document.",
    },
    id: {
      q: "Ke mana kunci API saya pergi?",
      a: "Kunci dienkripsi AES-GCM dan disimpan hanya di localStorage browser ini. Saat meringkas, browser mengirim teks langsung ke api.openai.com — server kami tidak pernah melihat kunci atau dokumenmu.",
    },
  },
  {
    en: {
      q: "Why is long PDF text cut at 15,000 characters?",
      a: "To bound token usage and cost per request, and to stay safely inside every offered model's context window. Edit the extracted text box to focus the summary on the section you care about.",
    },
    id: {
      q: "Mengapa teks PDF panjang dipotong di 15.000 karakter?",
      a: "Untuk membatasi pemakaian token dan biaya per permintaan, serta agar aman masuk ke context window semua model yang ditawarkan. Edit kotak teks hasil ekstraksi untuk memfokuskan ringkasan pada bagian yang kamu pedulikan.",
    },
  },
  {
    en: {
      q: "How much does each summary cost?",
      a: "You pay OpenAI directly under your own plan — roughly $0.001 per summary on gpt-4o-mini and $0.01–0.02 on gpt-4o at the 15k-char cap. Set a spend limit on the OpenAI dashboard.",
    },
    id: {
      q: "Berapa biaya tiap ringkasan?",
      a: "Kamu membayar langsung ke OpenAI sesuai paketmu — kira-kira $0,001 per ringkasan di gpt-4o-mini dan $0,01–0,02 di gpt-4o pada batas 15 rb karakter. Atur batas belanja di dasbor OpenAI.",
    },
  },
  {
    en: {
      q: "My scanned PDF extracts no text. What now?",
      a: "Scanned PDFs are images with no text layer. Run the OCR tool (/tools/pdf/ocr) first, then paste the recognized text here — or into the editable source box directly.",
    },
    id: {
      q: "PDF pindaian saya tidak menghasilkan teks. Bagaimana?",
      a: "PDF pindaian adalah gambar tanpa lapisan teks. Jalankan tool OCR (/tools/pdf/ocr) dulu, lalu tempel teks hasilnya ke sini — atau langsung ke kotak sumber yang bisa diedit.",
    },
  },
];

const SELECT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const TEXTAREA_CLS =
  "min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function lengthPrompt(l: LengthId): string {
  if (l === "short") return "Summarize in 2-3 sentences.";
  if (l === "bulleted") return "Summarize as a bulleted list of key points, one per line starting with '- '.";
  return "Summarize in one paragraph of 100-150 words.";
}

export default function AiSummarizerPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [dzKey, setDzKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [model, setModel] = useState<ModelId>("gpt-4o-mini");
  const [length, setLength] = useState<LengthId>("medium");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const lastReqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stats = useMemo(() => {
    try {
      const chars = text.length;
      const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
      return { chars, words };
    } catch {
      return { chars: 0, words: 0 };
    }
  }, [text]);

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
            if (parts.join(" ").length >= MAX_CHARS) break;
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
        setText("");
        toast.error(s.emptyPdf);
        return;
      }
      if (cleaned.length > MAX_CHARS) {
        setText(cleaned.slice(0, MAX_CHARS));
        toast.success(s.extractOk);
        toast.info(s.truncated);
      } else {
        setText(cleaned);
        toast.success(s.extractOk);
      }
    } catch {
      if (mountedRef.current) toast.error(s.extractFail);
    } finally {
      if (mountedRef.current) setExtracting(false);
    }
  }

  async function handleSummarize(): Promise<void> {
    if (busy) return;
    try {
      const now = Date.now();
      if (now - lastReqRef.current < RATE_LIMIT_MS) {
        toast.error(s.rateLimited);
        return;
      }
      let key = apiKey;
      if (!key) key = await loadAiKey();
      if (!key) {
        toast.error(s.needKey);
        return;
      }
      if (text.trim().length === 0) {
        toast.error(s.needText);
        return;
      }
      lastReqRef.current = now;
      setBusy(true);
      setOutput("");
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
            model,
            messages: [
              {
                role: "system",
                content: `You are a precise document summarizer. ${lengthPrompt(length)} Reply in the same language as the source text.`,
              },
              { role: "user", content: text.slice(0, MAX_CHARS) },
            ],
            temperature: 0.3,
          }),
        });
        if (!mountedRef.current) return;
        if (res.status === 401) {
          toast.error(s.unauthorized);
          return;
        }
        if (res.status === 429) {
          toast.error(s.tooMany);
          return;
        }
        if (!res.ok) {
          toast.error(s.requestFailed(res.status));
          return;
        }
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: unknown } }>;
        };
        const content = json.choices?.[0]?.message?.content;
        if (typeof content !== "string" || content.trim().length === 0) {
          toast.error(s.badResponse);
          return;
        }
        setOutput(content.trim());
        toast.success(s.done);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          toast.error(s.timeout);
        } else {
          toast.error(s.networkError);
        }
      } finally {
        window.clearTimeout(timer);
      }
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
      a.download = "summary.txt";
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
      setText("");
      setOutput("");
      setDzKey((k) => k + 1);
      toast.success(s.cleared);
    } catch {
      toast.error(s.error);
    }
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="ScanText"
      slug="developer/ai-summarizer"
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
                htmlFor="sum-source"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.sourceLabel}
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.chars(stats.chars)}</span>
            </div>
            <textarea
              id="sum-source"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              spellCheck={false}
              className={TEXTAREA_CLS}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sum-model"
                  className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {s.modelLabel}
                </label>
                <select
                  id="sum-model"
                  value={model}
                  onChange={(e) => {
                    try {
                      setModel(e.target.value as ModelId);
                    } catch {
                      // keep previous model
                    }
                  }}
                  className={SELECT_CLS}
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="sum-length"
                  className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {s.lengthLabel}
                </label>
                <select
                  id="sum-length"
                  value={length}
                  onChange={(e) => {
                    try {
                      setLength(e.target.value as LengthId);
                    } catch {
                      // keep previous length
                    }
                  }}
                  className={SELECT_CLS}
                >
                  {LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l === "short" ? s.short : l === "medium" ? s.medium : s.bulleted}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void handleSummarize()}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {busy ? s.summarizing : s.summarize}
            </Button>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.costNote}</p>
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
