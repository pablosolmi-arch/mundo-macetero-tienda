"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatCLP } from "../../lib/format";

// Edición de un producto del catálogo. Todo se guarda de una sola vez con
// "Guardar cambios" (ficha + variantes + orden de la galería), menos la subida de
// una imagen nueva, que necesita ir al servidor a redimensionar y por eso se
// aplica al instante.
//
// La galería mantiene `images` y `thumbs` alineados por índice: la tira de
// miniaturas de la ficha usa thumbs[i] para mostrar images[i], así que mover o
// borrar una imagen tiene que mover o borrar su miniatura en la misma posición.

interface VarianteEditable {
  id: number;
  name: string;
  priceOverride: string | null;
  stock: number;
  available: boolean;
}

interface Props {
  slug: string;
  nombre: string;
  descripcion: string;
  precioBase: string;
  estado: string;
  trackStock: boolean;
  images: string[];
  thumbs: string[];
  optionNames: string[];
  variantes: VarianteEditable[];
}

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

const CAMPO: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "13.5px",
  background: "#fff",
  outline: "none",
  fontFamily: "inherit",
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

const BOTON_CHICO: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid #d8d5cf",
  background: "#fff",
  lineHeight: 1.4,
};

export function EditorProducto({
  slug,
  nombre,
  descripcion,
  precioBase,
  estado,
  trackStock,
  images,
  thumbs,
  optionNames,
  variantes,
}: Props) {
  const router = useRouter();

  const [ficha, setFicha] = useState({
    name: nombre,
    description: descripcion,
    // El precio se edita en pesos enteros, como se muestra en la tienda.
    basePrice: String(Math.round(Number(precioBase))),
    status: estado,
    trackStock,
  });

  const [filas, setFilas] = useState(() =>
    variantes.map((v) => ({
      id: v.id,
      name: v.name,
      precio: v.priceOverride == null ? "" : String(Math.round(Number(v.priceOverride))),
      stock: String(v.stock),
      available: v.available,
    })),
  );

  const [galeria, setGaleria] = useState({ images, thumbs });
  // Tras subir una imagen se llama a router.refresh() y este componente vuelve a
  // renderizarse con los arrays nuevos. Se resincroniza la galería solo cuando lo
  // que llega del servidor cambió, para no pisar un reordenamiento sin guardar.
  const firmaServidor = `${images.join("|")}##${thumbs.join("|")}`;
  const [firmaAplicada, setFirmaAplicada] = useState(firmaServidor);
  if (firmaAplicada !== firmaServidor) {
    setFirmaAplicada(firmaServidor);
    setGaleria({ images, thumbs });
  }

  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const archivo = useRef<HTMLInputElement>(null);

  function cambiarFila(id: number, cambio: Partial<(typeof filas)[number]>) {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambio } : f)));
  }

  function quitarImagen(i: number) {
    setGaleria((g) => ({
      images: g.images.filter((_, n) => n !== i),
      thumbs: g.thumbs.filter((_, n) => n !== i),
    }));
    setOk("");
  }

  function mover(i: number, direccion: -1 | 1) {
    const j = i + direccion;
    setGaleria((g) => {
      if (j < 0 || j >= g.images.length) return g;
      const intercambiar = (lista: string[]) => {
        if (i >= lista.length || j >= lista.length) return lista;
        const copia = [...lista];
        [copia[i], copia[j]] = [copia[j], copia[i]];
        return copia;
      };
      return { images: intercambiar(g.images), thumbs: intercambiar(g.thumbs) };
    });
    setOk("");
  }

  async function subir(file: File) {
    setSubiendo(true);
    setError("");
    setOk("");
    try {
      const datos = new FormData();
      datos.append("file", file);
      const res = await fetch(`/api/admin/productos/${slug}/imagen`, {
        method: "POST",
        body: datos,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOk("Imagen agregada.");
        router.refresh();
      } else {
        setError(data.message ?? "No se pudo subir la imagen.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = "";
    }
  }

  async function guardar() {
    setGuardando(true);
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/productos/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: {
            name: ficha.name,
            description: ficha.description,
            basePrice: Number(ficha.basePrice),
            status: ficha.status,
            trackStock: ficha.trackStock,
          },
          variantes: filas.map((f) => ({
            id: f.id,
            priceOverride: f.precio.trim() === "" ? null : Number(f.precio),
            stock: Number(f.stock || 0),
            available: f.available,
          })),
          imagenes: { images: galeria.images, thumbs: galeria.thumbs },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOk("Cambios guardados.");
        router.refresh();
      } else {
        setError(data.message ?? "No se pudieron guardar los cambios.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setGuardando(false);
    }
  }

  const base = Number(ficha.basePrice);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "18px" }}>
      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Ficha
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={ETIQUETA} htmlFor="mm-nombre">
              Nombre
            </label>
            <input
              id="mm-nombre"
              value={ficha.name}
              onChange={(e) => setFicha({ ...ficha, name: e.target.value })}
              style={CAMPO}
            />
          </div>
          <div>
            <label style={ETIQUETA} htmlFor="mm-descripcion">
              Descripción
            </label>
            <textarea
              id="mm-descripcion"
              rows={6}
              value={ficha.description}
              onChange={(e) => setFicha({ ...ficha, description: e.target.value })}
              style={{ ...CAMPO, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ minWidth: "180px" }}>
              <label style={ETIQUETA} htmlFor="mm-precio">
                Precio base
              </label>
              <input
                id="mm-precio"
                value={ficha.basePrice}
                inputMode="numeric"
                onChange={(e) => setFicha({ ...ficha, basePrice: e.target.value.replace(/[^0-9]/g, "") })}
                style={CAMPO}
              />
              <div style={{ fontSize: "12px", color: "#9b978f", marginTop: "4px" }}>
                {formatCLP(Number.isFinite(base) ? base : 0)}
              </div>
            </div>
            <div style={{ minWidth: "180px" }}>
              <label style={ETIQUETA} htmlFor="mm-estado">
                Estado
              </label>
              <select
                id="mm-estado"
                value={ficha.status}
                onChange={(e) => setFicha({ ...ficha, status: e.target.value })}
                style={CAMPO}
              >
                <option value="active">Publicado</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          </div>
          <div
            style={{
              background: "#faf9f7",
              border: "1px solid #e9e6e1",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <label style={{ display: "flex", gap: "9px", alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ficha.trackStock}
                onChange={(e) => setFicha({ ...ficha, trackStock: e.target.checked })}
                style={{ marginTop: "2px" }}
              />
              <span>
                <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Controlar inventario</span>
                <span style={{ display: "block", fontSize: "12.5px", color: "#6f6c66", marginTop: "3px" }}>
                  Al activarlo, cada venta descuenta stock de la variante y hay que cargar las
                  cantidades reales. Mientras esté apagado, manda solo la casilla “Disponible”.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Variantes
        </h2>
        {optionNames.length > 0 && (
          <div style={{ fontSize: "12.5px", color: "#9b978f", marginBottom: "10px" }}>
            Opciones: {optionNames.join(" · ")}
          </div>
        )}
        {filas.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#9b978f" }}>Este producto no tiene variantes.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Variante", "Precio", "Stock", "Disponible"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "6px 10px 8px",
                        fontWeight: 600,
                        color: "#6f6c66",
                        whiteSpace: "nowrap",
                        fontSize: "12.5px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id} style={{ borderTop: "1px solid #f0eeea" }}>
                    <td style={{ padding: "8px 10px" }}>{f.name}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <input
                        value={f.precio}
                        inputMode="numeric"
                        placeholder={String(Math.round(Number.isFinite(base) ? base : 0))}
                        onChange={(e) =>
                          cambiarFila(f.id, { precio: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        style={{ ...CAMPO, width: "110px" }}
                      />
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <input
                        value={f.stock}
                        inputMode="numeric"
                        onChange={(e) =>
                          cambiarFila(f.id, { stock: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        style={{ ...CAMPO, width: "80px" }}
                      />
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <input
                        type="checkbox"
                        checked={f.available}
                        onChange={(e) => cambiarFila(f.id, { available: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: "12.5px", color: "#9b978f", marginTop: "10px" }}>
          Precio vacío = usa el precio base del producto.
        </div>
      </div>

      <div style={TARJETA}>
        <h2 className="font-display" style={TITULO}>
          Galería
        </h2>
        {galeria.images.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#9b978f" }}>Este producto no tiene imágenes.</div>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {galeria.images.map((img, i) => (
              <div key={`${img}-${i}`} style={{ width: "120px" }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#eceae6",
                    border: i === 0 ? "1.5px solid #2a2925" : "1px solid #e3e1dc",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galeria.thumbs[i] ?? img}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div style={{ display: "flex", gap: "4px", marginTop: "6px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover antes"
                    style={{ ...BOTON_CHICO, opacity: i === 0 ? 0.4 : 1 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === galeria.images.length - 1}
                    aria-label="Mover después"
                    style={{ ...BOTON_CHICO, opacity: i === galeria.images.length - 1 ? 0.4 : 1 }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarImagen(i)}
                    aria-label="Eliminar imagen"
                    style={{ ...BOTON_CHICO, color: "#8f4a2b", borderColor: "#e0b8a5", marginLeft: "auto" }}
                  >
                    Eliminar
                  </button>
                </div>
                {i === 0 && (
                  <div style={{ fontSize: "11.5px", color: "#9b978f", marginTop: "4px" }}>Portada</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "16px", borderTop: "1px solid #f0eeea", paddingTop: "14px" }}>
          <label style={ETIQUETA} htmlFor="mm-imagen">
            Agregar imagen
          </label>
          <input
            id="mm-imagen"
            ref={archivo}
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void subir(file);
            }}
            style={{ fontSize: "13px" }}
          />
          <div style={{ fontSize: "12.5px", color: "#9b978f", marginTop: "6px" }}>
            {subiendo
              ? "Subiendo y redimensionando…"
              : "Hasta 10 MB. Se guarda una versión de 1200 px y su miniatura, y queda al final de la galería."}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || subiendo}
          style={{ ...BOTON, background: "#2a2925", color: "#fff", border: "none" }}
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {error && <span style={{ fontSize: "12.5px", color: "#8f4a2b", fontWeight: 600 }}>{error}</span>}
        {ok && <span style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600 }}>{ok}</span>}
      </div>
    </div>
  );
}
