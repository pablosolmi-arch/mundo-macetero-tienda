// queries/admin.ts — lecturas del panel de administración.
import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { adminUsers, orderEvents, orderItems, orders, siteEvents } from "../db/schema";
import { parseCodigoPedido } from "../lib/pedido-codigo";
import type { ArticuloPedido } from "../lib/pedido-vista";

export interface FiltroPedidos {
  // Estado del pago: pending | paid | rejected | annulled
  estado?: string;
  // Estado logístico: pendiente | preparado | entregado | cancelado
  entrega?: string;
  buscar?: string;
  limite?: number;
}

export interface PedidoLista {
  id: number;
  commerceOrder: string;
  numero: number | null;
  createdAt: Date;
  status: string;
  fulfillment: string;
  origen: string;
  amount: string;
  entrega: string;
  shippingCity: string;
  customerName: string;
  customerEmail: string;
  items: ArticuloPedido[];
}

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoLista[]> {
  const condiciones = [];
  if (filtro.estado) condiciones.push(eq(orders.status, filtro.estado));
  if (filtro.entrega) condiciones.push(eq(orders.fulfillment, filtro.entrega));
  if (filtro.buscar?.trim()) {
    const t = `%${filtro.buscar.trim().toLowerCase()}%`;
    const texto = sql`(lower(${orders.commerceOrder}) like ${t} or lower(${orders.customerEmail}) like ${t} or lower(${orders.customerName}) like ${t})`;
    // Si lo escrito parece un código de pedido ("#7", "7", "#7-25/08"), también
    // busca por el correlativo: es lo que el equipo tiene a mano.
    const numero = parseCodigoPedido(filtro.buscar);
    condiciones.push(numero != null ? sql`(${texto} or ${orders.numero} = ${numero})` : texto);
  }

  const filas = await db.query.orders.findMany({
    where: condiciones.length ? and(...condiciones) : undefined,
    orderBy: [desc(orders.createdAt)],
    limit: filtro.limite ?? 100,
  });

  // Los artículos de TODAS las filas en una sola consulta: una por pedido dejaba
  // la lista en 100 idas y vueltas a la base.
  const items = await itemsDePedidos(filas.map((p) => p.id));

  return filas.map((p) => ({
    id: p.id,
    commerceOrder: p.commerceOrder,
    numero: p.numero,
    createdAt: p.createdAt,
    status: p.status,
    fulfillment: p.fulfillment,
    origen: p.origen,
    amount: p.amount,
    entrega: p.entrega,
    shippingCity: p.shippingCity,
    customerName: p.customerName,
    customerEmail: p.customerEmail,
    items: items.get(p.id) ?? [],
  }));
}

// Artículos agrupados por pedido, en una consulta.
export async function itemsDePedidos(ids: number[]): Promise<Map<number, ArticuloPedido[]>> {
  const agrupados = new Map<number, ArticuloPedido[]>();
  if (ids.length === 0) return agrupados;
  const filas = await db
    .select({
      orderId: orderItems.orderId,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      qty: orderItems.qty,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids))
    .orderBy(asc(orderItems.id));
  for (const fila of filas) {
    const lista = agrupados.get(fila.orderId);
    const item = {
      productName: fila.productName,
      variantName: fila.variantName,
      qty: fila.qty,
    };
    if (lista) lista.push(item);
    else agrupados.set(fila.orderId, [item]);
  }
  return agrupados;
}

export async function obtenerPedido(commerceOrder: string) {
  const pedido = await db.query.orders.findFirst({
    where: eq(orders.commerceOrder, commerceOrder),
  });
  if (!pedido) return null;
  const [items, eventos] = await Promise.all([
    db.query.orderItems.findMany({ where: eq(orderItems.orderId, pedido.id) }),
    // El autor viene del join: la bitácora guarda el id del usuario, y en el
    // historial hay que poder ver quién movió el pedido.
    db
      .select({
        id: orderEvents.id,
        tipo: orderEvents.tipo,
        detalle: orderEvents.detalle,
        createdAt: orderEvents.createdAt,
        autor: sql<string | null>`nullif(coalesce(${adminUsers.nombre}, ''), '')`,
        autorEmail: adminUsers.email,
      })
      .from(orderEvents)
      .leftJoin(adminUsers, eq(adminUsers.id, orderEvents.userId))
      .where(eq(orderEvents.orderId, pedido.id))
      .orderBy(desc(orderEvents.createdAt)),
  ]);
  return { ...pedido, items, eventos };
}

