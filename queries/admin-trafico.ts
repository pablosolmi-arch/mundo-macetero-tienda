// queries/admin-trafico.ts — de dónde viene el tráfico y qué origen convierte.
//
// Todo sale de nuestros propios eventos (`site_events`) y de nuestros pedidos
// (`orders`), no de un servicio externo: las sesiones son identificadores
// anónimos y ninguna de estas consultas toca un dato personal.
//
// Los eventos anteriores a la atribución no tienen canal, fuente ni dispositivo:
// se agrupan como "sin dato" en vez de desaparecer, para que los totales cuadren
// con el resto del panel.
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { orders, products, siteEvents } from "../db/schema";

export const SIN_DATO = "sin dato";

export interface SesionesDia {
  dia: string;
  sesiones: number;
  paginas: number;
}

export interface CanalTrafico {
  canal: string;
  sesiones: number;
  pedidos: number;
  ingresos: number;
  // Pedidos pagados por sesión, en porcentaje.
  conversion: number;
}

export interface FuenteTrafico {
  canal: string;
  fuente: string;
  campana: string;
  sesiones: number;
  pedidos: number;
}

export interface DispositivoTrafico {
  dispositivo: string;
  sesiones: number;
}

export interface PaginaVista {
  path: string;
  // Nombre del producto cuando la página es una ficha; null en el resto.
  nombre: string | null;
  vistas: number;
  sesiones: number;
}

