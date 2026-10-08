"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser, Link2, TriangleAlert } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tab = "encode" | "decode" | "parse";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    encodeTab: string;
    decodeTab: string;
    parseTab: string;
    inputLabel: string;
    outputLabel: string;
    encodePlaceholder: string;
    decodePlaceholder: string;
    parsePlaceholder: string;
    mode: string;
    modeFull: string;
    modeComponent: string;
    modeNote: string;
    outputPlaceholder: string;
    copy: string;
    clear: string;
    malformed: string;
    invalidUrl: string;
    copied: string;
    emptyInput: string;
    error: string;
    protocol: string;
    host: string;
    port: string;
    path: string;
    query: string;
    hash: string;
    key: string;
    value: string;
    noQuery: string;
    chars: string;
  }
> = {
  en: {
    title: "URL Encoder / Decoder",
    description:
      "Encode, decode, and dissect URLs with live results in both directions. Everything runs locally in your browser.",
    encodeTab: "Encode",
    decodeTab: "Decode",
    parseTab: "Parse",
    inputLabel: "Input",
    outputLabel: "Output",
    encodePlaceholder: "Paste a URL or text to encode, e.g. https://example.com/a b?x=1&y=2…",
    decodePlaceholder: "Paste percent-encoded text, e.g. hello%20world%21…",
    parsePlaceholder: "Paste a full URL, e.g. https://user@example.com:8080/a/b?x=1&y=2#sec…",
    mode: "Encode mode",
    modeFull: "Full URL (encodeURI — leaves :/?#& intact)",
    modeComponent: "Component (encodeURIComponent — encodes everything)",
    modeNote: "Tip: use Component mode for query values and path segments; Full URL mode keeps the URL structure clickable.",
    outputPlaceholder: "Result appears here…",
    copy: "Copy",
    clear: "Clear",
    malformed: "Malformed percent-encoding: a % must be followed by two hex digits (0–9, A–F).",
    invalidUrl: "Invalid URL: include the scheme, e.g. https://example.com/path",
    copied: "Copied to clipboard.",
    emptyInput: "Nothing to copy yet.",
    error: "Something went wrong.",
    protocol: "Protocol",
    host: "Host",
    port: "Port",
    path: "Path",
    query: "Query params",
    hash: "Fragment",
    key: "Key",
    value: "Value",
    noQuery: "No query parameters.",
    chars: "chars",
  },
  id: {
    title: "URL Encoder / Decoder",
    description:
      "Encode, decode, dan bedah URL dengan hasil langsung dua arah. Semuanya berjalan lokal di browser.",
    encodeTab: "Encode",
    decodeTab: "Decode",
    parseTab: "Parse",
    inputLabel: "Masukan",
    outputLabel: "Keluaran",
    encodePlaceholder: "Tempel URL atau teks untuk di-encode, cth. https://example.com/a b?x=1&y=2…",
    decodePlaceholder: "Tempel teks percent-encoded, cth. halo%20dunia%21…",
    parsePlaceholder: "Tempel URL lengkap, cth. https://user@example.com:8080/a/b?x=1&y=2#sec…",
    mode: "Mode encode",
    modeFull: "URL penuh (encodeURI — :/?#& dibiarkan)",
    modeComponent: "Komponen (encodeURIComponent — semua di-encode)",
    modeNote: "Tips: pakai mode Komponen untuk nilai query dan segmen path; mode URL penuh menjaga struktur URL tetap bisa diklik.",
    outputPlaceholder: "Hasil muncul di sini…",
    copy: "Salin",
    clear: "Bersihkan",
    malformed: "Percent-encoding rusak: % harus diikuti dua digit heksa (0–9, A–F).",
    invalidUrl: "URL tidak valid: sertakan skema, cth. https://example.com/path",
    copied: "Disalin ke clipboard.",
    emptyInput: "Belum ada yang bisa disalin.",
    error: "Terjadi kesalahan.",
    protocol: "Protokol",
    host: "Host",
    port: "Port",
    path: "Path",
    query: "Param query",
    hash: "Fragmen",
    key: "Kunci",
    value: "Nilai",
    noQuery: "Tidak ada parameter query.",
    chars: "karakter",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "When should I use Component mode instead of Full URL?",
      a: "Use Full URL (encodeURI) when encoding an entire link you still want clickable — it leaves : / ? # & alone. Use Component (encodeURIComponent) for individual values like query parameters or path segments, where those characters must become %XX sequences.",
    },
    id: {
      q: "Kapan memakai mode Komponen dibanding URL penuh?",
      a: "Pakai URL penuh (encodeURI) untuk meng-encode tautan utuh yang tetap ingin bisa diklik — ia membiarkan : / ? # &. Pakai Komponen (encodeURIComponent) untuk nilai satuan seperti parameter query atau segmen path, di mana karakter itu harus menjadi urutan %XX.",
    },
  },
  {
    en: {
      q: "Why does decoding fail with a malformed-% error?",
      a: "Every % in percent-encoding must be followed by exactly two hexadecimal digits. A trailing % or sequences like %ZZ are invalid. Fix or remove the stray % and try again.",
    },
    id: {
      q: "Kenapa decoding gagal dengan error malformed-%?",
      a: "Setiap % dalam percent-encoding harus diikuti tepat dua digit heksadesimal. Tanda % di akhir atau urutan seperti %ZZ tidak valid. Perbaiki atau hapus % yang menyimpang lalu coba lagi.",
    },
  },
  {
    en: {
      q: "Is my URL sent anywhere?",
      a: "No. Encoding, decoding, and parsing use native browser APIs entirely on your device. Nothing leaves your browser.",
    },
    id: {
      q: "Apakah URL-ku dikirim ke mana pun?",
      a: "Tidak. Encoding, decoding, dan parsing memakai API bawaan browser sepenuhnya di perangkatmu. Tidak ada yang keluar dari browser.",
    },
  },
];

