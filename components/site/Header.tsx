"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";
import { GRUPOS_MENU, rutaGrupo } from "../../content/menu";
import type { GrupoIntenciones } from "../../lib/intenciones";

// Header con el patrón de color del sitio actual: barra de anuncio clara arriba y
// header oscuro con la navegación a la izquierda, el monograma centrado y los
// íconos a la derecha. Mantiene los dos mega-menús, la búsqueda a pantalla
// completa y el badge del carrito.
//
// En escritorio el monograma va centrado en posición absoluta, no como columna
// central de una grilla: con siete ítems la navegación crecía hasta empujarlo y
// terminaba montándose encima. Sacándolo del flujo, la fila puede ocupar toda su
// mitad sin mover el logo. En móvil sigue siendo una grilla de tres columnas.

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
  // Colecciones por intención de búsqueda, agrupadas (Por uso, Por tamaño…).
  // Llegan resueltas desde el layout: no salen de la base.
  intenciones: GrupoIntenciones[];
}

// El menú "Tienda" ya no lista los 17 modelos ni las colecciones de la base: el
// cliente que llega no reconoce un "Gotar" ni un "Luxor RP", así que navega por
// forma (content/menu.ts). `colecciones` y `otros` siguen llegando por props
// porque el layout las pasa, pero el menú no las usa.

