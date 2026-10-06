"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Download, ImagePlus, QrCode, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { ToolSteps } from "@/components/ui/tool-steps";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type QrSize = 256 | 512 | 1024;
type EccLevel = "L" | "M" | "Q" | "H";

const TEXTAREA_CLS =
  "min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SELECT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    descriptionId: string;
    inputLabel: string;
    inputPlaceholder: string;
    emptyHint: string;
    emptyPreview: string;
    fgLabel: string;
    bgLabel: string;
    sizeLabel: string;
    eccLabel: string;
    eccNote: string;
    logoLabel: string;
    logoHint: string;
    logoToggle: string;
    logoOn: string;
    logoOff: string;
    logoLoaded: string;
    logoRemoved: string;
    logoInvalid: string;
    removeLogo: string;
    uploadLogo: string;
    previewLabel: string;
    generating: string;
    generateFailed: string;
    downloadPng: string;
    downloadSvg: string;
    downloadedPng: string;
    downloadedSvg: string;
    downloadFailed: string;
    nothingToDownload: string;
    svgNoLogoNote: string;
    copyText: string;
    copied: string;
    copyFailed: string;
    clear: string;
    cleared: string;
    stepUpload: string;
    stepProcess: string;
    stepDownload: string;
  }
> = {
  en: {
    title: "QR Code Generator",
    description:
      "Generate styled QR codes from any text or URL — custom colors, sizes, and an optional center logo. 100% in your browser.",
    descriptionId:
      "Buat kode QR bergaya dari teks atau URL apa pun — warna, ukuran kustom, dan logo tengah opsional. 100% di browser Anda.",
    inputLabel: "Text / URL",
    inputPlaceholder: "https://example.com or any text…",
    emptyHint: "Enter some text or a URL above to generate a QR code.",
    emptyPreview: "Your QR preview will appear here.",
    fgLabel: "Foreground",
    bgLabel: "Background",
    sizeLabel: "Size (px)",
    eccLabel: "Error correction",
    eccNote: "Higher levels survive damage better — use Q or H when adding a logo.",
    logoLabel: "Center logo (optional)",
    logoHint: "PNG/JPG up to 2 MB. Drawn centered at ~20% of QR size.",
    logoToggle: "Show logo",
    logoOn: "On",
    logoOff: "Off",
    logoLoaded: "Logo loaded.",
    logoInvalid: "Please choose an image file under 2 MB.",
    logoRemoved: "Logo removed.",
    removeLogo: "Remove",
    uploadLogo: "Upload logo",
    previewLabel: "Live preview",
    generating: "Generating…",
    generateFailed: "Failed to generate QR code.",
    downloadPng: "Download PNG",
    downloadSvg: "Download SVG",
    downloadedPng: "QR code PNG downloaded.",
    downloadedSvg: "QR code SVG downloaded.",
    downloadFailed: "Failed to download file.",
    nothingToDownload: "Enter text first before downloading.",
    svgNoLogoNote: "Note: SVG export contains the QR only (logo is PNG-only).",
    copyText: "Copy text",
    copied: "Copied to clipboard.",
    copyFailed: "Failed to copy.",
    clear: "Clear",
    cleared: "Input cleared.",
    stepUpload: "Input",
    stepProcess: "Generate",
    stepDownload: "Download",
  },
  id: {
    title: "Pembuat Kode QR (QR Generator)",
    description:
      "Buat kode QR bergaya dari teks atau URL apa pun — warna, ukuran kustom, dan logo tengah opsional. 100% di browser Anda.",
    descriptionId:
      "Buat kode QR bergaya dari teks atau URL apa pun — warna, ukuran kustom, dan logo tengah opsional. 100% di browser Anda.",
    inputLabel: "Teks / URL",
    inputPlaceholder: "https://contoh.com atau teks apa pun…",
    emptyHint: "Masukkan teks atau URL di atas untuk membuat kode QR.",
    emptyPreview: "Pratinjau QR akan muncul di sini.",
    fgLabel: "Warna depan",
    bgLabel: "Warna latar",
    sizeLabel: "Ukuran (px)",
    eccLabel: "Koreksi kesalahan",
    eccNote: "Level lebih tinggi lebih tahan rusak — pakai Q atau H saat menambah logo.",
    logoLabel: "Logo tengah (opsional)",
    logoHint: "PNG/JPG hingga 2 MB. Digambar di tengah ~20% dari ukuran QR.",
    logoToggle: "Tampilkan logo",
    logoOn: "Aktif",
    logoOff: "Mati",
    logoLoaded: "Logo dimuat.",
    logoInvalid: "Pilih file gambar di bawah 2 MB.",
    logoRemoved: "Logo dihapus.",
    removeLogo: "Hapus",
    uploadLogo: "Unggah logo",
    previewLabel: "Pratinjau langsung",
    generating: "Membuat…",
    generateFailed: "Gagal membuat kode QR.",
    downloadPng: "Unduh PNG",
    downloadSvg: "Unduh SVG",
    downloadedPng: "QR PNG diunduh.",
    downloadedSvg: "QR SVG diunduh.",
    downloadFailed: "Gagal mengunduh file.",
    nothingToDownload: "Masukkan teks dulu sebelum mengunduh.",
    svgNoLogoNote: "Catatan: ekspor SVG hanya berisi QR (logo khusus PNG).",
    copyText: "Salin teks",
    copied: "Berhasil disalin ke clipboard.",
    copyFailed: "Gagal menyalin.",
    clear: "Hapus",
    cleared: "Masukan dihapus.",
    stepUpload: "Input",
    stepProcess: "Buat",
    stepDownload: "Unduh",
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image-load-failed"));
      img.src = src;
    } catch (e) {
      reject(e instanceof Error ? e : new Error("image-load-failed"));
    }
  });
}

