// queries/admin.ts — lecturas del panel de administración.
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { orderEvents, orderItems, orders, siteEvents } from "../db/schema";

export interface FiltroPedidos {
  // Estado del pago: pending | paid | rejected | annulled
  estado?: string;
  // Estado logístico: pendiente | entregado | cancelado
  entrega?: string;
  buscar?: string;
  limite?: number;
}

export async function listarPedidos(filtro: FiltroPedidos = {}) {
  const condiciones = [];
  if (filtro.estado) condiciones.push(eq(orders.status, filtro.estado));
  if (filtro.entrega) condiciones.push(eq(orders.fulfillment, filtro.entrega));
  if (filtro.buscar?.trim()) {
    const t = `%${filtro.buscar.trim().toLowerCase()}%`;
    condiciones.push(
      sql`(lower(${orders.commerceOrder}) like ${t} or lower(${orders.customerEmail}) like ${t} or lower(${orders.customerName}) like ${t})`,
    );
  }

  return db.query.orders.findMany({
    where: condiciones.length ? and(...condiciones) : undefined,
    orderBy: [desc(orders.createdAt)],
    limit: filtro.limite ?? 100,
  });
}

export async function obtenerPedido(commerceOrder: string) {
  const pedido = await db.query.orders.findFirst({
    where: eq(orders.commerceOrder, commerceOrder),
  });
  if (!pedido) return null;
  const [items, eventos] = await Promise.all([
    db.query.orderItems.findMany({ where: eq(orderItems.orderId, pedido.id) }),
    db.query.orderEvents.findMany({
      where: eq(orderEvents.orderId, pedido.id),
      orderBy: [desc(orderEvents.createdAt)],
    }),
  ]);
  return { ...pedido, items, eventos };
}

export interface Metricas {
  dias: number;
  ingresos: number;
  pedidosPagados: number;
  ticketPromedio: number;
  pendientes: number;
  porEntregar: number;
  reembolsado: number;
  embudo: { visitas: number; fichas: number; carritos: number; checkouts: number; pagos: number };
  conversion: number;
  topProductos: { nombre: string; unidades: number; ingresos: number }[];
  porDia: { dia: string; pedidos: number; ingresos: number }[];
}

// Todo se calcula sobre nuestra propia base: los pedidos vienen de `orders` y el
// embudo de `site_events`, así que la conversión es real y no una estimación.
export async function metricas(dias = 30): Promise<Metricas> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const [resumen] = await db
    .select({
      ingresos: sql<string>`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} else 0 end), 0)`,
      pagados: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      pendientes: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
      porEntregar: sql<number>`count(*) filter (where ${orders.status} = 'paid' and ${orders.fulfillment} = 'pendiente')::int`,
      reembolsado: sql<string>`coalesce(sum(${orders.refundedAmount}), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, desde));

  const eventos = await db
    .select({ tipo: siteEvents.tipo, n: sql<number>`count(distinct ${siteEvents.sessionId})::int` })
    .from(siteEvents)
    .where(gte(siteEvents.createdAt, desde))
    .groupBy(siteEvents.tipo);

  const porTipo = new Map(eventos.map((e) => [e.tipo, e.n]));
  const visitas = (porTipo.get("visita") ?? 0) + (porTipo.get("producto") ?? 0);
  const pagados = resumen?.pagados ?? 0;

  const top = await db
    .select({
      nombre: orderItems.productName,
      unidades: sql<number>`sum(${orderItems.qty})::int`,
      ingresos: sql<string>`sum(${orderItems.unitPrice} * ${orderItems.qty})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.status, "paid"), gte(orders.createdAt, desde)))
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.qty})`))
    .limit(8);

  const porDia = await db
    .select({
      dia: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      pedidos: sql<number>`count(*)::int`,
      ingresos: sql<string>`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} else 0 end), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, desde))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  const ingresos = Number(resumen?.ingresos ?? 0);

  return {
    dias,
    ingresos,
    pedidosPagados: pagados,
    ticketPromedio: pagados > 0 ? Math.round(ingresos / pagados) : 0,
    pendientes: resumen?.pendientes ?? 0,
    porEntregar: resumen?.porEntregar ?? 0,
    reembolsado: Number(resumen?.reembolsado ?? 0),
    embudo: {
      visitas,
      fichas: porTipo.get("producto") ?? 0,
      carritos: porTipo.get("agregar") ?? 0,
      checkouts: porTipo.get("checkout") ?? 0,
      pagos: pagados,
    },
    conversion: visitas > 0 ? (pagados / visitas) * 100 : 0,
    topProductos: top.map((t) => ({
      nombre: t.nombre,
      unidades: t.unidades,
      ingresos: Number(t.ingresos),
    })),
    porDia: porDia.map((d) => ({ dia: d.dia, pedidos: d.pedidos, ingresos: Number(d.ingresos) })),
  };
}

// Registra en la bitácora quién hizo qué sobre un pedido.
export async function registrarEvento(
  orderId: number,
  userId: number | null,
  tipo: string,
  detalle = "",
) {
  await db.insert(orderEvents).values({ orderId, userId, tipo, detalle });
}

export async function contarPedidosPorEstado() {
  const filas = await db
    .select({ estado: orders.status, n: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);
  return new Map(filas.map((f) => [f.estado, f.n]));
}

export async function pedidosPorIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db.query.orders.findMany({ where: inArray(orders.id, ids) });
}
