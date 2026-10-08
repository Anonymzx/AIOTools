# CHANGELOG — AIOTools

> **Honesty note:** this repository has only two git commits (`first commit`, `add some Features`),
> so version history below is **reconstructed from `PROGRESS.md` and the planning docs** (`planning.md`,
> `planning2.md`, `planning3.md`, `planning4.md`, `planning6.md`), not from git tags.
> Package versions cited are the ones recorded in `PROGRESS.md` at each milestone.
> Current version: **0.9.1** (`package.json`).

## [0.1.0] — Fase 1–6: Foundation + Core + SEO

- **Fase 1 Foundation & Design System:** Next.js 14.2.35 + TS strict + Tailwind v3 + `src/` dir; AIOTools theme (indigo-600/emerald-500, zinc, Inter + JetBrains Mono, radius 0.75rem); 11 shadcn UI components; `tools-config` (4 categories, 8 tools); collapsible Sidebar + Cmd+K + mobile drawer; Header (breadcrumbs, theme toggle, share, Pro); landing page. `tsc` + `next build` green.
- **Fase 2 Core UI + i18n EN/ID:** dictionaries en/id + zustand persist store; bilingual `tools-config`; `ToolLayout` + `FileDropzone`; Header language toggle; AppShell drawer + `document.lang` sync.
- **Fase 3 Text & Dev:** case-converter + json-formatter (Prism, error panel, stats).
- **Fase 4 Image:** BeforeAfterSlider + image worker + compress (worker + fallback) + convert (multi-file + ZIP).
- **Fase 5 PDF:** merge (drag-reorder) + to-image (pdf.js local worker + CDN fallback).
- **Fase 6 SEO:** ToolLayout SEO (title/canonical/JSON-LD), EN metadata, sitemap + robots; pdf.worker bundling fix (`/public` copy). QR + Hash tools (logo composite, PNG/SVG; MD5/SHA live).

## [0.2.0] — Fase 7–9: Dev tools + Split/BG + Platform

- **Fase 7 Dev:** regex-tester + jwt-decoder (+4 tools-config entries; manual decode, `jose` kept in deps).
- **Fase 8a Split PDF:** thumbnail grid + select + extract.
- **Fase 8b BG Remover:** WASM worker + fallback panel; onnxruntime minify fix (`SkipRawOrtMinifyPlugin`).
- **Fase 9 Platform:** Cmd+K actions + `useToolClipboard` (5 pages) + PWA (manifest, pngjs-generated icons, service worker) + batch-queue store. Lighthouse honestly skipped (no Chrome available).

## [0.3.0] — Fase 10–12: Quick wins + Media + Conversions

- **Fase 10 Quick Wins:** password-generator + word-counter + pdf/rotate (+9 tools-config entries, 21 total).
- **Fase 11 Media:** watermark + crop + record.
- **Fase 12 Conversions:** images-to-pdf + base64 + heic-convert (worker).

## [0.4.0] — Fase 13–14: PDF Pro + Canvas

- **Fase 13 PDF Pro:** organize + page-number + unlock + text-to-pdf (+14 entries + file category, 35 total).
- **Protect PDF declared OUT OF SCOPE** — `pdf-lib` has no encryption API and no new dependency is introduced.
- **Fase 14 Canvas:** resize + rotate-flip + crop-circle + collage + signature.

## [0.5.0] — Fase 15: GIF / ZIP / Barcode (+ 0.5.1 UI-4)

- images-to-gif (`gifenc`) + gif-to-images (`gifuct-js`) + zip-maker/extractor + barcode (`jsbarcode`); `gifenc` needed a `src/types/gifenc.d.ts` shim.
- **0.5.1 UI-4 Hero effects:** particle-background (canvas, ssr:false) + use-magnetic + tilt-card + landing stagger/gradient (inline TextReveal fallback — small duplication vs `ui/text-reveal`, unification candidate).

## [0.6.0] — Fase 16–18: PDF create / edit / analysis

- **Fase 16 PDF create:** scan (camera + filters + reorder) + metadata (6 fields) + watermark (position/format) + info (11 cards); +10 tools-config entries (45 total).
- **Fase 17 PDF edit:** sign (draw/type/upload + drag position) + redact (rect select + confirmation) + repair (per-page salvage).
- **Fase 18 PDF analysis:** compare (diff lines/words + navigation) + to-markdown (Y-group heading heuristic; `turndown` skipped — positional text source) + OCR (tesseract worker eng/ind + searchable PDF).
- Final verify: TS2802 fix in to-markdown → `next build` exit 0 (50 routes, 45 tools). Root cause of a corrupt `.next` found: dev server on :3001 sharing `.next` with build — killed via PID, fresh rebuild; smoke 200 on 12 endpoints.

