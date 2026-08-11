import { NextResponse } from "next/server";
import { and, asc, eq, gte, lte, ne, notExists, sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import { orderEvents, orderItems, orders } from "../../../../db/schema";
import { correoCarritoAbandonado } from "../../../../lib/email";
import { registrarEvento } from "../../../../queries/admin";

// Recuperación de carritos abandonados. El checkout guarda el pedido como
// 'pending' antes de mandar al cliente a Flow, así que un pago que nunca se
// confirmó deja un pedido pendiente con su carrito completo: esta rutina le
// escribe una vez con un link que lo restaura (/retomar/<commerceOrder>).
//
// Ventana de 3 a 48 horas desde la creación:
//   - Antes de las 3 horas el cliente puede seguir pagando (transferencia o
//     cupón de pago tardan en acreditarse, y Flow confirma después): escribirle
//     ahí sería avisarle de un abandono que no ocurrió.
//   - Después de las 48 horas el correo ya no recupera la compra y se lee como
//     spam, con el riesgo de reputación que eso trae para el dominio.
//
// El evento 'correo-carrito' se registra SIEMPRE, incluso si el envío falla o se
// omite (el detalle lo dice): es lo que saca al pedido de la selección y evita
// reintentar el mismo pedido cada día hasta que salga de la ventana.

// Nunca prerenderizar: la ruta lee la base y manda correos.
export const dynamic = "force-dynamic";

const HORA = 60 * 60 * 1000;
const MAX_POR_CORRIDA = 20;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  // Mismo criterio que el keep-alive: sin su credencial la ruta se niega a
  // correr en lugar de quedar abierta a internet.
  if (!secret) {
    return NextResponse.json(
      { message: "La recuperación de carritos no está configurada. Falta la variable CRON_SECRET." },
      { status: 503 },
    );
  }

  // Vercel Cron manda `Authorization: Bearer $CRON_SECRET` automáticamente
  // cuando la variable existe en el proyecto.
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  // Sin la clave de Resend ningún correo puede salir. Salir temprano SIN marcar
  // eventos: si se marcara "omitido", el único recordatorio de cada pedido
  // quedaría consumido para siempre sin haberse enviado nunca.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, revisados: 0, enviados: 0, aviso: "RESEND_API_KEY no configurada" });
  }


  const ahora = Date.now();
  const desde = new Date(ahora - 48 * HORA);
  const hasta = new Date(ahora - 3 * HORA);

  let pendientes;
  try {
    pendientes = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "pending"),
          // Los pedidos creados a mano en el panel no vienen de un carrito.
          eq(orders.origen, "web"),
          ne(orders.customerEmail, ""),
          gte(orders.createdAt, desde),
          lte(orders.createdAt, hasta),
          notExists(
            db
              .select({ uno: sql`1` })
              .from(orderEvents)
              .where(
                and(
                  eq(orderEvents.orderId, orders.id),
                  eq(orderEvents.tipo, "correo-carrito"),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(orders.createdAt))
      .limit(MAX_POR_CORRIDA);
  } catch (error) {
    // Solo el motivo de la falla, nunca datos del cliente ni la conexión.
    console.error(
      "carritos abandonados: la consulta falló:",
      error instanceof Error ? error.message : "error desconocido",
    );
    return NextResponse.json(
      { ok: false, message: "No se pudieron leer los carritos abandonados." },
      { status: 500 },
    );
  }

  let enviados = 0;

  for (const pedido of pendientes) {
    // Un pedido que falle no debe cortar la corrida de los demás.
    try {
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, pedido.id),
      });
      const resultado = await correoCarritoAbandonado({ ...pedido, items });
      if (resultado.enviado) enviados++;
      await registrarEvento(
        pedido.id,
        null,
        "correo-carrito",
        resultado.enviado ? "recordatorio enviado al cliente" : resultado.detalle,
      );
    } catch (error) {
      console.error(
        "carritos abandonados: fallo al procesar un pedido:",
        error instanceof Error ? error.message : "error desconocido",
      );
    }
  }

  return NextResponse.json({ ok: true, revisados: pendientes.length, enviados });
}
