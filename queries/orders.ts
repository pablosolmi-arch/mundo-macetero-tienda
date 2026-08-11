// queries/orders.ts
import { db } from "../db/client";
import { orders, orderItems } from "../db/schema";
import { and, eq, ne } from "drizzle-orm";
import type { OrderStatus } from "../lib/flow";
import type { Entrega } from "../lib/pricing";

export interface NewOrderLine {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  qty: number;
}

export interface NewOrderInput {
  commerceOrder: string;
  // All figures already recomputed server-side.
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  shippingLabel: string;
  shippingCost: number;
  amount: number;
  entrega: Entrega;
  // 'web' es el checkout de la tienda; 'manual' son las ventas que el equipo
  // toma por WhatsApp o teléfono y carga desde el panel.
  origen?: "web" | "manual";
  // Pasarela que va a cobrar este pedido (mercadopago | flow | manual).
  gateway?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    note: string;
  };
  lines: NewOrderLine[];
}

// Persists the order as 'pending' before the customer leaves for Flow, so an
// abandoned or unconfirmed payment still leaves a record of what was requested.
export async function createPendingOrder(input: NewOrderInput) {
  const [order] = await db
    .insert(orders)
    .values({
      commerceOrder: input.commerceOrder,
      status: "pending",
      subtotal: String(input.subtotal),
      discountCode: input.discountCode,
      discountAmount: String(input.discountAmount),
      shippingLabel: input.shippingLabel,
      shippingCost: String(input.shippingCost),
      amount: String(input.amount),
      entrega: input.entrega,
      origen: input.origen ?? "web",
      gateway: input.gateway ?? "flow",
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      shippingAddress: input.customer.address,
      shippingCity: input.customer.city,
      shippingRegion: input.customer.region,
      note: input.customer.note,
    })
    .returning();

  if (input.lines.length > 0) {
    await db.insert(orderItems).values(
      input.lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        variantName: line.variantName,
        unitPrice: String(line.unitPrice),
        qty: line.qty,
      })),
    );
  }

  return order;
}

export async function getOrderByCommerceOrder(commerceOrder: string) {
  return (
    (await db.query.orders.findFirst({ where: eq(orders.commerceOrder, commerceOrder) })) ?? null
  );
}

export async function getOrderWithItems(commerceOrder: string) {
  const order = await getOrderByCommerceOrder(commerceOrder);
  if (!order) return null;
  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) });
  return { ...order, items };
}

export interface SettleOrderInput {
  commerceOrder: string;
  status: OrderStatus;
  flowToken?: string;
  flowOrder?: string | null;
  paymentMedia?: string | null;
}

// Applies Flow's authoritative status to an order. Idempotent: Flow may call the
// confirmation URL more than once, and an order already marked 'paid' is never
// downgraded by a later duplicate or out-of-order callback.
//
// `seVolvioPagado` es true SOLO para el llamador cuya escritura movió el pedido a
// 'paid'. La condición status <> 'paid' va en el propio UPDATE: los callbacks de
// confirmación y de retorno llegan casi juntos, y sin esa condición ambos creerían
// haber hecho la transición y los correos saldrían dos veces.
export async function settleOrder(
  input: SettleOrderInput,
): Promise<{ order: typeof orders.$inferSelect; seVolvioPagado: boolean } | null> {
  const existing = await getOrderByCommerceOrder(input.commerceOrder);
  if (!existing) return null;
  if (existing.status === "paid") return { order: existing, seVolvioPagado: false };

  const [updated] = await db
    .update(orders)
    .set({
      status: input.status,
      flowToken: input.flowToken ?? existing.flowToken,
      flowOrder: input.flowOrder ?? existing.flowOrder,
      paymentMedia: input.paymentMedia ?? existing.paymentMedia,
      paidAt: input.status === "paid" ? new Date() : existing.paidAt,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.commerceOrder, input.commerceOrder), ne(orders.status, "paid")))
    .returning();

  if (!updated) {
    // Otro llamador ganó la carrera y ya lo dejó pagado.
    const actual = await getOrderByCommerceOrder(input.commerceOrder);
    return actual ? { order: actual, seVolvioPagado: false } : null;
  }
  return { order: updated, seVolvioPagado: updated.status === "paid" };
}
