"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";
import { evaluateExpression, formatResult, type AngleMode } from "@/lib/math-eval";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    deg: string;
    rad: string;
    clear: string;
    backspace: string;
    equals: string;
    history: string;
    emptyHistory: string;
    result: string;
    error: string;
  }
> = {
  en: {
    title: "Scientific Calculator",
    description:
      "Full scientific calculator — trig, logs, powers, roots, constants π and e — powered by a custom parser. Keyboard supported. 100% in your browser.",
    deg: "DEG",
    rad: "RAD",
    clear: "Clear",
    backspace: "Delete",
    equals: "=",
    history: "History",
    emptyHistory: "No calculations yet.",
    result: "Result",
    error: "Something went wrong.",
  },
  id: {
    title: "Kalkulator Ilmiah",
    description:
      "Kalkulator ilmiah lengkap — trigonometri, log, pangkat, akar, konstanta π dan e — didukung parser kustom. Mendukung keyboard. 100% di browser.",
    deg: "DER",
    rad: "RAD",
    clear: "Hapus",
    backspace: "Hapus 1",
    equals: "=",
    history: "Riwayat",
    emptyHistory: "Belum ada perhitungan.",
    result: "Hasil",
    error: "Terjadi kesalahan.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: {
      q: "How are trigonometric functions evaluated?",
      a: "Use the DEG/RAD toggle above the keypad. In DEG mode, sin(30) = 0.5; in RAD mode, angles are raw radians. Inverse functions convert back to the active mode.",
    },
    id: {
      q: "Bagaimana fungsi trigonometri dihitung?",
      a: "Gunakan sakelar DEG/RAD di atas keypad. Dalam mode DEG, sin(30) = 0,5; dalam mode RAD, sudut adalah radian murni. Fungsi invers dikonversi kembali ke mode aktif.",
    },
  },
  {
    en: {
      q: "Can I use my keyboard?",
      a: "Yes — digits, + − * / ^ % ( ), and . type directly; Enter evaluates and Escape clears. Focus anywhere on the page works.",
    },
    id: {
      q: "Bisakah memakai keyboard?",
      a: "Ya — angka, + − * / ^ % ( ), dan . mengetik langsung; Enter menghitung dan Escape menghapus. Fokus di mana pun di halaman tetap berfungsi.",
    },
  },
  {
    en: {
      q: "Is my calculation history uploaded?",
      a: "No. The expression, results, and history live only in this page's memory in your browser.",
    },
    id: {
      q: "Apakah riwayat hitungan diunggah?",
      a: "Tidak. Ekspresi, hasil, dan riwayat hanya ada di memori halaman ini di browser Anda.",
    },
  },
];

interface HistoryItem {
  expr: string;
  value: string;
}

const FN_BUTTONS = ["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log", "abs", "exp"] as const;

