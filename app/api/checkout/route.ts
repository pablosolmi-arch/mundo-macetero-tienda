import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getProductBySlug } from "../../../queries/catalog";

// Flow (Chile) payment creation. Requires the merchant's Flow credentials as
// env vars: FLOW_API_KEY, FLOW_SECRET, and optionally FLOW_BASE_URL
// (defaults to production; use https://sandbox.flow.cl/api for testing).
// Until those are set, checkout returns a clear 503 so the UX is testable
// without exposing a broken payment button.

// SECURITY: the client sends only product/variant identifiers and a quantity.
// The amount charged is always recomputed here from the database — client-
// supplied prices are never trusted (a client can edit localStorage/network
// requests freely). See CartContext.tsx's unitPrice comment.
interface CheckoutLineRequest {
  productSlug: string;
  variantId: number | null;
  qty: number;
}

const FLOW_BASE_URL = process.env.FLOW_BASE_URL || "https://www.flow.cl/api";
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";
const MAX_QTY_PER_LINE = 50;

// Flow signs params by concatenating keys sorted alphabetically with their
// values, then HMAC-SHA256 with the secret.
function signParams(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", secret).update(toSign).digest("hex");
}

export async function POST(req: Request) {
  const apiKey = process.env.FLOW_API_KEY;
  const secret = process.env.FLOW_SECRET;

  if (!apiKey || !secret) {
    return NextResponse.json(
      {
        message:
          "El pago con Flow aún no está conectado. Falta configurar las credenciales del comercio (FLOW_API_KEY, FLOW_SECRET).",
      },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    items: CheckoutLineRequest[];
    customer: { email: string; name: string };
  };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ message: "El carrito está vacío." }, { status: 400 });
  }
  if (!body.customer?.email) {
    return NextResponse.json({ message: "Falta el correo del cliente." }, { status: 400 });
  }

  // Recompute the trusted amount from the database — one row per cart line.
  let amount = 0;
  let lineCount = 0;
  for (const line of body.items) {
    if (
      typeof line.productSlug !== "string" ||
      !Number.isInteger(line.qty) ||
      line.qty <= 0 ||
      line.qty > MAX_QTY_PER_LINE
    ) {
      return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
    }

    const product = await getProductBySlug(line.productSlug);
    if (!product || product.status !== "active") {
      return NextResponse.json(
        { message: `El producto "${line.productSlug}" ya no está disponible.` },
        { status: 400 }
      );
    }

    let unitPrice = Number(product.basePrice);
    if (line.variantId !== null) {
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (!variant) {
        return NextResponse.json(
          { message: `La variante seleccionada para "${product.name}" ya no existe.` },
          { status: 400 }
        );
      }
      unitPrice = variant.priceOverride != null ? Number(variant.priceOverride) : unitPrice;
    }

    amount += unitPrice * line.qty;
    lineCount += 1;
  }

  if (amount <= 0) {
    return NextResponse.json({ message: "El monto del pedido no es válido." }, { status: 400 });
  }

  const commerceOrder = `MM-${Date.now()}`;
  const params: Record<string, string> = {
    apiKey,
    commerceOrder,
    subject: `Compra Mundo Macetero (${lineCount} productos)`,
    currency: "CLP",
    amount: String(amount),
    email: body.customer.email,
    urlConfirmation: `${SITE_URL}/api/checkout/confirm`,
    urlReturn: `${SITE_URL}/checkout/gracias`,
  };
  params.s = signParams(params, secret);

  const res = await fetch(`${FLOW_BASE_URL}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Flow rechazó la solicitud de pago. Revisa las credenciales del comercio." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { url: string; token: string };
  // Flow returns the payment page URL + token; the customer is redirected there.
  return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}` });
}
