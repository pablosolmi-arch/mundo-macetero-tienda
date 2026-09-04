// Capa de datos para Google Tag Manager (contenedor GTM-MZWCV65, administrado
// por la agencia de Google Ads). Aquí solo se empujan eventos de comercio
// electrónico con el formato estándar GA4; la configuración de etiquetas,
// disparadores y conversiones vive dentro de GTM.
//
// REGLA: nunca se empuja información personal del comprador. Ni nombre, ni
// correo, ni teléfono, ni dirección. El evento de compra lleva la referencia del
// pedido y los montos, que es lo que Ads necesita para atribuir la conversión.

export const GTM_ID = "GTM-MZWCV65";

export type ItemGA4 = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

type Evento = {
  event: string;
  ecommerce: {
    currency: "CLP";
    value: number;
    transaction_id?: string;
    items: ItemGA4[];
  };
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Empuja un evento a la capa de datos. No hace nada en el servidor ni si GTM
 * todavía no cargó su script: el array se crea igual y GTM lo procesa al
 * arrancar, así que ningún evento temprano se pierde.
 */
export function empujar(evento: Evento): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  // GA4 pide limpiar el objeto anterior antes de cada evento de comercio: si no,
  // el siguiente hereda los items del anterior y las conversiones se inflan.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(evento);
}

export function verProducto(item: ItemGA4): void {
  empujar({ event: "view_item", ecommerce: { currency: "CLP", value: item.price * item.quantity, items: [item] } });
}

export function agregarAlCarro(item: ItemGA4): void {
  empujar({ event: "add_to_cart", ecommerce: { currency: "CLP", value: item.price * item.quantity, items: [item] } });
}

export function iniciarCheckout(items: ItemGA4[], total: number): void {
  empujar({ event: "begin_checkout", ecommerce: { currency: "CLP", value: total, items } });
}

/**
 * Eventos que no son de comercio: no llevan `ecommerce` ni limpian el objeto
 * anterior, porque no tienen items ni valor de conversión. GTM los recibe por
 * nombre y la agencia decide adentro si alguno se marca como conversión.
 */
export function empujarSimple(evento: string, datos?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: evento, ...datos });
}

/** Clic en un botón de WhatsApp. `origen` dice desde dónde se apretó. */
export function clicWhatsapp(origen: string): void {
  empujarSimple("click_whatsapp", { origen });
}

export function compra(referencia: string, total: number, items: ItemGA4[]): void {
  empujar({
    event: "purchase",
    ecommerce: { currency: "CLP", value: total, transaction_id: referencia, items },
  });
}
