export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { CITIES, SERVICE_TYPES } from "@/lib/data/catalog";
import { PROVIDERS } from "@/lib/data/providers";
import { SITE_URL } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/categories", "/cities", "/become-a-specialist", "/pricing"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...SERVICE_TYPES.map((s) => ({ url: `${SITE_URL}/services/${s.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...CITIES.map((c) => ({ url: `${SITE_URL}/city/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...PROVIDERS.map((p) => ({ url: `${SITE_URL}/provider/${p.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
