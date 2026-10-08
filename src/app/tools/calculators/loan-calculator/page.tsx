"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { ToolLayout, type FaqItem } from "@/components/tools/ToolLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/dictionaries";

const STR: Record<
  Locale,
  {
    title: string;
    description: string;
    principal: string;
    rate: string;
    tenure: string;
    years: string;
    months: string;
    down: string;
    emi: string;
    totalInterest: string;
    totalPayment: string;
    principalPaid: string;
    interestPaid: string;
    schedule: string;
    month: string;
    emiCol: string;
    interestCol: string;
    principalCol: string;
    balanceCol: string;
    year: string;
    download: string;
    downloaded: string;
    downloadFailed: string;
    invalid: string;
    perYear: string;
    scrollHint: string;
  }
> = {
  en: {
    title: "Loan Calculator",
    description: "Monthly EMI, total interest, amortization schedule, and principal-vs-interest breakdown — computed locally with the standard EMI formula.",
    principal: "Loan amount",
    rate: "Annual interest rate (%)",
    tenure: "Tenure",
    years: "Years",
    months: "Months",
    down: "Down payment",
    emi: "Monthly EMI",
    totalInterest: "Total interest",
    totalPayment: "Total payment",
    principalPaid: "Principal",
    interestPaid: "Interest",
    schedule: "Amortization schedule",
    month: "Month",
    emiCol: "EMI",
    interestCol: "Interest",
    principalCol: "Principal",
    balanceCol: "Balance",
    year: "Year",
    download: "Download CSV",
    downloaded: "Schedule downloaded.",
    downloadFailed: "Failed to build CSV.",
    invalid: "Enter valid positive numbers.",
    perYear: "Yearly aggregates",
    scrollHint: "Scroll horizontally to see all columns.",
  },
  id: {
    title: "Kalkulator Pinjaman",
    description: "Cicilan bulanan (EMI), total bunga, jadwal amortisasi, dan rincian pokok-vs-bunga — dihitung lokal dengan rumus EMI standar.",
    principal: "Jumlah pinjaman",
    rate: "Suku bunga tahunan (%)",
    tenure: "Tenor",
    years: "Tahun",
    months: "Bulan",
    down: "Uang muka",
    emi: "Cicilan bulanan (EMI)",
    totalInterest: "Total bunga",
    totalPayment: "Total pembayaran",
    principalPaid: "Pokok",
    interestPaid: "Bunga",
    schedule: "Jadwal amortisasi",
    month: "Bulan",
    emiCol: "Cicilan",
    interestCol: "Bunga",
    principalCol: "Pokok",
    balanceCol: "Sisa",
    year: "Tahun",
    download: "Unduh CSV",
    downloaded: "Jadwal diunduh.",
    downloadFailed: "Gagal membuat CSV.",
    invalid: "Masukkan angka positif yang valid.",
    perYear: "Agregat tahunan",
    scrollHint: "Geser horizontal untuk melihat semua kolom.",
  },
};

const FAQ: FaqItem[] = [
  {
    en: { q: "What is the EMI formula?", a: "EMI = P × R × (1+R)^N / ((1+R)^N − 1), where P is the financed amount (principal minus down payment), R is the monthly rate (annual % ÷ 12 ÷ 100), and N is the number of monthly payments. With 0% interest the EMI is simply P ÷ N." },
    id: { q: "Apa rumus EMI?", a: "EMI = P × R × (1+R)^N / ((1+R)^N − 1), dengan P jumlah yang dibiayai (pokok minus uang muka), R suku bunga bulanan (% tahunan ÷ 12 ÷ 100), dan N jumlah cicilan bulanan. Dengan bunga 0% maka EMI cukup P ÷ N." },
  },
  {
    en: { q: "Why does the table show 12 months plus yearly rows?", a: "The first 12 rows show exact month-by-month interest/principal splits; later years are aggregated to keep the page fast on mobile. The CSV download contains every single month." },
    id: { q: "Mengapa tabel menampilkan 12 bulan plus baris tahunan?", a: "Dua belas baris pertama menunjukkan rincian bunga/pokok per bulan secara eksak; tahun berikutnya diagregasi agar halaman tetap cepat di ponsel. Unduhan CSV berisi setiap bulan." },
  },
  {
    en: { q: "Is my loan data sent anywhere?", a: "No. All amounts are crunched in your browser with plain arithmetic — nothing is uploaded or stored." },
    id: { q: "Apakah data pinjaman saya dikirim ke mana pun?", a: "Tidak. Semua angka dihitung di browser Anda dengan aritmetika biasa — tidak ada yang diunggah atau disimpan." },
  },
];

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface Row {
  m: number;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
}

