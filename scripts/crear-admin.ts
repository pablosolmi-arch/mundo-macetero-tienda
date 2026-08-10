// scripts/crear-admin.ts
//
// Crea (o reactiva) un usuario del panel de administración.
//
//   npx tsx scripts/crear-admin.ts correo@dominio.cl "Nombre Apellido"
//
// Genera una clave aleatoria y la imprime UNA vez: no queda guardada en ninguna
// parte en texto plano. Para fijar una clave propia, pasarla por variable de
// entorno (así no queda en el historial del shell):
//
//   ADMIN_PASSWORD='...' npx tsx scripts/crear-admin.ts correo@dominio.cl "Nombre"

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import crypto from "node:crypto";

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const nombre = (process.argv[3] ?? "").trim();
  if (!email.includes("@")) {
    console.error('uso: npx tsx scripts/crear-admin.ts correo@dominio.cl "Nombre Apellido"');
    process.exit(1);
  }

  const { eq } = await import("drizzle-orm");
  const { db } = await import("../db/client");
  const { adminUsers } = await import("../db/schema");
  const { hashPassword } = await import("../lib/admin/auth");

  // 18 bytes en base64url: suficiente entropía para no necesitar bloqueo por
  // intentos fallidos en esta etapa.
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(18).toString("base64url");
  const passwordHash = hashPassword(password);

  const existente = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  if (existente) {
    await db
      .update(adminUsers)
      .set({ passwordHash, activo: true, nombre: nombre || existente.nombre })
      .where(eq(adminUsers.id, existente.id));
    console.log(`Usuario actualizado: ${email}`);
  } else {
    await db.insert(adminUsers).values({ email, nombre, passwordHash, rol: "owner" });
    console.log(`Usuario creado: ${email}`);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.log(`\n  Clave: ${password}\n`);
    console.log("Guárdala ahora: no se puede volver a mostrar.");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});
