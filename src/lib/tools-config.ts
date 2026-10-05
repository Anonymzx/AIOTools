export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ToolItem {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export const categories: ToolCategory[] = [
  {
    id: "image",
    name: "Image Tools",
    description: "Compress and convert images right in your browser.",
    icon: "Image",
  },
  {
    id: "pdf",
    name: "PDF Tools",
    description: "Merge PDFs and turn pages into images, locally.",
    icon: "FileText",
  },
  {
    id: "text",
    name: "Text & Utility",
    description: "Everyday text helpers and QR generation.",
    icon: "Type",
  },
  {
    id: "developer",
    name: "Developer Tools",
    description: "Format JSON and generate hashes in seconds.",
    icon: "Code2",
  },
];

export const tools: ToolItem[] = [
  {
    slug: "image/compress",
    title: "Image Compressor",
    description: "Compress JPG, PNG, and WebP images with adjustable quality.",
    icon: "FileImage",
    category: "image",
  },
  {
    slug: "image/convert",
    title: "Image Converter",
    description: "Convert images between JPG, PNG, and WebP formats.",
    icon: "Repeat",
    category: "image",
  },
  {
    slug: "pdf/merge",
    title: "PDF Merger",
    description: "Combine multiple PDF files into one document in order.",
    icon: "Files",
    category: "pdf",
  },
  {
    slug: "pdf/to-image",
    title: "PDF to Image",
    description: "Render every PDF page as a downloadable image.",
    icon: "FileOutput",
    category: "pdf",
  },
  {
    slug: "text/case-converter",
    title: "Case Converter",
    description: "Convert text to UPPER, lower, Title, camel, and snake case.",
    icon: "CaseSensitive",
    category: "text",
  },
  {
    slug: "text/qr-generator",
    title: "QR Code Generator",
    description: "Generate styled QR codes from any text or URL.",
    icon: "QrCode",
    category: "text",
  },
  {
    slug: "developer/json-formatter",
    title: "JSON Formatter",
    description: "Format, minify, and validate JSON with clear errors.",
    icon: "Braces",
    category: "developer",
  },
  {
    slug: "developer/hash-generator",
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes instantly.",
    icon: "Hash",
    category: "developer",
  },
];

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

export function searchTools(query: string): ToolItem[] {
  try {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q),
    );
  } catch {
    return [];
  }
}
