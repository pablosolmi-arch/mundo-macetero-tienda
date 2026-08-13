"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCLP } from "../../lib/format";
import { COMUNAS_RM, ENVIO, REGIONES } from "../../content/site";

// Carga de una venta tomada por WhatsApp o teléfono. El subtotal que se ve acá es
// solo una referencia para conversar con el cliente: el total que se cobra lo
// recalcula /api/admin/pedidos/nuevo contra la base.

export interface VarianteLiviana {
  id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
}

export interface ProductoLiviano {
  slug: string;
  nombre: string;
  precioBase: number;
  variantes: VarianteLiviana[];
}

interface Linea {
  key: number;
  slug: string;
  variantId: number | null;
  qty: number;
}

interface Resultado {
  commerceOrder: string;
  linkPago: string | null;
  aviso?: string;
}

const INPUT: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "13px",
  background: "#fff",
  outline: "none",
  width: "100%",
};

const BOTON: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid #d8d5cf",
  background: "#fff",
};

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "20px",
};

const TITULO: React.CSSProperties = { fontSize: "14px", fontWeight: 600, margin: "0 0 12px" };

const ETIQUETA: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#6f6c66",
  fontWeight: 600,
  display: "block",
  marginBottom: "5px",
};

let contador = 0;
function nuevaLinea(): Linea {
  contador += 1;
  return { key: contador, slug: "", variantId: null, qty: 1 };
}

