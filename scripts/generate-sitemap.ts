// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic restaurant IDs from the Supabase Data API using the publishable anon key.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://vos-resto.lovable.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://kjdvtphiotpdrrfgikeh.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZHZ0cGhpb3RwZHJyZmdpa2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTgyNzMsImV4cCI6MjA5MjAzNDI3M30.C5L_-S3aaF89H0mHr2GINJqu-Wbspmcl2z-HO2uVQCw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/search", changefreq: "daily", priority: "0.9" },
  { path: "/map", changefreq: "weekly", priority: "0.7" },
];

async function fetchActiveRestaurantIds(): Promise<string[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?select=id,updated_at&is_active=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ id: string; updated_at?: string }>;
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const ids = await fetchActiveRestaurantIds();
const entries: SitemapEntry[] = [
  ...staticEntries,
  ...ids.map<SitemapEntry>((id) => ({
    path: `/restaurant/${encodeURIComponent(id)}`,
    changefreq: "weekly",
    priority: "0.8",
  })),
];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
