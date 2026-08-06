import { NextResponse } from "next/server";
import { getFlowCredentials, getPaymentStatus, orderStatusFromFlow } from "../../../../lib/flow";
import { settleOrder } from "../../../../queries/orders";

// Flow's server-to-server confirmation callback. Flow POSTs a single `token` as
// application/x-www-form-urlencoded; the token is NOT a claim that the payment
// succeeded, so the authoritative status is pulled from payment/getStatus and
// only status 2 ("pagada") marks the order paid.
//
// This route is what turns a payment into a recorded sale, so it must always
// answer 200 once the order has been settled: Flow retries and can annul a
// transaction whose confirmation never succeeded.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const creds = getFlowCredentials();
  if (!creds) {
    return NextResponse.json(
      { message: "El pago con Flow aún no está conectado." },
      { status: 503 },
    );
  }

  let token: string | null = null;
  try {
    const form = await req.formData();
    const value = form.get("token");
    token = typeof value === "string" ? value : null;
  } catch {
    token = null;
  }

  if (!token) {
    return NextResponse.json({ message: "Falta el token de la transacción." }, { status: 400 });
  }

  let payment;
  try {
    payment = await getPaymentStatus(creds, token);
  } catch (error) {
    // Never log the token or customer data; only why the lookup failed.
    console.error(
      "flow getStatus failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    // A 500 tells Flow to retry later, which is what we want: the order stays
    // pending rather than being wrongly settled from an unverified callback.
    return NextResponse.json({ message: "No se pudo verificar el pago." }, { status: 500 });
  }

  if (!payment?.commerceOrder) {
    return NextResponse.json({ message: "Respuesta de Flow sin pedido." }, { status: 400 });
  }

  const status = orderStatusFromFlow(payment.status);
  const settled = await settleOrder({
    commerceOrder: payment.commerceOrder,
    status,
    flowToken: token,
    flowOrder: payment.flowOrder != null ? String(payment.flowOrder) : null,
    paymentMedia: payment.paymentMedia ?? null,
  });

  if (!settled) {
    // Unknown commerceOrder: answering 200 would let Flow consider a payment we
    // have no record of as confirmed.
    console.error("flow confirmation for an unknown commerceOrder");
    return NextResponse.json({ message: "Pedido no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: settled.status });
}
