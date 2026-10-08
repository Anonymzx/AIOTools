# 🚀 AIOTools - planning6.md (Phase 6: Complete Feature Parity & New Utilities)

## 1. STATUS & TUJUAN
**Dokumen Ini:** Ekstensi dari `planning.md`, `planning2.md`, `planning3.md`, `planning4.md`, dan `planning5.md` (Fase 1-17 diasumsikan selesai).
**Tujuan Fase 6:** 
1. Menutup gap fitur yang tersisa dari kompetitor (iLovePDF, Smallpdf, Sejda, ILoveIMG)
2. Menambahkan **40+ utility tools baru** yang high-traffic dan high-retention
3. Implementasi fitur platform (PWA, BYOK AI, Enhanced Cmd+K)
4. Mencapai **60+ tools** yang fully functional dan 100% client-side
5. Final polish untuk SEO, performance, dan user experience

**Prinsip Kunci:** 
- Tetap 100% client-side (kecuali BYOK AI yang optional)
- Zero server cost untuk semua tools core
- Premium UX dengan animasi yang sudah diimplementasi di Fase UI-1 sampai UI-4
- Konsistensi desain di semua tools baru

---

## 2. INVENTARIS LENGKAP: SUDAH ADA vs BELUM ADA

### ✅ SUDAH ADA (47 Tools - Fase 1-17)

**PDF Tools (20):**
| No | Tool | Fase |
|----|------|------|
| 1 | Merge PDF | 1 |
| 2 | Split PDF | 4 |
| 3 | Compress PDF | 1 |
| 4 | Rotate PDF | 3 |
| 5 | PDF to Image | 1 |
| 6 | Image to PDF | 4 |
| 7 | Organize PDF | 4 |
| 8 | Extract PDF Pages | 4 |
| 9 | Add Page Number | 4 |
| 10 | Protect PDF | 4 |
| 11 | Unlock PDF | 4 |
| 12 | Text to PDF | 4 |
| 13 | Scan to PDF | 5 |
| 14 | Sign PDF | 5 |
| 15 | Redact PDF | 5 |
| 16 | Compare PDF | 5 |
| 17 | OCR PDF | 5 |
| 18 | Repair PDF | 5 |
| 19 | PDF Metadata Editor | 5 |
| 20 | PDF Page Counter | 5 |

**Image Tools (13):**
| No | Tool | Fase |
|----|------|------|
| 1 | Compress Image | 1 |
| 2 | Convert Image | 1 |
| 3 | HEIC to JPG | 3 |
| 4 | Image Crop | 3 |
| 5 | Image Resize | 4 |
| 6 | Image Rotate | 4 |
| 7 | Image Watermark | 3 |
| 8 | Image Crop Circle | 4 |
| 9 | Image Merge (Collage) | 4 |
| 10 | Photo Signature Resize | 4 |
| 11 | AI Background Remover | 2 |
| 12 | Images to GIF | 4 |
| 13 | GIF to Images | 4 |

**Text & Developer Tools (12):**
| No | Tool | Fase |
|----|------|------|
| 1 | Case Converter | 1 |
| 2 | JSON Formatter | 1 |
| 3 | Hash Generator | 1 |
| 4 | QR Code Generator | 1 |
| 5 | Regex Tester | 2 |
| 6 | JWT Decoder | 2 |
| 7 | Base64 Encoder/Decoder | 3 |
| 8 | Word Counter | 3 |
| 9 | Password Generator | 3 |
| 10 | Barcode Generator | 4 |
| 11 | Color Extractor | 3 |
| 12 | Screen Recorder | 3 |

**Utility Tools (2):**
| No | Tool | Fase |
|----|------|------|
| 1 | ZIP Maker | 4 |
| 2 | ZIP Extractor | 4 |

---

### ❌ BELUM ADA - Dari Kompetitor (Butuh Server/API - Out of Scope)

| Tool | Alasan | Alternatif yang Ditampilkan ke User |
|------|--------|-------------------------------------|
| WORD ke PDF | Butuh LibreOffice server | "Gunakan Google Docs → Download as PDF" |
| PDF ke WORD | Format DOCX kompleks | "Gunakan Google Docs → Upload PDF" |
| POWERPOINT ke PDF | Format PPTX proprietary | "Gunakan Google Slides → Download as PDF" |
| PDF ke POWERPOINT | Sama seperti di atas | "Gunakan Google Slides" |
| EXCEL ke PDF | Format XLSX dengan formula | "Gunakan Google Sheets → Download as PDF" |
| PDF ke EXCEL | Sama seperti di atas | "Gunakan Google Sheets" |
| HTML ke PDF | Butuh headless browser | "Gunakan Ctrl+P → Save as PDF" |
| PDF ke PDF/A | Butuh validasi ISO 19005 | "Gunakan Adobe Acrobat Desktop" |
| Edit PDF (Full Editor) | Butuh PDF rendering engine kompleks | "Gunakan Adobe Acrobat Online" |
| Formulir PDF (Fill Forms) | Format AcroForm kompleks | Partial support dengan `pdf-lib` |
| PDF ke EPUB/MOBI | Struktur kompleks | "Gunakan Calibre Desktop" |
| eBook ke PDF (EPUB/MOBI) | Format proprietary | "Gunakan Calibre Desktop" |
| Vector Converter (AI/EPS) | Format proprietary | "Gunakan Inkscape Desktop" |
| CAD Converter (DWG/DXF) | Butuh library sangat berat | "Gunakan AutoCAD Desktop" |

---

### 🆕 BELUM ADA - Utility Tools Baru (High Traffic - Akan Ditambahkan)

**Kategori A: Calculators & Converters (Traffic Harian Sangat Tinggi)**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 1 | Unit Converter | 🔥🔥 | 🟢 Rendah |
| 2 | Date Calculator | 🔥🔥 | 🟢 Rendah |
| 3 | Age Calculator | 🔥🔥 | 🟢 Rendah |
| 4 | BMI Calculator | 🔥🔥 | 🟢 Rendah |
| 5 | Loan/EMI Calculator | 🔥🔥 | 🟡 Sedang |
| 6 | Percentage Calculator | 🔥🔥 | 🟢 Rendah |
| 7 | Tip Calculator | 🔥 | 🟢 Rendah |
| 8 | Discount Calculator | 🔥 | 🟢 Rendah |
| 9 | Time Zone Converter | 🔥 | 🟡 Sedang |

