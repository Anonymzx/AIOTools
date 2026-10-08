import type { Locale } from "./i18n/dictionaries";

export interface ToolCategory {
  id: string;
  name: string;
  nameId: string;
  description: string;
  descriptionId: string;
  icon: string;
}

export interface ToolItem {
  slug: string;
  title: string;
  description: string;
  descriptionId: string;
  icon: string;
  category: string;
}

export const categories: ToolCategory[] = [
  {
    id: "image",
    name: "Image Tools",
    nameId: "Tools Gambar",
    description: "Compress and convert images right in your browser.",
    descriptionId: "Kompres dan konversi gambar langsung di browser.",
    icon: "Image",
  },
  {
    id: "pdf",
    name: "PDF Tools",
    nameId: "Tools PDF",
    description: "Merge PDFs and turn pages into images, locally.",
    descriptionId: "Gabung PDF dan ubah halaman jadi gambar, secara lokal.",
    icon: "FileText",
  },
  {
    id: "text",
    name: "Text & Utility",
    nameId: "Teks & Utilitas",
    description: "Everyday text helpers and QR generation.",
    descriptionId: "Helper teks sehari-hari dan pembuatan QR.",
    icon: "Type",
  },
  {
    id: "developer",
    name: "Developer Tools",
    nameId: "Tools Developer",
    description: "Format JSON and generate hashes in seconds.",
    descriptionId: "Format JSON dan buat hash dalam hitungan detik.",
    icon: "Code2",
  },
  {
    id: "files",
    name: "Files & Archives",
    nameId: "File & Arsip",
    description: "ZIP and archive utilities.",
    descriptionId: "Utilitas ZIP dan arsip.",
    icon: "Archive",
  },
  {
    id: "calculators",
    name: "Calculators",
    nameId: "Kalkulator",
    description: "Everyday calculators for units, dates, loans, and more.",
    descriptionId: "Kalkulator sehari-hari untuk satuan, tanggal, pinjaman, dan lainnya.",
    icon: "Calculator",
  },
  {
    id: "design",
    name: "Design Tools",
    nameId: "Tools Desain",
    description: "Color, gradient, layout, and image helpers for designers.",
    descriptionId: "Helper warna, gradien, tata letak, dan gambar untuk desainer.",
    icon: "Palette",
  },
  {
    id: "media",
    name: "Media Tools",
    nameId: "Tools Media",
    description: "Trim audio and video, extract MP3, and compress clips locally.",
    descriptionId: "Potong audio dan video, ekstrak MP3, dan kompres klip secara lokal.",
    icon: "MonitorPlay",
  },
  {
    id: "productivity",
    name: "Productivity",
    nameId: "Produktivitas",
    description: "Focus timers, typing tests, and everyday random generators.",
    descriptionId: "Timer fokus, tes mengetik, dan generator acak sehari-hari.",
    icon: "Timer",
  },
];

