"use client";

import { useRef } from "react";
import { ProductCard } from "../ProductCard";
import type { ProductCardData } from "../../lib/catalog";

// Horizontally scrolling "Productos Destacados" row with arrow controls.
export function FeaturedRow({ productos }: { productos: ProductCardData[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 560, behavior: "smooth" });

  return (
    <section className="mm-reveal" style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <h2
          className="font-display"
          style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 600, margin: 0 }}
        >
          Productos Destacados
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => scroll(-1)} aria-label="Anterior" className="mm-round-btn">
            ‹
          </button>
          <button onClick={() => scroll(1)} aria-label="Siguiente" className="mm-round-btn">
            ›
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        style={{
          display: "flex",
          gap: "18px",
          overflowX: "auto",
          scrollBehavior: "smooth",
          paddingBottom: "14px",
          scrollbarWidth: "thin",
        }}
      >
        {productos.map((p) => (
          <ProductCard key={p.slug} p={p} fixedWidth />
        ))}
      </div>
    </section>
  );
}
