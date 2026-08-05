"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../../components/cart/CartContext";
import { formatCLP } from "../../lib/format";

export default function CheckoutPage() {
  const { items, subtotal, count } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      // Send only identifiers + quantity — the server recomputes the price
      // from the database. unitPrice never leaves the cart's local display.
      const checkoutItems = items.map((it) => ({
        productSlug: it.productSlug,
        variantId: it.variantId,
        qty: it.qty,
      }));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems, customer: form }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setStatus("error");
      setMessage(data.message ?? "No se pudo iniciar el pago.");
    } catch {
      setStatus("error");
      setMessage("No se pudo conectar con el servicio de pago.");
    }
  }

  if (count === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Tu carrito está vacío</h1>
        <Link href="/tienda" className="mt-6 inline-block rounded-md bg-ink px-6 py-3 text-sm text-white">
          Ver la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Finalizar compra</h1>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Form */}
        <form onSubmit={pay} className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Tus datos</h2>
          {(
            [
              ["name", "Nombre completo", "text"],
              ["email", "Correo", "email"],
              ["phone", "Teléfono", "tel"],
              ["address", "Dirección", "text"],
              ["city", "Comuna / Ciudad", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm text-muted">{label}</span>
              <input
                required
                type={type}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-ink"
              />
            </label>
          ))}

          {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-ink py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? "Redirigiendo al pago..." : `Pagar con Flow · ${formatCLP(subtotal)}`}
          </button>
          <p className="text-center text-xs text-muted">Pago seguro procesado por Flow.</p>
        </form>

        {/* Summary */}
        <div className="rounded-xl border border-line p-6">
          <h2 className="font-display text-lg font-semibold">Tu pedido</h2>
          <ul className="mt-4 divide-y divide-line">
            {items.map((it) => (
              <li key={`${it.productSlug}-${it.variantName ?? ""}`} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {it.name}
                  {it.variantName && it.variantName !== "Default Title" ? ` · ${it.variantName}` : ""}
                  <span className="text-muted"> × {it.qty}</span>
                </span>
                <span className="whitespace-nowrap">{formatCLP(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span className="text-muted">Subtotal</span>
            <span className="font-display text-lg font-semibold">{formatCLP(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">El envío se calcula según tu dirección.</p>
        </div>
      </div>
    </main>
  );
}
