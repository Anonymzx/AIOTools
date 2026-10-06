export type Locale = "en" | "id";

export interface Dict {
  header: {
    share: string;
    shareCopied: string;
    shareFailed: string;
    pro: string;
    searchPlaceholder: string;
    menu: string;
    home: string;
    language: string;
    english: string;
    indonesian: string;
    enableDark: string;
    enableLight: string;
  };
  sidebar: {
    search: string;
    tools: string;
    collapse: string;
    expand: string;
    version: string;
    searchHint: string;
  };
  search: {
    title: string;
    placeholder: string;
    noResults: string;
    hint: string;
    typeToSearch: string;
    openHint: string;
    closeHint: string;
    toolsCount: string;
  };
  footer: {
    tagline: string;
    categories: string;
    developerTools: string;
    rights: string;
    privacyNote: string;
    allTools: string;
  };
  toollayout: {
    faqTitle: string;
    input: string;
    output: string;
  };
  dropzone: {
    title: string;
    subtitle: string;
    browse: string;
    filesSelected: string;
    remove: string;
    invalidType: string;
    tooLarge: string;
    maxFiles: string;
  };
  common: {
    download: string;
    downloading: string;
    copy: string;
    copied: string;
    copyFailed: string;
    clear: string;
    reset: string;
    processing: string;
    error: string;
    success: string;
    cancel: string;
    back: string;
  };
  landing: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    exploreTools: string;
    howItWorks: string;
    statsTools: string;
    statsCategories: string;
    statsPrivate: string;
    browseByCategory: string;
    browseSubtitle: string;
    toolsCountSuffix: string;
    popularTools: string;
    popularSubtitle: string;
    noSignup: string;
    privacyTitle: string;
    privacySubtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
}

