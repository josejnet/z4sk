import type { MetadataRoute } from "next";
import { site } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/audit", "/privacy", "/safety", "/terms"],
      disallow: ["/api/", "/cancel/", "/founder", "/g/", "/p/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
