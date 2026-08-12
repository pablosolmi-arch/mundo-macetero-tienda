import { NextResponse } from "next/server";
import { getMPCredentials, obtenerPago, orderStatusFromMP } from "../../../../lib/mercadopago";
import { settleOrder } from "../../../../queries/orders";
import { alPagarse } from "../../../../lib/pedidos";

// Webhook de Mercado Pago. Llega como POST con ?type=payment&data.id=... (o en
// el cuerpo). El id NO prueba nada: el estado se consulta a la API con nuestro
// token, y solo "approved" marca pagado. Responder 200 rápido: MP reintenta ante
// cualquier otra cosa, y un pedido desconocido aquí puede ser una notificación
// de prueba del panel de MP.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const creds = getMPCredentials();
  if (!creds) return NextResponse.json({ ok: false }, { status: 503 });

  const url = new URL(req.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  try {
    const body = (await req.json()) as { type?: string; data?: { id?: string | number } };
    if (!paymentId && body?.data?.id != null) paymentId = String(body.data.id);
    if (!tipo && body?.type) tipo = body.type;
  } catch {
    // cuerpo vacío o no-JSON: los datos pueden venir solo en la query
  }

  if (tipo && tipo !== "payment") return NextResponse.json({ ok: true, ignorado: tipo });
  if (!paymentId) return NextResponse.json({ ok: true, ignorado: "sin id" });

  let pago;
  try {
    pago = await obtenerPago(creds, paymentId);
  } catch (error) {
    console.error("mp getPago falló:", error instanceof Error ? error.message : "error");
    // 500 para que Mercado Pago reintente más tarde.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (!pago.external_reference) return NextResponse.json({ ok: true, ignorado: "sin referencia" });

  // El motivo de un pago no aprobado solo viene en el objeto de pago (status_detail);
  // sin este log, un rechazo en producción es indiagnosticable desde Vercel.
  if (pago.status !== "approved") {
    console.log(
      `mp pago ${pago.id} pedido ${pago.external_reference}: ${pago.status} (${pago.status_detail ?? "sin detalle"})`,
    );
  }

  const settled = await settleOrder({
    commerceOrder: pago.external_reference,
    status: orderStatusFromMP(pago.status),
    flowToken: String(pago.id),
    flowOrder: String(pago.id),
    paymentMedia: pago.payment_method_id ?? "mercadopago",
  });

  if (settled?.seVolvioPagado) {
    await alPagarse(settled.order);
  }

  return NextResponse.json({ ok: true });
}