function desdeHace(dias: number): Date {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

// Solo estos dos tipos son "una página vista"; 'agregar' y 'checkout' son acciones
// dentro de una página que ya se contó.
const TIPOS_PAGINA = ["visita", "producto"];

// El texto de reemplazo va literal en el SQL (no como parámetro) porque la misma
// expresión se repite en el GROUP BY: con dos parámetros distintos Postgres no las
// reconocería como la misma columna.
const canalEvento = sql<string>`coalesce(nullif(${siteEvents.canal}, ''), 'sin dato')`;
const canalPedido = sql<string>`coalesce(nullif(${orders.origenCanal}, ''), 'sin dato')`;

export async function sesionesPorDia(dias = 30): Promise<SesionesDia[]> {
  const desde = desdeHace(dias);
  const filas = await db
    .select({
      dia: sql<string>`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD')`,
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      paginas: sql<number>`count(*) filter (where ${siteEvents.tipo} in ('visita', 'producto'))::int`,
    })
    .from(siteEvents)
    .where(gte(siteEvents.createdAt, desde))
    .groupBy(sql`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD')`);

  return filas.map((f) => ({ dia: f.dia, sesiones: f.sesiones, paginas: f.paginas }));
}

// Dos agregaciones y un cruce en memoria: son un puñado de canales, así que sale
// más barato que un join sobre las dos tablas completas.
export async function traficoPorCanal(dias = 30): Promise<CanalTrafico[]> {
  const desde = desdeHace(dias);

  const [sesiones, ventas] = await Promise.all([
    db
      .select({
        canal: canalEvento,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, desde))
      .groupBy(canalEvento),
    db
      .select({
        canal: canalPedido,
        pedidos: sql<number>`count(*)::int`,
        ingresos: sql<string>`coalesce(sum(${orders.amount}), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "paid"), gte(orders.createdAt, desde)))
      .groupBy(canalPedido),
  ]);

  const porCanal = new Map<string, CanalTrafico>();
  const fila = (canal: string): CanalTrafico => {
    const existente = porCanal.get(canal);
    if (existente) return existente;
    const nueva = { canal, sesiones: 0, pedidos: 0, ingresos: 0, conversion: 0 };
    porCanal.set(canal, nueva);
    return nueva;
  };

  for (const s of sesiones) fila(s.canal).sesiones = s.sesiones;
  for (const v of ventas) {
    const f = fila(v.canal);
    f.pedidos = v.pedidos;
    f.ingresos = Number(v.ingresos);
  }

  return [...porCanal.values()]
    .map((f) => ({ ...f, conversion: f.sesiones > 0 ? (f.pedidos / f.sesiones) * 100 : 0 }))
    .sort((a, b) => b.sesiones - a.sesiones || b.pedidos - a.pedidos);
}

export async function topFuentes(dias = 30): Promise<FuenteTrafico[]> {
  const desde = desdeHace(dias);
  const fuenteEvento = sql<string>`coalesce(nullif(${siteEvents.fuente}, ''), 'sin dato')`;
  const campanaEvento = sql<string>`coalesce(nullif(${siteEvents.campana}, ''), '')`;
  const fuentePedido = sql<string>`coalesce(nullif(${orders.origenFuente}, ''), 'sin dato')`;
  const campanaPedido = sql<string>`coalesce(nullif(${orders.origenCampana}, ''), '')`;

  const [sesiones, ventas] = await Promise.all([
    db
      .select({
        canal: canalEvento,
        fuente: fuenteEvento,
        campana: campanaEvento,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, desde))
      .groupBy(canalEvento, fuenteEvento, campanaEvento)
      .orderBy(desc(sql`count(distinct ${siteEvents.sessionId})`))
      .limit(10),
    db
      .select({
        canal: canalPedido,
        fuente: fuentePedido,
        campana: campanaPedido,
        pedidos: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(eq(orders.status, "paid"), gte(orders.createdAt, desde)))
      .groupBy(canalPedido, fuentePedido, campanaPedido),
  ]);

  const clave = (canal: string, fuente: string, campana: string) => `${canal}|${fuente}|${campana}`;
  const pedidos = new Map(ventas.map((v) => [clave(v.canal, v.fuente, v.campana), v.pedidos]));

  return sesiones.map((s) => ({
    canal: s.canal,
    fuente: s.fuente,
    campana: s.campana,
    sesiones: s.sesiones,
    pedidos: pedidos.get(clave(s.canal, s.fuente, s.campana)) ?? 0,
  }));
}

export async function dispositivos(dias = 30): Promise<DispositivoTrafico[]> {
  const desde = desdeHace(dias);
  const cual = sql<string>`coalesce(nullif(${siteEvents.dispositivo}, ''), 'sin dato')`;

  const filas = await db
    .select({
      dispositivo: cual,
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
    })
    .from(siteEvents)
    .where(gte(siteEvents.createdAt, desde))
    .groupBy(cual)
    .orderBy(desc(sql`count(distinct ${siteEvents.sessionId})`));

  return filas.map((f) => ({ dispositivo: f.dispositivo, sesiones: f.sesiones }));
}

export async function paginasMasVistas(dias = 30): Promise<PaginaVista[]> {
  const desde = desdeHace(dias);

  const filas = await db
    .select({
      path: siteEvents.path,
      // Todas las vistas de una misma ficha comparten el slug, así que cualquiera
      // de ellas sirve para buscar el nombre del producto.
      slug: sql<string | null>`max(${siteEvents.productSlug})`,
      vistas: sql<number>`count(*)::int`,
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
    })
    .from(siteEvents)
    .where(and(gte(siteEvents.createdAt, desde), inArray(siteEvents.tipo, TIPOS_PAGINA)))
    .groupBy(siteEvents.path)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Un solo viaje más para los nombres de las fichas que salieron en el top.
  const slugs = [...new Set(filas.map((f) => f.slug).filter((s): s is string => !!s))];
  const nombres = new Map<string, string>();
  if (slugs.length > 0) {
    const encontrados = await db
      .select({ slug: products.slug, name: products.name })
      .from(products)
      .where(inArray(products.slug, slugs));
    for (const p of encontrados) nombres.set(p.slug, p.name);
  }

  return filas.map((f) => ({
    path: f.path,
    nombre: (f.slug && nombres.get(f.slug)) || null,
    vistas: f.vistas,
    sesiones: f.sesiones,
  }));
}
