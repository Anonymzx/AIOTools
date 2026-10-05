# 🚀 AIOTools - Master Project Planning & Architecture

## 1. PROJECT OVERVIEW
**Project Name:** AIOTools (All-In-One Tools)
**Objective:** Membangun platform web tools serba guna yang cepat, aman (privasi terjaga), dan memiliki UI/UX kelas premium.
**Core Philosophy:** 
- **Client-First:** 95% proses dilakukan di browser (Client-Side) menggunakan Web Workers untuk performa maksimal dan zero server cost.
- **Frictionless UX:** Drag & drop everywhere, instant feedback, no page reloads.
- **Premium UI:** Clean, spacious, modern, dark-mode native, highly responsive.

## 2. TECH STACK & DEPENDENCIES
- **Framework:** Next.js 14+ (App Router, TypeScript strict mode).
- **Styling:** Tailwind CSS + `shadcn/ui` (Customized for AIOTools branding).
- **Icons:** `lucide-react`.
- **Animations:** `framer-motion` (untuk transisi halus dan micro-interactions).
- **State & Forms:** `zustand` (global state), `react-hook-form` + `zod` (validasi).
- **Core Libraries:**
  - Image: `browser-image-compression`, `react-image-crop`.
  - PDF: `pdf-lib`, `react-dropzone`.
  - Utils: `qrcode`, `jszip` (untuk download multiple files).
  - Crypto/Hash: Web Crypto API (Native).

## 3. UI/UX DESIGN SYSTEM (STRICT ENFORCEMENT)
AI harus mematuhi pedoman desain ini untuk setiap komponen yang dibuat:

### 3.1. Visual Identity
- **Theme:** Default to Light Mode, but Dark Mode must be pixel-perfect.
- **Color Palette:**
  - Primary: Indigo-600 (Trust, Tech).
  - Accent: Emerald-500 (Success, Action).
  - Background: Zinc-50 (Light) / Zinc-950 (Dark).
  - Surface/Cards: White (Light) / Zinc-900 (Dark) dengan border tipis (Zinc-200/Zinc-800).
- **Typography:** Inter (UI), JetBrains Mono (Code/Dev tools).
- **Border Radius:** `rounded-xl` untuk cards, `rounded-lg` untuk inputs/buttons.
- **Shadows:** Gunakan shadow yang sangat halus (`shadow-sm` atau `shadow-md`), hindari shadow hitam pekat. Gunakan ring focus (border + ring) untuk aksesibilitas.

### 3.2. Layout Structure
- **Sidebar (Left):** Sticky, collapsible. Berisi logo AIOTools, Search bar (Cmd+K), dan daftar kategori tools dengan ikon.
- **Header (Top):** Breadcrumbs, Theme Toggle, "Share" button, dan "Pro/Upgrade" badge (opsional).
- **Main Content:** Max-width `max-w-4xl` atau `max-w-6xl` agar teks tidak terlalu lebar. Centered.

### 3.3. Core Component Patterns
- **Dropzone:** Area upload harus besar, memiliki border dashed, animasi saat file di-drag over, dan preview thumbnail.
- **Processing State:** Gunakan Skeleton loader atau Progress bar dengan persentase. JANGAN gunakan spinner tanpa konteks.
- **Result Area:** Harus jelas memisahkan "Input" dan "Output". Tombol "Download" atau "Copy" harus besar dan mencolok (Primary color).
- **Toasts:** Gunakan Sonner untuk notifikasi sukses/error di pojok kanan bawah.