**Kategori B: Developer Utilities (Retention Sangat Tinggi)**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 10 | Unix Timestamp Converter | 🔥 | 🟢 Rendah |
| 11 | UUID Generator | 🔥🔥 | 🟢 Rendah |
| 12 | Lorem Ipsum Generator | 🔥🔥 |  Rendah |
| 13 | Markdown to HTML | 🔥🔥🔥 |  Sedang |
| 14 | HTML to Markdown | 🔥🔥 | 🟡 Sedang |
| 15 | CSS Minifier/Beautifier | 🔥🔥 | 🟡 Sedang |
| 16 | JavaScript Minifier/Beautifier | 🔥 | 🟡 Sedang |
| 17 | SQL Formatter | 🔥🔥 | 🟢 Rendah |
| 18 | XML Formatter | 🔥 | 🟢 Rendah |
| 19 | YAML Formatter |  | 🟢 Rendah |
| 20 | CSV to JSON | 🔥🔥 | 🟡 Sedang |
| 21 | JSON to CSV | 🔥🔥🔥 | 🟡 Sedang |
| 22 | URL Encoder/Decoder | 🔥🔥 | 🟢 Rendah |
| 23 | HTML Encoder/Decoder |  | 🟢 Rendah |
| 24 | Text to Slug | 🔥 | 🟢 Rendah |
| 25 | Remove Duplicate Lines | 🔥 | 🟢 Rendah |
| 26 | Sort Lines | 🔥 | 🟢 Rendah |
| 27 | Find and Replace | 🔥🔥 | 🟢 Rendah |
| 28 | Text Diff Checker | 🔥 | 🟡 Sedang |

**Kategori C: Design & Creative Tools (Viral Potential)**
| No | Tool | Estimasi Traffic | Kompleksitas |
|----|------|------------------|--------------|
| 29 | Favicon Generator | 🔥🔥 | 🟡 Sedang |
| 30 | Social Media Image Resizer | 🔥🔥🔥 | 🟢 Rendah |
| 31 | Meme Generator | 🔥🔥🔥 |  Sedang |
| 32 | Image to ASCII Art | 🔥 | 🟡 Sedang |
| 33 | Color Palette Generator | 🔥🔥 | 🟡 Sedang |
| 34 | Gradient Generator | 🔥🔥 | 🟢 Rendah |
| 35 | Box Shadow Generator | 🔥 | 🟢 Rendah |
| 36 | CSS Grid Generator | 🔥 | 🟡 Sedang |
| 37 | Flexbox Generator | 🔥 | 🟡 Sedang |
| 38 | SVG to PNG | 🔥 | 🟢 Rendah |
| 39 | Code Screenshot (Carbon-like) | 🔥🔥🔥 | 🔴 Tinggi |

**Kategori D: Platform Features (Premium Feel)**
| No | Fitur | Kompleksitas |
|----|-------|--------------|
| 40 | PWA (Progressive Web App) |  Sedang |
| 41 | BYOK AI: PDF Summarizer | 🔴 Tinggi |
| 42 | BYOK AI: PDF Translator | 🔴 Tinggi |
| 43 | Enhanced Cmd+K (dengan Actions) | 🟡 Sedang |
| 44 | Batch Processing Queue | 🔴 Tinggi |

---

