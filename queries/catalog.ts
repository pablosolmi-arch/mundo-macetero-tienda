// queries/catalog.ts
import { db } from "../db/client";
import { categories, products, productVariants } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getAllCategories() {
  return db.query.categories.findMany();
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
