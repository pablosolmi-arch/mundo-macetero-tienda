// queries/admin-trafico.ts — de dónde viene el tráfico y qué origen convierte.
//
// Todo sale de nuestros propios eventos (`site_events`) y de nuestros pedidos
// (`orders`), no de un servicio externo: las sesiones son identificadores
// anónimos y ninguna de estas consultas toca un dato personal.
//
// Los eventos anteriores a la atribución no tienen canal, fuente ni dispositivo:
// se agrupan como "sin dato" en vez de desaparecer, para que los totales cuadren
// con el resto del panel.
import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "../db/client";
import { orders, products, siteEvents } from "../db/schema";
import { dentroDelPeriodo, diaSantiago } from "./dia-santiago";
import {
  CAMPOS_CHECKOUT,
  ETIQUETAS_CAMPO,
  ETIQUETAS_DUDA,
  ETIQUETAS_MOTIVO,
  ETIQUETAS_ORIGEN,
  MOTIVOS_DUDA,
  ORIGENES_CONTACTO,
  type CampoCheckout,
  type MotivoCheckout,
  type MotivoDuda,
  type OrigenContacto,
} from "../lib/eventos-checkout";

export const SIN_DATO = "sin dato";

export interface SesionesDia {
  dia: string;
  sesiones: number;
  paginas: number;
}

export interface TotalesSesiones {
  // Sesiones distintas de TODO el período: la que volvió otro día se cuenta una
  // sola vez, así que este número es menor que la suma de las barras diarias.
  sesionesUnicas: number;
  paginas: number;
  paginasPorSesion: number;
  // Clics en el botón flotante de WhatsApp, y cuántas sesiones distintas lo
  // apretaron: un mismo visitante puede apretarlo dos veces.
  whatsapp: number;
  whatsappSesiones: number;
}

export interface EmbudoCanal {
  canal: string;
  sesiones: number;
  fichas: number;
  carritos: number;
  checkouts: number;
  // Sesiones del canal que terminaron en un pedido pagado.
  pagos: number;
}

export interface EmbudoProducto {
  slug: string;
  nombre: string;
  // Sesiones únicas que vieron la ficha y que agregaron ese producto al carrito.
  fichas: number;
  carritos: number;
  conversion: number;
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

export interface CampoAbandono {
  campo: CampoCheckout;
  etiqueta: string;
  // Sesiones distintas que completaron ese campo al menos una vez.
  sesiones: number;
  // Respecto de las sesiones que abrieron el checkout.
  porcentaje: number;
}

export interface ErrorCheckout {
  motivo: string;
  etiqueta: string;
  veces: number;
  sesiones: number;
}

export interface AbandonoCheckout {
  // Sesiones que abrieron la página del checkout: es el 100% de los porcentajes.
  llegaron: number;
  campos: CampoAbandono[];
  // Sesiones que apretaron pagar y salió la petición.
  envios: number;
  // Sesiones que llegaron a tener un pedido creado, pagado o no: es el paso
  // siguiente a apretar pagar y el que hoy está en cero.
  pedidos: number;
  errores: ErrorCheckout[];
}

export interface PaginaVista {
  path: string;
  // Nombre del producto cuando la página es una ficha; null en el resto.
  nombre: string | null;
  vistas: number;
  sesiones: number;
}

// Los eventos del período, en días calendario chilenos (ver dia-santiago.ts).
function eventosDelPeriodo(dias: number) {
  return dentroDelPeriodo(siteEvents.createdAt, dias);
}

function pedidosDelPeriodo(dias: number) {
  return dentroDelPeriodo(orders.createdAt, dias);
}

// Solo estos dos tipos son "una página vista"; 'agregar' y 'checkout' son acciones
// dentro de una página que ya se contó.
const TIPOS_PAGINA = ["visita", "producto"];

// La página del formulario de checkout: su visita es el 100% del abandono.
const RUTA_CHECKOUT = "/checkout";

// El texto de reemplazo va literal en el SQL (no como parámetro) porque la misma
// expresión se repite en el GROUP BY: con dos parámetros distintos Postgres no las
// reconocería como la misma columna.
const canalEvento = sql<string>`coalesce(nullif(${siteEvents.canal}, ''), 'sin dato')`;
const canalPedido = sql<string>`coalesce(nullif(${orders.origenCanal}, ''), 'sin dato')`;

// Sesiones únicas DE CADA DÍA. Una sesión que vuelve el martes cuenta en lunes y
// en martes: para el total del período sin repetir está `totalesSesiones`.
export async function sesionesPorDia(dias = 30): Promise<SesionesDia[]> {
  const dia = diaSantiago(siteEvents.createdAt);
  const filas = await db
    .select({
      dia,
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      paginas: sql<number>`count(*) filter (where ${siteEvents.tipo} in ('visita', 'producto'))::int`,
    })
    .from(siteEvents)
    .where(eventosDelPeriodo(dias))
    .groupBy(dia)
    .orderBy(dia);

  return filas.map((f) => ({ dia: f.dia, sesiones: f.sesiones, paginas: f.paginas }));
}

// El total del período contado de una sola vez, no sumando los días.
export async function totalesSesiones(dias = 30): Promise<TotalesSesiones> {
  const [fila] = await db
    .select({
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      paginas: sql<number>`count(*) filter (where ${siteEvents.tipo} in ('visita', 'producto'))::int`,
      whatsapp: sql<number>`count(*) filter (where ${siteEvents.tipo} = 'whatsapp')::int`,
      whatsappSesiones: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'whatsapp')::int`,
    })
    .from(siteEvents)
    .where(eventosDelPeriodo(dias));

  const sesionesUnicas = fila?.sesiones ?? 0;
  const paginas = fila?.paginas ?? 0;
  return {
    sesionesUnicas,
    paginas,
    paginasPorSesion: sesionesUnicas > 0 ? paginas / sesionesUnicas : 0,
    whatsapp: fila?.whatsapp ?? 0,
    whatsappSesiones: fila?.whatsappSesiones ?? 0,
  };
}

// Dos agregaciones y un cruce en memoria: son un puñado de canales, así que sale
// más barato que un join sobre las dos tablas completas.
export async function traficoPorCanal(dias = 30): Promise<CanalTrafico[]> {
  const [sesiones, ventas] = await Promise.all([
    db
      .select({
        canal: canalEvento,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(eventosDelPeriodo(dias))
      .groupBy(canalEvento),
    db
      .select({
        canal: canalPedido,
        pedidos: sql<number>`count(*)::int`,
        ingresos: sql<string>`coalesce(sum(${orders.amount}), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "paid"), pedidosDelPeriodo(dias)))
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
      .where(eventosDelPeriodo(dias))
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
      .where(and(eq(orders.status, "paid"), pedidosDelPeriodo(dias)))
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
  const cual = sql<string>`coalesce(nullif(${siteEvents.dispositivo}, ''), 'sin dato')`;

