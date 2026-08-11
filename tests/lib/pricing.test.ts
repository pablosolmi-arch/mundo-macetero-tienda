import { describe, it, expect } from "vitest";
import { calcEnvio, calcTotales } from "../../lib/pricing";
import { montoDescuento } from "../../lib/descuento-monto";
import { ENVIO } from "../../content/site";

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

describe("montoDescuento", () => {
  it("takes the percentage off the subtotal", () => {
    expect(montoDescuento(100000, { codigo: "PRIMAVERA10", tipo: "porcentaje", valor: 10 })).toBe(
      10000,
    );
  });

  it("rounds a percentage to whole pesos", () => {
    // 107999 * 10% = 10799.9, and the shop never charges fractions of a peso.
    const monto = montoDescuento(107999, { codigo: "PRIMAVERA10", tipo: "porcentaje", valor: 10 });
    expect(monto).toBe(10800);
    expect(Number.isInteger(monto)).toBe(true);
  });

  it("takes a fixed amount off, but never more than the subtotal", () => {
    expect(montoDescuento(100000, { codigo: "LUCA5", tipo: "monto", valor: 5000 })).toBe(5000);
    expect(montoDescuento(3000, { codigo: "LUCA5", tipo: "monto", valor: 5000 })).toBe(3000);
  });

  it("rounds a fixed amount to whole pesos", () => {
    expect(montoDescuento(100000, { codigo: "LUCA5", tipo: "monto", valor: 4999.6 })).toBe(5000);
  });

  it("is worth nothing without a discount", () => {
    expect(montoDescuento(100000, null)).toBe(0);
  });

  it("is worth nothing on an empty cart", () => {
    expect(montoDescuento(0, { codigo: "PRIMAVERA10", tipo: "porcentaje", valor: 10 })).toBe(0);
    expect(montoDescuento(-500, { codigo: "LUCA5", tipo: "monto", valor: 5000 })).toBe(0);
  });
});

describe("calcTotales", () => {
  it("charges the subtotal minus the discount, with no shipping added", () => {
    const t = calcTotales({
      subtotal: 100000,
      descuento: 10000,
      entrega: "despacho",
      region: ENVIO.regionRM,
      comuna: "Maipú",
    });
    expect(t.descuento).toBe(10000);
    expect(t.envio.monto).toBe(0);
    expect(t.total).toBe(90000);
  });

  it("charges exactly the subtotal for a pickup with no discount", () => {
    const t = calcTotales({
      subtotal: 91158,
      descuento: 0,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.descuento).toBe(0);
    expect(t.total).toBe(91158);
  });

  it("never lets a discount push the total below zero", () => {
    const t = calcTotales({
      subtotal: 1,
      descuento: 10000,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.total).toBeGreaterThanOrEqual(0);
  });

  it("clamps a discount larger than the subtotal down to the subtotal", () => {
    const t = calcTotales({
      subtotal: 24990,
      descuento: 90000,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.descuento).toBe(24990);
    expect(t.total).toBe(0);
  });

  it("ignores a negative discount instead of adding to the total", () => {
    const t = calcTotales({
      subtotal: 24990,
      descuento: -5000,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.descuento).toBe(0);
    expect(t.total).toBe(24990);
  });

  it("keeps the discount in whole pesos", () => {
    const t = calcTotales({
      subtotal: 100000,
      descuento: 10799.9,
      entrega: "retiro",
      region: "",
      comuna: "",
    });
    expect(t.descuento).toBe(10800);
    expect(t.total).toBe(89200);
  });
});
