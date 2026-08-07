// scripts/import-variants.ts
//
// Rebuilds product options and variant combinations from the live Shopify store's
// public catalog (https://mundomacetero.cl/products.json).
//
// Why this exists: the original CSV import collapsed every product to a single
// option axis, keeping the first value seen per option. That removed colour,
// drainage and double-bottom choices from 13 of 23 products — "Jardineras" went
// from 92 sellable combinations to 3 — so the storefront could not sell what the
// current store sells.
//
// What it does NOT touch: images (already uploaded to Vercel Blob; the Shopify CDN
// URLs would be re-downloaded for nothing) and categories.
//
// Usage:
//   npx tsx scripts/import-variants.ts            # dry run, prints the diff
//   npx tsx scripts/import-variants.ts --apply    # writes

// dotenv runs before the database module is loaded: a static import would be
// hoisted and evaluate db/client.ts (which reads DATABASE_URL at load time)
// before the env file has been read. Same pattern as scripts/run-import.ts.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const SOURCE = process.env.SHOPIFY_CATALOG_URL ?? "https://mundomacetero.cl/products.json?limit=250";
const APPLY = process.argv.includes("--apply");

interface ShopifyOption {
  name: string;
  position: number;
  values: string[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  available: boolean;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  body_html: string | null;
  options: ShopifyOption[];
  variants: ShopifyVariant[];
}

// Shopify emits a single option named "Title" with the value "Default Title" for
// products sold in one configuration. That is a placeholder, not a real choice.
function realOptions(p: ShopifyProduct): ShopifyOption[] {
  return p.options.filter(
    (o) => !(o.name === "Title" && o.values.length === 1 && o.values[0] === "Default Title"),
  );
}

async function main() {
  const { eq, inArray } = await import("drizzle-orm");
  const { db } = await import("../db/client");
  const { products, productVariants, orderItems } = await import("../db/schema");

  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`No se pudo leer el catálogo (${res.status})`);
  const payload = (await res.json()) as { products: ShopifyProduct[] };
  const bySlug = new Map(payload.products.map((p) => [p.handle, p]));

  const existing = await db.query.products.findMany();
  let changedProducts = 0;
  let totalVariantsBefore = 0;
  let totalVariantsAfter = 0;

  for (const product of existing) {
    const source = bySlug.get(product.slug);
    if (!source) {
      console.log(`- ${product.slug}: no está en el catálogo de origen, se deja igual`);
      continue;
    }

    const options = realOptions(source);
    const optionNames = options.map((o) => o.name);
    const current = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, product.id),
    });
    totalVariantsBefore += current.length;
    totalVariantsAfter += source.variants.length;

    const prices = source.variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n) && n > 0);
    const basePrice = prices.length ? Math.min(...prices) : Number(product.basePrice);
    const description =
      (product.description ?? "").trim() || (source.body_html ?? "").trim();

    const grows = source.variants.length !== current.length;
    if (grows || optionNames.length > 0) changedProducts += 1;
    console.log(
      `${grows ? "*" : " "} ${product.slug.padEnd(40)} ${String(current.length).padStart(3)} → ${String(
        source.variants.length,
      ).padStart(3)} variantes  [${optionNames.join(" + ") || "sin opciones"}]`,
    );

    if (!APPLY) continue;

    // Order lines keep their own snapshot of product name, variant name and price,
    // so dropping the foreign key here loses nothing that a customer or the shop
    // needs to read the order back.
    if (current.length > 0) {
      const ids = current.map((v) => v.id);
      await db
        .update(orderItems)
        .set({ variantId: null })
        .where(inArray(orderItems.variantId, ids));
      await db.delete(productVariants).where(eq(productVariants.productId, product.id));
    }

    if (source.variants.length > 0) {
      await db.insert(productVariants).values(
        source.variants.map((v) => ({
          productId: product.id,
          name: v.title,
          option1: v.option1,
          option2: v.option2,
          option3: v.option3,
          priceOverride: String(Number(v.price)),
          // The source exposes availability, not a quantity.
          stock: v.available ? 1 : 0,
          available: v.available,
        })),
      );
    }

    await db
      .update(products)
      .set({ optionNames, basePrice: String(basePrice), description, name: source.title })
      .where(eq(products.id, product.id));
  }

  console.log(
    `\n${APPLY ? "APLICADO" : "SIMULACIÓN"}: ${changedProducts} productos afectados, ` +
      `${totalVariantsBefore} → ${totalVariantsAfter} variantes en total.`,
  );
  if (!APPLY) console.log("Vuelve a correr con --apply para escribir.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Falló la importación:", error instanceof Error ? error.message : error);
  process.exit(1);
});
