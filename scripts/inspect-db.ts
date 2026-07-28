import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const { db } = await import("../db/client");
  const { products, categories, productVariants } = await import("../db/schema");
  const allProducts = await db.select().from(products);
  const allCategories = await db.select().from(categories);
  const allVariants = await db.select().from(productVariants);

  console.log("PRODUCTS:", allProducts.length);
  console.log("CATEGORIES:", allCategories.length, "->", allCategories.map((c) => c.name).join(" | "));
  console.log("VARIANTS:", allVariants.length);

  const zeroPrice = allProducts.filter((p) => Number(p.basePrice) === 0);
  console.log("PRODUCTS WITH basePrice 0:", zeroPrice.length, zeroPrice.map((p) => p.slug).join(", "));

  const noImages = allProducts.filter((p) => !p.images || p.images.length === 0);
  console.log("PRODUCTS WITH NO IMAGES:", noImages.length, noImages.map((p) => p.slug).join(", "));

  const active = allProducts.filter((p) => p.status === "active");
  console.log("ACTIVE:", active.length, "| ARCHIVED:", allProducts.length - active.length);

  console.log("\nSAMPLE (first 5):");
  for (const p of allProducts.slice(0, 5)) {
    console.log(
      `  ${p.slug} | "${p.name}" | $${p.basePrice} | stock ${p.stock} | ${p.images?.length ?? 0} imgs | cat ${p.categoryId ?? "none"} | ${p.status}`
    );
    console.log(`     img0: ${p.images?.[0] ?? "(none)"}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
