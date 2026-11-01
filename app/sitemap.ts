import type { MetadataRoute } from "next";
import { site } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/privacy`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/audit`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site.url}/safety`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/terms`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
