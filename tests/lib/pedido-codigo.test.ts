import { describe, expect, it } from "vitest";
import { codigoPedido, parseCodigoPedido } from "../../lib/pedido-codigo";

describe("codigoPedido", () => {
  it("arma correlativo + día/mes en hora de Chile", () => {
    // 25-ago 03:30 UTC = 24-ago 23:30 en Santiago (UTC-4).
    expect(codigoPedido(7, new Date("2026-08-25T03:30:00Z"))).toBe("#7-24/08");
    expect(codigoPedido(1, new Date("2026-08-25T12:00:00Z"))).toBe("#1-25/08");
  });
  it("sin correlativo muestra solo la fecha", () => {
    expect(codigoPedido(null, new Date("2026-01-05T12:00:00Z"))).toBe("#—-05/01");
  });
});

describe("parseCodigoPedido", () => {
  it("acepta #7, 7 y #7-25/08", () => {
    expect(parseCodigoPedido("#7")).toBe(7);
    expect(parseCodigoPedido(" 7 ")).toBe(7);
    expect(parseCodigoPedido("#7-25/08")).toBe(7);
  });
  it("rechaza correos y textos", () => {
    expect(parseCodigoPedido("ana@correo.cl")).toBeNull();
    expect(parseCodigoPedido("MM-123-abc")).toBeNull();
  });
});
