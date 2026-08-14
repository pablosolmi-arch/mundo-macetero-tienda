// Selector de pasarela. Mercado Pago es la elegida; Transbank (Webpay Plus) y
// Flow quedan como alternativas enchufables. La pasarela activa se decide por las
// credenciales presentes, con MP primero por decisión de Pablo y Transbank antes
// que Flow.
import { createPayment, getFlowCredentials } from "./flow";
import { crearPreferencia, getMPCredentials } from "./mercadopago";
import { crearTransaccion, getTBKCredentials } from "./transbank";

export type Gateway = "mercadopago" | "transbank" | "flow";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export function gatewayActiva(): Gateway | null {
  if (getMPCredentials()) return "mercadopago";
  if (getTBKCredentials()) return "transbank";
  if (getFlowCredentials()) return "flow";
  return null;
}

export interface LinkPagoInput {
  commerceOrder: string;
  titulo: string;
  amount: number;
  email: string;
}

// Crea el cobro en la pasarela activa y devuelve la URL a la que se envía al
// cliente. Lanza si no hay pasarela configurada: el llamador decide el mensaje.
export async function crearLinkPago(input: LinkPagoInput): Promise<{ redirectUrl: string; gateway: Gateway }> {
  const mp = getMPCredentials();
  if (mp) {
    const { redirectUrl } = await crearPreferencia(mp, {
      commerceOrder: input.commerceOrder,
      titulo: input.titulo,
      amount: input.amount,
      email: input.email,
      urlRetorno: `${SITE_URL}/api/checkout/mp-return`,
      urlWebhook: `${SITE_URL}/api/checkout/mp-webhook`,
    });
    return { redirectUrl, gateway: "mercadopago" };
  }
  const tbk = getTBKCredentials();
  if (tbk) {
    // Webpay Plus no lleva título ni correo en la transacción: solo buy_order y
    // monto. El cierre del cobro ocurre en el retorno del navegador.
    const { redirectUrl } = await crearTransaccion(tbk, {
      commerceOrder: input.commerceOrder,
      amount: input.amount,
      urlRetorno: `${SITE_URL}/api/checkout/tbk-return`,
    });
    return { redirectUrl, gateway: "transbank" };
  }
  const flow = getFlowCredentials();
  if (flow) {
    const { redirectUrl } = await createPayment(flow, {
      commerceOrder: input.commerceOrder,
      subject: input.titulo,
      amount: input.amount,
      email: input.email,
      urlConfirmation: `${SITE_URL}/api/checkout/confirm`,
      urlReturn: `${SITE_URL}/api/checkout/return`,
    });
    return { redirectUrl, gateway: "flow" };
  }
  throw new Error("Sin pasarela de pago configurada");
}
