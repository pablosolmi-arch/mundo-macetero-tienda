// Mercado Pago (Checkout Pro) vía API REST, sin SDK.
//
// Flujo: se crea una "preferencia" con el monto YA recalculado en el servidor y
// external_reference = nuestro commerceOrder; el cliente paga en el init_point;
// Mercado Pago notifica al webhook y redirige al retorno. En ambos casos el
// estado NUNCA se toma de la URL ni del cuerpo de la notificación: siempre se
// consulta /v1/payments/{id} con el access token, igual que hacemos con Flow.
//
// Credencial: MP_ACCESS_TOKEN (Mercado Pago → Tus integraciones → credenciales
// de producción; las de prueba parten con TEST-). MP_BASE_URL solo para tests.

import type { OrderStatus } from "./flow";

const BASE = () => process.env.MP_BASE_URL || "https://api.mercadopago.com";

export function getMPCredentials(): { accessToken: string } | null {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  return accessToken ? { accessToken } : null;
}

// Estados documentados de un pago MP → nuestro estado de pedido. Solo
// "approved" es plata confirmada; todo estado desconocido queda pendiente,
// nunca se interpreta optimistamente como pagado.
export function orderStatusFromMP(status: string): OrderStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "rejected":
      return "rejected";
    case "cancelled":
    case "charged_back":
      return "annulled";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
    default:
      return "pending";
  }
}

export interface MPPago {
  id: number | string;
  status: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
}

export interface CrearPreferenciaInput {
  commerceOrder: string;
  titulo: string;
  amount: number;
  email: string;
  urlRetorno: string;
  urlWebhook: string;
}

// Crea la preferencia y devuelve la URL de pago (init_point).
export async function crearPreferencia(
  creds: { accessToken: string },
  input: CrearPreferenciaInput,
): Promise<{ redirectUrl: string; preferenceId: string }> {
  const res = await fetch(`${BASE()}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
      // Reintentar la creación no debe duplicar preferencias.
      "X-Idempotency-Key": `pref-${input.commerceOrder}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.titulo,
          quantity: 1,
          unit_price: input.amount,
          currency_id: "CLP",
        },
      ],
      payer: { email: input.email },
      external_reference: input.commerceOrder,
      notification_url: input.urlWebhook,
      back_urls: {
        success: input.urlRetorno,
        pending: input.urlRetorno,
        failure: input.urlRetorno,
      },
      // MP exige que back_urls.success sea una URL pública para auto_return;
      // en pruebas locales (http://localhost) se omite y el cliente vuelve con
      // el botón "Volver al sitio". En producción siempre va.
      ...(input.urlRetorno.startsWith("https://") ? { auto_return: "approved" } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Mercado Pago preferences respondió ${res.status}`);
  }
  const data = (await res.json()) as { id: string; init_point: string };
  return { redirectUrl: data.init_point, preferenceId: data.id };
}

// Estado autoritativo de un pago.
export async function obtenerPago(
  creds: { accessToken: string },
  paymentId: string,
): Promise<MPPago> {
  const res = await fetch(`${BASE()}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${creds.accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago payments respondió ${res.status}`);
  }
  return (await res.json()) as MPPago;
}

// Reembolso total o parcial de un pago aprobado.
export async function reembolsarPago(
  creds: { accessToken: string },
  paymentId: string,
  amount: number,
  idempotencia: string,
): Promise<{ id: number | string; status?: string }> {
  const res = await fetch(`${BASE()}/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencia,
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago refunds respondió ${res.status}`);
  }
  return (await res.json()) as { id: number | string; status?: string };
}
