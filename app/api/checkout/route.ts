import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getProductBySlug } from "../../../queries/catalog";
import { createPendingOrder, type NewOrderLine } from "../../../queries/orders";
import { createPayment, getFlowCredentials } from "../../../lib/flow";
import { calcTotales, type Entrega } from "../../../lib/pricing";

// Flow (Chile) payment creation. Requires the merchant's Flow credentials as
// env vars: FLOW_API_KEY, FLOW_SECRET, and optionally FLOW_BASE_URL
// (defaults to production; use https://sandbox.flow.cl/api for testing).
// Until those are set, checkout returns a clear 503 so the UX is testable
// without exposing a broken payment button.

// SECURITY: the client sends only product/variant identifiers, quantities, the
// delivery choice and a discount code. Unit prices, the shipping cost and the
// discount are ALL recomputed here — a client can edit localStorage and network
// requests freely, so nothing money-related is taken on trust.
interface CheckoutLineRequest {
  productSlug: string;
  variantId: number | null;
  qty: number;
}

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";
const MAX_QTY_PER_LINE = 50;

// Date.now() alone can collide between two concurrent checkouts in the same
// millisecond, and commerceOrder is a unique key.
function newCommerceOrder(): string {
  return `MM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function POST(req: Request) {
  const creds = getFlowCredentials();

  if (!creds) {
    return NextResponse.json(
      {
        message:
          "El pago con Flow aún no está conectado. Falta configurar las credenciales del comercio (FLOW_API_KEY, FLOW_SECRET).",
      },
      { status: 503 },
    );
  }

  const body = (await req.json()) as {
    items: CheckoutLineRequest[];
    customer: {
      email: string;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      region?: string;
      note?: string;
    };
    entrega?: Entrega;
    codigo?: string | null;
  };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ message: "El carrito está vacío." }, { status: 400 });
  }
  if (!body.customer?.email) {
    return NextResponse.json({ message: "Falta el correo del cliente." }, { status: 400 });
  }

  const entrega: Entrega = body.entrega === "despacho" ? "despacho" : "retiro";
  if (entrega === "despacho" && !body.customer.city?.trim()) {
    return NextResponse.json({ message: "Falta la comuna de despacho." }, { status: 400 });
  }

  // Recompute the trusted subtotal from the database — one row per cart line.
  let subtotal = 0;
  const lines: NewOrderLine[] = [];
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
        { status: 400 },
      );
    }

    let unitPrice = Number(product.basePrice);
    let variantName: string | null = null;
    if (line.variantId !== null) {
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (!variant) {
        return NextResponse.json(
          { message: `La variante seleccionada para "${product.name}" ya no existe.` },
          { status: 400 },
        );
      }
      unitPrice = variant.priceOverride != null ? Number(variant.priceOverride) : unitPrice;
      variantName = variant.name;
    }

    subtotal += unitPrice * line.qty;
    lines.push({
      productId: product.id,
      variantId: line.variantId,
      productName: product.name,
      variantName,
      unitPrice,
      qty: line.qty,
    });
  }

  if (subtotal <= 0) {
    return NextResponse.json({ message: "El monto del pedido no es válido." }, { status: 400 });
  }

  // Shipping and discount from the same shared rules the checkout UI used, so the
  // charged total matches the quoted one, but derived here from trusted inputs.
  const totales = calcTotales({
    subtotal,
    codigo: body.codigo ?? null,
    entrega,
    region: body.customer.region ?? "",
    comuna: body.customer.city ?? "",
  });

  if (totales.total <= 0) {
    return NextResponse.json({ message: "El monto del pedido no es válido." }, { status: 400 });
  }

  // Persist before redirecting to Flow: if the customer abandons the payment or
  // Flow's callback never lands, the requested order and shipping details still
  // exist instead of being lost with the browser session.
  const commerceOrder = newCommerceOrder();
  await createPendingOrder({
    commerceOrder,
    subtotal: totales.subtotal,
    discountCode: totales.descuento > 0 ? (body.codigo ?? null) : null,
    discountAmount: totales.descuento,
    shippingLabel: totales.envio.label,
    shippingCost: totales.envio.monto,
    amount: totales.total,
    entrega,
    customer: {
      name: body.customer.name ?? "",
      email: body.customer.email,
      phone: body.customer.phone ?? "",
      address: body.customer.address ?? "",
      city: body.customer.city ?? "",
      region: body.customer.region ?? "",
      note: body.customer.note ?? "",
    },
    lines,
  });

  try {
    const { redirectUrl } = await createPayment(creds, {
      commerceOrder,
      subject: `Compra Mundo Macetero (${lines.length} productos)`,
      amount: totales.total,
      email: body.customer.email,
      // Flow POSTs the token to both URLs, so neither can be a plain page.
      urlConfirmation: `${SITE_URL}/api/checkout/confirm`,
      urlReturn: `${SITE_URL}/api/checkout/return`,
    });
    return NextResponse.json({ redirectUrl });
  } catch {
    // The pending order stays in the database as evidence of the attempt.
    return NextResponse.json(
      { message: "Flow rechazó la solicitud de pago. Revisa las credenciales del comercio." },
      { status: 502 },
    );
  }
}
