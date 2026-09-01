// tests/queries/admin-panel.test.ts — consultas del panel de pedidos y clientes.
//
// La base es la misma de producción, así que estas pruebas crean SUS pedidos, con
// un correo claramente de prueba, y los borran en afterAll. Dos cuidados extra:
//   - `numero` se inserta a mano (un correlativo altísimo, y null en el otro): si
//     se dejara a la secuencia, cada corrida quemaría correlativos reales y los
//     códigos de los pedidos de verdad saldrían con saltos.
//   - nada se marca pagado a través de settleOrder, para no disparar correos.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { orderEvents, orderItems, orders, siteEvents } from "../../db/schema";
import {
  checkoutsSinPagar,
  itemsDePedidos,
  kpisPedidos,
  listarPedidos,
  metricas,
  obtenerPedido,
  resumenConversion,
} from "../../queries/admin";
import { listarClientes, obtenerCliente } from "../../queries/admin-clientes";

const CORREO = "prueba-panel@ejemplo.cl";
const SESION = "sesion-prueba-panel";
const NUMERO_PRUEBA = 999901;
const REF_PAGADO = "MM-prueba-panel-pagado";
const REF_PENDIENTE = "MM-prueba-panel-pendiente";

let idPagado = 0;
let idPendiente = 0;

