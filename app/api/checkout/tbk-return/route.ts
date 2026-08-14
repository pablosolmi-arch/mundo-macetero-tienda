import { NextResponse } from "next/server";
import {
  commitTransaccion,
  estadoTransaccion,
  getTBKCredentials,
  orderStatusFromTBK,
  type TBKTransaccion,
} from "../../../../lib/transbank";
import { settleOrder } from "../../../../queries/orders";
import { alPagarse } from "../../../../lib/pedidos";

// Vuelta del NAVEGADOR desde Webpay Plus. Es la ÚNICA notificación que existe:
// Transbank no tiene webhook, así que acá se cierra el cobro con el commit (PUT)
// y se asienta el pedido con el estado que devuelve ese commit, nunca con lo que
// venga en la query. Webpay vuelve por POST (formulario), pero también se acepta
// GET para visitas manuales y para el reintento de algunos navegadores.
//
// Tres casos:
//  - token_ws            → transacción intentada: commit + settleOrder.
//  - TBK_TOKEN (sin más) → el cliente anuló o el formulario expiró: NO se hace
//    commit (Webpay lo rechazaría) y el pedido queda intacto y pendiente.
//  - sin token           → redirección neutra.

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

function aConfirmacion(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${SITE_URL}/confirmacion${query ? `?${query}` : ""}`, 303);
}

interface RetornoTBK {
  tokenWs: string | null;
  tbkToken: string | null;
  ordenAnulada: string | null;
}

// Webpay manda los campos como formulario; la query se lee igual porque en
// algunos rebotes el navegador llega con GET.
async function leerRetorno(req: Request): Promise<RetornoTBK> {
  const valores = new Map<string, string>();
  for (const [k, v] of new URL(req.url).searchParams) valores.set(k, v);
  if (req.method === "POST") {
    try {
      const form = await req.formData();
      for (const [k, v] of form) {
        if (typeof v === "string") valores.set(k, v);
      }
    } catch {
      // Sin cuerpo legible quedan solo los valores de la query.
    }
  }
  return {
    tokenWs: valores.get("token_ws") ?? null,
    tbkToken: valores.get("TBK_TOKEN") ?? null,
    ordenAnulada: valores.get("TBK_ORDEN_COMPRA") ?? null,
  };
}

async function manejar(req: Request) {
  const creds = getTBKCredentials();
  if (!creds) return aConfirmacion({ estado: "desconocido" });

  const { tokenWs, tbkToken, ordenAnulada } = await leerRetorno(req);

  // Anulación del cliente o formulario expirado. Si además viene token_ws se
  // trata igual: con TBK_TOKEN presente la transacción no quedó autorizada, y
  // hacer commit sobre ella es error. El pedido no se toca: sigue pendiente.
  if (tbkToken) {
    return aConfirmacion(
      ordenAnulada ? { pedido: ordenAnulada, estado: "pending" } : { estado: "desconocido" },
    );
  }

  if (!tokenWs) return aConfirmacion({ estado: "desconocido" });

  let trx: TBKTransaccion;
  try {
    trx = await commitTransaccion(creds, tokenWs);
  } catch (error) {
    // Webpay acepta el commit una sola vez por token: si el cliente recarga el
    // retorno, el segundo intento falla aunque el pago esté hecho. Antes de dar
    // el estado por desconocido se consulta el GET, que sí es repetible.
    console.error("tbk commit falló:", error instanceof Error ? error.message : "error");
    try {
      trx = await estadoTransaccion(creds, tokenWs);
    } catch (error2) {
      console.error("tbk status falló:", error2 instanceof Error ? error2.message : "error");
      return aConfirmacion({ estado: "desconocido" });
    }
  }

  if (!trx.buy_order) return aConfirmacion({ estado: "desconocido" });

  const status = orderStatusFromTBK(trx.status, trx.response_code);
  try {
    // buy_order es nuestro commerceOrder tal cual (entra en los 26 caracteres).
    // El token queda guardado porque es la referencia que pide el reembolso.
    const settled = await settleOrder({
      commerceOrder: trx.buy_order,
      status,
      flowToken: tokenWs,
      flowOrder: trx.authorization_code ?? null,
      paymentMedia: trx.payment_type_code ?? "webpay",
    });
    if (settled?.seVolvioPagado) {
      await alPagarse(settled.order);
    }
  } catch (error) {
    // Sin datos del cliente en el log. El cobro ya ocurrió: se sigue a la
    // confirmación con el estado real de Webpay.
    console.error("tbk settle falló:", error instanceof Error ? error.message : "error");
  }
  return aConfirmacion({ pedido: trx.buy_order, estado: status });
}

export async function POST(req: Request) {
  return manejar(req);
}

export async function GET(req: Request) {
  return manejar(req);
}
