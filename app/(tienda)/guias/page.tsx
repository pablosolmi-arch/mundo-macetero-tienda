import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "../../../components/site/Breadcrumb";
import { buildBreadcrumbJsonLd, SITE_URL, serializeJsonLd } from "../../../lib/seo";
import { GUIAS } from "../../../content/geo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Guías para elegir maceteros",
  description:
    "Guías prácticas para elegir macetero: material, peso, resistencia al exterior, tamaño según la planta, drenaje y formatos para terraza, jardín e interior.",
  alternates: { canonical: "/guias" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      name: "Guías para elegir maceteros",
      itemListElement: GUIAS.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.titulo,
        url: `${SITE_URL}/guias/${g.slug}`,
      })),
    },
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Guías", path: "/guias" },
    ]),
  ],
};

export default function GuiasPage() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(JSON_LD) }} />

      <Breadcrumb items={[{ nombre: "Inicio", href: "/" }, { nombre: "Guías" }]} />

      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 14px" }}>
        Guías para elegir maceteros
      </h1>
      <p
        style={{
          fontSize: "15.5px",
          lineHeight: 1.75,
          color: "#4c4944",
          margin: "0 0 34px",
          maxWidth: "760px",
          textWrap: "pretty",
        }}
      >
        Llevamos años fabricando maceteros de fibrocemento en Quilicura y asesorando proyectos residenciales y
        comerciales en todo Chile. Estas guías reúnen lo que respondemos a diario: qué material aguanta el exterior, qué
        tamaño pide cada planta, qué drenaje elegir y cómo resolver una terraza o un balcón sin problemas de peso.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "18px" }}>
        {GUIAS.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="mm-tile"
            style={{
              display: "block",
              background: "#fff",
              border: "1px solid #e9e6e1",
              borderRadius: "12px",
              padding: "22px 20px 20px",
            }}
          >
            <div
              className="font-display"
              style={{ fontSize: "16.5px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty" }}
            >
              {g.titulo}
            </div>
            <p style={{ fontSize: "13.5px", color: "#6f6c66", lineHeight: 1.6, margin: "10px 0 12px" }}>
              {g.metaDescription}
            </p>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#a5613f" }}>Leer la guía →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
