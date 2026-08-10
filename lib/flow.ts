import crypto from "node:crypto";

// Flow (Chile) API client. Docs: https://developers.flow.cl/en/api
//
// Credentials come from the merchant panel ("Mis datos" -> integration tab).
// Sandbox and production are separate accounts with separate keys, selected via
// FLOW_BASE_URL. Nothing here reads the cart from the client: callers pass an
// amount that was already recomputed server-side.

export const FLOW_PRODUCTION_URL = "https://www.flow.cl/api";
export const FLOW_SANDBOX_URL = "https://sandbox.flow.cl/api";

// Flow's documented order statuses. Only PAID means the money arrived; treating
// PENDING as success would ship goods for an unpaid voucher.
export const FLOW_STATUS = {
  PENDING: 1,
  PAID: 2,
  REJECTED: 3,
  ANNULLED: 4,
} as const;

// How each Flow status is stored in orders.status.
export type OrderStatus = "pending" | "paid" | "rejected" | "annulled";

export function orderStatusFromFlow(flowStatus: number): OrderStatus {
  switch (flowStatus) {
    case FLOW_STATUS.PAID:
      return "paid";
    case FLOW_STATUS.REJECTED:
      return "rejected";
    case FLOW_STATUS.ANNULLED:
      return "annulled";
    case FLOW_STATUS.PENDING:
      return "pending";
    default:
      // An unknown code must never be optimistically read as paid.
      return "pending";
  }
}

export interface FlowCredentials {
  apiKey: string;
  secret: string;
  baseUrl: string;
}

// Reads credentials from the environment, or returns null when they are absent
// so callers can degrade gracefully instead of throwing at request time.
export function getFlowCredentials(): FlowCredentials | null {
  const apiKey = process.env.FLOW_API_KEY;
  const secret = process.env.FLOW_SECRET;
  if (!apiKey || !secret) return null;
  return {
    apiKey,
    secret,
    baseUrl: process.env.FLOW_BASE_URL || FLOW_PRODUCTION_URL,
  };
}

// Flow signs params by concatenating keys sorted alphabetically with their
// values, then HMAC-SHA256 with the secret.
export function signParams(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", secret).update(toSign).digest("hex");
}

export interface FlowPaymentStatus {
  status: number;
  commerceOrder: string;
  flowOrder?: string | number;
  amount?: string | number;
  paymentMedia?: string;
}

export interface CreatePaymentInput {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

// Creates a payment and returns the URL the customer must be redirected to.
export async function createPayment(
  creds: FlowCredentials,
  input: CreatePaymentInput,
): Promise<{ redirectUrl: string; token: string; flowOrder?: string | number }> {
  const params: Record<string, string> = {
    apiKey: creds.apiKey,
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    currency: "CLP",
    amount: String(input.amount),
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
  };
  params.s = signParams(params, creds.secret);

  const res = await fetch(`${creds.baseUrl}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    throw new Error(`Flow payment/create respondió ${res.status}`);
  }

  const data = (await res.json()) as { url: string; token: string; flowOrder?: string | number };
  return { redirectUrl: `${data.url}?token=${data.token}`, token: data.token, flowOrder: data.flowOrder };
}

export interface RefundInput {
  // Nuestro identificador del reembolso, distinto del del pedido.
  refundCommerceOrder: string;
  // Correo de quien recibe la devolución.
  receiverEmail: string;
  amount: number;
  urlCallBack: string;
  // Referencia a la transacción original (nuestro commerceOrder).
  commerceTrxId?: string;
}

export interface FlowRefund {
  token: string;
  flowRefundOrder?: string | number;
  status?: string;
  amount?: string | number;
  fee?: string | number;
}

// Crea un reembolso en Flow. Docs: https://developers.flow.cl/en/api (refund/create).
// La respuesta trae `status` como texto ("created", …), no un código numérico: el
// estado definitivo se consulta con refund/getStatus, así que acá no se asume que
// el dinero ya volvió, solo que el reembolso quedó solicitado.
export async function createRefund(
  creds: FlowCredentials,
  input: RefundInput,
): Promise<FlowRefund> {
  const params: Record<string, string> = {
    apiKey: creds.apiKey,
    refundCommerceOrder: input.refundCommerceOrder,
    receiverEmail: input.receiverEmail,
    amount: String(input.amount),
    urlCallBack: input.urlCallBack,
  };
  if (input.commerceTrxId) params.commerceTrxId = input.commerceTrxId;
  params.s = signParams(params, creds.secret);

  const res = await fetch(`${creds.baseUrl}/refund/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    throw new Error(`Flow refund/create respondió ${res.status}`);
  }
  return (await res.json()) as FlowRefund;
}

// Flow's confirmation callback only carries a token; the authoritative status
// must be pulled from this endpoint. A callback body is never trusted to say
// "paid" on its own.
export async function getPaymentStatus(
  creds: FlowCredentials,
  token: string,
): Promise<FlowPaymentStatus> {
  const params: Record<string, string> = { apiKey: creds.apiKey, token };
  params.s = signParams(params, creds.secret);

  const res = await fetch(`${creds.baseUrl}/payment/getStatus?${new URLSearchParams(params).toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Flow payment/getStatus respondió ${res.status}`);
  }

  return (await res.json()) as FlowPaymentStatus;
}
