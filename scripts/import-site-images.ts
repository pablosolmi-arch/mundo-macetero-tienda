// scripts/import-site-images.ts
//
// Copies the site's own photography (hero banners, project shots, team photos,
// client logos, blog images) from the current Shopify store into our Vercel Blob
// store, and writes content/images.ts with the resulting URLs.
//
// They are copied rather than hot-linked on purpose: the Shopify CDN stops being
// ours the day the domain is cut over, and a storefront whose photos vanish at
// launch is worse than no photos.
//
// Usage:
//   npx tsx scripts/import-site-images.ts <lista.json>
//
// The JSON is { grupo: [url, ...] }, as produced while reading the live site.

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { readFileSync, writeFileSync } from "node:fs";

const LISTA = process.argv[2];

function safeName(url: string): string {
  const base = url.split("/").pop() ?? "imagen";
  return decodeURIComponent(base)
    .replace(/\.(jpe?g|png|webp|gif)$/i, (m) => m.toLowerCase())
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-70);
}

async function main() {
  if (!LISTA) {
    console.error("uso: tsx scripts/import-site-images.ts <lista.json>");
    process.exit(1);
  }
  const { put } = await import("@vercel/blob");
  const grupos = JSON.parse(readFileSync(LISTA, "utf8")) as Record<string, string[]>;

  // The same photo appears in more than one group (the team shot is also used as a
  // project); upload each source once and reuse the resulting URL.
  const subidas = new Map<string, string>();
  const salida: Record<string, string[]> = {};

  for (const [grupo, urls] of Object.entries(grupos)) {
    salida[grupo] = [];
    for (const url of urls) {
      if (subidas.has(url)) {
        salida[grupo].push(subidas.get(url)!);
        continue;
      }
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  ! ${safeName(url)} → HTTP ${res.status}, se omite`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const blob = await put(`sitio/${safeName(url)}`, buffer, {
        access: "public",
        addRandomSuffix: true,
      });
      subidas.set(url, blob.url);
      salida[grupo].push(blob.url);
      console.log(`  ✓ ${grupo.padEnd(10)} ${safeName(url).slice(0, 46).padEnd(46)} ${(buffer.length / 1024).toFixed(0)}KB`);
    }
  }

  const ts = `// Fotografía propia del sitio, copiada desde la tienda actual a nuestro Blob
// con scripts/import-site-images.ts. No editar a mano: volver a correr el script.

${Object.entries(salida)
  .map(
    ([grupo, urls]) =>
      `export const ${grupo.toUpperCase()}_IMGS: string[] = [\n${urls
        .map((u) => `  ${JSON.stringify(u)},`)
        .join("\n")}\n];`,
  )
  .join("\n\n")}
`;
  writeFileSync("content/images.ts", ts);
  console.log(`\ncontent/images.ts escrito con ${subidas.size} imágenes.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Falló la copia:", error instanceof Error ? error.message : error);
  process.exit(1);
});