## 4. FOLDER ARCHITECTURE
```text
src/
├── app/
│   ├── (marketing)/       # Landing page, about, contact
│   ├── tools/             # Parent route untuk semua tools
│   │   ├── image/         # /tools/image/compress, /tools/image/resize
│   │   ├── pdf/           # /tools/pdf/merge, /tools/pdf/split
│   │   ├── text/          # /tools/text/case-converter
│   │   └── developer/     # /tools/developer/json-formatter
│   ├── layout.tsx         # Root layout (Sidebar + Header)
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn components
│   ├── layout/            # Sidebar, Header, Footer
│   └── tools/             # Specific tool components (e.g., ImageDropzone)
├── lib/
│   ├── utils.ts           # cn() helper, formatters
│   ├── workers/           # Web workers untuk heavy processing
│   └── tools-config.ts    # Metadata untuk semua tools (nama, slug, icon, desc)
├── hooks/                 # Custom hooks (useDropzone, useTheme, etc)
└── types/                 # Global TypeScript interfaces

5. TOOL SPECIFICATIONS (SCOPE)
Kategori 1: Image Tools
Compress Image: Upload -> Slider kualitas (1-100%) -> Preview Before/After (slider band) -> Download. (Gunakan browser-image-compression).
Convert Image: Upload -> Pilih target format (WebP, JPG, PNG) -> Download.

Kategori 2: PDF Tools
Merge PDF: Upload multiple -> Sortable list (drag to reorder) -> Download merged. (Gunakan pdf-lib).
PDF to Image: Upload PDF -> Render setiap halaman jadi gambar -> Download as ZIP.

Kategori 3: Text & Utility
Case Converter: Textarea input -> Grid tombol (UPPER, lower, Title, camel, snake) -> Live preview output.
QR Code Generator: Input text/URL -> Pilih warna/warna background -> Optional upload logo tengah -> Download PNG/SVG.

Kategori 4: Developer Tools
JSON Formatter: Textarea input -> Tombol Format/Minify -> Syntax highlighted output (gunakan prismjs atau react-syntax-highlighter).
Hash Generator: Input text -> Live generate MD5, SHA-1, SHA-256, SHA-512.

6. EXECUTION RULES FOR AI (OPENCODE)
ATURAN EMAS: JANGAN MELANGGAR ATURAN INI.
Context First: Selalu baca file planning.md ini di awal sesi.

Iterative Execution: JANGAN menulis semua kode sekaligus. Kerjakan per FASE (lihat di bawah).
No Placeholders: Jangan gunakan komentar seperti // ... rest of the code atau // implement logic here. Tulis kode lengkap dan fungsional.

Error Handling: Setiap fungsi yang bisa gagal (parsing JSON, reading file) WAJIB dibungkus try/catch dan menampilkan error toast ke user.

Responsive First: Setiap UI yang dibuat harus di-test secara mental untuk mobile (min-width 320px). Sidebar harus menjadi drawer/sheet di mobile.

Checkpoint System: Di akhir setiap fase, BERHENTI. Tanyakan kepada user: "Fase X selesai. Apakah ada yang perlu direvisi pada UI/UX atau fungsionalitasnya sebelum kita lanjut ke Fase Y?"

7. STEP-BY-STEP EXECUTION PHASES

FASE 1: Foundation & Design System
Inisialisasi Next.js, Tailwind, shadcn/ui.
Setup konfigurasi tema (warna, font, radius) sesuai section 3.1.
Buat Layout utama: Sidebar (dengan data tools dari tools-config.ts) dan Header.
Buat Landing Page yang menarik (Hero section, Grid kategori tools, Footer).

FASE 2: Core UI Components & Layout Polish
Buat komponen ToolLayout (Wrapper untuk setiap halaman tool agar konsisten: Title, Description, Tool Area, FAQ section di bawah).
Buat komponen FileDropzone yang reusable (Drag & drop, validasi tipe file, preview).
Implementasi Mobile Sidebar (Sheet/Drawer).

FASE 3: Text & Developer Tools (Quick Wins)
Implementasi "Case Converter" (Fokus pada live-update dan UI yang rapi).
Implementasi "JSON Formatter" (Fokus pada syntax highlighting dan error handling jika JSON invalid).

FASE 4: Image Tools (Heavy Lifting)
Implementasi "Compress Image". Setup Web Worker jika perlu agar UI tidak freeze.
Buat UI perbandingan Before/After (gunakan slider).
Implementasi "Convert Image".

FASE 5: PDF Tools (Complex Logic)
Implementasi "Merge PDF". Fokus pada UX: user harus bisa drag-and-drop untuk mengurutkan halaman/file.
Implementasi "PDF to Image".

FASE 6: SEO, Meta, & Final Polish
Buat komponen <SEO /> dinamis.
Setup sitemap.ts dan robots.ts.
Tambahkan Schema.org (JSON-LD) untuk SoftwareApplication di setiap halaman tool.
Final check: Konsistensi UI, Dark mode check, Mobile check.