export function NuevoPedido({ productos }: { productos: ProductoLiviano[] }) {
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [entrega, setEntrega] = useState<"retiro" | "despacho">("retiro");
  const [direccion, setDireccion] = useState("");
  const [region, setRegion] = useState<string>(ENVIO.regionRM);
  const [comuna, setComuna] = useState("");
  const [nota, setNota] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const porSlug = new Map(productos.map((p) => [p.slug, p]));
  const esRM = region === ENVIO.regionRM;

  function precioLinea(linea: Linea): number {
    const producto = porSlug.get(linea.slug);
    if (!producto) return 0;
    if (linea.variantId != null) {
      const v = producto.variantes.find((x) => x.id === linea.variantId);
      if (v) return v.precio;
    }
    return producto.precioBase;
  }

  const subtotal = lineas.reduce(
    (acc, linea) => acc + (linea.slug ? precioLinea(linea) * linea.qty : 0),
    0,
  );

  function actualizar(key: number, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  }

  function elegirProducto(key: number, slug: string) {
    const producto = porSlug.get(slug);
    // Con una sola variante se preselecciona; con varias, se obliga a elegir.
    const unica =
      producto && producto.variantes.length === 1 && producto.variantes[0].disponible
        ? producto.variantes[0].id
        : null;
    actualizar(key, { slug, variantId: unica });
  }

  const lineasListas = lineas.filter((l) => l.slug && l.qty > 0);
  const puedeEnviar =
    !cargando && lineasListas.length > 0 && correo.trim() !== "" &&
    (entrega === "retiro" || comuna.trim() !== "");

  async function crear() {
    setCargando(true);
    setError("");
    setResultado(null);
    setCopiado(false);
    try {
      const res = await fetch("/api/admin/pedidos/nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lineasListas.map((l) => ({
            productSlug: l.slug,
            variantId: l.variantId,
            qty: l.qty,
          })),
          customer: {
            email: correo.trim(),
            name: nombre,
            phone: telefono,
            address: entrega === "despacho" ? direccion : "",
            city: entrega === "despacho" ? comuna : "",
            region: entrega === "despacho" ? region : "",
            note: nota,
          },
          entrega,
          codigo: codigo.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResultado({
          commerceOrder: data.commerceOrder,
          linkPago: data.linkPago ?? null,
          aviso: data.aviso,
        });
      } else {
        setError(data.message ?? "No se pudo crear el pedido.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  async function copiar(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (resultado) {
    return (
      <div style={{ ...TARJETA, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#4c7a4c" }}>
          Pedido creado.
        </div>
        <div style={{ fontSize: "14px" }}>
          <Link
            href={`/admin/pedidos/${resultado.commerceOrder}`}
            style={{ fontWeight: 700, color: "#a5613f" }}
          >
            {resultado.commerceOrder}
          </Link>
          <span style={{ color: "#6f6c66" }}> · ver el detalle</span>
        </div>

        {resultado.linkPago ? (
          <div
            style={{
              background: "#faf9f7",
              border: "1px solid #e9e6e1",
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <div style={{ ...ETIQUETA, marginBottom: "8px" }}>
              Link de pago para enviarle al cliente
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <input readOnly value={resultado.linkPago} style={{ ...INPUT, flex: 1, minWidth: "240px" }} />
              <button
                onClick={() => copiar(resultado.linkPago as string)}
                style={{ ...BOTON, background: "#2a2925", color: "#fff", border: "none" }}
              >
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#f6efdf",
              border: "1px solid #e3d4ae",
              borderRadius: "10px",
              padding: "14px 16px",
              fontSize: "12.5px",
              color: "#6f6c66",
            }}
          >
            {resultado.aviso ??
              "No se generó link de pago (falta configurar la pasarela de pago)."}{" "}
            El pedido quedó pendiente: se puede marcar pagado por transferencia desde su detalle.
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setResultado(null);
              setLineas([nuevaLinea()]);
              setNombre("");
              setCorreo("");
              setTelefono("");
              setDireccion("");
              setComuna("");
              setNota("");
              setCodigo("");
            }}
            style={BOTON}
          >
            Crear otro pedido
          </button>
          <Link href="/admin/pedidos" style={{ ...BOTON, textDecoration: "none", color: "#2a2925" }}>
            Volver a pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Productos
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {lineas.map((linea) => {
            const producto = porSlug.get(linea.slug);
            return (
              <div
                key={linea.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(160px,1.4fr) minmax(160px,1.6fr) 80px auto",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <select
                  value={linea.slug}
                  onChange={(e) => elegirProducto(linea.key, e.target.value)}
                  aria-label="Producto"
                  style={INPUT}
                >
                  <option value="">Elegir producto…</option>
                  {productos.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nombre}
                    </option>
                  ))}
                </select>

                {producto && producto.variantes.length > 0 ? (
                  <select
                    value={linea.variantId ?? ""}
                    onChange={(e) =>
                      actualizar(linea.key, {
                        variantId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    aria-label="Variante"
                    style={INPUT}
                  >
                    <option value="">Sin variante · {formatCLP(producto.precioBase)}</option>
                    {producto.variantes.map((v) => (
                      <option key={v.id} value={v.id} disabled={!v.disponible}>
                        {v.nombre} · {formatCLP(v.precio)}
                        {v.disponible ? "" : " (no disponible)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#9b978f" }}>
                    {producto ? formatCLP(producto.precioBase) : "—"}
                  </div>
                )}

                <input
                  value={String(linea.qty)}
                  onChange={(e) =>
                    actualizar(linea.key, {
                      qty: Math.min(50, Math.max(1, Number(e.target.value.replace(/[^0-9]/g, "")) || 1)),
                    })
                  }
                  inputMode="numeric"
                  aria-label="Cantidad"
                  style={INPUT}
                />

                <button
                  onClick={() => setLineas((prev) => prev.filter((l) => l.key !== linea.key))}
                  disabled={lineas.length === 1}
                  aria-label="Quitar línea"
                  style={{ ...BOTON, color: "#8f4a2b", borderColor: "#e0b8a5" }}
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setLineas((prev) => [...prev, nuevaLinea()])}
          style={{ ...BOTON, marginTop: "10px" }}
        >
          + Añadir línea
        </button>
      </div>

      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Cliente
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={ETIQUETA}>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={INPUT} />
          </label>
          <label>
            <span style={ETIQUETA}>Correo *</span>
            <input
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              type="email"
              style={INPUT}
            />
          </label>
          <label>
            <span style={ETIQUETA}>Teléfono</span>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} style={INPUT} />
          </label>
        </div>
      </div>

      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Entrega
        </h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          {(["retiro", "despacho"] as const).map((valor) => (
            <button
              key={valor}
              onClick={() => setEntrega(valor)}
              style={{
                ...BOTON,
                background: entrega === valor ? "#2a2925" : "#fff",
                color: entrega === valor ? "#fff" : "#2a2925",
                border: entrega === valor ? "none" : "1px solid #d8d5cf",
              }}
            >
              {valor === "retiro" ? "Retiro en tienda" : "Despacho"}
            </button>
          ))}
        </div>

        {entrega === "despacho" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label>
              <span style={ETIQUETA}>Dirección</span>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle y número"
                style={INPUT}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={ETIQUETA}>Región</span>
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setComuna("");
                  }}
                  style={INPUT}
                >
                  {REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span style={ETIQUETA}>Comuna *</span>
                {esRM ? (
                  <select value={comuna} onChange={(e) => setComuna(e.target.value)} style={INPUT}>
                    <option value="">Elegir comuna…</option>
                    {COMUNAS_RM.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Comuna / ciudad"
                    style={INPUT}
                  />
                )}
              </label>
            </div>
          </div>
        )}

        <label style={{ display: "block", marginTop: "12px" }}>
          <span style={ETIQUETA}>Indicaciones internas (opcional)</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} style={INPUT} />
        </label>
      </div>

      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Descuento y total
        </h2>
        <label style={{ display: "block", maxWidth: "260px" }}>
          <span style={ETIQUETA}>Código de descuento (opcional)</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: BIENVENIDA"
            style={INPUT}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #e9e6e1",
            marginTop: "14px",
            paddingTop: "10px",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          <span>Subtotal estimado</span>
          <span>{formatCLP(subtotal)}</span>
        </div>
        <div style={{ fontSize: "12.5px", color: "#6f6c66", marginTop: "6px" }}>
          Referencia: el total definitivo lo calcula el servidor (precios del catálogo, descuento y
          envío).
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={crear}
          disabled={!puedeEnviar}
          style={{
            ...BOTON,
            background: "#2a2925",
            color: "#fff",
            border: "none",
            opacity: puedeEnviar ? 1 : 0.55,
            cursor: puedeEnviar ? "pointer" : "default",
          }}
        >
          {cargando ? "Creando…" : "Crear pedido"}
        </button>
        {error && <span style={{ fontSize: "12.5px", color: "#8f4a2b", fontWeight: 600 }}>{error}</span>}
      </div>
    </div>
  );
}
