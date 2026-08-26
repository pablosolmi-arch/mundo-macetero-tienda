import { NextResponse } from "next/server";
import { MIN_LARGO_CLAVE, restablecerClave } from "../../../../lib/admin/auth";

export const dynamic = "force-dynamic";

// Ni el token ni el correo se anotan en la bitácora: el token es la llave del
// cambio de clave mientras no vence.
const MENSAJES: Record<string, string> = {
  invalido: "El enlace no es válido o ya se usó. Pide uno nuevo.",
  expirado: "El enlace venció. Pide uno nuevo.",
  clave_corta: `La clave debe tener al menos ${MIN_LARGO_CLAVE} caracteres.`,
};

export async function POST(req: Request) {
  let token = "";
  let password = "";
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    token = typeof body.token === "string" ? body.token : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (!token || !password) {
    return NextResponse.json({ message: "Falta el enlace o la clave nueva." }, { status: 400 });
  }

  const resultado = await restablecerClave(token, password);
  if (!resultado.ok) {
    return NextResponse.json(
      { message: MENSAJES[resultado.motivo] ?? "No se pudo cambiar la clave." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
