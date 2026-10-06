import type { MetadataRoute } from "next";

// NOTE: placeholder domain until the production domain is decided.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://aitools.app/sitemap.xml",
  };
}
