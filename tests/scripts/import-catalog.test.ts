// tests/scripts/import-catalog.test.ts
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { db } from "../../db/client";
import { categories, products, productVariants } from "../../db/schema";
import { inArray } from "drizzle-orm";
import { importCatalogFromCsv } from "../../scripts/import-catalog";

const FIXTURE = path.join(__dirname, "../fixtures/shopify-export-sample.csv");

describe("importCatalogFromCsv", () => {
  const testSlugs = ["macetero-terracota", "moldura-clasica", "macetero-sin-stock", "jardinera-test"];
  afterAll(async () => {
    await db.delete(productVariants).where(
      inArray(
        productVariants.productId,
        db.select({ id: products.id }).from(products).where(inArray(products.slug, testSlugs))
      )
    );
    await db.delete(products).where(inArray(products.slug, testSlugs));
    await db.delete(categories).where(inArray(categories.slug, ["maceteros", "molduras", "jardineratest"]));
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

  it("is safe to re-run against the same CSV (upserts, no duplicates)", async () => {
    const fakeUploader = async (sourceUrl: string) => {
      const filename = sourceUrl.split("/").pop();
      return `https://blob.example/${filename}`;
    };

    // First run establishes the rows.
    await importCatalogFromCsv(FIXTURE, fakeUploader);

    const countRows = async () => {
      const productRows = await db
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.slug, ["macetero-terracota", "moldura-clasica"]));
      const variantRows = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          inArray(
            productVariants.productId,
            db.select({ id: products.id }).from(products).where(inArray(products.slug, ["macetero-terracota", "moldura-clasica"]))
          )
        );
      const categoryRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.slug, ["maceteros", "molduras"]));
      return { products: productRows.length, variants: variantRows.length, categories: categoryRows.length };
    };

    const afterFirstRun = await countRows();

    // Second run against the identical CSV must not throw on the unique slug
    // constraint, and must converge to the same row counts (no duplicates).
    const secondResult = await importCatalogFromCsv(FIXTURE, fakeUploader);
    const afterSecondRun = await countRows();

    expect(secondResult.productsImported).toBe(2);
    expect(afterSecondRun).toEqual(afterFirstRun);
  }, 30000);

  it("marks products as in-stock when the export has no inventory-quantity column", async () => {
    // Real Shopify product exports frequently omit the "Variant Inventory Qty"
    // column. Such products must import as available (stock > 0), not as 0/
    // out-of-stock, since stock only drives JSON-LD availability in this phase.
    const noInventoryFixture = path.join(__dirname, "../fixtures/shopify-export-no-inventory.csv");
    const fakeUploader = async (sourceUrl: string) => {
      const filename = sourceUrl.split("/").pop();
      return `https://blob.example/${filename}`;
    };

    const result = await importCatalogFromCsv(noInventoryFixture, fakeUploader);
    expect(result.productsImported).toBe(1);

    const product = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.slug, "macetero-sin-stock"),
    });
    expect(product?.stock).toBeGreaterThan(0);

    const variants = await db.query.productVariants.findMany({
      where: (v, { eq }) => eq(v.productId, product!.id),
    });
    expect(variants).toHaveLength(1);
    expect(variants[0].stock).toBeGreaterThan(0);
  }, 15000);

  it("prices from Variant Price (not SKU) and dedupes variants by option value", async () => {
    // Real Shopify exports carry the price in Variant Price while leaving
    // Variant SKU blank, and flatten a size×option matrix into many priced rows.
    // basePrice must be the first priced row, and variants collapse to distinct
    // option values (Cemento, Negro) rather than one-per-row.
    const dedupFixture = path.join(__dirname, "../fixtures/shopify-export-dedup.csv");
    const fakeUploader = async (sourceUrl: string) => {
      const filename = sourceUrl.split("/").pop();
      return `https://blob.example/${filename}`;
    };

    const result = await importCatalogFromCsv(dedupFixture, fakeUploader);
    expect(result.productsImported).toBe(1);
    expect(result.variantsImported).toBe(2); // Cemento + Negro, not 4 rows

    const product = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.slug, "jardinera-test"),
    });
    expect(Number(product?.basePrice)).toBe(150000); // first priced row, not 0

    const variants = await db.query.productVariants.findMany({
      where: (v, { eq }) => eq(v.productId, product!.id),
    });
    expect(variants.map((v) => v.name).sort()).toEqual(["Cemento", "Negro"]);
  }, 15000);
});
