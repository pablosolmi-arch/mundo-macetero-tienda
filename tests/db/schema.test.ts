// tests/db/schema.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "../../db/client";
import { categories, products } from "../../db/schema";
import { eq } from "drizzle-orm";

describe("schema", () => {
  afterEach(async () => {
    await db.delete(products).where(eq(products.slug, "test-macetero"));
    await db.delete(categories).where(eq(categories.slug, "test-categoria"));
  });

  it("inserts and reads back a product linked to a category", async () => {
    const [category] = await db
      .insert(categories)
      .values({ slug: "test-categoria", name: "Test Categoria" })
      .returning();

    const [product] = await db
      .insert(products)
      .values({
        slug: "test-macetero",
        name: "Test Macetero",
        basePrice: "9990",
        categoryId: category.id,
        images: ["https://example.com/a.jpg"],
        stock: 5,
      })
      .returning();

    const found = await db.query.products.findFirst({
      where: eq(products.slug, "test-macetero"),
    });

    expect(found?.name).toBe("Test Macetero");
    expect(found?.categoryId).toBe(category.id);
    expect(product.stock).toBe(5);
  });
});
