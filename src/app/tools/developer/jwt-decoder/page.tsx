"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AlertTriangle, CheckCircle2, Copy, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useToolClear, useToolPaste } from "@/hooks/useToolClipboard";

const TEXTAREA_CLS =
  "min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 break-all";

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFJT1Rvb2xzIERlbW8iLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MjAwMDAwMDAwMH0.c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmFsaWQtZm9yLXZha2UtdG9rZW4";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    privacyBanner: string;
    inputLabel: string;
    inputPlaceholder: string;
    sample: string;
    clear: string;
    sampleLoaded: string;
    cleared: string;
    copied: string;
    copyFailed: string;
    nothingToCopy: string;
    structureError: string;
    emptyHint: string;
    invalidTitle: string;
    validStructure: string;
    invalidStructure: string;
    expValid: (d: string) => string;
    expExpired: (d: string) => string;
    expNone: string;
    iatLabel: (d: string) => string;
    headerLabel: string;
    payloadLabel: string;
    signatureLabel: string;
    signatureNote: string;
    signaturePrivacy: string;
    copy: string;
  }
> = {
  en: {
    title: "JWT Decoder",
    description: "Decode JSON Web Tokens locally: header, payload, signature and expiry.",
    descriptionId: "Decode JWT lokal: header, payload, signature, dan masa kedaluwarsa.",
    privacyBanner: "Decoded locally in your browser. Never sent to any server.",
    inputLabel: "JWT token",
    inputPlaceholder: "Paste your JWT here (xxxxx.yyyyy.zzzzz)…",
    sample: "Sample token",
    clear: "Clear",
    sampleLoaded: "Sample token loaded.",
    cleared: "Token cleared.",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    nothingToCopy: "Nothing to copy yet.",
    structureError: "That doesn't look like a valid JWT.",
    emptyHint: "Paste a token above — decoded header and payload will appear here.",
    invalidTitle: "Invalid token structure",
    validStructure: "Structure valid",
    invalidStructure: "Structure invalid",
    expValid: (d) => `Valid until ${d}`,
    expExpired: (d) => `Expired ${d}`,
    expNone: "No exp claim",
    iatLabel: (d) => `Issued at ${d}`,
    headerLabel: "Header",
    payloadLabel: "Payload",
    signatureLabel: "Signature",
    signatureNote: "Signature cannot be verified without the secret — decode only.",
    signaturePrivacy: "Decoded locally in your browser. Never sent to any server.",
    copy: "Copy",
  },
  id: {
    title: "Dekoder JWT (JWT Decoder)",
    description: "Decode JWT lokal: header, payload, signature, dan masa kedaluwarsa.",
    descriptionId: "Decode JWT lokal: header, payload, signature, dan masa kedaluwarsa.",
    privacyBanner: "Didekode lokal di browser Anda. Tidak pernah dikirim ke server mana pun.",
    inputLabel: "Token JWT",
    inputPlaceholder: "Tempel JWT Anda di sini (xxxxx.yyyyy.zzzzz)…",
    sample: "Token contoh",
    clear: "Hapus",
    sampleLoaded: "Token contoh dimuat.",
    cleared: "Token dihapus.",
    copied: "Disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    nothingToCopy: "Belum ada yang bisa disalin.",
    structureError: "Itu tampaknya bukan JWT yang valid.",
    emptyHint: "Tempel token di atas — header dan payload yang didekode akan muncul di sini.",
    invalidTitle: "Struktur token tidak valid",
    validStructure: "Struktur valid",
    invalidStructure: "Struktur tidak valid",
    expValid: (d) => `Berlaku hingga ${d}`,
    expExpired: (d) => `Kedaluwarsa ${d}`,
    expNone: "Tidak ada klaim exp",
    iatLabel: (d) => `Diterbitkan ${d}`,
    headerLabel: "Header",
    payloadLabel: "Payload",
    signatureLabel: "Signature",
    signatureNote: "Signature tidak bisa diverifikasi tanpa secret — hanya decode.",
    signaturePrivacy: "Didekode lokal di browser Anda. Tidak pernah dikirim ke server mana pun.",
    copy: "Salin",
  },
};

