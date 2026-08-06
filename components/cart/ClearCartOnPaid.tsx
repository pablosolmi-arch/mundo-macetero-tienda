"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

// The cart is emptied only once the order is confirmed as paid, so a customer who
// abandons or fails a payment comes back to a cart that still has their items.
export function ClearCartOnPaid() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // `clear` is stable enough for this one-shot effect; re-running it would only
    // clear an already-empty cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
