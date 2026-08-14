// Transbank Webpay Plus (REST, API v1.2) vía fetch, sin SDK.
//
// Flujo: se crea una transacción con el monto YA recalculado en el servidor y
// buy_order = nuestro commerceOrder; el cliente paga en la URL del formulario de
// Webpay (url + "?token_ws=" + token) y su NAVEGADOR vuelve al return_url. Webpay
// NO tiene webhook: la única notificación es ese retorno, y el cobro se cierra
// recién cuando el comercio hace el commit (PUT). El estado NUNCA se toma de la
// query del retorno: se lee de la respuesta del commit (o del GET de estado),
// igual que hacemos con Flow y Mercado Pago.
//
// Credenciales: TBK_COMMERCE_CODE (código de comercio) y TBK_API_KEY (llave
// secreta), que viajan en los headers Tbk-Api-Key-Id / Tbk-Api-Key-Secret.
// TBK_BASE_URL solo para tests y para apuntar al ambiente de integración.

import type { OrderStatus } from "./flow";

export const TBK_PRODUCTION_URL = "https://webpay3g.transbank.cl";
export const TBK_INTEGRATION_URL = "https://webpay3gint.transbank.cl";

// Prefijo de todos los endpoints de Webpay Plus REST.
const API = "/rswebpaytransaction/api/webpay/v1.2";

// Webpay limita buy_order a 26 caracteres. Nuestro commerceOrder
// ("MM-" + Date.now() + "-" + 6 hex) mide 23, así que entra tal cual y el
// mapeo con el pedido es 1:1 (no hace falta guardar una referencia aparte).
export const TBK_MAX_BUY_ORDER = 26;

export interface TBKCredentials {
  commerceCode: string;
  apiKey: string;
  baseUrl: string;
}

// Lee las credenciales del entorno, o devuelve null cuando falta alguna para que
// el llamador degrade con gracia en vez de fallar al momento de cobrar.
export function getTBKCredentials(): TBKCredentials | null {
  const commerceCode = process.env.TBK_COMMERCE_CODE;
  const apiKey = process.env.TBK_API_KEY;
  if (!commerceCode || !apiKey) return null;
  return {
    commerceCode,
    apiKey,
    baseUrl: process.env.TBK_BASE_URL || TBK_PRODUCTION_URL,
  };
}

// Estados documentados de una transacción Webpay → nuestro estado de pedido.
// Solo AUTHORIZED con response_code 0 es plata confirmada: un response_code
// distinto de 0 es un rechazo del emisor, y todo lo desconocido queda pendiente
// antes que interpretarse optimistamente como pagado.
export function orderStatusFromTBK(
  status: string | null | undefined,
  responseCode?: number | null,
): OrderStatus {
  switch (status) {
    case "AUTHORIZED":
      return responseCode === 0 ? "paid" : "rejected";
    case "FAILED":
      return "rejected";
    case "NULLIFIED":
    case "REVERSED":
      return "annulled";
    case "INITIALIZED":
    default:
      return "pending";
  }
}

export interface TBKTransaccion {
  // AUTHORIZED | INITIALIZED | FAILED | NULLIFIED | REVERSED
  status?: string;
  // 0 = aprobada; negativo = rechazo del emisor. Es lo único que explica un rechazo.
  response_code?: number;
  buy_order?: string;
  session_id?: string;
  amount?: number;
  authorization_code?: string;
  payment_type_code?: string;
  installments_number?: number;
  card_detail?: { card_number?: string };
}

export interface CrearTransaccionInput {
  commerceOrder: string;
  amount: number;
  urlRetorno: string;
}

function headers(creds: TBKCredentials): Record<string, string> {
  return {
    "Tbk-Api-Key-Id": creds.commerceCode,
    "Tbk-Api-Key-Secret": creds.apiKey,
    "Content-Type": "application/json",
  };
}

// Crea la transacción y devuelve la URL a la que se redirige al cliente.
// El monto en CLP es entero: Webpay rechaza decimales.
export async function crearTransaccion(
  creds: TBKCredentials,
  input: CrearTransaccionInput,
): Promise<{ redirectUrl: string; token: string }> {
  // Si el formato de commerceOrder creciera más allá del límite, cortarlo dejaría
  // el pago sin forma de volver al pedido: mejor no crear la transacción y que el
  // checkout responda 502 con el pedido pendiente como evidencia del intento.
  if (input.commerceOrder.length > TBK_MAX_BUY_ORDER) {
    throw new Error(`buy_order excede los ${TBK_MAX_BUY_ORDER} caracteres de Webpay`);
  }

  const res = await fetch(`${creds.baseUrl}${API}/transactions`, {
    method: "POST",
    headers: headers(creds),
    body: JSON.stringify({
      buy_order: input.commerceOrder,
      session_id: input.commerceOrder,
      amount: Math.round(input.amount),
      return_url: input.urlRetorno,
    }),
  });

  if (!res.ok) {
    throw new Error(`Transbank transactions respondió ${res.status}`);
  }

  const data = (await res.json()) as { token: string; url: string };
  return { redirectUrl: `${data.url}?token_ws=${data.token}`, token: data.token };
}

// Cierra el cobro (PUT sin cuerpo) y devuelve el estado autoritativo. Webpay lo
// acepta una sola vez por token; un segundo commit responde error, así que el
// llamador debe tratar el fallo como "no confirmado" y no como impago.
export async function commitTransaccion(
  creds: TBKCredentials,
  token: string,
): Promise<TBKTransaccion> {
  const res = await fetch(`${creds.baseUrl}${API}/transactions/${encodeURIComponent(token)}`, {
    method: "PUT",
    headers: headers(creds),
  });
  if (!res.ok) {
    throw new Error(`Transbank commit respondió ${res.status}`);
  }
  return (await res.json()) as TBKTransaccion;
}

// Estado de una transacción ya confirmada, para consultarlo de nuevo sin cobrar.
export async function estadoTransaccion(
  creds: TBKCredentials,
  token: string,
): Promise<TBKTransaccion> {
  const res = await fetch(`${creds.baseUrl}${API}/transactions/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: headers(creds),
  });
  if (!res.ok) {
    throw new Error(`Transbank status respondió ${res.status}`);
  }
  return (await res.json()) as TBKTransaccion;
}

export interface TBKReembolso {
  // REVERSED = reversa del mismo día (anula el cobro completo);
  // NULLIFIED = anulación posterior, admite monto parcial.
  type?: string;
  response_code?: number;
  authorization_code?: string;
  nullified_amount?: number;
  balance?: number;
}

// Reembolso total o parcial contra el token de la transacción original.
export async function reembolsarTransaccion(
  creds: TBKCredentials,
  token: string,
  amount: number,
): Promise<TBKReembolso> {
  const res = await fetch(
    `${creds.baseUrl}${API}/transactions/${encodeURIComponent(token)}/refunds`,
    {
      method: "POST",
      headers: headers(creds),
      body: JSON.stringify({ amount: Math.round(amount) }),
    },
  );
  if (!res.ok) {
    throw new Error(`Transbank refunds respondió ${res.status}`);
  }
  return (await res.json()) as TBKReembolso;
}
