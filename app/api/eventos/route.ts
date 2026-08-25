import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { siteEvents } from "../../../db/schema";
import { CANALES, DISPOSITIVOS } from "../../../lib/origen";

// Recibe los eventos de la tienda. Es un endpoint público por necesidad (lo llama
// el navegador), así que: valida el tipo contra una lista blanca, recorta los
// textos, y no guarda nada que identifique a la persona. Si algo falla responde
// 204 igual: una métrica perdida no puede romper la navegación del cliente.

export const dynamic = "force-dynamic";

const TIPOS = new Set(["visita", "producto", "agregar", "checkout"]);
// El canal y el dispositivo los calcula el navegador, así que llegan como
// cualquier otro dato del cliente: solo se guardan si están en la lista blanca.
const CANALES_VALIDOS = new Set<string>(CANALES);
const DISPOSITIVOS_VALIDOS = new Set<string>(DISPOSITIVOS);

function corta(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.slice(0, max) : "";
}

function deLista(valor: unknown, lista: Set<string>): string | null {
  const v = corta(valor, 30).trim().toLowerCase();
  return lista.has(v) ? v : null;
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
      canal: deLista(body.canal, CANALES_VALIDOS),
      fuente: corta(body.fuente, 80).trim().toLowerCase() || null,
      campana: corta(body.campana, 80).trim().toLowerCase() || null,
      dispositivo: deLista(body.dispositivo, DISPOSITIVOS_VALIDOS),
    });
  } catch {
    // Sin log: el cuerpo podría traer datos del visitante.
  }
  return new NextResponse(null, { status: 204 });
}
