#  AIOTools - planning4.md (Phase 4: Competitor Feature Parity)

## 1. STATUS & TUJUAN
**Dokumen Ini:** Ekstensi dari `planning.md`, `planning2.md`, dan `planning3.md` (Fase 1-12 diasumsikan selesai).
**Tujuan Fase 4:** Mengejar ketertinggalan fitur dari kompetitor (iLovePDF, Smallpdf, ILoveIMG) dengan menambahkan tools yang **memiliki traffic tinggi** namun **tetap 100% client-side**.
**Prinsip Kunci:** Hanya menambahkan fitur yang bisa berjalan di browser. Fitur yang membutuhkan server (Word/PPT/Excel conversion) akan ditandai sebagai **"Out of Scope"** atau memerlukan solusi alternatif.

---

## 2. GAP ANALYSIS: Tools dari Screenshot vs AIOTools

### ✅ Sudah Ada di AIOTools (Fase 1-12)
| Kategori | Tools |
|----------|-------|
| PDF | Compress PDF, Merge PDF, Split PDF, Extract PDF Pages, PDF to Image, Image to PDF, Rotate PDF, PDF to Text |
| Image | Compress Image, Image to JPG/PNG/WEBP, HEIC to JPEG, Image Crop, Image Watermark |
| Text/Dev | Password Generator, JSON Formatter, Hash Generator, QR Code, Case Converter, Regex Tester, JWT Decoder, Base64 Converter, Color Extractor |

### 🆕 Belum Ada - FEASIBLE Client-Side (Akan Ditambahkan)
| Kategori | Tools | Tech Stack |
|----------|-------|------------|
| **PDF** | Organize PDF (rearrange pages) | `pdf-lib` |
| | Remove PDF Pages | `pdf-lib` |
| | Extract PDF Images | `pdf.js` + Canvas API |
| | Add Page Number | `pdf-lib` |
| | Crop PDF Page | `pdf-lib` |
| | Merge PDF and Image | `pdf-lib` + Canvas |
| | Text to PDF | `pdf-lib` |
| | Unlock PDF | `pdf-lib` (remove encryption) |
| | Protect PDF | `pdf-lib` (add password) |
| **Image** | Image Resize | Canvas API |
| | Image Rotate | Canvas API |
| | Image Crop Circle | Canvas API |
| | Image Merge (collage) | Canvas API |
| | Photo Signature Resize | Canvas API + preset dimensions |
| | Compress JPG/PNG/JPEG/WEBP/BMP (varian spesifik) | `browser-image-compression` |
| | WEBP to JPEG | Canvas API |
| **GIF** | Images to GIF | `gif.js` (WASM) |
| | GIF to Images | `gifuct-js` |
| **ZIP** | ZIP Maker | `jszip` (sudah ada) |
| | ZIP Extractor | `jszip` |
| **Others** | Barcode Generator | `bwip-js` atau `jsbarcode` |
| | Color Extractor (sudah ada di planning3) | Canvas API |

### ❌ Belum Ada - TIDAK FEASIBLE Client-Side (Out of Scope / Butuh Server)
| Tools | Alasan |
|-------|--------|
| Word to PDF, PDF to Word | Butuh LibreOffice/server-side rendering |
| Powerpoint to PDF, PDF to PPT | Format kompleks, butuh server |
| Excel to PDF, PDF to Excel | Butuh library berat seperti SheetJS + renderer |
| Document Converter (DOCX) | Butuh mammoth.js (feasible tapi kompleks) |
| Vector Converter (AI/EPS) | Format proprietary, butuh server |
| CAD Converter (DWG/DXF) | Butuh library khusus yang sangat berat |
| PDF to EPUB/MOBI/AZW3 | Struktur kompleks, butuh server |
| eBook to PDF (EPUB/MOBI/AZW) | **Sebagian feasible** dengan `epub.js` + `pdf-lib` |

---

## 3. PENAMBAHAN TECH STACK & DEPENDENCIES

```json
{
  "dependencies": {
    "gif.js": "Untuk Images to GIF (WASM-based)",
    "gifuct-js": "Untuk GIF to Images (parse GIF frames)",
    "jsbarcode": "Untuk Barcode Generator (ringan, support banyak format)",
    "bwip-js": "Alternatif barcode dengan support lebih lengkap",
    "epub.js": "Untuk eBook to PDF (render EPUB di browser)",
    "mammoth": "Untuk DOCX to HTML/PDF (opsional, jika ingin tambah DOCX support)",
    "file-saver": "Untuk trigger download file yang konsisten"
  }
}
```

---

## 4. TOOL SPECIFICATIONS (SCOPE EXPANSION)

### Kategori 10: Advanced PDF Operations
1. **Organize PDF** ⭐ (High Traffic)
   - **Input:** Upload PDF, tampilkan thumbnail semua halaman dalam grid.
   - **Controls:** Drag & drop untuk reorder, hapus halaman tertentu, duplikasi halaman, rotasi per halaman.
   - **Output:** Download PDF dengan urutan baru.
   - **Tech:** `pdf-lib` + `@dnd-kit/sortable` untuk drag-drop yang smooth.

2. **Add Page Number**
   - **Input:** Upload PDF.
   - **Controls:** Pilih posisi (header/footer, kiri/tengah/kanan), format nomor (1, 2, 3 / i, ii, iii / 1 of N), font size, mulai dari halaman ke-X.
   - **Output:** PDF dengan nomor halaman.
   - **Tech:** `pdf-lib` dengan `drawText` di setiap halaman.

