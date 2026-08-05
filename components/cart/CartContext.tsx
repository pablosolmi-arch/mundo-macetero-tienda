"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productSlug: string;
  name: string;
  variantId: number | null;
  variantName: string | null;
  unitPrice: number; // CLP integer — DISPLAY ONLY. The checkout API recomputes
  // the real price server-side from productSlug/variantId; never trust this
  // field for payment amounts (it lives in localStorage, fully client-editable).
  image: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productSlug: string, variantName: string | null) => void;
  setQty: (productSlug: string, variantName: string | null, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  count: number;
  subtotal: number;
}

const CartCtx = createContext<CartState | null>(null);
const STORAGE_KEY = "mm-cart-v1";

function sameLine(a: CartItem, slug: string, variant: string | null) {
  return a.productSlug === slug && (a.variantName ?? null) === (variant ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't clobber stored cart with []).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const api = useMemo<CartState>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    return {
      items,
      isOpen,
      count,
      subtotal,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const idx = prev.findIndex((p) => sameLine(p, item.productSlug, item.variantName ?? null));
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...prev, { ...item, variantName: item.variantName ?? null, qty }];
        }),
      remove: (slug, variant) =>
        setItems((prev) => prev.filter((p) => !sameLine(p, slug, variant))),
      setQty: (slug, variant, qty) =>
        setItems((prev) =>
          prev
            .map((p) => (sameLine(p, slug, variant) ? { ...p, qty: Math.max(0, qty) } : p))
            .filter((p) => p.qty > 0)
        ),
      clear: () => setItems([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [items, isOpen]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
