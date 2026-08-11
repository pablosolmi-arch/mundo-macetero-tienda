// Parte PURA de los descuentos, sin base de datos, importable desde componentes
// de cliente (el carrito la usa para pintar el descuento). La validación real
// contra la tabla vive en lib/descuentos.ts, solo para el servidor.

export interface DescuentoAplicable {
  codigo: string;
  tipo: "porcentaje" | "monto";
  valor: number;
}

// Monto en pesos que descuenta un código sobre un subtotal.
export function montoDescuento(subtotal: number, d: DescuentoAplicable | null): number {
  if (!d || subtotal <= 0) return 0;
  if (d.tipo === "monto") return Math.min(Math.round(d.valor), subtotal);
  return Math.round((subtotal * d.valor) / 100);
}
