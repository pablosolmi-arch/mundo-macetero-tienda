"use client";

import { clicWhatsapp } from "../../lib/gtm";
import { track } from "../../lib/track";
import { linkWhatsapp, type ContextoWhatsapp } from "../../lib/whatsapp";
import type { OrigenContacto } from "../../lib/eventos-checkout";

// Enlace de WhatsApp con contexto, medido. Existe para no repetir en cada
// pantalla el par "armar el mensaje + registrar el clic": el número, el formato
// del mensaje y los dos eventos viven en un solo lugar.
//
// No es un botón flotante nuevo: el flotante sigue siendo uno solo
// (components/site/ContactoFlotante.tsx). Esto es el enlace en línea que se pone
// donde nace la duda.
interface Props {
  origen: OrigenContacto;
  contexto?: ContextoWhatsapp;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function EnlaceWhatsapp({ origen, contexto, children, style, className }: Props) {
  return (
    <a
      href={linkWhatsapp(contexto)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => {
        try {
          track("whatsapp", { campo: origen });
          clicWhatsapp(origen);
        } catch {
          // La medición nunca puede romper el contacto con el cliente.
        }
      }}
    >
      {children}
    </a>
  );
}