describe("consultas del panel de administración", () => {
  beforeAll(async () => {
    const [pagado] = await db
      .insert(orders)
      .values({
        commerceOrder: REF_PAGADO,
        numero: NUMERO_PRUEBA,
        status: "paid",
        fulfillment: "preparado",
        subtotal: "20000",
        amount: "20000",
        entrega: "despacho",
        origen: "web",
        customerName: "Cliente De Prueba",
        customerEmail: CORREO,
        customerPhone: "+56 9 0000 0000",
        shippingAddress: "Calle Falsa 123",
        shippingCity: "Ñuñoa",
        shippingRegion: "Región Metropolitana",
        sessionId: SESION,
        origenCanal: "busqueda",
        origenFuente: "google",
        preparadoAt: new Date(),
        paidAt: new Date(),
      })
      .returning();
    idPagado = pagado.id;

    const [pendiente] = await db
      .insert(orders)
      .values({
        commerceOrder: REF_PENDIENTE,
        // Sin correlativo: es el caso de los pedidos anteriores a la numeración.
        numero: null,
        status: "pending",
        subtotal: "5000",
        amount: "5000",
        entrega: "retiro",
        origen: "manual",
        customerEmail: CORREO,
      })
      .returning();
    idPendiente = pendiente.id;

    await db.insert(orderItems).values([
      {
        orderId: idPagado,
        productName: "Macetero De Prueba",
        variantName: "Negro",
        unitPrice: "5000",
        qty: 2,
      },
      {
        orderId: idPagado,
        productName: "Base De Prueba",
        variantName: "Default Title",
        unitPrice: "5000",
        qty: 2,
      },
    ]);

    await db.insert(orderEvents).values({
      orderId: idPagado,
      userId: null,
      tipo: "preparado",
      detalle: "marcado en la prueba",
    });

    await db.insert(siteEvents).values([
      { tipo: "visita", sessionId: SESION, createdAt: new Date(Date.now() - 3 * 86400000) },
      { tipo: "producto", sessionId: SESION, createdAt: new Date(Date.now() - 86400000) },
    ]);
  });

  afterAll(async () => {
    const ids = [idPagado, idPendiente].filter((id) => id > 0);
    if (ids.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, ids));
      await db.delete(orderEvents).where(inArray(orderEvents.orderId, ids));
      await db.delete(orders).where(inArray(orders.id, ids));
    }
    await db.delete(siteEvents).where(eq(siteEvents.sessionId, SESION));
  });

  it("trae los artículos de cada pedido sin una consulta por fila", async () => {
    const agrupados = await itemsDePedidos([idPagado, idPendiente]);
    expect(agrupados.get(idPagado)?.map((i) => i.productName)).toEqual([
      "Macetero De Prueba",
      "Base De Prueba",
    ]);
    expect(agrupados.get(idPendiente)).toBeUndefined();
  });

  it("lista los pedidos con sus artículos", async () => {
    const filas = await listarPedidos({ buscar: CORREO });
    expect(filas.length).toBe(2);
    const pagado = filas.find((f) => f.commerceOrder === REF_PAGADO);
    expect(pagado?.numero).toBe(NUMERO_PRUEBA);
    expect(pagado?.items.length).toBe(2);
    expect(pagado?.fulfillment).toBe("preparado");
  });

  it("busca por el código del pedido además del texto", async () => {
    const porCodigo = await listarPedidos({ buscar: `#${NUMERO_PRUEBA}` });
    expect(porCodigo.some((f) => f.commerceOrder === REF_PAGADO)).toBe(true);

    // La referencia técnica sigue sirviendo para buscar.
    const porReferencia = await listarPedidos({ buscar: REF_PENDIENTE });
    expect(porReferencia.map((f) => f.commerceOrder)).toEqual([REF_PENDIENTE]);
  });

  it("filtra por estado de preparación", async () => {
    const preparados = await listarPedidos({ buscar: CORREO, entrega: "preparado" });
    expect(preparados.map((f) => f.commerceOrder)).toEqual([REF_PAGADO]);
    const porPreparar = await listarPedidos({ buscar: CORREO, entrega: "pendiente" });
    expect(porPreparar.map((f) => f.commerceOrder)).toEqual([REF_PENDIENTE]);
  });

  it("calcula los KPIs del período", async () => {
    const kpis = await kpisPedidos(30);
    expect(kpis.dias).toBe(30);
    // Los pedidos de la prueba están dentro del período, así que los totales los
    // incluyen: se comprueban las cotas, no un número exacto de producción.
    expect(kpis.pedidos).toBeGreaterThanOrEqual(2);
    expect(kpis.articulos).toBeGreaterThanOrEqual(4);
    expect(kpis.ingresos).toBeGreaterThanOrEqual(20000);
    expect(kpis.preparados).toBeGreaterThanOrEqual(1);
    expect(kpis.reembolsos).toBeGreaterThanOrEqual(0);
  });

  it("trae el detalle con la bitácora", async () => {
    const detalle = await obtenerPedido(REF_PAGADO);
    expect(detalle?.items.length).toBe(2);
    expect(detalle?.eventos[0].tipo).toBe("preparado");
    // Evento sin usuario: no hay autor que mostrar.
    expect(detalle?.eventos[0].autor).toBeNull();
  });

  it("resume la conversión del pedido", async () => {
    const detalle = await obtenerPedido(REF_PAGADO);
    expect(detalle).not.toBeNull();
    const resumen = await resumenConversion(detalle!);
    expect(resumen.numeroDelCliente).toBe(1);
    // Dos días distintos con actividad antes de la compra.
    expect(resumen.sesionesAntes).toBe(2);
  });

  it("un pedido sin sesión no reporta sesiones previas", async () => {
    const detalle = await obtenerPedido(REF_PENDIENTE);
    const resumen = await resumenConversion(detalle!);
    expect(resumen.sesionesAntes).toBeNull();
    // El pendiente sería su segundo pedido: ya tiene uno pagado.
    expect(resumen.numeroDelCliente).toBe(2);
  });


  it("lista los checkouts que quedaron sin pagar", async () => {
    const sinPagar = await checkoutsSinPagar(30);
    // El pendiente de la prueba está en el período y suma sus $5.000.
    expect(sinPagar.total).toBeGreaterThanOrEqual(1);
    expect(sinPagar.monto).toBeGreaterThanOrEqual(5000);
    expect(sinPagar.filas.length).toBeLessThanOrEqual(10);
    const nuestro = sinPagar.filas.find((f) => f.commerceOrder === REF_PENDIENTE);
    expect(nuestro).toBeDefined();
    expect(nuestro!.monto).toBe(5000);
    expect(nuestro!.numero).toBeNull();
    // Sin canal de origen: se agrupa como "sin dato", no queda vacío.
    expect(nuestro!.canal).toBe("sin dato");
    expect(nuestro!.createdAt).toBeInstanceOf(Date);
    // Del más nuevo al más antiguo.
    const fechas = sinPagar.filas.map((f) => f.createdAt.getTime());
    expect([...fechas].sort((a, b) => b - a)).toEqual(fechas);
  });

  it("el embudo mide todos sus pasos en sesiones únicas", async () => {
    const m = await metricas(30);
    // Cada paso es un subconjunto del anterior salvo el pago, que puede venir de
    // una sesión que no registró checkout (pedidos viejos, o pagos reintentados).
    expect(m.embudo.fichas).toBeLessThanOrEqual(m.embudo.visitas);
    expect(m.embudo.carritos).toBeLessThanOrEqual(m.embudo.visitas);
    expect(m.embudo.checkouts).toBeLessThanOrEqual(m.embudo.visitas);
    // Un pedido por sesión como mínimo: nunca menos pedidos que sesiones que pagaron.
    expect(m.pedidosDelEmbudo).toBeGreaterThanOrEqual(m.embudo.pagos);
    // El pedido manual de la prueba está pendiente, no pagado, así que no suma acá.
    expect(m.ventasManuales).toBeGreaterThanOrEqual(0);
    expect(m.conversion).toBeGreaterThanOrEqual(0);
    // Los días vienen en formato ISO y ordenados.
    const dias = m.porDia.map((d) => d.dia);
    expect(dias.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
    expect([...dias].sort()).toEqual(dias);
  });

  describe("clientes", () => {
    it("agrupa al cliente con su ubicación y su primer pedido", async () => {
      const clientes = await listarClientes(CORREO);
      expect(clientes.length).toBe(1);
      const c = clientes[0];
      expect(c.email).toBe(CORREO);
      expect(c.nombre).toBe("Cliente De Prueba");
      expect(c.pedidos).toBe(2);
      expect(c.pagados).toBe(1);
      expect(c.totalGastado).toBe(20000);
      expect(c.comuna).toBe("Ñuñoa");
      expect(c.primerPedido).toBeInstanceOf(Date);
      expect(c.ultimoPedido).toBeInstanceOf(Date);
    });

    it("arma la ficha con contacto, ticket promedio e historial", async () => {
      const ficha = await obtenerCliente(CORREO);
      expect(ficha?.telefono).toBe("+56 9 0000 0000");
      expect(ficha?.direccion).toBe("Calle Falsa 123");
      expect(ficha?.region).toBe("Región Metropolitana");
      // Promedio sobre lo pagado: 20.000 en un pedido pagado.
      expect(ficha?.ticketPromedio).toBe(20000);
      expect(ficha?.historial.length).toBe(2);
      // El historial viene del más nuevo al más antiguo, con los artículos puestos.
      const conArticulos = ficha?.historial.find((p) => p.commerceOrder === REF_PAGADO);
      expect(conArticulos?.items.length).toBe(2);
      expect(ficha?.newsletter).toBe(false);
    });

    it("un correo desconocido no tiene ficha", async () => {
      expect(await obtenerCliente("nadie-por-aqui@ejemplo.cl")).toBeNull();
      expect(await obtenerCliente("  ")).toBeNull();
    });
  });
});
