// tests/lib/menu.test.ts
// Contrasta el menú de la tienda (content/menu.ts) con la base de datos real, en
// solo lectura: los grupos son navegación fija y la base cambia por su cuenta, así
// que este test es el que avisa cuando un producto nuevo queda sin clasificar.
import { describe, it, expect } from "vitest";
import { GRUPOS_MENU, GRUPOS_CON_PRODUCTOS, DESTACADO, rutaGrupo } from "../../content/menu";
import { getAllActiveProducts } from "../../queries/catalog";

describe("menú de la tienda", () => {
  it("no repite slugs de grupo", () => {
    const slugs = GRUPOS_MENU.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("no repite un producto en dos grupos", () => {
    const slugs = GRUPOS_CON_PRODUCTOS.flatMap((g) => g.productos);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("da a cada grupo un nombre y una descripción de una línea", () => {
    for (const grupo of GRUPOS_MENU) {
      expect(grupo.nombre.length).toBeGreaterThan(0);
      expect(grupo.descripcion.length).toBeGreaterThan(0);
      expect(grupo.descripcion).not.toContain("\n");
    }
  });

  it("manda 'todos' al catálogo y los demás grupos a /maceteros", () => {
    expect(rutaGrupo("todos")).toBe("/tienda");
    for (const grupo of GRUPOS_CON_PRODUCTOS) {
      expect(rutaGrupo(grupo.slug)).toBe(`/maceteros/${grupo.slug}`);
    }
  });

  it("solo lista productos que existen y están activos", async () => {
    const activos = new Set((await getAllActiveProducts()).map((p) => p.slug));
    const faltantes = GRUPOS_CON_PRODUCTOS.flatMap((g) =>
      g.productos.filter((slug) => !activos.has(slug)).map((slug) => `${g.slug}/${slug}`),
    );
    expect(faltantes).toEqual([]);
  });

  it("no deja ningún producto activo fuera de un grupo", async () => {
    // Los tests de queries insertan productos temporales; se ignoran por prefijo
    // para no volver este test dependiente del orden de ejecución.
    const enGrupos = new Set(GRUPOS_CON_PRODUCTOS.flatMap((g) => g.productos));
    const sinGrupo = (await getAllActiveProducts())
      .map((p) => p.slug)
      .filter((slug) => !slug.startsWith("query-test-") && !slug.startsWith("sitemap-test-"))
      .filter((slug) => !enGrupos.has(slug));
    expect(sinGrupo).toEqual([]);
  });

  it("destaca un producto que está en algún grupo", async () => {
    const enGrupos = GRUPOS_CON_PRODUCTOS.flatMap((g) => g.productos);
    expect(enGrupos).toContain(DESTACADO.slug);

    const activos = new Set((await getAllActiveProducts()).map((p) => p.slug));
    expect(activos.has(DESTACADO.slug)).toBe(true);
    expect(DESTACADO.etiqueta.length).toBeGreaterThan(0);
  });
});
