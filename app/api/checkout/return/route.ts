import { NextResponse } from "next/server";
import { getFlowCredentials, getPaymentStatus, orderStatusFromFlow } from "../../../../lib/flow";
import { settleOrder } from "../../../../queries/orders";
import { alPagarse } from "../../../../lib/pedidos";

// Where Flow sends the customer's BROWSER back after paying. Flow does this with
// a POST carrying the token, so this cannot be a plain page (a page would answer
// 405). We settle the order here too, because the browser often returns before
// the server-to-server confirmation lands, and then redirect with 303 so the
// customer ends up on a normal GET page they can safely reload.

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

function redirectToThanks(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${SITE_URL}/confirmacion${query ? `?${query}` : ""}`, 303);
}

export async function POST(req: Request) {
  const creds = getFlowCredentials();
  if (!creds) return redirectToThanks({ estado: "desconocido" });

  let token: string | null = null;
  try {
    const form = await req.formData();
    const value = form.get("token");
    token = typeof value === "string" ? value : null;
  } catch {
    token = null;
  }

  if (!token) return redirectToThanks({ estado: "desconocido" });

  try {
    const payment = await getPaymentStatus(creds, token);
    if (!payment?.commerceOrder) return redirectToThanks({ estado: "desconocido" });

    const status = orderStatusFromFlow(payment.status);
    const settled = await settleOrder({
      commerceOrder: payment.commerceOrder,
      status,
      flowToken: token,
      flowOrder: payment.flowOrder != null ? String(payment.flowOrder) : null,
      paymentMedia: payment.paymentMedia ?? null,
    });

    if (settled?.seVolvioPagado) {
      await alPagarse(settled.order);
    }

    return redirectToThanks({ pedido: payment.commerceOrder, estado: status });
  } catch (error) {
    console.error(
      "flow return getStatus failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return redirectToThanks({ estado: "desconocido" });
  }
}

// Some browsers and manual visits arrive here with a GET; send them onward
// rather than showing an error.
export async function GET() {
  return redirectToThanks({ estado: "desconocido" });
}
