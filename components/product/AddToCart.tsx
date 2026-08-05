"use client";

import { useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";

export interface VariantOption {
  id: number;
  name: string;
  price: number; // CLP integer (priceOverride, or basePrice)
}

interface Props {
  productSlug: string;
  productName: string;
  basePrice: number;
  image: string | null;
  variants: VariantOption[];
}

// Client-side buy box: size/variant pills that update the displayed price, a
// quantity stepper, and add-to-cart / buy-now actions. Selecting a variant
// updates the price shown, matching the live Shopify storefront behaviour.
export function AddToCart({ productSlug, productName, basePrice, image, variants }: Props) {
  const cart = useCart();
  const selectable = variants.filter((v) => v.name && v.name !== "Default Title");
  const [selected, setSelected] = useState<VariantOption | null>(
    selectable.length > 0 ? selectable[0] : null
  );
  const [qty, setQty] = useState(1);

  const unitPrice = selected ? selected.price : basePrice;

  function addToCart() {
    cart.add(
      {
        productSlug,
        name: productName,
        variantId: selected ? selected.id : null,
        variantName: selected ? selected.name : null,
        unitPrice,
        image,
      },
      qty
    );
    cart.open();
  }

  return (
    <div>
      <p className="font-display text-3xl font-semibold">{formatCLP(unitPrice)}</p>
      <p className="mt-1 text-sm text-muted">Los gastos de envío se calculan al pagar.</p>

      {selectable.length > 0 && (
        <div className="mt-6">
          <span className="text-sm font-medium">Tamaño</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectable.map((v) => {
              const active = selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected(v)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-foreground hover:border-ink"
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-medium">Cantidad</span>
        <div className="inline-flex items-center rounded-md border border-line">
          <button type="button" className="px-3 py-2 text-muted hover:text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar">−</button>
          <span className="min-w-8 text-center text-sm">{qty}</span>
          <button type="button" className="px-3 py-2 text-muted hover:text-ink" onClick={() => setQty((q) => q + 1)} aria-label="Sumar">+</button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={addToCart}
          className="w-full rounded-md border border-ink bg-white py-3 text-sm font-medium text-ink transition-colors hover:bg-neutral-50"
        >
          Agregar al carrito
        </button>
        <button
          type="button"
          onClick={() => {
            addToCart();
          }}
          className="w-full rounded-md bg-ink py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Comprar ahora
        </button>
      </div>
    </div>
  );
}
