# AIOTools — Free Online Tools, 100% Client-Side

![Next.js 14](https://img.shields.io/badge/Next.js-14-black)
![Tools](https://img.shields.io/badge/tools-86-blue)
![Client-Side](https://img.shields.io/badge/processing-100%25_client--side-emerald)
![PWA](https://img.shields.io/badge/PWA-ready-purple)
![i18n](https://img.shields.io/badge/lang-EN_%2F_ID-orange)
![Privacy](https://img.shields.io/badge/tracking-none-success)
![License](https://img.shields.io/badge/license-private-lightgrey)

Free online tools that run **100% in your browser**: compress images, merge PDFs, format JSON, generate QR codes, and more. No uploads, no accounts, no fees.

- 🌐 **EN/ID bilingual** — full English + Bahasa Indonesia UI via locale store
- 🔒 **Privacy-first** — files never leave your device; **no analytics, no tracking** (see [Privacy Policy](/privacy))
- 📲 **PWA** — installable, offline-capable for core tools
- ⌘K command palette, dark mode, mobile drawer, motion-safe animations

## Features — all 86 tools

### 🖼️ Image Tools (14)

| Tool | Route |
| ---- | ----- |
| Image Compressor | `/tools/image/compress` |
| Image Converter (JPG/PNG/WebP) | `/tools/image/convert` |
| Background Remover (on-device AI) | `/tools/image/bg-remover` |
| Image Watermark | `/tools/image/watermark` |
| Image Cropper | `/tools/image/crop` |
| Screen Recorder | `/tools/image/record` |
| HEIC Converter | `/tools/image/heic-convert` |
| Image Resizer | `/tools/image/resize` |
| Rotate & Flip | `/tools/image/rotate-flip` |
| Circle Crop | `/tools/image/crop-circle` |
| Photo Collage (2–9 photos) | `/tools/image/collage` |
| Signature Resizer | `/tools/image/signature` |
| Images to GIF | `/tools/image/images-to-gif` |
| GIF to Frames | `/tools/image/gif-to-images` |

### 📄 PDF Tools (19)

| Tool | Route |
| ---- | ----- |
| PDF Merger | `/tools/pdf/merge` |
| PDF to Image | `/tools/pdf/to-image` |
| Split PDF | `/tools/pdf/split` |
| Rotate PDF | `/tools/pdf/rotate` |
| Images to PDF | `/tools/pdf/images-to-pdf` |
| Organize PDF | `/tools/pdf/organize` |
| Add Page Numbers | `/tools/pdf/page-number` |
| Unlock PDF | `/tools/pdf/unlock` |
| Text to PDF | `/tools/pdf/text-to-pdf` |
| Scan to PDF | `/tools/pdf/scan` |
| PDF Metadata | `/tools/pdf/metadata` |
| Sign PDF | `/tools/pdf/sign` |
| Redact PDF | `/tools/pdf/redact` |
| PDF Watermark | `/tools/pdf/watermark` |
| Compare PDFs | `/tools/pdf/compare` |
| PDF to Markdown | `/tools/pdf/to-markdown` |
| OCR PDF | `/tools/pdf/ocr` |
| Repair PDF | `/tools/pdf/repair` |
| PDF Info | `/tools/pdf/info` |

> **Out of scope (declared):** Protect/Encrypt PDF — `pdf-lib` has no encryption API and no new dependency is introduced. Compress PDF is not feasible purely client-side.

### 📝 Text & Utility (5)

| Tool | Route |
| ---- | ----- |
| Case Converter | `/tools/text/case-converter` |
| QR Code Generator | `/tools/text/qr-generator` |
| Password Generator | `/tools/text/password-generator` |
| Word Counter | `/tools/text/word-counter` |
| Barcode Generator | `/tools/text/barcode` |

### 💻 Developer Tools (26)

| Tool | Route |
| ---- | ----- |
| JSON Formatter | `/tools/developer/json-formatter` |
| Hash Generator (MD5/SHA) | `/tools/developer/hash-generator` |
| Regex Tester | `/tools/developer/regex-tester` |
| JWT Decoder | `/tools/developer/jwt-decoder` |
| Base64 Tools | `/tools/developer/base64` |
| Unix Timestamp Converter | `/tools/developer/timestamp` |
| UUID Generator | `/tools/developer/uuid` |
| Lorem Ipsum Generator | `/tools/developer/lorem` |
| Markdown to HTML | `/tools/developer/markdown-to-html` |
| HTML to Markdown | `/tools/developer/html-to-markdown` |
| CSS Minifier/Beautifier | `/tools/developer/css-formatter` |
| JS Minifier/Beautifier | `/tools/developer/js-formatter` |
| SQL Formatter | `/tools/developer/sql-formatter` |
| XML Formatter | `/tools/developer/xml-formatter` |
| YAML Formatter | `/tools/developer/yaml-formatter` |
| CSV to JSON | `/tools/developer/csv-to-json` |
| JSON to CSV | `/tools/developer/json-to-csv` |
| URL Encoder/Decoder | `/tools/developer/url-encoder` |
| HTML Encoder/Decoder | `/tools/developer/html-encoder` |
| Text to Slug | `/tools/developer/slugify` |
| Remove Duplicate Lines | `/tools/developer/dedupe-lines` |
| Sort Lines | `/tools/developer/sort-lines` |
| Find and Replace | `/tools/developer/find-replace` |
| Text Diff Checker | `/tools/developer/text-diff` |
| AI PDF Summarizer (BYOK) | `/tools/developer/ai-summarizer` |
| AI PDF Translator (BYOK) | `/tools/developer/ai-translator` |

### 🧮 Calculators (9)

| Tool | Route |
| ---- | ----- |
| Unit Converter | `/tools/calculators/unit-converter` |
| Date Calculator | `/tools/calculators/date-calculator` |
| Age Calculator | `/tools/calculators/age-calculator` |
| BMI Calculator | `/tools/calculators/bmi-calculator` |
| Loan/EMI Calculator | `/tools/calculators/loan-calculator` |
| Percentage Calculator | `/tools/calculators/percentage` |
| Tip Calculator | `/tools/calculators/tip` |
| Discount Calculator | `/tools/calculators/discount` |
| Time Zone Converter | `/tools/calculators/timezone` |

### 🎨 Design Tools (11)

| Tool | Route |
| ---- | ----- |
| Favicon Generator | `/tools/design/favicon` |
| Social Media Resizer | `/tools/design/social-resizer` |
| Meme Generator | `/tools/design/meme` |
| Image to ASCII Art | `/tools/design/ascii-art` |
| Color Palette Generator | `/tools/design/palette` |
| Gradient Generator | `/tools/design/gradient` |
| Box Shadow Generator | `/tools/design/box-shadow` |
| CSS Grid Generator | `/tools/design/grid` |
| Flexbox Generator | `/tools/design/flexbox` |
| SVG to PNG | `/tools/design/svg-to-png` |
| Code Screenshot | `/tools/design/code-screenshot` |

### 🗜️ Files & Archives (2)

| Tool | Route |
| ---- | ----- |
| ZIP Maker | `/tools/files/zip-maker` |
| ZIP Extractor | `/tools/files/zip-extractor` |

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (~92 routes)
npm start
```

Requirements: Node 18+, npm. No server, database, or API keys needed.

## Privacy statement

- **No uploads** — every tool processes files locally with browser APIs / Web Workers / WASM.
- **Preferences only in `localStorage`** — locale (`aiotools-locale`), theme, UI state. Clearable anytime via browser settings.
- **No analytics, no tracking** — no Plausible/Fathom/GA, no beacons, no fingerprinting. Fase 22's planned analytics item was explicitly rejected for privacy.
- **Third-party contacts (only these):**
  - `pdf.js` worker CDN fallback (used only if the bundled local worker fails).
  - AI APIs **only** in the opt-in BYOK tools (summarizer/translator): your key is AES-GCM encrypted in your browser, never sent anywhere except the provider you call. Clear anytime in Settings.
- Full text: [`/privacy`](./src/app/privacy/page.tsx) (EN/ID). App settings: [`/settings`](./src/app/settings/page.tsx).

## Deploy notes

- **`metadataBase` is a placeholder** — `src/app/layout.tsx`, `src/app/sitemap.ts`, and `src/app/robots.ts` all use `https://aitools.app`. Replace with the real production domain before launch.
- **pdf.js worker re-copy** — after every `pdfjs-dist` upgrade, re-copy the worker to `public/pdf.worker.min.mjs` (Fase 6 bundling fix relies on the `/public` copy + CDN fallback).
- **Operational rule** — never run `next dev` and `next build` at the same time in this directory (shared `.next` gets corrupted); kill the dev server via PID first. Don't use `pkill -f` on WSL mounts (hangs).
- PWA assets live in `public/icons/` + `public/*.png`; service worker is generated by `@ducanh2912/next-pwa` (`dest: "public"`, disabled in development).

## Screenshots (TODO)

> TODO: capture and add screenshots before launch.

- `docs/screenshots/landing-hero.png` — landing page hero
- `docs/screenshots/sidebar-cmdk.png` — sidebar + Cmd+K palette
- `docs/screenshots/tool-pdf-merge.png` — PDF merger drag-reorder
- `docs/screenshots/tool-image-compress.png` — image compressor with before/after
- `docs/screenshots/tool-ocr.png` — OCR searchable-PDF output
- `docs/screenshots/mobile-dark.png` — mobile view, dark mode

## Structure overview

```text
src/
  app/
    page.tsx                 # landing page
    layout.tsx               # metadata (metadataBase placeholder), fonts, AppShell
    template.tsx             # page transitions (AnimatePresence, reduced-motion safe)
    manifest.ts / robots.ts / sitemap.ts   # PWA + SEO (sitemap generated from tools-config)
    privacy/                 # privacy policy page (EN/ID, not a sidebar tool)
    tools/[category]/[tool]/ # 86 tool pages, each wrapped in ToolLayout
  components/
    tools/ToolLayout.tsx     # title/desc/FAQ + SoftwareApplication & FAQPage JSON-LD
    layout/                  # AppShell, Sidebar, Header, Footer, SearchCommand
    ui/                      # shadcn components + motion primitives
  lib/
    tools-config.ts          # single source of truth: 7 categories, 86 tools
    i18n/                    # dictionaries (en/id) + zustand persist locale store
    batch-queue.ts / clipboard / workers…
public/
  pdf.worker.min.mjs         # local pdf.js worker (re-copy on pdfjs-dist upgrade)
  icons/ apple-touch-icon.png sw.js  # PWA assets
```

## History & changelog

See [CHANGELOG.md](./CHANGELOG.md) (reconstructed from `PROGRESS.md` — git history is not authoritative).
