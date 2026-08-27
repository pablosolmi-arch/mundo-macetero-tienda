import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveProductsWithVariants, getAllCategories } from "../../../../queries/catalog";
import { toCard } from "../../../../lib/catalog";
import { Catalogo } from "../../../../components/catalog/Catalogo";
import { COLECCIONES, COLECCION_GENERICA } from "../../../../content/geo";
import { SITE_URL, WEBSITE_ID, buildBreadcrumbJsonLd, serializeJsonLd } from "../../../../lib/seo";

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
  const copy = COLECCIONES[cat.slug] ?? COLECCION_GENERICA;
  const h1 = copy.h1 ?? cat.name;
  return {
    title: `${h1} de fibrocemento liviano`,
    description: copy.metaDescription,
    alternates: { canonical: `/tienda/${cat.slug}` },
    openGraph: {
      title: `${h1} de fibrocemento liviano | Mundo Macetero`,
      description: copy.metaDescription,
      url: `${SITE_URL}/tienda/${cat.slug}`,
    },
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

  const copy = COLECCIONES[cat.slug] ?? COLECCION_GENERICA;
  const h1 = copy.h1 ?? cat.name;
  const enColeccion = productos.filter((p) => p.colSlug === coleccion);

  const colecciones = [
    ...new Map(
      productos
        .filter((p) => p.colSlug)
        .map((p) => [p.colSlug as string, { slug: p.colSlug as string, nombre: p.colNombre }]),
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const url = `${SITE_URL}/tienda/${cat.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${h1} de fibrocemento liviano`,
        description: copy.metaDescription,
        inLanguage: "es-CL",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: enColeccion.length,
          itemListElement: enColeccion.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${SITE_URL}/producto/${p.slug}`,
          })),
        },
      },
      buildBreadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Tienda", path: "/tienda" },
        { name: h1, path: `/tienda/${cat.slug}` },
      ]),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Catalogo
        titulo={h1}
        intro={copy.intro}
        productos={enColeccion.map(toCard)}
        colecciones={colecciones}
        coleccionActual={coleccion}
      />
    </>
  );
}
