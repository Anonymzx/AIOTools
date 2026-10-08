import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // NOTE: placeholder domain until the production domain is decided.
  metadataBase: new URL("https://aitools.app"),
  title: {
    default: "AIOTools — Free Online Tools: Compress, Convert, Format & More",
    template: "%s | AIOTools",
  },
  description:
    "AIOTools is a collection of free online tools that run 100% in your browser: compress images, merge PDFs, format JSON, generate hashes, and more. No uploads, privacy-first.",
  keywords: [
    "free online tools",
    "image compressor",
    "image converter",
    "merge pdf",
    "pdf to image",
    "case converter",
    "qr code generator",
    "json formatter",
    "hash generator",
    "browser tools",
    "privacy-first tools",
  ],
  openGraph: {
    type: "website",
    siteName: "AIOTools",
    title: "AIOTools — Free Online Tools: Compress, Convert, Format & More",
    description:
      "Free online tools that run 100% in your browser: compress images, merge PDFs, format JSON, and more. No uploads, privacy-first.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIOTools — Free Online Tools: Compress, Convert, Format & More",
    description:
      "Free online tools that run 100% in your browser: compress images, merge PDFs, format JSON, and more. No uploads, privacy-first.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <ErrorBoundary>
            <AppShell>{children}</AppShell>
          </ErrorBoundary>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
