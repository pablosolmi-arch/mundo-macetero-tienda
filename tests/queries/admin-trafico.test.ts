// tests/queries/admin-trafico.test.ts
//
// La base de pruebas es la misma que usa la tienda, así que estas pruebas solo
// insertan eventos de sesión con un prefijo propio y los borran al final. No
// insertan pedidos: las cifras de venta se leen tal como estén.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { like } from "drizzle-orm";
import { db } from "../../db/client";
import { siteEvents } from "../../db/schema";
import {
  dispositivos,
  embudoPorCanal,
  embudoPorProducto,
  paginasMasVistas,
  sesionesPorDia,
  topFuentes,
  totalesSesiones,
  traficoPorCanal,
} from "../../queries/admin-trafico";
import { serieDeDias } from "../../queries/dia-santiago";

const PREFIJO = "test-trafico-";
const SLUG = "test-trafico-macetero";
const PATH = `/producto/${SLUG}`;

describe("consultas de tráfico", () => {
  beforeAll(async () => {
    await db.insert(siteEvents).values([
      {
        tipo: "visita",
        path: PATH,
        sessionId: `${PREFIJO}1`,
        canal: "social",
        fuente: "instagram",
        campana: "test-campana",
        dispositivo: "movil",
      },
      {
        tipo: "producto",
        path: PATH,
        productSlug: SLUG,
        sessionId: `${PREFIJO}1`,
        canal: "social",
        fuente: "instagram",
        campana: "test-campana",
        dispositivo: "movil",
      },
      {
        tipo: "agregar",
        path: PATH,
        sessionId: `${PREFIJO}2`,
        canal: "social",
        fuente: "instagram",
        campana: "test-campana",
        dispositivo: "escritorio",
      },
      // La misma sesión 1 agrega ESE producto al carrito: es lo que mide el
      // paso ficha → carrito de `embudoPorProducto`.
      {
        tipo: "agregar",
        path: PATH,
        productSlug: SLUG,
        sessionId: `${PREFIJO}1`,
        canal: "social",
        fuente: "instagram",
        campana: "test-campana",
        dispositivo: "movil",
      },
      // Evento anterior a la atribución: sin canal ni dispositivo.
      { tipo: "visita", path: PATH, sessionId: `${PREFIJO}3` },
    ]);
  });

  afterAll(async () => {
    await db.delete(siteEvents).where(like(siteEvents.sessionId, `${PREFIJO}%`));
  });

  it("cuenta sesiones y páginas vistas por día", async () => {
    const filas = await sesionesPorDia(7);
    // El día se agrupa en hora de Chile, no en UTC: después de las 20:00 el día
    // UTC ya es el siguiente y la prueba fallaba sola.
    const hoy = serieDeDias(1)[0];
    const fila = filas.find((f) => f.dia === hoy);
    expect(fila).toBeDefined();
    // Tres sesiones y tres eventos de página nuestros, más lo que haya en la base.
    expect(fila!.sesiones).toBeGreaterThanOrEqual(3);
    expect(fila!.paginas).toBeGreaterThanOrEqual(3);
  });

  it("agrupa el tráfico por canal e informa la conversión", async () => {
    const filas = await traficoPorCanal(7);
    const social = filas.find((f) => f.canal === "social");
    expect(social).toBeDefined();
    expect(social!.sesiones).toBeGreaterThanOrEqual(2);
    expect(social!.conversion).toBeCloseTo((social!.pedidos / social!.sesiones) * 100);
    // Los eventos sin canal quedan agrupados, no desaparecen.
    expect(filas.some((f) => f.canal === "sin dato")).toBe(true);
    // Orden por sesiones de mayor a menor.
    const sesiones = filas.map((f) => f.sesiones);
    expect([...sesiones].sort((a, b) => b - a)).toEqual(sesiones);
  });

  it("lista fuentes y campañas, con un máximo de diez filas", async () => {
    const filas = await topFuentes(7);
    expect(filas.length).toBeLessThanOrEqual(10);
    for (const f of filas) expect(f.pedidos).toBeGreaterThanOrEqual(0);
  });

  it("cuenta sesiones por dispositivo", async () => {
    const filas = await dispositivos(7);
    const movil = filas.find((f) => f.dispositivo === "movil");
    expect(movil).toBeDefined();
    expect(movil!.sesiones).toBeGreaterThanOrEqual(1);
    expect(filas.some((f) => f.dispositivo === "sin dato")).toBe(true);
  });

  it("devuelve las páginas más vistas, con un máximo de diez filas", async () => {
    const filas = await paginasMasVistas(7);
    expect(filas.length).toBeLessThanOrEqual(10);
    for (const f of filas) {
      expect(f.vistas).toBeGreaterThanOrEqual(f.sesiones);
      expect(typeof f.path).toBe("string");
    }
  });

  it("cuenta las sesiones únicas del período una sola vez", async () => {
    const totales = await totalesSesiones(7);
    // Tres sesiones nuestras, más lo que haya en la base.
    expect(totales.sesionesUnicas).toBeGreaterThanOrEqual(3);
    expect(totales.paginas).toBeGreaterThanOrEqual(3);
    expect(totales.paginasPorSesion).toBeCloseTo(totales.paginas / totales.sesionesUnicas);

    // El total del período nunca puede pasar la suma de los días: la sesión que
    // vuelve otro día se cuenta en cada día, pero una sola vez en el total.
    const dias = await sesionesPorDia(7);
    expect(totales.sesionesUnicas).toBeLessThanOrEqual(
      dias.reduce((n, d) => n + d.sesiones, 0),
    );
  });

  it("abre el embudo por canal, con cada etapa en sesiones únicas", async () => {
    const filas = await embudoPorCanal(7);
    const social = filas.find((f) => f.canal === "social");
    expect(social).toBeDefined();
    expect(social!.sesiones).toBeGreaterThanOrEqual(2);
    // Una etapa nunca puede tener más sesiones que el total del canal.
    for (const f of filas) {
      expect(f.fichas).toBeLessThanOrEqual(f.sesiones);
      expect(f.carritos).toBeLessThanOrEqual(f.sesiones);
      expect(f.checkouts).toBeLessThanOrEqual(f.sesiones);
      expect(f.pagos).toBeLessThanOrEqual(f.sesiones);
    }
    // Los eventos sin canal quedan agrupados, no desaparecen.
    expect(filas.some((f) => f.canal === "sin dato")).toBe(true);
    const sesiones = filas.map((f) => f.sesiones);
    expect([...sesiones].sort((a, b) => b - a)).toEqual(sesiones);
  });

  it("mide ficha → carrito por producto", async () => {
    // Sin recortar a diez: el producto de prueba tiene una sola visita y nunca
    // entraría al top real.
    const filas = await embudoPorProducto(7, 200);
    const nuestro = filas.find((f) => f.slug === SLUG);
    expect(nuestro).toBeDefined();
    expect(nuestro!.fichas).toBe(1);
    expect(nuestro!.carritos).toBe(1);
    expect(nuestro!.conversion).toBe(100);
    // Un producto que ya no está en el catálogo igual se identifica por su slug.
    expect(nuestro!.nombre).toBe(SLUG);

    for (const f of filas) {
      expect(typeof f.slug).toBe("string");
      expect(f.conversion).toBeGreaterThanOrEqual(0);
    }
    // Ordenado por vistas de ficha, de mayor a menor.
    const fichas = filas.map((f) => f.fichas);
    expect([...fichas].sort((a, b) => b - a)).toEqual(fichas);
  });

  it("respeta el límite del top de productos", async () => {
    expect((await embudoPorProducto(7)).length).toBeLessThanOrEqual(10);
  });
});