## 3. PENAMBAHAN TECH STACK & DEPENDENCIES

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "currency.js": "^2.0.4",
    "marked": "^12.0.0",
    "turndown": "^7.1.2",
    "clean-css": "^5.3.3",
    "prettier": "^3.2.0",
    "sql-formatter": "^15.0.0",
    "js-yaml": "^4.1.0",
    "papaparse": "^5.4.1",
    "uuid": "^9.0.0",
    "lorem-ipsum": "^2.0.8",
    "react-select": "^5.8.0",
    "html-to-image": "^1.11.11",
    "prismjs": "^1.29.0",
    "recharts": "^2.12.0",
    "next-pwa": "^5.6.0",
    "cmdk": "^0.2.0"
  }
}
```

**Catatan Dependencies:**
- `date-fns`: Tree-shakeable, hanya import fungsi yang dibutuhkan
- `prettier`: Bundle size besar (~3MB), harus di-lazy load
- `recharts`: Untuk visualisasi chart di Loan Calculator
- `next-pwa`: Untuk PWA support
- `cmdk`: Untuk enhanced Command Palette

---

## 4. TOOL SPECIFICATIONS (SCOPE EXPANSION)

### Kategori A: Calculators & Converters

#### 1. Unit Converter ⭐ (Daily Use - High Traffic)
**Deskripsi:** Konversi satuan panjang, berat, suhu, volume, area, kecepatan, waktu, dan data digital.

**Input:**
- Input angka (dengan decimal support)
- Dropdown kategori (Length, Weight, Temperature, Volume, Area, Speed, Time, Data)
- Dropdown unit asal (auto-populate berdasarkan kategori)
- Dropdown unit tujuan

**Output:**
- Hasil konversi real-time (6 desimal)
- Formula yang digunakan (educational)
- Reverse conversion button

**Tech:** Custom conversion logic (tidak butuh library berat)
**UX Premium:** 
- Swap button untuk tukar unit asal dan tujuan
- History 5 konversi terakhir (localStorage)
- Favorite units (localStorage)
- Keyboard shortcuts (Enter untuk convert)

**Conversion Categories:**
- Length: mm, cm, m, km, inch, ft, yard, mile
- Weight: mg, g, kg, oz, lb, ton
- Temperature: Celsius, Fahrenheit, Kelvin
- Volume: ml, L, gallon, cup, pint, quart
- Area: mm², cm², m², km², ft², acre, hectare
- Speed: m/s, km/h, mph, knot
- Time: ms, s, min, hour, day, week, month, year
- Data: bit, byte, KB, MB, GB, TB, PB

---

#### 2. Date Calculator ⭐ (Business Use)
**Deskripsi:** Hitung selisih antara dua tanggal atau tambah/kurangi hari dari tanggal tertentu.

**Tab 1: Days Between**
- Input: Date picker untuk tanggal awal dan akhir
- Output: Jumlah hari, minggu, bulan, tahun
- Bonus: Jumlah hari kerja (exclude weekends)

**Tab 2: Add/Subtract Days**
- Input: Date picker untuk tanggal awal
- Input: Number input untuk jumlah hari (+/-)
- Output: Tanggal hasil dengan detail hari

**Tech:** `date-fns` untuk perhitungan akurat (handle leap year, DST)
**UX Premium:**
- Calendar picker dengan visual yang jelas
- Preset buttons (Today, Tomorrow, Next Week, Next Month)
- Copy result button

---

#### 3. Age Calculator
**Deskripsi:** Hitung umur exact dari tanggal lahir dengan detail lengkap.

**Input:**
- Date picker untuk tanggal lahir
- Optional: Time picker untuk waktu lahir (untuk akurasi jam)

**Output:**
- Umur dalam tahun, bulan, hari
- Total hari hidup
- Total jam, menit, detik (live update setiap detik)
- Hari lahir (Senin, Selasa, dll)
- Next birthday countdown (hari, jam, menit)
- Zodiac sign (Western & Chinese)

**Tech:** `date-fns` + custom calculation
**UX Premium:**
- Live countdown yang update real-time
- Fun facts (jumlah kali jantung berdetak, jumlah napas, dll)
- Share button untuk share hasil

---

#### 4. BMI Calculator
**Deskripsi:** Hitung Body Mass Index dengan kategori kesehatan.

**Input:**
- Weight: Input dengan unit toggle (kg/lb)
- Height: Input dengan unit toggle (cm/ft+in)
- Optional: Age, Gender (untuk kategori yang lebih akurat)

**Output:**
- BMI number (1 desimal)
- Kategori: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (≥30)
- Visual gauge meter dengan color coding
- Healthy weight range untuk tinggi user
- Tips kesehatan berdasarkan kategori

**Tech:** Custom BMI formula
**UX Premium:**
- Animated gauge meter yang move ke hasil
- Color-coded result (biru=underweight, hijau=normal, kuning=overweight, merah=obese)
- Disclaimer medis

---

#### 5. Loan/EMI Calculator
**Deskripsi:** Hitung cicilan bulanan dengan tabel amortisasi lengkap.

**Input:**
- Principal amount (jumlah pinjaman)
- Interest rate (% per tahun)
- Loan tenure (tahun/bulan)
- Optional: Down payment, Processing fee

**Output:**
- Monthly EMI
- Total interest payable
- Total payment (principal + interest)
- Amortization table (bulan per bulan)
- Chart: Principal vs Interest breakdown

**Tech:** Custom EMI formula + `recharts` untuk visualisasi
**Formula:** EMI = [P × R × (1+R)^N] / [(1+R)^N-1]
**UX Premium:**
- Interactive chart (pie chart untuk breakdown)
- Download amortization table sebagai CSV
- Slider input untuk quick adjustment

---

#### 6-9. Quick Calculators (Percentage, Tip, Discount, Time Zone)
**Percentage Calculator:**
- X% of Y = ?
- X is what % of Y?
- Percentage change from X to Y

**Tip Calculator:**
- Bill amount, tip %, number of people
- Output: Tip per person, total per person

**Discount Calculator:**
- Original price, discount %
- Output: Final price, amount saved
- Support multiple discounts (stacked)

**Time Zone Converter:**
- Input: Date, time, source timezone
- Output: Converted time di multiple timezones
- Visual: World clock dengan map

---

### Kategori B: Developer Utilities

#### 10. Unix Timestamp Converter
**Deskripsi:** Convert Unix timestamp ke human-readable date dan sebaliknya.

**Tab 1: Timestamp to Date**
- Input: Unix timestamp (seconds atau milliseconds)
- Output: Human-readable date (multiple formats)
- Bonus: Relative time ("2 hours ago")

**Tab 2: Date to Timestamp**
- Input: Date picker atau manual input
- Output: Unix timestamp (seconds dan milliseconds)

**Bonus Section:**
- Current timestamp dengan auto-refresh setiap detik
- Quick copy buttons

**Tech:** Native JavaScript `Date` object
**UX Premium:**
- Auto-detect seconds vs milliseconds
- Multiple output formats (ISO 8601, RFC 2822, custom)

---

#### 11. UUID Generator
**Deskripsi:** Generate UUID v4 untuk development dan testing.

**Input:**
- Button "Generate"
- Number input: Jumlah UUID (1-100, default 1)
- Checkbox: Uppercase, lowercase, with/without hyphens

**Output:**
- List UUID dengan monospace font
- Copy individual button per UUID
- Copy all button
- Download as TXT/JSON

**Tech:** `crypto.randomUUID()` (native) atau `uuid` library
**UX Premium:**
- Bulk generation dengan progress
- History UUID yang pernah di-generate (session)

---

#### 12. Lorem Ipsum Generator
**Deskripsi:** Generate placeholder text untuk design dan development.

**Input:**
- Type selector: Paragraphs, Sentences, Words, Lists
- Number input: Jumlah (1-100)
- Checkbox: Start with "Lorem ipsum dolor sit amet..."
- Checkbox: Add HTML tags (<p>, <li>)

**Output:**
- Generated text dengan formatting
- Copy button
- Preview dengan styling

**Tech:** `lorem-ipsum` library atau custom word list
**UX Premium:**
- Live preview saat parameter berubah
- Multiple language support (Latin, English, Indonesian)

---

#### 13. Markdown to HTML
**Deskripsi:** Convert Markdown ke HTML dengan live preview.

**Input:**
- Textarea untuk Markdown input
- Toolbar: Bold, Italic, Heading, Link, Image, List, Code

**Output:**
- Live preview HTML (rendered)
- Raw HTML code (dengan syntax highlighting)
- Copy HTML button

**Tech:** `marked` library
**UX Premium:**
- Split view (Markdown kiri, Preview kanan)
- Sync scroll antara editor dan preview
- Export as HTML file

---

#### 14. HTML to Markdown
**Deskripsi:** Convert HTML ke Markdown.

**Input:**
- Textarea untuk HTML input
- Optional: URL input (fetch HTML dari website)

**Output:**
- Markdown text
- Copy button
- Download as .md file

**Tech:** `turndown` library
**UX Premium:**
- Preview Markdown yang di-convert
- Options: Heading style, bullet style, code block style

---

#### 15-16. CSS/JS Minifier & Beautifier
**Deskripsi:** Minify atau beautify CSS dan JavaScript code.

**Input:**
- Textarea untuk code input
- Toggle: Minify / Beautify
- Options: Indent size, quote style, semicolons

**Output:**
- Result code dengan syntax highlighting
- Before/after file size comparison
- Copy button
- Download button

**Tech:** `clean-css` untuk CSS, `prettier` untuk JS
**UX Premium:**
- Lazy load `prettier` (bundle besar)
- Error highlighting jika code invalid
- Format on paste option

---

#### 17-19. Code Formatters (SQL, XML, YAML)
**SQL Formatter:**
- Input: SQL query berantakan
- Output: Formatted SQL dengan indentation
- Tech: `sql-formatter` library
- Support: MySQL, PostgreSQL, SQL Server, Oracle

**XML Formatter:**
- Input: XML string
- Output: Formatted XML dengan syntax highlighting
- Validation: Check jika XML valid
- Tech: Native DOMParser

**YAML Formatter:**
- Input: YAML string
- Output: Formatted YAML
- Validation: Check jika YAML valid
- Tech: `js-yaml` library

---

#### 20-21. CSV ↔ JSON Converter
**Deskripsi:** Convert antara CSV dan JSON dengan preview table.

**CSV to JSON:**
- Input: CSV text atau upload .csv file
- Options: Delimiter (comma, semicolon, tab), quote character
- Output: JSON array of objects
- Preview: Table view dengan sorting

**JSON to CSV:**
- Input: JSON text atau upload .json file
- Options: Flatten nested objects, array handling
- Output: CSV text
- Preview: Table view

**Tech:** `papaparse` untuk CSV, native JSON untuk JSON
**UX Premium:**
- Drag & drop file upload
- Large file handling (chunk processing)
- Column mapping untuk nested JSON

---

#### 22-28. Text Utilities
**URL Encoder/Decoder:** Encode/decode URL components
**HTML Encoder/Decoder:** Encode/decode HTML entities (&, <, >, ", ')
**Text to Slug:** Convert text ke URL-friendly slug (lowercase, replace spaces dengan hyphen)
**Remove Duplicate Lines:** Hapus baris duplikat dari text (case-sensitive/insensitive)
**Sort Lines:** Sort baris alphabetically/numerically (ascending/descending)
**Find and Replace:** Text search and replace dengan regex support
**Text Diff Checker:** Bandingkan 2 teks dan highlight perbedaan (side-by-side view)

**Tech:** Native JavaScript + custom logic
**UX Premium:**
- Line numbers untuk semua text utilities
- Keyboard shortcuts (Ctrl+F untuk find)
- Export result sebagai file

---

### Kategori C: Design & Creative Tools

#### 29. Favicon Generator
**Deskripsi:** Generate favicon.ico dan apple-touch-icon dari gambar.

**Input:**
- Upload gambar (PNG, JPG, SVG)
- Crop tool untuk pilih area

**Output:**
- favicon.ico (16x16, 32x32, 48x48)
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest
- HTML code snippet untuk implementasi

**Tech:** Canvas API untuk resize + `jszip` untuk download semua
**UX Premium:**
- Preview favicon di mockup browser tab
- Download semua sebagai ZIP

---

#### 30. Social Media Image Resizer
**Deskripsi:** Resize gambar untuk berbagai platform social media.

**Input:**
- Upload gambar
- Pilih platform dan ukuran

**Presets:**
- Instagram: Post (1080x1080), Story (1080x1920), Reel (1080x1920)
- Facebook: Post (1200x630), Cover (820x312), Profile (170x170)
- Twitter/X: Post (1600x900), Header (1500x500), Profile (400x400)
- LinkedIn: Post (1200x627), Cover (1584x396), Profile (400x400)
- YouTube: Thumbnail (1280x720), Banner (2560x1440)
- TikTok: Video (1080x1920)

**Output:**
- Preview dengan aspect ratio overlay
- Download resized image

**Tech:** Canvas API dengan `drawImage`
**UX Premium:**
- Smart crop (focus on center atau face detection)
- Batch resize untuk multiple images

---

#### 31. Meme Generator
**Deskripsi:** Buat meme dengan teks atas dan bawah.

**Input:**
- Upload gambar atau pilih template populer (Drake, Distracted Boyfriend, dll)
- Text atas (input)
- Text bawah (input)

**Controls:**
- Font size slider
- Font color picker
- Stroke color dan size
- Text position (drag untuk move)

**Output:**
- Live preview meme
- Download PNG

**Tech:** Canvas API untuk render text over image
**UX Premium:**
- Template gallery dengan search
- Drag text untuk posisi custom
- Auto text wrapping

---

#### 32. Image to ASCII Art
**Deskripsi:** Convert gambar ke ASCII art text.

**Input:**
- Upload gambar
- Output width (characters)
- Character set (simple, detailed, blocks)
- Color mode (grayscale, colored)

**Output:**
- ASCII art text (monospace font)
- Copy text button
- Download as TXT atau HTML (dengan color)

**Tech:** Canvas API untuk read pixels + custom mapping algorithm
**UX Premium:**
- Real-time preview saat parameter berubah
- Zoom in/out untuk detail

---

#### 33. Color Palette Generator
**Deskripsi:** Generate color palette dari warna base atau gambar.

**Mode 1: From Color**
- Input: Base color (color picker atau hex input)
- Output: Complementary, analogous, triadic, tetradic palettes
- Rules: Monochromatic, complementary, split-complementary

**Mode 2: From Image**
- Input: Upload gambar
- Output: 5-10 warna dominan dari gambar
- Tech: Canvas API + k-means clustering algorithm

**Output:**
- Color swatches dengan hex, RGB, HSL values
- Copy individual color atau export palette (ASE, JSON, CSS)
- Preview palette dalam UI mockup

**UX Premium:**
- Lock color untuk fix saat generate ulang
- Export ke Adobe Swatch Exchange (ASE)

---

#### 34. Gradient Generator
**Deskripsi:** Visual gradient builder dengan CSS output.

**Input:**
- 2-5 color stops (color picker)
- Direction: Linear (angle) atau Radial
- Angle slider (0-360°)
- Color stop positions (drag)

**Output:**
- Live preview gradient (full screen atau box)
- CSS code output (linear-gradient, radial-gradient)
- Copy CSS button

**Tech:** CSS gradient dengan dynamic updates
**UX Premium:**
- Drag color stops pada gradient bar
- Random gradient button
- Preset gradients (Instagram, Facebook, dll)
- Export sebagai gambar PNG

---

#### 35. Box Shadow Generator
**Deskripsi:** Visual box-shadow builder dengan CSS output.

**Input:**
- Offset X slider (-50 to 50px)
- Offset Y slider (-50 to 50px)
- Blur radius slider (0-100px)
- Spread radius slider (-50 to 50px)
- Color picker
- Opacity slider
- Inset checkbox

**Output:**
- Live preview box dengan shadow
- CSS code output
- Multiple shadows support (add more shadows)
- Copy CSS button

**Tech:** CSS box-shadow dynamic
**UX Premium:**
- Drag shadow untuk adjust offset
- Preset shadows (subtle, elevated, dramatic)
- Copy individual shadow atau all shadows

---

#### 36-37. CSS Grid & Flexbox Generators
**CSS Grid Generator:**
- Input: Columns, rows, gaps, column sizes, row sizes
- Output: Visual grid preview + CSS code
- Tech: CSS Grid dengan dynamic updates

**Flexbox Generator:**
- Input: Direction, wrap, justify-content, align-items, align-content, gap
- Output: Visual flexbox preview + CSS code
- Tech: CSS Flexbox dengan dynamic updates

**UX Premium:**
- Interactive visual editor (click untuk add items)
- Copy CSS button
- Preset layouts

---

#### 38. SVG to PNG
**Deskripsi:** Convert SVG ke PNG dengan custom size.

**Input:**
- Upload SVG file atau paste SVG code
- Output size (width, height)
- Background color (transparent atau solid)
- Scale factor (1x, 2x, 3x, 4x)

**Output:**
- Preview PNG
- Download PNG

**Tech:** Canvas API + Image object untuk render SVG
**UX Premium:**
- Live preview saat parameter berubah
- Batch convert untuk multiple SVGs

---

#### 39. Code Screenshot (Carbon-like) 🔴 (Complex)
**Deskripsi:** Beautify code dengan syntax highlighting untuk screenshot.

**Input:**
- Paste code atau upload file
- Language selector (untuk syntax highlighting)
- Theme selector (Dracula, Monokai, GitHub Light, dll)
- Font selector (Fira Code, JetBrains Mono, etc)
- Font size slider
- Background color atau gradient
- Padding slider
- Window controls (macOS style checkboxes)
- Drop shadow toggle

**Output:**
- Beautiful code screenshot
- Download PNG atau SVG
- Copy image button

**Tech:** `prismjs` untuk syntax highlighting + `html-to-image` untuk export
**UX Premium:**
- Live preview saat parameter berubah
- Aspect ratio presets (16:9, 4:3, 1:1)
- Export dengan transparent background

---

### Kategori D: Platform Features

#### 40. PWA (Progressive Web App)
**Features:**
- Installable di desktop dan mobile
- Offline support untuk Text & Developer tools
- Splash screen dengan logo AIOTools
- Service worker untuk caching aset statis
- Add to Home Screen prompt

**Tech:** `next-pwa` atau native Next.js PWA config
**UX Premium:**
- "Install App" button di header (muncul jika belum install)
- Offline indicator (badge di corner)
- Cache management UI (clear cache button)

---

#### 41-42. BYOK AI Features (Bring Your Own Key)
**PDF Summarizer:**
- Input: Upload PDF + OpenAI API key
- Processing: Extract text → Send to GPT-4 → Get summary
- Output: Summary dalam berbagai panjang (short, medium, long)
- Tech: OpenAI API (user-provided key)
- UX: API key encrypt di localStorage, warning tentang biaya API

**PDF Translator:**
- Input: Upload PDF + API key + target language
- Processing: Extract text → Send to translation API → Get translation
- Output: Translated text atau PDF dengan text layer
- Tech: OpenAI API atau DeepL API (user-provided key)
- UX: Language selector dengan 50+ bahasa

**Security:**
- API key di-encrypt dengan Web Crypto API sebelum simpan di localStorage
- Option untuk clear API key
- Warning: "API key disimpan lokal di browser Anda"
- Rate limiting client-side untuk cegah accidental high usage

---

#### 43. Enhanced Cmd+K (dengan Actions)
**Features:**
- Navigation: "Go to [Tool Name]"
- Actions: "Toggle Dark Mode", "Clear All Inputs", "Download Result"
- Direct Tool: "Paste from Clipboard" (langsung paste dan proses)
- Recent Tools: Tampilkan 5 tools terakhir yang digunakan
- Search: Fuzzy search untuk semua tools

**Tech:** `cmdk` library dengan custom actions
**UX Premium:**
- Keyboard shortcuts untuk setiap action
- History navigation (arrow keys)
- Preview tool description saat hover

---

#### 44. Batch Processing Queue
**Features:**
- Upload multiple files (10-100 files)
- Queue management: Pause, resume, cancel individual files
- Progress per file dan overall progress
- Download individual atau all as ZIP
- Error handling per file (skip failed, continue others)

**Tech:** Zustand store untuk queue management + Web Workers untuk processing
**UX Premium:**
- Drag-drop untuk reorder queue
- Priority setting (high/normal/low)
- Auto-retry untuk failed files
- Notification saat semua selesai

---

## 5. STEP-BY-STEP EXECUTION PHASES (LANJUTAN)

### FASE 18: Calculators & Converters (Quick Wins - 1 Week)
Fokus pada tools yang cepat diimplementasikan dan traffic harian tinggi.

**Deliverables:**
- [ ] Implementasi **Unit Converter** (8 categories, 50+ units)
- [ ] Implementasi **Date Calculator** (2 tabs: days between, add/subtract)
- [ ] Implementasi **Age Calculator** (dengan live countdown)
- [ ] Implementasi **BMI Calculator** (dengan visual gauge)
- [ ] Implementasi **Loan/EMI Calculator** (dengan amortization table & chart)
- [ ] Implementasi **Percentage Calculator** (3 modes)
- [ ] Implementasi **Tip Calculator** (dengan split bill)
- [ ] Implementasi **Discount Calculator** (support stacked discounts)
- [ ] Implementasi **Time Zone Converter** (dengan world clock)

**Dependencies:** `date-fns`, `currency.js`, `recharts`

---

### FASE 19: Developer Utilities (High Retention - 1.5 Weeks)
Fokus pada tools yang membuat developer kembali lagi.

**Deliverables:**
- [ ] Implementasi **Unix Timestamp Converter** (2 tabs + current timestamp)
- [ ] Implementasi **UUID Generator** (bulk generation)
- [ ] Implementasi **Lorem Ipsum Generator** (multiple types)
- [ ] Implementasi **Markdown to HTML** (dengan live preview split view)
- [ ] Implementasi **HTML to Markdown** (dengan turndown)
- [ ] Implementasi **CSS Minifier/Beautifier** (dengan clean-css)
- [ ] Implementasi **JavaScript Minifier/Beautifier** (dengan prettier, lazy load)
- [ ] Implementasi **SQL Formatter** (dengan sql-formatter)
- [ ] Implementasi **XML Formatter** (dengan validation)
- [ ] Implementasi **YAML Formatter** (dengan js-yaml)
- [ ] Implementasi **CSV to JSON** (dengan papaparse + table preview)
- [ ] Implementasi **JSON to CSV** (dengan nested object handling)
- [ ] Implementasi **URL Encoder/Decoder**
- [ ] Implementasi **HTML Encoder/Decoder**
- [ ] Implementasi **Text to Slug**
- [ ] Implementasi **Remove Duplicate Lines**
- [ ] Implementasi **Sort Lines**
- [ ] Implementasi **Find and Replace** (dengan regex)
- [ ] Implementasi **Text Diff Checker** (side-by-side view)

**Dependencies:** `marked`, `turndown`, `clean-css`, `prettier`, `sql-formatter`, `js-yaml`, `papaparse`, `uuid`, `lorem-ipsum`

---

### FASE 20: Design & Creative Tools (Visual Appeal - 1.5 Weeks)
Fokus pada tools yang menarik secara visual dan viral potential.

**Deliverables:**
- [ ] Implementasi **Favicon Generator** (multi-size export)
- [ ] Implementasi **Social Media Image Resizer** (20+ presets)
- [ ] Implementasi **Meme Generator** (dengan template gallery)
- [ ] Implementasi **Image to ASCII Art** (dengan color mode)
- [ ] Implementasi **Color Palette Generator** (from color + from image)
- [ ] Implementasi **Gradient Generator** (linear & radial)
- [ ] Implementasi **Box Shadow Generator** (multiple shadows)
- [ ] Implementasi **CSS Grid Generator** (visual editor)
- [ ] Implementasi **Flexbox Generator** (visual editor)
- [ ] Implementasi **SVG to PNG** (batch support)
- [ ] Implementasi **Code Screenshot** (Carbon-like, dengan prismjs)

**Dependencies:** `html-to-image`, `prismjs`

---

### FASE 21: Platform Features & AI (Advanced - 2 Weeks)
Fokus pada fitur platform dan integrasi AI.

**Deliverables:**
- [ ] Implementasi **PWA Setup** (manifest, service worker, offline support)
- [ ] Implementasi **BYOK AI: PDF Summarizer** (OpenAI API integration)
- [ ] Implementasi **BYOK AI: PDF Translator** (translation API)
- [ ] Implementasi **Enhanced Cmd+K** (dengan actions, bukan hanya navigation)
- [ ] Implementasi **Batch Processing Queue** (multi-file processing dengan progress)
- [ ] Implementasi **User Preferences** (theme, default settings per tool, localStorage)

**Dependencies:** `next-pwa`, `cmdk`

---

### FASE 22: SEO, Performance & Final Polish (1 Week)
Fokus pada optimization dan polish akhir.

**Deliverables:**
- [ ] Audit semua 60+ tools untuk konsistensi UI (spacing, colors, typography)
- [ ] Optimasi performance (lazy loading, code splitting, tree shaking)
- [ ] Tambahkan schema.org JSON-LD untuk semua tools (SoftwareApplication)
- [ ] Setup sitemap.xml dinamis (generate dari tools-config.ts)
- [ ] Setup robots.txt dengan proper directives
- [ ] Implementasi analytics (privacy-friendly: Plausible atau Fathom)
- [ ] Final testing checklist:
  - [ ] Mobile responsive (320px - 2560px)
  - [ ] Dark mode pixel-perfect di semua tools
  - [ ] Accessibility (WCAG 2.1 AA): keyboard navigation, screen reader, contrast
  - [ ] Performance: Lighthouse score >95
  - [ ] Browser compatibility: Chrome, Firefox, Safari, Edge
- [ ] Documentation:
  - [ ] README.md dengan feature list dan screenshots
  - [ ] Contribution guide
  - [ ] Changelog
  - [ ] Privacy policy (highlight client-side processing)

---

## 6. PRIORITISASI BERDASARKAN TRAFIK & KOMPLEKSITAS

### 🔥 Priority P0 (Implementasi Pertama - Traffic Tertinggi, Kompleksitas Rendah)
**Estimasi: 3-4 hari**
1. Unit Converter
2. Date Calculator
3. Age Calculator
4. BMI Calculator
5. Percentage Calculator
6. Tip Calculator
7. Discount Calculator
8. Unix Timestamp Converter
9. UUID Generator
10. Lorem Ipsum Generator
11. URL Encoder/Decoder
12. HTML Encoder/Decoder
13. Text to Slug
14. Remove Duplicate Lines
15. Sort Lines

---

### ⚡ Priority P1 (Implementasi Kedua - Retention Tinggi, Kompleksitas Sedang)
**Estimasi: 5-7 hari**
16. Loan/EMI Calculator
17. Time Zone Converter
18. Markdown to HTML
19. HTML to Markdown
20. CSS Minifier/Beautifier
21. JavaScript Minifier/Beautifier
22. SQL Formatter
23. XML/YAML Formatter
24. CSV to JSON / JSON to CSV
25. Find and Replace
26. Text Diff Checker
27. Gradient Generator
28. Box Shadow Generator
29. SVG to PNG
30. Social Media Image Resizer

---

###  Priority P2 (Implementasi Ketiga - Viral Potential, Kompleksitas Sedang-Tinggi)
**Estimasi: 5-7 hari**
31. Favicon Generator
32. Meme Generator
33. Image to ASCII Art
34. Color Palette Generator
35. CSS Grid Generator
36. Flexbox Generator
37. Code Screenshot (Carbon-like)
38. PWA Setup
39. Enhanced Cmd+K

---

### 🎯 Priority P3 (Implementasi Terakhir - Advanced Features)
**Estimasi: 7-10 hari**
40. BYOK AI: PDF Summarizer
41. BYOK AI: PDF Translator
42. Batch Processing Queue
43. User Preferences
44. Final SEO & Performance Polish

---

## 7. CATATAN PENTING: FITUR YANG TETAP OUT OF SCOPE

Fitur berikut **tidak akan diimplementasikan** karena membutuhkan infrastruktur server yang kompleks atau biaya tinggi:

| Fitur | Alasan | Rekomendasi untuk User |
|-------|--------|------------------------|
| WORD/EXCEL/PPT ke PDF | Butuh LibreOffice server atau Cloudflare Workers dengan WASM | "Gunakan Google Docs/Sheets/Slides → Download as PDF" |
| PDF ke WORD/EXCEL/PPT | Format kompleks dengan formatting preservation | "Gunakan Google Docs → Upload PDF" |
| PDF ke PDF/A | Butuh validasi ISO 19005 yang kompleks | "Gunakan Adobe Acrobat Desktop" |
| Full PDF Editor | Butuh PDF rendering engine seperti PDF.js dengan editing capabilities | "Gunakan Adobe Acrobat Online" |
| Vector/CAD Conversion | Format proprietary (AI, EPS, DWG, DXF) | "Gunakan Inkscape/AutoCAD Desktop" |
| Native AI Features (tanpa API key) | Butuh GPU server untuk inference | "Gunakan BYOK model dengan API key Anda" |
| HTML ke PDF | Butuh headless browser (Puppeteer/Playwright) | "Gunakan Ctrl+P → Save as PDF di browser" |
| PDF ke EPUB/MOBI | Struktur kompleks dengan metadata | "Gunakan Calibre Desktop" |

**Pesan untuk User:**
Untuk fitur-fitur di atas, AIOTools akan menampilkan pesan yang helpful:
> "Fitur ini membutuhkan pemrosesan server yang kompleks. Kami merekomendasikan [alternatif] untuk hasil terbaik. Semua tool lain di AIOTools 100% diproses di browser Anda dengan privasi maksimal."

---

## 8. PERFORMANCE & BUNDLE SIZE MANAGEMENT

Dengan 60+ tools, bundle size bisa membengkak. Strategi optimasi:

### Code Splitting Strategy:
```typescript
// 1. Lazy load semua tool pages
const UnitConverter = dynamic(() => import('@/app/tools/calculators/unit-converter'), {
  loading: () => <ToolSkeleton />,
  ssr: false,
});