async function compositeQr(
  text: string,
  size: QrSize,
  fg: string,
  bg: string,
  ecc: EccLevel,
  logoDataUrl: string | null,
  showLogo: boolean,
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: ecc,
    color: { dark: fg, light: bg },
  });
  if (!showLogo || !logoDataUrl) return qrDataUrl;
  const [qrImg, logoImg] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage(logoDataUrl),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;
  ctx.drawImage(qrImg, 0, 0, size, size);
  const logoSize = Math.round(size * 0.2);
  const x = Math.round((size - logoSize) / 2);
  const y = Math.round((size - logoSize) / 2);
  const pad = Math.max(4, Math.round(logoSize * 0.08));
  ctx.fillStyle = bg;
  ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
  ctx.drawImage(logoImg, x, y, logoSize, logoSize);
  return canvas.toDataURL("image/png");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default function QrGeneratorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [text, setText] = useState("");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState<QrSize>(512);
  const [ecc, setEcc] = useState<EccLevel>("M");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasInput = text.trim() !== "";
  const stage: 0 | 1 | 2 | 3 = !hasInput ? 0 : busy ? 2 : preview ? 3 : 1;

  const regenerate = useCallback(
    async (snapshot: {
      text: string;
      fg: string;
      bg: string;
      size: QrSize;
      ecc: EccLevel;
      logo: string | null;
      showLogo: boolean;
    }) => {
      const id = ++reqId.current;
      if (snapshot.text.trim() === "") {
        setPreview(null);
        setBusy(false);
        return;
      }
      setBusy(true);
      try {
        const url = await compositeQr(
          snapshot.text,
          snapshot.size,
          snapshot.fg,
          snapshot.bg,
          snapshot.ecc,
          snapshot.logo,
          snapshot.showLogo,
        );
        if (reqId.current === id) setPreview(url);
      } catch {
        if (reqId.current === id) {
          setPreview(null);
          toast.error(s.generateFailed);
        }
      } finally {
        if (reqId.current === id) setBusy(false);
      }
    },
    [s.generateFailed],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      void regenerate({ text, fg, bg, size, ecc, logo: logoDataUrl, showLogo });
    }, 300);
    return () => window.clearTimeout(t);
  }, [text, fg, bg, size, ecc, logoDataUrl, showLogo, regenerate]);

  function handleLogoFile(file: File | undefined): void {
    try {
      if (!file) return;
      const isImage = file.type.startsWith("image/");
      if (!isImage || file.size > 2 * 1024 * 1024) {
        toast.error(s.logoInvalid);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = typeof reader.result === "string" ? reader.result : null;
          if (!result) {
            toast.error(s.logoInvalid);
            return;
          }
          setLogoDataUrl(result);
          setShowLogo(true);
          toast.success(s.logoLoaded);
        } catch {
          toast.error(s.logoInvalid);
        }
      };
      reader.onerror = () => toast.error(s.logoInvalid);
      reader.readAsDataURL(file);
    } catch {
      toast.error(s.logoInvalid);
    }
  }

  function handleRemoveLogo(): void {
    try {
      setLogoDataUrl(null);
      setShowLogo(false);
      if (fileRef.current) fileRef.current.value = "";
      toast.success(s.logoRemoved);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  function handleClear(): void {
    try {
      setText("");
      setPreview(null);
      toast.success(s.cleared);
    } catch {
      toast.error(s.copyFailed);
    }
  }

  async function handleDownloadPng(): Promise<void> {
    try {
      if (!hasInput) {
        toast.info(s.nothingToDownload);
        return;
      }
      const dataUrl = await compositeQr(text, size, fg, bg, ecc, logoDataUrl, showLogo);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      downloadBlob(blob, "qr-code.png");
      toast.success(s.downloadedPng);
    } catch {
      toast.error(s.downloadFailed);
    }
  }

  async function handleDownloadSvg(): Promise<void> {
    try {
      if (!hasInput) {
        toast.info(s.nothingToDownload);
        return;
      }
      const svg = await QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: 2,
        errorCorrectionLevel: ecc,
        color: { dark: fg, light: bg },
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      downloadBlob(blob, "qr-code.svg");
      toast.success(s.downloadedSvg);
      if (showLogo && logoDataUrl) toast.info(s.svgNoLogoNote);
    } catch {
      toast.error(s.downloadFailed);
    }
  }

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      descriptionId={s.descriptionId}
      iconName="QrCode"
      slug="text/qr-generator"
      faq={[
        {
          en: {
            q: "Will my QR code expire?",
            a: "No. The QR image simply encodes the text or URL you entered — it works offline forever and is generated locally, so nothing is uploaded or tracked.",
          },
          id: {
            q: "Apakah kode QR saya kedaluwarsa?",
            a: "Tidak. Gambar QR hanya mengenkode teks atau URL yang Anda masukkan — berlaku selamanya secara offline dan dibuat lokal, jadi tidak ada yang diunggah atau dilacak.",
          },
        },
        {
          en: {
            q: "Which error-correction level should I choose?",
            a: "L (~7% damage tolerance) gives the densest code, M (~15%) is the balanced default, Q (~25%) and H (~30%) survive heavy damage or a center logo. Use Q or H whenever you overlay a logo.",
          },
          id: {
            q: "Level koreksi kesalahan mana yang harus dipilih?",
            a: "L (~7% toleransi kerusakan) paling padat, M (~15%) adalah default seimbang, Q (~25%) dan H (~30%) tahan terhadap kerusakan berat atau logo tengah. Gunakan Q atau H setiap kali menempel logo.",
          },
        },
        {
          en: {
            q: "Why does PNG include my logo but SVG does not?",
            a: "PNG is composited on a canvas (QR + centered logo at ~20% size with a background pad so scanners can still read it). SVG export is the pure vector QR, because vector embedding of raster logos is unreliable across readers.",
          },
          id: {
            q: "Mengapa PNG memuat logo tetapi SVG tidak?",
            a: "PNG digabung di canvas (QR + logo tengah ~20% ukuran dengan bantalan latar agar tetap terbaca pemindai). Ekspor SVG adalah QR vektor murni, karena menanam logo raster ke vektor tidak andal di berbagai pembaca.",
          },
        },
        {
          en: {
            q: "What colors scan best?",
            a: "Dark foreground on a light background with strong contrast (e.g. black on white). Avoid light-on-dark or low-contrast pairs — many scanners fail on inverted codes.",
          },
          id: {
            q: "Warna apa yang paling mudah dipindai?",
            a: "Warna depan gelap di atas latar terang dengan kontras kuat (mis. hitam di atas putih). Hindari terang-di-atas-gelap atau pasangan kontras rendah — banyak pemindai gagal membaca kode terbalik.",
          },
        },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ToolSteps stage={stage} labels={[s.stepUpload, s.stepProcess, s.stepDownload]} />
        </div>
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="qr-input"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {s.inputLabel}
                </label>
                <Badge variant={hasInput ? "default" : "secondary"}>
                  {hasInput ? text.length : 0} chars
                </Badge>
              </div>
              <textarea
                id="qr-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={s.inputPlaceholder}
                rows={4}
                spellCheck={false}
                autoComplete="off"
                className={TEXTAREA_CLS}
                aria-label={s.inputLabel}
              />
              {!hasInput && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.emptyHint}</p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <CopyButton
                  text={text}
                  label={s.copyText}
                  size="sm"
                  disabled={!hasInput}
                  copiedMessage={s.copied}
                  emptyMessage={s.emptyHint}
                  errorMessage={s.copyFailed}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={!hasInput}
                  className="flex-1"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {s.clear}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.fgLabel}
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    aria-label={s.fgLabel}
                    className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs uppercase text-zinc-600 dark:text-zinc-400">
                    {fg}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.bgLabel}
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    aria-label={s.bgLabel}
                    className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs uppercase text-zinc-600 dark:text-zinc-400">
                    {bg}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="qr-size"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {s.sizeLabel}
                </label>
                <select
                  id="qr-size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value) as QrSize)}
                  className={SELECT_CLS}
                >
                  <option value={256}>256 px</option>
                  <option value={512}>512 px</option>
                  <option value={1024}>1024 px</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="qr-ecc"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {s.eccLabel}
                </label>
                <select
                  id="qr-ecc"
                  value={ecc}
                  onChange={(e) => setEcc(e.target.value as EccLevel)}
                  className={SELECT_CLS}
                >
                  <option value="L">L — ~7%</option>
                  <option value="M">M — ~15%</option>
                  <option value="Q">Q — ~25%</option>
                  <option value="H">H — ~30%</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.eccNote}</p>

            <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.logoLabel}
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    disabled={!logoDataUrl}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="h-4 w-4 accent-indigo-600"
                    aria-label={s.logoToggle}
                  />
                  {s.logoToggle}: {showLogo ? s.logoOn : s.logoOff}
                </label>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.logoHint}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label={s.logoLabel}
                  onChange={(e) => handleLogoFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                  {s.uploadLogo}
                </Button>
                {logoDataUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    {s.removeLogo}
                  </Button>
                )}
                {logoDataUrl && showLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoDataUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {s.previewLabel}
              </span>
              {busy ? (
                <Badge variant="secondary">{s.generating}</Badge>
              ) : (
                <Badge variant="secondary">
                  <QrCode className="h-3 w-3" aria-hidden />
                  {size}px · {ecc}
                </Badge>
              )}
            </div>
            <div
              className={cn(
                "flex min-h-[280px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950",
              )}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="QR code preview"
                  width={Math.min(size, 512)}
                  height={Math.min(size, 512)}
                  className="h-auto w-full max-w-[320px] rounded-lg"
                />
              ) : (
                <p className="px-3 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  {s.emptyPreview}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleDownloadPng}
                disabled={!hasInput}
                className="flex-1"
              >
                <Download className="h-4 w-4" aria-hidden />
                {s.downloadPng}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadSvg}
                disabled={!hasInput}
                className="flex-1"
              >
                <Download className="h-4 w-4" aria-hidden />
                {s.downloadSvg}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.svgNoLogoNote}</p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
