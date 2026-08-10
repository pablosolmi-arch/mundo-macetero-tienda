import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db/client";
import { adminSessions, adminUsers } from "../../db/schema";

// Autenticación del administrador. Decisiones y por qué:
//
// - Claves con scrypt (viene en Node, sin dependencias): salt aleatorio por
//   usuario y comparación en tiempo constante.
// - Sesiones en tabla, no JWT: así se puede cerrar una sesión del lado del
//   servidor y revocarle el acceso a alguien sin cambiarle la clave a todos.
// - En la base se guarda solo el SHA-256 del token; el token real vive en una
//   cookie httpOnly. Si alguien lee la tabla, no obtiene sesiones utilizables.
// - Nunca se registra en logs el correo, la clave ni el token.

const COOKIE = "mm_admin";
const DIAS_SESION = 7;
const SCRYPT_KEYLEN = 64;

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const intento = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const guardado = Buffer.from(hash, "hex");
  if (intento.length !== guardado.length) return false;
  return crypto.timingSafeEqual(intento, guardado);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Verifica credenciales y abre sesión. Devuelve null sin decir si falló el correo
// o la clave: distinguirlos permitiría enumerar cuentas.
export async function login(email: string, password: string): Promise<string | null> {
  const usuario = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.trim().toLowerCase()),
  });
  if (!usuario || !usuario.activo) return null;
  if (!verifyPassword(password, usuario.passwordHash)) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({
    userId: usuario.id,
    tokenHash: hashToken(token),
    expiraEn,
  });
  await db
    .update(adminUsers)
    .set({ ultimoIngreso: new Date() })
    .where(eq(adminUsers.id, usuario.id));

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEn,
  });
  return token;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  jar.delete(COOKIE);
}

// Usuario de la sesión actual, o null. Las sesiones vencidas no se aceptan.
export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const sesion = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.tokenHash, hashToken(token)),
      gt(adminSessions.expiraEn, new Date()),
    ),
  });
  if (!sesion) return null;

  const usuario = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, sesion.userId),
  });
  if (!usuario || !usuario.activo) return null;

  return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
}
