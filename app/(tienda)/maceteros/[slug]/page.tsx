import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getActiveProductsWithVariants } from "../../../../queries/catalog";
import { toCard } from "../../../../lib/catalog";
import { Catalogo } from "../../../../components/catalog/Catalogo";
import { GrupoMenuVista } from "../../../../components/catalog/GrupoMenuVista";
import { Breadcrumb } from "../../../../components/site/Breadcrumb";
import { FaqList } from "../../../../components/site/FaqList";
import { INTENCIONES, INTENCIONES_BY_SLUG } from "../../../../content/intenciones";
import { GUIAS_BY_SLUG } from "../../../../content/geo";
import { HERO_IMGS } from "../../../../content/images";
import { grupoPorSlug } from "../../../../content/menu";
import { productosDeIntencion } from "../../../../lib/intenciones";
import {
  SITE_URL,
  WEBSITE_ID,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
} from "../../../../lib/seo";

// /maceteros/<slug> sirve DOS cosas con un solo parámetro, porque Next.js no
// admite dos nombres distintos ([grupo] y [slug]) en el mismo segmento:
//
//   1. las colecciones por intención de búsqueda (content/intenciones.ts), y
//   2. los grupos del menú por forma (content/menu.ts), que ya vivían aquí.
//
// La intención tiene prioridad cuando ambos declaran el mismo slug, que hoy
// ocurre solo con "maceteros-altos".
export const revalidate = 3600;

export function generateStaticParams() {
  return INTENCIONES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const intencion = INTENCIONES_BY_SLUG[slug];
  if (intencion) {
    const productos = await getActiveProductsWithVariants();
    const lista = productosDeIntencion(productos, intencion);
    return {
      // metaTitle ya trae el sufijo "| Mundo Macetero"; salta la plantilla.
      title: { absolute: intencion.metaTitle },
      description: intencion.metaDescription,
      alternates: { canonical: `/maceteros/${intencion.slug}` },
      // Una selección sin productos no aporta nada a un buscador: se sirve igual
      // para quien llegue por un enlace, pero no se indexa.
      ...(lista.length === 0 ? { robots: { index: false } } : {}),
      openGraph: {
        title: intencion.metaTitle,
        description: intencion.metaDescription,
        url: `${SITE_URL}/maceteros/${intencion.slug}`,
        images: [HERO_IMGS[2]],
      },
    };
  }

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

const ANCHO: React.CSSProperties = { maxWidth: "1280px", margin: "0 auto" };

const CHIP: React.CSSProperties = {
  border: "1px solid #d8d5cf",
  borderRadius: "999px",
  padding: "9px 16px",
  fontSize: "13.5px",
  background: "#fff",
  color: "#2a2925",
};

const H2: React.CSSProperties = { fontSize: "22px", fontWeight: 600, margin: "0 0 16px" };

const BOTON: React.CSSProperties = {
  display: "inline-block",
  borderRadius: "9px",
  padding: "12px 24px",
  fontSize: "13.5px",
  fontWeight: 600,
};

export default async function MaceterosSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const intencion = INTENCIONES_BY_SLUG[slug];

  if (!intencion) {
    const grupo = grupoPorSlug(slug);
    if (!grupo) notFound();

    // Los grupos del menú se servían con force-dynamic para mostrar siempre el
    // precio y la disponibilidad del momento. Hoy el force-dynamic del layout de
    // (tienda) ya lo garantiza, pero el segmento declara revalidate por las
    // páginas de intención: pedir la request aquí deja esa intención escrita en
    // el propio camino, para que no se convierta en caché de una hora si algún
    // día el layout deja de forzar el render dinámico.
    await connection();

    const productos = await getActiveProductsWithVariants();
    const porSlug = new Map(productos.map((p) => [p.slug, p]));
    // El orden de la grilla es el orden de la lista del grupo, no el de la base.
    const lista = grupo.productos
      .map((s) => porSlug.get(s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(toCard);

    return <GrupoMenuVista grupo={grupo} lista={lista} />;
  }

  const productos = await getActiveProductsWithVariants();
  const lista = productosDeIntencion(productos, intencion);

  const relacionadas = intencion.relacionadas
    .map((s) => INTENCIONES_BY_SLUG[s])
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
  const guias = intencion.guias
    .map((s) => GUIAS_BY_SLUG[s])
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const url = `${SITE_URL}/maceteros/${intencion.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: intencion.metaTitle,
        description: intencion.metaDescription,
        inLanguage: "es-CL",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: lista.length,
          itemListElement: lista.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${SITE_URL}/producto/${p.slug}`,
          })),
        },
      },
      buildFaqJsonLd(intencion.faqs),
      buildBreadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Maceteros", path: "/maceteros" },
        { name: intencion.h1, path: `/maceteros/${intencion.slug}` },
      ]),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div style={{ ...ANCHO, padding: "40px 24px 0" }}>
        <Breadcrumb
          items={[
            { nombre: "Inicio", href: "/" },
            { nombre: "Maceteros", href: "/maceteros" },
            { nombre: intencion.h1 },
          ]}
        />
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
          {intencion.h1}
        </h1>
        {intencion.intro.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: i === 0 ? "17px" : "15.5px",
              lineHeight: i === 0 ? 1.7 : 1.75,
              color: i === 0 ? "#2a2925" : "#4c4944",
              margin: i === 0 ? "0 0 16px" : "0 0 16px",
              maxWidth: "860px",
              textWrap: "pretty",
            }}
          >
            {p}
          </p>
        ))}
        <div style={{ height: "12px" }} />
      </div>

      {lista.length > 0 ? (
        <Catalogo
          sinTitulo
          titulo={intencion.h1}
          productos={lista.map(toCard)}
          colecciones={[]}
          coleccionActual={null}
        />
      ) : (
        <div style={{ ...ANCHO, padding: "0 24px 40px" }}>
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "#6f6c66",
              border: "1px solid #e9e6e1",
              borderRadius: "12px",
              background: "#fff",
              fontSize: "14.5px",
            }}
          >
            Aún no hay productos en esta selección.{" "}
            <Link href="/tienda" className="mm-link" style={{ color: "#a5613f", fontWeight: 600 }}>
              Ver todos los maceteros
            </Link>
          </div>
        </div>
      )}

      <div style={{ ...ANCHO, padding: "0 24px 80px" }}>
        {relacionadas.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
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
              Otras búsquedas
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {relacionadas.map((i) => (
                <Link key={i.slug} href={`/maceteros/${i.slug}`} style={CHIP}>
                  {i.h1}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="faq" style={{ marginBottom: "40px", maxWidth: "860px" }}>
          <h2 className="font-display" style={H2}>
            Preguntas frecuentes
          </h2>
          <FaqList faqs={intencion.faqs} />
        </section>

        {guias.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display" style={{ ...H2, marginBottom: "14px" }}>
              Guías relacionadas
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {guias.map((g) => (
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

        <div style={{ background: "var(--cream)", borderRadius: "14px", padding: "26px 24px" }}>
          <div className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
            ¿Te ayudamos a elegir?
          </div>
          <p style={{ fontSize: "14px", color: "#4c4944", lineHeight: 1.65, margin: "0 0 16px", textWrap: "pretty" }}>
            Cuéntanos qué planta tienes y dónde vivirá, y te recomendamos modelo, medida, terminación y drenaje sin costo.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/asesoramiento" className="mm-btn-select" style={{ ...BOTON, border: "1px solid #2a2925" }}>
              Asesoría gratuita
            </Link>
            <Link href="/tienda" className="mm-btn-select" style={{ ...BOTON, border: "1px solid #d8d5cf" }}>
              Ver maceteros
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
