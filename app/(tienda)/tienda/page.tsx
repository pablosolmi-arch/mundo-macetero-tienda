import type { Metadata } from "next";
import { getActiveProductsWithVariants } from "../../../queries/catalog";
import { toCard } from "../../../lib/catalog";
import { Catalogo } from "../../../components/catalog/Catalogo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tienda · Maceteros EIFS livianos",
  description:
    "Todos los maceteros, jardineras y accesorios de Mundo Macetero: tecnología EIFS, 90% más livianos que el cemento, resistentes al exterior y fabricados a pedido en Chile.",
  alternates: { canonical: "/tienda" },
};

export default async function TiendaPage() {
  const productos = await getActiveProductsWithVariants();

  const colecciones = [
    ...new Map(
      productos
        .filter((p) => p.colSlug)
        .map((p) => [p.colSlug as string, { slug: p.colSlug as string, nombre: p.colNombre }]),
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <Catalogo
      titulo="Todos los productos"
      productos={productos.map(toCard)}
      colecciones={colecciones}
      coleccionActual={null}
    />
  );
}
