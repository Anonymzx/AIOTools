# PROGRESS.md

## Current Vibe
- AIOTools Fase 1–26: 100 tools + PWA + motion + boundary, build + smoke hijau

## ✅ Completed
- `/graphify .` full pipeline (2026-10-04): 96 files, 1017 nodes, 1498 edges, 88 communities
- Outputs: `graphify-out/graph.html`, `GRAPH_REPORT.md`, `graph.json`
- FASE 1 Foundation & Design System (2026-10-05): Next.js 14.2.35 + TS strict + Tailwind v3 + src-dir; tema AIOTools (indigo-600/emerald-500, zinc, Inter+JetBrains Mono, radius 0.75rem); 11 shadcn ui components; tools-config (4 kategori, 8 tools); Sidebar collapsible + Cmd+K + mobile drawer; Header (breadcrumbs, theme toggle, share, Pro); landing page; `tsc` + `next build` green
- FASE 2 Core UI + i18n EN/ID (2026-10-05): dictionaries en/id + zustand persist store; tools-config bilingual; ToolLayout + FileDropzone; Header language toggle; AppShell drawer + document.lang sync; `tsc` green
- FASE 3 Text & Dev (2026-10-05): case-converter + json-formatter (Prism, error panel, stats)
- FASE 4 Image (2026-10-05): BeforeAfterSlider + image-worker + compress (worker+fallback) + convert (multi + ZIP)
- FASE 5 PDF (2026-10-05): merge (drag-reorder) + to-image (pdfjs local worker + CDN fallback)
- FASE 6 SEO (2026-10-05): ToolLayout SEO (title/canonical/JSON-LD), metadata EN, sitemap + robots; pdf.worker bundling fix (/public)
- QR + Hash tools (2026-10-05): qr-generator (logo composite, PNG/SVG) + hash-generator (MD5/SHA live)
- FASE 7 Dev (2026-10-06): regex-tester + jwt-decoder; +4 tools config; decode manual (jose tetap di deps)
- FASE 8a Split PDF (2026-10-06): thumbnail grid + select + extract
- FASE 8b BG Remover (2026-10-06): WASM worker + fallback panel; onnxruntime minify fix (SkipRawOrtMinifyPlugin, via F9)
- FASE 9 Platform (2026-10-06, pkg →0.2.0): Cmd+K actions + useToolClipboard (5 pages) + PWA (manifest, icons pngjs, SW) + batch-queue store; Lighthouse skipped jujur (no Chrome)
- FASE 10 Quick Wins (2026-10-06): password-generator + word-counter + pdf/rotate; +9 tools config (21 total)
- FASE 11 Media (2026-10-06, pkg →0.3.0): watermark + crop + record
- FASE 12 Conversions (2026-10-06): images-to-pdf + base64 + heic-convert (worker)
- FASE 13 PDF Pro (2026-10-06): organize + page-number + unlock + text-to-pdf; tools-config +14 entries + kategori files (35 total); Protect PDF DINYATAKAN OUT OF SCOPE (pdf-lib tak ada API enkripsi, tanpa dep baru)
- FASE 14 Canvas (2026-10-06, pkg →0.4.0): resize + rotate-flip + crop-circle + collage + signature
- FASE 15 Utility (2026-10-06, pkg →0.5.0): images-to-gif (gifenc) + gif-to-images (gifuct-js) + zip-maker/extractor + barcode (jsbarcode); gifenc butuh src/types/gifenc.d.ts shim
- FASE 16 PDF create (2026-10-06): scan (kamera+filter+reorder) + metadata (6 fields) + watermark (posisi/format) + info (11 kartu); +10 tools config (45 total); `tsc` clean
- FASE 17 PDF edit (2026-10-06): sign (draw/type/upload + drag posisi) + redact (rect select + konfirmasi) + repair (salvage per-halaman); `tsc` clean
- FASE 18 PDF analysis (2026-10-06, pkg →0.6.0): compare (diffLines/Words + navigasi) + to-markdown (heuristik heading) + ocr (tesseract worker eng/ind + searchable PDF); turndown di-skip (sumber teks posisional); `tsc` clean
- FASE 16–18 final verify (2026-10-06): fix TS2802 to-markdown → `next build` exit 0 (50 routes, 45 tools); AKAR korup .next ketemu: dev server :3001 masih jalan berbagi .next dengan build → bunuh semua via PID, mv+rebuild fresh; smoke 200: 12 endpoint (10 tools baru + home + sitemap)
- UI-1 Motion foundation (2026-10-06): template.tsx (AnimatePresence + MotionConfig reducedMotion=user) + Sidebar spring (layoutId active, hover x4, icon rotate) + AnimatedButton (ripple, loading, success); `tsc` 0
- UI-2 Upload feedback (2026-10-06): FileDropzone motion (scale/glow/wiggle/stagger) + processing-state.tsx (bar/dots/shimmer) + ToolLayout reveal; `tsc` 0
- UI-3 Scroll & overlays (2026-10-06): ScrollProgress + AppShell wiring + dialog/sheet spring + sonner icons + text-reveal.tsx; `tsc` 0
- UI-4 Hero effects (2026-10-06, pkg →0.5.1): particle-background (canvas, ssr:false) + use-magnetic + tilt-card + landing stagger/gradient/magnetic (inline TextReveal fallback — duplikat kecil vs ui/text-reveal, kandidat unifikasi); `tsc` 0, eslint clean
- Hydration ROOT CAUSE PROVEN (2026-10-06, harness /tmp/hydra/harness.js — SSR string vs client string): ~80 cabang render `useReducedMotion()` di 21 files (span vs motion.span, tabindex dari whileTap, initial/exit/variants berbeda, Marquee/ScrollProgress return berbeda) → server selalu render versi animasi, klien reduced-motion render HTML beda → mismatch (pertama klihatan di <aside>). Sapu bersih → unconditional (MotionConfig reducedMotion=user yang netralkan) → harness: server vs worst-case IDENTICAL 221.680 chars; `tsc` 0. Sengaja skip `next build` (dev user jalan di :3000, build bareng = korup .next)
- Makro pass (2026-10-06, pkg →0.8.0): marquee + ToolSteps (4 tools) + SpotlightCard + "/" shortcut palette; fix lint Badge unused; `tsc` 0 + `next build` exit 0 (50 routes)
- UI-5 Micro-interactions (2026-10-06): button/badge/card/input/skeleton/tooltip motion (transform/opacity only, reduced-motion off, asChild-safe) + Header theme-morph + Pro pulse + Footer stagger/underline + NEW copy-button/animated-number/animated-slider; swaps: 6× CopyButton, 2× AnimatedNumber, 2× AnimatedSlider; `tsc` 0, eslint clean
- FASE 16 PDF batch A (2026-10-06, agent FASE-16): pdf/scan (camera + filters + reorder + aspect-fit pages → scan.pdf) + pdf/metadata (read 6 fields + stat cards, edit + clear → metadata.pdf) + pdf/watermark (font/size/opacity/color, center/diagonal/tiled, all/range → watermarked.pdf) + pdf/info (pages/version/encryption/meta + copy + .txt); tools-config +10 entries (45 total, existing 35 untouched); icon maps (ScanLine/Tags/Signature/EyeOff/Droplets/GitCompare/FileCode/ScanText/Info) in Sidebar/ToolLayout/landing; owned files `tsc` clean
- FASE 17 PDF Sign/Redact/Repair (2026-10-06): pdf/sign (draw/type/upload tabs, draggable box, FLIP-Y embedPng → signed.pdf) + pdf/redact (drag rects, preview toggle, black flatten, irreversible checkbox → redacted.pdf) + pdf/repair (reading→validating→rebuilding pipeline, partial salvage → repaired.pdf, red alternatives panel); EN/ID + privacy badge + FAQs; tools-config.ts untouched; `tsc` clean for owned files
- FASE 18 PDF Compare/Markdown/OCR (2026-10-06, pkg →0.6.0): pdf/compare (diffLines/diffWords, side-by-side panes, change list + prev/next scrollIntoView, stats) + pdf/to-markdown (Y-group heuristic, #/## gap>20%, list keep, tables fallback) + pdf/ocr (tesseract eng/ind on-demand, 20-page cap, Text + searchable.pdf tabs, opacity-0 overlay); tools-config.ts untouched; eslint clean; `tsc` 0 for owned files (1 pre-existing error in pdf/watermark)
- Quick calculators (2026-10-06): calculators/percentage (3 modes, live + formulas + copy) + calculators/tip (slider+custom+stepper, USD/IDR Intl, plain formatted) + calculators/discount (stacked sequential + effective %) + calculators/timezone (WIB/WITA/WIT/UTC+12 world zones via supportedValuesOf-guarded list, 6-zone table, 1s world-clock w/ cleanup); EN/ID + ToolLayout + 3 FAQs each; tools-config.ts untouched; `tsc` + eslint clean for owned files
- Kategori D 41-42 BYOK AI + prefs (2026-10-06): src/lib/ai-key.ts (AES-GCM + PBKDF2 100k, device-id terpisah, honest-limits comment, save/load/clear/has/mask) + components/tools/AiKeyField.tsx (shared, password+save/clear/masked) + developer/ai-summarizer (pdfjs extract cap 15k + toast, model×3, length×3, 60s abort, 401/429 toasts, 10s guard, cost note, copy/download) + developer/ai-translator (PDF/teks, 20 bahasa, chunk 8k sekuensial + progress, gpt-4o-mini) + app/settings (bahasa/tema/motion-note/danger-zone); tools-config.ts untouched; `tsc` 0 untuk file milik sendiri (4 error pre-existing di file agen lain)
- Fase 20 Design batch B tools 34-39 (2026-10-07): design/gradient (2–5 stops color+pos, linear angle/radial, preview+CSS+copy+random+6 presets+1200×630 canvas PNG) + design/box-shadow (ox/oy/blur/spread/color+opacity/inset, multi add/remove/reorder, preview+CSS+copy+4 presets) + design/grid (cols/rows/gap sliders, 4 track presets, click-toggle cells, item count, CSS+copy) + design/flexbox (direction/wrap/justify/align/gap + item count, preview boxes, CSS+copy) + design/svg-to-png (paste/dropzone, w/h + scale 1–4x + transparent/solid bg, Blob+Image+canvas rasterize, taint guard toast, preview + PNG + batch ZIP via jszip) + design/code-screenshot (6 langs via Prism oneDark/oneLight reuse, 6 bg presets, padding/font-size sliders, mac dots, html-to-image toPng/toBlob dynamic pixelRatio 2, ClipboardItem guarded copy + download); tools-config.ts untouched; `tsc` 0 untuk 6 file milik sendiri (1 error tersisa di developer/text-diff milik agen lain, tak disentuh)
- Fase 24 Web/SEO generators tools 15-20 (2026-10-07): developer/meta-tags (9 inputs + live head snippet + copy/download + FB/X previews) + developer/robots-generator (visual rows + raw-text two-way sync + sitemap line) + developer/sitemap-generator (validate/dedupe/cap-1000 + freq/priority/lastmod + XML escape) + developer/htaccess-generator (8 toggles + staging warning) + developer/ip-info (ipapi.co→ipwho.is fallback, UA/screen device cards, manual-IP mode) + developer/user-agent (effect UA read, browser/OS/device/engine/bot parse, custom UA, copy JSON); local STR EN/ID + ToolLayout + 3 FAQs + "use client", no metadata, 0 deps; tools-config.ts untouched; fix `};`→`];` FAQ-close typo di ip-info; `tsc` 0 untuk 6 file milik sendiri (3 error pre-existing di file agen paralel: graph-plotter, random-generator, typing-test — tak disentuh)

## 🚧 In Progress
- None — Fase 1–26 selesai (100 tools) + social/Ko-fi terpasang, siap deploy

## FASE 23 Media ffmpeg.wasm (2026-10-07, pkg →0.11.0)
- NEW src/lib/ffmpeg.ts (singleton+concurrency guard, toBlobURL CDN @ffmpeg/core 0.12.9, ST core, FFmpegCompatError, terminate/revoke)
- NEW media/audio-trimmer (canvas waveform decodeAudioData, drag handles min 0.5s, preview, -ss/-to copy + re-encode fallback) + media/video-to-mp3 (128/192/320k, mp3/wav, progress) + media/video-compressor (crf 32/26/20 veryfast, 1080/720/480/orig, mute, progress+ETA, before/after) + media/video-trimmer (start/end inputs+sliders, stream-copy default + re-encode toggle)
- tools-config: +2 kategori (media/MonitorPlay, productivity/Timer) +16 entries (existing 86 untouched); icon maps synced (Sidebar/ToolLayout/landing); TimerCheck→Timer fallback (not exported); `tsc` 0

## 🆕 Productivity + Math batch (2026-10-07, pkg →0.11.0)
- Pomodoro + typing-test sudah ada (parallel agent) — fixed `};`→`];` FAQ typo di typing-test
- NEW 4 pages (tools-config.ts untouched): productivity/stopwatch (mm:ss.cs 10ms w/ cleanup, laps delta + fastest/slowest, countdown + beep) + productivity/random-generator (Number unique/sort via crypto, Name 30 EN + 30 ID + filter, Color hex/rgb/hsl click-copy, Coin flip + d4–d20 roll, copy-all + .txt) + calculators/scientific (keypad + keyboard effect, DEG/RAD, reuses src/lib/math-eval PURE shunting-yard, history click-reuse, inline domain errors) + calculators/graph-plotter (custom canvas: axes/grid/pan/wheel-zoom/buttons, 3 colored fns, presets x^2/sin/x·cos, toast + last-good on error)
- `tsc` 0 + eslint clean owned files; verified `grep '^version:' package.json` → 0.11.0

## ⏭️ Next Steps
- Review user → deploy (ganti metadataBase https://aitools.app dengan domain asli, re-copy public/pdf.worker.min.mjs tiap upgrade pdfjs-dist)
- ATURAN OPERASIONAL: jangan jalankan `next dev` dan `next build` bersamaan di dir ini (berbagi .next → output korup); bunuh server via PID, jangan pkill -f (hang di WSL mount); dev basi (watcher WSL kelewat dir baru) → restart dev
- Kandidat follow-up: Compress PDF (tidak feasible murni client-side), Color Extractor, EPUB→PDF
- Opsional: lazy-load zxcvbn (halaman password 396 kB), audit Lighthouse dengan Chrome asli
- FASE 19b Text utils 20–28 (2026-10-06, pkg stays 0.8.0): csv-to-json + json-to-csv (papaparse + shim) + url-encoder + html-encoder + slugify + dedupe-lines + sort-lines + find-replace + text-diff (diff pkg); tools-config.ts untouched; owned files `tsc` + eslint clean

## FASE 19a Code formatters (2026-10-06, pkg →0.9.1)
- NEW 5 tools (planning6.md tools 15-19, tools-config.ts untouched): developer/css-formatter (custom string-aware minify + brace-aware beautify 2/4, before/after bytes + ratio) + developer/js-formatter (prettier lazy via `prettier/standalone` + `prettier/plugins/babel` route-split, custom comment/string/template/regex-aware minify + balance note) + developer/sql-formatter (sql-formatter v15, 5 dialects tsql→transactsql, keywordCase toggle) + developer/xml-formatter (DOMParser parsererror gate + custom indent, CDATA/comment/PI safe) + developer/yaml-formatter (js-yaml loadAll multi-doc, indent 2/4, YAML↔JSON toggle, line/col error excerpt)
- Pattern: local STR EN/ID + ToolLayout + 3 FAQs + "use client", no metadata, constant useState initials, mounted-gate Prism (no .reduce branches), try/catch + sonner everywhere, CopyButton + blob download
- Verify: `tsc` 0 for owned files (5 pre-existing errors in parallel workstream files: code-screenshot, grid, html-to-markdown, markdown-to-html, text-diff — untouched); 21-case node smoke on extracted pure fns (caught + fixed: beautify trailing-`;`, CDATA `]]>` tokenize, nested-template stack accounting)
- FASE 19 Calculators batch A (agent FASE-19-calc, pkg →0.9.0): 5 pages live (unit-converter/date/age/bmi/loan); tools-config +2 categories +41 entries (86 total); icon maps synced (Sidebar/ToolLayout/landing, Link aliased); owned files `tsc` clean (1 error in parallel agent's developer/text-diff, untouched)
- Parallel agents active: design/*, developer/* new tools landing concurrently (some with TS1137 `};`→`];` typos, not owned here)
- Docs pass (2026-10-06): README rewrite (45 tools dari tools-config), CHANGELOG.md reconstructed, /privacy EN/ID, FAQPage JSON-LD, Footer Privacy link; `tsc` clean untuk file milik sendiri

## UI-6 Section gestures (2026-10-06, pkg →0.8.0)
- NEW ui/marquee.tsx (Marquee x[0%,-50%] linear repeat, pause settles -50% = no jump, edge masks, reduced-motion static wrap) + ui/tool-steps.tsx (3 nodes Upload/Cog/Download, scaleX connectors, spring pop, check morph, presentational) + ui/spotlight-card.tsx (cursor motion values + useMotionTemplate fill/border glow, touch/reduced fallback)
- Landing: marquee band (all tool titles, below hero) + popular grid Spotlight > Tilt > Card
- SearchCommand: "/" shortcut (skip inputs/meta keys) + footer hint chip
- ToolSteps on 4 pages (EN/ID stepUpload/stepProcess/stepDownload keys added)
- `tsc` 0

## UI-5 Page patterns (2026-10-06, pkg →0.7.0)
- NEW ui/animated-tabs.tsx (AnimatedTabs layoutId tab-pill spring 350/32 + AnimatedTabPanel fade/slide 8px mode=wait, reduced-motion instant) + ui/empty-state.tsx (float loop y±6 3s, dashed container, staggered fade-up)
- Tabs migrated: image/watermark, developer/base64, pdf/sign (logic kept, panels wrapped); image/record adapted (cards kept + layoutId rec-mode-ring glow)
- ToolLayout FAQ: AnimatePresence height/opacity .28s + chevron rotate spring; BeforeAfterSlider: handle spring 250/28 + scale 1.15 dragging, divider glow, labels fade-in on first touch
- EmptyState swapped: compress, collage (existing blocks), merge + images-to-gif (added on empty list); skipped: 0
- `tsc` owned files clean; 3 pre-existing errors untouched (badge/card onDrag-motion conflict, word-counter number|undefined)

## ⏭️ Next Steps
- Review user → deploy (ganti metadataBase https://aitools.app dengan domain asli, re-copy public/pdf.worker.min.mjs tiap upgrade pdfjs-dist)
- ATURAN OPERASIONAL: jangan jalankan `next dev` dan `next build` bersamaan di dir ini (berbagi .next → output korup); bunuh server via PID, jangan pkill -f (hang di WSL mount)
- Kandidat follow-up: Compress PDF (tidak feasible murni client-side), PDF-to-Text, Color Extractor, EPUB→PDF
- Opsional: lazy-load zxcvbn (halaman password 396 kB), audit Lighthouse dengan Chrome asli

## ⚠️ Known Issues
- Graph health: 142 dangling-endpoint edges, 3 self-loops (AST/semantic ID-format drift)
- 51 `.csv` files unclassified, not in graph
- No `pubspec.yaml` — versioning discipline N/A (non-Flutter repo)
