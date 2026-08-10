// scripts/make-thumbs.ts
//
// Genera una versión de 600 px de cada imagen ya optimizada y la guarda en
// products.thumbs (mismo orden que products.images) y en content/thumbs.ts para
// la fotografía del sitio.
//
// Por qué: las tarjetas de producto se ven a 235-262 px, los mosaicos de
// categoría a 190 px y la tira de proyectos a 340 px. Servirles el archivo de
// 1200 px hacía que la portada pesara 3,9 MB con 39 imágenes.
//
// El hero no se toca: ocupa todo el ancho de la pantalla.
//
// Uso:
//   npx tsx scripts/make-thumbs.ts            # simulación
//   npx tsx scripts/make-thumbs.ts --apply    # escribe

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const ANCHO = 600;
const CALIDAD = 76;
// La galería de la ficha muestra hasta 8 miniaturas; más allá de eso nadie las ve.
const MAX_POR_PRODUCTO = 8;

function nombre(url: string): string {
  const base = (url.split("/").pop() ?? "img")
    .replace(/\.\w+$/, "")
    .replace(/-[A-Za-z0-9]{20,}$/, "")
    .replace(/-1200$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-56);
  return `thumb/${base}-${ANCHO}.webp`;
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

  async function thumb(url: string): Promise<string | null> {
    const res = await fetch(url);
    if (!res.ok) return null;
    const original = Buffer.from(await res.arrayBuffer());
    const chica = await sharp(original)
      .resize({ width: ANCHO, withoutEnlargement: true })
      .webp({ quality: CALIDAD })
      .toBuffer();
    antes += original.length;
    despues += chica.length;
    hechas += 1;
    if (!APPLY) return url;
    const blob = await put(nombre(url), chica, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    });
    return blob.url;
  }

  // 1. Catálogo
  for (const producto of await db.query.products.findMany()) {
    if (producto.thumbs.length >= Math.min(producto.images.length, MAX_POR_PRODUCTO)) {
      continue; // ya tiene miniaturas
    }
    const thumbs: string[] = [];
    for (const img of producto.images.slice(0, MAX_POR_PRODUCTO)) {
      const t = await thumb(img);
      if (t) thumbs.push(t);
    }
    if (APPLY && thumbs.length > 0) {
      await db.update(products).set({ thumbs }).where(eq(products.id, producto.id));
    }
    console.log(`  ${producto.slug.padEnd(40)} ${thumbs.length} miniaturas`);
  }

  // 2. Fotografía del sitio, menos el hero
  const fuente = readFileSync("content/images.ts", "utf8");
  const grupos: Record<string, string[]> = {};
  for (const m of fuente.matchAll(/export const (\w+)_IMGS: string\[\] = \[([\s\S]*?)\];/g)) {
    if (m[1] === "HERO") continue; // el hero se ve a pantalla completa
    grupos[m[1]] = [...m[2].matchAll(/"(https:\/\/[^"]+)"/g)].map((x) => x[1]);
  }

  const salida: Record<string, string[]> = {};
  for (const [grupo, urls] of Object.entries(grupos)) {
    salida[grupo] = [];
    for (const url of urls) {
      const t = await thumb(url);
      if (t) salida[grupo].push(t);
    }
    console.log(`  ${grupo.padEnd(40)} ${salida[grupo].length} miniaturas`);
  }

  if (APPLY) {
    const ts = `// Miniaturas de 600 px generadas por scripts/make-thumbs.ts. Se usan en tarjetas
// y mosaicos, donde nada se ve a más de 340 px. El hero sigue usando HERO_IMGS.
// No editar a mano: volver a correr el script.

${Object.entries(salida)
  .map(
    ([grupo, urls]) =>
      `export const ${grupo}_THUMBS: string[] = [\n${urls.map((u) => `  ${JSON.stringify(u)},`).join("\n")}\n];`,
  )
  .join("\n\n")}
`;
    writeFileSync("content/thumbs.ts", ts);
  }

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + "MB";
  console.log(
    `\n${APPLY ? "APLICADO" : "SIMULACIÓN"}: ${hechas} miniaturas\n` +
      `  originales: ${mb(antes)}\n  miniaturas: ${mb(despues)}\n` +
      `  reducción:  ${antes > 0 ? Math.round(100 - (despues / antes) * 100) : 0}%`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("Falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});
