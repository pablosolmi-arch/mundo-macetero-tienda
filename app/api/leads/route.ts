import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads } from "../../../db/schema";
import { correoSolicitudContacto } from "../../../lib/email";

// Receives the advice / your-space / professional-project enquiries. Deliberately
// minimal: it validates, trims to sane lengths and stores the row. Nothing here is
// logged, because the payload is customer contact data.
//
// 'llamada' entra por acá a propósito: es una solicitud de contacto igual que las
// otras y va a la MISMA tabla `leads`. No se arma un registro paralelo de
// pedidos de llamada. Se diferencia en que lo que importa es el teléfono, no el
// correo: alguien que está trabado en el checkout no va a volver a escribir su
// correo para que lo llamemos.

export const dynamic = "force-dynamic";

const TIPOS = new Set(["asesoria", "espacio", "proyecto", "llamada"]);
const TIPO_LLAMADA = "llamada";

// El asunto del aviso al equipo. Un tipo nuevo que no esté acá igual avisa, con
// un asunto genérico: nunca se pierde una solicitud por falta de una etiqueta.
const TITULOS: Record<string, string> = {
  asesoria: "Nueva solicitud de asesoramiento",
  espacio: "Nueva foto de un espacio",
  proyecto: "Nueva consulta de proyecto",
  llamada: "Te piden una llamada AHORA (desde el checkout)",
};
const MAX = { short: 200, long: 4000 };

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const tipo = clean(body.tipo, 40);
  if (!TIPOS.has(tipo)) {
    return NextResponse.json({ message: "Tipo de solicitud inválido." }, { status: 400 });
  }

  const nombre = clean(body.nombre, MAX.short);
  const email = clean(body.email, MAX.short);
  const telefono = clean(body.telefono, MAX.short);

  if (tipo === TIPO_LLAMADA) {
    // Un teléfono al que se pueda llamar: al menos ocho dígitos, que es lo mínimo
    // de un número chileno sin código de país.
    if ((telefono.match(/\d/g) ?? []).length < 8) {
      return NextResponse.json({ message: "Déjanos un teléfono válido." }, { status: 400 });
    }
  } else {
    if (!nombre) return NextResponse.json({ message: "Falta tu nombre." }, { status: 400 });
    if (!email.includes("@")) {
      return NextResponse.json({ message: "Falta un correo válido." }, { status: 400 });
    }
  }

  const detalle = clean(body.detalle, MAX.long);
  const mensaje = clean(body.mensaje, MAX.long);

  try {
    await db.insert(leads).values({
      tipo,
      nombre,
      email,
      telefono,
      empresa: clean(body.empresa, MAX.short),
      detalle,
      mensaje,
    });
  } catch {
    return NextResponse.json(
      { message: "No pudimos registrar tu solicitud. Escríbenos a mundo@mundomacetero.cl." },
      { status: 500 },
    );
  }

  // La solicitud ya está guardada: el aviso al equipo es un extra y no puede
  // hacer fallar la respuesta. Si Resend no está configurado o no contesta, la
  // fila igual quedó en la base y la persona ve su confirmación.
  try {
    await correoSolicitudContacto({
      tipo,
      titulo: TITULOS[tipo] ?? "Nueva solicitud de contacto",
      nombre,
      email,
      telefono,
      detalle,
      mensaje,
    });
  } catch {
    // Sin log: el cuerpo trae datos de contacto de la persona.
  }

  return NextResponse.json({ ok: true });
}