export default function ScientificPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [expr, setExpr] = useState("");
  const [output, setOutput] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [angle, setAngle] = useState<AngleMode>("rad");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const evaluate = useCallback(
    (raw: string): void => {
      try {
        const trimmed = raw.trim();
        if (trimmed === "") return;
        const value = evaluateExpression(trimmed, { angle });
        const pretty = formatResult(value);
        setOutput(pretty);
        setInlineError("");
        setHistory((prev) => [{ expr: trimmed, value: pretty }, ...prev].slice(0, 30));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setInlineError(msg);
        setOutput("");
      }
    },
    [angle],
  );

  const insert = useCallback((token: string): void => {
    try {
      setInlineError("");
      setExpr((prev) => (prev.length >= 200 ? prev : prev + token));
    } catch {
      toast.error(s.error);
    }
  }, [s.error]);

  const handleClear = useCallback((): void => {
    try {
      setExpr("");
      setOutput("");
      setInlineError("");
    } catch {
      toast.error(s.error);
    }
  }, [s.error]);

  const handleBackspace = useCallback((): void => {
    try {
      setInlineError("");
      setExpr((prev) => prev.slice(0, -1));
    } catch {
      toast.error(s.error);
    }
  }, [s.error]);

  // Keyboard: digits/ops/Enter/Escape — listener in effect with cleanup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      try {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase() ?? "";
        if (tag === "input" || tag === "textarea") return;
        if (/^[0-9+\-*/^%().]$/.test(e.key)) {
          e.preventDefault();
          insert(e.key);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setExpr((cur) => {
            evaluate(cur);
            return cur;
          });
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleClear();
        } else if (e.key === "Backspace") {
          e.preventDefault();
          handleBackspace();
        }
      } catch {
        // keyboard must never break the page
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [insert, evaluate, handleClear, handleBackspace]);

  const btnCls =
    "h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600";
  const numBtn = `${btnCls} bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700`;
  const opBtn = `${btnCls} bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900`;
  const fnBtn = `${btnCls} bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800`;
  const eqBtn = `${btnCls} bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600`;

  return (
    <ToolLayout
      title={s.title}
      description={s.description}
      iconName="Calculator"
      slug="calculators/scientific"
      faq={FAQ}
    >
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex gap-1.5">
              <Button size="sm" variant={angle === "deg" ? "default" : "outline"} onClick={() => setAngle("deg")}>
                {s.deg}
              </Button>
              <Button size="sm" variant={angle === "rad" ? "default" : "outline"} onClick={() => setAngle("rad")}>
                {s.rad}
              </Button>
            </div>
            <div
              aria-live="polite"
              className="min-h-24 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950"
            >
              <p className="break-all font-mono text-lg text-zinc-600 sm:text-xl dark:text-zinc-400">
                {expr === "" ? "0" : expr}
              </p>
              {inlineError !== "" ? (
                <p className="mt-1 break-words text-sm font-semibold text-red-600 dark:text-red-400">
                  {inlineError}
                </p>
              ) : (
                output !== "" && (
                  <p className="mt-1 break-all font-mono text-2xl font-extrabold tabular-nums text-zinc-900 sm:text-3xl dark:text-zinc-50">
                    {s.result}: {output}
                  </p>
                )
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button type="button" onClick={handleClear} className={opBtn} aria-label={s.clear}>C</button>
              <button type="button" onClick={handleBackspace} className={opBtn} aria-label={s.backspace}>⌫</button>
              <button type="button" onClick={() => insert("(")} className={opBtn}>(</button>
              <button type="button" onClick={() => insert(")")} className={opBtn}>)</button>
              {["7", "8", "9", "/"].map((k) => (
                <button key={k} type="button" onClick={() => insert(k)} className={k === "/" ? opBtn : numBtn}>{k === "/" ? "÷" : k}</button>
              ))}
              {["4", "5", "6", "*"].map((k) => (
                <button key={k} type="button" onClick={() => insert(k)} className={k === "*" ? opBtn : numBtn}>{k === "*" ? "×" : k}</button>
              ))}
              {["1", "2", "3", "-"].map((k) => (
                <button key={k} type="button" onClick={() => insert(k)} className={k === "-" ? opBtn : numBtn}>{k === "-" ? "−" : k}</button>
              ))}
              {["0", ".", "%", "+"].map((k) => (
                <button key={k} type="button" onClick={() => insert(k)} className={k === "+" ? opBtn : numBtn}>{k}</button>
              ))}
              <button type="button" onClick={() => insert("^")} className={opBtn}>xʸ</button>
              <button type="button" onClick={() => insert("pi")} className={fnBtn}>π</button>
              <button type="button" onClick={() => insert("e")} className={fnBtn}>e</button>
              <button type="button" onClick={() => expr !== "" && evaluate(expr)} className={eqBtn} aria-label={s.equals}>=</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
              {FN_BUTTONS.map((f) => (
                <button key={f} type="button" onClick={() => insert(`${f}(`)} className={fnBtn}>
                  {f}
                </button>
              ))}
              <button type="button" onClick={() => insert("sqrt(")} className={fnBtn}>√</button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {s.history} ({history.length})
            </h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">{s.emptyHistory}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {history.map((h, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          setExpr(h.expr);
                          setOutput(h.value);
                          setInlineError("");
                        } catch {
                          toast.error(s.error);
                        }
                      }}
                      title={h.expr}
                      className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                    >
                      <span className="block truncate text-zinc-500 dark:text-zinc-400">{h.expr}</span>
                      <span className="block truncate font-bold tabular-nums text-zinc-900 dark:text-zinc-100">= {h.value}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
