"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "../../lib/track";

// Registra una visita por cada cambio de ruta, y la distingue cuando es una ficha
// de producto para poder medir el paso "vio la ficha" del embudo.
export function Tracker() {
  const pathname = usePathname();
  const anterior = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || anterior.current === pathname) return;
    anterior.current = pathname;

    const producto = pathname.startsWith("/producto/") ? pathname.split("/")[2] : null;
    track(producto ? "producto" : "visita", { path: pathname, productSlug: producto ?? undefined });
  }, [pathname]);

  return null;
}
