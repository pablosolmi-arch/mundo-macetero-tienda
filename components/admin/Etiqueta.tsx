import type { EtiquetaEstado } from "../../lib/pedido-vista";

// Píldora de estado del panel (pago, preparación). Los colores vienen de
// lib/pedido-vista.ts para que la lista, el detalle y la ficha del cliente
// muestren la misma etiqueta con el mismo color.
export function Etiqueta({ texto, color, fondo }: EtiquetaEstado) {
  return (
    <span
      style={{
        background: fondo,
        color,
        fontSize: "11.5px",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {texto}
    </span>
  );
}
