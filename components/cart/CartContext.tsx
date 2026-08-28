"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { track } from "../../lib/track";

export interface CartItem {
  productSlug: string;
  name: string;
  variantId: number | null;
  variantName: string | null;
  // Acabado elegido en la ficha: uno de content/terminaciones.ts o "Decidir más
  // tarde". Opcional porque los carritos guardados antes de que existiera la
  // pregunta siguen en localStorage; el checkout los toma como pendientes.
  terminacion?: string | null;
  unitPrice: number; // CLP integer — DISPLAY ONLY. The checkout API recomputes
  // the real price server-side from productSlug/variantId; never trust this
  // field for payment amounts (it lives in localStorage, fully client-editable).
  image: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // True right after an add, so the drawer can show its confirmation banner.
  justAdded: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  // La terminación entra en la identidad de la línea: el mismo macetero en negro y
  // en cemento natural son dos cosas distintas para el taller.
  remove: (productSlug: string, variantName: string | null, terminacion: string | null) => void;
  setQty: (
    productSlug: string,
    variantName: string | null,
    terminacion: string | null,
    qty: number,
  ) => void;
  changeQty: (
    productSlug: string,
    variantName: string | null,
    terminacion: string | null,
    delta: number,
  ) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  count: number;
  subtotal: number;
  // Código aplicado con su tipo y valor, para pintar el descuento. El servidor
  // lo vuelve a validar contra la tabla al cobrar; esto es solo visual.
  codigo: { codigo: string; tipo: "porcentaje" | "monto"; valor: number } | null;
  aplicarCodigo: (codigo: string) => Promise<boolean>;
  quitarCodigo: () => void;
}

const CartCtx = createContext<CartState | null>(null);
const STORAGE_KEY = "mm-cart-v1";

function sameLine(a: CartItem, slug: string, variant: string | null, terminacion: string | null) {
  return (
    a.productSlug === slug &&
    (a.variantName ?? null) === (variant ?? null) &&
    (a.terminacion ?? null) === (terminacion ?? null)
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [codigo, setCodigo] = useState<{ codigo: string; tipo: "porcentaje" | "monto"; valor: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount. Carts saved before the discount code
  // existed were a bare array, so both shapes are accepted.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else if (parsed && Array.isArray(parsed.items)) {
          setItems(parsed.items);
          // Carritos antiguos guardaban el código como string; se descarta y el
          // cliente lo vuelve a aplicar (la validación vive en el servidor).
          if (parsed.codigo && typeof parsed.codigo === "object" && parsed.codigo.codigo) {
            setCodigo(parsed.codigo);
          }
        }
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't clobber stored cart with []).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, codigo }));
    } catch {
      // ignore quota errors
    }
  }, [items, codigo, hydrated]);

  const api = useMemo<CartState>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    return {
      items,
      isOpen,
      justAdded,
      count,
      subtotal,
      codigo,
      add: (item, qty = 1) => {
        setItems((prev) => {
          const idx = prev.findIndex((p) =>
            sameLine(p, item.productSlug, item.variantName ?? null, item.terminacion ?? null),
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [
            ...prev,
            {
              ...item,
              variantName: item.variantName ?? null,
              terminacion: item.terminacion ?? null,
              qty,
            },
          ];
        });
        setIsOpen(true);
        setJustAdded(true);
        track("agregar", { productSlug: item.productSlug });
      },
      remove: (slug, variant, terminacion) =>
        setItems((prev) => prev.filter((p) => !sameLine(p, slug, variant, terminacion))),
      setQty: (slug, variant, terminacion, qty) =>
        setItems((prev) =>
          prev
            .map((p) =>
              sameLine(p, slug, variant, terminacion) ? { ...p, qty: Math.max(0, qty) } : p,
            )
            .filter((p) => p.qty > 0),
        ),
      changeQty: (slug, variant, terminacion, delta) =>
        setItems((prev) =>
          prev.map((p) =>
            sameLine(p, slug, variant, terminacion) ? { ...p, qty: Math.max(1, p.qty + delta) } : p,
          ),
        ),
      clear: () => {
        setItems([]);
        setCodigo(null);
      },
      open: () => {
        setIsOpen(true);
        setJustAdded(false);
      },
      close: () => {
        setIsOpen(false);
        setJustAdded(false);
      },
      aplicarCodigo: async (value: string) => {
        try {
          const res = await fetch("/api/descuento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo: value }),
          });
          const data = await res.json();
          if (!data.valido) return false;
          setCodigo({ codigo: data.codigo, tipo: data.tipo, valor: data.valor });
          return true;
        } catch {
          return false;
        }
      },
      quitarCodigo: () => setCodigo(null),
    };
  }, [items, isOpen, justAdded, codigo]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
