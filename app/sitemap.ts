// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllCategories, getProductsByCategory } from "../queries/catalog";

const BASE_URL = process.env.SITE_URL ?? "https://mundo-macetero-tienda.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getAllCategories();

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/${c.slug}`,
  }));

  const productEntries: MetadataRoute.Sitemap = [];
  for (const category of categories) {
    const products = await getProductsByCategory(category.slug);
    for (const product of products) {
      productEntries.push({ url: `${BASE_URL}/producto/${product.slug}` });
    }
  }

  return [{ url: BASE_URL }, ...categoryEntries, ...productEntries];
}
