import type { Metadata } from "next";
import { HERO_IMGS } from "../../../../content/images";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "../../../../components/site/Breadcrumb";
import { FaqList } from "../../../../components/site/FaqList";
import {
  ORGANIZATION_ID,
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
} from "../../../../lib/seo";
import { COLECCIONES, GUIAS, GUIAS_BY_SLUG } from "../../../../content/geo";

export const revalidate = 3600;

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

// `fechaPublicacion` es una fecha sin hora: interpretarla como UTC la correría un
// día hacia atrás al formatearla en Chile (UTC-4/-3), así que se ancla al mediodía.
const FECHA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" });
function formatFecha(iso: string): string {
  return FECHA.format(new Date(`${iso}T12:00:00`));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guia = GUIAS_BY_SLUG[slug];
  if (!guia) return { title: "Guías" };
  return {
    // metaTitle already carries the "| Mundo Macetero" suffix; bypass the template.
    title: { absolute: guia.metaTitle },
    description: guia.metaDescription,
    keywords: guia.keywords,
    alternates: { canonical: `/guias/${guia.slug}` },
    openGraph: {
      type: "article",
      title: guia.metaTitle,
      description: guia.metaDescription,
      url: `${SITE_URL}/guias/${guia.slug}`,
      publishedTime: guia.fechaPublicacion,
      images: [HERO_IMGS[2]],
    },
  };
}

const CARD: React.CSSProperties = {
  display: "block",
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "16px 18px",
};

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = GUIAS_BY_SLUG[slug];
  if (!guia) notFound();

  const url = `${SITE_URL}/guias/${guia.slug}`;
  const relacionadas = guia.relacionadas
    .map((s) => GUIAS_BY_SLUG[s])
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guia.titulo,
        description: guia.metaDescription,
        datePublished: guia.fechaPublicacion,
        // La guía no tiene historial de ediciones: mientras no lo tenga, la fecha
        // de modificación es la de publicación y no una fecha inventada.
        dateModified: guia.fechaPublicacion,
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: url,
        inLanguage: "es-CL",
      },
      buildFaqJsonLd(guia.faqs),
      buildBreadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Guías", path: "/guias" },
        { name: guia.titulo, path: `/guias/${guia.slug}` },
      ]),
    ],
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <Breadcrumb
        items={[{ nombre: "Inicio", href: "/" }, { nombre: "Guías", href: "/guias" }, { nombre: guia.titulo }]}
      />

      <article>
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
          {guia.titulo}
        </h1>
        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.7,
            color: "#2a2925",
            margin: "0 0 12px",
            textWrap: "pretty",
          }}
        >
          {guia.resumen}
        </p>
        <time
          dateTime={guia.fechaPublicacion}
          style={{ display: "block", fontSize: "12.5px", color: "#9b978f", marginBottom: "34px" }}
        >
          Publicada el {formatFecha(guia.fechaPublicacion)}
        </time>

        {guia.secciones.map((s) => (
          <section key={s.titulo} style={{ marginBottom: "34px" }}>
            <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 12px", textWrap: "pretty" }}>
              {s.titulo}
            </h2>
            {s.parrafos.map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: "15.5px",
                  lineHeight: 1.75,
                  color: "#4c4944",
                  margin: i === 0 ? 0 : "16px 0 0",
                  textWrap: "pretty",
                }}
              >
                {p}
              </p>
            ))}
          </section>
        ))}

        <section id="faq" style={{ marginBottom: "40px" }}>
          <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 16px" }}>
            Preguntas frecuentes
          </h2>
          <FaqList faqs={guia.faqs} />
        </section>

        {guia.colecciones.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 16px" }}>
              Colecciones recomendadas
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
              {guia.colecciones.map((c) => (
                <Link key={c} href={`/tienda/${c}`} className="mm-tile" style={CARD}>
                  <span className="font-display" style={{ fontSize: "15px", fontWeight: 600 }}>
                    {COLECCIONES[c]?.h1 ?? c}
                  </span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "#a5613f", marginTop: "4px" }}>
                    Ver colección →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {relacionadas.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 14px" }}>
              Guías relacionadas
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {relacionadas.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guias/${g.slug}`}
                  className="mm-link"
                  style={{ fontSize: "14.5px", fontWeight: 600, color: "#a5613f", lineHeight: 1.5 }}
                >
                  {g.titulo} →
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <div style={{ background: "var(--cream)", borderRadius: "14px", padding: "26px 24px" }}>
        <div className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
          ¿Te ayudamos a elegir?
        </div>
        <p style={{ fontSize: "14px", color: "#4c4944", lineHeight: 1.65, margin: "0 0 16px", textWrap: "pretty" }}>
          Cuéntanos qué planta tienes y dónde vivirá, y te recomendamos modelo, medida, terminación y drenaje sin costo.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href="/asesoramiento"
            className="mm-btn-select"
            style={{
              display: "inline-block",
              border: "1px solid #2a2925",
              borderRadius: "9px",
              padding: "12px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            Asesoría gratuita
          </Link>
          <Link
            href="/tienda"
            className="mm-btn-select"
            style={{
              display: "inline-block",
              border: "1px solid #d8d5cf",
              borderRadius: "9px",
              padding: "12px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            Ver maceteros
          </Link>
        </div>
      </div>
    </div>
  );
}
