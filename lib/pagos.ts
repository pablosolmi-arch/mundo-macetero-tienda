// Selector de pasarela. Mercado Pago es la elegida; Flow queda como alternativa
// enchufable (y Transbank entrará por esta misma puerta). La pasarela activa se
// decide por las credenciales presentes, con MP primero por decisión de Pablo.
import { createPayment, getFlowCredentials } from "./flow";
import { crearPreferencia, getMPCredentials } from "./mercadopago";

export type Gateway = "mercadopago" | "flow";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export function gatewayActiva(): Gateway | null {
  if (getMPCredentials()) return "mercadopago";
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
