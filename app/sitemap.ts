import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

const POPULAR_QUERIES = [
  "paracetamol",
  "amoxicillin",
  "ibuprofen",
  "cetirizine",
  "loratadine",
  "พารา",
  "อะม็อก",
  "ไอบู"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 }
  ];

  const queryEntries: MetadataRoute.Sitemap = POPULAR_QUERIES.map((q) => ({
    url: `${SITE_URL}/search?q=${encodeURIComponent(q)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7
  }));

  return [...staticEntries, ...queryEntries];
}
