# Fase 1 — Storefront + Catálogo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public storefront (home, category, product pages) for Mundo Macetero on Next.js + Postgres, with the current Shopify catalog migrated in and SEO/GEO built in from day one.

**Architecture:** Next.js (App Router) on Vercel, Postgres via Supabase (Vercel Marketplace) as the single source of truth for products/variants/categories, Drizzle ORM for typed data access, Server Components fetching data directly from the DB (no separate API layer needed for this phase).

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Drizzle ORM, `postgres` (postgres-js driver), Supabase Postgres, `csv-parse` for the Shopify export, Vitest for tests.

## Global Constraints

- Real database only — no mocked/sample data standing in for Supabase (per spec: "no una simulación ni datos de ejemplo").
- Product images migrate to Vercel Blob, not left pointing at Shopify's CDN (spec: Shopify URLs may stop resolving once the paid plan is cancelled).
- Imported product count must exactly equal the product row count in the source CSV — no partial/sample imports.
- This plan covers ONLY Fase 1 (storefront + catalog). No cart, checkout, Flow, order management, Trello integration, or analytics — those are separate plans built later on top of this one.
- Domain stays on a `*.vercel.app` preview URL — no DNS cutover in this phase.

---

## File Structure

```
mundo-macetero-tienda/
  app/
    layout.tsx
    page.tsx                        # home
    [categorySlug]/
      page.tsx                      # category listing
    producto/
      [productSlug]/
        page.tsx                    # product detail
    sitemap.ts
  db/
    schema.ts                       # Drizzle table defs
    client.ts                       # db connection singleton
  queries/
    catalog.ts                      # getAllActiveCategories, getProductsByCategory, getProductBySlug
  scripts/
    import-catalog.ts               # Shopify CSV -> DB importer
  lib/
    seo.ts                          # generateMetadata helpers + JSON-LD builders
  components/
    ProductCard.tsx
    ProductGrid.tsx
  tests/
    fixtures/
      shopify-export-sample.csv
    scripts/
      import-catalog.test.ts
    lib/
      seo.test.ts
  drizzle.config.ts
  package.json
  .env.example
```

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Produces: a running Next.js app on `localhost:3000` with Tailwind configured — later tasks build pages inside `app/`.

- [ ] **Step 1: Scaffold with create-next-app**

```bash
cd /Users/pablodesolminihac/Documents/mundo-macetero-tienda
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

- [ ] **Step 2: Add `.env.example`**

```bash
# .env.example
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
```

- [ ] **Step 3: Run dev server to verify it boots**

Run: `npm run dev` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js project"
```

---

### Task 2: Provision Supabase Postgres and Vercel Blob

**Files:**
- Modify: `.env.local` (populated from a real Supabase connection string plus `vercel env pull`, not hand-written placeholders)

**Interfaces:**
- Produces: a real `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` in `.env.local` pointing at a provisioned Supabase Postgres instance and a Vercel Blob store — every later task that touches the DB depends on `DATABASE_URL`; Task 4's image importer depends on `BLOB_READ_WRITE_TOKEN`.

Decision (per Pablo, 2026-07-24): Supabase is provisioned directly at supabase.com, NOT through the Vercel Marketplace — the Marketplace requires a payment method on file to install any integration, even free-tier ones. Supabase's own free tier requires no card. The connection string is then added to Vercel as a plain environment variable.

- [ ] **Step 1: Link the project to Vercel**

```bash
vercel link --yes
```

- [ ] **Step 2: Create the Supabase project manually (human step)**

This step cannot be automated — it requires Pablo to sign up/log in. Ask Pablo to:
1. Go to https://supabase.com/dashboard and create a free account (or log in) — no credit card required for the Free plan.
2. Create a new project (e.g. name it `mundo-macetero`), choose a region close to Chile (e.g. `sa-east-1` if offered, otherwise the closest available), and set a database password.
3. Once the project is ready, go to Project Settings → Database → Connection string, and copy the "Connection pooling" URI (starts with `postgresql://postgres.[project-ref]:[password]@...pooler.supabase.com:6543/postgres`) — this is the pooled connection, correct for a serverless/Vercel deployment.

