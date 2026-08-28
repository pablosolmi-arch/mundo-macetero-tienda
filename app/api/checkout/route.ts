import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getProductBySlug } from "../../../queries/catalog";
import { createPendingOrder, type NewOrderLine } from "../../../queries/orders";
import { crearLinkPago, gatewayActiva } from "../../../lib/pagos";
import { calcTotales, type Entrega } from "../../../lib/pricing";
import { montoDescuento, validarCodigo } from "../../../lib/descuentos";
import { CANALES } from "../../../lib/origen";
import {
  nombreVarianteConTerminacion,
  normalizarTerminacion,
} from "../../../content/terminaciones";

// Flow (Chile) payment creation. Requires the merchant's Flow credentials as
// env vars: FLOW_API_KEY, FLOW_SECRET, and optionally FLOW_BASE_URL
// (defaults to production; use https://sandbox.flow.cl/api for testing).
// Until those are set, checkout returns a clear 503 so the UX is testable
// without exposing a broken payment button.

// SECURITY: the client sends only product/variant identifiers, quantities, the
// delivery choice and a discount code. Unit prices, the shipping cost and the
// discount are ALL recomputed here — a client can edit localStorage and network
// requests freely, so nothing money-related is taken on trust.
//
// La terminación es la única cosa que el cliente elige y que el servidor NO puede
// recalcular (no está en el catálogo, no mueve el precio), así que llega en la
// petición y se valida contra la lista cerrada de content/terminaciones.ts.
interface CheckoutLineRequest {
  productSlug: string;
  variantId: number | null;
  terminacion?: string | null;
  qty: number;
}

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";
const MAX_QTY_PER_LINE = 50;

// El origen de la visita lo calcula el navegador, así que llega como cualquier
// otro dato del cliente: se valida contra la lista blanca y se recorta. Un valor
// raro no invalida la compra, simplemente queda sin atribución.
const CANALES_VALIDOS = new Set<string>(CANALES);

function textoOrigen(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim().toLowerCase().slice(0, 80);
  return v || null;
}

// Date.now() alone can collide between two concurrent checkouts in the same
// millisecond, and commerceOrder is a unique key.
function newCommerceOrder(): string {
  return `MM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function POST(req: Request) {
  const gateway = gatewayActiva();

  if (!gateway) {
    return NextResponse.json(
      {
        message:
          "El pago online aún no está conectado. Falta configurar las credenciales de la pasarela (MP_ACCESS_TOKEN de Mercado Pago).",
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
    sessionId?: string;
    origenVisita?: { canal?: string; fuente?: string; campana?: string };
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
      // Con seguimiento de inventario activado, no se vende más de lo que hay.
      if (product.trackStock && variant.stock < line.qty) {
        return NextResponse.json(
          { message: `Solo quedan ${variant.stock} unidades de "${product.name} — ${variant.name}".` },
          { status: 400 },
        );
      }
    }

    // Un carrito guardado antes de que existiera la pregunta, o un valor que no
    // está en la lista, queda como "Decidir más tarde": el equipo la confirma con
    // el cliente antes de fabricar, así que no hay razón para botar la compra.
    const terminacion = normalizarTerminacion(line.terminacion);

    subtotal += unitPrice * line.qty;
    lines.push({
      productId: product.id,
      variantId: line.variantId,
      productName: product.name,
      variantName: nombreVarianteConTerminacion(variantName, terminacion),
      terminacion,
      unitPrice,
      qty: line.qty,
    });
  }

  if (subtotal <= 0) {
    return NextResponse.json({ message: "El monto del pedido no es válido." }, { status: 400 });
  }

  // El descuento se resuelve contra la tabla, no contra lo que diga el carrito:
  // un código inventado, vencido o agotado vale cero.
  const descuentoAplicable = body.codigo ? await validarCodigo(body.codigo) : null;
  const totales = calcTotales({
    subtotal,
    descuento: montoDescuento(subtotal, descuentoAplicable),
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
  const canalVisita = typeof body.origenVisita?.canal === "string"
    ? body.origenVisita.canal.trim().toLowerCase()
    : "";

  await createPendingOrder({
    commerceOrder,
    gateway,
    sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 60) || null : null,
    origenCanal: CANALES_VALIDOS.has(canalVisita) ? canalVisita : null,
    origenFuente: textoOrigen(body.origenVisita?.fuente),
    origenCampana: textoOrigen(body.origenVisita?.campana),
    subtotal: totales.subtotal,
    discountCode: totales.descuento > 0 ? (descuentoAplicable?.codigo ?? null) : null,
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
    const { redirectUrl } = await crearLinkPago({
      commerceOrder,
      titulo: `Compra Mundo Macetero (${lines.length} productos)`,
      amount: totales.total,
      email: body.customer.email,
    });
    return NextResponse.json({ redirectUrl });
  } catch {
    // The pending order stays in the database as evidence of the attempt.
    return NextResponse.json(
      { message: "La pasarela rechazó la solicitud de pago. Revisa las credenciales del comercio." },
      { status: 502 },
    );
  }
}
