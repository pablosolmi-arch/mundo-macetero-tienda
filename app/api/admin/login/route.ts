import { NextResponse } from "next/server";
import { login } from "../../../../lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = typeof body.email === "string" ? body.email : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ message: "Ingresa tu correo y tu clave." }, { status: 400 });
  }

  const token = await login(email, password);
  if (!token) {
    // Mismo mensaje para correo inexistente y clave incorrecta: distinguirlos
    // permitiría averiguar qué correos tienen cuenta.
    return NextResponse.json({ message: "Correo o clave incorrectos." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
