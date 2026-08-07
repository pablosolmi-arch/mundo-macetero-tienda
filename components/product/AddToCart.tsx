"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";
import { HEXES } from "../../content/site";

// Buy box: one group of buttons per option axis (size, colour, drainage…), a price
// that tracks the selected combination, quantity and add-to-cart.
//
// A variant is one sellable COMBINATION. Values that no combination can reach with
// the current selection are shown struck through and cannot be picked, so the
// customer never lands on something that does not exist.
//
// Prices here are display only: /api/checkout recomputes the charged amount from
// the database using the variant id.

export interface VariantOption {
  id: number;
  name: string;
  price: number;
  stock: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
}

interface AddToCartProps {
  productSlug: string;
  productName: string;
  basePrice: number;
  image: string | null;
  variants: VariantOption[];
  optionNames: string[];
}

const AXIS_KEYS = ["option1", "option2", "option3"] as const;

function valueOf(v: VariantOption, axis: number): string | null {
  return v[AXIS_KEYS[axis]];
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
  optionNames,
}: AddToCartProps) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  // Distinct values per axis, in the order the catalog lists them.
  const axes = useMemo(
    () =>
      optionNames.map((nombre, i) => ({
        nombre,
        valores: [...new Set(variants.map((v) => valueOf(v, i)).filter((x): x is string => !!x))],
      })),
    [optionNames, variants],
  );

  // Default to the first combination that can actually be bought.
  const initial = useMemo(() => {
    const first = variants.find((v) => v.available) ?? variants[0];
    return axes.map((_, i) => (first ? (valueOf(first, i) ?? "") : ""));
  }, [axes, variants]);

  const [seleccion, setSeleccion] = useState<string[]>(initial);

  const selected =
    variants.find((v) => axes.every((_, i) => (valueOf(v, i) ?? "") === (seleccion[i] ?? ""))) ??
    null;

  const unitPrice = selected?.price ?? basePrice;
  const agotado = selected != null && !selected.available;

  function pick(axis: number, value: string) {
    const next = [...seleccion];
    next[axis] = value;

    // If the new value makes the rest of the selection impossible, slide the other
    // axes to the first combination that works with it.
    const exists = variants.some((v) => next.every((val, i) => (valueOf(v, i) ?? "") === val));
    if (!exists) {
      const fallback =
        variants.find((v) => (valueOf(v, axis) ?? "") === value && v.available) ??
        variants.find((v) => (valueOf(v, axis) ?? "") === value);
      if (fallback) {
        for (let i = 0; i < next.length; i += 1) next[i] = valueOf(fallback, i) ?? "";
      }
    }
    setSeleccion(next);
  }

  // A value is reachable when some variant has it alongside every OTHER axis as
  // currently selected.
  function reachable(axis: number, value: string): boolean {
    return variants.some(
      (v) =>
        (valueOf(v, axis) ?? "") === value &&
        v.available &&
        seleccion.every((val, i) => i === axis || (valueOf(v, i) ?? "") === val),
    );
  }

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

      {axes.map((eje, i) => (
        <div key={eje.nombre} style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "9px" }}>{eje.nombre}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {eje.valores.map((valor) => {
              const on = seleccion[i] === valor;
              const ok = reachable(i, valor);
              const hex = hexFor(valor);
              return (
                <button
                  key={valor}
                  onClick={() => pick(i, valor)}
                  title={ok ? undefined : "Sin stock en esta combinación"}
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
                    color: on ? "#fff" : ok ? "#2a2925" : "#9b978f",
                    fontWeight: on ? 700 : 500,
                    textDecoration: ok ? "none" : "line-through",
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
                  {valor}
                </button>
              );
            })}
          </div>
        </div>
      ))}

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
          disabled={agotado}
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
          className={agotado ? undefined : "mm-btn-dark"}
          style={{
            flex: 1,
            minWidth: "220px",
            border: "none",
            borderRadius: "9px",
            padding: "14px 26px",
            fontSize: "14.5px",
            fontWeight: 700,
            cursor: agotado ? "not-allowed" : "pointer",
            background: agotado ? "#d8d5cf" : undefined,
            color: agotado ? "#6f6c66" : undefined,
          }}
        >
          {agotado ? "Sin stock en esta combinación" : "Agregar al carrito"}
        </button>
      </div>
      <div style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600, marginBottom: "24px" }}>
        ✓ Despacho gratis en comunas del sector oriente · Retiro en tienda disponible
      </div>
    </>
  );
}
