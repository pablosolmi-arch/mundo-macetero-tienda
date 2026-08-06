import Link from "next/link";
import { getActiveProductsWithVariants } from "../queries/catalog";
import { toCard } from "../lib/catalog";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { FeaturedRow } from "../components/home/FeaturedRow";
import { Newsletter } from "../components/home/Newsletter";
import {
  BLOG,
  COLECCION_DESC,
  CONFIANZA,
  DESTACADOS_SLUGS,
  HERO_SLIDES,
  TENDENCIAS_SLUGS,
  TIENDA,
} from "../content/site";

export const revalidate = 3600;

const H2: React.CSSProperties = {
  fontSize: "clamp(22px,2.6vw,30px)",
  fontWeight: 600,
  margin: 0,
};

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
      colecciones.set(p.colSlug, { nombre: p.colNombre, image: p.images?.[0] ?? null });
    } else if (!current.image && p.images?.[0]) {
      current.image = p.images[0];
    }
  }

  const tendencias = TENDENCIAS_SLUGS.map((slug) => {
    const c = colecciones.get(slug);
    return c ? { slug, ...c } : null;
  }).filter((t): t is { slug: string; nombre: string; image: string | null } => Boolean(t));

  const categorias = [...colecciones.entries()].map(([slug, c]) => ({ slug, ...c }));

  const heroImages = destacadosCards.map((c) => c.image);
  const slides = HERO_SLIDES.map((s, i) => ({ ...s, image: heroImages[i] ?? heroImages[0] ?? null }));

  // "Últimos Proyectos" has no project photography in the database yet, so the
  // strip shows real catalog photography rather than an invented placeholder.
  const proyectos = productos
    .flatMap((p) => (p.images ?? []).slice(0, 2))
    .filter(Boolean)
    .slice(0, 8);

  const quienesImg = productos.find((p) => (p.images?.length ?? 0) > 2)?.images?.[1] ?? null;

  return (
    <div>
      <HeroCarousel slides={slides} />

      <FeaturedRow productos={destacadosCards} />

      {tendencias.length > 0 && (
        <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "54px 24px 0" }}>
          <h2 className="font-display" style={{ ...H2, marginBottom: "22px" }}>
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
                  background: "#e7e4df",
                }}
              >
                {t.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={t.image}
                    alt={t.nombre}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "38px 18px 14px",
                    background: "linear-gradient(180deg,rgba(24,22,19,0),rgba(24,22,19,.62))",
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
        </section>
      )}

      <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "54px 24px 0" }}>
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
                  />
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
      </section>

      <section className="mm-reveal" style={{ background: "#23221f", marginTop: "64px", padding: "58px 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <h2 className="font-display" style={{ ...H2, margin: "0 0 6px", color: "#f4f3f1" }}>
            Últimos Proyectos
          </h2>
          <div style={{ color: "#a29d94", fontSize: "13.5px", marginBottom: "22px" }}>
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
                  background: "#33312c",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: "36px",
            alignItems: "center",
          }}
        >
          <div style={{ borderRadius: "14px", overflow: "hidden", aspectRatio: "4/3", background: "#e7e4df" }}>
            {quienesImg && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={quienesImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
      </section>

      <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 0" }}>
        <h2 className="font-display" style={{ ...H2, marginBottom: "22px" }}>
          Mira lo que hemos estado haciendo
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "18px" }}>
          {BLOG.map((b) => (
            <Link
              key={b.slug}
              href={`/blog/${b.slug}`}
              className="mm-tile"
              style={{
                display: "block",
                background: "#fff",
                border: "1px solid #e9e6e1",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  aspectRatio: "16/10",
                  position: "relative",
                  background: "linear-gradient(135deg,#e7e4df,#d8d5cf)",
                }}
              />
              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ fontSize: "11.5px", color: "#9b978f", marginBottom: "6px" }}>{b.fecha}</div>
                <div
                  className="font-display"
                  style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty" }}
                >
                  {b.titulo}
                </div>
                <p style={{ fontSize: "13.5px", color: "#6f6c66", lineHeight: 1.55, margin: "8px 0 10px" }}>
                  {b.extracto}
                </p>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#a5613f" }}>Leer →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 0" }}>
        <h2 className="font-display" style={{ ...H2, margin: "0 0 22px", textAlign: "center" }}>
          Confían en nuestros Maceteros
        </h2>
        <div
          style={{
            overflow: "hidden",
            position: "relative",
            WebkitMaskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)",
            maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)",
          }}
        >
          <div style={{ display: "flex", gap: "14px", width: "max-content", animation: "mmMarquee 32s linear infinite" }}>
            {[...CONFIANZA, ...CONFIANZA].map((label, i) => (
              <div
                key={`${label}-${i}`}
                style={{
                  width: "150px",
                  height: "64px",
                  flex: "none",
                  border: "1px dashed #cfcbc4",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  color: "#8b877f",
                  background: "#faf9f7",
                  textAlign: "center",
                  padding: "6px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
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
      </section>

      <Newsletter />
    </div>
  );
}
