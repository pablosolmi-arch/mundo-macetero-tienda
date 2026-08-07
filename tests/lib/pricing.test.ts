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

  it("quotes, never charges, for the rest of the Metropolitan Region", () => {
    const envio = calcEnvio({ entrega: "despacho", region: ENVIO.regionRM, comuna: "Maipú" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Se cotiza");
  });

  it("quotes, never charges, for other regions", () => {
    const envio = calcEnvio({ entrega: "despacho", region: "Biobío", comuna: "Concepción" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Se cotiza");
  });

  it("never adds a shipping amount to any order", () => {
    // The shop quotes delivery with an external carrier after the sale, so the
    // storefront must not charge a figure it cannot compute.
    const casos = [
      { entrega: "retiro" as const, region: "", comuna: "" },
      { entrega: "despacho" as const, region: ENVIO.regionRM, comuna: "Las Condes" },
      { entrega: "despacho" as const, region: ENVIO.regionRM, comuna: "Maipú" },
      { entrega: "despacho" as const, region: "Los Lagos", comuna: "Osorno" },
    ];
    for (const caso of casos) expect(calcEnvio(caso).monto).toBe(0);
  });

  it("does not guess before a commune is chosen", () => {
    const envio = calcEnvio({ entrega: "despacho", region: ENVIO.regionRM, comuna: "" });
    expect(envio.monto).toBe(0);
    expect(envio.txt).toBe("Por confirmar");
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
  it("charges the subtotal minus the discount, with no shipping added", () => {
    const t = calcTotales({
      subtotal: 100000,
      codigo: DESCUENTO.codigo,
      entrega: "despacho",
      region: ENVIO.regionRM,
      comuna: "Maipú",
    });
    expect(t.descuento).toBe(10000);
    expect(t.envio.monto).toBe(0);
    expect(t.total).toBe(90000);
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