// 2. Lazy load heavy dependencies
const prettier = dynamic(() => import('prettier'), {
  ssr: false,
});

// 3. Group tools by category untuk shared chunks
// tools/calculators/* → shared calculators chunk
// tools/developer/* → shared developer chunk
```

### Bundle Size Budget:
- **Initial load (Landing page):** <150KB gzipped
- **Per tool page:** <100KB gzipped (termasuk dependencies)
- **Heavy tools (OCR, Code Screenshot):** Lazy load, <500KB gzipped
- **Total app:** <2MB gzipped (semua tools included)

### Performance Targets:
- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1
- **Lighthouse Score:** >95 untuk semua metrics

---

## 9. UX CONSISTENCY CHECKLIST

Setiap tool baru harus memenuhi checklist ini sebelum merge:

**Layout & Structure:**
- [ ] Menggunakan `ToolLayout` wrapper (Title, Description, Tool Area, FAQ)
- [ ] Max-width `max-w-4xl` atau `max-w-6xl` untuk content
- [ ] Sidebar navigation dengan active state yang jelas
- [ ] Breadcrumbs di header

**Input & Output:**
- [ ] Dropzone dengan drag-and-drop (jika ada file upload)
- [ ] Validasi input dengan error message yang jelas
- [ ] Processing state dengan progress bar (bukan spinner tanpa konteks)
- [ ] Result area yang jelas memisahkan Input dan Output
- [ ] Download/Copy button yang besar dan mencolok (primary color)

**Visual Design:**
- [ ] Color palette sesuai design system (Indigo-600, Emerald-500, Zinc)
- [ ] Border radius: `rounded-xl` untuk cards, `rounded-lg` untuk inputs/buttons
- [ ] Shadows halus (`shadow-sm` atau `shadow-md`)
- [ ] Dark mode pixel-perfect
- [ ] Responsive di mobile (min-width 320px)

**Interactions:**
- [ ] Animasi smooth dengan framer-motion (sesuai Fase UI-1 sampai UI-4)
- [ ] Toast notifications untuk success/error (Sonner)
- [ ] Keyboard shortcuts untuk actions utama
- [ ] Loading states yang informatif

**Privacy & Trust:**
- [ ] Privacy badge: "100% processed in your browser. Files never leave your device."
- [ ] Tidak ada tracking atau analytics yang invasif
- [ ] Clear data option (clear inputs, clear history)

**SEO & Accessibility:**
- [ ] Meta title dan description yang unik per tool
- [ ] Schema.org JSON-LD (SoftwareApplication)
- [ ] Heading hierarchy yang benar (H1, H2, H3)
- [ ] Alt text untuk semua images
- [ ] Keyboard navigation yang lengkap
- [ ] Screen reader friendly (ARIA labels)
- [ ] Color contrast ratio >4.5:1

**FAQ Section:**
- [ ] Minimal 3-5 FAQ per tool
- [ ] Jawaban yang jelas dan helpful
- [ ] Schema.org FAQPage JSON-LD

---

## 10. METRIK KEBERHASILAN

Setelah Fase 22 selesai, AIOTools harus mencapai:

**Kuantitas:**
- ✅ **60+ tools** yang fully functional
- ✅ **13 kategori** tools (PDF, Image, Text, Developer, Calculators, Design, Utility, Security, Converter, Generator, Formatter, AI, Platform)

**Kualitas:**
- ✅ **100% client-side** processing (kecuali BYOK AI yang optional)
- ✅ **Zero server cost** untuk semua tools core
- ✅ **PWA support** dengan offline mode untuk 30+ tools
- ✅ **Dark mode** pixel-perfect di semua tools
- ✅ **Mobile responsive** di semua tools (320px - 2560px)

**Performance:**
- ✅ **Lighthouse score** >95 untuk Performance, Accessibility, Best Practices, SEO
- ✅ **Bundle size** <150KB untuk initial load (landing page)
- ✅ **LCP** <2.5s di 3G connection
- ✅ **FID** <100ms

**User Experience:**
- ✅ **Premium UI** dengan animasi smooth (60fps)
- ✅ **Frictionless UX** (drag & drop, instant feedback, no page reloads)
- ✅ **Privacy-first** messaging di semua tool pages
- ✅ **Accessibility** WCAG 2.1 AA compliant

**Business:**
- ✅ **SEO optimized** dengan schema.org, sitemap, robots.txt
- ✅ **Shareable** (social media cards, copy link button)
- ✅ **Installable** (PWA dengan add to home screen)

---

## 11. ATURAN EKSEKUSI AI (OPENCODE) - PENGINGAT

1. **Baca semua planning documents** (`planning.md`, `planning2.md`, `planning3.md`, `planning4.md`, `planning5.md`, `planning6.md`) sebelum memulai kode.

2. **Iterative Execution:** Kerjakan PER FASE (mulai dari Fase 18). Jangan lompat fase. Selesaikan satu fase, minta review, baru lanjut.

3. **No Placeholders:** Tulis kode lengkap dan fungsional. Jangan gunakan komentar seperti `// ... rest of the code` atau `// implement logic here`. Untuk Web Worker atau heavy processing, buat file terpisah yang fully functional.

