import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-config";

// NOTE: placeholder domain until the production domain is decided.
const SITE_URL = "https://aitools.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  try {
    return [
      {
        url: `${SITE_URL}/`,
        lastModified,
        changeFrequency: "weekly",
        priority: 1.0,
      },
      ...tools.map((tool) => ({
        url: `${SITE_URL}/tools/${tool.slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [
      {
        url: `${SITE_URL}/`,
        lastModified,
        changeFrequency: "weekly",
        priority: 1.0,
      },
    ];
  }
}
