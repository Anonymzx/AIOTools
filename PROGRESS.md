# PROGRESS.md

## Current Vibe
- AIOTools Fase 1–18 + motion mikro/makro: 45 tools, semua elemen interaktif, build hijau

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
- Hydration fix (2026-10-06): motion.aside width SSR/client mismatch → CSS w-16/w-64 + transition (motion-reduce off); micro-interactions pass: button/badge/card/input/tooltip motion, theme Sun-Moon morph, footer stagger, CopyButton (6 pages), AnimatedNumber (word-counter, pdf/info), AnimatedSlider (compress, watermark) — pkg →0.7.0
- Makro pass (2026-10-06, pkg →0.8.0): marquee + ToolSteps (4 tools) + SpotlightCard + "/" shortcut palette; fix lint Badge unused; `tsc` 0 + `next build` exit 0 (50 routes)
- UI-5 Micro-interactions (2026-10-06): button/badge/card/input/skeleton/tooltip motion (transform/opacity only, reduced-motion off, asChild-safe) + Header theme-morph + Pro pulse + Footer stagger/underline + NEW copy-button/animated-number/animated-slider; swaps: 6× CopyButton, 2× AnimatedNumber, 2× AnimatedSlider; `tsc` 0, eslint clean
- FASE 16 PDF batch A (2026-10-06, agent FASE-16): pdf/scan (camera + filters + reorder + aspect-fit pages → scan.pdf) + pdf/metadata (read 6 fields + stat cards, edit + clear → metadata.pdf) + pdf/watermark (font/size/opacity/color, center/diagonal/tiled, all/range → watermarked.pdf) + pdf/info (pages/version/encryption/meta + copy + .txt); tools-config +10 entries (45 total, existing 35 untouched); icon maps (ScanLine/Tags/Signature/EyeOff/Droplets/GitCompare/FileCode/ScanText/Info) in Sidebar/ToolLayout/landing; owned files `tsc` clean
- FASE 17 PDF Sign/Redact/Repair (2026-10-06): pdf/sign (draw/type/upload tabs, draggable box, FLIP-Y embedPng → signed.pdf) + pdf/redact (drag rects, preview toggle, black flatten, irreversible checkbox → redacted.pdf) + pdf/repair (reading→validating→rebuilding pipeline, partial salvage → repaired.pdf, red alternatives panel); EN/ID + privacy badge + FAQs; tools-config.ts untouched; `tsc` clean for owned files
- FASE 18 PDF Compare/Markdown/OCR (2026-10-06, pkg →0.6.0): pdf/compare (diffLines/diffWords, side-by-side panes, change list + prev/next scrollIntoView, stats) + pdf/to-markdown (Y-group heuristic, #/## gap>20%, list keep, tables fallback) + pdf/ocr (tesseract eng/ind on-demand, 20-page cap, Text + searchable.pdf tabs, opacity-0 overlay); tools-config.ts untouched; eslint clean; `tsc` 0 for owned files (1 pre-existing error in pdf/watermark)

## 🚧 In Progress
- None — Fase 1–18 + UI-1–5 selesai, siap review user

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