4. **Error Handling:** Tangani semua edge cases:
   - File upload: tipe salah, ukuran terlalu besar, file korup
   - API calls: network error, timeout, invalid response
   - User input: invalid format, empty input, special characters
   - Browser compatibility: feature detection, fallbacks

5. **Performance:** Optimasi untuk mobile dan low-end devices:
   - Lazy load heavy dependencies
   - Web Workers untuk processing intensif
   - Code splitting per tool
   - Image optimization (next/image)

6. **Memory Management:** Selalu cleanup resources setelah processing:
   - Revoke object URLs
   - Terminate Web Workers
   - Clear large state variables
   - Handle large files dengan chunking

7. **Checkpoint System:** Di akhir setiap fase, BERHENTI dan tanyakan:
   > "Fase [X] selesai. Apakah ada yang perlu direvisi pada UI/UX, fungsionalitas, atau performance sebelum kita lanjut ke Fase [Y]?"

8. **Testing:** Setiap tool harus di-test untuk:
   - Happy path (normal usage)
   - Edge cases (empty input, large files, invalid data)
   - Mobile responsiveness
   - Dark mode
   - Accessibility (keyboard navigation, screen reader)

---

## 12. TIMELINE ESTIMASI

| Fase | Tools | Estimasi | Target Completion |
|------|-------|----------|-------------------|
| Fase 18 | 9 calculators | 1 minggu | Week 1 |
| Fase 19 | 19 developer tools | 1.5 minggu | Week 2-3 |
| Fase 20 | 11 design tools | 1.5 minggu | Week 4-5 |
| Fase 21 | 5 platform features | 2 minggu | Week 6-7 |
| Fase 22 | Final polish | 1 minggu | Week 8 |
| **Total** | **44 tools baru** | **7 minggu** | **2 bulan** |

