import Link from "next/link";
import { ProductCard } from "../ProductCard";
import type { ProductCardData } from "../../lib/catalog";
import { GRUPOS_MENU, rutaGrupo, type GrupoMenu } from "../../content/menu";

// Vista de un grupo del menú (bowls, redondos, jardineras, complementos): una
// grilla con las mismas tarjetas del catálogo, sin filtros, y chips para saltar
// a otro grupo. Vivía dentro de app/(tienda)/maceteros/[grupo]/page.tsx; se
// extrajo tal cual cuando /maceteros/<slug> pasó a servir también las páginas
// de intención, porque Next.js solo admite un nombre de parámetro por segmento.
export function GrupoMenuVista({ grupo, lista }: { grupo: GrupoMenu; lista: ProductCardData[] }) {
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
