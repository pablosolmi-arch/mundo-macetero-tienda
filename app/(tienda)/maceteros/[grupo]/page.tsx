import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveProductsWithVariants } from "../../../../queries/catalog";
import { toCard } from "../../../../lib/catalog";
import { ProductCard } from "../../../../components/ProductCard";
import { GRUPOS_MENU, grupoPorSlug, rutaGrupo } from "../../../../content/menu";

// Página de un grupo del menú (bowls, altos, redondos, jardineras, complementos).
// Es la vista que ve quien no conoce los nombres de modelo: una grilla con las
// mismas tarjetas del catálogo, sin filtros, y chips para saltar a otro grupo.
//
// force-dynamic a propósito: los grupos son listas cortas y fijas, y así el precio
// y la disponibilidad que muestra la tarjeta salen siempre de la base al momento.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grupo: string }>;
}): Promise<Metadata> {
  const { grupo: slug } = await params;
  const grupo = grupoPorSlug(slug);
  if (!grupo) return { title: "Maceteros" };

  return {
    title: `${grupo.nombre} de fibrocemento liviano`,
    description: grupo.descripcion,
    alternates: { canonical: `/maceteros/${grupo.slug}` },
    openGraph: {
      title: `${grupo.nombre} | Mundo Macetero`,
      description: grupo.descripcion,
    },
  };
}

export default async function GrupoPage({ params }: { params: Promise<{ grupo: string }> }) {
  const { grupo: slug } = await params;
  const grupo = grupoPorSlug(slug);
  if (!grupo) notFound();

  const productos = await getActiveProductsWithVariants();
  const porSlug = new Map(productos.map((p) => [p.slug, p]));
  // El orden de la grilla es el orden de la lista del grupo, no el de la base.
  const lista = grupo.productos
    .map((s) => porSlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(toCard);

  const otrosGrupos = GRUPOS_MENU.filter((g) => g.slug !== grupo.slug);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px 70px" }}>
      <nav
        aria-label="Ruta de navegación"
        style={{ fontSize: "12.5px", color: "#6f6c66", marginBottom: "14px" }}
      >
        <Link href="/" className="mm-link">
          Inicio
        </Link>
        <span style={{ margin: "0 6px" }}>/</span>
        <Link href="/tienda" className="mm-link">
          Tienda
        </Link>
        <span style={{ margin: "0 6px" }}>/</span>
        <span style={{ color: "#2a2925" }}>{grupo.nombre}</span>
      </nav>

      <h1
        className="font-display"
        style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, margin: "0 0 4px" }}
      >
        {grupo.nombre}
      </h1>
      <p
        style={{
          fontSize: "15px",
          lineHeight: 1.7,
          color: "#4c4944",
          margin: "12px 0 0",
          maxWidth: "760px",
          textWrap: "pretty",
        }}
      >
        {grupo.descripcion}
      </p>
      <div style={{ fontSize: "13.5px", color: "#6f6c66", margin: "16px 0 26px" }}>
        {lista.length} {lista.length === 1 ? "producto" : "productos"}
      </div>

      {lista.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(235px,1fr))", gap: "18px" }}>
          {lista.map((p) => (
            <ProductCard key={p.slug} p={p} showCollection />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6f6c66" }}>
          Estamos actualizando este grupo.{" "}
          <Link href="/tienda" className="mm-link" style={{ color: "#a5613f", fontWeight: 600 }}>
            Ver todos los maceteros
          </Link>
        </div>
      )}

      <div style={{ marginTop: "44px", borderTop: "1px solid #e9e6e1", paddingTop: "22px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "#6f6c66",
            marginBottom: "14px",
          }}
        >
          Seguir mirando
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {otrosGrupos.map((g) => (
            <Link
              key={g.slug}
              href={rutaGrupo(g.slug)}
              style={{
                border: "1px solid #d8d5cf",
                borderRadius: "999px",
                padding: "9px 16px",
                fontSize: "13.5px",
                background: "#fff",
                color: "#2a2925",
              }}
            >
              {g.nombre}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
