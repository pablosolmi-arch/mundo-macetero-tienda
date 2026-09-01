"use client";

import { useEffect, useRef } from "react";
import { compra, iniciarCheckout, verProducto, type ItemGA4 } from "../../lib/gtm";

// Componentes que empujan un evento de comercio a la capa de datos cuando la
// página se muestra. Son "use client" porque el dataLayer vive en el navegador,
// pero reciben los datos ya calculados en el servidor, para que el valor de la
// conversión venga de la base y no de lo que tenga el cliente en localStorage.
//
// El `useRef` evita el doble envío: en desarrollo React monta dos veces cada
// efecto, y sin el guardia una compra se contaría dos veces en Ads.

export function VerProducto({ item }: { item: ItemGA4 }) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    verProducto(item);
  }, [item]);
  return null;
}

export function IniciarCheckout({ items, total }: { items: ItemGA4[]; total: number }) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current || items.length === 0) return;
    enviado.current = true;
    iniciarCheckout(items, total);
  }, [items, total]);
  return null;
}

export function Compra({
  referencia,
  total,
  items,
}: {
  referencia: string;
  total: number;
  items: ItemGA4[];
}) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    // Una recarga de la página de confirmación no debe volver a contar la venta:
    // se marca la referencia del pedido como ya reportada en este navegador.
    const clave = `mm-compra-${referencia}`;
    try {
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch {
      // Navegador sin sessionStorage (modo privado estricto): se envía igual,
      // es preferible un duplicado ocasional a perder la conversión.
    }
    enviado.current = true;
    compra(referencia, total, items);
  }, [referencia, total, items]);
  return null;
}