export const tools: ToolItem[] = [
  {
    slug: "image/compress",
    title: "Image Compressor",
    description: "Compress JPG, PNG, and WebP images with adjustable quality.",
    descriptionId: "Kompres gambar JPG, PNG, dan WebP dengan kualitas yang bisa diatur.",
    icon: "FileImage",
    category: "image",
  },
  {
    slug: "image/convert",
    title: "Image Converter",
    description: "Convert images between JPG, PNG, and WebP formats.",
    descriptionId: "Konversi gambar di antara format JPG, PNG, dan WebP.",
    icon: "Repeat",
    category: "image",
  },
  {
    slug: "pdf/merge",
    title: "PDF Merger",
    description: "Combine multiple PDF files into one document in order.",
    descriptionId: "Gabungkan beberapa file PDF menjadi satu dokumen berurutan.",
    icon: "Files",
    category: "pdf",
  },
  {
    slug: "pdf/to-image",
    title: "PDF to Image",
    description: "Render every PDF page as a downloadable image.",
    descriptionId: "Render setiap halaman PDF menjadi gambar yang bisa diunduh.",
    icon: "FileOutput",
    category: "pdf",
  },
  {
    slug: "text/case-converter",
    title: "Case Converter",
    description: "Convert text to UPPER, lower, Title, camel, and snake case.",
    descriptionId: "Ubah teks ke UPPER, lower, Title, camel, dan snake case.",
    icon: "CaseSensitive",
    category: "text",
  },
  {
    slug: "text/qr-generator",
    title: "QR Code Generator",
    description: "Generate styled QR codes from any text or URL.",
    descriptionId: "Buat kode QR bergaya dari teks atau URL apa pun.",
    icon: "QrCode",
    category: "text",
  },
  {
    slug: "developer/json-formatter",
    title: "JSON Formatter",
    description: "Format, minify, and validate JSON with clear errors.",
    descriptionId: "Format, minify, dan validasi JSON dengan error yang jelas.",
    icon: "Braces",
    category: "developer",
  },
  {
    slug: "developer/hash-generator",
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes instantly.",
    descriptionId: "Buat hash MD5, SHA-1, SHA-256, dan SHA-512 secara instan.",
    icon: "Hash",
    category: "developer",
  },
  {
    slug: "developer/regex-tester",
    title: "Regex Tester",
    description: "Test regular expressions live with match highlighting and capture groups.",
    descriptionId: "Uji regex langsung dengan highlight kecocokan dan grup tangkap.",
    icon: "Regex",
    category: "developer",
  },
  {
    slug: "developer/jwt-decoder",
    title: "JWT Decoder",
    description: "Decode JSON Web Tokens locally: header, payload, signature and expiry.",
    descriptionId: "Decode JWT lokal: header, payload, signature, dan masa kedaluwarsa.",
    icon: "KeyRound",
    category: "developer",
  },
  {
    slug: "pdf/split",
    title: "Split PDF",
    description: "Extract selected pages into a new PDF with visual thumbnails.",
    descriptionId: "Ekstrak halaman terpilih menjadi PDF baru dengan thumbnail visual.",
    icon: "Scissors",
    category: "pdf",
  },
  {
    slug: "image/bg-remover",
    title: "Background Remover",
    description: "Remove image backgrounds with on-device AI. Free and private.",
    descriptionId: "Hapus latar foto dengan AI di perangkat. Gratis dan privat.",
    icon: "Eraser",
    category: "image",
  },
  {
    slug: "text/password-generator",
    title: "Password Generator",
    description: "Generate cryptographically secure passwords with live strength meter.",
    descriptionId: "Buat password aman kriptografis dengan meter kekuatan real-time.",
    icon: "Lock",
    category: "text",
  },
  {
    slug: "text/word-counter",
    title: "Word Counter",
    description: "Live word, character and reading-time stats as you type.",
    descriptionId: "Statistik kata, karakter, dan waktu baca langsung saat mengetik.",
    icon: "AlignLeft",
    category: "text",
  },
  {
    slug: "pdf/rotate",
    title: "Rotate PDF",
    description: "Rotate PDF pages globally or per page, visually.",
    descriptionId: "Putar halaman PDF global atau per halaman secara visual.",
    icon: "RotateCw",
    category: "pdf",
  },
  {
    slug: "image/watermark",
    title: "Image Watermark",
    description: "Add text or logo watermarks with live canvas preview.",
    descriptionId: "Tambah watermark teks/logo dengan pratinjau canvas real-time.",
    icon: "Stamp",
    category: "image",
  },
  {
    slug: "image/crop",
    title: "Image Cropper",
    description: "Crop, rotate and flip images with aspect presets.",
    descriptionId: "Potong, putar, dan balik gambar dengan preset rasio.",
    icon: "Crop",
    category: "image",
  },
  {
    slug: "image/record",
    title: "Screen Recorder",
    description: "Record screen, mic or both — right in the browser.",
    descriptionId: "Rekam layar, mic, atau keduanya — langsung di browser.",
    icon: "Video",
    category: "image",
  },
  {
    slug: "image/heic-convert",
    title: "HEIC Converter",
    description: "Convert iPhone HEIC photos to JPG/PNG locally.",
    descriptionId: "Konversi foto HEIC iPhone ke JPG/PNG secara lokal.",
    icon: "FileImage",
    category: "image",
  },
  {
    slug: "pdf/images-to-pdf",
    title: "Images to PDF",
    description: "Turn multiple images into one PDF with layout control.",
    descriptionId: "Ubah banyak gambar jadi satu PDF dengan kontrol tata letak.",
    icon: "Images",
    category: "pdf",
  },
  {
    slug: "developer/base64",
    title: "Base64 Tools",
    description: "Encode and decode Base64 text and images.",
    descriptionId: "Encode dan decode Base64 teks dan gambar.",
    icon: "Binary",
    category: "developer",
  },
  {
    slug: "pdf/organize",
    title: "Organize PDF",
    description: "Reorder, rotate, duplicate, and delete PDF pages visually.",
    descriptionId: "Susun ulang, putar, duplikat, dan hapus halaman PDF secara visual.",
    icon: "Layers",
    category: "pdf",
  },
  {
    slug: "pdf/page-number",
    title: "Add Page Numbers",
    description: "Stamp page numbers onto your PDF in header or footer.",
    descriptionId: "Bubuhkan nomor halaman pada PDF di header atau footer.",
    icon: "ListOrdered",
    category: "pdf",
  },
  {
    slug: "pdf/unlock",
    title: "Unlock PDF",
    description: "Remove the password from a PDF you own, locally.",
    descriptionId: "Hapus kata sandi dari PDF milikmu, secara lokal.",
    icon: "LockOpen",
    category: "pdf",
  },
  {
    slug: "pdf/text-to-pdf",
    title: "Text to PDF",
    description: "Turn plain text into a clean A4 PDF document.",
    descriptionId: "Ubah teks biasa menjadi dokumen PDF A4 yang rapi.",
    icon: "FileType",
    category: "pdf",
  },
  {
    slug: "image/resize",
    title: "Image Resizer",
    description: "Resize by pixels, percent or social presets.",
    descriptionId: "Ubah ukuran via piksel, persen, atau preset sosmed.",
    icon: "Scaling",
    category: "image",
  },
  {
    slug: "image/rotate-flip",
    title: "Rotate & Flip",
    description: "Rotate at any angle, flip horizontal or vertical.",
    descriptionId: "Putar bebas, balik horizontal atau vertikal.",
    icon: "RefreshCcw",
    category: "image",
  },
  {
    slug: "image/crop-circle",
    title: "Circle Crop",
    description: "Crop round profile photos with transparency.",
    descriptionId: "Potong foto profil bulat dengan transparansi.",
    icon: "Circle",
    category: "image",
  },
  {
    slug: "image/collage",
    title: "Photo Collage",
    description: "Merge 2–9 photos into one grid collage.",
    descriptionId: "Gabung 2–9 foto jadi satu kolase.",
    icon: "LayoutGrid",
    category: "image",
  },
  {
    slug: "image/signature",
    title: "Signature Resizer",
    description: "Resize signatures to form-ready sizes and DPI.",
    descriptionId: "Ubah ukuran tanda tangan sesuai formulir.",
    icon: "PenLine",
    category: "image",
  },
  {
    slug: "image/images-to-gif",
    title: "Images to GIF",
    description: "Animate stills into a looping GIF.",
    descriptionId: "Ubah gambar diam menjadi GIF berulang.",
    icon: "Clapperboard",
    category: "image",
  },
  {
    slug: "image/gif-to-images",
    title: "GIF to Frames",
    description: "Extract every GIF frame as PNG.",
    descriptionId: "Ekstrak semua frame GIF jadi PNG.",
    icon: "Film",
    category: "image",
  },
  {
    slug: "files/zip-maker",
    title: "ZIP Maker",
    description: "Bundle any files into a ZIP archive.",
    descriptionId: "Gabung file apa pun menjadi arsip ZIP.",
    icon: "Package",
    category: "files",
  },
  {
    slug: "files/zip-extractor",
    title: "ZIP Extractor",
    description: "List and extract files from any ZIP.",
    descriptionId: "Lihat dan ekstrak isi file ZIP.",
    icon: "PackageOpen",
    category: "files",
  },
  {
    slug: "text/barcode",
    title: "Barcode Generator",
    description: "Code128, EAN-13, UPC and more, PNG/SVG.",
    descriptionId: "Code128, EAN-13, UPC, PNG/SVG.",
    icon: "Barcode",
    category: "text",
  },
  {
    slug: "pdf/scan",
    title: "Scan to PDF",
    description: "Turn photos or camera shots into a clean PDF.",
    descriptionId: "Ubah foto atau jepretan kamera menjadi PDF rapi.",
    icon: "ScanLine",
    category: "pdf",
  },
  {
    slug: "pdf/metadata",
    title: "PDF Metadata",
    description: "Read and edit PDF title, author and more.",
    descriptionId: "Baca dan ubah judul, penulis, dan lainnya.",
    icon: "Tags",
    category: "pdf",
  },
  {
    slug: "pdf/sign",
    title: "Sign PDF",
    description: "Draw, type or upload a signature onto any page.",
    descriptionId: "Gambar, ketik, atau unggah tanda tangan ke halaman mana pun.",
    icon: "Signature",
    category: "pdf",
  },
  {
    slug: "pdf/redact",
    title: "Redact PDF",
    description: "Permanently black out sensitive areas.",
    descriptionId: "Hitamkan area sensitif secara permanen.",
    icon: "EyeOff",
    category: "pdf",
  },
  {
    slug: "pdf/watermark",
    title: "PDF Watermark",
    description: "Stamp diagonal or tiled text watermarks.",
    descriptionId: "Bubuhkan watermark teks diagonal atau ubin.",
    icon: "Droplets",
    category: "pdf",
  },
  {
    slug: "pdf/compare",
    title: "Compare PDFs",
    description: "Side-by-side text diff of two PDFs.",
    descriptionId: "Diff teks berdampingan dari dua PDF.",
    icon: "GitCompare",
    category: "pdf",
  },
  {
    slug: "pdf/to-markdown",
    title: "PDF to Markdown",
    description: "Extract structured text as Markdown.",
    descriptionId: "Ekstrak teks terstruktur sebagai Markdown.",
    icon: "FileCode",
    category: "pdf",
  },
  {
    slug: "pdf/ocr",
    title: "OCR PDF",
    description: "Searchable text from scans, in your browser.",
    descriptionId: "Teks searchable dari hasil pindai, di browser.",
    icon: "ScanText",
    category: "pdf",
  },
  {
    slug: "pdf/repair",
    title: "Repair PDF",
    description: "Rebuild broken PDFs when possible.",
    descriptionId: "Bangun ulang PDF rusak jika memungkinkan.",
    icon: "Wrench",
    category: "pdf",
  },
  {
    slug: "pdf/info",
    title: "PDF Info",
    description: "Pages, version, encryption and metadata at a glance.",
    descriptionId: "Halaman, versi, enkripsi, dan metadata sekilas.",
    icon: "Info",
    category: "pdf",
  },
  {
    slug: "calculators/unit-converter",
    title: "Unit Converter",
    description: "Convert length, weight, temperature, volume, and 4 more unit families instantly.",
    descriptionId: "Konversi panjang, berat, suhu, volume, dan 4 keluarga satuan lainnya secara instan.",
    icon: "Calculator",
    category: "calculators",
  },
  {
    slug: "calculators/date-calculator",
    title: "Date Calculator",
    description: "Days between two dates with business-day count, or add/subtract days.",
    descriptionId: "Selisih dua tanggal dengan hitungan hari kerja, atau tambah/kurangi hari.",
    icon: "CalendarDays",
    category: "calculators",
  },
  {
    slug: "calculators/age-calculator",
    title: "Age Calculator",
    description: "Exact age with live next-birthday countdown, zodiac, and fun lifetime stats.",
    descriptionId: "Umur tepat dengan hitung mundur ulang tahun live, zodiak, dan statistik seru.",
    icon: "Cake",
    category: "calculators",
  },
  {
    slug: "calculators/bmi-calculator",
    title: "BMI Calculator",
    description: "Body Mass Index with category badge, animated gauge, and healthy range.",
    descriptionId: "Indeks Massa Tubuh dengan badge kategori, pengukur animasi, dan rentang sehat.",
    icon: "Gauge",
    category: "calculators",
  },
  {
    slug: "calculators/loan-calculator",
    title: "Loan Calculator",
    description: "Monthly EMI, total interest, amortization schedule, and CSV export.",
    descriptionId: "Cicilan EMI, total bunga, jadwal amortisasi, dan ekspor CSV.",
    icon: "Landmark",
    category: "calculators",
  },
  {
    slug: "calculators/percentage",
    title: "Percentage Calculator",
    description: "X% of Y, what-percent, and percentage change — coming soon.",
    descriptionId: "X% dari Y, berapa persen, dan perubahan persen — segera hadir.",
    icon: "Percent",
    category: "calculators",
  },
  {
    slug: "calculators/tip",
    title: "Tip Calculator",
    description: "Tip and per-person split for any bill — coming soon.",
    descriptionId: "Tip dan patungan per orang untuk tagihan apa pun — segera hadir.",
    icon: "Receipt",
    category: "calculators",
  },
  {
    slug: "calculators/discount",
    title: "Discount Calculator",
    description: "Final price and savings with stacked discounts — coming soon.",
    descriptionId: "Harga akhir dan hemat dengan diskon bertumpuk — segera hadir.",
    icon: "BadgePercent",
    category: "calculators",
  },
  {
    slug: "calculators/timezone",
    title: "Time Zone Converter",
    description: "Convert any time across world time zones — coming soon.",
    descriptionId: "Konversi waktu apa pun lintas zona waktu dunia — segera hadir.",
    icon: "Globe2",
    category: "calculators",
  },
  {
    slug: "developer/timestamp",
    title: "Timestamp Converter",
    description: "Unix timestamp to date and back, with live clock — coming soon.",
    descriptionId: "Timestamp Unix ke tanggal dan sebaliknya, dengan jam live — segera hadir.",
    icon: "Clock",
    category: "developer",
  },
  {
    slug: "developer/uuid",
    title: "UUID Generator",
    description: "Bulk UUID v4 generation with copy and download — coming soon.",
    descriptionId: "Pembuatan UUID v4 massal dengan salin dan unduh — segera hadir.",
    icon: "Fingerprint",
    category: "developer",
  },
  {
    slug: "developer/lorem",
    title: "Lorem Ipsum Generator",
    description: "Placeholder paragraphs, sentences, and words — coming soon.",
    descriptionId: "Paragraf, kalimat, dan kata placeholder — segera hadir.",
    icon: "WholeWord",
    category: "developer",
  },
  {
    slug: "developer/markdown-to-html",
    title: "Markdown to HTML",
    description: "Convert Markdown to HTML with live preview — coming soon.",
    descriptionId: "Konversi Markdown ke HTML dengan pratinjau live — segera hadir.",
    icon: "FileCode2",
    category: "developer",
  },
  {
    slug: "developer/html-to-markdown",
    title: "HTML to Markdown",
    description: "Convert HTML back to clean Markdown — coming soon.",
    descriptionId: "Konversi HTML kembali ke Markdown bersih — segera hadir.",
    icon: "FileDown",
    category: "developer",
  },
  {
    slug: "developer/css-formatter",
    title: "CSS Formatter",
    description: "Minify and beautify CSS with size comparison — coming soon.",
    descriptionId: "Minify dan percantik CSS dengan perbandingan ukuran — segera hadir.",
    icon: "Braces",
    category: "developer",
  },
  {
    slug: "developer/js-formatter",
    title: "JS Formatter",
    description: "Minify and beautify JavaScript safely — coming soon.",
    descriptionId: "Minify dan percantik JavaScript dengan aman — segera hadir.",
    icon: "FileJson2",
    category: "developer",
  },
  {
    slug: "developer/sql-formatter",
    title: "SQL Formatter",
    description: "Format messy SQL for MySQL, Postgres, and more — coming soon.",
    descriptionId: "Format SQL berantakan untuk MySQL, Postgres, dan lainnya — segera hadir.",
    icon: "Database",
    category: "developer",
  },
  {
    slug: "developer/xml-formatter",
    title: "XML Formatter",
    description: "Format and validate XML with highlighting — coming soon.",
    descriptionId: "Format dan validasi XML dengan highlight — segera hadir.",
    icon: "FileCode",
    category: "developer",
  },
  {
    slug: "developer/yaml-formatter",
    title: "YAML Formatter",
    description: "Format and validate YAML documents — coming soon.",
    descriptionId: "Format dan validasi dokumen YAML — segera hadir.",
    icon: "FileCog",
    category: "developer",
  },
  {
    slug: "developer/csv-to-json",
    title: "CSV to JSON",
    description: "Convert CSV to JSON with table preview — coming soon.",
    descriptionId: "Konversi CSV ke JSON dengan pratinjau tabel — segera hadir.",
    icon: "Table",
    category: "developer",
  },
  {
    slug: "developer/json-to-csv",
    title: "JSON to CSV",
    description: "Flatten nested JSON into CSV rows — coming soon.",
    descriptionId: "Ratakan JSON bersarang menjadi baris CSV — segera hadir.",
    icon: "TableProperties",
    category: "developer",
  },
  {
    slug: "developer/url-encoder",
    title: "URL Encoder",
    description: "Encode and decode URL components safely — coming soon.",
    descriptionId: "Encode dan decode komponen URL dengan aman — segera hadir.",
    icon: "Link2",
    category: "developer",
  },
  {
    slug: "developer/html-encoder",
    title: "HTML Encoder",
    description: "Encode and decode HTML entities — coming soon.",
    descriptionId: "Encode dan decode entitas HTML — segera hadir.",
    icon: "Code2",
    category: "developer",
  },
  {
    slug: "developer/slugify",
    title: "Slug Generator",
    description: "Turn any text into a URL-friendly slug — coming soon.",
    descriptionId: "Ubah teks apa pun menjadi slug ramah-URL — segera hadir.",
    icon: "Link",
    category: "developer",
  },
  {
    slug: "developer/dedupe-lines",
    title: "Dedupe Lines",
    description: "Remove duplicate lines, case-sensitive or not — coming soon.",
    descriptionId: "Hapus baris duplikat, sensitif huruf atau tidak — segera hadir.",
    icon: "ListX",
    category: "developer",
  },
  {
    slug: "developer/sort-lines",
    title: "Sort Lines",
    description: "Sort lines alphabetically or numerically — coming soon.",
    descriptionId: "Urutkan baris alfabetis atau numerik — segera hadir.",
    icon: "ArrowDownAZ",
    category: "developer",
  },
  {
    slug: "developer/find-replace",
    title: "Find & Replace",
    description: "Search and replace with regex support — coming soon.",
    descriptionId: "Cari dan ganti dengan dukungan regex — segera hadir.",
    icon: "Replace",
    category: "developer",
  },
  {
    slug: "developer/text-diff",
    title: "Text Diff",
    description: "Side-by-side diff of two texts — coming soon.",
    descriptionId: "Diff berdampingan dari dua teks — segera hadir.",
    icon: "GitCompare",
    category: "developer",
  },
  {
    slug: "design/favicon",
    title: "Favicon Generator",
    description: "Multi-size favicons plus manifest from one image — coming soon.",
    descriptionId: "Favicon multi-ukuran plus manifest dari satu gambar — segera hadir.",
    icon: "AppWindow",
    category: "design",
  },
  {
    slug: "design/social-resizer",
    title: "Social Image Resizer",
    description: "Resize images for 20+ social presets — coming soon.",
    descriptionId: "Ubah ukuran gambar untuk 20+ preset sosmed — segera hadir.",
    icon: "Share2",
    category: "design",
  },
  {
    slug: "design/meme",
    title: "Meme Generator",
    description: "Top/bottom text memes with live preview — coming soon.",
    descriptionId: "Meme teks atas/bawah dengan pratinjau live — segera hadir.",
    icon: "Laugh",
    category: "design",
  },
  {
    slug: "design/ascii-art",
    title: "ASCII Art",
    description: "Turn images into colored ASCII text — coming soon.",
    descriptionId: "Ubah gambar menjadi teks ASCII berwarna — segera hadir.",
    icon: "Type",
    category: "design",
  },
  {
    slug: "design/palette",
    title: "Palette Generator",
    description: "Harmony palettes from a color or image — coming soon.",
    descriptionId: "Palet harmoni dari warna atau gambar — segera hadir.",
    icon: "Palette",
    category: "design",
  },
  {
    slug: "design/gradient",
    title: "Gradient Generator",
    description: "Linear and radial gradients with CSS output — coming soon.",
    descriptionId: "Gradien linear dan radial dengan output CSS — segera hadir.",
    icon: "PaintBucket",
    category: "design",
  },
  {
    slug: "design/box-shadow",
    title: "Box Shadow Generator",
    description: "Layered box shadows with live preview — coming soon.",
    descriptionId: "Bayangan kotak berlapis dengan pratinjau live — segera hadir.",
    icon: "Square",
    category: "design",
  },
  {
    slug: "design/grid",
    title: "CSS Grid Generator",
    description: "Visual grid builder with CSS output — coming soon.",
    descriptionId: "Pembuat grid visual dengan output CSS — segera hadir.",
    icon: "LayoutGrid",
    category: "design",
  },
  {
    slug: "design/flexbox",
    title: "Flexbox Generator",
    description: "Visual flexbox builder with CSS output — coming soon.",
    descriptionId: "Pembuat flexbox visual dengan output CSS — segera hadir.",
    icon: "Columns3",
    category: "design",
  },
  {
    slug: "design/svg-to-png",
    title: "SVG to PNG",
    description: "Rasterize SVG at any size or scale — coming soon.",
    descriptionId: "Rasterisasi SVG di ukuran atau skala apa pun — segera hadir.",
    icon: "FileImage",
    category: "design",
  },
  {
    slug: "design/code-screenshot",
    title: "Code Screenshot",
    description: "Carbon-style code screenshots with themes — coming soon.",
    descriptionId: "Screenshot kode gaya Carbon dengan tema — segera hadir.",
    icon: "Camera",
    category: "design",
  },
  {
    slug: "developer/ai-summarizer",
    title: "AI Summarizer",
    description: "Summarize documents with your own API key — coming soon.",
    descriptionId: "Ringkas dokumen dengan API key milikmu — segera hadir.",
    icon: "Sparkles",
    category: "developer",
  },
  {
    slug: "developer/ai-translator",
    title: "AI Translator",
    description: "Translate text into 50+ languages (BYOK) — coming soon.",
    descriptionId: "Terjemahkan teks ke 50+ bahasa (BYOK) — segera hadir.",
    icon: "Languages",
    category: "developer",
  },
  {
    slug: "media/audio-trimmer",
    title: "Audio Trimmer",
    description: "Cut MP3, WAV, OGG, or M4A with a draggable waveform, in your browser.",
    descriptionId: "Potong MP3, WAV, OGG, atau M4A dengan waveform yang bisa diseret, di browser.",
    icon: "Scissors",
    category: "media",
  },
  {
    slug: "media/video-to-mp3",
    title: "Video to MP3",
    description: "Extract audio from MP4, WebM, or MOV as MP3 or WAV.",
    descriptionId: "Ekstrak audio dari MP4, WebM, atau MOV menjadi MP3 atau WAV.",
    icon: "FileAudio",
    category: "media",
  },
  {
    slug: "media/video-compressor",
    title: "Video Compressor",
    description: "Shrink videos with quality presets, resolution options, and mute toggle.",
    descriptionId: "Perkecil video dengan preset kualitas, pilihan resolusi, dan opsi bisu.",
    icon: "FileVideo",
    category: "media",
  },
  {
    slug: "media/video-trimmer",
    title: "Video Trimmer",
    description: "Cut video clips fast with stream copy or frame-accurate re-encode.",
    descriptionId: "Potong klip video cepat dengan stream copy atau re-encode akurat.",
    icon: "Clapperboard",
    category: "media",
  },
  {
    slug: "productivity/pomodoro",
    title: "Pomodoro Timer",
    description: "Focus sprints with customizable work and break intervals — coming soon.",
    descriptionId: "Sprint fokus dengan interval kerja dan istirahat yang bisa diatur — segera hadir.",
    icon: "Timer",
    category: "productivity",
  },
  {
    slug: "productivity/typing-test",
    title: "Typing Speed Test",
    description: "Measure WPM, accuracy, and consistency as you type — coming soon.",
    descriptionId: "Ukur WPM, akurasi, dan konsistensi saat mengetik — segera hadir.",
    icon: "Keyboard",
    category: "productivity",
  },
  {
    slug: "productivity/stopwatch",
    title: "Stopwatch & Countdown",
    description: "Precise stopwatch with laps plus a countdown timer with alarm — coming soon.",
    descriptionId: "Stopwatch presisi dengan lap plus timer hitung mundur dengan alarm — segera hadir.",
    icon: "AlarmClock",
    category: "productivity",
  },
  {
    slug: "productivity/random-generator",
    title: "Random Generator",
    description: "Random numbers, names, passwords, and colors in one click — coming soon.",
    descriptionId: "Angka, nama, password, dan warna acak dalam sekali klik — segera hadir.",
    icon: "Dices",
    category: "productivity",
  },
  {
    slug: "calculators/scientific",
    title: "Scientific Calculator",
    description: "Trig, logs, powers, and constants with a full keypad — coming soon.",
    descriptionId: "Trigonometri, log, pangkat, dan konstanta dengan keypad lengkap — segera hadir.",
    icon: "Sigma",
    category: "calculators",
  },
  {
    slug: "calculators/graph-plotter",
    title: "Graph Plotter",
    description: "Plot 2D math functions with zoom and pan on an interactive canvas — coming soon.",
    descriptionId: "Plot fungsi matematika 2D dengan zoom dan pan di kanvas interaktif — segera hadir.",
    icon: "ChartLine",
    category: "calculators",
  },
  {
    slug: "developer/meta-tags",
    title: "Meta Tag Generator",
    description: "Generate SEO and Open Graph meta tags with a social preview — coming soon.",
    descriptionId: "Buat meta tag SEO dan Open Graph dengan pratinjau sosial — segera hadir.",
    icon: "Tags",
    category: "developer",
  },
  {
    slug: "developer/robots-generator",
    title: "Robots.txt Generator",
    description: "Build a valid robots.txt with allow, disallow, and sitemap rules — coming soon.",
    descriptionId: "Susun robots.txt valid dengan aturan allow, disallow, dan sitemap — segera hadir.",
    icon: "FileCog",
    category: "developer",
  },
  {
    slug: "developer/sitemap-generator",
    title: "Sitemap Generator",
    description: "Turn a URL list into a valid sitemap.xml with priorities — coming soon.",
    descriptionId: "Ubah daftar URL menjadi sitemap.xml valid dengan prioritas — segera hadir.",
    icon: "Network",
    category: "developer",
  },
  {
    slug: "developer/htaccess-generator",
    title: ".htaccess Generator",
    description: "Generate redirects, HTTPS forcing, and security headers for Apache — coming soon.",
    descriptionId: "Buat redirect, pemaksaan HTTPS, dan header keamanan untuk Apache — segera hadir.",
    icon: "ShieldCheck",
    category: "developer",
  },
  {
    slug: "developer/ip-info",
    title: "IP Address Info",
    description: "See your public IP, ISP, location, and device details instantly — coming soon.",
    descriptionId: "Lihat IP publik, ISP, lokasi, dan detail perangkat seketika — segera hadir.",
    icon: "Globe",
    category: "developer",
  },
  {
    slug: "developer/user-agent",
    title: "User Agent Parser",
    description: "Parse any user agent into browser, OS, and device details — coming soon.",
    descriptionId: "Urai user agent apa pun menjadi detail browser, OS, dan perangkat — segera hadir.",
    icon: "Fingerprint",
    category: "developer",
  },
];

