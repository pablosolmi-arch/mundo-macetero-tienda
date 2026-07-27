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
  "Variant Inventory Qty": string;
  "Image Src": string;
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
        const row = inserted ?? (await db.query.categories.findFirst({ where: eq(categories.slug, categorySlug) }));
        categorySlugToId.set(categorySlug, row!.id);
        categoriesImported += 1;
      }
      categoryId = categorySlugToId.get(categorySlug);
    }

    const sourceImageUrls = [
      ...new Set(groupRows.map((r) => r["Image Src"]?.trim()).filter(Boolean)),
    ];
    const images = await Promise.all(sourceImageUrls.map((url) => uploadImage(url)));

    const variantRows = groupRows.filter((r) => r["Variant SKU"]?.trim());
    const basePrice = variantRows[0]?.["Variant Price"] ?? "0";
    const totalStock = variantRows.reduce(
      (sum, r) => sum + (Number(r["Variant Inventory Qty"]) || 0),
      0
    );

    const [product] = await db
      .insert(products)
      .values({
        slug: handle,
        name: head.Title.trim(),
        description: head["Body (HTML)"]?.trim() ?? "",
        basePrice,
        categoryId,
        images,
        stock: totalStock,
        status: head.Published?.trim().toUpperCase() === "TRUE" ? "active" : "archived",
      })
      .returning();
    productsImported += 1;

    for (const variantRow of variantRows) {
      // Shopify omits Option1 Value for products with no distinct option (single
      // "Default Title" variant); fall back to that convention instead of skipping
      // the row, so every variant row still gets a productVariants record.
      const optionName = variantRow["Option1 Value"]?.trim() || "Default Title";
      await db.insert(productVariants).values({
        productId: product.id,
        name: optionName,
        priceOverride: variantRow["Variant Price"],
        stock: Number(variantRow["Variant Inventory Qty"]) || 0,
      });
      variantsImported += 1;
    }
  }

  return { productsImported, variantsImported, categoriesImported };
}
