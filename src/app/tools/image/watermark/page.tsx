"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { Download, Type, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSlider } from "@/components/ui/animated-slider";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { FileDropzone } from "@/components/tools/FileDropzone";
import { AnimatedTabs, AnimatedTabPanel } from "@/components/ui/animated-tabs";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Tab = "text" | "logo";

interface WmStrings {
  description: string;
  helper: string;
  logoHelper: string;
  tabText: string;
  tabLogo: string;
  textLabel: string;
  textPh: string;
  fontLabel: string;
  sizeLabel: string;
  colorLabel: string;
  opacityLabel: string;
  rotationLabel: string;
  positionLabel: string;
  scaleLabel: string;
  download: string;
  noImage: string;
  noImageDesc: string;
  noLogo: string;
  drawn: string;
  failed: string;
  needBase: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
}

const STR: Record<Locale, WmStrings> = {
  en: {
    description: "Add a text or logo watermark to any image, right in your browser. Live canvas preview, 9-point positioning, then download as PNG.",
    helper: "Single image up to 10 MB — JPG, PNG, WebP.",
    logoHelper: "Logo file up to 10 MB — PNG with transparency works best.",
    tabText: "Text",
    tabLogo: "Logo",
    textLabel: "Watermark text",
    textPh: "© Your Name",
    fontLabel: "Font",
    sizeLabel: "Size",
    colorLabel: "Color",
    opacityLabel: "Opacity",
    rotationLabel: "Rotation",
    positionLabel: "Position",
    scaleLabel: "Logo size",
    download: "Download PNG",
    noImage: "No image yet",
    noImageDesc: "Upload an image above to see the live watermark preview.",
    noLogo: "Upload a logo file below to overlay it on the image.",
    drawn: "Watermark preview updated.",
    failed: "Could not render the watermark.",
    needBase: "Upload a base image first.",
    faqQ1: "Is my image uploaded anywhere?",
    faqA1: "No. The image is drawn on a <canvas> element locally and the watermark is composited in your browser. Nothing leaves your device.",
    faqQ2: "What logo format works best?",
    faqA2: "A PNG with a transparent background works best — it blends cleanly over photos at any opacity. JPG logos will show a solid rectangular background.",
    faqQ3: "What resolution is the download?",
    faqA3: "The PNG is exported at the original image resolution (doubled up to a 64 MP cap for crisp text), so quality matches your source file.",
  },
  id: {
    description: "Tambahkan watermark teks atau logo ke gambar apa pun, langsung di browser. Pratinjau canvas real-time, 9 titik posisi, lalu unduh sebagai PNG.",
    helper: "Satu gambar hingga 10 MB — JPG, PNG, WebP.",
    logoHelper: "File logo hingga 10 MB — PNG dengan transparansi paling bagus.",
    tabText: "Teks",
    tabLogo: "Logo",
    textLabel: "Teks watermark",
    textPh: "© Nama Kamu",
    fontLabel: "Font",
    sizeLabel: "Ukuran",
    colorLabel: "Warna",
    opacityLabel: "Opasitas",
    rotationLabel: "Rotasi",
    positionLabel: "Posisi",
    scaleLabel: "Ukuran logo",
    download: "Unduh PNG",
    noImage: "Belum ada gambar",
    noImageDesc: "Unggah gambar di atas untuk melihat pratinjau watermark langsung.",
    noLogo: "Unggah file logo di bawah untuk menaruhnya di atas gambar.",
    drawn: "Pratinjau watermark diperbarui.",
    failed: "Gagal me-render watermark.",
    needBase: "Unggah gambar dasar terlebih dahulu.",
    faqQ1: "Apakah gambar saya diunggah ke mana pun?",
    faqA1: "Tidak. Gambar digambar pada elemen <canvas> secara lokal dan watermark digabungkan di browser-mu. Tidak ada yang keluar dari perangkatmu.",
    faqQ2: "Format logo apa yang paling bagus?",
    faqA2: "PNG dengan latar transparan paling bagus — menyatu rapi di atas foto pada opasitas berapa pun. Logo JPG akan menampilkan latar kotak yang solid.",
    faqQ3: "Berapa resolusi hasil unduhannya?",
    faqA3: "PNG diekspor pada resolusi asli gambar (digandakan hingga batas 64 MP agar teks tajam), jadi kualitasnya setara file sumber.",
  },
};

const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Impact",
  "system-ui",
  "monospace",
];

function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

