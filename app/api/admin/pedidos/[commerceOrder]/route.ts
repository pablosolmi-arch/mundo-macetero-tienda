import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../../../../db/client";
import { orders } from "../../../../../db/schema";
import { getSessionUser } from "../../../../../lib/admin/auth";
import { obtenerPedido, registrarEvento } from "../../../../../queries/admin";
import { createRefund, getFlowCredentials } from "../../../../../lib/flow";

// Acciones del panel sobre un pedido. Todas exigen sesión y quedan en la bitácora
// con el usuario que las hizo.
//
// El reembolso es la única que mueve dinero: se pide a Flow y solo si Flow acepta
// se anota en el pedido. Si no hay credenciales, responde 503 en vez de fingir.

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export async function POST(req: Request, { params }: { params: Promise<{ commerceOrder: string }> }) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  const { commerceOrder } = await params;
  const pedido = await obtenerPedido(commerceOrder);
  if (!pedido) return NextResponse.json({ message: "Pedido no encontrado." }, { status: 404 });

  let accion = "";
  let detalle = "";
  let monto = 0;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    accion = typeof body.accion === "string" ? body.accion : "";
    detalle = typeof body.detalle === "string" ? body.detalle.slice(0, 1000) : "";
    monto = Number(body.monto ?? 0);
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (accion === "entregado") {
    if (pedido.status !== "paid") {
      return NextResponse.json(
        { message: "Solo se puede marcar entregado un pedido pagado." },
        { status: 400 },
      );
    }
    await db
      .update(orders)
      .set({ fulfillment: "entregado", deliveredAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, pedido.id));
    await registrarEvento(pedido.id, usuario.id, "entregado", detalle);
    return NextResponse.json({ ok: true });
  }

  if (accion === "pendiente") {
    await db
      .update(orders)
      .set({ fulfillment: "pendiente", deliveredAt: null, updatedAt: new Date() })
      .where(eq(orders.id, pedido.id));
    await registrarEvento(pedido.id, usuario.id, "nota", "Se revirtió la entrega");
    return NextResponse.json({ ok: true });
  }

  if (accion === "cancelado") {
    await db
      .update(orders)
      .set({ fulfillment: "cancelado", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, pedido.id));
    await registrarEvento(pedido.id, usuario.id, "cancelado", detalle);
    return NextResponse.json({ ok: true });
  }

  if (accion === "nota") {
    if (!detalle.trim()) {
      return NextResponse.json({ message: "La nota está vacía." }, { status: 400 });
    }
    await registrarEvento(pedido.id, usuario.id, "nota", detalle);
    return NextResponse.json({ ok: true });
  }

  if (accion === "reembolso") {
    if (pedido.status !== "paid") {
      return NextResponse.json({ message: "El pedido no está pagado." }, { status: 400 });
    }
    const yaDevuelto = Number(pedido.refundedAmount);
    const disponible = Number(pedido.amount) - yaDevuelto;
    if (!Number.isFinite(monto) || monto <= 0 || monto > disponible) {
      return NextResponse.json(
        { message: `El monto debe estar entre 1 y ${Math.round(disponible)}.` },
        { status: 400 },
      );
    }

    const creds = getFlowCredentials();
    if (!creds) {
      return NextResponse.json(
        {
          message:
            "No se puede reembolsar: faltan las credenciales de Flow (FLOW_API_KEY, FLOW_SECRET).",
        },
        { status: 503 },
      );
    }

    const referencia = `RF-${pedido.commerceOrder}-${crypto.randomBytes(3).toString("hex")}`;
    try {
      const refund = await createRefund(creds, {
        refundCommerceOrder: referencia,
        receiverEmail: pedido.customerEmail,
        amount: Math.round(monto),
        urlCallBack: `${SITE_URL}/api/checkout/confirm`,
        commerceTrxId: pedido.commerceOrder,
      });
      await db
        .update(orders)
        .set({
          refundedAmount: String(yaDevuelto + Math.round(monto)),
          refundedAt: new Date(),
          refundReference: refund.token ?? referencia,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, pedido.id));
      await registrarEvento(
        pedido.id,
        usuario.id,
        "reembolsado",
        `${Math.round(monto)} solicitado a Flow (${refund.status ?? "sin estado"})${detalle ? ` · ${detalle}` : ""}`,
      );
      return NextResponse.json({ ok: true, estado: refund.status ?? null });
    } catch (error) {
      // Sin datos del cliente en el log.
      console.error(
        "flow refund/create falló:",
        error instanceof Error ? error.message : "error desconocido",
      );
      return NextResponse.json(
        { message: "Flow rechazó el reembolso. No se registró ninguna devolución." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ message: "Acción desconocida." }, { status: 400 });
}
