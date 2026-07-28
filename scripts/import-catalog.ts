// scripts/import-catalog.ts
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { put } from "@vercel/blob";
import { db } from "../db/client";
import { categories, products, productVariants } from "../db/schema";
import { eq } from "drizzle-orm";

export type ImageUploader = (sourceUrl: string) => Promise<string>;

export async function uploadImageToBlob(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image ${sourceUrl}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const filename = sourceUrl.split("/").pop() ?? `image-${Date.now()}`;
  const blob = await put(filename, Buffer.from(buffer), {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

interface ShopifyCsvRow {
  Handle: string;
  Title: string;
  "Body (HTML)": string;
  Type: string;
  Published: string;
  "Option1 Name": string;
  "Option1 Value": string;
  "Variant SKU": string;
  "Variant Price": string;
  // Optional: Shopify's product export doesn't always include this column.
  "Variant Inventory Qty"?: string;
  "Image Src": string;
}

// Used as product/variant stock when the CSV carries no inventory quantities at
// all. Arbitrary positive value: it is never displayed as a count in this phase,
// it only makes JSON-LD report the product as InStock (see parseQty usage).
const DEFAULT_STOCK_WHEN_UNKNOWN = 100;

// Returns the numeric quantity, or null when the cell is missing, blank, or
// non-numeric — letting callers distinguish "no inventory data" from a real 0.
function parseQty(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function importCatalogFromCsv(
  csvPath: string,
  uploadImage: ImageUploader = uploadImageToBlob
) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows: ShopifyCsvRow[] = parse(raw, { columns: true, skip_empty_lines: true });

  const byHandle = new Map<string, ShopifyCsvRow[]>();
  for (const row of rows) {
    const group = byHandle.get(row.Handle) ?? [];
    group.push(row);
    byHandle.set(row.Handle, group);
  }

  const categorySlugToId = new Map<string, number>();
  let categoriesImported = 0;
  let productsImported = 0;
  let variantsImported = 0;

  for (const [handle, groupRows] of byHandle) {
    const head = groupRows.find((r) => r.Title?.trim()) ?? groupRows[0];
    const categoryName = head.Type?.trim();
    let categoryId: number | undefined;

    if (categoryName) {
      const categorySlug = slugify(categoryName);
      if (!categorySlugToId.has(categorySlug)) {
        const [inserted] = await db
          .insert(categories)
          .values({ slug: categorySlug, name: categoryName })
          .onConflictDoNothing({ target: categories.slug })
          .returning();
        // `inserted` is undefined when onConflictDoNothing no-oped (category
        // already existed) — only count categories actually written this run.
        const row = inserted ?? (await db.query.categories.findFirst({ where: eq(categories.slug, categorySlug) }));
        categorySlugToId.set(categorySlug, row!.id);
        if (inserted) {
          categoriesImported += 1;
        }
      }
      categoryId = categorySlugToId.get(categorySlug);
    }

    const sourceImageUrls = [
      ...new Set(groupRows.map((r) => r["Image Src"]?.trim()).filter(Boolean)),
    ];
    const images = await Promise.all(sourceImageUrls.map((url) => uploadImage(url)));

    // A "variant row" is any row carrying a Variant Price. We deliberately do
    // NOT key off Variant SKU: real Shopify exports frequently leave SKU blank
    // on every row while still carrying prices, and keying off SKU left 24/25
    // products at price 0. Image-only extra rows have a blank Variant Price and
    // are correctly excluded here.
    const variantRows = groupRows.filter((r) => r["Variant Price"]?.trim());
    // Base ("from") price = the first priced row for the handle.
    const basePrice = variantRows[0]?.["Variant Price"] ?? "0";

    // Shopify's standard product export does NOT always include a
    // "Variant Inventory Qty" column (inventory is often exported separately).
    // parseQty returns null for a missing/blank/non-numeric cell — distinct from
    // a genuine 0 — so we can tell "no inventory data" apart from "zero stock".
    const parsedQtys = variantRows.map((r) => parseQty(r["Variant Inventory Qty"]));
    const hasAnyQty = parsedQtys.some((q) => q !== null);
    // When the export carries no quantities at all, treat the product as
    // available rather than out-of-stock: stock is never shown as a number in
    // this phase, it only drives JSON-LD InStock/OutOfStock, and a live catalog
    // that's actively selling should default to available.
    const fallbackStock = hasAnyQty ? 0 : DEFAULT_STOCK_WHEN_UNKNOWN;
    const totalStock = hasAnyQty
      ? parsedQtys.reduce<number>((sum, q) => sum + (q ?? 0), 0)
      : DEFAULT_STOCK_WHEN_UNKNOWN;

    const productValues = {
      slug: handle,
      name: head.Title.trim(),
      description: head["Body (HTML)"]?.trim() ?? "",
      basePrice,
      categoryId,
      images,
      stock: totalStock,
      status: head.Published?.trim().toUpperCase() === "TRUE" ? "active" : "archived",
    };

    // Upsert by slug so re-running the importer against the same CSV (e.g. Task
    // 10 retrying after a mid-import failure) converges to the CSV's state
    // instead of throwing on the unique `slug` constraint or duplicating rows.
    const [product] = await db
      .insert(products)
      .values(productValues)
      .onConflictDoUpdate({
        target: products.slug,
        set: productValues,
      })
      .returning();
    // Every handle in the CSV results in a write (insert or update), so this
    // always increments — the invariant Task 10 relies on is that, after a
    // successful run, productsImported equals the number of distinct handles.
    productsImported += 1;

    // Replace this product's variants wholesale on every run: delete whatever
    // is there, then re-insert from the CSV. This keeps variants convergent
    // across re-runs (no duplicates) without having to diff old vs. new rows.
    // Not wrapped in a transaction: a crash between delete and reinsert leaves
    // this product with zero variants until the next run, which self-heals it.
    await db.delete(productVariants).where(eq(productVariants.productId, product.id));

    // Deduplicate variants by their Option1 Value. A Shopify export flattens a
    // size×color matrix into one priced row per combination (e.g. "jardineras"
    // has 92 priced rows that are really just 3 finishes across many sizes).
    // Storing one variant per row would list 92 near-identical option pills;
    // collapsing to distinct option values gives a clean, meaningful variant
    // list for this catalog-display phase (size selection is a Fase 2 concern).
    // Option1 Value blank (single-variant product) falls back to "Default Title".
    const seenVariants = new Map<string, { price: string; stock: number }>();
    for (const variantRow of variantRows) {
      const optionName = variantRow["Option1 Value"]?.trim() || "Default Title";
      if (seenVariants.has(optionName)) continue;
      seenVariants.set(optionName, {
        price: variantRow["Variant Price"],
        stock: parseQty(variantRow["Variant Inventory Qty"]) ?? fallbackStock,
      });
    }
    for (const [name, { price, stock }] of seenVariants) {
      await db.insert(productVariants).values({
        productId: product.id,
        name,
        priceOverride: price,
        stock,
      });
      variantsImported += 1;
    }
  }

  return { productsImported, variantsImported, categoriesImported };
}
