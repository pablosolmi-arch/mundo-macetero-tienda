// queries/admin-clientes.ts — la vista de clientes se calcula sobre `orders`.
// No hay tabla de clientes: la tienda no pide cuenta para comprar, así que la
// identidad es el correo del pedido y todo lo demás se agrega desde ahí.
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { leads, orders } from "../db/schema";
import { itemsDePedidos } from "./admin";
import type { ArticuloPedido } from "../lib/pedido-vista";

export interface ClienteResumen {
  email: string;
  nombre: string;
  pedidos: number;
  pagados: number;
  totalGastado: number;
  primerPedido: Date | null;
  ultimoPedido: Date | null;
  // Comuna y región del último pedido con despacho. Vacías si solo ha retirado.
  comuna: string;
  region: string;
}

// Suma solo los pedidos pagados: un checkout abandonado no es plata gastada.
const TOTAL_PAGADO = sql`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} else 0 end), 0)`;

// El valor del pedido más reciente que traiga uno no vacío. Se usa para el
// nombre, el teléfono y la dirección: los pedidos manuales a veces se crean sin
// esos datos y no queremos que ese borre el que ya había.
function ultimoNoVacio(columna: ReturnType<typeof sql>) {
  return sql<string | null>`(array_agg(${columna} order by ${orders.createdAt} desc) filter (where ${columna} <> ''))[1]`;
}

// Igual que la anterior, pero solo mirando los pedidos con despacho: la
// dirección de un retiro en tienda no existe.
function ultimoDespacho(columna: ReturnType<typeof sql>) {
  return sql<string | null>`(array_agg(${columna} order by ${orders.createdAt} desc) filter (where ${orders.entrega} = 'despacho' and ${columna} <> ''))[1]`;
}

export async function listarClientes(buscar = "", limite = 200): Promise<ClienteResumen[]> {
  const texto = buscar.trim().toLowerCase();
  // El filtro va en el WHERE, antes de agrupar: el nombre del cliente vive en
  // cada pedido, así que basta con que uno de sus pedidos lo traiga.
  const filtro = texto
    ? sql`(lower(${orders.customerEmail}) like ${`%${texto}%`} or lower(${orders.customerName}) like ${`%${texto}%`})`
    : undefined;

  const filas = await db
    .select({
      email: orders.customerEmail,
      nombre: ultimoNoVacio(sql`${orders.customerName}`),
      pedidos: sql<number>`count(*)::int`,
      pagados: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      totalGastado: sql<string>`${TOTAL_PAGADO}`,
      primerPedido: sql<string | Date | null>`min(${orders.createdAt})`,
      ultimoPedido: sql<string | Date | null>`max(${orders.createdAt})`,
      comuna: ultimoDespacho(sql`${orders.shippingCity}`),
      region: ultimoDespacho(sql`${orders.shippingRegion}`),
    })
    .from(orders)
    .where(filtro)
    .groupBy(orders.customerEmail)
    .orderBy(sql`${TOTAL_PAGADO} desc`)
    .limit(limite);

  return filas.map((f) => ({
    email: f.email,
    nombre: f.nombre ?? "",
    pedidos: f.pedidos,
    pagados: f.pagados,
    totalGastado: Number(f.totalGastado),
    primerPedido: f.primerPedido ? new Date(f.primerPedido) : null,
    ultimoPedido: f.ultimoPedido ? new Date(f.ultimoPedido) : null,
    comuna: f.comuna ?? "",
    region: f.region ?? "",
  }));
}

export interface PedidoDeCliente {
  id: number;
  commerceOrder: string;
  numero: number | null;
  createdAt: Date;
  status: string;
  fulfillment: string;
  amount: string;
  entrega: string;
  items: ArticuloPedido[];
}

export interface ClienteFicha extends ClienteResumen {
  telefono: string;
  direccion: string;
  ticketPromedio: number;
  // Suscrito al newsletter según la tabla `leads`.
  newsletter: boolean;
  historial: PedidoDeCliente[];
}

// El tipo de lead que deja el bloque de newsletter de la portada. Hoy
// components/home/Newsletter.tsx todavía no guarda nada (marca el éxito solo en
// el estado local), así que esto queda en "No suscrito" hasta que ese formulario
// empiece a escribir en `leads` con este tipo.
export const TIPO_NEWSLETTER = "newsletter";

// Ficha de un cliente: su resumen, sus pedidos con los artículos de cada uno y
// los datos de contacto del último pedido que los trajo.
export async function obtenerCliente(email: string): Promise<ClienteFicha | null> {
  const correo = email.trim();
  if (!correo) return null;

  const [resumen] = await db
    .select({
      email: orders.customerEmail,
      nombre: ultimoNoVacio(sql`${orders.customerName}`),
      telefono: ultimoNoVacio(sql`${orders.customerPhone}`),
      pedidos: sql<number>`count(*)::int`,
      pagados: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      totalGastado: sql<string>`${TOTAL_PAGADO}`,
      primerPedido: sql<string | Date | null>`min(${orders.createdAt})`,
      ultimoPedido: sql<string | Date | null>`max(${orders.createdAt})`,
      direccion: ultimoDespacho(sql`${orders.shippingAddress}`),
      comuna: ultimoDespacho(sql`${orders.shippingCity}`),
      region: ultimoDespacho(sql`${orders.shippingRegion}`),
    })
    .from(orders)
    .where(eq(orders.customerEmail, correo))
    .groupBy(orders.customerEmail);

  if (!resumen) return null;

  const filas = await db
    .select({
      id: orders.id,
      commerceOrder: orders.commerceOrder,
      numero: orders.numero,
      createdAt: orders.createdAt,
      status: orders.status,
      fulfillment: orders.fulfillment,
      amount: orders.amount,
      entrega: orders.entrega,
    })
    .from(orders)
    .where(eq(orders.customerEmail, correo))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  // Los artículos de todos sus pedidos en una consulta, no una por pedido.
  const items = await itemsDePedidos(filas.map((f) => f.id));

  const [suscripcion] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.email, correo), eq(leads.tipo, TIPO_NEWSLETTER)))
    .limit(1);

  const pagados = resumen.pagados;
  const totalGastado = Number(resumen.totalGastado);

  return {
    email: resumen.email,
    nombre: resumen.nombre ?? "",
    telefono: resumen.telefono ?? "",
    pedidos: resumen.pedidos,
    pagados,
    totalGastado,
    ticketPromedio: pagados > 0 ? Math.round(totalGastado / pagados) : 0,
    primerPedido: resumen.primerPedido ? new Date(resumen.primerPedido) : null,
    ultimoPedido: resumen.ultimoPedido ? new Date(resumen.ultimoPedido) : null,
    direccion: resumen.direccion ?? "",
    comuna: resumen.comuna ?? "",
    region: resumen.region ?? "",
    newsletter: suscripcion != null,
    historial: filas.map((f) => ({ ...f, items: items.get(f.id) ?? [] })),
  };
}
