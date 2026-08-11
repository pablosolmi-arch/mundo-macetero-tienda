import { ENVIO } from "../content/site";

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

// The only free delivery is the eastern sector of Santiago. Everywhere else is
// quoted with an external carrier after the purchase, so `monto` is always 0:
// the storefront never charges a shipping amount it cannot compute.
export function calcEnvio({ entrega, region, comuna }: EnvioInput): EnvioResultado {
  if (entrega === "retiro") {
    return { label: ENVIO.retiro, monto: 0, txt: "Gratis" };
  }

  if (region === ENVIO.regionRM) {
    if (!comuna) {
      return { label: "Despacho RM — selecciona comuna", monto: 0, txt: "Por confirmar" };
    }
    if ((ENVIO.comunasOriente as readonly string[]).includes(comuna)) {
      return { label: `Despacho gratis — sector oriente (${comuna})`, monto: 0, txt: "Gratis" };
    }
    return { label: `Despacho a ${comuna} — transportista externo`, monto: 0, txt: "Se cotiza" };
  }

  return { label: "Despacho a regiones — transportista externo", monto: 0, txt: "Se cotiza" };
}

export interface TotalesInput extends EnvioInput {
  subtotal: number;
  // Monto del descuento en pesos, ya resuelto contra la tabla de códigos
  // (lib/descuentos.ts). Acá solo se aplica, nunca se calcula desde un código.
  descuento: number;
}

export interface Totales {
  subtotal: number;
  descuento: number;
  envio: EnvioResultado;
  total: number;
}

export function calcTotales({ subtotal, descuento, ...envioInput }: TotalesInput): Totales {
  const envio = calcEnvio(envioInput);
  const aplicado = Math.min(Math.max(0, Math.round(descuento)), subtotal);
  return {
    subtotal,
    descuento: aplicado,
    envio,
    total: subtotal - aplicado + envio.monto,
  };
}
