import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { siteEvents } from "../../../db/schema";

// Recibe los eventos de la tienda. Es un endpoint público por necesidad (lo llama
// el navegador), así que: valida el tipo contra una lista blanca, recorta los
// textos, y no guarda nada que identifique a la persona. Si algo falla responde
// 204 igual: una métrica perdida no puede romper la navegación del cliente.

export const dynamic = "force-dynamic";

const TIPOS = new Set(["visita", "producto", "agregar", "checkout"]);

function corta(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.slice(0, max) : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const tipo = corta(body.tipo, 20);
    if (!TIPOS.has(tipo)) return new NextResponse(null, { status: 204 });

    await db.insert(siteEvents).values({
      tipo,
      path: corta(body.path, 300),
      productSlug: corta(body.productSlug, 120) || null,
      sessionId: corta(body.sessionId, 60),
      referrer: corta(body.referrer, 300),
    });
  } catch {
    // Sin log: el cuerpo podría traer datos del visitante.
  }
  return new NextResponse(null, { status: 204 });
}
