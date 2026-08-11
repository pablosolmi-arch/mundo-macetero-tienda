import { NextResponse } from "next/server";
import { getMPCredentials, obtenerPago, orderStatusFromMP } from "../../../../lib/mercadopago";
import { settleOrder } from "../../../../queries/orders";
import { alPagarse } from "../../../../lib/pedidos";

// Vuelta del NAVEGADOR desde Mercado Pago (GET con payment_id y
// external_reference en la query). Igual que con Flow: la query no se cree, el
// estado se consulta a la API, se asienta (la transición atómica evita duplicar
// efectos si el webhook ganó) y se redirige a la confirmación con 303.

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

function aConfirmacion(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${SITE_URL}/confirmacion${query ? `?${query}` : ""}`, 303);
}

export async function GET(req: Request) {
  const creds = getMPCredentials();
  if (!creds) return aConfirmacion({ estado: "desconocido" });

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id");
  const referencia = url.searchParams.get("external_reference");

  // Pago abandonado sin intento: MP puede volver sin payment_id.
  if (!paymentId || paymentId === "null") {
    return aConfirmacion(referencia ? { pedido: referencia, estado: "pending" } : { estado: "desconocido" });
  }

  try {
    const pago = await obtenerPago(creds, paymentId);
    if (!pago.external_reference) return aConfirmacion({ estado: "desconocido" });

    const status = orderStatusFromMP(pago.status);
    const settled = await settleOrder({
      commerceOrder: pago.external_reference,
      status,
      flowToken: String(pago.id),
      flowOrder: String(pago.id),
      paymentMedia: pago.payment_method_id ?? "mercadopago",
    });
    if (settled?.seVolvioPagado) {
      await alPagarse(settled.order);
    }
    return aConfirmacion({ pedido: pago.external_reference, estado: status });
  } catch (error) {
    console.error("mp return falló:", error instanceof Error ? error.message : "error");
    return aConfirmacion({ estado: "desconocido" });
  }
}
