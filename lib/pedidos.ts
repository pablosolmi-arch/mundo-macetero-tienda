// Efectos de un pedido que pasa a pagado. Se ejecutan UNA vez, desde el llamador
// que ganó la transición (settleOrder la hace atómica), y ninguno puede romper la
// confirmación del pago: cada efecto captura sus propios errores y deja rastro en
// la bitácora del pedido.
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { orderItems, productVariants, products, type Order } from "../db/schema";
import { consumirUso } from "./descuentos";
import { correoAvisoEquipo, correoConfirmacion } from "./email";
import { registrarEvento } from "../queries/admin";

export async function alPagarse(pedido: Order): Promise<void> {
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, pedido.id),
  });
  const datos = { ...pedido, items };

  // 1. Correos: al cliente y al equipo.
  try {
    const [cliente, equipo] = await Promise.all([
      correoConfirmacion(datos),
      correoAvisoEquipo(datos),
    ]);
    await registrarEvento(
      pedido.id,
      null,
      "correo",
      `confirmación al cliente: ${cliente.enviado ? "enviada" : cliente.detalle} · aviso al equipo: ${equipo.enviado ? "enviado" : equipo.detalle}`,
    );
  } catch {
    // La bitácora falló o algo peor; el pago ya está confirmado y eso manda.
  }

  // 2. Consumir el cupo del código de descuento, si hubo.
  if (pedido.discountCode) {
    try {
      await consumirUso(pedido.discountCode);
    } catch {
      // Un cupo sin descontar es preferible a un pago a medias.
    }
  }

  // 3. Descontar inventario, solo en productos con seguimiento activado. El
  // importador trae stock 1/0 (disponible/no disponible), no cantidades, así que
  // descontar sin ese flag agotaría el catálogo tras la primera venta.
  try {
    for (const item of items) {
      if (item.variantId == null || item.productId == null) continue;
      const producto = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });
      if (!producto?.trackStock) continue;
      await db
        .update(productVariants)
        .set({
          stock: sql`greatest(${productVariants.stock} - ${item.qty}, 0)`,
          available: sql`${productVariants.stock} - ${item.qty} > 0`,
        })
        .where(eq(productVariants.id, item.variantId));
    }
  } catch {
    // El inventario se puede corregir a mano; el pago no.
  }
}
