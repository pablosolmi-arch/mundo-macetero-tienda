import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db/client";
import { discounts } from "../../../../db/schema";
import { getSessionUser } from "../../../../lib/admin/auth";

// Alta y activación de códigos de descuento. La validación vive acá y no en el
// formulario: el checkout confía en esta tabla, así que un valor imposible
// (un 300% o un monto negativo) no puede entrar ni por un fetch a mano.

export const dynamic = "force-dynamic";

const TIPOS = new Set(["porcentaje", "monto"]);

export async function POST(req: Request) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  // El código se guarda siempre en mayúsculas: el checkout compara así.
  const codigo = (typeof body.codigo === "string" ? body.codigo : "").trim().toUpperCase();
  if (!codigo) {
    return NextResponse.json({ message: "El código no puede estar vacío." }, { status: 400 });
  }
  if (codigo.length > 40) {
    return NextResponse.json({ message: "El código es demasiado largo." }, { status: 400 });
  }
  if (/\s/.test(codigo)) {
    return NextResponse.json({ message: "El código no puede tener espacios." }, { status: 400 });
  }

  const tipo = typeof body.tipo === "string" ? body.tipo : "porcentaje";
  if (!TIPOS.has(tipo)) {
    return NextResponse.json({ message: "El tipo debe ser porcentaje o monto." }, { status: 400 });
  }

  const valor = Number(body.valor);
  if (!Number.isFinite(valor)) {
    return NextResponse.json({ message: "El valor no es un número." }, { status: 400 });
  }
  if (tipo === "porcentaje" && (valor < 1 || valor > 100)) {
    return NextResponse.json(
      { message: "El porcentaje debe estar entre 1 y 100." },
      { status: 400 },
    );
  }
  if (tipo === "monto" && valor <= 0) {
    return NextResponse.json({ message: "El monto debe ser mayor que cero." }, { status: 400 });
  }

  // Sin vencimiento y sin tope de usos son casos válidos: quedan en null.
  let expiraEn: Date | null = null;
  const expiraTexto = typeof body.expiraEn === "string" ? body.expiraEn.trim() : "";
  if (expiraTexto) {
    // El input date entrega "YYYY-MM-DD". Se toma el final del día para que el
    // código sirva durante toda la fecha elegida y no venza a medianoche.
    const fecha = new Date(`${expiraTexto}T23:59:59`);
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json({ message: "La fecha de vencimiento no es válida." }, { status: 400 });
    }
    expiraEn = fecha;
  }

  let maxUsos: number | null = null;
  const maxTexto = body.maxUsos;
  if (maxTexto !== null && maxTexto !== undefined && String(maxTexto).trim() !== "") {
    const n = Number(maxTexto);
    if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json(
        { message: "El máximo de usos debe ser un número entero mayor que cero." },
        { status: 400 },
      );
    }
    maxUsos = n;
  }

  const existente = await db.query.discounts.findFirst({ where: eq(discounts.codigo, codigo) });
  if (existente) {
    return NextResponse.json({ message: `El código ${codigo} ya existe.` }, { status: 409 });
  }

  try {
    const [creado] = await db
      .insert(discounts)
      .values({
        codigo,
        tipo,
        valor: String(tipo === "monto" ? Math.round(valor) : valor),
        expiraEn,
        maxUsos,
        activo: true,
      })
      .returning({ id: discounts.id, codigo: discounts.codigo });
    return NextResponse.json({ ok: true, descuento: creado });
  } catch (error) {
    // La consulta de arriba deja una ventana entre el chequeo y el insert: si dos
    // personas crean el mismo código a la vez, manda el índice único de la tabla.
    const mensaje = error instanceof Error ? error.message : "";
    if (mensaje.includes("duplicate key") || mensaje.includes("discounts_codigo")) {
      return NextResponse.json({ message: `El código ${codigo} ya existe.` }, { status: 409 });
    }
    console.error("No se pudo crear el descuento:", mensaje);
    return NextResponse.json({ message: "No se pudo crear el descuento." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ message: "Falta el descuento a modificar." }, { status: 400 });
  }
  if (typeof body.activo !== "boolean") {
    return NextResponse.json({ message: "El estado debe ser verdadero o falso." }, { status: 400 });
  }

  const actualizado = await db
    .update(discounts)
    .set({ activo: body.activo })
    .where(eq(discounts.id, id))
    .returning({ id: discounts.id, activo: discounts.activo });

  if (actualizado.length === 0) {
    return NextResponse.json({ message: "El descuento no existe." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, activo: actualizado[0].activo });
}
