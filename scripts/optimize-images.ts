// scripts/optimize-images.ts
//
// Re-encodes every image the storefront serves. The originals came straight from
// Shopify at full camera resolution: 1.4 MB on average, up to 4.3 MB, so a single
// product page pulled around 11 MB of photos. Nothing on the site displays an
// image wider than ~1200 CSS pixels.
//
// Each image is resized to a sane maximum, converted to WebP, re-uploaded under
// `opt/`, and the reference is rewritten (products.images in the database,
// content/images.ts for the site photography). URLs already under `opt/` are
// skipped, so the script is safe to re-run.
//
// Usage:
//   npx tsx scripts/optimize-images.ts            # dry run: reports sizes only
//   npx tsx scripts/optimize-images.ts --apply    # writes

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");

// Widths chosen from the actual layout: the product gallery is the largest at
// ~600 CSS px, doubled for retina. Hero banners span the full viewport.
const ANCHO_CATALOGO = 1200;
const ANCHO_HERO = 1800;
const CALIDAD = 78;

function esOptimizada(url: string): boolean {
  return url.includes("/opt/");
}

function nombre(url: string, ancho: number): string {
  const base = (url.split("/").pop() ?? "img")
    .replace(/\.\w+$/, "")
    .replace(/-[A-Za-z0-9]{20,}$/, "") // quita el sufijo aleatorio de Blob
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-60);
  return `opt/${base}-${ancho}.webp`;
}

interface Resultado {
  url: string;
  antes: number;
  despues: number;
}

async function optimizar(
  url: string,
  ancho: number,
  put: typeof import("@vercel/blob").put,
  sharp: typeof import("sharp").default,
): Promise<Resultado | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  ! ${url.split("/").pop()?.slice(0, 40)} → HTTP ${res.status}`);
    return null;
  }
  const original = Buffer.from(await res.arrayBuffer());

  const optimizada = await sharp(original)
    .rotate() // respeta la orientación EXIF antes de redimensionar
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: CALIDAD })
    .toBuffer();

  if (!APPLY) {
    return { url, antes: original.length, despues: optimizada.length };
  }

  const blob = await put(nombre(url, ancho), optimizada, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/webp",
  });
  return { url: blob.url, antes: original.length, despues: optimizada.length };
}

async function main() {
  const { put } = await import("@vercel/blob");
  const sharp = (await import("sharp")).default;
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../db/client");
  const { products } = await import("../db/schema");

  let antes = 0;
  let despues = 0;
  let hechas = 0;
  let saltadas = 0;

  // 1. Catálogo
  const filas = await db.query.products.findMany();
  for (const producto of filas) {
    const nuevas: string[] = [];
    let cambio = false;
    for (const img of producto.images) {
      if (esOptimizada(img)) {
        nuevas.push(img);
        saltadas += 1;
        continue;
      }
      const r = await optimizar(img, ANCHO_CATALOGO, put, sharp);
      if (!r) {
        nuevas.push(img);
        continue;
      }
      antes += r.antes;
      despues += r.despues;
      hechas += 1;
      nuevas.push(r.url);
      cambio = true;
    }
    if (cambio && APPLY) {
      await db.update(products).set({ images: nuevas }).where(eq(products.id, producto.id));
    }
    if (cambio) {
      console.log(`  ${producto.slug.padEnd(40)} ${producto.images.length} imágenes`);
    }
  }

  // 2. Fotografía del sitio
  const ruta = "content/images.ts";
  let fuente = readFileSync(ruta, "utf8");
  const urls = [...fuente.matchAll(/"(https:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const url of urls) {
    if (esOptimizada(url)) {
      saltadas += 1;
      continue;
    }
    // Los banners de portada se ven a todo el ancho; el resto en tarjetas.
    const ancho = fuente.indexOf(url) < fuente.indexOf("PROYECTOS_IMGS") ? ANCHO_HERO : ANCHO_CATALOGO;
    const r = await optimizar(url, ancho, put, sharp);
    if (!r) continue;
    antes += r.antes;
    despues += r.despues;
    hechas += 1;
    if (APPLY) fuente = fuente.replace(url, r.url);
  }
  if (APPLY) writeFileSync(ruta, fuente);

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + "MB";
  console.log(
    `\n${APPLY ? "APLICADO" : "SIMULACIÓN"}: ${hechas} imágenes (${saltadas} ya optimizadas)\n` +
      `  antes:   ${mb(antes)}\n  después: ${mb(despues)}\n` +
      `  ahorro:  ${antes > 0 ? Math.round(100 - (despues / antes) * 100) : 0}%`,
  );
  if (!APPLY) console.log("\nVuelve a correr con --apply para escribir.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Falló la optimización:", error instanceof Error ? error.message : error);
  process.exit(1);
});
