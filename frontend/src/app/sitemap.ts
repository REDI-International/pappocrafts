import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { serviceProviders } from "@/lib/services";
import { categories } from "@/lib/products";

async function getBaseUrl(): Promise<string> {
  let host = "";
  try {
    const h = await headers();
    host = h.get("x-forwarded-host") || h.get("host") || "";
  } catch {
    // static generation
  }
  if (host.includes("papposhop.org")) return "https://papposhop.org";
  if (host.includes("pappo.org")) return "https://pappo.org";
  return process.env.SITE_REGION === "balkans"
    ? "https://papposhop.org"
    : "https://pappo.org";
}

async function getProductIds(): Promise<string[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=id,updated_at&order=created_at.desc`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map((p: { id: string }) => p.id) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const BASE_URL = await getBaseUrl();
  const productIds = await getProductIds();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((c) => c !== "All")
    .map((cat) => ({
      url: `${BASE_URL}/shop?category=${encodeURIComponent(cat)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const productPages: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${BASE_URL}/shop/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const servicePages: MetadataRoute.Sitemap = serviceProviders.map((sp) => ({
    url: `${BASE_URL}/services/${sp.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...servicePages];
}
