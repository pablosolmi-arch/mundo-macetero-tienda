// tests/queries/catalog.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../db/client";
import { categories, products } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getAllActiveCategories, getProductsByCategory, getProductBySlug } from "../../queries/catalog";

describe("catalog queries", () => {
  beforeAll(async () => {
    const [category] = await db
      .insert(categories)
      .values({ slug: "query-test-cat", name: "Query Test Cat" })
      .returning();
    await db.insert(products).values({
      slug: "query-test-product",
      name: "Query Test Product",
      basePrice: "1000",
      categoryId: category.id,
      images: [],
      stock: 1,
      status: "active",
    });
  });

  afterAll(async () => {
    await db.delete(products).where(eq(products.slug, "query-test-product"));
    await db.delete(categories).where(eq(categories.slug, "query-test-cat"));
  });

  it("lists active categories", async () => {
    const cats = await getAllActiveCategories();
    expect(cats.some((c) => c.slug === "query-test-cat")).toBe(true);
  });

  it("lists products in a category", async () => {
    const result = await getProductsByCategory("query-test-cat");
    expect(result.some((p) => p.slug === "query-test-product")).toBe(true);
  });

  it("gets a product by slug with its variants", async () => {
    const product = await getProductBySlug("query-test-product");
    expect(product?.name).toBe("Query Test Product");
    expect(product?.variants).toEqual([]);
  });

  it("returns null for an unknown slug", async () => {
    const product = await getProductBySlug("does-not-exist");
    expect(product).toBeNull();
  });
});
