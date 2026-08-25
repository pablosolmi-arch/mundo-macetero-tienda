// Código humano del pedido: "#7-25/08" = correlativo + día/mes de creación,
// en hora de Chile. commerceOrder (MM-<ts>-<hex>) sigue siendo la clave técnica
// que viaja a la pasarela; este código es el que ve el equipo y el cliente.

const ZONA = "America/Santiago";

export function codigoPedido(numero: number | null | undefined, createdAt: Date): string {
  const partes = new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(createdAt);
  // El relleno con cero se hace acá: pidiendo solo día y mes, el ICU de Node
  // resuelve el patrón de es-CL a "d/M" y devuelve "5/1" en lugar de "05/01",
  // así que `2-digit` no alcanza para garantizar el formato dd/mm.
  const dia = (partes.find((p) => p.type === "day")?.value ?? "0").padStart(2, "0");
  const mes = (partes.find((p) => p.type === "month")?.value ?? "0").padStart(2, "0");
  // Pedidos anteriores a la numeración (sin correlativo) muestran solo la fecha.
  return numero != null ? `#${numero}-${dia}/${mes}` : `#—-${dia}/${mes}`;
}

// Acepta lo que alguien escribe en el buscador ("#7", "7", "#7-25/08") y
// devuelve el correlativo, o null si no parece un código de pedido.
export function parseCodigoPedido(texto: string): number | null {
  const m = texto.trim().match(/^#?(\d+)(?:-\d{1,2}\/\d{1,2})?$/);
  return m ? Number(m[1]) : null;
}
