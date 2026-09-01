// tests/queries/dia-santiago.test.ts — el día chileno y la serie de días del rango.
import { describe, it, expect } from "vitest";
import { serieDeDias } from "../../queries/dia-santiago";

describe("serie de días del rango", () => {
  it("devuelve exactamente los días pedidos, terminando hoy", () => {
    // 1-sep-2026 a las 15:07 UTC = 11:07 en Santiago, o sea el mismo día.
    const serie = serieDeDias(7, new Date("2026-09-01T15:07:00Z"));
    expect(serie).toEqual([
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("usa el día de Chile, no el de UTC", () => {
    // 25-ago a las 03:40 UTC es todavía el 24-ago a las 23:40 en Santiago: es
    // exactamente la hora del pedido #1, el caso que motivó el arreglo.
    const serie = serieDeDias(1, new Date("2026-08-25T03:40:53Z"));
    expect(serie).toEqual(["2026-08-24"]);
  });

  it("cruza el cambio de mes sin saltarse días", () => {
    const serie = serieDeDias(3, new Date("2026-09-01T15:00:00Z"));
    expect(serie).toEqual(["2026-08-30", "2026-08-31", "2026-09-01"]);
  });

  it("entrega 30 y 90 días sin repetidos", () => {
    for (const dias of [30, 90]) {
      const serie = serieDeDias(dias, new Date("2026-09-01T15:00:00Z"));
      expect(serie.length).toBe(dias);
      expect(new Set(serie).size).toBe(dias);
      expect(serie[dias - 1]).toBe("2026-09-01");
    }
  });
});
