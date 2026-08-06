import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveProductsWithVariants, getAllCategories } from "../../../queries/catalog";
import { toCard } from "../../../lib/catalog";
import { Catalogo } from "../../../components/catalog/Catalogo";
import { COLECCION_DESC } from "../../../content/site";

export const revalidate = 3600;

// No generateStaticParams on purpose: prerendering every collection at build time
// runs 17 catalog reads in parallel and saturates Supabase's pooler. These render
// on first request instead and are then cached for `revalidate` seconds.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ coleccion: string }>;
}): Promise<Metadata> {
  const { coleccion } = await params;
  const categories = await getAllCategories();
  const cat = categories.find((c) => c.slug === coleccion);
  if (!cat) return { title: "Colección" };
  return {
    title: cat.name,
    description: COLECCION_DESC[cat.slug] ?? `Maceteros de la colección ${cat.name} de Mundo Macetero.`,
  };
}

export default async function ColeccionPage({ params }: { params: Promise<{ coleccion: string }> }) {
  const { coleccion } = await params;
  const [productos, categories] = await Promise.all([
    getActiveProductsWithVariants(),
    getAllCategories(),
  ]);

  const cat = categories.find((c) => c.slug === coleccion);
  if (!cat) notFound();

  const colecciones = [
    ...new Map(
      productos
        .filter((p) => p.colSlug)
        .map((p) => [p.colSlug as string, { slug: p.colSlug as string, nombre: p.colNombre }]),
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <Catalogo
      titulo={cat.name}
      productos={productos.filter((p) => p.colSlug === coleccion).map(toCard)}
      colecciones={colecciones}
      coleccionActual={coleccion}
    />
  );
}
