"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";

// Header ported from the Claude Design source: sticky translucent bar, growing
// underline nav links, two hover mega-menus, full-screen search and cart badge.

export interface NavProducto {
  slug: string;
  nombre: string;
  colNombre: string;
  precio: number;
}

export interface NavColeccion {
  slug: string;
  nombre: string;
}

interface HeaderProps {
  productos: NavProducto[];
  colecciones: NavColeccion[];
  // Slugs of the three "Otros" entries, resolved against real catalog data.
  otros: NavProducto[];
}

const SearchIcon = ({ size = 15, stroke = "currentColor" }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

export function Header({ productos, colecciones, otros }: HeaderProps) {
  const { count, open } = useCart();
  const [menu, setMenu] = useState<"tienda" | "ases" | null>(null);
  const [navMovil, setNavMovil] = useState(false);
  const [buscador, setBuscador] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (buscador) inputRef.current?.focus();
  }, [buscador]);

  // Close overlays with Escape, the expected behaviour for a modal search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setBuscador(false);
      setNavMovil(false);
      setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim().toLowerCase();
  const resultados =
    term.length > 1
      ? productos
          .filter(
            (p) =>
              p.nombre.toLowerCase().includes(term) ||
              p.colNombre.toLowerCase().includes(term),
          )
          .slice(0, 8)
      : [];
  const sinResultados = term.length > 1 && resultados.length === 0;

  return (
    <>
      <div
        style={{
          background: "#23221f",
          color: "#efece6",
          fontSize: "12.5px",
          letterSpacing: ".03em",
          textAlign: "center",
          padding: "9px 16px",
        }}
      >
        Despacho gratis en comunas del sector oriente de Santiago · Retiro en tienda en Quilicura
      </div>

      <header
        onMouseLeave={() => setMenu(null)}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(244,243,241,.94)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e3e1dc",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            height: "64px",
          }}
        >
          <button
            onClick={() => setNavMovil(true)}
            aria-label="Menú"
            className="mm-burger"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ display: "block", width: "20px", height: "2px", background: "#2a2925" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: "#2a2925" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: "#2a2925" }} />
          </button>

          <Link
            href="/"
            aria-label="Mundo Macetero, ir al inicio"
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* El monograma es la única marca visible: sin texto al lado necesita
                más cuerpo para leerse como ancla del home. La versión oscura es
                para este header claro; el footer usa la blanca.
                eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-oscuro.webp"
              alt="Mundo Macetero"
              width={59}
              height={40}
              style={{ height: "40px", width: "auto", display: "block" }}
            />
          </Link>

          <nav
            className="mm-desktop-nav"
            style={{
              alignItems: "center",
              gap: "28px",
              fontSize: "14px",
              fontWeight: 500,
              flex: 1,
              marginLeft: "12px",
            }}
          >
            <Link href="/" className="mm-nav-link" onMouseEnter={() => setMenu(null)}>
              Inicio
            </Link>
            <div style={{ position: "relative" }} onMouseEnter={() => setMenu("tienda")}>
              <Link
                href="/tienda"
                className="mm-nav-link"
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                Tienda <span style={{ fontSize: "9px", color: "#8b877f" }}>▼</span>
              </Link>
            </div>
            <div style={{ position: "relative" }} onMouseEnter={() => setMenu("ases")}>
              <Link
                href="/asesoramiento"
                className="mm-nav-link"
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                Te asesoramos <span style={{ fontSize: "9px", color: "#8b877f" }}>▼</span>
              </Link>
            </div>
            <Link href="/tu-espacio" className="mm-nav-link" onMouseEnter={() => setMenu(null)}>
              Tu espacio con un macetero
            </Link>
            <Link href="/contacto" className="mm-nav-link" onMouseEnter={() => setMenu(null)}>
              Proyecto Profesional
            </Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <button
              onClick={() => setBuscador(true)}
              aria-label="Búsqueda"
              className="mm-search-btn mm-desktop-only"
            >
              <SearchIcon />
              <span>Buscar</span>
            </button>
            <button
              onClick={() => setBuscador(true)}
              aria-label="Búsqueda"
              className="mm-icon-btn mm-mobile-only"
            >
              <SearchIcon size={19} />
            </button>

            <Link href="/cuenta" aria-label="Iniciar sesión" className="mm-icon-btn">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </Link>

            <button onClick={open} aria-label="Carrito" className="mm-icon-btn" style={{ position: "relative" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
                <path d="M5 8h14l-1.2 13H6.2L5 8z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              {count > 0 && (
                <span
                  key={count}
                  style={{
                    position: "absolute",
                    top: "-1px",
                    right: "-2px",
                    background: "#a5613f",
                    color: "#fff",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    minWidth: "17px",
                    height: "17px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    animation: "mmPop .35s ease",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {menu === "tienda" && (
          <div
            className="mm-desktop-only-block"
            onMouseLeave={() => setMenu(null)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "64px",
              background: "#fff",
              borderBottom: "1px solid #e3e1dc",
              boxShadow: "0 18px 40px rgba(30,28,24,.10)",
              animation: "mmFade .15s ease",
            }}
          >
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "28px 24px 32px",
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: "40px",
              }}
            >
              <div>
                <Link
                  href="/tienda"
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#a5613f",
                  }}
                >
                  Ver todos los Maceteros →
                </Link>
                <div
                  style={{
                    marginTop: "14px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px 24px",
                    fontSize: "13.5px",
                  }}
                >
                  {productos.map((p) => (
                    <Link key={p.slug} href={`/producto/${p.slug}`} className="mm-link">
                      {p.nombre}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#6f6c66",
                  }}
                >
                  Otros
                </div>
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px" }}>
                  {otros.map((p) => (
                    <Link key={p.slug} href={`/producto/${p.slug}`} className="mm-link">
                      {p.nombre}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#6f6c66",
                  }}
                >
                  Catálogo
                </div>
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px" }}>
                  <Link href="/paleta" className="mm-link">
                    Paleta de Colores y Terminaciones
                  </Link>
                  {colecciones.slice(0, 6).map((c) => (
                    <Link key={c.slug} href={`/tienda/${c.slug}`} className="mm-link">
                      {c.nombre}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {menu === "ases" && (
          <div
            className="mm-desktop-only-block"
            onMouseLeave={() => setMenu(null)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "64px",
              background: "#fff",
              borderBottom: "1px solid #e3e1dc",
              boxShadow: "0 18px 40px rgba(30,28,24,.10)",
              animation: "mmFade .15s ease",
            }}
          >
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "22px 24px 26px",
                display: "flex",
                gap: "36px",
                fontSize: "13.5px",
              }}
            >
              <Link href="/asesoramiento" className="mm-link">
                Formulario Asesoramiento
              </Link>
              <Link href="/olivo" className="mm-link">
                Maceteros para tu Olivo
              </Link>
              <Link href="/olivo" className="mm-link">
                Cuidados para tu Olivo
              </Link>
            </div>
          </div>
        )}
      </header>

      {navMovil && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
          <div
            onClick={() => setNavMovil(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(30,28,24,.45)", animation: "mmFade .2s" }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(320px,85vw)",
              background: "#fff",
              padding: "22px",
              overflow: "auto",
              animation: "mmUp .2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-oscuro.webp"
                alt="Mundo Macetero"
                width={50}
                height={34}
                style={{ height: "34px", width: "auto", display: "block" }}
              />
              <button
                onClick={() => setNavMovil(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6f6c66" }}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "15px" }}>
              {[
                ["/", "Inicio"],
                ["/tienda", "Ver todos los Maceteros"],
                ...otros.map((p) => [`/producto/${p.slug}`, p.nombre] as [string, string]),
                ["/paleta", "Paleta de Colores"],
                ["/asesoramiento", "Te asesoramos"],
                ["/olivo", "Maceteros para tu Olivo"],
                ["/tu-espacio", "Tu espacio con un macetero"],
                ["/contacto", "Proyecto Profesional"],
                ["/quienes-somos", "Quiénes somos"],
                ["/blog", "Noticias"],
                ["/cuenta", "Iniciar sesión"],
              ].map(([href, label], i, arr) => (
                <Link
                  key={href + label}
                  href={href}
                  onClick={() => setNavMovil(false)}
                  style={{
                    padding: "11px 8px",
                    borderBottom: i === arr.length - 1 ? undefined : "1px solid #efede9",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {buscador && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }}>
          <div
            onClick={() => setBuscador(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(30,28,24,.45)", animation: "mmFade .15s" }}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              padding: "20px 24px 8px",
              boxShadow: "0 20px 50px rgba(30,28,24,.18)",
              animation: "mmUp .18s ease",
            }}
          >
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "1px solid #d8d5cf",
                  borderRadius: "10px",
                  padding: "0 14px",
                  background: "#faf9f7",
                }}
              >
                <SearchIcon size={18} stroke="#6f6c66" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busca un macetero…"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "none",
                    padding: "13px 0",
                    fontSize: "15px",
                    color: "#2a2925",
                  }}
                />
                <button
                  onClick={() => setBuscador(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6f6c66", fontSize: "16px" }}
                  aria-label="Cerrar búsqueda"
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: "10px 2px 14px" }}>
                {resultados.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/producto/${r.slug}`}
                    onClick={() => setBuscador(false)}
                    className="mm-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span>
                      {r.nombre}
                      <span style={{ color: "#9b978f", fontSize: "12.5px", marginLeft: "6px" }}>{r.colNombre}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCLP(r.precio)}</span>
                  </Link>
                ))}
                {sinResultados && (
                  <div style={{ padding: "12px 10px", color: "#9b978f", fontSize: "13.5px" }}>
                    Sin resultados. Prueba con “bowl”, “jardinera”, “cubo”…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
