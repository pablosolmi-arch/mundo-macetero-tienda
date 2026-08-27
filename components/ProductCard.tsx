import Link from "next/link";
import { formatCLP } from "../lib/format";
import { BadgeDestacado } from "./BadgeDestacado";
import type { ProductCardData } from "../lib/catalog";

// Product card from the design: square image, name, "A partir de" price and an
// outlined "Seleccionar opciones" action. `fixedWidth` is used by the home
// carousel, where cards sit in a horizontal scroller instead of a grid.
export function ProductCard({
  p,
  fixedWidth = false,
  showCollection = false,
}: {
  p: ProductCardData;
  fixedWidth?: boolean;
  // The catalog grid labels each card with its collection; the home row doesn't.
  showCollection?: boolean;
}) {
  return (
    <div
      className="mm-card mm-product-card"
      style={{
        flex: fixedWidth ? "none" : undefined,
        width: fixedWidth ? "262px" : undefined,
        background: "#fff",
        border: "1px solid #e9e6e1",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform .3s,box-shadow .3s,border-color .3s",
      }}
    >
      <Link
        href={`/producto/${p.slug}`}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "1/1",
          background: "#eceae6",
          overflow: "hidden",
        }}
      >
        {p.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={p.image}
            alt={p.nombre}
            className="mm-card-img"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
           loading="lazy" decoding="async" />
        )}
        <BadgeDestacado slug={p.slug} />
      </Link>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {showCollection && p.colNombre && (
          <div
            style={{
              fontSize: "11.5px",
              color: "#9b978f",
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            {p.colNombre}
          </div>
        )}
        <Link href={`/producto/${p.slug}`} style={{ fontSize: "14.5px", fontWeight: 600, lineHeight: 1.3 }}>
          {p.nombre}
        </Link>
        <div style={{ fontSize: "14px", marginTop: "auto" }}>
          {p.desde && <span style={{ color: "#6f6c66", fontSize: "12.5px" }}>A partir de </span>}
          <span style={{ fontWeight: 700 }}>{formatCLP(p.precio)}</span>
        </div>
        <Link
          href={`/producto/${p.slug}`}
          className="mm-btn-select"
          style={{
            textAlign: "center",
            border: "1px solid #2a2925",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Seleccionar opciones
        </Link>
      </div>
    </div>
  );
}