export default function WatermarkPage() {
  const { locale } = useLocale();
  const s = STR[locale];

  const [tab, setTab] = useState<Tab>("text");
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const [wmText, setWmText] = useState("© AIOTools");
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [textOpacity, setTextOpacity] = useState(0.7);
  const [rotation, setRotation] = useState(0);
  const [logoScale, setLogoScale] = useState(0.2);
  const [logoOpacity, setLogoOpacity] = useState(0.8);
  const [position, setPosition] = useState(8); // bottom-right default

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url);
  }, []);

  useEffect(() => {
    const bag = urlsRef.current;
    return () => {
      try {
        for (const u of bag) {
          try {
            URL.revokeObjectURL(u);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const handleBase = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        setBaseUrl((prev) => {
          try {
            if (prev) URL.revokeObjectURL(prev);
          } catch {
            // ignore
          }
          return null;
        });
        setBaseImg(null);
        const url = URL.createObjectURL(f);
        trackUrl(url);
        setBaseUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [trackUrl, s.failed],
  );

  const handleLogo = useCallback(
    (files: File[]) => {
      try {
        const f = files[0];
        if (!f) return;
        setLogoUrl((prev) => {
          try {
            if (prev) URL.revokeObjectURL(prev);
          } catch {
            // ignore
          }
          return null;
        });
        setLogoImg(null);
        const url = URL.createObjectURL(f);
        trackUrl(url);
        setLogoUrl(url);
      } catch {
        toast.error(s.failed);
      }
    },
    [trackUrl, s.failed],
  );

  useEffect(() => {
    let cancelled = false;
    if (!baseUrl) return;
    try {
      void loadImageEl(baseUrl)
        .then((img) => {
          if (!cancelled) setBaseImg(img);
        })
        .catch(() => {
          if (!cancelled) toast.error(s.failed);
        });
    } catch {
      toast.error(s.failed);
    }
    return () => {
      cancelled = true;
    };
  }, [baseUrl, s.failed]);

  useEffect(() => {
    let cancelled = false;
    if (!logoUrl) return;
    try {
      void loadImageEl(logoUrl)
        .then((img) => {
          if (!cancelled) setLogoImg(img);
        })
        .catch(() => {
          if (!cancelled) toast.error(s.failed);
        });
    } catch {
      toast.error(s.failed);
    }
    return () => {
      cancelled = true;
    };
  }, [logoUrl, s.failed]);

  // Live canvas redraw on any change
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !baseImg) return;
      const natW = baseImg.naturalWidth || baseImg.width;
      const natH = baseImg.naturalHeight || baseImg.height;
      if (!natW || !natH) return;
      // HiDPI scale 2, capped to ~64 MP to avoid OOM on huge photos
      const scale = natW * natH * 4 > 64_000_000 ? 1 : 2;
      canvas.width = Math.round(natW * scale);
      canvas.height = Math.round(natH * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-2d-unavailable");
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(baseImg, 0, 0, natW, natH);

      const pad = Math.max(12, Math.round(natW * 0.02));
      const col = position % 3;
      const row = Math.floor(position / 3);
      const anchorX = col === 0 ? pad : col === 1 ? natW / 2 : natW - pad;
      const anchorY = row === 0 ? pad : row === 1 ? natH / 2 : natH - pad;

      if (tab === "text") {
        const label = wmText.trim() || "©";
        ctx.save();
        ctx.globalAlpha = textOpacity;
        ctx.translate(anchorX, anchorY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.font = `${fontSize}px "${font}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      } else if (logoImg) {
        const natLW = logoImg.naturalWidth || logoImg.width;
        const natLH = logoImg.naturalHeight || logoImg.height;
        if (natLW && natLH) {
          const logoW = natW * logoScale;
          const logoH = (logoW * natLH) / natLW;
          const dx = col === 0 ? pad : col === 1 ? (natW - logoW) / 2 : natW - logoW - pad;
          const dy = row === 0 ? pad : row === 1 ? (natH - logoH) / 2 : natH - logoH - pad;
          ctx.save();
          ctx.globalAlpha = logoOpacity;
          ctx.drawImage(logoImg, dx, dy, logoW, logoH);
          ctx.restore();
        }
      }
      ctx.restore();
    } catch {
      toast.error(s.failed);
    }
  }, [
    baseImg,
    logoImg,
    tab,
    wmText,
    font,
    fontSize,
    color,
    textOpacity,
    rotation,
    logoScale,
    logoOpacity,
    position,
    s.failed,
  ]);

  const download = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !baseImg) {
        toast.error(s.needBase);
        return;
      }
      canvas.toBlob(
        (blob) => {
          try {
            if (!blob) throw new Error("encode-failed");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "watermarked.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => {
              try {
                URL.revokeObjectURL(url);
              } catch {
                // ignore
              }
            }, 4000);
            toast.success(s.drawn);
          } catch {
            toast.error(s.failed);
          }
        },
        "image/png",
      );
    } catch {
      toast.error(s.failed);
    }
  }, [baseImg, s]);

  return (
    <ToolLayout
      title="Image Watermark"
      description={s.description}
      descriptionId={s.description}
      iconName="FileImage"
      slug="image/watermark"
      faq={[
        { en: { q: STR.en.faqQ1, a: STR.en.faqA1 }, id: { q: STR.id.faqQ1, a: STR.id.faqA1 } },
        { en: { q: STR.en.faqQ2, a: STR.en.faqA2 }, id: { q: STR.id.faqQ2, a: STR.id.faqA2 } },
        { en: { q: STR.en.faqQ3, a: STR.en.faqA3 }, id: { q: STR.id.faqQ3, a: STR.id.faqA3 } },
      ]}
    >
      <div className="space-y-4">
        <FileDropzone
          accept={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          maxSizeMB={10}
          maxFiles={1}
          onFiles={handleBase}
          helperText={s.helper}
        />

        <AnimatedTabs
          ariaLabel="watermark mode"
          value={tab}
          onChange={(id) => {
            try {
              setTab(id as Tab);
            } catch {
              // ignore
            }
          }}
          tabs={[
            { id: "text", label: s.tabText, icon: <Type className="h-4 w-4" aria-hidden /> },
            { id: "logo", label: s.tabLogo, icon: <ImageIcon className="h-4 w-4" aria-hidden /> },
          ]}
        />

        {tab === "logo" && (
          <FileDropzone
            accept={["image/png", "image/jpeg", "image/webp"]}
            multiple={false}
            maxSizeMB={10}
            maxFiles={1}
            onFiles={handleLogo}
            helperText={s.logoHelper}
          />
        )}

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <AnimatedTabPanel tabKey={tab}>
            {tab === "text" ? (
              <>
                <div>
                  <label htmlFor="wm-text" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.textLabel}
                  </label>
                  <input
                    id="wm-text"
                    type="text"
                    value={wmText}
                    placeholder={s.textPh}
                    onChange={(e) => {
                      try {
                        setWmText(e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wm-font" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.fontLabel}
                    </label>
                    <select
                      id="wm-font"
                      value={font}
                      onChange={(e) => {
                        try {
                          setFont(e.target.value);
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <AnimatedSlider
                      label={s.sizeLabel}
                      value={fontSize}
                      min={12}
                      max={160}
                      step={1}
                      onChange={(v) => {
                        try {
                          setFontSize(Math.min(160, Math.max(12, Math.round(v))));
                        } catch {
                          // ignore
                        }
                      }}
                      format={(v) => `${Math.round(v)}px`}
                      id="wm-size"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.colorLabel}: <span className="font-mono uppercase">{color}</span>
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <HexColorPicker
                      color={color}
                      onChange={(c) => {
                        try {
                          setColor(c);
                        } catch {
                          // ignore
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={color}
                      aria-label={s.colorLabel}
                      onChange={(e) => {
                        try {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                        } catch {
                          // ignore
                        }
                      }}
                      spellCheck={false}
                      className="w-28 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm uppercase text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <AnimatedSlider
                      label={s.opacityLabel}
                      value={Math.round(textOpacity * 100)}
                      min={5}
                      max={100}
                      step={5}
                      onChange={(v) => {
                        try {
                          setTextOpacity(Math.min(1, Math.max(0.05, v / 100)));
                        } catch {
                          // ignore
                        }
                      }}
                      format={(v) => `${Math.round(v)}%`}
                      id="wm-opacity"
                    />
                  </div>
                  <div>
                    <label htmlFor="wm-rot" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.rotationLabel}: <span className="tabular-nums">{rotation}°</span>
                    </label>
                    <input
                      id="wm-rot"
                      type="range"
                      min={-45}
                      max={45}
                      value={rotation}
                      onChange={(e) => {
                        try {
                          setRotation(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="wm-scale" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.scaleLabel}: <span className="tabular-nums">{Math.round(logoScale * 100)}%</span>
                    </label>
                    <input
                      id="wm-scale"
                      type="range"
                      min={0.05}
                      max={0.5}
                      step={0.01}
                      value={logoScale}
                      onChange={(e) => {
                        try {
                          setLogoScale(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="wm-lopacity" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.opacityLabel}: <span className="tabular-nums">{Math.round(logoOpacity * 100)}%</span>
                    </label>
                    <input
                      id="wm-lopacity"
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={logoOpacity}
                      onChange={(e) => {
                        try {
                          setLogoOpacity(Number(e.target.value));
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-2 w-full accent-indigo-600"
                    />
                  </div>
                </div>
                {!logoImg && (
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.noLogo}</p>
                )}
              </>
            )}
            </AnimatedTabPanel>

            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.positionLabel}</p>
              <div className="mt-2 grid w-fit grid-cols-3 gap-1.5" role="group" aria-label={s.positionLabel}>
                {Array.from({ length: 9 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      try {
                        setPosition(i);
                      } catch {
                        // ignore
                      }
                    }}
                    aria-pressed={position === i}
                    aria-label={`position ${i + 1}`}
                    className={cn(
                      "h-9 w-9 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                      position === i
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-zinc-300 bg-white hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900",
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {baseImg ? (
              <>
                <canvas
                  ref={canvasRef}
                  className="h-auto max-h-[70vh] w-full rounded-xl border border-zinc-200 object-contain dark:border-zinc-800"
                />
                <Button onClick={download} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Download className="h-4 w-4" aria-hidden />
                  {s.download}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Type className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.noImage}</p>
                <p className="max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.noImageDesc}</p>
              </div>
            )}
            {/* Hidden live canvas when no base yet keeps ref stable */}
            {!baseImg && <canvas ref={canvasRef} className="hidden" />}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
