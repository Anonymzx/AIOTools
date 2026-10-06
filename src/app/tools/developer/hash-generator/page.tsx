"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import md5 from "md5";
import { CheckCircle2, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { useToolClear, useToolPaste } from "@/hooks/useToolClipboard";

const TEXTAREA_CLS =
  "min-h-[140px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    inputLabel: string;
    inputPlaceholder: string;
    emptyHint: string;
    bytes: string;
    chars: string;
    lowercaseNote: string;
    clear: string;
    cleared: string;
    copy: string;
    copied: string;
    copyFailed: string;
    nothingToCopy: string;
    computeFailed: string;
    cryptoUnavailable: string;
    algorithms: { key: string; label: string; bits: string }[];
  }
> = {
  en: {
    title: "Hash Generator",
    description:
      "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes instantly as you type — 100% client-side in your browser.",
    descriptionId:
      "Buat hash MD5, SHA-1, SHA-256, dan SHA-512 secara instan saat mengetik — 100% di sisi klien, di browser Anda.",
    inputLabel: "Input text",
    inputPlaceholder: "Type or paste text here — hashes update live…",
    emptyHint: "Start typing above — live hashes will appear below.",
    bytes: "bytes",
    chars: "chars",
    lowercaseNote: "All digests are shown in lowercase hex. Everything runs locally — nothing is uploaded.",
    clear: "Clear",
    cleared: "Input cleared.",
    copy: "Copy",
    copied: "Hash copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    computeFailed: "Failed to compute hashes.",
    cryptoUnavailable: "Web Crypto API is unavailable in this browser.",
    algorithms: [
      { key: "md5", label: "MD5", bits: "128-bit" },
      { key: "sha1", label: "SHA-1", bits: "160-bit" },
      { key: "sha256", label: "SHA-256", bits: "256-bit" },
      { key: "sha512", label: "SHA-512", bits: "512-bit" },
    ],
  },
  id: {
    title: "Pembuat Hash (Hash Generator)",
    description:
      "Buat hash MD5, SHA-1, SHA-256, dan SHA-512 secara instan saat mengetik — 100% di sisi klien, di browser Anda.",
    descriptionId:
      "Buat hash MD5, SHA-1, SHA-256, dan SHA-512 secara instan saat mengetik — 100% di sisi klien, di browser Anda.",
    inputLabel: "Teks masukan",
    inputPlaceholder: "Ketik atau tempel teks di sini — hash diperbarui langsung…",
    emptyHint: "Mulai mengetik di atas — hash langsung akan muncul di bawah.",
    bytes: "byte",
    chars: "karakter",
    lowercaseNote: "Semua digest ditampilkan dalam hex huruf kecil. Semua berjalan lokal — tidak ada yang diunggah.",
    clear: "Hapus",
    cleared: "Masukan dihapus.",
    copy: "Salin",
    copied: "Hash disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    computeFailed: "Gagal menghitung hash.",
    cryptoUnavailable: "Web Crypto API tidak tersedia di browser ini.",
    algorithms: [
      { key: "md5", label: "MD5", bits: "128-bit" },
      { key: "sha1", label: "SHA-1", bits: "160-bit" },
      { key: "sha256", label: "SHA-256", bits: "256-bit" },
      { key: "sha512", label: "SHA-512", bits: "512-bit" },
    ],
  },
};

type HashKey = "md5" | "sha1" | "sha256" | "sha512";
type HashState = Record<HashKey, string>;

const EMPTY_HASHES: HashState = { md5: "", sha1: "", sha256: "", sha512: "" };