const TEXTAREA_CLS =
  "mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-sm break-all text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900";

export default function UrlEncoderPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];

  const [tab, setTab] = useState<Tab>("encode");
  const [encInput, setEncInput] = useState("");
  const [encMode, setEncMode] = useState("component");
  const [decInput, setDecInput] = useState("");
  const [parseInput, setParseInput] = useState("");

  const encOutput = useMemo(() => {
    try {
      if (encInput.length === 0) return "";
      return encMode === "full" ? encodeURI(encInput) : encodeURIComponent(encInput);
    } catch {
      return "";
    }
  }, [encInput, encMode]);

  const decResult = useMemo((): { text: string; error: string | null } => {
    try {
      if (decInput.length === 0) return { text: "", error: null };
      try {
        return { text: decodeURIComponent(decInput), error: null };
      } catch {
        return { text: "", error: s.malformed };
      }
    } catch {
      return { text: "", error: s.error };
    }
  }, [decInput, s.malformed, s.error]);

  const parsed = useMemo((): {
    ok: boolean;
    protocol: string;
    host: string;
    port: string;
    path: string;
    hash: string;
    params: { k: string; v: string }[];
  } | null => {
    try {
      if (parseInput.trim().length === 0) return null;
      const u = new URL(parseInput.trim());
      const params: { k: string; v: string }[] = [];
      try {
        u.searchParams.forEach((v, k) => {
          params.push({ k, v });
        });
      } catch {
        // ignore param iteration errors
      }
      return {
        ok: true,
        protocol: u.protocol,
        host: u.hostname,
        port: u.port === "" ? "—" : u.port,
        path: u.pathname,
        hash: u.hash === "" ? "—" : u.hash,
        params,
      };
    } catch {
      return { ok: false, protocol: "", host: "", port: "", path: "", hash: "", params: [] };
    }
  }, [parseInput]);

  const clearAll = (): void => {
    try {
      setEncInput("");
      setDecInput("");
      setParseInput("");
    } catch {
      toast.error(s.error);
    }
  };

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Link2" slug="developer/url-encoder" faq={FAQ}>
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
            { id: "encode", label: s.encodeTab },
            { id: "decode", label: s.decodeTab },
            { id: "parse", label: s.parseTab },
          ]}
        />

        <AnimatedTabPanel tabKey={tab}>
          {tab === "encode" ? (
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="url-enc-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.inputLabel}
                    </label>
                    <Badge variant="secondary" className="font-mono">
                      {encInput.length} {s.chars}
                    </Badge>
                  </div>
                  <textarea
                    id="url-enc-in"
                    value={encInput}
                    onChange={(e) => {
                      try {
                        setEncInput(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    placeholder={s.encodePlaceholder}
                    rows={4}
                    spellCheck={false}
                    className={TEXTAREA_CLS}
                  />
                </div>
                <div>
                  <label htmlFor="url-enc-mode" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.mode}
                  </label>
                  <select
                    id="url-enc-mode"
                    value={encMode}
                    onChange={(e) => {
                      try {
                        setEncMode(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="component">{s.modeComponent}</option>
                    <option value="full">{s.modeFull}</option>
                  </select>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.modeNote}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.outputLabel}</p>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                    {encOutput || s.outputPlaceholder}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CopyButton
                    text={encOutput}
                    label={s.copy}
                    variant="secondary"
                    copiedMessage={s.copied}
                    emptyMessage={s.emptyInput}
                    errorMessage={s.error}
                  />
                  <Button variant="ghost" onClick={clearAll}>
                    <Eraser aria-hidden />
                    {s.clear}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : tab === "decode" ? (
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="url-dec-in" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.inputLabel}
                    </label>
                    <Badge variant="secondary" className="font-mono">
                      {decInput.length} {s.chars}
                    </Badge>
                  </div>
                  <textarea
                    id="url-dec-in"
                    value={decInput}
                    onChange={(e) => {
                      try {
                        setDecInput(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    placeholder={s.decodePlaceholder}
                    rows={4}
                    spellCheck={false}
                    className={TEXTAREA_CLS}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.outputLabel}</p>
                  {decResult.error ? (
                    <div
                      role="alert"
                      className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                    >
                      <p className="flex items-start gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        {decResult.error}
                      </p>
                    </div>
                  ) : (
                    <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs break-all whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                      {decResult.text || s.outputPlaceholder}
                    </pre>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CopyButton
                    text={decResult.text}
                    label={s.copy}
                    variant="secondary"
                    copiedMessage={s.copied}
                    emptyMessage={s.emptyInput}
                    errorMessage={s.error}
                  />
                  <Button variant="ghost" onClick={clearAll}>
                    <Eraser aria-hidden />
                    {s.clear}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <label htmlFor="url-parse-in" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <Link2 className="h-4 w-4" aria-hidden />
                    {s.inputLabel}
                  </label>
                  <textarea
                    id="url-parse-in"
                    value={parseInput}
                    onChange={(e) => {
                      try {
                        setParseInput(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    placeholder={s.parsePlaceholder}
                    rows={3}
                    spellCheck={false}
                    className={TEXTAREA_CLS}
                  />
                </div>
                {parseInput.trim().length > 0 && parsed && !parsed.ok && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                  >
                    <p className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {s.invalidUrl}
                    </p>
                  </div>
                )}
                {parsed && parsed.ok && (
                  <div className="space-y-3">
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        [s.protocol, parsed.protocol],
                        [s.host, parsed.host],
                        [s.port, parsed.port],
                        [s.path, parsed.path],
                        [s.hash, parsed.hash],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {k}
                          </dt>
                          <dd className="truncate font-mono text-sm text-zinc-900 dark:text-zinc-100" title={v}>
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.query} ({parsed.params.length})
                      </p>
                      {parsed.params.length === 0 ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.noQuery}</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <table className="w-full min-w-[320px] border-collapse font-mono text-xs">
                            <thead>
                              <tr className="bg-zinc-100 dark:bg-zinc-800">
                                <th className="border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                                  {s.key}
                                </th>
                                <th className="border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                                  {s.value}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.params.map((p, i) => (
                                <tr key={i} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                                  <td className="break-all border-b border-zinc-100 px-3 py-1.5 text-indigo-700 dark:border-zinc-800 dark:text-indigo-300">
                                    {p.k}
                                  </td>
                                  <td className="break-all border-b border-zinc-100 px-3 py-1.5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                                    {p.v}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Button variant="ghost" onClick={clearAll}>
                  <Eraser aria-hidden />
                  {s.clear}
                </Button>
              </CardContent>
            </Card>
          )}
        </AnimatedTabPanel>
      </div>
    </ToolLayout>
  );
}
