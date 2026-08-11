"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../../components/cart/CartContext";
import { formatCLP } from "../../../lib/format";
import { montoDescuento } from "../../../lib/descuento-monto";

export default function CarritoPage() {
  const { items, subtotal, changeQty, remove, codigo, aplicarCodigo, quitarCodigo } = useCart();
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");

  const descuento = montoDescuento(subtotal, codigo);

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "40px 24px 70px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, margin: "0 0 26px" }}>
        Tu carrito
      </h1>

      {items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            border: "1px solid #e9e6e1",
            borderRadius: "14px",
          }}
        >
          <div className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>
            Tu carrito está vacío
          </div>
          <Link
            href="/tienda"
            className="mm-btn-dark"
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "13px 26px",
              borderRadius: "9px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Seguir comprando
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {items.map((it) => (
              <div
                key={`${it.productSlug}-${it.variantName ?? ""}`}
                style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid #e9e6e1" }}
              >
                <Link
                  href={`/producto/${it.productSlug}`}
                  style={{
                    width: "84px",
                    height: "84px",
                    flex: "none",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#eceae6",
                    display: "block",
                  }}
                >
                  {it.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={it.image}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                     loading="lazy" decoding="async" />
                  )}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/producto/${it.productSlug}`} style={{ fontSize: "15px", fontWeight: 600, display: "block" }}>
                    {it.name}
                  </Link>
                  {it.variantName && it.variantName !== "Default Title" && (
                    <div style={{ fontSize: "12.5px", color: "#6f6c66", marginTop: "3px" }}>{it.variantName}</div>
                  )}
                  <div style={{ fontSize: "12.5px", color: "#6f6c66", marginTop: "2px" }}>
                    {formatCLP(it.unitPrice)} c/u
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #d8d5cf",
                        borderRadius: "8px",
                        background: "#fff",
                      }}
                    >
                      <button
                        onClick={() => changeQty(it.productSlug, it.variantName, -1)}
                        aria-label="Quitar una unidad"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px 12px",
                          fontSize: "15px",
                          color: "#2a2925",
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: "14px", minWidth: "22px", textAlign: "center" }}>{it.qty}</span>
                      <button
                        onClick={() => changeQty(it.productSlug, it.variantName, 1)}
                        aria-label="Agregar una unidad"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px 12px",
                          fontSize: "15px",
                          color: "#2a2925",
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(it.productSlug, it.variantName)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        color: "#9b978f",
                        textDecoration: "underline",
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {formatCLP(it.unitPrice * it.qty)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "14px", padding: "22px" }}>
            <div className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
              Resumen
            </div>

            {codigo ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0ece5",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  marginBottom: "8px",
                  fontSize: "13px",
                }}
              >
                <span style={{ fontWeight: 700, color: "#4c7a4c" }}>✓ {codigo.codigo}</span>
                <button
                  onClick={quitarCodigo}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#9b978f",
                    textDecoration: "underline",
                  }}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setMsg("");
                    }}
                    placeholder="Código de descuento"
                    style={{
                      flex: 1,
                      padding: "11px 13px",
                      border: "1px solid #d8d5cf",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      background: "#faf9f7",
                      color: "#2a2925",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!(await aplicarCodigo(input))) setMsg("Código no válido o vencido.");
                      else setMsg("");
                    }}
                    className="mm-btn-dark"
                    style={{
                      border: "none",
                      borderRadius: "8px",
                      padding: "11px 16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Aplicar
                  </button>
                </div>
                {msg && <div style={{ fontSize: "12.5px", color: "#a5613f", marginBottom: "8px" }}>{msg}</div>}
              </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "6px 0" }}>
              <span style={{ color: "#6f6c66" }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(subtotal)}</span>
            </div>
            {descuento > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  padding: "6px 0",
                  color: "#4c7a4c",
                }}
              >
                <span>Descuento{codigo?.tipo === "porcentaje" ? ` (${codigo.valor}%)` : ""}</span>
                <span style={{ fontWeight: 600 }}>−{formatCLP(descuento)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                padding: "6px 0",
                borderBottom: "1px solid #e9e6e1",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "#6f6c66" }}>Envío</span>
              <span style={{ color: "#6f6c66", fontSize: "13px" }}>Se calcula en el checkout</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "17px",
                fontWeight: 700,
                padding: "8px 0 16px",
              }}
            >
              <span>Total parcial</span>
              <span>{formatCLP(subtotal - descuento)}</span>
            </div>

            <Link
              href="/checkout"
              className="mm-btn-dark"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px",
                borderRadius: "9px",
                fontSize: "14.5px",
                fontWeight: 700,
              }}
            >
              Pagar pedido
            </Link>
            <Link
              href="/tienda"
              className="mm-link"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#6f6c66",
              }}
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
