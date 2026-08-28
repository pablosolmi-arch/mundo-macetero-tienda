import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProductsWithVariants } from "../../queries/catalog";
import { toCard } from "../../lib/catalog";
import { HeroCarousel } from "../../components/home/HeroCarousel";
import { FeaturedRow } from "../../components/home/FeaturedRow";
import { Newsletter } from "../../components/home/Newsletter";
import { Banda } from "../../components/site/Banda";
import { FaqList } from "../../components/site/FaqList";
import { InstagramFeed } from "../../components/site/InstagramFeed";
import { ResenasGoogle } from "../../components/site/ResenasGoogle";
import { buildFaqJsonLd, serializeJsonLd } from "../../lib/seo";
import { FAQ_GENERAL, GUIAS } from "../../content/geo";
import { HERO_IMGS } from "../../content/images";
import { BLOG_THUMBS, EQUIPO_THUMBS, LOGOS_THUMBS, PROYECTOS_THUMBS } from "../../content/thumbs";
import {
  BLOG,
  COLECCION_DESC,
  DESTACADOS_SLUGS,
  HERO_SLIDES,
  TENDENCIAS_SLUGS,
  TIENDA,
} from "../../content/site";

export const revalidate = 3600;

// El único canónico del sitio que se declara "a mano": va aquí y no en el layout
// raíz, porque un canónico heredado apuntaría todas las rutas a la portada.
export const metadata: Metadata = { alternates: { canonical: "/" } };

const H2: React.CSSProperties = {
  fontSize: "clamp(22px,2.6vw,30px)",
  fontWeight: 600,
  margin: 0,
};

// Títulos y textos secundarios sobre banda oscura.
const H2_OSCURO: React.CSSProperties = { ...H2, color: "#fff" };

// Las seis primeras del FAQ general viven en la portada; las diez están en
// /preguntas-frecuentes. El mismo recorte alimenta el JSON-LD de FAQPage, para
// que lo marcado y lo visible sean exactamente lo mismo.
const FAQ_PORTADA = FAQ_GENERAL.slice(0, 6);
const GUIAS_PORTADA = GUIAS.slice(0, 3);

// Atajos a las colecciones por intención (/maceteros/<slug>). La etiqueta va
// corta porque las ocho empiezan por "Maceteros" y el H2 ya da el contexto; el
// título completo viaja en aria-label para quien navega con lector de pantalla.
const BUSQUEDAS: [string, string, string][] = [
  ["maceteros-para-terraza", "Para terraza", "Maceteros para terraza"],
  ["maceteros-grandes", "Grandes", "Maceteros grandes"],
  ["maceteros-livianos", "Livianos", "Maceteros livianos"],
  ["maceteros-para-interior", "Para interior", "Maceteros para interior"],
  ["maceteros-negros", "Negros", "Maceteros negros"],
  ["maceteros-con-doble-fondo", "Con doble fondo", "Maceteros con doble fondo (autorregantes)"],
  ["maceteros-para-olivo", "Para olivo", "Maceteros para olivo"],
  ["maceteros-de-diseno", "De diseño", "Maceteros de diseño"],
];

