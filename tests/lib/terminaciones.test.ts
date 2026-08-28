import { describe, expect, it } from "vitest";
import {
  TERMINACIONES,
  TERMINACION_PENDIENTE,
  esEjeDeColor,
  esPendiente,
  esTerminacionValida,
  nombreVarianteConTerminacion,
  normalizarTerminacion,
  varianteSinTerminacion,
} from "../../content/terminaciones";

describe("esTerminacionValida", () => {
  it("acepta los cuatro acabados y el pendiente", () => {
    for (const t of [...TERMINACIONES, TERMINACION_PENDIENTE]) {
      expect(esTerminacionValida(t)).toBe(true);
    }
  });
  it("ignora espacios alrededor", () => {
    expect(esTerminacionValida("  Negro  ")).toBe(true);
  });
  it("rechaza un valor inventado, vacío o de otro tipo", () => {
    expect(esTerminacionValida("Dorado")).toBe(false);
    expect(esTerminacionValida("")).toBe(false);
    expect(esTerminacionValida(null)).toBe(false);
    expect(esTerminacionValida(7)).toBe(false);
  });
  it("distingue mayúsculas: el valor guardado tiene que ser el de la lista", () => {
    expect(esTerminacionValida("negro")).toBe(false);
  });
});

describe("normalizarTerminacion", () => {
  it("deja pasar un acabado válido, ya recortado", () => {
    expect(normalizarTerminacion(" Cemento Blanco ")).toBe("Cemento Blanco");
  });
  it("cae en el pendiente cuando la línea no trae nada", () => {
    // Es el caso del carrito guardado antes de que existiera la pregunta.
    expect(normalizarTerminacion(undefined)).toBe(TERMINACION_PENDIENTE);
    expect(normalizarTerminacion(null)).toBe(TERMINACION_PENDIENTE);
  });
  it("cae en el pendiente en vez de guardar un valor manipulado", () => {
    expect(normalizarTerminacion("Oro 24k")).toBe(TERMINACION_PENDIENTE);
  });
});

describe("nombreVarianteConTerminacion", () => {
  it("concatena con separador cuando hay variante", () => {
    expect(nombreVarianteConTerminacion("Diámetro 50cm x Alto 40cm", "Negro")).toBe(
      "Diámetro 50cm x Alto 40cm · Terminación: Negro",
    );
  });
  it("deja solo la terminación cuando el producto no tiene variante", () => {
    expect(nombreVarianteConTerminacion(null, "Beige")).toBe("Terminación: Beige");
  });
  it("no arrastra el Default Title del catálogo", () => {
    expect(nombreVarianteConTerminacion("Default Title", "Cemento Natural")).toBe(
      "Terminación: Cemento Natural",
    );
  });
  it("guarda también el pendiente, que es lo que gatilla el aviso del panel", () => {
    expect(nombreVarianteConTerminacion("Grande", TERMINACION_PENDIENTE)).toBe(
      `Grande · Terminación: ${TERMINACION_PENDIENTE}`,
    );
  });
});

describe("varianteSinTerminacion", () => {
  it("devuelve el nombre de la variante tal como se eligió en la ficha", () => {
    const guardado = nombreVarianteConTerminacion("Diámetro 50cm x Alto 40cm", "Negro");
    expect(varianteSinTerminacion(guardado, "Negro")).toBe("Diámetro 50cm x Alto 40cm");
  });
  it("queda en null cuando la línea era solo la terminación", () => {
    expect(varianteSinTerminacion("Terminación: Beige", "Beige")).toBeNull();
  });
  it("no toca las líneas de pedidos anteriores, que no traen terminación", () => {
    expect(varianteSinTerminacion("Negro", null)).toBe("Negro");
    expect(varianteSinTerminacion(null, null)).toBeNull();
  });
});

describe("esEjeDeColor", () => {
  it("reconoce los ejes que el catálogo usa para el color", () => {
    expect(esEjeDeColor("Color")).toBe(true);
    expect(esEjeDeColor("Terminación")).toBe(true);
    expect(esEjeDeColor(" color ")).toBe(true);
  });
  it("no esconde un eje que además carga la medida", () => {
    // macetero-ri vende "S - Diámetro 65cm Alto 50cm - Cemento Natural" en un solo
    // eje: ocultarlo dejaría al cliente sin poder elegir el tamaño.
    expect(esEjeDeColor("Tamaño y Color")).toBe(false);
    expect(esEjeDeColor("Tamaño")).toBe(false);
    expect(esEjeDeColor("Drenaje de agua")).toBe(false);
  });
});

describe("esPendiente", () => {
  it("es cierto solo para el 'Decidir más tarde'", () => {
    expect(esPendiente(TERMINACION_PENDIENTE)).toBe(true);
    expect(esPendiente("Negro")).toBe(false);
    expect(esPendiente(null)).toBe(false);
    expect(esPendiente(undefined)).toBe(false);
  });
});
