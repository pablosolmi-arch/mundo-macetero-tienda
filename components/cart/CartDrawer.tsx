"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { formatCLP } from "../../lib/format";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, count } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Carrito de compra"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Tu carrito ({count})</h2>
          <button type="button" onClick={close} aria-label="Cerrar" className="text-2xl leading-none text-muted hover:text-ink">
            &times;
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-muted">Tu carrito está vacío.</p>
            <Link href="/tienda" onClick={close} className="rounded-md bg-ink px-5 py-2 text-sm text-white">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((it) => (
                <li key={`${it.productSlug}-${it.variantName ?? ""}`} className="flex gap-3 py-4">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="h-20 w-20 shrink-0 rounded-md object-cover" />
                  )}
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{it.name}</span>
                    {it.variantName && it.variantName !== "Default Title" && (
                      <span className="text-sm text-muted">{it.variantName}</span>
                    )}
                    <span className="mt-1 text-sm">{formatCLP(it.unitPrice)}</span>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex items-center rounded-md border border-line">
                        <button className="px-2 py-1 text-muted hover:text-ink" onClick={() => setQty(it.productSlug, it.variantName, it.qty - 1)} aria-label="Restar">−</button>
                        <span className="min-w-6 text-center text-sm">{it.qty}</span>
                        <button className="px-2 py-1 text-muted hover:text-ink" onClick={() => setQty(it.productSlug, it.variantName, it.qty + 1)} aria-label="Sumar">+</button>
                      </div>
                      <button className="text-xs text-muted underline hover:text-ink" onClick={() => remove(it.productSlug, it.variantName)}>
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-display text-lg font-semibold">{formatCLP(subtotal)}</span>
              </div>
              <p className="mb-3 text-xs text-muted">El envío se calcula en el pago.</p>
              <Link
                href="/checkout"
                onClick={close}
                className="block w-full rounded-md bg-ink py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Ir a pagar
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
