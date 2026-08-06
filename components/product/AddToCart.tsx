"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";
import { HEXES } from "../../content/site";

// Buy box: price that tracks the selected variant and quantity, the variant
// selector, quantity stepper and add-to-cart button.
//
// The catalog stores one variant axis (size/finish, as imported from Shopify),
// so a single group of option buttons is rendered. Prices shown here are display
// only: /api/checkout recomputes the charged amount from the database.

export interface VariantOption {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface AddToCartProps {
  productSlug: string;
  productName: string;
  basePrice: number;
  image: string | null;
  variants: VariantOption[];
  // Label for the option group, e.g. "Tamaño".
  ejeNombre: string;
}

// Some option values name a finish; show its colour as a dot, as the design does.
function hexFor(name: string): string | null {
  const key = name.trim().toLowerCase();
  for (const [id, hex] of Object.entries(HEXES)) {
    if (key.includes(id)) return hex;
  }
  return null;
}

export function AddToCart({
  productSlug,
  productName,
  basePrice,
  image,
  variants,
  ejeNombre,
}: AddToCartProps) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = selected?.price ?? basePrice;

  // A lone "Default Title" variant is Shopify's placeholder for "no options".
  const mostrarEje =
    variants.length > 1 || (variants.length === 1 && variants[0].name !== "Default Title");

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
        <span style={{ fontSize: "24px", fontWeight: 700 }}>{formatCLP(unitPrice * qty)}</span>
      </div>
      <div style={{ fontSize: "12.5px", color: "#6f6c66", marginBottom: "22px" }}>
        Los{" "}
        <Link href="/politicas" style={{ textDecoration: "underline" }}>
          gastos de envío
        </Link>{" "}
        se calculan en la pantalla de pago.
      </div>

      {mostrarEje && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "9px" }}>{ejeNombre}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {variants.map((v) => {
              const on = v.id === variantId;
              const hex = hexFor(v.name);
              return (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    border: on ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
                    background: on ? "#2a2925" : "#fff",
                    color: on ? "#fff" : "#2a2925",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {hex && (
                    <span
                      style={{
                        width: "13px",
                        height: "13px",
                        borderRadius: "50%",
                        background: hex,
                        border: "1px solid rgba(42,41,37,.28)",
                        display: "inline-block",
                        flex: "none",
                      }}
                    />
                  )}
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", alignItems: "stretch", margin: "24px 0 10px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #d8d5cf",
            borderRadius: "9px",
            background: "#fff",
          }}
        >
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Quitar una unidad"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 16px",
              fontSize: "16px",
              color: "#2a2925",
            }}
          >
            −
          </button>
          <span style={{ fontSize: "15px", fontWeight: 600, minWidth: "26px", textAlign: "center" }}>{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Agregar una unidad"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 16px",
              fontSize: "16px",
              color: "#2a2925",
            }}
          >
            +
          </button>
        </div>
        <button
          onClick={() =>
            add(
              {
                productSlug,
                name: productName,
                variantId: selected?.id ?? null,
                variantName: selected?.name ?? null,
                unitPrice,
                image,
              },
              qty,
            )
          }
          className="mm-btn-dark"
          style={{
            flex: 1,
            minWidth: "220px",
            border: "none",
            borderRadius: "9px",
            padding: "14px 26px",
            fontSize: "14.5px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Agregar al carrito
        </button>
      </div>
      <div style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600, marginBottom: "24px" }}>
        ✓ Despacho gratis en comunas del sector oriente · Retiro en tienda disponible
      </div>
    </>
  );
}