const SearchIcon = ({ size = 15, stroke = "currentColor" }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

// Chevron de los ítems con submenú, en el header y en el drawer.
const Chevron = ({ size = 9, abierto = false }: { size?: number; abierto?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 8"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ transform: abierto ? "rotate(180deg)" : undefined, transition: "transform .2s" }}
  >
    <path d="M1 1.5 6 6.5l5-5" />
  </svg>
);

const HEADER_ALTO_ESCRITORIO = 96;

type Menu = "tienda" | "intenciones" | "ases" | null;

const ITEM_MOVIL: React.CSSProperties = {
  padding: "14px 4px",
  color: "#fff",
  borderBottom: "1px solid rgba(255,255,255,.14)",
};

export function Header({ productos, intenciones }: HeaderProps) {
  const { count, open } = useCart();
  const [menu, setMenu] = useState<Menu>(null);
  const [navMovil, setNavMovil] = useState(false);
  const [grupoMovil, setGrupoMovil] = useState<Menu>(null);
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

  const cerrarMovil = () => {
    setNavMovil(false);
    setGrupoMovil(null);
  };

  // Enlaces del drawer agrupados igual que los mega-menús de escritorio.
  const tiendaMovil: [string, string][] = GRUPOS_MENU.map(
    (g) => [rutaGrupo(g.slug), g.nombre] as [string, string],
  );
  // En el drawer las intenciones van en una sola lista: los encabezados de grupo
  // del escritorio no caben sin convertirlo en un acordeón de dos niveles.
  const intencionesMovil: [string, string][] = [
    ["/maceteros", "Ver todas las búsquedas"],
    ...intenciones.flatMap((g) =>
      g.items.map((i) => [`/maceteros/${i.slug}`, i.h1] as [string, string]),
    ),
  ];
  const asesMovil: [string, string][] = [
    ["/asesoramiento", "Formulario Asesoramiento"],
    ["/olivo", "Maceteros para tu Olivo"],
    ["/olivo", "Cuidados para tu Olivo"],
  ];

  return (
    <>
      {/* La barra de anuncio va clara para que el patrón arranque claro → oscuro. */}
      <div
        className="mm-anuncio"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          fontSize: "12.5px",
          letterSpacing: ".03em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 16px",
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
          background: "var(--ink-header)",
          color: "#fff",
        }}
      >
        {/* El layout vive en app/globals.css (.mm-header-*) y no en estilos en
            línea: en escritorio el monograma se posiciona en absoluto y eso no se
            puede expresar con un solo objeto de estilo para los dos breakpoints. */}
        <div className="mm-header-inner">
          <div className="mm-header-izq">
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
              <span style={{ display: "block", width: "22px", height: "2px", background: "#fff" }} />
              <span style={{ display: "block", width: "22px", height: "2px", background: "#fff" }} />
              <span style={{ display: "block", width: "22px", height: "2px", background: "#fff" }} />
            </button>

            <nav className="mm-desktop-nav">
              <Link href="/" className="mm-nav-link-dark" onMouseEnter={() => setMenu(null)}>
                Inicio
              </Link>
              <div style={{ position: "relative" }} onMouseEnter={() => setMenu("tienda")}>
                <Link
                  href="/tienda"
                  className="mm-nav-link-dark"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  Tienda <Chevron abierto={menu === "tienda"} />
                </Link>
              </div>
              <div style={{ position: "relative" }} onMouseEnter={() => setMenu("ases")}>
                <Link
                  href="/asesoramiento"
                  className="mm-nav-link-dark"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  Te asesoramos <Chevron abierto={menu === "ases"} />
                </Link>
              </div>
              {/* "Tu espacio con un macetero" ocupaba 110px de la fila y no cabe
                  junto al monograma centrado a ningún ancho: la etiqueta corta
                  queda fija y el título completo se lee al entrar a la página. */}
              <Link href="/tu-espacio" className="mm-nav-link-dark" onMouseEnter={() => setMenu(null)}>
                Tu espacio
              </Link>
              <Link href="/contacto" className="mm-nav-link-dark" onMouseEnter={() => setMenu(null)}>
                <span className="mm-nav-largo">Proyecto Profesional</span>
                <span className="mm-nav-corto">Proyectos</span>
              </Link>
              <Link href="/instagram" className="mm-nav-link-dark" onMouseEnter={() => setMenu(null)}>
                Instagram
              </Link>
            </nav>
          </div>

          <Link
            href="/"
            aria-label="Mundo Macetero, ir al inicio"
            className="mm-header-logo-link"
            onMouseEnter={() => setMenu(null)}
          >
            {/* Sobre el header oscuro va el monograma blanco; el oscuro queda para
                fondos claros. eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-claro.webp"
              alt="Mundo Macetero"
              width={100}
              height={68}
              className="mm-header-logo"
              style={{ width: "auto", display: "block" }}
            />
          </Link>

          <div className="mm-header-der">
            {/* Solo la lupa: abre el overlay de búsqueda, que es donde se escribe
                y se ven los resultados. */}
            <button
              onClick={() => setBuscador(true)}
              aria-label="Buscar maceteros"
              className="mm-icon-btn-dark mm-desktop-only"
            >
              <SearchIcon size={19} />
            </button>

            <button onClick={open} aria-label="Carrito" className="mm-icon-btn-dark" style={{ position: "relative" }}>
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
                    background: "var(--accent-soft)",
                    color: "var(--ink-header)",
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
              top: `${HEADER_ALTO_ESCRITORIO}px`,
              background: "#fff",
              color: "var(--foreground)",
              boxShadow: "0 18px 40px rgba(18,22,26,.22)",
              animation: "mmFade .15s ease",
            }}
          >
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "26px 24px 30px",
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: "18px 40px",
              }}
            >
              {GRUPOS_MENU.map((g) => (
                <div key={g.slug}>
                  <Link
                    href={rutaGrupo(g.slug)}
                    className="mm-link"
                    onClick={() => setMenu(null)}
                    style={{ fontSize: "15px", fontWeight: 600 }}
                  >
                    {g.nombre}
                  </Link>
                  {g.slug === "bowls-y-platos" && (
                    <div style={{ marginTop: "4px", fontSize: "12.5px", color: "#6f6c66" }}>
                      Incluye el Plato de Agua, nuestro más vendido
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Las colecciones por intención vivían en un ítem propio del primer
                nivel, pero con siete etiquetas la fila se montaba sobre el
                monograma. Acá abajo quedan a un paso y con más contexto. */}
            <div style={{ borderTop: "1px solid #e9e6e1" }}>
              <div
                style={{
                  maxWidth: "1280px",
                  margin: "0 auto",
                  padding: "22px 24px 30px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: "22px 40px",
                }}
              >
                {intenciones.map((g) => (
                  <div key={g.grupo}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "#6f6c66",
                        marginBottom: "10px",
                      }}
                    >
                      {g.grupo}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "13.5px" }}>
                      {g.items.map((i) => (
                        <Link
                          key={i.slug}
                          href={`/maceteros/${i.slug}`}
                          className="mm-link"
                          onClick={() => setMenu(null)}
                        >
                          {i.h1}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {menu === "intenciones" && (
          <div
            className="mm-desktop-only-block"
            onMouseLeave={() => setMenu(null)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${HEADER_ALTO_ESCRITORIO}px`,
              background: "#fff",
              color: "var(--foreground)",
              boxShadow: "0 18px 40px rgba(18,22,26,.22)",
              animation: "mmFade .15s ease",
            }}
          >
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "26px 24px 30px",
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: "22px 40px",
              }}
            >
              {intenciones.map((g) => (
                <div key={g.grupo}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "#6f6c66",
                      marginBottom: "10px",
                    }}
                  >
                    {g.grupo}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "13.5px" }}>
                    {g.items.map((i) => (
                      <Link
                        key={i.slug}
                        href={`/maceteros/${i.slug}`}
                        className="mm-link"
                        onClick={() => setMenu(null)}
                      >
                        {i.h1}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
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
              top: `${HEADER_ALTO_ESCRITORIO}px`,
              background: "#fff",
              color: "var(--foreground)",
              boxShadow: "0 18px 40px rgba(18,22,26,.22)",
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
              {asesMovil.map(([href, label]) => (
                <Link key={label} href={href} className="mm-link">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {navMovil && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
          <div
            onClick={cerrarMovil}
            style={{ position: "absolute", inset: 0, background: "rgba(12,16,20,.55)", animation: "mmFade .2s" }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(340px,88vw)",
              background: "var(--ink-header)",
              color: "#fff",
              padding: "18px 20px 32px",
              overflow: "auto",
              animation: "mmUp .2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-claro.webp"
                alt="Mundo Macetero"
                width={62}
                height={42}
                style={{ height: "42px", width: "auto", display: "block" }}
              />
              <button
                onClick={cerrarMovil}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#fff" }}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => {
                cerrarMovil();
                setBuscador(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.22)",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                color: "#fff",
                fontSize: "14.5px",
                cursor: "pointer",
              }}
            >
              <SearchIcon size={17} />
              Buscar un macetero
            </button>

            <nav style={{ display: "flex", flexDirection: "column", fontSize: "16px" }}>
              <Link href="/" onClick={cerrarMovil} className="mm-drawer-link" style={ITEM_MOVIL}>
                Inicio
              </Link>

              {(
                [
                  ["tienda", "Tienda", tiendaMovil],
                  ["intenciones", "Maceteros por…", intencionesMovil],
                  ["ases", "Te asesoramos", asesMovil],
                ] as const
              ).map(([clave, label, items]) => (
                <div key={clave} style={{ borderBottom: "1px solid rgba(255,255,255,.14)" }}>
                  <button
                    onClick={() => setGrupoMovil(grupoMovil === clave ? null : clave)}
                    aria-expanded={grupoMovil === clave}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "14px 4px",
                      color: "#fff",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                    <Chevron size={12} abierto={grupoMovil === clave} />
                  </button>
                  {grupoMovil === clave && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "0 4px 14px 14px",
                        fontSize: "14.5px",
                        color: "var(--on-ink)",
                      }}
                    >
                      {items.map(([href, sub]) => (
                        <Link
                          key={`${clave}-${sub}`}
                          href={href}
                          onClick={cerrarMovil}
                          className="mm-drawer-link"
                          style={{ color: "var(--on-ink)" }}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {(
                [
                  ["/tu-espacio", "Tu espacio con un macetero"],
                  ["/contacto", "Proyecto Profesional"],
                  ["/quienes-somos", "Quiénes somos"],
                  ["/blog", "Noticias"],
                  ["/instagram", "Instagram"],
                ] as [string, string][]
              ).map(([href, label], i, arr) => (
                <Link
                  key={href}
                  href={href}
                  onClick={cerrarMovil}
                  className="mm-drawer-link"
                  style={i === arr.length - 1 ? { ...ITEM_MOVIL, borderBottom: "none" } : ITEM_MOVIL}
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
            style={{ position: "absolute", inset: 0, background: "rgba(12,16,20,.5)", animation: "mmFade .15s" }}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              padding: "20px 24px 8px",
              boxShadow: "0 20px 50px rgba(18,22,26,.24)",
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
