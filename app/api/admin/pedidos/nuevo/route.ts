import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSessionUser } from "../../../../../lib/admin/auth";
import { getProductBySlug } from "../../../../../queries/catalog";
import { createPendingOrder, type NewOrderLine } from "../../../../../queries/orders";
import { registrarEvento } from "../../../../../queries/admin";
import { crearLinkPago, gatewayActiva } from "../../../../../lib/pagos";
import { calcTotales, type Entrega } from "../../../../../lib/pricing";
import { montoDescuento, validarCodigo } from "../../../../../lib/descuentos";

// Venta manual: pedidos que el equipo toma por WhatsApp o teléfono y carga desde
// el panel. Queda como un pedido normal en estado 'pending' con origen 'manual'.
//
// SECURITY: aunque quien envía el formulario es alguien del equipo con sesión, los
// precios, el envío y el descuento se recalculan igual acá contra la base. Así un
// pedido manual nunca puede quedar con un total que no corresponde al catálogo,
// sea por error de tipeo o por una petición manipulada.
//
// A diferencia del checkout de la tienda, la falta de pasarela configurada NO es
// un 503: el pedido se crea igual y queda pendiente, cobrable por transferencia
// desde el detalle. El link de pago es un extra, no un requisito.

export const dynamic = "force-dynamic";

interface LineaRequest {
  productSlug: string;
  variantId: number | null;
  qty: number;
}

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";
const MAX_QTY_PER_LINE = 50;

function newCommerceOrder(): string {
  return `MM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function POST(req: Request) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  let body: {
    items?: LineaRequest[];
    customer?: {
      email?: string;
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
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: "El pedido no tiene productos." }, { status: 400 });
  }
  const email = body.customer?.email?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ message: "Falta el correo del cliente." }, { status: 400 });
  }

  const entrega: Entrega = body.entrega === "despacho" ? "despacho" : "retiro";
  if (entrega === "despacho" && !body.customer?.city?.trim()) {
    return NextResponse.json({ message: "Falta la comuna de despacho." }, { status: 400 });
  }

  // Subtotal reconstruido desde la base, una fila por línea del pedido.
  let subtotal = 0;
  const lines: NewOrderLine[] = [];
  for (const line of items) {
    if (
      typeof line?.productSlug !== "string" ||
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
          {
            message: `Solo quedan ${variant.stock} unidades de "${product.name} — ${variant.name}".`,
          },
          { status: 400 },
        );
      }
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

  // El código se resuelve contra la tabla: uno inventado, vencido o agotado vale cero.
  const descuentoAplicable = body.codigo ? await validarCodigo(body.codigo) : null;
  const totales = calcTotales({
    subtotal,
    descuento: montoDescuento(subtotal, descuentoAplicable),
    entrega,
    region: body.customer?.region ?? "",
    comuna: body.customer?.city ?? "",
  });

  if (totales.total <= 0) {
    return NextResponse.json({ message: "El monto del pedido no es válido." }, { status: 400 });
  }

  const commerceOrder = newCommerceOrder();
  const pedido = await createPendingOrder({
    commerceOrder,
    subtotal: totales.subtotal,
    discountCode: totales.descuento > 0 ? (descuentoAplicable?.codigo ?? null) : null,
    discountAmount: totales.descuento,
    shippingLabel: totales.envio.label,
    shippingCost: totales.envio.monto,
    amount: totales.total,
    entrega,
    origen: "manual",
    gateway: gatewayActiva() ?? "manual",
    customer: {
      name: body.customer?.name ?? "",
      email,
      phone: body.customer?.phone ?? "",
      address: body.customer?.address ?? "",
      city: body.customer?.city ?? "",
      region: body.customer?.region ?? "",
      note: body.customer?.note ?? "",
    },
    lines,
  });

  await registrarEvento(
    pedido.id,
    usuario.id,
    "nota",
    "Pedido creado manualmente desde el panel",
  );

  if (!gatewayActiva()) {
    return NextResponse.json({ ok: true, commerceOrder, linkPago: null });
  }

  try {
    const { redirectUrl } = await crearLinkPago({
      commerceOrder,
      titulo: `Compra Mundo Macetero (${lines.length} productos)`,
      amount: totales.total,
      email,
    });
    return NextResponse.json({ ok: true, commerceOrder, linkPago: redirectUrl });
  } catch (error) {
    // El pedido ya existe: se devuelve como creado y sin link, para cobrarlo por
    // transferencia o reintentar. Sin datos del cliente en el log.
    console.error(
      "creación de link de pago falló en venta manual:",
      error instanceof Error ? error.message : "error desconocido",
    );
    return NextResponse.json({
      ok: true,
      commerceOrder,
      linkPago: null,
      aviso: "La pasarela rechazó la creación del link. El pedido quedó pendiente y se puede cobrar por transferencia.",
    });
  }
}
