// queries/admin-clientes.ts — la vista de clientes se calcula sobre `orders`.
// No hay tabla de clientes: la tienda no pide cuenta para comprar, así que la
// identidad es el correo del pedido y todo lo demás se agrega desde ahí.
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { orders } from "../db/schema";

export interface ClienteResumen {
  email: string;
  nombre: string;
  pedidos: number;
  pagados: number;
  totalGastado: number;
  ultimoPedido: Date | null;
}

// Suma solo los pedidos pagados: un checkout abandonado no es plata gastada.
const TOTAL_PAGADO = sql`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} else 0 end), 0)`;

export async function listarClientes(limite = 200): Promise<ClienteResumen[]> {
  const filas = await db
    .select({
      email: orders.customerEmail,
      // El nombre del pedido más reciente que traiga uno: los pedidos manuales a
      // veces se crean sin nombre y no queremos que ese borre el que ya había.
      nombre: sql<string | null>`(array_agg(${orders.customerName} order by ${orders.createdAt} desc) filter (where ${orders.customerName} <> ''))[1]`,
      pedidos: sql<number>`count(*)::int`,
      pagados: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      totalGastado: sql<string>`${TOTAL_PAGADO}`,
      ultimoPedido: sql<string | Date | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .groupBy(orders.customerEmail)
    .orderBy(sql`${TOTAL_PAGADO} desc`)
    .limit(limite);

  return filas.map((f) => ({
    email: f.email,
    nombre: f.nombre ?? "",
    pedidos: f.pedidos,
    pagados: f.pagados,
    totalGastado: Number(f.totalGastado),
    ultimoPedido: f.ultimoPedido ? new Date(f.ultimoPedido) : null,
  }));
}
