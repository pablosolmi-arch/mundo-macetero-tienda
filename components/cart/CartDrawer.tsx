"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { formatCLP } from "../../lib/format";

// Slide-over cart, ported from the design. The design used striped placeholders
// for thumbnails; here the real catalog image is used instead.
export function CartDrawer() {
  const { isOpen, close, justAdded, items, subtotal, changeQty, remove } = useCart();

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div
        onClick={close}
        style={{ position: "absolute", inset: 0, background: "rgba(30,28,24,.5)", animation: "mmFade .2s" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px,100vw)",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          animation: "mmSlide .25s ease",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #e9e6e1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {justAdded && (
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#4c7a4c", marginBottom: "2px" }}>
                ✓ Artículo agregado a tu carrito
              </div>
            )}
            <div className="font-display" style={{ fontWeight: 600, fontSize: "17px" }}>
              Tu carrito
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            style={{ background: "none", border: "none", fontSize: "19px", cursor: "pointer", color: "#6f6c66" }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 22px" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "46px 10px", color: "#6f6c66" }}>
              <div
                className="font-display"
                style={{ fontSize: "16px", fontWeight: 600, color: "#2a2925", marginBottom: "8px" }}
              >
                Tu carrito está vacío
              </div>
              <Link
                href="/tienda"
                onClick={close}
                className="mm-btn-dark"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                Seguir comprando
              </Link>
            </div>
          )}

          {items.map((it) => (
            <div
              key={`${it.productSlug}-${it.variantName ?? ""}`}
              style={{ display: "flex", gap: "14px", padding: "13px 0", borderBottom: "1px solid #efede9" }}
            >
              <Link
                href={`/producto/${it.productSlug}`}
                onClick={close}
                style={{
                  width: "64px",
                  height: "64px",
                  flex: "none",
                  borderRadius: "8px",
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
                <Link
                  href={`/producto/${it.productSlug}`}
                  onClick={close}
                  style={{ fontSize: "14px", fontWeight: 600, display: "block" }}
                >
                  {it.name}
                </Link>
                {it.variantName && it.variantName !== "Default Title" && (
                  <div style={{ fontSize: "12px", color: "#6f6c66", marginTop: "2px" }}>{it.variantName}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      border: "1px solid #d8d5cf",
                      borderRadius: "7px",
                    }}
                  >
                    <button
                      onClick={() => changeQty(it.productSlug, it.variantName, -1)}
                      aria-label="Quitar una unidad"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 10px",
                        fontSize: "14px",
                        color: "#2a2925",
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "13px", minWidth: "18px", textAlign: "center" }}>{it.qty}</span>
                    <button
                      onClick={() => changeQty(it.productSlug, it.variantName, 1)}
                      aria-label="Agregar una unidad"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 10px",
                        fontSize: "14px",
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
                      fontSize: "12px",
                      color: "#9b978f",
                      textDecoration: "underline",
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatCLP(it.unitPrice * it.qty)}
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ padding: "16px 22px 20px", borderTop: "1px solid #e9e6e1", background: "#faf9f7" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCLP(subtotal)}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#6f6c66", marginBottom: "14px" }}>
              Envío y descuentos se calculan en la pantalla de pago.
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="mm-btn-dark"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px",
                borderRadius: "9px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Pagar pedido
            </Link>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <Link
                href="/carrito"
                onClick={close}
                className="mm-btn-outline"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "11px",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Ver carrito
              </Link>
              <button
                onClick={close}
                style={{
                  flex: 1,
                  background: "none",
                  border: "1px solid #d8d5cf",
                  padding: "11px",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#6f6c66",
                }}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
