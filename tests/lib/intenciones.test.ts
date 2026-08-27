import { describe, it, expect } from "vitest";
import {
  cumpleRegla,
  parseDimensionesCm,
  productosDeIntencion,
  type ProductoIntencion,
} from "../../lib/intenciones";
import type { Intencion } from "../../content/intenciones";

// Las cadenas de este bloque son las que están hoy en la base, copiadas tal
// cual (tildes inconsistentes, dobles espacios y todo): son el contrato real
// que el parser tiene que aguantar.
describe("parseDimensionesCm", () => {
  const casos: [string, number | null, number | null][] = [
    ["Diámetro 50cm x Alto 40cm", 50, 40],
    ["Alto: 60 cm / Diametro: 50 cm / Base 32 cm", 60, 60],
    ["S: Alto 55cm - Diámetro 35cm - Cadera 45cm - Base 23cm", 55, 55],
    ["100 cm", 100, null],
    ["70(h)x70cm + 50(h)x60cm + 40(h)x50cm", 70, 70],
    ["Grande", null, null],
    ["L - Boca 60cm Cadera 85cm y Alto 60cm - Cemento Liso", 85, 60],
    ["Alto: 75cm / Diámetro m: 90 cm", 90, 75],
  ];

  for (const [texto, max, alto] of casos) {
    it(`lee "${texto}" como max ${max} y alto ${alto}`, () => {
      expect(parseDimensionesCm(texto)).toEqual({ max, alto });
    });
  }

  it("ignora los números que no llevan cm, como la talla o la base sin unidad", () => {
    // "Base: 60" no lleva unidad: contarlo convertiría un cónico de 110 cm en
    // uno de 60 y lo sacaría de "maceteros altos".
    expect(parseDimensionesCm("Alto: 110 cm / Diametro 100cm / Base: 60")).toEqual({
      max: 110,
      alto: 110,
    });
  });

  it("cuenta 'altura' después del número, como en las bases metálicas", () => {
    expect(parseDimensionesCm("Mediana - 50 cm diámetro y 34 cm altura")).toEqual({
      max: 50,
      alto: 34,
    });
  });
});

function producto(over: Partial<ProductoIntencion> = {}): ProductoIntencion {
  return {
    slug: "macetero-x",
    optionNames: [],
    variants: [],
    ...over,
  };
}

function variante(over: Partial<ProductoIntencion["variants"][number]> = {}) {
  return { option1: null, option2: null, option3: null, available: true, ...over };
}

describe("cumpleRegla", () => {
  it("empareja un color con tilde contra un término sin tilde", () => {
    const marroc = producto({
      slug: "macetero-marroc-cantera-oxido-de-cobre",
      optionNames: ["Color", "Tamaño"],
      variants: [variante({ option1: "Óxido de Cobre", option2: "Grande" })],
    });
    expect(cumpleRegla(marroc, { kind: "color", match: ["oxido"] })).toBe(true);
    expect(cumpleRegla(marroc, { kind: "color", match: ["blanco"] })).toBe(false);
  });

  it("deja fuera los accesorios de la regla 'todos'", () => {
    expect(cumpleRegla(producto({ slug: "piedras-decorativas-xl" }), { kind: "todos" })).toBe(false);
    expect(cumpleRegla(producto({ slug: "macetero-cubo-cu40" }), { kind: "todos" })).toBe(true);
  });

  it("solo mira variantes disponibles para las reglas de medida", () => {
    const p = producto({
      variants: [variante({ option1: "Diámetro 100cm x Alto 100cm", available: false })],
    });
    expect(cumpleRegla(p, { kind: "dimMin", cm: 70 })).toBe(false);
  });

  it("no cuenta el nombre de la opción si el producto no tiene variantes", () => {
    const p = producto({ optionNames: ["Opción de Doble fondo"] });
    expect(cumpleRegla(p, { kind: "opcion", match: ["doble fondo"] })).toBe(false);
  });
});

describe("productosDeIntencion", () => {
  it("exige que se cumplan todas las reglas y conserva el orden de entrada", () => {
    const intencion = {
      reglas: [{ kind: "todos" }, { kind: "dimMin", cm: 70 }],
    } as Intencion;

    const grande = producto({
      slug: "macetero-cubo-cu40",
      variants: [variante({ option1: "Cemento Natural", option2: "80 cm" })],
    });
    const chico = producto({
      slug: "macetero-redondo",
      variants: [variante({ option1: "Alto: 40 cm / Diametro: 40 cm" })],
    });
    const accesorioGrande = producto({
      slug: "piedras-decorativas-xl",
      variants: [variante({ option1: "XL: Alto 60cm - Largo 100cm - Ancho 70cm" })],
    });

    expect(productosDeIntencion([accesorioGrande, grande, chico], intencion)).toEqual([grande]);
  });
});
