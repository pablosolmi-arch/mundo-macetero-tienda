"use client";

import { createElement, useEffect } from "react";

// Feed de Instagram servido por Behold. El widget es un custom element que se
// define desde un script de módulo externo, así que el componente solo lo
// monta y se asegura de cargar el script una única vez por página: Behold
// registra el elemento globalmente y un segundo <script> lo haría fallar.

const FEED_ID = "UikLds6OZbsYzqPuNgNU";
const SCRIPT_SRC = "https://w.behold.so/widget.js";

// Marca en window para que dos instancias del componente (portada y /instagram)
// no inserten el script dos veces.
declare global {
  interface Window {
    __mmBeholdCargado?: boolean;
  }
}

export function InstagramFeed({ minHeight = 240 }: { minHeight?: number }) {
  useEffect(() => {
    if (window.__mmBeholdCargado) return;
    window.__mmBeholdCargado = true;
    const script = document.createElement("script");
    script.type = "module";
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // El widget se dibuja en el cliente: el contenedor reserva alto para que la
  // página no salte cuando llegan las fotos.
  return (
    <div style={{ minHeight: `${minHeight}px` }}>
      {createElement("behold-widget", { "feed-id": FEED_ID })}
    </div>
  );
}
