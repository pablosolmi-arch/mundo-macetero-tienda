import { describe, expect, it } from "vitest";
import {
  etiquetaPago,
  etiquetaPreparacion,
  lineaArticulo,
  nombreCanal,
  nombreEvento,
  resumenArticulos,
  textoOrigen,
} from "../../lib/pedido-vista";

describe("lineaArticulo", () => {
  it("omite la variante cuando es Default Title", () => {
    expect(
      lineaArticulo({ productName: "Macetero Bowl", variantName: "Default Title", qty: 1 }),
    ).toBe("Macetero Bowl × 1");
  });
  it("muestra la variante entre paréntesis", () => {
    expect(lineaArticulo({ productName: "Macetero Bowl", variantName: "Negro", qty: 2 })).toBe(
      "Macetero Bowl (Negro) × 2",
    );
  });
  it("recorta una variante larga", () => {
    const linea = lineaArticulo({
      productName: "Macetero",
      variantName: "Diámetro 50cm x Alto 40cm / Negro / Con doble fondo",
      qty: 1,
    });
    expect(linea).toBe("Macetero (Diámetro 50cm x Alto 40cm…) × 1");
  });
  it("trata una variante vacía como sin variante", () => {
    expect(lineaArticulo({ productName: "Base", variantName: "  ", qty: 3 })).toBe("Base × 3");
    expect(lineaArticulo({ productName: "Base", variantName: null, qty: 3 })).toBe("Base × 3");
  });
});

describe("resumenArticulos", () => {
  const items = [
    { productName: "Macetero Bowl", variantName: null, qty: 1 },
    { productName: "Base Metálica", variantName: null, qty: 2 },
    { productName: "Platillo", variantName: null, qty: 4 },
  ];

  it("muestra las dos primeras líneas y cuenta el resto", () => {
    const r = resumenArticulos(items);
    expect(r.visibles).toEqual(["Macetero Bowl × 1", "Base Metálica × 2"]);
    expect(r.extra).toBe(1);
  });
  it("deja el detalle completo en una línea por artículo", () => {
    expect(resumenArticulos(items).completo).toBe(
      "Macetero Bowl × 1\nBase Metálica × 2\nPlatillo × 4",
    );
  });
  it("sin artículos no hay líneas ni sobrantes", () => {
    const r = resumenArticulos([]);
    expect(r.visibles).toEqual([]);
    expect(r.extra).toBe(0);
    expect(r.completo).toBe("");
  });
});

describe("nombreCanal", () => {
  it("traduce los canales conocidos", () => {
    expect(nombreCanal("busqueda")).toBe("Búsqueda (Google)");
    expect(nombreCanal("pagado")).toBe("Publicidad pagada");
  });
  it("devuelve el valor crudo si es un canal nuevo", () => {
    expect(nombreCanal("whatsapp")).toBe("whatsapp");
  });
  it("devuelve vacío sin canal", () => {
    expect(nombreCanal(null)).toBe("");
    expect(nombreCanal("  ")).toBe("");
  });
});

describe("textoOrigen", () => {
  it("junta canal, fuente y campaña", () => {
    expect(
      textoOrigen({ origenCanal: "pagado", origenFuente: "instagram", origenCampana: "verano" }),
    ).toBe("Publicidad pagada · instagram · verano");
  });
  it("omite las partes que faltan", () => {
    expect(textoOrigen({ origenCanal: "directo", origenFuente: "", origenCampana: null })).toBe(
      "Visita directa",
    );
  });
  it("avisa cuando no hay nada", () => {
    expect(textoOrigen({ origenCanal: null, origenFuente: null, origenCampana: null })).toBe(
      "Sin datos de origen",
    );
  });
});

describe("etiquetas de estado", () => {
  it("nombra los estados de preparación", () => {
    expect(etiquetaPreparacion("pendiente").texto).toBe("Por preparar");
    expect(etiquetaPreparacion("preparado").texto).toBe("Preparado");
    expect(etiquetaPreparacion("entregado").texto).toBe("Entregado");
    expect(etiquetaPreparacion("cancelado").texto).toBe("Cancelado");
  });
  it("un estado desconocido cae en por preparar", () => {
    expect(etiquetaPreparacion("inventado").texto).toBe("Por preparar");
  });
  it("nombra los estados de pago y deja pasar uno nuevo", () => {
    expect(etiquetaPago("paid").texto).toBe("Pagado");
    expect(etiquetaPago("chargeback").texto).toBe("chargeback");
  });
  it("nombra los tipos de la bitácora", () => {
    expect(nombreEvento("reembolso_fallido")).toBe("Reembolso fallido");
    expect(nombreEvento("otro")).toBe("otro");
  });
});
