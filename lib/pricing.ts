import { DESCUENTO, ENVIO } from "../content/site";

// Shipping and discount rules live here so the checkout UI and the server-side
// /api/checkout produce the SAME total from the same inputs. The browser's figure
// is only ever a preview: the amount actually charged is recomputed on the server.

export type Entrega = "retiro" | "despacho";

export interface EnvioInput {
  entrega: Entrega;
  region: string;
  comuna: string;
}

export interface EnvioResultado {
  label: string;
  monto: number;
  // What the customer sees in the totals column ("Gratis", "$12.990", …).
  txt: string;
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

export function calcEnvio({ entrega, region, comuna }: EnvioInput): EnvioResultado {
  if (entrega === "retiro") {
    return { label: ENVIO.retiro, monto: 0, txt: "Gratis" };
  }

  if (region === ENVIO.regionRM) {
    if (!comuna) {
      return { label: "Despacho RM — selecciona comuna", monto: 0, txt: "Por calcular" };
    }
    if ((ENVIO.comunasOriente as readonly string[]).includes(comuna)) {
      return { label: `Despacho gratis — sector oriente (${comuna})`, monto: 0, txt: "Gratis" };
    }
    return { label: `Despacho RM (${comuna})`, monto: ENVIO.tarifaRM, txt: fmt(ENVIO.tarifaRM) };
  }

  // Other regions travel with an external carrier the customer pays directly, so
  // nothing is added to the charged amount.
  return { label: "Envío a regiones — transporte externo", monto: 0, txt: "Por pagar" };
}

// Returns the discount amount in pesos. An unrecognised code is worth nothing.
export function calcDescuento(subtotal: number, codigo: string | null): number {
  if (!codigo) return 0;
  if (codigo.trim().toUpperCase() !== DESCUENTO.codigo) return 0;
  return Math.round((subtotal * DESCUENTO.porcentaje) / 100);
}

export function esCodigoValido(codigo: string): boolean {
  return codigo.trim().toUpperCase() === DESCUENTO.codigo;
}

export interface TotalesInput extends EnvioInput {
  subtotal: number;
  codigo: string | null;
}

export interface Totales {
  subtotal: number;
  descuento: number;
  envio: EnvioResultado;
  total: number;
}

export function calcTotales({ subtotal, codigo, ...envioInput }: TotalesInput): Totales {
  const descuento = calcDescuento(subtotal, codigo);
  const envio = calcEnvio(envioInput);
  return {
    subtotal,
    descuento,
    envio,
    total: subtotal - descuento + envio.monto,
  };
}
