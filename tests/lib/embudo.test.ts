// tests/lib/embudo.test.ts — la frase de lectura automática del embudo.
import { describe, it, expect } from "vitest";
import { lecturaDelEmbudo, pasosDelEmbudo } from "../../lib/embudo";

describe("lectura del embudo", () => {
  it("nombra el paso con la mayor caída porcentual", () => {
    const pasos = pasosDelEmbudo({
      visitas: 1000,
      fichas: 800,
      carritos: 200,
      checkouts: 36,
      pagos: 30,
    });
    // La peor caída es carrito → checkout (82%), no visitas → ficha (20%) ni la
    // resta más grande en sesiones, que es ficha → carrito (600 sesiones).
    expect(lecturaDelEmbudo(pasos)).toBe(
      "El mayor salto de pérdida está entre Carrito y Checkout: se van 82 de cada 100.",
    );
  });

  it("compara porcentajes, no diferencias absolutas", () => {
    const pasos = pasosDelEmbudo({
      visitas: 1000,
      fichas: 500,
      carritos: 100,
      checkouts: 90,
      pagos: 80,
    });
    expect(lecturaDelEmbudo(pasos)).toContain("entre Ficha y Carrito");
  });

  it("no dice nada cuando no hay visitas", () => {
    expect(
      lecturaDelEmbudo(
        pasosDelEmbudo({ visitas: 0, fichas: 0, carritos: 0, checkouts: 0, pagos: 0 }),
      ),
    ).toBeNull();
  });

  it("no dice nada cuando ningún paso pierde gente", () => {
    const pasos = pasosDelEmbudo({
      visitas: 10,
      fichas: 10,
      carritos: 10,
      checkouts: 10,
      pagos: 10,
    });
    expect(lecturaDelEmbudo(pasos)).toBeNull();
  });

  it("los pasos van en orden y son cinco", () => {
    const pasos = pasosDelEmbudo({
      visitas: 5,
      fichas: 4,
      carritos: 3,
      checkouts: 2,
      pagos: 1,
    });
    expect(pasos.map((p) => p.corto)).toEqual([
      "Visitas",
      "Ficha",
      "Carrito",
      "Checkout",
      "Pago",
    ]);
  });
});
