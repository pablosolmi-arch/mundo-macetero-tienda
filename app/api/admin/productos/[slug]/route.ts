import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../../db/client";
import { products, productVariants } from "../../../../../db/schema";
import { getSessionUser } from "../../../../../lib/admin/auth";
import { obtenerProducto } from "../../../../../queries/admin-productos";
import { avisarIndexNow, rutasDeProducto } from "../../../../../lib/indexnow";

// Guarda la ficha, las variantes y el orden de la galería de un producto. Exige
// sesión del panel.
//
// Las URLs de imágenes NO se aceptan tal cual: el cuerpo solo puede reordenar o
// quitar las que ya están en la base. Si el editor pudiera mandar cualquier URL,
// la tienda terminaría sirviendo imágenes de un dominio ajeno.

export const dynamic = "force-dynamic";

const ESTADOS = ["active", "draft"];

// Los precios de la tienda son pesos enteros; numeric(12,2) guarda el ".00".
function aNumeric(valor: number): string {
  return Math.round(valor).toFixed(2);
}

function esEntradaValida(lista: unknown): lista is string[] {
  return Array.isArray(lista) && lista.every((x) => typeof x === "string");
}

// Cada URL recibida tiene que estar en las actuales y no repetirse: así el
// resultado solo puede ser un subconjunto reordenado de lo que ya había.
function subconjunto(recibidas: string[], actuales: string[]): boolean {
  const disponibles = new Set(actuales);
  const vistas = new Set<string>();
  for (const url of recibidas) {
    if (!disponibles.has(url) || vistas.has(url)) return false;
    vistas.add(url);
  }
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const ficha = (cuerpo.producto ?? {}) as Record<string, unknown>;
  const nombre = typeof ficha.name === "string" ? ficha.name.trim() : "";
  if (!nombre) return NextResponse.json({ message: "El nombre no puede quedar vacío." }, { status: 400 });

  const descripcion = typeof ficha.description === "string" ? ficha.description : "";

  const precioBase = Number(ficha.basePrice);
  if (!Number.isFinite(precioBase) || precioBase <= 0) {
    return NextResponse.json({ message: "El precio base debe ser un número mayor que 0." }, { status: 400 });
  }

  const estado = typeof ficha.status === "string" ? ficha.status : "";
  if (!ESTADOS.includes(estado)) {
    return NextResponse.json({ message: "Estado inválido." }, { status: 400 });
  }

  const trackStock = ficha.trackStock === true;

  // --- Variantes ---
  const recibidas = Array.isArray(cuerpo.variantes) ? cuerpo.variantes : [];
  const idsDelProducto = new Set(producto.variantes.map((v) => v.id));
  const cambios: { id: number; priceOverride: string | null; stock: number; available: boolean }[] = [];

  for (const item of recibidas) {
    const v = (item ?? {}) as Record<string, unknown>;
    const id = Number(v.id);
    if (!Number.isInteger(id) || !idsDelProducto.has(id)) {
      return NextResponse.json({ message: "Hay una variante que no pertenece a este producto." }, { status: 400 });
    }

    const stock = Number(v.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { message: "El stock de cada variante debe ser un número entero de 0 o más." },
        { status: 400 },
      );
    }

    let priceOverride: string | null = null;
    if (v.priceOverride !== null && v.priceOverride !== undefined && v.priceOverride !== "") {
      const precio = Number(v.priceOverride);
      if (!Number.isFinite(precio) || precio <= 0) {
        return NextResponse.json(
          { message: "El precio de una variante debe quedar vacío o ser mayor que 0." },
          { status: 400 },
        );
      }
      priceOverride = aNumeric(precio);
    }

    cambios.push({ id, priceOverride, stock, available: v.available === true });
  }

  // --- Galería ---
  const imagenes = (cuerpo.imagenes ?? {}) as Record<string, unknown>;
  const nuevasImages = imagenes.images ?? producto.images;
  const nuevosThumbs = imagenes.thumbs ?? producto.thumbs;
  if (!esEntradaValida(nuevasImages) || !esEntradaValida(nuevosThumbs)) {
    return NextResponse.json({ message: "Las imágenes deben venir como listas de URLs." }, { status: 400 });
  }
  if (!subconjunto(nuevasImages, producto.images) || !subconjunto(nuevosThumbs, producto.thumbs)) {
    return NextResponse.json(
      { message: "Solo se puede reordenar o quitar imágenes que ya están en el producto." },
      { status: 400 },
    );
  }

  await db
    .update(products)
    .set({
      name: nombre.slice(0, 300),
      description: descripcion.slice(0, 20000),
      basePrice: aNumeric(precioBase),
      status: estado,
      trackStock,
      images: nuevasImages,
      thumbs: nuevosThumbs,
    })
    .where(eq(products.id, producto.id));

  // Una sentencia por variante, siempre con el productId en el where: si llegara
  // un id de otro producto, la condición no calza y no se escribe nada.
  for (const c of cambios) {
    await db
      .update(productVariants)
      .set({ priceOverride: c.priceOverride, stock: c.stock, available: c.available })
      .where(and(eq(productVariants.id, c.id), eq(productVariants.productId, producto.id)));
  }

  // Aviso a Bing de que la ficha cambió. Va sin await deliberadamente: el panel
  // no debe esperar a un servicio externo para confirmar el guardado.
  void avisarIndexNow(rutasDeProducto(producto.slug));

  return NextResponse.json({ ok: true });
}
