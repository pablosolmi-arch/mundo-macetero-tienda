import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { siteEvents } from "../../../db/schema";
import { CANALES, DISPOSITIVOS } from "../../../lib/origen";
import { VALORES_CAMPO_EVENTO } from "../../../lib/eventos-checkout";

// Recibe los eventos de la tienda. Es un endpoint público por necesidad (lo llama
// el navegador), así que: valida el tipo contra una lista blanca, recorta los
// textos, y no guarda nada que identifique a la persona. Si algo falla responde
// 204 igual: una métrica perdida no puede romper la navegación del cliente.

export const dynamic = "force-dynamic";

const TIPOS = new Set([
  "visita",
  "producto",
  "agregar",
  "checkout",
  // Lo que pasa dentro del formulario de checkout: campo completado, error de
  // envío y clic en pagar.
  "checkout_campo",
  "checkout_error",
  "checkout_envio",
]);
// El canal y el dispositivo los calcula el navegador, así que llegan como
// cualquier otro dato del cliente: solo se guardan si están en la lista blanca.
const CANALES_VALIDOS = new Set<string>(CANALES);
const DISPOSITIVOS_VALIDOS = new Set<string>(DISPOSITIVOS);

function corta(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.slice(0, max) : "";
}

function deLista(valor: unknown, lista: ReadonlySet<string>, max = 30): string | null {
  const v = corta(valor, max).trim().toLowerCase();
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
      // Nombre de campo o código de error, y solo si está en la lista blanca:
      // así este endpoint público nunca puede guardar texto del visitante.
      campo: deLista(body.campo, VALORES_CAMPO_EVENTO, 40),
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
