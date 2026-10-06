Berikut adalah **`planning2.md`**, dokumen kelanjutan yang dirancang sebagai ekstensi langsung dari `planning.md` asli. Dokumen ini memetakan Fase 7 hingga 9, menambahkan spesifikasi tool baru, dan memperbarui arsitektur untuk mendukung fitur tingkat lanjut (WASM, PWA, dll) tanpa melanggar prinsip *Client-First* dan *Zero Server Cost*.

---

# 🚀 AIOTools - planning2.md (Phase 2: Advanced Features & Platform Polish)

## 1. STATUS & TUJUAN
**Dokumen Ini:** Ekstensi dari `planning.md` (Fase 1-6 telah selesai dan stabil).
**Tujuan Fase 2:** Meningkatkan *retensi pengguna* dan *nilai jual* platform dengan menambahkan fitur canggih (WASM/AI), memperdalam utilitas developer, dan menyempurnakan pengalaman pengguna menjadi level "Premium App" (PWA, Cmd+K).
**Prinsip Tetap:** 100% Client-Side, Privasi Terjaga, UI/UX Kelas Premium.

---

## 2. PENAMBAHAN TECH STACK & DEPENDENCIES
Tambahkan dependensi ini ke `package.json` sesuai kebutuhan fase:
- **Advanced Media/AI:** `@imgly/background-removal` (atau `@tensorflow-models/body-pix` untuk alternatif ringan) untuk background remover client-side.
- **Platform UX:** `cmdk` (Command palette), `@ducanh2912/next-pwa` (atau `next-pwa`) untuk Progressive Web App.
- **Developer Utils:** `cronstrue` (human-readable cron), `jose` (lightweight JWT decoding).
- **Performance:** `comlink` (opsional, untuk menyederhanakan komunikasi Web Worker yang kompleks).

---

## 3. TOOL SPECIFICATIONS (SCOPE EXPANSION)

### Kategori 5: Advanced Developer Tools
1. **Regex Tester & Cheatsheet**
   - **Input:** Textarea untuk Regex Pattern, Textarea untuk Test String, Checkbox untuk flags (`g`, `i`, `m`).
   - **Output:** Live highlighting pada test string yang match, daftar kelompok (capture groups), dan panel samping berisi "Common Patterns" (Email, URL, Phone) yang bisa diklik untuk auto-fill.
   - **Error Handling:** Tampilkan pesan error regex yang jelas (bukan crash) jika pola tidak valid.
2. **JWT (JSON Web Token) Decoder**
   - **Input:** Textarea untuk paste token JWT.
   - **Output:** 3 Panel (Header, Payload, Signature) dengan syntax highlighting. Indikator visual (hijau/merah) untuk status expired (`exp` claim) dan validasi struktur.
   - **Privasi:** Teks "Decoded locally in your browser. Never sent to any server."

### Kategori 6: Advanced PDF & Media
1. **Split / Extract PDF**
   - **Input:** Upload PDF.
   - **UI:** Grid thumbnail visual setiap halaman (gunakan `pdf.js` untuk render thumbnail ringan). User bisa klik untuk memilih halaman yang ingin dipertahankan atau dihapus.
   - **Output:** Download PDF baru yang hanya berisi halaman terpilih.
2. **AI Background Remover (Image)**
   - **Input:** Upload gambar (JPG/PNG).
   - **Processing:** Jalankan model WASM di Web Worker agar UI tidak freeze. Tampilkan progress bar yang detail ("Loading model...", "Processing...").
   - **Output:** Preview Before/After dengan background checkerboard pattern. Opsi download PNG (transparan) atau ganti background dengan warna solid.

---

## 4. PLATFORM UX ENHANCEMENTS (META-FEATURES)
Fitur ini tidak memproses data, tetapi meningkatkan cara pengguna berinteraksi dengan seluruh platform:
1. **Functional Command Palette (`Cmd+K` / `Ctrl+K`)**
   - Bukan hanya navigasi. Harus mendukung:
     - *Navigation:* "Go to JSON Formatter"
     - *Action:* "Toggle Dark Mode", "Clear All Inputs"
     - *Direct Tool:* "Paste from Clipboard" (langsung paste dan proses untuk tool teks).
2. **PWA (Progressive Web App) Setup**
   - Konfigurasi `manifest.json` (nama, ikon, theme_color sesuai Indigo-600).
   - Service Worker untuk caching aset statis dan **offline support** untuk kategori Text & Developer Tools.
3. **Batch Processing Queue (UI)**
   - Zustand store untuk mengelola antrian file. Misal: User drop 5 gambar, UI menampilkan daftar dengan status individual (Pending, Processing, Done) dan tombol "Download All as ZIP".

---

## 5. STEP-BY-STEP EXECUTION PHASES (LANJUTAN)

### FASE 7: Advanced Developer Tools (Quick Wins)
- [ ] Buat komponen `RegexTester` dengan live validation dan highlight.
- [ ] Buat komponen `JWTDecoder` dengan parsing claim `exp` dan visualisasi status.
- [ ] Pastikan kedua tool ini memiliki state management yang bersih dan error handling yang ramah pengguna (toast error, bukan console error).

### FASE 8: Advanced Media & PDF (Heavy Lifting)
- [ ] Implementasi `Split PDF`: Integrasi `pdf.js` untuk preview thumbnail + `pdf-lib` untuk ekstraksi halaman.
- [ ] Implementasi `AI Background Remover`: Setup Web Worker khusus untuk memuat model WASM. Pastikan ada fallback UI jika browser user tidak mendukung WebAssembly atau kehabisan memori.
- [ ] Optimasi: Pastikan file WASM di-load secara dinamis (dynamic import) agar tidak memberatkan initial bundle size landing page.

### FASE 9: Platform Polish & PWA
- [ ] Implementasi `Cmd+K` menggunakan `cmdk` yang terintegrasi dengan `tools-config.ts`.
- [ ] Setup PWA: Buat `manifest.json`, konfigurasi next-pwa, dan buat icon set (192x192, 512x512).
- [ ] Uji coba Offline Mode: Matikan network di DevTools, pastikan tools teks dan developer masih bisa dibuka dan berfungsi.
- [ ] Audit Lighthouse: Target skor Performance, Accessibility, Best Practices, dan SEO di atas 95.

---