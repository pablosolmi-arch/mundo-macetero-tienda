// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllCategories, getAllActiveProducts } from "../queries/catalog";

export const revalidate = 3600;

// `||` (not `??`) so a blank SITE_URL="" also falls back to a valid absolute URL.
const BASE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllActiveProducts(),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/${c.slug}`,
  }));
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/producto/${p.slug}`,
  }));

  return [{ url: BASE_URL }, ...categoryEntries, ...productEntries];
}