function toHex(buffer: ArrayBuffer): string {
  try {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

function byteLength(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return str.length;
  }
}

async function digestHex(algorithm: string, input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest(algorithm, data);
  return toHex(buf);
}

export default function HashGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<HashState>(EMPTY_HASHES);
  const [cryptoOk, setCryptoOk] = useState(true);
  const reqId = useRef(0);

  useToolPaste(setInput);
  useToolClear(() => {
    setInput("");
    setHashes(EMPTY_HASHES);
  });

  useEffect(() => {
    try {
      if (
        typeof crypto === "undefined" ||
        typeof crypto.subtle === "undefined" ||
        typeof crypto.subtle.digest !== "function"
      ) {
        setCryptoOk(false);
        toast.error(s.cryptoUnavailable);
      }
    } catch {
      setCryptoOk(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (input === "") {
      reqId.current += 1;
      setHashes(EMPTY_HASHES);
      return;
    }
    const snapshot = input;
    const id = ++reqId.current;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          let md5Hex = "";
          try {
            md5Hex = md5(snapshot).toLowerCase();
          } catch {
            md5Hex = "";
          }
          const [sha1, sha256, sha512] = await Promise.all([
            digestHex("SHA-1", snapshot),
            digestHex("SHA-256", snapshot),
            digestHex("SHA-512", snapshot),
          ]);
          if (reqId.current !== id) return;
          if (!sha1 || !sha256 || !sha512) {
            toast.error(s.computeFailed);
            return;
          }
          setHashes({ md5: md5Hex, sha1, sha256, sha512 });
        } catch {
          if (reqId.current !== id) return;
          toast.error(s.computeFailed);
        }
      })();
    }, 300);
    return () => window.clearTimeout(t);
  }, [input, s.computeFailed]);

  const bytes = byteLength(input);
  const hasInput = input !== "";

  function handleClear(): void {
    try {
      setInput("");
      setHashes(EMPTY_HASHES);
      toast.success(s.cleared);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="Hash"
      slug="developer/hash-generator"
      faq={[
        {
          en: {
            q: "Which hash should I use?",
            a: "Use SHA-256 or SHA-512 for integrity checks and new systems. MD5 and SHA-1 are fast but cryptographically broken — fine for non-security checksums (e.g. quick change detection), never for passwords or signatures.",
          },
          id: {
            q: "Hash mana yang harus dipakai?",
            a: "Gunakan SHA-256 atau SHA-512 untuk pemeriksaan integritas dan sistem baru. MD5 dan SHA-1 cepat tetapi sudah rusak secara kriptografi — boleh untuk checksum non-keamanan (mis. deteksi perubahan cepat), jangan untuk kata sandi atau tanda tangan.",
          },
        },
        {
          en: {
            q: "Is my input uploaded anywhere?",
            a: "No. MD5 runs via a local library and SHA-1/256/512 run via the browser Web Crypto API. All computation happens on your device.",
          },
          id: {
            q: "Apakah masukan saya diunggah ke mana pun?",
            a: "Tidak. MD5 berjalan via pustaka lokal dan SHA-1/256/512 berjalan via Web Crypto API browser. Semua komputasi terjadi di perangkat Anda.",
          },
        },
        {
          en: {
            q: "Why do uppercase and lowercase inputs give different hashes?",
            a: "Hash functions are byte-exact: even one changed byte (including case) produces a completely different digest. Byte length below the input is measured in UTF-8 bytes, which is what gets hashed.",
          },
          id: {
            q: "Mengapa masukan kapital dan kecil menghasilkan hash berbeda?",
            a: "Fungsi hash bersifat byte-exact: satu byte berbeda (termasuk kapitalisasi) menghasilkan digest yang sama sekali berbeda. Panjang byte di bawah masukan diukur dalam byte UTF-8, itulah yang di-hash.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="hash-input"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {s.inputLabel}
              </label>
              <div className="flex flex-wrap gap-1.5" aria-label="stats">
                <Badge variant="secondary">
                  {bytes} {s.bytes}
                </Badge>
                <Badge variant="secondary">
                  {input.length} {s.chars}
                </Badge>
                {cryptoOk ? (
                  <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Web Crypto
                  </Badge>
                ) : (
                  <Badge variant="destructive">{s.cryptoUnavailable}</Badge>
                )}
              </div>
            </div>
            <textarea
              id="hash-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={s.inputPlaceholder}
              rows={5}
              spellCheck={false}
              autoComplete="off"
              className={TEXTAREA_CLS}
              aria-label={s.inputLabel}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={!hasInput}
                className="sm:w-auto"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.lowercaseNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {!hasInput && (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {s.emptyHint}
              </p>
            )}
            <div className="space-y-3">
              {s.algorithms.map((algo) => {
                const key = algo.key as HashKey;
                const value = hashes[key];
                return (
                  <div
                    key={algo.key}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{algo.label}</Badge>
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {algo.bits}
                        </span>
                      </div>
                      <CopyButton
                        text={value}
                        label={s.copy}
                        size="sm"
                        disabled={value === ""}
                        copiedMessage={s.copied}
                        emptyMessage={s.nothingToCopy}
                        errorMessage={s.copyFailed}
                        className="flex-none"
                      />
                    </div>
                    <p
                      className="mt-2 break-all font-mono text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 sm:text-[13px]"
                      aria-live="polite"
                    >
                      {value !== "" ? value : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