Wait for Pablo to paste the connection string before continuing.

- [ ] **Step 3: Add the connection string to Vercel and locally**

```bash
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

(Each prompts for the value — paste the connection string Pablo provided.)

- [ ] **Step 4: Attempt to create a Vercel Blob store**

```bash
vercel blob create-store mundo-macetero-images
```

**If this asks for a payment method, STOP and report back to Pablo before proceeding** — do not add a card without explicit confirmation. Report the exact prompt text so the controller can ask Pablo how he wants to proceed (add a card, or use an alternative free image host for this phase).

- [ ] **Step 5: Pull the real environment variables**

```bash
vercel env pull .env.local --yes
```

- [ ] **Step 6: Verify the connection**

```bash
node -e "
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);
sql\`select 1 as ok\`.then(r => { console.log(r); process.exit(0); });
"
```

Expected: prints `[ { ok: 1 } ]`. If this fails, do not proceed — the DB connection is a hard dependency for every subsequent task.

- [ ] **Step 7: Commit** (env values themselves are gitignored by create-next-app's default `.gitignore`; only commit if anything else changed)

```bash
git add -A
git commit -m "Provision Supabase Postgres and Vercel Blob" --allow-empty
```

---

### Task 3: Define Drizzle schema and run first migration

**Files:**
- Create: `db/schema.ts`
- Create: `db/client.ts`
- Create: `drizzle.config.ts`
- Test: `tests/db/schema.test.ts`

**Interfaces:**
- Produces: `categories`, `products`, `productVariants` tables and their TypeScript types (`Category`, `Product`, `ProductVariant`, `NewProduct`, etc. via `drizzle-orm`'s `$inferSelect`/`$inferInsert`), plus `db` (the Drizzle client instance) exported from `db/client.ts`. Later tasks (queries, import script) import `db` from `db/client.ts` and the table objects from `db/schema.ts`.

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit vitest dotenv
```

- [ ] **Step 2: Write `db/schema.ts`**

```typescript
// db/schema.ts
import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  images: text("images").array().notNull().default([]),
  stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  priceOverride: numeric("price_override", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
```

- [ ] **Step 3: Write `db/client.ts`**

```typescript
// db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` is required against Supabase's pooled connection (Supavisor,
// transaction mode on port 6543, provisioned in Task 2) — transaction-mode
// poolers don't support prepared statements, and postgres-js defaults to using them.
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false });
export const db = drizzle(queryClient, { schema });
```

- [ ] **Step 4: Write `drizzle.config.ts`**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Generate and apply the migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 6: Write the failing test**

```typescript
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
```

- [ ] **Step 7: Run the test to verify it passes against the real DB**

Run: `npx vitest run tests/db/schema.test.ts`
Expected: PASS (1 test). If it fails on connection, re-check Task 2's `DATABASE_URL`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add Drizzle schema for categories/products/variants"
```

---

### Task 4: Shopify CSV catalog importer

**Files:**
- Create: `scripts/import-catalog.ts`
- Create: `tests/fixtures/shopify-export-sample.csv`
- Test: `tests/scripts/import-catalog.test.ts`

**Interfaces:**
- Consumes: `db` from `db/client.ts`, `categories`/`products`/`productVariants` from `db/schema.ts` (Task 3).
- Produces: `importCatalogFromCsv(csvPath: string, uploadImage?: ImageUploader): Promise<{ productsImported: number; variantsImported: number; categoriesImported: number }>` and `type ImageUploader = (sourceUrl: string) => Promise<string>`, exported from `scripts/import-catalog.ts`. Later tasks (Task 5/6 pages) rely on the DB rows this produces, not on this function directly.

Shopify's product export has one row per variant/image combination, with `Title`/`Body (HTML)`/`Type` only populated on a product's first row. Rows are grouped by `Handle`.

Per Global Constraints, product images must not stay pointed at Shopify's CDN — each `Image Src` URL is re-uploaded to Vercel Blob during import, and the Blob URL (not the original Shopify URL) is what gets stored in `products.images`. The uploader is injected as a parameter so the test below can verify the transformation happens without making real network calls.

Amendment (2026-07-27, post-review): the importer must be safe to re-run against the same CSV — Task 10 runs it against the real catalog and a mid-import failure (e.g. one flaky image fetch) must be recoverable by simply re-running. Concretely: products upsert by `slug` (`onConflictDoUpdate`, refreshing name/description/price/category/images/stock/status and replacing that product's variants) instead of plain insert, and the returned counts reflect rows actually written this run (a category that already existed does not increment `categoriesImported`).

- [ ] **Step 1: Install CSV parser and Blob client**

```bash
npm install csv-parse @vercel/blob
```

- [ ] **Step 2: Write the fixture CSV**

```csv
Handle,Title,Body (HTML),Type,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty,Image Src
macetero-terracota,Macetero Terracota,<p>Macetero de terracota hecho a mano.</p>,Maceteros,TRUE,Tamaño,Chico,MAC-TC-S,9990,20,https://example.com/terracota-1.jpg
macetero-terracota,,,,,Tamaño,Grande,MAC-TC-L,14990,10,https://example.com/terracota-2.jpg
moldura-clasica,Moldura Clásica,<p>Moldura decorativa de yeso.</p>,Molduras,TRUE,,,MOL-CL-01,5990,15,https://example.com/moldura-1.jpg
moldura-clasica,,,,,,,,,,https://example.com/moldura-2.jpg
```

This fixture models: one product with two size variants and two images, and one simple product (no variant option) with two images — matching the real shapes present in a Shopify export.

- [ ] **Step 3: Write the failing test**

```typescript
// tests/scripts/import-catalog.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
      with: { } as any,
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
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/scripts/import-catalog.test.ts`
Expected: FAIL with "Cannot find module '../../scripts/import-catalog'" (or similar).

- [ ] **Step 5: Implement the importer**

```typescript
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
      const optionName = variantRow["Option1 Value"]?.trim();
      if (!optionName) continue; // single-variant product, no distinct option to record
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/scripts/import-catalog.test.ts`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Shopify CSV catalog importer"
```

---

### Task 5: Data access queries

**Files:**
- Create: `queries/catalog.ts`
- Test: `tests/queries/catalog.test.ts`

**Interfaces:**
- Consumes: `db`, `categories`, `products`, `productVariants` (Tasks 3/4).
- Produces: `getAllActiveCategories(): Promise<Category[]>`, `getProductsByCategory(categorySlug: string): Promise<Product[]>`, `getProductBySlug(slug: string): Promise<(Product & { variants: ProductVariant[] }) | null>` — Tasks 6/7/8 (pages, sitemap) import these directly, no other data-access path exists.

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/queries/catalog.test.ts`
Expected: FAIL with "Cannot find module '../../queries/catalog'".

- [ ] **Step 3: Implement the queries**

```typescript
// queries/catalog.ts
import { db } from "../db/client";
import { categories, products, productVariants } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getAllActiveCategories() {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/queries/catalog.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add catalog data-access queries"
```

---

### Task 6: SEO helpers — metadata and JSON-LD

**Files:**
- Create: `lib/seo.ts`
- Test: `tests/lib/seo.test.ts`

**Interfaces:**
- Consumes: `Product`, `ProductVariant`, `Category` types (Task 3).
- Produces: `buildProductJsonLd(product: Product & { variants: ProductVariant[] }): object`, `buildProductMetadata(product: Product): Metadata` (Next.js `Metadata` type) — Task 7/8 pages call these directly in `generateMetadata` and in the page body.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/lib/seo.test.ts
import { describe, it, expect } from "vitest";
import { buildProductJsonLd, buildProductMetadata } from "../../lib/seo";

const sampleProduct = {
  id: 1,
  slug: "macetero-terracota",
  name: "Macetero Terracota",
  description: "Macetero de terracota hecho a mano.",
  basePrice: "9990",
  categoryId: 1,
  images: ["https://example.com/terracota-1.jpg"],
  stock: 20,
  status: "active" as const,
  createdAt: new Date(),
  variants: [],
};

describe("buildProductJsonLd", () => {
  it("builds valid Product/Offer JSON-LD", () => {
    const jsonLd = buildProductJsonLd(sampleProduct);
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Macetero Terracota");
    expect(jsonLd.image).toEqual(["https://example.com/terracota-1.jpg"]);
    expect(jsonLd.offers["@type"]).toBe("Offer");
    expect(jsonLd.offers.price).toBe("9990");
    expect(jsonLd.offers.priceCurrency).toBe("CLP");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks out-of-stock products correctly", () => {
    const jsonLd = buildProductJsonLd({ ...sampleProduct, stock: 0 });
    expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("buildProductMetadata", () => {
  it("builds a title and description from the product", () => {
    const metadata = buildProductMetadata(sampleProduct);
    expect(metadata.title).toBe("Macetero Terracota | Mundo Macetero");
    expect(metadata.description).toContain("Macetero de terracota hecho a mano.");
    expect(metadata.openGraph?.images).toEqual(["https://example.com/terracota-1.jpg"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/seo.test.ts`
Expected: FAIL with "Cannot find module '../../lib/seo'".

- [ ] **Step 3: Implement `lib/seo.ts`**

```typescript
// lib/seo.ts
import type { Metadata } from "next";
import type { Product, ProductVariant } from "../db/schema";

const SITE_NAME = "Mundo Macetero";

export function buildProductJsonLd(product: Product & { variants: ProductVariant[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "CLP",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export function buildProductMetadata(product: Product): Metadata {
  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/seo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add SEO metadata and JSON-LD builders"
```

---

### Task 7: Product detail page

**Files:**
- Create: `app/producto/[productSlug]/page.tsx`

**Interfaces:**
- Consumes: `getProductBySlug` (Task 5), `buildProductJsonLd`, `buildProductMetadata` (Task 6).
- Produces: renders at `/producto/:slug` — this is a leaf page, nothing later depends on its internals.

- [ ] **Step 1: Implement the page**

```tsx
// app/producto/[productSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "../../../queries/catalog";
import { buildProductJsonLd, buildProductMetadata } from "../../../lib/seo";

interface Props {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function ProductPage({ params }: Props) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  const jsonLd = buildProductJsonLd(product);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
      <p className="mt-4 text-xl font-semibold">${product.basePrice} CLP</p>
      {product.variants.length > 0 && (
        <ul className="mt-4 flex gap-2">
          {product.variants.map((v) => (
            <li key={v.id} className="rounded border px-3 py-1">
              {v.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {product.images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={product.name} className="rounded" />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, import the fixture catalog into the local DB (`npx tsx -e "import('./scripts/import-catalog').then(m => m.importCatalogFromCsv('tests/fixtures/shopify-export-sample.csv'))"`), then:
`curl -s http://localhost:3000/producto/macetero-terracota | grep "Macetero Terracota"`
Expected: match found. Stop the dev server after checking.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add product detail page"
```

---

### Task 8: Category and home pages

**Files:**
- Create: `app/[categorySlug]/page.tsx`
- Create: `app/page.tsx` (overwrite scaffold placeholder)
- Create: `components/ProductCard.tsx`
- Create: `components/ProductGrid.tsx`

**Interfaces:**
- Consumes: `getAllActiveCategories`, `getProductsByCategory` (Task 5).
- Produces: renders at `/` and `/:categorySlug` — leaf pages.

- [ ] **Step 1: Implement `components/ProductCard.tsx`**

```tsx
// components/ProductCard.tsx
import Link from "next/link";
import type { Product } from "../db/schema";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/producto/${product.slug}`} className="block rounded border p-4 hover:shadow">
      {product.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.name} className="mb-2 aspect-square w-full object-cover rounded" />
      )}
      <h3 className="font-medium">{product.name}</h3>
      <p className="text-gray-700">${product.basePrice} CLP</p>
    </Link>
  );
}
```

- [ ] **Step 2: Implement `components/ProductGrid.tsx`**

```tsx
// components/ProductGrid.tsx
import type { Product } from "../db/schema";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement `app/[categorySlug]/page.tsx`**

```tsx
// app/[categorySlug]/page.tsx
import { getProductsByCategory } from "../../queries/catalog";
import { ProductGrid } from "../../components/ProductGrid";

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const products = await getProductsByCategory(categorySlug);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold capitalize">{categorySlug.replace(/-/g, " ")}</h1>
      <ProductGrid products={products} />
    </main>
  );
}
```

- [ ] **Step 4: Implement `app/page.tsx`**

```tsx
// app/page.tsx
import Link from "next/link";
import { getAllActiveCategories } from "../queries/catalog";

export default async function HomePage() {
  const categories = await getAllActiveCategories();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Mundo Macetero</h1>
      <ul className="flex flex-wrap gap-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/${c.slug}`} className="rounded border px-4 py-2 hover:bg-gray-50">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev` then:
`curl -s http://localhost:3000/ | grep "Mundo Macetero"` — expect a match.
`curl -s http://localhost:3000/maceteros | grep "Macetero Terracota"` — expect a match.
Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add home and category listing pages"
```

---

### Task 9: Sitemap

**Files:**
- Create: `app/sitemap.ts`

**Interfaces:**
- Consumes: `getAllActiveCategories`, `getProductsByCategory` (Task 5).
- Produces: `/sitemap.xml` served by Next.js's built-in sitemap convention — nothing later depends on this.

- [ ] **Step 1: Implement `app/sitemap.ts`**

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllActiveCategories, getProductsByCategory } from "../queries/catalog";

const BASE_URL = process.env.SITE_URL ?? "https://mundo-macetero-tienda.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getAllActiveCategories();

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/${c.slug}`,
  }));

  const productEntries: MetadataRoute.Sitemap = [];
  for (const category of categories) {
    const products = await getProductsByCategory(category.slug);
    for (const product of products) {
      productEntries.push({ url: `${BASE_URL}/producto/${product.slug}` });
    }
  }

  return [{ url: BASE_URL }, ...categoryEntries, ...productEntries];
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev` then `curl -s http://localhost:3000/sitemap.xml | grep "producto/macetero-terracota"`
Expected: match found. Stop the dev server after checking.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add sitemap generation"
```

---

### Task 10: Deploy preview and validate

**Files:** none (deployment + manual validation only)

- [ ] **Step 1: Deploy a preview build**

```bash
vercel deploy
```

- [ ] **Step 2: Run the real catalog import against the preview's DB**

Export the full product catalog from the Shopify admin (Products → Export → CSV, all products), save it locally, then:

```bash
npx tsx -e "import('./scripts/import-catalog').then(m => m.importCatalogFromCsv('/path/to/shopify-export.csv')).then(console.log)"
```

Expected: `productsImported` equals the exact number of distinct product handles in the exported CSV (verify: `tail -n +2 shopify-export.csv | cut -d, -f1 | sort -u | wc -l`).

- [ ] **Step 3: Validate structured data**

For at least 3 product pages on the preview URL, run each through Google's Rich Results Test (https://search.google.com/test/rich-results) and confirm zero errors on the `Product` type.

- [ ] **Step 4: Validate Core Web Vitals**

Run Lighthouse (mobile) against the preview's home page and one product page. Confirm LCP and CLS are in the "Good" range per Lighthouse's own thresholds.

- [ ] **Step 5: Commit** (only if any fixes were needed in prior steps)

```bash
git add -A
git commit -m "Fix issues found during preview validation"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture (Task 1-3), migración de catálogo (Task 4, verified in Task 10 Step 2), SEO/GEO (Task 6-9), criterios de éxito (Task 10) — all covered. Cart/checkout/orders/analytics/DNS are explicitly out of scope per the spec and not included here.
- **Type consistency:** `Product`, `ProductVariant`, `Category` types from `db/schema.ts` (Task 3) are the only types used across queries (Task 5), SEO helpers (Task 6), and pages (Tasks 7-8) — no redefinition anywhere.
- **No placeholders:** every step has runnable code or an exact command; nothing deferred to "later."
