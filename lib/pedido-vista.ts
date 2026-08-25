// Presentación de un pedido en el panel: etiquetas de estado, resumen de
// artículos para la fila de la lista y nombres legibles del origen de la visita.
// Todo acá es lógica pura (sin base ni React) para que la lista, el detalle, la
// hoja de impresión y la ficha del cliente muestren siempre lo mismo.

export interface EtiquetaEstado {
  texto: string;
  color: string;
  fondo: string;
}

// Estado del pago (orders.status).
export const ESTADO_PAGO: Record<string, EtiquetaEstado> = {
  paid: { texto: "Pagado", color: "#2f5d2f", fondo: "#e7f0e7" },
  pending: { texto: "Pendiente", color: "#8a6a2b", fondo: "#f6efdf" },
  rejected: { texto: "Rechazado", color: "#8f4a2b", fondo: "#f7e8e2" },
  annulled: { texto: "Anulado", color: "#6f6c66", fondo: "#efede9" },
};

export function etiquetaPago(status: string): EtiquetaEstado {
  return ESTADO_PAGO[status] ?? { texto: status, color: "#6f6c66", fondo: "#efede9" };
}

// Estado logístico (orders.fulfillment): por preparar → preparado → entregado.
export const PREPARACION: Record<string, EtiquetaEstado> = {
  pendiente: { texto: "Por preparar", color: "#8a6a2b", fondo: "#f6efdf" },
  preparado: { texto: "Preparado", color: "#a5613f", fondo: "#f5e9e1" },
  entregado: { texto: "Entregado", color: "#2f5d2f", fondo: "#e7f0e7" },
  cancelado: { texto: "Cancelado", color: "#8f4a2b", fondo: "#f7e8e2" },
};

export function etiquetaPreparacion(fulfillment: string): EtiquetaEstado {
  return PREPARACION[fulfillment] ?? PREPARACION.pendiente;
}

// Los dos estados que todavía cuentan como "no entregado" para el equipo.
export const SIN_ENTREGAR = ["pendiente", "preparado"] as const;

// Tipos de la bitácora, tal como se guardan en order_events.tipo.
export const TIPO_EVENTO: Record<string, string> = {
  preparado: "Preparado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  reembolso_fallido: "Reembolso fallido",
  nota: "Nota",
  correo: "Correo",
  "correo-carrito": "Correo de carrito",
  pago: "Pago",
};

export function nombreEvento(tipo: string): string {
  return TIPO_EVENTO[tipo] ?? tipo;
}

// --- Resumen de artículos de la fila ---

export interface ArticuloPedido {
  productName: string;
  variantName: string | null;
  qty: number;
}

// "Default Title" es lo que trae el catálogo cuando el producto se vende en una
// sola configuración: mostrarlo no le dice nada a nadie.
const VARIANTE_VACIA = "Default Title";
const LARGO_VARIANTE = 26;

function varianteCorta(variantName: string | null): string {
  const texto = (variantName ?? "").trim();
  if (!texto || texto === VARIANTE_VACIA) return "";
  return texto.length > LARGO_VARIANTE ? `${texto.slice(0, LARGO_VARIANTE - 1)}…` : texto;
}

// "Macetero Bowl (Negro) × 2". La variante va entre paréntesis para que no se
// confunda con el " · " que separa un artículo del siguiente.
export function lineaArticulo(item: ArticuloPedido): string {
  const variante = varianteCorta(item.variantName);
  return `${item.productName}${variante ? ` (${variante})` : ""} × ${item.qty}`;
}

export interface ResumenArticulos {
  // Las primeras `max` líneas, que son las que se pintan en la celda.
  visibles: string[];
  // Cuántas quedaron fuera, para el "+N más".
  extra: number;
  // Todas las líneas, una por fila: va en el atributo title de la celda.
  completo: string;
}

export function resumenArticulos(items: ArticuloPedido[], max = 2): ResumenArticulos {
  const lineas = items.map(lineaArticulo);
  return {
    visibles: lineas.slice(0, max),
    extra: Math.max(0, lineas.length - max),
    completo: lineas.join("\n"),
  };
}

// --- Origen de la visita que compró ---

export const NOMBRE_CANAL: Record<string, string> = {
  directo: "Visita directa",
  busqueda: "Búsqueda (Google)",
  social: "Redes sociales",
  pagado: "Publicidad pagada",
  referido: "Sitio referente",
  correo: "Correo",
};

export function nombreCanal(canal: string | null | undefined): string {
  const clave = (canal ?? "").trim();
  if (!clave) return "";
  return NOMBRE_CANAL[clave] ?? clave;
}

export interface Origen {
  origenCanal: string | null;
  origenFuente: string | null;
  origenCampana: string | null;
}

// "Búsqueda (Google) · google · verano" con las partes que existan, o el aviso de
// que ese pedido se creó antes de que se midiera el origen (o a mano en el panel).
export function textoOrigen(origen: Origen): string {
  const partes = [
    nombreCanal(origen.origenCanal),
    (origen.origenFuente ?? "").trim(),
    (origen.origenCampana ?? "").trim(),
  ].filter((p) => p !== "");
  return partes.length > 0 ? partes.join(" · ") : "Sin datos de origen";
}
