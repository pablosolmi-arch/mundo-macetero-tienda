// tests/lib/recuperar-clave.test.ts
import crypto from "node:crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { adminPasswordResets, adminSessions, adminUsers } from "../../db/schema";
import {
  hashPassword,
  restablecerClave,
  solicitarRecuperacion,
  verifyPassword,
} from "../../lib/admin/auth";

// Correo en .invalid: es un dominio reservado que no existe, así que ni por
// error se le manda algo a una persona real.
const CORREO = `test-recuperar-${Math.random().toString(36).slice(2, 6)}@example.invalid`;
const CLAVE_VIEJA = "clave-vieja-de-prueba";
const CLAVE_NUEVA = "clave-nueva-de-prueba";

let userId = 0;

// El mismo hash con el que auth.ts guarda el token: hace falta para encontrar la
// fila y vencerla a mano, porque el token en claro no se guarda en ninguna parte.
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

describe("recuperar la clave del panel", () => {
  beforeAll(async () => {
    const [usuario] = await db
      .insert(adminUsers)
      .values({
        email: CORREO,
        nombre: "Prueba Recuperar",
        passwordHash: hashPassword(CLAVE_VIEJA),
        // Cuenta bloqueada por intentos fallidos, que es el caso típico de quien
        // recupera la clave: al terminar tiene que quedar desbloqueada.
        intentosFallidos: 4,
        bloqueadoHasta: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning();
    userId = usuario.id;
  });

  afterAll(async () => {
    await db.delete(adminPasswordResets).where(eq(adminPasswordResets.userId, userId));
    await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
    await db.delete(adminUsers).where(eq(adminUsers.id, userId));
  });

  it("no crea nada para un correo sin cuenta", async () => {
    expect(await solicitarRecuperacion("no-existe-aqui@example.invalid")).toBeNull();
  });

  it("cambia la clave, desbloquea la cuenta y cierra las sesiones abiertas", async () => {
    // Una sesión abierta con la clave vieja: al recuperar tiene que desaparecer.
    await db.insert(adminSessions).values({
      userId,
      tokenHash: `test-recuperar-sesion-${userId}`,
      expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const solicitud = await solicitarRecuperacion(CORREO);
    expect(solicitud?.usuario.email).toBe(CORREO);
    const token = solicitud!.token;

    // Una clave corta se rechaza sin quemar el enlace.
    expect(await restablecerClave(token, "corta")).toEqual({ ok: false, motivo: "clave_corta" });

    expect(await restablecerClave(token, CLAVE_NUEVA)).toEqual({ ok: true });

    const usuario = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, userId) });
    expect(verifyPassword(CLAVE_NUEVA, usuario!.passwordHash)).toBe(true);
    expect(verifyPassword(CLAVE_VIEJA, usuario!.passwordHash)).toBe(false);
    expect(usuario!.intentosFallidos).toBe(0);
    expect(usuario!.bloqueadoHasta).toBeNull();

    const sesiones = await db.select().from(adminSessions).where(eq(adminSessions.userId, userId));
    expect(sesiones).toHaveLength(0);

    // El enlace sirve una sola vez.
    expect(await restablecerClave(token, "otra-clave-larga")).toEqual({
      ok: false,
      motivo: "invalido",
    });
  });

  it("rechaza un enlace vencido", async () => {
    await db.delete(adminPasswordResets).where(eq(adminPasswordResets.userId, userId));

    const solicitud = await solicitarRecuperacion(CORREO);
    expect(solicitud).not.toBeNull();
    const token = solicitud!.token;

    await db
      .update(adminPasswordResets)
      .set({ expiraEn: new Date(Date.now() - 60 * 1000) })
      .where(eq(adminPasswordResets.tokenHash, hashToken(token)));

    expect(await restablecerClave(token, "clave-larga-valida")).toEqual({
      ok: false,
      motivo: "expirado",
    });
  });

  it("rechaza un token inventado", async () => {
    expect(await restablecerClave("token-que-nunca-existio", "clave-larga-valida")).toEqual({
      ok: false,
      motivo: "invalido",
    });
  });

  it("corta a la cuarta solicitud dentro de la misma hora", async () => {
    await db.delete(adminPasswordResets).where(eq(adminPasswordResets.userId, userId));

    expect(await solicitarRecuperacion(CORREO)).not.toBeNull();
    expect(await solicitarRecuperacion(CORREO)).not.toBeNull();
    expect(await solicitarRecuperacion(CORREO)).not.toBeNull();
    expect(await solicitarRecuperacion(CORREO)).toBeNull();
  });

  it("no crea nada para una cuenta desactivada", async () => {
    // Sin filas recientes, para que el único motivo posible sea la desactivación.
    await db.delete(adminPasswordResets).where(eq(adminPasswordResets.userId, userId));
    await db.update(adminUsers).set({ activo: false }).where(eq(adminUsers.id, userId));

    expect(await solicitarRecuperacion(CORREO)).toBeNull();

    await db.update(adminUsers).set({ activo: true }).where(eq(adminUsers.id, userId));
  });
});