  const filas = await db
    .select({
      dispositivo: cual,
      sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
    })
    .from(siteEvents)
    .where(eventosDelPeriodo(dias))
    .groupBy(cual)
    .orderBy(desc(sql`count(distinct ${siteEvents.sessionId})`));

  return filas.map((f) => ({ dispositivo: f.dispositivo, sesiones: f.sesiones }));
}

// El embudo completo abierto por canal: sirve para ver qué canal trae tráfico
// que mira y no compra. Las cuatro primeras etapas salen de site_events (el
// canal viaja en cada evento) y el pago de orders.origen_canal.
export async function embudoPorCanal(dias = 30): Promise<EmbudoCanal[]> {
  const [etapas, pagos] = await Promise.all([
    db
      .select({
        canal: canalEvento,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
        fichas: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'producto')::int`,
        carritos: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'agregar')::int`,
        checkouts: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'checkout')::int`,
      })
      .from(siteEvents)
      .where(eventosDelPeriodo(dias))
      .groupBy(canalEvento),
    // Sesiones con pedido pagado, no pedidos: es la misma unidad que las etapas
    // anteriores, si no el último porcentaje no sería comparable.
    db
      .select({
        canal: canalPedido,
        pagos: sql<number>`count(distinct ${orders.sessionId})::int`,
      })
      .from(orders)
      .where(
        and(eq(orders.status, "paid"), pedidosDelPeriodo(dias), isNotNull(orders.sessionId)),
      )
      .groupBy(canalPedido),
  ]);

  const porCanal = new Map(pagos.map((p) => [p.canal, p.pagos]));

  return etapas
    .map((e) => ({ ...e, pagos: porCanal.get(e.canal) ?? 0 }))
    .sort((a, b) => b.sesiones - a.sesiones || b.pagos - a.pagos);
}

// Dónde se pierde la venta producto por producto: cuántas sesiones vieron la
// ficha y cuántas de ellas agregaron ESE producto al carrito. Una conversión
// baja con muchas vistas apunta a la ficha (foto, precio, descripción).
export async function embudoPorProducto(dias = 30, limite = 10): Promise<EmbudoProducto[]> {
  const filas = await db
    .select({
      slug: siteEvents.productSlug,
      fichas: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'producto')::int`,
      carritos: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'agregar')::int`,
    })
    .from(siteEvents)
    .where(
      and(
        eventosDelPeriodo(dias),
        isNotNull(siteEvents.productSlug),
        inArray(siteEvents.tipo, ["producto", "agregar"]),
      ),
    )
    .groupBy(siteEvents.productSlug)
    .orderBy(desc(sql`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'producto')`))
    .limit(limite);

  const slugs = filas.map((f) => f.slug).filter((s): s is string => !!s);
  const nombres = new Map<string, string>();
  if (slugs.length > 0) {
    const encontrados = await db
      .select({ slug: products.slug, name: products.name })
      .from(products)
      .where(inArray(products.slug, slugs));
    for (const p of encontrados) nombres.set(p.slug, p.name);
  }

  return filas
    .filter((f): f is typeof f & { slug: string } => !!f.slug)
    .map((f) => ({
      slug: f.slug,
      // Si el producto ya no está en el catálogo queda el slug, que igual
      // identifica la ficha que se visitó.
      nombre: nombres.get(f.slug) ?? f.slug,
      fichas: f.fichas,
      carritos: f.carritos,
      conversion: f.fichas > 0 ? (f.carritos / f.fichas) * 100 : 0,
    }));
}

// Dónde se abandona el formulario de checkout: hasta qué campo alcanzó a llegar
// cada sesión, cuántas apretaron pagar y cuántas terminaron con un pedido
// creado. El 100% son las sesiones que ABRIERON la página del checkout (la
// visita a /checkout), no el evento 'checkout', que ya es "apretó pagar".
//
// Los campos van en el orden de la pantalla, incluidos los que nadie completó:
// un cero al principio de la lista es justamente el dato que se busca.
export async function abandonoCheckout(dias = 30): Promise<AbandonoCheckout> {
  const enElPeriodo = eventosDelPeriodo(dias);

  const [resumen, porCampo, fallas, pedidos] = await Promise.all([
    db
      .select({
        llegaron: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'visita' and ${siteEvents.path} = ${RUTA_CHECKOUT})::int`,
        envios: sql<number>`count(distinct ${siteEvents.sessionId}) filter (where ${siteEvents.tipo} = 'checkout_envio')::int`,
      })
      .from(siteEvents)
      .where(enElPeriodo),
    db
      .select({
        campo: siteEvents.campo,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(and(enElPeriodo, eq(siteEvents.tipo, "checkout_campo"), isNotNull(siteEvents.campo)))
      .groupBy(siteEvents.campo),
    db
      .select({
        motivo: siteEvents.campo,
        veces: sql<number>`count(*)::int`,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(and(enElPeriodo, eq(siteEvents.tipo, "checkout_error"), isNotNull(siteEvents.campo)))
      .groupBy(siteEvents.campo)
      .orderBy(desc(sql`count(*)`)),
    // Cualquier pedido del sitio, pagado o no: el paso que sigue a apretar
    // pagar es que exista el pedido, y las ventas cargadas a mano no pasaron
    // por el formulario.
    db
      .select({ sesiones: sql<number>`count(distinct ${orders.sessionId})::int` })
      .from(orders)
      .where(and(pedidosDelPeriodo(dias), isNotNull(orders.sessionId), ne(orders.origen, "manual"))),
  ]);

  const llegaron = resumen[0]?.llegaron ?? 0;
  const sesionesPorCampo = new Map(porCampo.map((f) => [f.campo, f.sesiones]));

  return {
    llegaron,
    campos: CAMPOS_CHECKOUT.map((campo) => {
      const sesiones = sesionesPorCampo.get(campo) ?? 0;
      return {
        campo,
        etiqueta: ETIQUETAS_CAMPO[campo],
        sesiones,
        porcentaje: llegaron > 0 ? (sesiones / llegaron) * 100 : 0,
      };
    }),
    envios: resumen[0]?.envios ?? 0,
    pedidos: pedidos[0]?.sesiones ?? 0,
    errores: fallas
      .filter((f): f is typeof f & { motivo: string } => !!f.motivo)
      .map((f) => ({
        motivo: f.motivo,
        // Un motivo que ya no exista en el código igual se muestra por su
        // código, en vez de desaparecer del informe.
        etiqueta: ETIQUETAS_MOTIVO[f.motivo as MotivoCheckout] ?? f.motivo,
        veces: f.veces,
        sesiones: f.sesiones,
      })),
  };
}

// ---------------------------------------------------------------------------
// Ayuda y contacto: quién pidió hablar con nosotros, desde dónde, qué duda tenía
// y si esa sesión terminó comprando.
//
// Es la mitad que faltaba del embudo. Hasta ahora se veía dónde se caía la
// gente, pero no cuántos pedían ayuda ni si esa ayuda servía para vender.
// ---------------------------------------------------------------------------

// Los eventos que cuentan como "pidió ayuda". Se miden por sesión: la misma
// persona que escribe por WhatsApp y además pide que la llamen es UNA sesión
// asistida, no dos.
const EVENTOS_AYUDA = ["whatsapp", "llamar", "asesoria", "llamada_pedida"] as const;

export interface ContactoPorOrigen {
  origen: string;
  etiqueta: string;
  whatsapp: number;
  llamar: number;
  asesoria: number;
}

export interface DudaDeclarada {
  motivo: string;
  etiqueta: string;
  sesiones: number;
  porcentaje: number;
}

export interface AyudaYContacto {
  // Sesiones distintas que hicieron algún gesto de contacto en el período.
  sesionesAsistidas: number;
  porOrigen: ContactoPorOrigen[];
  // El modal del checkout: a cuántas sesiones se les mostró y qué respondieron.
  modalVisto: number;
  dudas: DudaDeclarada[];
  llamadasPedidas: number;
  // Sesiones asistidas que además dejaron un pedido pagado. Es el número que
  // dice si conviene seguir ofreciendo ayuda o no.
  comprasAsistidas: number;
}

export async function ayudaYContacto(dias = 30): Promise<AyudaYContacto> {
  const enElPeriodo = eventosDelPeriodo(dias);

  const [asistidas, porOrigen, modal, respuestas, llamadas, compras] = await Promise.all([
    db
      .select({ sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int` })
      .from(siteEvents)
      .where(
        and(
          enElPeriodo,
          inArray(siteEvents.tipo, [...EVENTOS_AYUDA]),
          ne(siteEvents.sessionId, ""),
        ),
      ),
    db
      .select({
        origen: siteEvents.campo,
        tipo: siteEvents.tipo,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(
        and(
          enElPeriodo,
          inArray(siteEvents.tipo, ["whatsapp", "llamar", "asesoria"]),
          isNotNull(siteEvents.campo),
        ),
      )
      .groupBy(siteEvents.campo, siteEvents.tipo),
    db
      .select({ sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int` })
      .from(siteEvents)
      .where(and(enElPeriodo, eq(siteEvents.tipo, "abandono_visto"))),
    db
      .select({
        motivo: siteEvents.campo,
        sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int`,
      })
      .from(siteEvents)
      .where(and(enElPeriodo, eq(siteEvents.tipo, "abandono_motivo"), isNotNull(siteEvents.campo)))
      .groupBy(siteEvents.campo),
    db
      .select({ sesiones: sql<number>`count(distinct ${siteEvents.sessionId})::int` })
      .from(siteEvents)
      .where(and(enElPeriodo, eq(siteEvents.tipo, "llamada_pedida"))),
    // Pedidos pagados cuya sesión pidió ayuda en algún momento. El gesto de
    // ayuda no se limita al período del pedido a propósito: alguien puede
    // escribir por WhatsApp un día y comprar tres días después.
    db
      .select({ sesiones: sql<number>`count(distinct ${orders.sessionId})::int` })
      .from(orders)
      .where(
        and(
          eq(orders.status, "paid"),
          pedidosDelPeriodo(dias),
          isNotNull(orders.sessionId),
          ne(orders.sessionId, ""),
          sql`exists (
            select 1 from ${siteEvents}
            where ${siteEvents.sessionId} = ${orders.sessionId}
              and ${siteEvents.tipo} in ('whatsapp', 'llamar', 'asesoria', 'llamada_pedida')
          )`,
        ),
      ),
  ]);

  const clave = (origen: string, tipo: string) => `${origen}|${tipo}`;
  const cuentas = new Map(porOrigen.map((f) => [clave(f.origen ?? "", f.tipo), f.sesiones]));

  const modalVisto = modal[0]?.sesiones ?? 0;
  const porMotivo = new Map(respuestas.map((f) => [f.motivo, f.sesiones]));

  return {
    sesionesAsistidas: asistidas[0]?.sesiones ?? 0,
    // Se listan los cuatro orígenes siempre, incluso en cero: una pantalla que
    // no genera ni una conversación también es un dato.
    porOrigen: ORIGENES_CONTACTO.map((origen: OrigenContacto) => ({
      origen,
      etiqueta: ETIQUETAS_ORIGEN[origen],
      whatsapp: cuentas.get(clave(origen, "whatsapp")) ?? 0,
      llamar: cuentas.get(clave(origen, "llamar")) ?? 0,
      asesoria: cuentas.get(clave(origen, "asesoria")) ?? 0,
    })),
    modalVisto,
    dudas: MOTIVOS_DUDA.map((motivo: MotivoDuda) => {
      const sesiones = porMotivo.get(motivo) ?? 0;
      return {
        motivo,
        etiqueta: ETIQUETAS_DUDA[motivo],
        sesiones,
        porcentaje: modalVisto > 0 ? (sesiones / modalVisto) * 100 : 0,
      };
    }),
    llamadasPedidas: llamadas[0]?.sesiones ?? 0,
    comprasAsistidas: compras[0]?.sesiones ?? 0,
  };
}

export async function paginasMasVistas(dias = 30): Promise<PaginaVista[]> {
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
    .where(and(eventosDelPeriodo(dias), inArray(siteEvents.tipo, TIPOS_PAGINA)))
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
