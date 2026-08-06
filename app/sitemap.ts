// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllCategories, getAllActiveProducts } from "../queries/catalog";
import { BLOG } from "../content/site";

export const revalidate = 3600;

// `||` (not `??`) so a blank SITE_URL="" also falls back to a valid absolute URL.
const BASE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

// Content pages worth indexing. Cart, checkout and confirmation are deliberately
// excluded: they are per-session and have nothing to index.
const STATIC_PATHS = [
  "",
  "/tienda",
  "/quienes-somos",
  "/asesoramiento",
  "/tu-espacio",
  "/contacto",
  "/olivo",
  "/paleta",
  "/blog",
  "/politicas",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getAllCategories(), getAllActiveProducts()]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${BASE_URL}${path}` })),
    // Collections live under /tienda/<slug> now.
    ...categories.map((c) => ({ url: `${BASE_URL}/tienda/${c.slug}` })),
    ...products.map((p) => ({ url: `${BASE_URL}/producto/${p.slug}` })),
    ...BLOG.map((b) => ({ url: `${BASE_URL}/blog/${b.slug}` })),
  ];
}