export const dictionaries: Record<Locale, Dict> = {
  en: {
    header: {
      share: "Share",
      shareCopied: "Link copied to clipboard.",
      shareFailed: "Failed to copy link.",
      pro: "Pro",
      searchPlaceholder: "Search tools…",
      menu: "Open navigation menu",
      home: "Home",
      language: "Language",
      english: "English",
      indonesian: "Bahasa Indonesia",
      enableDark: "Enable dark mode",
      enableLight: "Enable light mode",
    },
    sidebar: {
      search: "Search tools...",
      tools: "Tools",
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
      version: "v0.2.0 Phase 2",
      searchHint: "Search tools (Ctrl+K)",
    },
    search: {
      title: "Search tools",
      placeholder: "Search tools… (e.g. compress, qr, json)",
      noResults: "No tools match",
      hint: "to open",
      typeToSearch: "Type to search tools...",
      openHint: "to open",
      closeHint: "to close",
      toolsCount: "tools",
    },
    footer: {
      tagline: "Free online tools that run 100% in your browser. Fast, secure, no upload queue.",
      categories: "Categories",
      developerTools: "Developer",
      rights: "© 2026 AIOTools. All rights reserved.",
      privacyNote: "Your data never leaves your device",
      allTools: "All Tools",
    },
    toollayout: {
      faqTitle: "Frequently asked questions",
      input: "Input",
      output: "Output",
    },
    dropzone: {
      title: "Drag & drop files here",
      subtitle: "or click to browse from your device",
      browse: "Browse files",
      filesSelected: "files selected",
      remove: "Remove file",
      invalidType: "File type not supported.",
      tooLarge: "File is too large.",
      maxFiles: "Maximum file limit reached.",
    },
    common: {
      download: "Download",
      downloading: "Downloading...",
      copy: "Copy",
      copied: "Copied to clipboard.",
      copyFailed: "Failed to copy.",
      clear: "Clear",
      reset: "Reset",
      processing: "Processing...",
      error: "Something went wrong.",
      success: "Done.",
      cancel: "Cancel",
      back: "Back",
    },
    landing: {
      badge: "100% Client-Side & Free",
      heroTitle: "Every Online Tool in One Place",
      heroSubtitle:
        "Compress images, merge PDFs, format JSON, generate QR — all running directly in your browser. No upload queue, no account, no fees.",
      exploreTools: "Explore Tools",
      howItWorks: "How It Works",
      statsTools: "Tools",
      statsCategories: "Categories",
      statsPrivate: "Data Sent",
      browseByCategory: "Browse by Category",
      browseSubtitle: "Four categories, eight tools — all free with no limits.",
      toolsCountSuffix: "tools",
      popularTools: "All Popular Tools",
      popularSubtitle: "Click any tool to use it instantly — no sign-up.",
      noSignup: "Click one to use it right away — no sign-up.",
      privacyTitle: "Privacy first: your files are never uploaded",
      privacySubtitle:
        "Every tool runs 100% on your device using modern browser tech. Disconnect the internet after the page loads and tools keep working. No servers, no tracking, no data leaks.",
      step1Title: "Pick a tool",
      step1Desc: "Choose the tool you need from the sidebar or ⌘K search.",
      step2Title: "Process locally",
      step2Desc: "Drag files or paste text — results appear instantly in your browser.",
      step3Title: "Download / copy",
      step3Desc: "Save the result. Nothing is stored on our servers.",
    },
  },
  id: {
    header: {
      share: "Bagikan",
      shareCopied: "Tautan disalin ke clipboard.",
      shareFailed: "Gagal menyalin tautan.",
      pro: "Pro",
      searchPlaceholder: "Cari tools…",
      menu: "Buka menu navigasi",
      home: "Beranda",
      language: "Bahasa",
      english: "English",
      indonesian: "Bahasa Indonesia",
      enableDark: "Aktifkan mode gelap",
      enableLight: "Aktifkan mode terang",
    },
    sidebar: {
      search: "Cari tools...",
      tools: "Tools",
      collapse: "Ciutkan sidebar",
      expand: "Bentangkan sidebar",
      version: "v0.2.0 Fase 2",
      searchHint: "Cari tools (Ctrl+K)",
    },
    search: {
      title: "Cari tools",
      placeholder: "Cari tools… (mis. compress, qr, json)",
      noResults: "Tidak ada tools yang cocok untuk",
      hint: "untuk membuka",
      typeToSearch: "Ketik untuk mencari tools...",
      openHint: "untuk membuka",
      closeHint: "untuk tutup",
      toolsCount: "tools",
    },
    footer: {
      tagline:
        "Kumpulan tools online gratis yang berjalan 100% di browser. Cepat, aman, tanpa antre upload.",
      categories: "Kategori",
      developerTools: "Developer",
      rights: "© 2026 AIOTools. Semua hak dilindungi.",
      privacyNote: "Data tidak pernah meninggalkan perangkatmu",
      allTools: "Semua Tools",
    },
    toollayout: {
      faqTitle: "Pertanyaan yang sering diajukan",
      input: "Input",
      output: "Output",
    },
    dropzone: {
      title: "Seret & letakkan file di sini",
      subtitle: "atau klik untuk memilih dari perangkatmu",
      browse: "Pilih file",
      filesSelected: "file dipilih",
      remove: "Hapus file",
      invalidType: "Tipe file tidak didukung.",
      tooLarge: "Ukuran file terlalu besar.",
      maxFiles: "Batas jumlah file tercapai.",
    },
    common: {
      download: "Unduh",
      downloading: "Mengunduh...",
      copy: "Salin",
      copied: "Disalin ke clipboard.",
      copyFailed: "Gagal menyalin.",
      clear: "Hapus",
      reset: "Atur ulang",
      processing: "Memproses...",
      error: "Terjadi kesalahan.",
      success: "Berhasil.",
      cancel: "Batal",
      back: "Kembali",
    },
    landing: {
      badge: "100% Client-Side & Gratis",
      heroTitle: "Semua Tools Online dalam Satu Tempat",
      heroSubtitle:
        "Kompres gambar, gabung PDF, format JSON, buat QR — semuanya berjalan langsung di browser. Tanpa antre upload, tanpa akun, tanpa biaya.",
      exploreTools: "Jelajahi Tools",
      howItWorks: "Cara Kerja",
      statsTools: "Tools",
      statsCategories: "Kategori",
      statsPrivate: "Data Terkirim",
      browseByCategory: "Jelajahi berdasarkan Kategori",
      browseSubtitle: "Empat kategori, delapan tools — semuanya gratis tanpa batas.",
      toolsCountSuffix: "tools",
      popularTools: "Semua Tools Populer",
      popularSubtitle: "Klik salah satu untuk langsung menggunakannya — tanpa daftar.",
      noSignup: "Klik salah satu untuk langsung menggunakannya — tanpa daftar.",
      privacyTitle: "Privasi dulu: file-mu tidak pernah diunggah",
      privacySubtitle:
        "Setiap tools berjalan 100% di perangkatmu memakai teknologi browser modern. Cabut internet setelah halaman termuat pun tools tetap berfungsi. Tidak ada server, tidak ada pelacakan, tidak ada kebocoran data.",
      step1Title: "Pilih tool",
      step1Desc: "Klik tool yang kamu butuhkan dari sidebar atau pencarian ⌘K.",
      step2Title: "Proses lokal",
      step2Desc: "Seret file atau tempel teks — hasil muncul seketika di browser.",
      step3Title: "Unduh / salin",
      step3Desc: "Simpan hasilnya. Tidak ada yang tersimpan di server kami.",
    },
  },
};
