"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./CartContext";

// Restaura en el navegador el carrito de un pedido pendiente y manda al checkout.
// El carrito vive en localStorage, así que esto solo se puede hacer del lado del
// cliente; la página /retomar/[commerceOrder] ya resolvió las líneas contra el
// catálogo. Vive dentro del layout (tienda), que provee el CartProvider.
export function RetomarCarrito({ items }: { items: CartItem[] }) {
  const { add, clear, close } = useCart();
  const router = useRouter();
  // El efecto debe correr UNA sola vez: el propio add cambia el contexto y, sin
  // este guardia, una segunda pasada duplicaría todas las cantidades.
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    // Se reemplaza el carrito en vez de sumarse a él: el cliente viene a retomar
    // este pedido, y mezclarlo con lo que hubiera quedado antes le cobraría cosas
    // que no pidió.
    clear();
    for (const item of items) {
      const { qty, ...linea } = item;
      add(linea, qty);
    }
    // add abre el cajón del carrito; aquí estorba, porque el destino es el checkout.
    close();
    router.replace("/checkout");
    // Dependencias omitidas a propósito: es un efecto de una sola pasada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "100px 24px 120px",
        textAlign: "center",
        color: "#6f6c66",
        fontSize: "15px",
      }}
    >
      Restaurando tu carrito…
    </div>
  );
}
