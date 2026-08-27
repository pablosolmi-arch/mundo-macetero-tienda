import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProductsWithVariants } from "../../../queries/catalog";
import { Breadcrumb } from "../../../components/site/Breadcrumb";
import { GRUPOS, INTENCIONES } from "../../../content/intenciones";
import { productosDeIntencion, resumenIntencion } from "../../../lib/intenciones";
import { SITE_URL, buildBreadcrumbJsonLd, serializeJsonLd } from "../../../lib/seo";

// Hub de las colecciones por intención: la puerta de entrada de quien busca
// "maceteros grandes" o "maceteros para terraza" en vez de un nombre de modelo.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Maceteros por uso, tamaño, color y planta",
  description:
    "Encuentra tu macetero por uso, tamaño, color, función o planta: terraza, interior, jardín, grandes, altos, negros, blancos y más. Fabricados a pedido en Chile.",
  alternates: { canonical: "/maceteros" },
};

const ANCHO: React.CSSProperties = { maxWidth: "1280px", margin: "0 auto" };

const CARD: React.CSSProperties = {
  display: "block",
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "16px 18px",
};

export default async function MaceterosHubPage() {
  const productos = await getActiveProductsWithVariants();

  const conConteo = INTENCIONES.map((i) => ({
    intencion: i,
    total: productosDeIntencion(productos, i).length,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Maceteros por uso, tamaño, color y planta",
        numberOfItems: INTENCIONES.length,
        itemListElement: INTENCIONES.map((i, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: i.h1,
          url: `${SITE_URL}/maceteros/${i.slug}`,
        })),
      },
      buildBreadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Maceteros", path: "/maceteros" },
      ]),
    ],
  };

  return (
    <div style={{ ...ANCHO, padding: "40px 24px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <Breadcrumb items={[{ nombre: "Inicio", href: "/" }, { nombre: "Maceteros" }]} />

      <h1
        className="font-display"
        style={{
          fontSize: "clamp(26px,3.4vw,38px)",
          fontWeight: 700,
          margin: "0 0 16px",
          lineHeight: 1.2,
          textWrap: "pretty",
        }}
      >
        Encuentra tu macetero
      </h1>
      <p
        style={{
          fontSize: "17px",
          lineHeight: 1.7,
          color: "#2a2925",
          margin: "0 0 38px",
          maxWidth: "860px",
          textWrap: "pretty",
        }}
      >
        Todos nuestros maceteros se fabrican a pedido en Quilicura con tecnología EIFS, la misma de
        las fachadas de edificios: tienen la textura del cemento y pesan cerca de 90% menos. Elige
        por dónde va a vivir, qué tamaño necesitas, de qué color lo quieres o qué planta va dentro.
      </p>

      {GRUPOS.map((grupo) => {
        const items = conConteo.filter((c) => c.intencion.grupo === grupo);
        if (items.length === 0) return null;

        return (
          <section key={grupo} style={{ marginBottom: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 16px" }}>
              {grupo}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
              {items.map(({ intencion, total }) => (
                <Link
                  key={intencion.slug}
                  href={`/maceteros/${intencion.slug}`}
                  className="mm-tile"
                  style={CARD}
                >
                  <span className="font-display" style={{ fontSize: "15px", fontWeight: 600 }}>
                    {intencion.h1}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      color: "#6f6c66",
                      lineHeight: 1.55,
                      margin: "6px 0 8px",
                      textWrap: "pretty",
                    }}
                  >
                    {resumenIntencion(intencion)}
                  </span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "#a5613f", fontWeight: 600 }}>
                    {total} {total === 1 ? "producto" : "productos"} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
