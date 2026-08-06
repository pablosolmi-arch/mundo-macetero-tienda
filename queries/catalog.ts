// queries/catalog.ts
import { cache } from "react";
import { db } from "../db/client";
import { categories, products, productVariants } from "../db/schema";
import { eq, and } from "drizzle-orm";

// React cache() dedupes within a single render, where the header and the page
// body both need the same catalog data.
export const getAllCategories = cache(async () => db.query.categories.findMany());

export async function getCategoryBySlug(slug: string) {
  return (await db.query.categories.findFirst({ where: eq(categories.slug, slug) })) ?? null;
}

export async function getProductsByCategory(categorySlug: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
  });
  if (!category) return [];

  return db.query.products.findMany({
    where: and(eq(products.categoryId, category.id), eq(products.status, "active")),
  });
}

export async function getAllActiveProducts() {
  return db.query.products.findMany({
    where: eq(products.status, "active"),
  });
}

// Active products with their variants and category name, which is what every
// product card needs: the lowest available price and whether to show "A partir de".
// Wrapped in React's cache() so several components on the same page (header,
// grid, related products) share one set of queries instead of repeating them.
const loadActiveProductsWithVariants = async () => {
  const [allProducts, allCategories, allVariants] = await Promise.all([
    db.query.products.findMany({ where: eq(products.status, "active") }),
    db.query.categories.findMany(),
    db.query.productVariants.findMany(),
  ]);

  const catName = new Map(allCategories.map((c) => [c.id, c.name]));
  const catSlug = new Map(allCategories.map((c) => [c.id, c.slug]));
  const variantsByProduct = new Map<number, typeof allVariants>();
  for (const v of allVariants) {
    const list = variantsByProduct.get(v.productId);
    if (list) list.push(v);
    else variantsByProduct.set(v.productId, [v]);
  }

  return allProducts.map((p) => ({
    ...p,
    colNombre: p.categoryId != null ? (catName.get(p.categoryId) ?? "") : "",
    colSlug: p.categoryId != null ? (catSlug.get(p.categoryId) ?? null) : null,
    variants: variantsByProduct.get(p.id) ?? [],
  }));
};

export const getActiveProductsWithVariants = cache(loadActiveProductsWithVariants);

// Slugs shown in the header's "Otros" column and the mobile nav, matching the
// design's Super Packs / Piedras / Bases entries against real catalog slugs.
const OTROS_SLUGS = ["macetero-bowl-copia", "piedras-decorativas-xl", "bases-metalicas"];

// Everything the header needs in one round trip: the product list for the
// mega-menu and search, plus the collection list.
const loadNavData = async () => {
  const [allProducts, allCategories] = await Promise.all([
    db.query.products.findMany({ where: eq(products.status, "active") }),
    db.query.categories.findMany(),
  ]);

  const catName = new Map(allCategories.map((c) => [c.id, c.name]));
  const toNav = (p: (typeof allProducts)[number]) => ({
    slug: p.slug,
    nombre: p.name,
    colNombre: p.categoryId != null ? (catName.get(p.categoryId) ?? "") : "",
    precio: Number(p.basePrice),
  });

  const productos = allProducts.map(toNav).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const otros = OTROS_SLUGS.map((slug) => productos.find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return {
    productos,
    otros,
    colecciones: allCategories
      .map((c) => ({ slug: c.slug, nombre: c.name }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  };
};

export const getNavData = cache(loadNavData);

// Products of a category, plus the products with no category at all when asked
// for the full catalog. Three imported products have a null category_id.
export async function getCatalogProducts(categorySlug?: string) {
  if (!categorySlug) return getAllActiveProducts();
  return getProductsByCategory(categorySlug);
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });
  if (!product) return null;

  const variants = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, product.id),
  });

  return { ...product, variants };
}
