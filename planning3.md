Berikut adalah **`planning3.md`**, dokumen kelanjutan yang berfokus pada penambahan fitur-fitur dengan **volume pencarian tertinggi (High Traffic)** dan **utilitas harian**, yang semuanya tetap dapat dieksekusi 100% di sisi klien (browser) tanpa biaya server.

---

# 🚀 AIOTools - planning3.md (Phase 3: High-Traffic Utilities & Media Mastery)

## 1. STATUS & TUJUAN
**Dokumen Ini:** Ekstensi dari `planning.md` dan `planning2.md` (Fase 1-9 diasumsikan selesai).
**Tujuan Fase 3:** Menangkap traffic organik tertinggi dengan menyediakan tools yang paling sering dicari pengguna sehari-hari (PDF manipulation, Image editing, Text utilities). Tetap mempertahankan prinsip **100% Client-Side, Zero Server Cost, dan Premium UX**.

---

## 2. PENAMBAHAN TECH STACK & DEPENDENCIES
Tambahkan dependensi ringan ini untuk mendukung fitur baru:
- **Password Strength:** `zxcvbn` (Library standar industri untuk estimasi kekuatan password secara lokal).
- **Color Picker (Watermark):** `react-colorful` (UI color picker yang sangat ringan dan modern untuk Canvas watermark).
- **HEIC Conversion:** `heic2any` (Konverter HEIC ke JPG/PNG murni di browser).
- *Catatan:* Fitur Screen Recorder dan Canvas Watermark akan menggunakan **Native Browser APIs** (`MediaRecorder`, `Canvas API`) tanpa library tambahan untuk menjaga bundle size tetap kecil.

---

## 3. TOOL SPECIFICATIONS (SCOPE EXPANSION)

### Kategori 7: Text & Security Utilities (Daily Drivers)
1. **Secure Password Generator**
   - **Input:** Slider panjang (8-64 karakter), Checkbox (Uppercase, Lowercase, Numbers, Symbols), Input custom characters.
   - **Output:** Password yang di-generate menggunakan `crypto.getRandomValues()` (bukan `Math.random()` agar aman).
   - **UX Premium:** Indikator kekuatan password real-time (menggunakan `zxcvbn` dengan bar warna Merah-Kuning-Hijau), tombol "Copy" dengan animasi sukses, dan tombol "Refresh/Regenerate".
2. **Word & Character Counter**
   - **Input:** Textarea besar dengan auto-resize.
   - **Output:** Dashboard statistik real-time: Jumlah Kata, Karakter (dengan/spasi), Kalimat, Paragraf, dan **Estimasi Waktu Baca** (Reading Time).
   - **UX Premium:** Tampilan statistik menggunakan card-card kecil dengan ikon `lucide-react` yang rapi.

### Kategori 8: Canvas & Media Mastery (Visual Tools)
1. **Image Watermark**
   - **Input:** Upload gambar utama. Tab untuk "Text Watermark" atau "Image/Logo Watermark".
   - **Controls:** Jika teks: input font, size, color (pakai `react-colorful`), opacity, posisi (9 grid points). Jika gambar: upload logo, atur opacity, size, posisi.
   - **Output:** Preview real-time menggunakan `<canvas>`. Tombol download hasil akhir.
2. **Image Cropper**
   - **Input:** Upload gambar.
   - **Controls:** Area crop dengan `react-image-crop`. Preset rasio aspek (Free, 1:1, 16:9, 4:3, 3:2). Tombol rotasi 90° dan flip horizontal/vertical.
   - **Output:** Preview hasil crop, download dengan format asli atau pilihan JPG/PNG/WebP.
3. **Screen & Audio Recorder**
   - **Input:** Tombol "Start Recording". Modal pilihan: "Screen Only", "Screen + Microphone", "Microphone Only".
   - **Processing:** Menggunakan native `MediaRecorder` API dan `getDisplayMedia()`. Menampilkan timer durasi rekaman dan animasi "Recording" (titik merah berkedip).
   - **Output:** Preview video/audio langsung di browser, tombol "Download" (format .webm).

### Kategori 9: Advanced Conversions (PDF & Formats)
1. **Images to PDF**
   - **Input:** Upload multiple gambar (Drag & drop).
   - **Controls:** List gambar yang bisa di-drag untuk di-reorder. Pengaturan ukuran kertas (A4, Letter, Legal), orientasi (Portrait/Landscape), dan margin. Opsi "Fit to page" atau "Original size".
   - **Output:** Generate PDF menggunakan `pdf-lib` dan `jszip` (jika output banyak file), download file PDF.
2. **Base64 Encoder/Decoder**
   - **Input:** Tab 1 (Text): Textarea untuk encode/decode teks. Tab 2 (Image): Dropzone untuk upload gambar.
   - **Output:** Tab 1: Hasil string base64. Tab 2: String base64 + preview gambar + tombol "Copy String" dan "Copy Data URI".
3. **HEIC to JPG/PNG Converter**
   - **Input:** Upload file `.heic` / `.heif` (biasanya dari iPhone).
   - **Processing:** Konversi menggunakan `heic2any` di Web Worker agar UI tidak freeze saat memproses gambar resolusi tinggi.
   - **Output:** Preview gambar hasil konversi, download sebagai JPG atau PNG.

---

## 4. STEP-BY-STEP EXECUTION PHASES (LANJUTAN)

### FASE 10: Quick Wins (High Traffic, Low Complexity)
Fokus pada tools yang paling cepat selesai namun memiliki volume pencarian harian yang masif.
- [ ] Implementasi **Secure Password Generator** (Integrasi `zxcvbn` dan Web Crypto API).
- [ ] Implementasi **Word & Character Counter** (Fokus pada UI statistik yang rapi dan live-update).
- [ ] Implementasi **Rotate PDF** (Upload, tampilkan thumbnail halaman, kontrol rotasi global/per-halaman, download).

### FASE 11: Canvas & Media Mastery (Visual & Native APIs)
Fokus pada manipulasi visual dan pemanfaatan API native browser.
- [ ] Implementasi **Image Watermark** (Setup Canvas API, integrasi `react-colorful`, handling opacity dan posisi).
- [ ] Implementasi **Image Cropper** (Integrasi `react-image-crop`, handling aspect ratio presets dan export).
- [ ] Implementasi **Screen & Audio Recorder** (Setup `MediaRecorder`, handling permission prompts, UI timer, dan download blob).

### FASE 12: Advanced Conversions (PDF & Formats)
Fokus pada logika konversi format file yang lebih kompleks.
- [ ] Implementasi **Images to PDF** (Handling multiple images, reordering UI, mapping ke halaman PDF dengan `pdf-lib`).
- [ ] Implementasi **Base64 Encoder/Decoder** (Handling file reader, chunking untuk file besar agar tidak crash).
- [ ] Implementasi **HEIC to JPG** (Setup Web Worker untuk `heic2any`, handling progress bar).