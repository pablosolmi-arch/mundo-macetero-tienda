// tests/scripts/import-catalog.test.ts
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { db } from "../../db/client";
import { categories, products, productVariants } from "../../db/schema";
import { inArray } from "drizzle-orm";
import { importCatalogFromCsv } from "../../scripts/import-catalog";

const FIXTURE = path.join(__dirname, "../fixtures/shopify-export-sample.csv");

describe("importCatalogFromCsv", () => {
  afterAll(async () => {
    await db.delete(productVariants).where(
      inArray(
        productVariants.productId,
        db.select({ id: products.id }).from(products).where(inArray(products.slug, ["macetero-terracota", "moldura-clasica"]))
      )
    );
    await db.delete(products).where(inArray(products.slug, ["macetero-terracota", "moldura-clasica"]));
    await db.delete(categories).where(inArray(categories.slug, ["maceteros", "molduras"]));
  });

  it("imports products, variants, and categories from the CSV, uploading images via the injected uploader", async () => {
    // Higher timeout: this test makes ~10 sequential round trips to the real
    // pooled Supabase connection (categories/products/variants inserts + queries),
    // which can exceed vitest's default 5s under normal network latency.
    const uploadedUrls: string[] = [];
    const fakeUploader = async (sourceUrl: string) => {
      uploadedUrls.push(sourceUrl);
      const filename = sourceUrl.split("/").pop();
      return `https://blob.example/${filename}`;
    };

    const result = await importCatalogFromCsv(FIXTURE, fakeUploader);

    expect(result.categoriesImported).toBe(2);
    expect(result.productsImported).toBe(2);
    expect(result.variantsImported).toBe(3); // 2 for terracota + 1 for moldura

    expect(uploadedUrls).toEqual(
      expect.arrayContaining([
        "https://example.com/terracota-1.jpg",
        "https://example.com/terracota-2.jpg",
      ])
    );

    const terracota = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.slug, "macetero-terracota"),
    });
    expect(terracota?.name).toBe("Macetero Terracota");
    expect(terracota?.images).toEqual([
      "https://blob.example/terracota-1.jpg",
      "https://blob.example/terracota-2.jpg",
    ]);

    const variants = await db.query.productVariants.findMany({
      where: (v, { eq }) => eq(v.productId, terracota!.id),
    });
    expect(variants.map((v) => v.name).sort()).toEqual(["Chico", "Grande"]);
  }, 15000);
});