3. **Extract PDF Images**
   - **Input:** Upload PDF.
   - **Processing:** Parse PDF dengan `pdf.js`, ekstrak semua objek gambar, tampilkan dalam grid.
   - **Output:** Download semua gambar sebagai ZIP, atau pilih individual.
   - **Tech:** `pdf.js` `getOperatorList` + Canvas API.

4. **Protect PDF / Unlock PDF**
   - **Protect:** Upload PDF, set password owner & user, pilih permission (print, copy, edit).
   - **Unlock:** Upload PDF terkunci, masukkan password, download PDF tanpa enkripsi.
   - **Tech:** `pdf-lib` encryption API.

5. **Text to PDF**
   - **Input:** Textarea besar atau upload file `.txt`.
   - **Controls:** Pilih font, ukuran, margin, header/footer teks.
   - **Output:** PDF yang rapi dengan teks terformat.
   - **Tech:** `pdf-lib` + `fontkit` untuk custom font.

### Kategori 11: Advanced Image Operations
1. **Image Resize** ⭐ (High Traffic)
   - **Input:** Upload gambar.
   - **Controls:** Input width/height (px), persentase, atau preset (Instagram post, story, YouTube thumbnail, passport photo). Checkbox "Maintain aspect ratio".
   - **Output:** Preview + download.
   - **Tech:** Canvas API `drawImage` dengan smoothing.

2. **Image Rotate & Flip**
   - **Input:** Upload gambar.
   - **Controls:** Rotasi 90°/180°/270°, flip horizontal/vertical, atau slider rotasi bebas (0-360°).
   - **Output:** Preview + download.
   - **Tech:** Canvas API `transform`.

3. **Image Crop Circle**
   - **Input:** Upload gambar.
   - **Controls:** Slider ukuran lingkaran, posisi x/y.
   - **Output:** Gambar bulat dengan background transparan (PNG).
   - **Tech:** Canvas API `arc()` + `clip()`.

4. **Image Merge (Collage)**
   - **Input:** Upload 2-9 gambar.
   - **Controls:** Pilih layout grid (2x2, 3x3, horizontal strip, vertical strip), gap size, background color.
   - **Output:** Satu gambar gabungan.
   - **Tech:** Canvas API dengan multiple `drawImage`.

5. **Photo Signature Resize**
   - **Input:** Upload foto tanda tangan.
   - **Controls:** Preset ukuran (2x2 cm, 3.5x4.5 cm, 300x300 px), DPI (72/150/300), background (putih/transparan).
   - **Output:** Gambar siap upload untuk formulir online.
   - **Tech:** Canvas API + `browser-image-compression`.

### Kategori 12: GIF & ZIP Tools
1. **Images to GIF**
   - **Input:** Upload multiple gambar.
   - **Controls:** Urutan (drag-drop), delay per frame (ms), ukuran output, loop (infinite/sekali).
   - **Output:** Preview animasi + download `.gif`.
   - **Tech:** `gif.js` di Web Worker.

2. **GIF to Images**
   - **Input:** Upload file `.gif`.
   - **Processing:** Parse semua frame, tampilkan dalam grid.
   - **Output:** Download semua frame sebagai ZIP atau individual PNG.
   - **Tech:** `gifuct-js` + Canvas API.

3. **ZIP Maker**
   - **Input:** Upload multiple file (gambar, PDF, teks, dll).
   - **Controls:** Rename file di dalam ZIP, pilih level kompresi.
   - **Output:** Download `.zip`.
   - **Tech:** `jszip` + `file-saver`.

4. **ZIP Extractor**
   - **Input:** Upload file `.zip`.
   - **Processing:** Parse isi ZIP, tampilkan daftar file dengan ukuran.
   - **Output:** Download individual file atau "Extract All".
   - **Tech:** `jszip`.

### Kategori 13: Utility Tools
1. **Barcode Generator**
   - **Input:** Text/angka input.
   - **Controls:** Pilih format (Code128, EAN-13, UPC-A, QR Code, Code39, ITF, dll), ukuran, warna, tampilkan teks di bawah.
   - **Output:** Preview barcode + download PNG/SVG.
   - **Tech:** `jsbarcode` atau `bwip-js`.

---

## 5. STEP-BY-STEP EXECUTION PHASES (LANJUTAN)

### FASE 13: PDF Power Tools (High Traffic)
Fokus pada tools PDF yang paling sering dicari dan feasible client-side.
- [ ] Implementasi **Organize PDF** (thumbnail grid + drag-drop reorder + `pdf-lib`).
- [ ] Implementasi **Add Page Number** (kontrol posisi & format).
- [ ] Implementasi **Protect PDF / Unlock PDF** (enkripsi/dekripsi dengan `pdf-lib`).
- [ ] Implementasi **Text to PDF** (textarea → PDF terformat).

### FASE 14: Image Mastery (Canvas API)
Fokus pada manipulasi gambar menggunakan Canvas API native.
- [ ] Implementasi **Image Resize** (dengan preset dimensi populer).
- [ ] Implementasi **Image Rotate & Flip** (slider + preset sudut).
- [ ] Implementasi **Image Crop Circle** (untuk foto profil).
- [ ] Implementasi **Image Merge / Collage** (grid layout).
- [ ] Implementasi **Photo Signature Resize** (preset ukuran pas foto).

### FASE 15: GIF, ZIP & Barcode (Utility)
Fokus pada tools utilitas yang melengkapi ekosistem.
- [ ] Implementasi **Images to GIF** (setup `gif.js` di Web Worker).
- [ ] Implementasi **GIF to Images** (parse frame dengan `gifuct-js`).
- [ ] Implementasi **ZIP Maker & Extractor** (UI file manager sederhana).
- [ ] Implementasi **Barcode Generator** (multi-format dengan `jsbarcode`).