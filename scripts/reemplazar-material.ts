// scripts/reemplazar-material.ts
//
// Unifica la terminología del material en las descripciones de producto:
// "fibrocemento" pasa a "EIFS", que es como se nombra el material en el resto
// del sitio (content/material.ts).
//
// Simulación (no escribe nada, imprime el diff frase por frase):
//
//   npx tsx scripts/reemplazar-material.ts
//
// Aplicar de verdad (además deja un respaldo de las descripciones originales
// en scripts/respaldo-descripciones.json antes de tocar la base):
//
//   APLICAR=1 npx tsx scripts/reemplazar-material.ts
//
// El reemplazo es textual y conservador: opera sobre el HTML tal cual está
// guardado, sin reordenar ni reescribir nada más que la palabra del material.

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import fs from "node:fs";
import path from "node:path";

const RESPALDO = path.join(process.cwd(), "scripts", "respaldo-descripciones.json");

// Reglas en orden: la primera que calce en cada posición gana. Van de la frase
// más larga a la más corta para que "fibrocemento reforzado" no se resuelva
// antes como "fibrocemento" suelto.
//
// Se cambia SOLO el sustantivo del material y se deja intacto lo que lo rodea
// (preposición, artículo y verbo). "fibrocemento" es masculino; sustituirlo por
// "tecnología EIFS", que es femenino y arrastra otra preposición, rompía la
// concordancia en varias descripciones reales ("El tecnología EIFS hace la
// diferencia", "es con tecnología EIFS"). "EIFS" se comporta como sustantivo
// masculino igual que "fibrocemento", así que todas las frases siguen siendo
// gramaticales sin tener que reescribirlas. La explicación larga del material
// ya la da content/material.ts en la misma ficha de producto.
//
// `patron` no lleva la bandera /g a propósito: el recorrido lo hace
// `aplicarReglas`, que necesita saber dónde terminó cada calce.
const REGLAS: { patron: RegExp; reemplazo: string }[] = [
  { patron: /\bfibrocemento reforzado\b/i, reemplazo: "EIFS" },
  { patron: /\bfibrocemento\b/i, reemplazo: "EIFS" },
];

/** Copia la mayúscula inicial del texto original al reemplazo. */
function respetarMayuscula(original: string, reemplazo: string): string {
  const primera = original[0];
  if (!primera || primera !== primera.toUpperCase() || primera === primera.toLowerCase()) {
    return reemplazo;
  }
  return reemplazo[0].toUpperCase() + reemplazo.slice(1);
}

/** Aplica las reglas sobre el HTML y devuelve el texto nuevo más los cambios. */
function aplicarReglas(html: string): { nuevo: string; cambios: { antes: string; despues: string }[] } {
  const cambios: { antes: string; despues: string }[] = [];
  let nuevo = "";
  let resto = html;

  while (resto.length > 0) {
    let mejor: { indice: number; largo: number; texto: string } | null = null;

    for (const regla of REGLAS) {
      const m = regla.patron.exec(resto);
      if (!m) continue;
      // Gana el calce que empiece antes; a igual inicio, el más largo.
      if (!mejor || m.index < mejor.indice || (m.index === mejor.indice && m[0].length > mejor.largo)) {
        mejor = {
          indice: m.index,
          largo: m[0].length,
          texto: respetarMayuscula(m[0], regla.reemplazo),
        };
      }
    }

    if (!mejor) {
      nuevo += resto;
      break;
    }

    const original = resto.slice(mejor.indice, mejor.indice + mejor.largo);
    cambios.push({ antes: original, despues: mejor.texto });
    nuevo += resto.slice(0, mejor.indice) + mejor.texto;
    resto = resto.slice(mejor.indice + mejor.largo);
  }

  return { nuevo, cambios };
}

/** Extrae la frase que rodea al calce, para que el diff se lea en contexto. */
function frase(html: string, aguja: string): string {
  const texto = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const i = texto.toLowerCase().indexOf(aguja.toLowerCase());
  if (i === -1) return texto.slice(0, 160);
  const desde = Math.max(0, texto.lastIndexOf(".", i) + 1);
  const punto = texto.indexOf(".", i);
  const hasta = punto === -1 ? texto.length : punto + 1;
  return texto.slice(desde, hasta).trim();
}

async function main() {
  const aplicar = process.env.APLICAR === "1";

  const { eq } = await import("drizzle-orm");
  const { db } = await import("../db/client");
  const { products } = await import("../db/schema");

  const filas = await db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description }).from(products);

  const afectados = filas.filter((p) => p.description && /fibrocemento/i.test(p.description));

  if (afectados.length === 0) {
    console.log("No hay descripciones con «fibrocemento». Nada que hacer.");
    process.exit(0);
  }

  console.log(`${afectados.length} producto(s) con «fibrocemento» en la descripción.\n`);

  const plan: { id: number; slug: string; original: string; nuevo: string }[] = [];
  let totalCambios = 0;

  for (const p of afectados) {
    const original = p.description as string;
    const { nuevo, cambios } = aplicarReglas(original);
    if (cambios.length === 0) continue;

    totalCambios += cambios.length;
    plan.push({ id: p.id, slug: p.slug, original, nuevo });

    console.log(`── ${p.slug} (${p.name})`);
    for (const c of cambios) {
      console.log(`   antes : ${frase(original, c.antes)}`);
      console.log(`   ahora : ${frase(nuevo, c.despues)}`);
    }
    console.log("");
  }

  console.log(`Total: ${plan.length} producto(s), ${totalCambios} mención(es).`);

  if (!aplicar) {
    console.log("\nSimulación. Nada se escribió. Para aplicar:");
    console.log("  APLICAR=1 npx tsx scripts/reemplazar-material.ts");
    process.exit(0);
  }

  // Respaldo ANTES de escribir, para poder revertir producto por producto.
  fs.writeFileSync(
    RESPALDO,
    JSON.stringify(
      { fecha: new Date().toISOString(), productos: plan.map((p) => ({ id: p.id, slug: p.slug, description: p.original })) },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`\nRespaldo escrito en ${RESPALDO}`);

  for (const p of plan) {
    await db.update(products).set({ description: p.nuevo }).where(eq(products.id, p.id));
  }

  console.log(`Listo: ${plan.length} descripción(es) actualizada(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
