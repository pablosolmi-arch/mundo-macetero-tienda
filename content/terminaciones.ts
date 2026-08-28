// La terminación (el acabado del cemento) es una elección estándar de TODA ficha,
// no una variante del catálogo. El catálogo importado desde Shopify traía el color
// mezclado con el tamaño en el eje de opciones de cada producto, con nombres y
// valores distintos en cada uno ("Negros", "Cantera Negro", "Rústico Blanco"…), y
// solo en 14 de los 23 productos activos. Unificarla acá deja la misma pregunta,
// con las mismas cinco respuestas, en las 23 fichas, sin reestructurar las 320
// variantes ni tocar precios: el eje de color del producto se oculta y la
// terminación viaja aparte, con la línea del carrito y del pedido.

// Los cuatro acabados que el taller fabrica hoy.
export const TERMINACIONES = ["Cemento Natural", "Negro", "Beige", "Cemento Blanco"] as const;

// Quien todavía no la decide no queda bloqueado: el equipo la confirma con el
// cliente al preparar el pedido. Se guarda con este texto exacto, así el panel
// puede avisar que falta antes de fabricar.
export const TERMINACION_PENDIENTE = "Decidir más tarde";

// Muestra de color de cada chip. Aparte de HEXES de content/site.ts: esos tonos
// describen el material en las fichas de guía, acá se necesita el acabado real.
export const HEX_TERMINACION: Record<string, string> = {
  "Cemento Natural": "#cfc9bd",
  Negro: "#2b2b2b",
  Beige: "#d9c9ad",
  "Cemento Blanco": "#ebe9e4",
};

export type Terminacion = (typeof TERMINACIONES)[number] | typeof TERMINACION_PENDIENTE;

// Nombres de eje en products.option_names que hoy representan el color del
// producto: son los que el selector de variantes deja de mostrar porque la
// terminación los reemplaza. "Tamaño y Color" (macetero-ri) queda fuera a
// propósito: ese eje también carga la medida, y ocultarlo dejaría al cliente sin
// poder elegir el tamaño.
export const EJES_DE_COLOR = ["Color", "Terminación"];

export function esEjeDeColor(nombreEje: string): boolean {
  const clave = nombreEje.trim().toLowerCase();
  return EJES_DE_COLOR.some((eje) => eje.toLowerCase() === clave);
}

// Válido = uno de los cuatro acabados o el "decidir más tarde". El checkout no
// puede confiar en el carrito (vive en localStorage, editable por el cliente), así
// que lo que llegue se valida contra esta lista antes de guardarlo.
export function esTerminacionValida(valor: unknown): valor is Terminacion {
  if (typeof valor !== "string") return false;
  const t = valor.trim();
  return t === TERMINACION_PENDIENTE || TERMINACIONES.some((x) => x === t);
}

// Lo que llega del cliente, dejado en un valor guardable. Una línea sin
// terminación (carrito guardado antes de esta función) o con un valor que no
// existe se toma como pendiente en vez de rechazar la compra: la terminación no
// afecta el precio y el equipo la confirma igual antes de fabricar.
export function normalizarTerminacion(valor: unknown): Terminacion {
  return esTerminacionValida(valor) ? (valor.trim() as Terminacion) : TERMINACION_PENDIENTE;
}

// La terminación se concatena al nombre de la variante guardado en el pedido para
// que el correo al cliente, la hoja de impresión y el panel la muestren sin
// cambios: todos imprimen `variantName` por línea. La columna
// order_items.terminacion guarda el dato limpio para consultarlo.
export function nombreVarianteConTerminacion(
  variantName: string | null,
  terminacion: string,
): string {
  const base = (variantName ?? "").trim();
  const etiqueta = `Terminación: ${terminacion}`;
  // "Default Title" es lo que trae el catálogo cuando el producto se vende en una
  // sola configuración; arrastrarlo delante de la terminación no dice nada.
  if (!base || base === "Default Title") return etiqueta;
  return `${base} · ${etiqueta}`;
}

// Inverso de nombreVarianteConTerminacion. Al retomar un pedido pendiente hay que
// volver a armar la línea del carrito, y sin esto la etiqueta quedaría pegada al
// nombre de la variante y además repetida bajo ella.
export function varianteSinTerminacion(
  variantName: string | null,
  terminacion: string | null,
): string | null {
  const base = (variantName ?? "").trim();
  if (!base) return null;
  const t = (terminacion ?? "").trim();
  if (!t) return base;
  const etiqueta = `Terminación: ${t}`;
  if (base === etiqueta) return null;
  if (base.endsWith(` · ${etiqueta}`)) return base.slice(0, base.length - etiqueta.length - 3);
  return base;
}

export function esPendiente(terminacion: string | null | undefined): boolean {
  return (terminacion ?? "").trim() === TERMINACION_PENDIENTE;
}
