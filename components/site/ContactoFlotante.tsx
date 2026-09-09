"use client";

import { TIENDA } from "../../content/site";
import { clicLlamar, clicWhatsapp } from "../../lib/gtm";
import { track } from "../../lib/track";
import { linkWhatsapp } from "../../lib/whatsapp";

// Contacto flotante, presente en toda la tienda. Es UN solo grupo: la burbuja de
// WhatsApp que ya existía, más un botón para llamar.
//
// El botón de llamar está porque hay clientes que prefieren hablar antes de
// comprar, sobre todo con montos altos, y hoy no tenían cómo hacerlo sin salir
// del sitio a buscar el número. Es el MISMO número de ventas que atiende
// WhatsApp: quien llama llega a quien puede venderle.
//
// No es invasivo: en escritorio el botón está colapsado a una pastilla chica y
// solo muestra el número cuando el mouse (o el teclado) llega al grupo, porque
// llamar desde un computador significa marcar en el teléfono y lo que se
// necesita es leer el número. En el teléfono se muestra siempre, en tamaño más
// chico que WhatsApp y en blanco en vez de verde: un toque y marca.
//
// Los dos enlaces son cliente solo por la medición: se registra en el panel
// (tabla de eventos, junto al resto del embudo) y en la capa de datos de GTM.
// Ninguna de las dos puede impedir que el enlace se abra: `track` usa sendBeacon
// y el push a dataLayer es sincrónico.
const ORIGEN = "flotante";

export function ContactoFlotante() {
  return (
    <div className="mm-flotante">
      <a
        href={`tel:${TIENDA.telefonoVentas}`}
        className="mm-flotante-llamar"
        aria-label={`Llámanos al ${TIENDA.telefonoVentasTexto}`}
        onClick={() => {
          try {
            track("llamar", { campo: ORIGEN });
            clicLlamar(ORIGEN);
          } catch {
            // La medición nunca puede romper el contacto con el cliente.
          }
        }}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" fill="currentColor">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
        </svg>
        <span className="mm-flotante-fono">{TIENDA.telefonoVentasTexto}</span>
      </a>

      <a
        href={linkWhatsapp()}
        className="mm-wa-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        onClick={() => {
          try {
            track("whatsapp", { campo: ORIGEN });
            clicWhatsapp(ORIGEN);
          } catch {
            // Igual que arriba: métricas, no parte del contacto.
          }
        }}
      >
        <svg viewBox="0 0 24 24" fill="#fff" width={28} height={28} aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