## UI motion passes (0.5.1 → 0.8.0)

- **UI-1 Motion foundation:** `template.tsx` (AnimatePresence + `MotionConfig reducedMotion="user"`) + Sidebar spring (layoutId active, hover, icon rotate) + AnimatedButton (ripple, loading, success).
- **UI-2 Upload feedback:** FileDropzone motion (scale/glow/wiggle/stagger) + processing-state (bar/dots/shimmer) + ToolLayout reveal.
- **UI-3 Scroll & overlays:** ScrollProgress + AppShell wiring + dialog/sheet spring + sonner icons + text-reveal.
- **Hydration ROOT CAUSE PROVEN (harness `/tmp/hydra/harness.js` — SSR vs client string):** ~80 render branches on `useReducedMotion()` in 21 files (span vs motion.span, tabindex from whileTap, differing initial/exit/variants, Marquee/ScrollProgress) made the server always render the animated variant while reduced-motion clients rendered different HTML — first visible at `<aside>`. Swept to unconditional rendering (`MotionConfig reducedMotion="user"` neutralizes) → harness: server vs worst-case IDENTICAL (221,680 chars).
- **Makro pass (0.8.0):** marquee + ToolSteps (4 tools) + SpotlightCard + `/` shortcut palette; `tsc` 0 + `next build` exit 0 (50 routes).
- **UI-5 Micro-interactions:** button/badge/card/input/skeleton/tooltip motion (transform/opacity only, reduced-motion off, asChild-safe) + Header theme-morph + Pro pulse + Footer stagger/underline + new copy-button/animated-number/animated-slider (8 swaps).
- **UI-5 Page patterns (0.7.0):** animated-tabs + empty-state; tabs migrated on 3 pages; ToolLayout FAQ AnimatePresence; EmptyState on 4 pages.
- **UI-6 Section gestures (0.8.0):** marquee + tool-steps + spotlight-card; landing marquee band; SearchCommand `/` shortcut; ToolSteps on 4 pages.

## Docs pass (0.8.x)

- README rewrite (tool list generated from `src/lib/tools-config.ts`), this CHANGELOG (reconstructed), `/privacy` page (EN/ID), FAQPage JSON-LD alongside SoftwareApplication. **No analytics library added — privacy-first: explicitly no tracking.**

## [0.9.0] — Fase 19: Calculators (9 tools, 54 total)

- unit-converter (8 categories, swap, history) + date-calculator (between/add-subtract, business days) + age-calculator (countdown, zodiac) + bmi-calculator (SVG gauge) + loan-calculator (EMI, amortization, SVG donut, CSV).
- percentage / tip (USD+IDR) / discount (stacked) / timezone (DST-aware, world clock).
- +2 categories (`calculators`, `design`) +41 tools-config entries (icons verified as lucide exports).

## [0.9.1] — Fase 20–23: Dev utils + Design + AI + Docs (41 tools, 86 total)

- **Fase 20 dev-A:** timestamp + uuid + lorem (3 languages) + markdown-to-html (`marked`) + html-to-markdown (`turndown` + new `turndown.d.ts` shim).
- **Fase 20 dev-B:** css-formatter (custom minify/beautify) + js-formatter (`prettier` lazy beautify + custom minify state machine) + sql-formatter (`sql-formatter`, `language` key) + xml-formatter (DOMParser) + yaml-formatter (`js-yaml`).
- **Fase 20 dev-C:** csv-to-json / json-to-csv (`papaparse` + shim) + url/html encoders + slugify + dedupe/sort lines + find-replace + text-diff (`diff` lib).
- **Fase 21 design-A:** favicon (ZIP + manifest + snippet) + social-resizer (14 presets + ZIP) + meme (templates, drag text) + ascii-art (mono/color) + palette (harmonies + image quantize).
- **Fase 21 design-B:** gradient + box-shadow + grid + flexbox + svg-to-png (batch ZIP) + code-screenshot (`html-to-image`, reused Prism — no `prismjs`).
- **Fase 22 platform AI:** `lib/ai-key.ts` (AES-GCM + PBKDF2) + shared `AiKeyField` + ai-summarizer + ai-translator (gpt-4o-mini, chunked) + `/settings` page (not a sidebar tool).
- **Fase 23 docs:** README 86-tool tables + this CHANGELOG + `/privacy` + FAQPage JSON-LD (analytics rejected: no tracking).
- Skipped deps (documented): `currency.js` (Intl), `recharts` (custom SVG), `uuid` (crypto.randomUUID), `lorem-ipsum` (built-in banks), `clean-css` (custom), `react-select` (native), `prismjs` (reused highlighter), `cronstrue`/`comlink` (no consumer).

## Planned, NOT shipped (no version assigned)

- Compress PDF remains not feasible purely client-side (declared out of scope).
