import Link from "next/link";
import type { Metadata } from "next";
import { BLOG } from "../../../content/site";
import { BLOG_THUMBS } from "../../../content/thumbs";

export const metadata: Metadata = {
  title: "Noticias · Ferias, colaboraciones y novedades",
  description: "Novedades de Mundo Macetero: ferias de jardinería, maceteros de autor y colaboraciones con artistas y paisajistas en Chile.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 26px" }}>
        Noticias
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "18px" }}>
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
            <div style={{ aspectRatio: "16/10", position: "relative", background: "#e7e4df" }}>
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
    </div>
  );
}
