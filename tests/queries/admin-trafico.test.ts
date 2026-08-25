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
  paginasMasVistas,
  sesionesPorDia,
  topFuentes,
  traficoPorCanal,
} from "../../queries/admin-trafico";

const PREFIJO = "test-trafico-";
const PATH = "/producto/test-trafico-macetero";

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
        productSlug: "test-trafico-macetero",
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
      // Evento anterior a la atribución: sin canal ni dispositivo.
      { tipo: "visita", path: PATH, sessionId: `${PREFIJO}3` },
    ]);
  });

  afterAll(async () => {
    await db.delete(siteEvents).where(like(siteEvents.sessionId, `${PREFIJO}%`));
  });

  it("cuenta sesiones y páginas vistas por día", async () => {
    const filas = await sesionesPorDia(7);
    const hoy = new Date().toISOString().slice(0, 10);
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
});