export function getCategoryName(
  category: ToolCategory,
  locale: Locale = "en",
): string {
  try {
    return locale === "id" ? category.nameId : category.name;
  } catch {
    return category.name;
  }
}

export function getCategoryDescription(
  category: ToolCategory,
  locale: Locale = "en",
): string {
  try {
    return locale === "id" ? category.descriptionId : category.description;
  } catch {
    return category.description;
  }
}

export function getToolDescription(tool: ToolItem, locale: Locale = "en"): string {
  try {
    return locale === "id" ? tool.descriptionId : tool.description;
  } catch {
    return tool.description;
  }
}

export function getTool(slug: string): ToolItem | undefined {
  try {
    const normalized = slug.trim().toLowerCase();
    return tools.find((t) => t.slug.toLowerCase() === normalized);
  } catch {
    return undefined;
  }
}

export function getToolsByCategory(categoryId: string): ToolItem[] {
  try {
    return tools.filter((t) => t.category === categoryId);
  } catch {
    return [];
  }
}

export function searchTools(query: string, locale: Locale = "en"): ToolItem[] {
  try {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => {
      try {
        const haystacks = [
          t.title.toLowerCase(),
          t.description.toLowerCase(),
          t.descriptionId.toLowerCase(),
          t.slug.toLowerCase(),
          getCategoryName(
            categories.find((c) => c.id === t.category) ?? categories[0],
            locale,
          ).toLowerCase(),
        ];
        return haystacks.some((h) => h.includes(q));
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}