export interface KpisPedidos {
  dias: number;
  pedidos: number;
  articulos: number;
  ingresos: number;
  reembolsos: number;
  porPreparar: number;
  preparados: number;
  entregados: number;
}

// KPIs de la lista de pedidos, para el período que se está mirando. Aparte de
// `metricas` a propósito: acá interesa el trabajo por hacer (qué falta preparar,
// qué se entregó), no el embudo de conversión.
export async function kpisPedidos(dias = 30): Promise<KpisPedidos> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const [resumen] = await db
    .select({
      pedidos: sql<number>`count(*)::int`,
      ingresos: sql<string>`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} else 0 end), 0)`,
      reembolsos: sql<string>`coalesce(sum(${orders.refundedAmount}), 0)`,
      porPreparar: sql<number>`count(*) filter (where ${orders.status} = 'paid' and ${orders.fulfillment} = 'pendiente')::int`,
      preparados: sql<number>`count(*) filter (where ${orders.status} = 'paid' and ${orders.fulfillment} = 'preparado')::int`,
      entregados: sql<number>`count(*) filter (where ${orders.fulfillment} = 'entregado')::int`,
    })
    .from(orders)
    .where(gte(orders.createdAt, desde));

  // Unidades pedidas: se cuentan sobre los pedidos del período, sin filtrar por
  // estado de pago, igual que la columna "Pedidos".
  const [articulos] = await db
    .select({ unidades: sql<number>`coalesce(sum(${orderItems.qty}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(gte(orders.createdAt, desde));

  return {
    dias,
    pedidos: resumen?.pedidos ?? 0,
    articulos: articulos?.unidades ?? 0,
    ingresos: Number(resumen?.ingresos ?? 0),
    reembolsos: Number(resumen?.reembolsos ?? 0),
    porPreparar: resumen?.porPreparar ?? 0,
    preparados: resumen?.preparados ?? 0,
    entregados: resumen?.entregados ?? 0,
  };
}

export interface ResumenConversion {
  // Cuántos pedidos pagados lleva ese correo contando este.
  numeroDelCliente: number;
  // Sesiones distintas de ese visitante antes de comprar (null si el pedido no
  // trae sessionId: los anteriores a la medición y los cargados a mano).
  sesionesAntes: number | null;
}

export async function resumenConversion(pedido: {
  customerEmail: string;
  status: string;
  sessionId: string | null;
  createdAt: Date;
}): Promise<ResumenConversion> {
  const [conteo] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.customerEmail, pedido.customerEmail),
        eq(orders.status, "paid"),
        lte(orders.createdAt, pedido.createdAt),
      ),
    );

  // Se cuentan los pedidos pagados hasta este inclusive. Si este todavía no está
  // pagado no entra en la cuenta, pero para el cliente igual es el siguiente.
  const pagados = conteo?.n ?? 0;
  const numeroDelCliente = pedido.status === "paid" ? Math.max(1, pagados) : pagados + 1;

  if (!pedido.sessionId) return { numeroDelCliente, sesionesAntes: null };

  // Un visitante que vuelve otro día es otra visita, aunque el navegador le
  // conserve el mismo sessionId: se cuentan días distintos con actividad.
  const [sesiones] = await db
    .select({
      n: sql<number>`count(distinct date_trunc('day', ${siteEvents.createdAt}))::int`,
    })
    .from(siteEvents)
    .where(and(eq(siteEvents.sessionId, pedido.sessionId), lt(siteEvents.createdAt, pedido.createdAt)));

  return { numeroDelCliente, sesionesAntes: sesiones?.n ?? 0 };
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
