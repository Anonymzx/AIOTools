"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
  digest: string | null;
  lang: "en" | "id";
}

const STR = {
  en: {
    title: "Something went wrong",
    body: "This section crashed, but the rest of the app is safe. Try again, or go back home.",
    reset: "Try again",
    home: "Back to home",
    details: "Error details",
  },
  id: {
    title: "Terjadi kesalahan",
    body: "Bagian ini crash, tetapi aplikasi lainnya aman. Coba lagi, atau kembali ke beranda.",
    reset: "Coba lagi",
    home: "Kembali ke beranda",
    details: "Detail error",
  },
} as const;

function makeDigest(message: string): string {
  try {
    let h = 0;
    for (let i = 0; i < message.length; i += 1) {
      h = (h * 31 + message.charCodeAt(i)) | 0;
    }
    return `E${Math.abs(h).toString(16).toUpperCase().padStart(8, "0")}`;
  } catch {
    return "E00000000";
  }
}

function detectLang(): "en" | "id" {
  try {
    const raw = window.localStorage.getItem("aiotools-locale");
    if (!raw) return "en";
    const parsed = JSON.parse(raw) as { state?: { locale?: string } };
    return parsed?.state?.locale === "id" ? "id" : "en";
  } catch {
    return "en";
  }
}

/**
 * Global error boundary — wraps <AppShell> in the root layout so a single
 * crashing tool (e.g. ffmpeg OOM) can never take down the whole app.
 * Sits above the locale store, so copy is hardcoded EN+ID (default EN).
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: null, digest: null, lang: "en" };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    try {
      const message = error instanceof Error ? error.message : String(error);
      return { hasError: true, message, digest: makeDigest(message) };
    } catch {
      return { hasError: true, message: null, digest: null };
    }
  }

  componentDidCatch(error: Error): void {
    try {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error);
    } catch {
      // ignore logging errors
    }
    try {
      this.setState({ lang: detectLang() });
    } catch {
      // keep default EN
    }
  }

  private handleReset = (): void => {
    try {
      this.setState({ lang: detectLang() });
    } catch {
      // keep current lang
    }
    this.setState({ hasError: false, message: null, digest: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    const s = STR[this.state.lang];
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{s.body}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {s.reset}
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {s.home}
          </a>
        </div>
        {this.state.digest || this.state.message ? (
          <details className="w-full rounded-lg border border-zinc-200 p-3 text-left dark:border-zinc-800">
            <summary className="cursor-pointer text-xs font-medium text-zinc-500">
              {s.details}
              {this.state.digest ? ` · ${this.state.digest}` : ""}
            </summary>
            {this.state.message ? (
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-zinc-500">
                {this.state.message}
              </pre>
            ) : null}
          </details>
        ) : null}
      </div>
    );
  }
}

export default ErrorBoundary;
