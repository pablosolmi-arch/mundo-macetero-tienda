// tests/components/grafico-barras.test.ts — las funciones de los ejes del gráfico.
//
// Solo las funciones puras: el SVG en sí se revisa a ojo en el panel.
import { describe, it, expect } from "vitest";
import { escalaEjeY, etiquetaDia, fechaLarga, montoCorto } from "../../components/admin/GraficoBarras";

describe("eje Y", () => {
  it("elige marcas redondas y un techo por sobre el máximo", () => {
    const marcas = escalaEjeY(261);
    expect(marcas[0]).toBe(0);
    expect(marcas[marcas.length - 1]).toBeGreaterThanOrEqual(261);
    // Todas equidistantes y en valores redondos.
    const paso = marcas[1] - marcas[0];
    expect(paso).toBe(100);
    expect(marcas).toEqual([0, 100, 200, 300]);
  });

  it("funciona con valores chicos", () => {
    expect(escalaEjeY(3)).toEqual([0, 1, 2, 3]);
  });

  it("sin datos deja solo la línea del cero, sin inventar un techo", () => {
    expect(escalaEjeY(0)).toEqual([0]);
  });
});

describe("etiquetas de fecha", () => {
  it("muestra el día de la semana en los rangos cortos", () => {
    expect(etiquetaDia("2026-08-25", true)).toBe("mar 25");
  });

  it("muestra día y mes en los rangos largos", () => {
    expect(etiquetaDia("2026-08-25", false)).toBe("25 ago");
  });

  it("no corre el día por la zona horaria", () => {
    expect(fechaLarga("2026-08-24")).toBe("Lunes, 24 de agosto de 2026");
  });
});

describe("montos abreviados del eje", () => {
  it("abrevia miles y millones", () => {
    expect(montoCorto(0)).toBe("$0");
    expect(montoCorto(50_000)).toBe("$50 mil");
    expect(montoCorto(1_200_000)).toBe("$1,2 M");
  });

  it("deja los montos chicos completos", () => {
    expect(montoCorto(990)).toBe("$990");
  });
});
