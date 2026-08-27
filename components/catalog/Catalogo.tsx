"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard } from "../ProductCard";
import type { ProductCardData } from "../../lib/catalog";

// Catalog grid with the design's three filter selects. The collection filter is a
// real route change (/tienda/<slug>) so a filtered list is linkable and indexable;
// price and sort stay client-side.

type Orden = "destacados" | "precio-asc" | "precio-desc" | "az";
type Precio = "0" | "100" | "150" | "150mas";

const SELECT: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #d8d5cf",
  borderRadius: "9px",
  fontSize: "13.5px",
  background: "#fff",
  color: "#2a2925",
};

interface CatalogoProps {
  titulo: string;
  productos: ProductCardData[];
  colecciones: { slug: string; nombre: string }[];
  coleccionActual: string | null;
  // Texto editorial de la colección (content/geo.ts). Va bajo el H1 para que la
  // página diga de qué se trata antes de la grilla, en vez de abrir con filtros.
  intro?: string;
}

export function Catalogo({ titulo, productos, colecciones, coleccionActual, intro }: CatalogoProps) {
  const router = useRouter();
  const [precio, setPrecio] = useState<Precio>("0");
  const [orden, setOrden] = useState<Orden>("destacados");

  const lista = useMemo(() => {
    let out = [...productos];
    if (precio === "100") out = out.filter((p) => p.precio <= 100000);
    if (precio === "150") out = out.filter((p) => p.precio <= 150000);
    if (precio === "150mas") out = out.filter((p) => p.precio > 150000);

    if (orden === "precio-asc") out.sort((a, b) => a.precio - b.precio);
    else if (orden === "precio-desc") out.sort((a, b) => b.precio - a.precio);
    else if (orden === "az") out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return out;
  }, [productos, precio, orden]);

  const filtroActivo = coleccionActual !== null || precio !== "0" || orden !== "destacados";

  function limpiar() {
    setPrecio("0");
    setOrden("destacados");
    if (coleccionActual !== null) router.push("/tienda");
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px 70px" }}>
      <h1
        className="font-display"
        style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, margin: "0 0 4px" }}
      >
        {titulo}
      </h1>
      {intro && (
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
          {intro}
        </p>
      )}
      <div style={{ fontSize: "13.5px", color: "#6f6c66", margin: intro ? "16px 0 24px" : "0 0 24px" }}>
        {lista.length} {lista.length === 1 ? "producto" : "productos"}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "26px" }}>
        <select
          value={coleccionActual ?? "todas"}
          onChange={(e) => router.push(e.target.value === "todas" ? "/tienda" : `/tienda/${e.target.value}`)}
          aria-label="Colección"
          style={SELECT}
        >
          <option value="todas">Todas las colecciones</option>
          {colecciones.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={precio}
          onChange={(e) => setPrecio(e.target.value as Precio)}
          aria-label="Precio"
          style={SELECT}
        >
          <option value="0">Precio: todos</option>
          <option value="100">Hasta $100.000</option>
          <option value="150">Hasta $150.000</option>
          <option value="150mas">Más de $150.000</option>
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Orden" style={SELECT}>
          <option value="destacados">Orden: destacados</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="az">Alfabético A–Z</option>
        </select>

        {filtroActivo && (
          <button
            onClick={limpiar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "#a5613f",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {lista.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(235px,1fr))", gap: "18px" }}>
          {lista.map((p) => (
            <ProductCard key={p.slug} p={p} showCollection />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6f6c66" }}>
          No hay productos con estos filtros.{" "}
          <button
            onClick={limpiar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a5613f",
              fontWeight: 600,
              textDecoration: "underline",
              fontSize: "14px",
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
