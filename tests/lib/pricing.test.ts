import { describe, it, expect } from "vitest";
import { calcEnvio, calcDescuento, calcTotales, esCodigoValido } from "../../lib/pricing";
import { DESCUENTO, ENVIO } from "../../content/site";

// These rules decide what the customer is actually charged, and the same functions
// run in the browser and inside /api/checkout. A drift here is a money bug.

describe("calcEnvio", () => {
  it("charges nothing for store pickup, whatever the address says", () => {
    const envio = calcEnvio({ entrega: "retiro", region: "Los Lagos", comuna: "Puerto Varas" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Gratis");
  });

  it("is free in the eastern communes of Santiago", () => {
    for (const comuna of ENVIO.comunasOriente) {
      const envio = calcEnvio({ entrega: "despacho", region: ENVIO.regionRM, comuna });
      expect(envio.monto).toBe(0);
      expect(envio.txt).toBe("Gratis");
    }
  });

  it("applies the flat rate elsewhere in the Metropolitan Region", () => {
    const envio = calcEnvio({ entrega: "despacho", region: ENVIO.regionRM, comuna: "Maipú" });
    expect(envio.monto).toBe(ENVIO.tarifaRM);
  });

  it("charges nothing for other regions: the carrier is paid on delivery", () => {
    const envio = calcEnvio({ entrega: "despacho", region: "Biobío", comuna: "Concepción" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Por pagar");
  });

  it("does not guess a price before a commune is chosen", () => {
    const envio = calcEnvio({ entrega: "despacho", region: ENVIO.regionRM, comuna: "" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Por calcular");
  });
});

describe("calcDescuento", () => {
  it("applies the published percentage to the valid code", () => {
    expect(calcDescuento(100000, DESCUENTO.codigo)).toBe(10000);
  });

  it("accepts the code in any casing or with stray spaces", () => {
    expect(calcDescuento(100000, ` ${DESCUENTO.codigo.toLowerCase()} `)).toBe(10000);
    expect(esCodigoValido(DESCUENTO.codigo.toLowerCase())).toBe(true);
  });

  it("is worth nothing for an unknown or absent code", () => {
    expect(calcDescuento(100000, "REGALAME10")).toBe(0);
    expect(calcDescuento(100000, "")).toBe(0);
    expect(calcDescuento(100000, null)).toBe(0);
  });

  it("rounds to whole pesos", () => {
    expect(Number.isInteger(calcDescuento(107999, DESCUENTO.codigo))).toBe(true);
  });
});

describe("calcTotales", () => {
  it("subtracts the discount before adding shipping", () => {
    const t = calcTotales({
      subtotal: 100000,
      codigo: DESCUENTO.codigo,
      entrega: "despacho",
      region: ENVIO.regionRM,
      comuna: "Maipú",
    });
    expect(t.descuento).toBe(10000);
    expect(t.envio.monto).toBe(ENVIO.tarifaRM);
    expect(t.total).toBe(100000 - 10000 + ENVIO.tarifaRM);
  });

  it("charges exactly the subtotal for a pickup with no code", () => {
    const t = calcTotales({
      subtotal: 91158,
      codigo: null,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.total).toBe(91158);
  });

  it("never lets a discount push the total below zero", () => {
    const t = calcTotales({
      subtotal: 1,
      codigo: DESCUENTO.codigo,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.total).toBeGreaterThanOrEqual(0);
  });
});
