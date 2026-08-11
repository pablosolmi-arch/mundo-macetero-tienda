// Códigos de descuento respaldados en la base. La validación de verdad ocurre en
// el servidor: el cliente solo consulta para mostrar el descuento en pantalla.
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { discounts, type Discount } from "../db/schema";
import type { DescuentoAplicable } from "./descuento-monto";

export { montoDescuento, type DescuentoAplicable } from "./descuento-monto";

function usable(d: Discount): boolean {
  if (!d.activo) return false;
  if (d.expiraEn && d.expiraEn < new Date()) return false;
  if (d.maxUsos != null && d.usos >= d.maxUsos) return false;
  return true;
}

// Devuelve el descuento si el código existe y sigue vigente; null si no. No
// distingue el motivo del rechazo: al cliente solo le importa si sirve o no.
export async function validarCodigo(codigo: string): Promise<DescuentoAplicable | null> {
  const limpio = codigo.trim().toUpperCase();
  if (!limpio) return null;
  const d = await db.query.discounts.findFirst({ where: eq(discounts.codigo, limpio) });
  if (!d || !usable(d)) return null;
  return {
    codigo: d.codigo,
    tipo: d.tipo === "monto" ? "monto" : "porcentaje",
    valor: Number(d.valor),
  };
}

// Consumir un cupo. Se llama SOLO cuando el pedido queda pagado.
export async function consumirUso(codigo: string): Promise<void> {
  await db
    .update(discounts)
    .set({ usos: sql`${discounts.usos} + 1` })
    .where(eq(discounts.codigo, codigo.trim().toUpperCase()));
}