function base64UrlDecode(segment: string): string {
  let b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad !== 0) throw new Error("Invalid base64url segment");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toSeconds(value: number): number {
  // Heuristic: values far beyond plausible seconds are millisecond timestamps.
  return value > 4102444800 ? Math.floor(value / 1000) : value;
}

function formatClaimDate(seconds: number): string {
  try {
    return new Date(seconds * 1000).toLocaleString();
  } catch {
    return String(seconds);
  }
}

interface DecodedJwt {
  headerPretty: string;
  payloadPretty: string;
  signature: string;
  expSeconds: number | null;
  iatSeconds: number | null;
}

export default function JwtDecoderPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState("");
  const lastErrorRef = useRef(false);

  useToolPaste(setToken);
  useToolClear(() => setToken(""));

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const { decoded, error } = useMemo(() => {
    try {
      const trimmed = token.trim();
      if (trimmed === "") return { decoded: null as DecodedJwt | null, error: null as string | null };
      const parts = trimmed.split(".");
      if (parts.length !== 3 || parts.some((p) => p === "")) {
        return { decoded: null, error: "Token must have exactly 3 dot-separated parts (header.payload.signature)." };
      }
      const headerJson = base64UrlDecode(parts[0]);
      const payloadJson = base64UrlDecode(parts[1]);
      let headerObj: unknown;
      let payloadObj: unknown;
      try {
        headerObj = JSON.parse(headerJson);
      } catch {
        return { decoded: null, error: "Header segment is not valid JSON." };
      }
      try {
        payloadObj = JSON.parse(payloadJson);
      } catch {
        return { decoded: null, error: "Payload segment is not valid JSON." };
      }
      let expSeconds: number | null = null;
      let iatSeconds: number | null = null;
      try {
        const p = payloadObj as Record<string, unknown>;
        if (typeof p.exp === "number" && Number.isFinite(p.exp)) expSeconds = toSeconds(p.exp);
        if (typeof p.iat === "number" && Number.isFinite(p.iat)) iatSeconds = toSeconds(p.iat);
      } catch {
        // claim extraction is best-effort
      }
      return {
        decoded: {
          headerPretty: JSON.stringify(headerObj, null, 2),
          payloadPretty: JSON.stringify(payloadObj, null, 2),
          signature: parts[2],
          expSeconds,
          iatSeconds,
        },
        error: null,
      };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [token]);

  // Toast once per transition into an error state (not on every keystroke).
  useEffect(() => {
    try {
      const isErr = error !== null;
      if (isErr && !lastErrorRef.current) toast.error(s.structureError);
      lastErrorRef.current = isErr;
    } catch {
      // toast must never break the UI
    }
  }, [error, s.structureError]);

  const expState: "valid" | "expired" | "none" = useMemo(() => {
    try {
      if (!decoded || decoded.expSeconds === null) return "none";
      return decoded.expSeconds * 1000 > Date.now() ? "valid" : "expired";
    } catch {
      return "none";
    }
  }, [decoded]);

  async function handleCopy(value: string): Promise<void> {
    try {
      if (value === "") {
        toast.info(s.nothingToCopy);
        return;
      }
      await navigator.clipboard.writeText(value);
      toast.success(s.copied);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleSample(): void {
    try {
      setToken(SAMPLE_TOKEN);
      toast.success(s.sampleLoaded);
    } catch {
      // ignore state errors
    }
  }

  function handleClear(): void {
    try {
      setToken("");
      toast.success(s.cleared);
    } catch {
      // ignore state errors
    }
  }

  function renderJsonBlock(value: string, label: string, copyValue: string): React.JSX.Element {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => handleCopy(copyValue)}>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {s.copy}
          </Button>
        </div>
        <div
          className={cn(
            "overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800",
            "[&>pre]:!m-0 [&>pre]:max-h-[320px] [&>pre]:!rounded-lg [&>pre]:!text-[13px] [&>pre]:!leading-relaxed",
          )}
        >
          {mounted ? (
            <SyntaxHighlighter
              language="json"
              style={isDark ? oneDark : oneLight}
              customStyle={{ margin: 0 }}
              showLineNumbers={false}
            >
              {value}
            </SyntaxHighlighter>
          ) : (
            <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words bg-zinc-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
              {value}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="KeyRound"
      slug="developer/jwt-decoder"
      faq={[
        {
          en: {
            q: "Does this tool verify the token signature?",
            a: "No — this is decode-only. The signature is shown as raw text so you can inspect it, but cryptographic verification requires the signing secret, which you should never paste into any website.",
          },
          id: {
            q: "Apakah tool ini memverifikasi signature token?",
            a: "Tidak — ini hanya decode. Signature ditampilkan sebagai teks mentah agar bisa diperiksa, tetapi verifikasi kriptografi membutuhkan secret penandatangan yang tidak boleh ditempel ke situs web mana pun.",
          },
        },
        {
          en: {
            q: "How do I know if my token is expired?",
            a: "The tool reads the exp claim (seconds since epoch) and compares it with the current time: green means still valid, red means expired, gray means the token carries no exp claim at all.",
          },
          id: {
            q: "Bagaimana cara tahu token saya kedaluwarsa?",
            a: "Tool membaca klaim exp (detik sejak epoch) dan membandingkannya dengan waktu saat ini: hijau berarti masih berlaku, merah berarti kedaluwarsa, abu-abu berarti token tidak memiliki klaim exp sama sekali.",
          },
        },
        {
          en: {
            q: "Is it safe to paste a production token here?",
            a: "Decoding happens entirely in your browser — the token is never sent to any server. Still, tokens can carry sensitive data and live credentials, so prefer test tokens and clear the field when done.",
          },
          id: {
            q: "Apakah aman menempel token produksi di sini?",
            a: "Decoding terjadi sepenuhnya di browser Anda — token tidak pernah dikirim ke server mana pun. Namun token bisa berisi data sensitif dan kredensial aktif, jadi utamakan token pengujian dan hapus field setelah selesai.",
          },
        },
      ]}
    >
      <div className="space-y-4">
        <p className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-xs font-medium text-emerald-700 sm:text-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          {s.privacyBanner}
        </p>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <label
              htmlFor="jwt-token"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {s.inputLabel}
            </label>
            <textarea
              id="jwt-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={s.inputPlaceholder}
              rows={4}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              className={TEXTAREA_CLS}
              aria-label={s.inputLabel}
              aria-invalid={error !== null}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleSample}>
                {s.sample}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={token === ""}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {s.clear}
              </Button>
            </div>
            {decoded && (
              <div className="flex flex-wrap gap-1.5" aria-live="polite">
                <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  {s.validStructure}
                </Badge>
                {expState === "valid" && decoded.expSeconds !== null && (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600/90">
                    {s.expValid(formatClaimDate(decoded.expSeconds))}
                  </Badge>
                )}
                {expState === "expired" && decoded.expSeconds !== null && (
                  <Badge variant="destructive">
                    {s.expExpired(formatClaimDate(decoded.expSeconds))}
                  </Badge>
                )}
                {expState === "none" && <Badge variant="secondary">{s.expNone}</Badge>}
                {decoded.iatSeconds !== null && (
                  <Badge variant="secondary">{s.iatLabel(formatClaimDate(decoded.iatSeconds))}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {token.trim() === "" ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {s.emptyHint}
              </p>
            </CardContent>
          </Card>
        ) : error !== null ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {error.includes("parts") || error.includes("JSON") ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    {s.invalidTitle} — {s.invalidStructure}
                  </p>
                  <p className="mt-0.5 break-words font-mono text-xs">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          decoded && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {renderJsonBlock(decoded.headerPretty, s.headerLabel, decoded.headerPretty)}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {renderJsonBlock(decoded.payloadPretty, s.payloadLabel, decoded.payloadPretty)}
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="space-y-2.5 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.signatureLabel}
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(decoded.signature)}
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      {s.copy}
                    </Button>
                  </div>
                  <p className="break-all rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                    {decoded.signature}
                  </p>
                  <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {s.signatureNote}
                  </p>
                  <p className="flex items-start gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {s.signaturePrivacy}
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    </ToolLayout>
  );
}
