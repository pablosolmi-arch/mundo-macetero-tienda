import { NextResponse } from "next/server";
import { solicitarRecuperacion } from "../../../../lib/admin/auth";
import { correoRecuperarClave } from "../../../../lib/email";

export const dynamic = "force-dynamic";

// La respuesta es siempre la misma, con o sin cuenta detrás del correo: si
// cambiara, esta ruta sería un buscador de correos con acceso al panel. Nada de
// lo que pasa aquí se anota en la bitácora, ni el correo ni el token.
const MENSAJE = "Si el correo tiene cuenta, te enviamos un enlace.";

// Y tampoco puede delatarlo el reloj: sin cuenta no hay nada que insertar ni
// correo que enviar, así que esa rama termina antes. Se espera hasta un piso
// fijo, en paralelo con el envío, para que las dos ramas demoren lo mismo.
const PISO_MS = 1200;

function esperarHasta(limite: number): Promise<void> {
  return new Promise((listo) => setTimeout(listo, Math.max(0, limite - Date.now())));
}

export async function POST(req: Request) {
  const inicio = Date.now();
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = typeof body.email === "string" ? body.email : "";
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ message: "Ingresa tu correo." }, { status: 400 });
  }

  const solicitud = await solicitarRecuperacion(email);
  const envio = solicitud
    ? correoRecuperarClave(
        solicitud.usuario.email,
        solicitud.usuario.nombre,
        `${process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app"}/admin/restablecer?token=${encodeURIComponent(solicitud.token)}`,
      )
    : Promise.resolve(null);

  await Promise.all([envio, esperarHasta(inicio + PISO_MS)]);

  return NextResponse.json({ ok: true, message: MENSAJE });
}
