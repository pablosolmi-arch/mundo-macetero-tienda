// Evaluación de las "intent collections" (content/intenciones.ts) contra el
// catálogo. Cada colección es un conjunto de reglas que se aplican a los
// productos y sus variantes en tiempo de request: nada de esto toca la base de
// datos ni depende de columnas nuevas.
//
// Las medidas viven en texto libre dentro de las opciones de variante, escritas
// a mano a lo largo de los años y sin un formato único: "Alto: 60 cm /
// Diametro: 50 cm / Base 32 cm", "S: Alto 55cm - Diámetro 35cm - Cadera 45cm",
// "70(h)x70cm + 50(h)x60cm", "Mediana - 50 cm diámetro y 34 cm altura".
// parseDimensionesCm es el único lugar del código que entiende ese formato.

import { ACCESORIOS, GRUPOS, INTENCIONES, type Intencion, type Regla } from "../content/intenciones";

// Forma mínima que necesita la evaluación, satisfecha por lo que devuelve
// getActiveProductsWithVariants(). Se declara estructural (y no importando el
// tipo de la query) para poder probar las reglas sin base de datos.
export interface VarianteIntencion {
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
}

export interface ProductoIntencion {
  slug: string;
  optionNames: string[];
  variants: VarianteIntencion[];
}

export interface DimensionesCm {
  /** La mayor medida en cm que declara el texto, o null si no declara ninguna. */
  max: number | null;
  /** La altura en cm, o null si el texto no la nombra. */
  alto: number | null;
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

// Solo cuentan los números pegados a "cm". Así la talla "S", el "Base: 60" sin
// unidad o el "3" de "3 cuotas" nunca se confunden con una medida.
const CM = new RegExp(`${NUM}\\s*cm`, "gi");

// "Alto: 50 cm", "Alto 55cm", "Altura: 34 cm": la palabra va antes del número.
const ALTO_ANTES = new RegExp(`\\b(?:alto|alta|altura)\\s*:?\\s*${NUM}\\s*cm`, "gi");

// "34 cm altura", "40 cm de alto": la palabra va después del número.
const ALTO_DESPUES = new RegExp(`${NUM}\\s*cm\\s+(?:de\\s+)?(?:alto|alta|altura)\\b`, "gi");

// "70(h)x70cm": el sufijo (h) es la forma abreviada de anotar la altura.
const ALTO_H = new RegExp(`${NUM}\\s*\\(\\s*h\\s*\\)`, "gi");

// matchAll clona la expresión antes de recorrerla, así que estas constantes
// globales se pueden reutilizar sin arrastrar lastIndex entre llamadas.
function numeros(text: string, re: RegExp): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(re)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function parseDimensionesCm(text: string): DimensionesCm {
  const cms = numeros(text, CM);
  // Una misma variante puede describir varias piezas ("70(h)x70cm + 50(h)x60cm"),
  // y la que manda para "¿es alto?" es la mayor.
  const altos = [
    ...numeros(text, ALTO_ANTES),
    ...numeros(text, ALTO_DESPUES),
    ...numeros(text, ALTO_H),
  ];

  return {
    max: cms.length > 0 ? Math.max(...cms) : null,
    alto: altos.length > 0 ? Math.max(...altos) : null,
  };
}

// Los textos se comparan sin tildes y en minúsculas: la base mezcla "Oxido de
// Cobre" con "Óxido", y "Rústico Blanco" con "Rustico".
function normalizar(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function textoVariante(v: VarianteIntencion): string {
  return [v.option1, v.option2, v.option3].filter(Boolean).join(" / ");
}

function algunaVarianteVendible(
  producto: ProductoIntencion,
  test: (dim: DimensionesCm) => boolean,
): boolean {
  return producto.variants.some(
    (v) => v.available && test(parseDimensionesCm(textoVariante(v))),
  );
}

export function cumpleRegla(producto: ProductoIntencion, regla: Regla): boolean {
  switch (regla.kind) {
    case "todos":
      return !ACCESORIOS.includes(producto.slug);

    case "slugs":
      return regla.slugs.includes(producto.slug);

    case "dimMin":
      return algunaVarianteVendible(producto, (d) => d.max != null && d.max >= regla.cm);

    case "dimMax":
      return algunaVarianteVendible(producto, (d) => d.max != null && d.max <= regla.cm);

    case "altoMin":
      return algunaVarianteVendible(producto, (d) => d.alto != null && d.alto >= regla.cm);

    case "color": {
      // El color no se filtra por disponibilidad: una terminación agotada en una
      // talla sigue siendo una terminación que el producto ofrece.
      const terminos = regla.match.map(normalizar);
      return producto.variants.some((v) =>
        [v.option1, v.option2, v.option3].some((o) => {
          if (!o) return false;
          const texto = normalizar(o);
          return terminos.some((t) => texto.includes(t));
        }),
      );
    }

    case "opcion": {
      // Sin variantes no hay nada que comprobar: el nombre de la opción por sí
      // solo no prueba que el producto llegue a ofrecerla.
      if (producto.variants.length === 0) return false;
      const terminos = regla.match.map(normalizar);
      const texto = normalizar(
        [...producto.optionNames, ...producto.variants.map(textoVariante)].join(" / "),
      );
      return terminos.some((t) => texto.includes(t));
    }
  }
}

/** Todas las reglas deben cumplirse (AND); conserva el orden de entrada. */
export function productosDeIntencion<T extends ProductoIntencion>(
  todos: T[],
  intencion: Intencion,
): T[] {
  return todos.filter((p) => intencion.reglas.every((r) => cumpleRegla(p, r)));
}

export interface GrupoIntenciones {
  grupo: Intencion["grupo"];
  items: { slug: string; h1: string }[];
}

// Estructura mínima para el menú y el pie: solo slug y título. Se arma en el
// servidor y viaja como prop para que los párrafos de copy de INTENCIONES no
// terminen en el bundle del cliente.
export function navIntenciones(): GrupoIntenciones[] {
  return GRUPOS.map((grupo) => ({
    grupo,
    items: INTENCIONES.filter((i) => i.grupo === grupo).map((i) => ({ slug: i.slug, h1: i.h1 })),
  }));
}

/** Primera frase del intro, para las tarjetas del hub. */
export function resumenIntencion(intencion: Intencion): string {
  const [primero = ""] = intencion.intro;
  const corte = primero.indexOf(". ");
  return corte === -1 ? primero : primero.slice(0, corte + 1);
}
