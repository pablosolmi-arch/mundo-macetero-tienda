import { NextResponse } from "next/server";
import { desc, gte } from "drizzle-orm";
import { db } from "../../../../db/client";
import { orders } from "../../../../db/schema";
import { getSessionUser } from "../../../../lib/admin/auth";
import { codigoPedido } from "../../../../lib/pedido-codigo";

// Descarga de los pedidos en CSV para contabilidad. Exige sesión: la planilla
// lleva datos de contacto de los clientes, así que no puede quedar abierta.

export const dynamic = "force-dynamic";

const CABECERAS = [
  // "pedido" es el código humano (#7-25/08) y "referencia" el commerceOrder que
  // viaja a la pasarela: contabilidad concilia por el primero y soporte por el
  // segundo.
  "pedido",
  "referencia",
  "fecha",
  "estado_pago",
  "estado_entrega",
  "origen",
  "cliente",
  "correo",
  "telefono",
  "comuna",
  "region",
  "subtotal",
  "descuento",
  "codigo",
  "envio",
  "total",
  "reembolsado",
  "medio_pago",
];

// Todo campo va entre comillas y las comillas internas se duplican: un nombre con
// coma o un salto de línea en la dirección partían la fila en dos.
function celda(valor: unknown): string {
  let texto = valor == null ? "" : String(valor);
  // Un valor que empieza con =, +, -, @ o tab lo interpretaría Excel como
  // fórmula (inyección CSV): un cliente llamado "=HYPERLINK(...)" ejecutaría
  // al abrir el archivo. Se antepone un apóstrofo para dejarlo como texto.
  if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

function fecha(valor: Date | null): string {
  if (!valor) return "";
  return valor.toISOString().slice(0, 19).replace("T", " ");
}

export async function GET(req: Request) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  const parametro = Number(new URL(req.url).searchParams.get("dias"));
  const dias = Number.isFinite(parametro) && parametro > 0 ? Math.floor(parametro) : 365;
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const filas = await db.query.orders.findMany({
    where: gte(orders.createdAt, desde),
    orderBy: [desc(orders.createdAt)],
  });

  const lineas = [CABECERAS.map(celda).join(",")];
  for (const p of filas) {
    lineas.push(
      [
        codigoPedido(p.numero, p.createdAt),
        p.commerceOrder,
        fecha(p.createdAt),
        p.status,
        p.fulfillment,
        p.origen,
        p.customerName,
        p.customerEmail,
        p.customerPhone,
        p.shippingCity,
        p.shippingRegion,
        p.subtotal,
        p.discountAmount,
        p.discountCode ?? "",
        p.shippingCost,
        p.amount,
        p.refundedAmount,
        p.paymentMedia ?? "",
      ]
        .map(celda)
        .join(","),
    );
  }

  // El BOM va primero para que Excel en Windows lea el archivo como UTF-8; sin él
  // los acentos y las eñes salen partidos.
  const csv = `\ufeff${lineas.join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pedidos.csv"',
      "Cache-Control": "no-store",
    },
  });
}
