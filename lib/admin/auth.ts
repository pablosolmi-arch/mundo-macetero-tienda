import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "../../db/client";
import { adminPasswordResets, adminSessions, adminUsers } from "../../db/schema";

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

// Hash de descarte con el mismo costo que uno real. Se verifica contra él cuando
// el correo no existe, para que responder tarde lo mismo con un correo válido que
// con uno inventado: si no, el tiempo de respuesta delata qué correos tienen cuenta.
const HASH_SEÑUELO = hashPassword(crypto.randomBytes(32).toString("hex"));

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

// Verifica credenciales y abre sesión. Devuelve null sin decir si falló el correo
// o la clave: distinguirlos permitiría enumerar cuentas.
export async function login(email: string, password: string): Promise<string | null> {
  const usuario = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.trim().toLowerCase()),
  });

  if (!usuario || !usuario.activo) {
    // Igual se paga el costo de un scrypt, para no filtrar por tiempo.
    verifyPassword(password, HASH_SEÑUELO);
    return null;
  }

  // Cuenta bloqueada por intentos fallidos: tampoco se dice por qué.
  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    verifyPassword(password, HASH_SEÑUELO);
    return null;
  }

  if (!verifyPassword(password, usuario.passwordHash)) {
    const intentos = usuario.intentosFallidos + 1;
    await db
      .update(adminUsers)
      .set({
        intentosFallidos: intentos,
        bloqueadoHasta:
          intentos >= MAX_INTENTOS
            ? new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000)
            : usuario.bloqueadoHasta,
      })
      .where(eq(adminUsers.id, usuario.id));
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({
    userId: usuario.id,
    tokenHash: hashToken(token),
    expiraEn,
  });
  await db
    .update(adminUsers)
    .set({ ultimoIngreso: new Date(), intentosFallidos: 0, bloqueadoHasta: null })
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

// --- Recuperar la clave ---

const MINUTOS_TOKEN = 30;
// Freno al abuso: con un solo correo se pueden pedir hasta tres enlaces por
// hora. Más que eso solo sirve para inundar la bandeja de otra persona.
const MAX_SOLICITUDES_HORA = 3;
export const MIN_LARGO_CLAVE = 12;

export interface SolicitudRecuperacion {
  token: string;
  usuario: AdminUser;
}

// Crea un enlace de recuperación. Devuelve null cuando no hay que enviar nada
// (correo sin cuenta, cuenta desactivada o demasiadas solicitudes recientes).
// Quien llama debe responder siempre lo mismo, pase lo que pase aquí: si el
// mensaje o el tiempo de respuesta cambiaran, cualquiera podría averiguar qué
// correos tienen cuenta en el panel.
export async function solicitarRecuperacion(email: string): Promise<SolicitudRecuperacion | null> {
  const usuario = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.trim().toLowerCase()),
  });
  if (!usuario || !usuario.activo) return null;

  const desde = new Date(Date.now() - 60 * 60 * 1000);
  const [reciente] = await db
    .select({ total: count() })
    .from(adminPasswordResets)
    .where(
      and(eq(adminPasswordResets.userId, usuario.id), gt(adminPasswordResets.createdAt, desde)),
    );
  if (Number(reciente?.total ?? 0) >= MAX_SOLICITUDES_HORA) return null;

  // base64url para que el token viaje entero en la URL del correo sin escapar.
  const token = crypto.randomBytes(32).toString("base64url");
  await db.insert(adminPasswordResets).values({
    userId: usuario.id,
    tokenHash: hashToken(token),
    expiraEn: new Date(Date.now() + MINUTOS_TOKEN * 60 * 1000),
  });

  return {
    token,
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
  };
}

export type MotivoRestablecer = "invalido" | "expirado" | "clave_corta";

export type ResultadoRestablecer = { ok: true } | { ok: false; motivo: MotivoRestablecer };

// Cambia la clave con un enlace de recuperación. El token es de un solo uso y el
// largo de la clave se revisa antes de marcarlo usado, para que un intento con
// una clave corta no queme el enlace. Al terminar se borran todas las sesiones
// del usuario: si alguien entró con la clave vieja, queda afuera.
export async function restablecerClave(
  token: string,
  claveNueva: string,
): Promise<ResultadoRestablecer> {
  if (!token) return { ok: false, motivo: "invalido" };

  const solicitud = await db.query.adminPasswordResets.findFirst({
    where: eq(adminPasswordResets.tokenHash, hashToken(token)),
  });
  if (!solicitud || solicitud.usadoEn) return { ok: false, motivo: "invalido" };
  if (solicitud.expiraEn <= new Date()) return { ok: false, motivo: "expirado" };
  if (claveNueva.length < MIN_LARGO_CLAVE) return { ok: false, motivo: "clave_corta" };

  await db
    .update(adminUsers)
    .set({
      passwordHash: hashPassword(claveNueva),
      // El que recupera la clave no debe quedar bloqueado por los intentos
      // fallidos que lo llevaron a recuperarla.
      intentosFallidos: 0,
      bloqueadoHasta: null,
    })
    .where(eq(adminUsers.id, solicitud.userId));

  await db
    .update(adminPasswordResets)
    .set({ usadoEn: new Date() })
    .where(eq(adminPasswordResets.id, solicitud.id));

  await db.delete(adminSessions).where(eq(adminSessions.userId, solicitud.userId));

  return { ok: true };
}
