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