function fmt(n: number): string {
  try {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  } catch {
    return String(Math.round(n * 100) / 100);
  }
}

export default function LoanCalculatorPage(): React.JSX.Element {
  const { locale } = useLocale();
  const s = STR[locale];
  const [principal, setPrincipal] = useState("200000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");
  const [tenureUnit, setTenureUnit] = useState<"y" | "m">("y");
  const [down, setDown] = useState("0");

  const calc = useMemo(() => {
    try {
      const P0 = Number(principal);
      const annual = Number(rate);
      const tRaw = Number(tenure);
      const D = Number(down);
      if (![P0, annual, tRaw, D].every(Number.isFinite) || P0 <= 0 || annual < 0 || tRaw <= 0 || D < 0 || D >= P0) return null;
      const financed = P0 - D;
      const N = Math.floor(tenureUnit === "y" ? tRaw * 12 : tRaw);
      if (N <= 0 || N > 1200) return null;
      const R = annual / 1200;
      const emi = R === 0 ? financed / N : (financed * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      if (!Number.isFinite(emi)) return null;
      const rows: Row[] = [];
      let bal = financed;
      for (let m = 1; m <= N; m += 1) {
        const interest = bal * R;
        const pr = Math.min(emi - interest, bal);
        bal = Math.max(0, bal - pr);
        rows.push({ m, emi, interest, principal: pr, balance: bal });
      }
      const totalPayment = emi * N + D;
      const totalInterest = emi * N - financed;
      const yearly: Array<{ y: number; emi: number; interest: number; principal: number }> = [];
      for (let y = 0; y < Math.ceil(N / 12); y += 1) {
        const slice = rows.slice(y * 12, y * 12 + 12);
        if (slice.length === 0) break;
        yearly.push({
          y: y + 1,
          emi: slice.reduce((a, r) => a + r.emi, 0),
          interest: slice.reduce((a, r) => a + r.interest, 0),
          principal: slice.reduce((a, r) => a + r.principal, 0),
        });
      }
      return { financed, N, emi, totalPayment, totalInterest, rows, yearly };
    } catch {
      return null;
    }
  }, [principal, rate, tenure, tenureUnit, down]);

  function handleCsv(): void {
    try {
      if (!calc) {
        toast.info(s.invalid);
        return;
      }
      const lines = [`${s.month},${s.emiCol},${s.interestCol},${s.principalCol},${s.balanceCol}`];
      for (const r of calc.rows) {
        lines.push(`${r.m},${r.emi.toFixed(2)},${r.interest.toFixed(2)},${r.principal.toFixed(2)},${r.balance.toFixed(2)}`);
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "amortization.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(s.downloaded);
    } catch {
      toast.error(s.downloadFailed);
    }
  }

  const donut = useMemo(() => {
    if (!calc) return null;
    const total = calc.financed + calc.totalInterest;
    if (total <= 0) return null;
    const pFrac = calc.financed / total;
    const C = 2 * Math.PI * 54;
    return { pFrac, C };
  }, [calc]);

  return (
    <ToolLayout title={s.title} description={s.description} iconName="Landmark" slug="calculators/loan-calculator" faq={FAQ}>
      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <label htmlFor="loan-p" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.principal}</label>
              <input id="loan-p" type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="loan-r" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.rate}</label>
              <input id="loan-r" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="loan-t" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.tenure}</label>
                <div className="flex gap-1" role="group" aria-label={s.tenure}>
                  <Button type="button" size="sm" variant={tenureUnit === "y" ? "default" : "outline"} onClick={() => setTenureUnit("y")}>{s.years}</Button>
                  <Button type="button" size="sm" variant={tenureUnit === "m" ? "default" : "outline"} onClick={() => setTenureUnit("m")}>{s.months}</Button>
                </div>
              </div>
              <input id="loan-t" type="number" min="0" value={tenure} onChange={(e) => setTenure(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="loan-d" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.down}</label>
              <input id="loan-d" type="number" min="0" value={down} onChange={(e) => setDown(e.target.value)} className={inputCls} />
            </div>
          </CardContent>
        </Card>
        {!calc || !donut ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">{s.invalid}</p>
        ) : (
          <div className="space-y-4" aria-live="polite">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="space-y-3 p-4 sm:p-6">
                  <div className="rounded-xl bg-indigo-50 p-4 text-center dark:bg-indigo-950">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{s.emi}</p>
                    <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(calc.emi)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">{s.totalInterest}</p>
                      <p className="font-mono font-bold tabular-nums text-red-500">{fmt(calc.totalInterest)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">{s.totalPayment}</p>
                      <p className="font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(calc.totalPayment)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="flex items-center justify-center gap-4 p-4 sm:p-6">
                  <svg viewBox="0 0 140 140" className="h-36 w-36" role="img" aria-label={`${s.principalPaid} vs ${s.interestPaid}`}>
                    <circle cx="70" cy="70" r="54" fill="none" strokeWidth="22" className="stroke-zinc-200 dark:stroke-zinc-800" />
                    <circle
                      cx="70" cy="70" r="54" fill="none" strokeWidth="22" strokeLinecap="round"
                      strokeDasharray={`${donut.C * donut.pFrac} ${donut.C}`}
                      transform="rotate(-90 70 70)"
                      className="stroke-emerald-500"
                    />
                  </svg>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                      <span className="h-3 w-3 rounded-sm bg-emerald-500" aria-hidden />{s.principalPaid}: <span className="font-mono font-bold tabular-nums">{fmt(calc.financed)}</span>
                    </li>
                    <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                      <span className="h-3 w-3 rounded-sm bg-zinc-300 dark:bg-zinc-700" aria-hidden />{s.interestPaid}: <span className="font-mono font-bold tabular-nums">{fmt(calc.totalInterest)}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="space-y-3 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.schedule} ({calc.N} ×)</h2>
                  <Button type="button" variant="outline" size="sm" onClick={handleCsv}>
                    <Download className="h-4 w-4" aria-hidden />
                    {s.download}
                  </Button>
                </div>
                <p className="text-xs text-zinc-400 sm:hidden">{s.scrollHint}</p>
                <div className="max-h-80 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full min-w-[560px] text-left font-mono text-xs tabular-nums">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{s.month}</th>
                        <th className="px-3 py-2 font-semibold">{s.emiCol}</th>
                        <th className="px-3 py-2 font-semibold">{s.interestCol}</th>
                        <th className="px-3 py-2 font-semibold">{s.principalCol}</th>
                        <th className="px-3 py-2 font-semibold">{s.balanceCol}</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-300">
                      {calc.rows.slice(0, 12).map((r) => (
                        <tr key={r.m} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="px-3 py-1.5">{r.m}</td>
                          <td className="px-3 py-1.5">{fmt(r.emi)}</td>
                          <td className="px-3 py-1.5">{fmt(r.interest)}</td>
                          <td className="px-3 py-1.5">{fmt(r.principal)}</td>
                          <td className="px-3 py-1.5">{fmt(r.balance)}</td>
                        </tr>
                      ))}
                      {calc.yearly.map((y) => (
                        <tr key={`y${y.y}`} className="border-t border-indigo-100 bg-indigo-50/60 dark:border-indigo-950 dark:bg-indigo-950/40">
                          <td className="px-3 py-1.5 font-bold">{s.year} {y.y}</td>
                          <td className="px-3 py-1.5">{fmt(y.emi)}</td>
                          <td className="px-3 py-1.5">{fmt(y.interest)}</td>
                          <td className="px-3 py-1.5">{fmt(y.principal)}</td>
                          <td className="px-3 py-1.5">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