export default async function HomePage() {
  const productos = await getActiveProductsWithVariants();

  // Featured row: the editorial list first, then topped up with whatever else is
  // active so the carousel is never short.
  const bySlug = new Map(productos.map((p) => [p.slug, p]));
  const destacados = DESTACADOS_SLUGS.map((s) => bySlug.get(s)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );
  const relleno = productos.filter((p) => !DESTACADOS_SLUGS.includes(p.slug));
  const destacadosCards = [...destacados, ...relleno].slice(0, 8).map(toCard);

  // Collections, each illustrated with the first image of one of its products.
  const colecciones = new Map<string, { nombre: string; image: string | null }>();
  for (const p of productos) {
    if (!p.colSlug) continue;
    const current = colecciones.get(p.colSlug);
    if (!current) {
      colecciones.set(p.colSlug, { nombre: p.colNombre, image: p.thumbs?.[0] ?? p.images?.[0] ?? null });
    } else if (!current.image && (p.thumbs?.[0] ?? p.images?.[0])) {
      current.image = p.thumbs?.[0] ?? p.images[0];
    }
  }

  const tendencias = TENDENCIAS_SLUGS.map((slug) => {
    const c = colecciones.get(slug);
    return c ? { slug, ...c } : null;
  }).filter((t): t is { slug: string; nombre: string; image: string | null } => Boolean(t));

  const categorias = [...colecciones.entries()].map(([slug, c]) => ({ slug, ...c }));

  // Los banners son los de la tienda actual. HERO_IMGS viene en el orden en que
  // Shopify los sirve; este mapa los ordena según los slides del diseño. El
  // primer slide trae su propia foto, así que la lista arranca en el segundo.
  const ORDEN_HERO = [2, 3, 0];
  const slides = HERO_SLIDES.map((s, i) => {
    const orden = ORDEN_HERO[i - 1];
    return { ...s, image: s.imagen ?? (orden == null ? null : HERO_IMGS[orden] ?? null) };
  });

  const proyectos = PROYECTOS_THUMBS;

  // Orden de las bandas después del hero: claro, oscuro, claro, oscuro… y cierra
  // en claro para no pegar dos bandas oscuras con el footer.
  return (
    <div>
      <HeroCarousel slides={slides} />

      <Banda tono="claro">
        <FeaturedRow productos={destacadosCards} />
      </Banda>

      {tendencias.length > 0 && (
        <Banda tono="oscuro">
          <h2 className="font-display" style={{ ...H2_OSCURO, marginBottom: "22px" }}>
            Maceteros en tendencia
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "18px" }}>
            {tendencias.map((t) => (
              <Link
                key={t.slug}
                href={`/tienda/${t.slug}`}
                className="mm-tile-photo"
                style={{
                  position: "relative",
                  display: "block",
                  borderRadius: "14px",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  background: "var(--ink-card)",
                }}
              >
                {t.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={t.image}
                    alt={t.nombre}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                   loading="lazy" decoding="async" />
                )}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "38px 18px 14px",
                    background: "linear-gradient(180deg,rgba(14,18,22,0),rgba(14,18,22,.72))",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    pointerEvents: "none",
                  }}
                >
                  <span className="font-display" style={{ color: "#fff", fontWeight: 600, fontSize: "19px" }}>
                    {t.nombre}
                  </span>
                  <span style={{ color: "#fff", fontSize: "12.5px", opacity: 0.9 }}>Ver colección →</span>
                </div>
              </Link>
            ))}
          </div>
        </Banda>
      )}

      <Banda tono="claro">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <h2 className="font-display" style={H2}>
            Categorías
          </h2>
          <Link href="/tienda" style={{ fontSize: "13.5px", fontWeight: 600, color: "#a5613f" }}>
            Ver todo →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "16px" }}>
          {categorias.map((c) => (
            <Link
              key={c.slug}
              href={`/tienda/${c.slug}`}
              className="mm-tile"
              style={{
                display: "block",
                background: "#fff",
                border: "1px solid #e9e6e1",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div style={{ aspectRatio: "4/3", position: "relative", background: "#eceae6" }}>
                {c.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={c.image}
                    alt={c.nombre}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                   loading="lazy" decoding="async" />
                )}
              </div>
              <div style={{ padding: "11px 14px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{c.nombre}</div>
                <div style={{ fontSize: "12px", color: "#6f6c66", marginTop: "2px", minHeight: "16px" }}>
                  {COLECCION_DESC[c.slug] ?? ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Banda>

      <Banda tono="oscuro">
        <h2 className="font-display" style={{ ...H2_OSCURO, margin: "0 0 6px" }}>
          Últimos Proyectos
        </h2>
        <div style={{ color: "var(--on-ink)", fontSize: "13.5px", marginBottom: "22px" }}>
          Calidad · Diseño de espacios · Experiencia
        </div>
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px", scrollbarWidth: "thin" }}>
          {proyectos.map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                flex: "none",
                width: "340px",
                height: "230px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--ink-card)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}  loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </Banda>

      <Banda tono="claro">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: "36px",
            alignItems: "center",
          }}
        >
          <div style={{ borderRadius: "14px", overflow: "hidden", aspectRatio: "4/3", background: "#e7e4df" }}>
            {EQUIPO_THUMBS[0] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={EQUIPO_THUMBS[0]}
                alt="Equipo de Mundo Macetero"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
               loading="lazy" decoding="async" />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#a5613f",
                marginBottom: "10px",
              }}
            >
              Calidad | Diseño de espacios | Experiencia
            </div>
            <h2 className="font-display" style={{ ...H2, margin: "0 0 14px" }}>
              Quiénes somos
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.65, color: "#4c4944", margin: "0 0 20px", textWrap: "pretty" }}>
              Somos Alejandro de Solminihac y Karina Salinas, co-fundadores de Mundo Macetero, junto a un equipo de
              profesionales. Nacimos para hacer posibles jardines con árboles y plantas de gran altura sin procesos
              difíciles ni costosos: nuestros maceteros ultra livianos se manipulan e instalan con facilidad.
            </p>
            <Link
              href="/quienes-somos"
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
              Ver más
            </Link>
          </div>
        </div>
      </Banda>

      <Banda tono="oscuro">
        <h2 className="font-display" style={{ ...H2_OSCURO, marginBottom: "22px" }}>
          Mira lo que hemos estado haciendo
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "18px" }}>
          {BLOG.map((b) => (
            <Link
              key={b.slug}
              href={`/blog/${b.slug}`}
              className="mm-tile-dark"
              style={{
                display: "block",
                background: "var(--ink-card)",
                border: "1px solid #394148",
                borderRadius: "12px",
                overflow: "hidden",
                color: "var(--on-ink)",
              }}
            >
              <div style={{ aspectRatio: "16/10", position: "relative", background: "#394148" }}>
                {BLOG_THUMBS[b.imagen] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={BLOG_THUMBS[b.imagen]}
                    alt={b.titulo}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                   loading="lazy" decoding="async" />
                )}
              </div>
              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ fontSize: "11.5px", color: "#a3a8ad", marginBottom: "6px" }}>{b.fecha}</div>
                <div
                  className="font-display"
                  style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty", color: "#fff" }}
                >
                  {b.titulo}
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--on-ink)", lineHeight: 1.55, margin: "8px 0 10px" }}>
                  {b.extracto}
                </p>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-soft)" }}>Leer →</span>
              </div>
            </Link>
          ))}
        </div>
      </Banda>

      <Banda tono="claro">
        <h2 className="font-display" style={{ ...H2, margin: "0 0 22px", textAlign: "center" }}>
          Confían en nuestros Maceteros
        </h2>
        {/* Grilla estática, como en el sitio de referencia: el marquee movía los
            logos justo cuando el visitante intenta reconocer una marca. */}
        <div className="mm-logos-grid">
          {LOGOS_THUMBS.map((src) => (
            <div
              key={src}
              style={{ height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "90px", objectFit: "contain", display: "block" }}
               loading="lazy" decoding="async" />
            </div>
          ))}
        </div>

        <div style={{ marginTop: "44px" }}>
          <h3
            className="font-display"
            style={{ fontSize: "15px", fontWeight: 600, textAlign: "center", margin: "0 0 18px" }}
          >
            En Instagram
          </h3>
          <InstagramFeed />
        </div>

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <a
            href={TIENDA.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display"
            style={{ fontSize: "17px", fontWeight: 600, color: "#a5613f" }}
          >
            Síguenos en Instagram @mundomacetero →
          </a>
        </div>
      </Banda>

      <Banda tono="oscuro">
        <h2 className="font-display" style={{ ...H2_OSCURO, margin: "0 0 6px" }}>
          Guías para elegir tu macetero
        </h2>
        <div style={{ color: "var(--on-ink)", fontSize: "13.5px", marginBottom: "22px" }}>
          Lo que preguntan nuestros clientes antes de comprar, respondido por quienes los fabrican.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "18px" }}>
          {GUIAS_PORTADA.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="mm-tile-dark"
              style={{
                display: "block",
                background: "var(--ink-card)",
                border: "1px solid #394148",
                borderRadius: "12px",
                overflow: "hidden",
                color: "var(--on-ink)",
                padding: "20px 18px 18px",
              }}
            >
              <div
                className="font-display"
                style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty", color: "#fff" }}
              >
                {g.titulo}
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--on-ink)", lineHeight: 1.55, margin: "8px 0 10px" }}>
                {g.metaDescription.slice(0, 120)}…
              </p>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-soft)" }}>Leer la guía →</span>
            </Link>
          ))}
        </div>
      </Banda>

      <Banda tono="claro" fondo="var(--cream)">
        <h2 className="font-display" style={{ ...H2, margin: "0 0 18px" }}>
          Busca por lo que necesitas
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {BUSQUEDAS.map(([slug, etiqueta, completo]) => (
            <Link
              key={slug}
              href={`/maceteros/${slug}`}
              aria-label={completo}
              style={{
                border: "1px solid #d8d5cf",
                borderRadius: "999px",
                padding: "9px 18px",
                fontSize: "13.5px",
                background: "#fff",
                color: "#2a2925",
              }}
            >
              {etiqueta}
            </Link>
          ))}
          <Link
            href="/maceteros"
            style={{
              borderRadius: "999px",
              padding: "9px 18px",
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#a5613f",
            }}
          >
            Ver todas →
          </Link>
        </div>
      </Banda>

      <ResenasGoogle />

      <Banda tono="claro" interior={{ maxWidth: "860px" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({ "@context": "https://schema.org", ...buildFaqJsonLd(FAQ_PORTADA) }),
          }}
        />
        <h2 className="font-display" style={{ ...H2, margin: "0 0 22px" }}>
          Preguntas frecuentes
        </h2>
        <FaqList faqs={FAQ_PORTADA} />
        <Link
          href="/preguntas-frecuentes"
          style={{ display: "inline-block", marginTop: "22px", fontSize: "13.5px", fontWeight: 600, color: "#a5613f" }}
        >
          Ver todas las preguntas →
        </Link>
      </Banda>

      <Banda tono="claro" fondo="var(--cream)">
        <Newsletter />
      </Banda>
    </div>
  );
}
