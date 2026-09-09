// tests/content/valor.test.ts
//
// La propuesta de valor no puede exagerar. Las dos cifras que se publican son
// "hasta 90% más liviano" y "hasta 40% menos agua": si alguien las sube o les
// quita el "hasta", este test lo avisa antes de que salga a producción.
import { describe, it, expect } from "vitest";
import {
  COMPARACION,
  COMPARACION_COLUMNAS,
  VALOR_UNA_LINEA,
  VENTAJAS_CLAVE,
} from "../../content/valor";
import { MATERIAL_PARRAFO, MATERIAL_PUNTOS } from "../../content/material";

// La cifra grande de cada ventaja se lee como titular, igual que en el hero de la
// portada, así que no se junta con el texto: lo que se revisa acá es la PROSA,
// donde el "hasta" tiene que estar. Que cada titular tenga su frase acotada se
// revisa en su propio test, más abajo.
const TODO_EL_TEXTO = [
  ...VENTAJAS_CLAVE.map((v) => `${v.titulo}. ${v.detalle}`),
  ...COMPARACION.map((f) => `${f.aspecto} ${f.nuestro} ${f.tradicional}`),
  VALOR_UNA_LINEA,
  MATERIAL_PARRAFO,
  ...MATERIAL_PUNTOS,
].join(" ");

describe("propuesta de valor", () => {
  it("no publica un porcentaje distinto de 90% y 40%", () => {
    const porcentajes = [...TODO_EL_TEXTO.matchAll(/(\d+)\s*%/g)].map((m) => m[1]);
    expect(porcentajes.length).toBeGreaterThan(0);
    for (const p of porcentajes) expect(["90", "40"]).toContain(p);
  });

  it("cada cifra en prosa va acompañada de 'hasta': son máximos, no promedios", () => {
    for (const frase of TODO_EL_TEXTO.split(/(?<=\.)\s+/)) {
      if (/\d+\s*%/.test(frase)) expect(frase.toLowerCase()).toContain("hasta");
    }
  });

  it("la ventaja que muestra un porcentaje lo acota en su propio detalle", () => {
    for (const v of VENTAJAS_CLAVE) {
      if (/\d+\s*%/.test(v.destacado)) expect(v.detalle.toLowerCase()).toContain("hasta");
    }
  });

  it("no afirma ser el único fabricante de Chile: ese claim no está respaldado", () => {
    expect(TODO_EL_TEXTO.toLowerCase()).not.toContain("únicos en chile");
    expect(TODO_EL_TEXTO.toLowerCase()).not.toContain("los únicos que");
  });

  it("no dice 'fibrocemento': el material es tecnología EIFS", () => {
    expect(TODO_EL_TEXTO.toLowerCase()).not.toContain("fibrocemento");
    expect(TODO_EL_TEXTO).toContain("EIFS");
  });

  it("la comparación tiene las dos columnas llenas en cada fila", () => {
    expect(COMPARACION.length).toBeGreaterThanOrEqual(5);
    for (const fila of COMPARACION) {
      expect(fila.aspecto.length).toBeGreaterThan(2);
      expect(fila.nuestro.length).toBeGreaterThan(5);
      expect(fila.tradicional.length).toBeGreaterThan(5);
    }
    expect(COMPARACION_COLUMNAS.nuestro).toContain("EIFS");
  });

  it("la columna de la alternativa no habla de precio ni de otras marcas", () => {
    const derecha = COMPARACION.map((f) => f.tradicional.toLowerCase()).join(" ");
    for (const prohibido of ["precio", "barato", "caro", "$", "importado", "marca"]) {
      expect(derecha).not.toContain(prohibido);
    }
  });
});
