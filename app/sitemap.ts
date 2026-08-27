// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllCategories, getAllActiveProducts } from "../queries/catalog";
import { BLOG } from "../content/site";
import { GUIAS } from "../content/geo";
import { INTENCIONES } from "../content/intenciones";
import { SITE_URL } from "../lib/seo";

export const revalidate = 3600;

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

// Editorial pages added with the GEO work. Fixed lastModified so the sitemap is
// stable between requests instead of claiming a change every hour.
const GEO_DATE = new Date("2026-08-26");
const INTENCIONES_DATE = new Date("2026-08-27");
const GEO_STATIC_PATHS = ["/guias", "/preguntas-frecuentes"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getAllCategories(), getAllActiveProducts()]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...GEO_STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: GEO_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...GUIAS.map((g) => ({
      url: `${SITE_URL}/guias/${g.slug}`,
      lastModified: new Date(g.fechaPublicacion),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Colecciones por intención de búsqueda: el hub y sus 20 landings.
    ...[{ slug: "" }, ...INTENCIONES].map((i) => ({
      url: `${SITE_URL}/maceteros${i.slug ? `/${i.slug}` : ""}`,
      lastModified: INTENCIONES_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Collections live under /tienda/<slug> now.
    ...categories.map((c) => ({ url: `${SITE_URL}/tienda/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}` })),
    ...BLOG.map((b) => ({ url: `${SITE_URL}/blog/${b.slug}` })),
  ];
}
