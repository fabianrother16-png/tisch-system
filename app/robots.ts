import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Internes Produktions-Studio und API nicht indexieren.
      disallow: ["/studio", "/api"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
