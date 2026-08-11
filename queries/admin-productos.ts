// queries/admin-productos.ts — lecturas del catálogo para el panel.
//
// A diferencia de queries/catalog.ts, acá se traen TODOS los productos (también
// los borradores): el panel es justamente donde se revisa y publica lo que la
// tienda todavía no muestra.
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { products, productVariants } from "../db/schema";

export interface ProductoListado {
  id: number;
  slug: string;
  name: string;
  status: string;
  trackStock: boolean;
  miniatura: string | null;
  precioDesde: number;
  variantes: number;
}

export async function listarProductos(): Promise<ProductoListado[]> {
  const [filas, variantes] = await Promise.all([
    db.query.products.findMany(),
    db.query.productVariants.findMany(),
  ]);

  // Precio mínimo y cantidad de variantes en una pasada, para no hacer una
  // consulta por producto.
  const resumen = new Map<number, { minimo: number | null; n: number }>();
  for (const v of variantes) {
    const actual = resumen.get(v.productId) ?? { minimo: null, n: 0 };
    actual.n += 1;
    if (v.priceOverride != null) {
      const precio = Number(v.priceOverride);
      if (Number.isFinite(precio) && (actual.minimo === null || precio < actual.minimo)) {
        actual.minimo = precio;
      }
    }
    resumen.set(v.productId, actual);
  }

  return filas
    .map((p) => {
      const r = resumen.get(p.id) ?? { minimo: null, n: 0 };
      const base = Number(p.basePrice);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        status: p.status,
        trackStock: p.trackStock,
        miniatura: p.thumbs[0] ?? p.images[0] ?? null,
        precioDesde: r.minimo !== null ? Math.min(r.minimo, base) : base,
        variantes: r.n,
      };
    })
    // localeCompare con "es" y no ORDER BY: la collation de la base deja los
    // acentos en otro lugar que el resto del sitio, que ordena así.
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function obtenerProducto(slug: string) {
  const producto = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!producto) return null;

  const variantes = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, producto.id),
    orderBy: [asc(productVariants.id)],
  });

  return { ...producto, variantes };
}