**Total tools setelah Fase 22:** 47 (existing) + 44 (new) = **91 tools** 

---

## 13. RISIKO & MITIGASI

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Bundle size terlalu besar | Slow loading | Aggressive code splitting, lazy loading |
| Web Worker memory leak | Browser crash | Proper cleanup, chunk processing |
| API rate limiting (BYOK AI) | User frustration | Client-side rate limiting, clear error messages |
| Browser compatibility | Some features broken | Feature detection, graceful degradation |
| Complex tool maintenance | Bug accumulation | Comprehensive testing, documentation |

---

### ⏸️ Checkpoint Awal Fase 6

Dokumen `planning6.md` telah dibuat dengan spesifikasi lengkap.

**Ringkasan Eksekutif:**
- ✅ **47 tools sudah ada** (Fase 1-17)
- 🆕 **44 tools baru** akan ditambahkan (Fase 18-22)
- ❌ **14 tools** tetap out of scope (butuh server)
- 🎯 **Total target: 91 tools** setelah Fase 22
- ⏱️ **Estimasi timeline: 7-8 minggu** untuk semua fase

**Prioritas Implementasi:**
1. **Fase 18:** Calculators (quick wins, high traffic)
2. **Fase 19:** Developer utilities (high retention)
3. **Fase 20:** Design tools (viral potential)
4. **Fase 21:** Platform features (premium feel)
5. **Fase 22:** Final polish (SEO, performance)
