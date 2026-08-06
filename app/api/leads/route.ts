import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads } from "../../../db/schema";

// Receives the advice / your-space / professional-project enquiries. Deliberately
// minimal: it validates, trims to sane lengths and stores the row. Nothing here is
// logged, because the payload is customer contact data.

export const dynamic = "force-dynamic";

const TIPOS = new Set(["asesoria", "espacio", "proyecto"]);
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
  if (!nombre) return NextResponse.json({ message: "Falta tu nombre." }, { status: 400 });
  if (!email.includes("@")) {
    return NextResponse.json({ message: "Falta un correo válido." }, { status: 400 });
  }

  try {
    await db.insert(leads).values({
      tipo,
      nombre,
      email,
      telefono: clean(body.telefono, MAX.short),
      empresa: clean(body.empresa, MAX.short),
      detalle: clean(body.detalle, MAX.long),
      mensaje: clean(body.mensaje, MAX.long),
    });
  } catch {
    return NextResponse.json(
      { message: "No pudimos registrar tu solicitud. Escríbenos a mundo@mundomacetero.cl." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
