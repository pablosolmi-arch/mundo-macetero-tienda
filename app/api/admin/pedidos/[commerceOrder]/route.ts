import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../../../db/client";
import { orders } from "../../../../../db/schema";
import { getSessionUser } from "../../../../../lib/admin/auth";
import { obtenerPedido, registrarEvento } from "../../../../../queries/admin";
import { settleOrder } from "../../../../../queries/orders";
import { alPagarse } from "../../../../../lib/pedidos";
import { createRefund, getFlowCredentials } from "../../../../../lib/flow";
import { getMPCredentials, reembolsarPago } from "../../../../../lib/mercadopago";
import { getTBKCredentials, reembolsarTransaccion } from "../../../../../lib/transbank";
import { correoReembolso } from "../../../../../lib/email";

// Acciones del panel sobre un pedido. Todas exigen sesión y quedan en la bitácora
// con el usuario que las hizo.
//
// El reembolso es la única que mueve dinero: primero se reserva el monto en el
// pedido con una condición atómica, después se pide a Flow, y si Flow lo rechaza
// se libera la reserva. Si no hay credenciales, responde 503 en vez de fingir.

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

  // El pedido está armado y listo para entregar. Paso intermedio entre "por
  // preparar" y "entregado": el equipo prepara en el galpón y despacha después.
  if (accion === "preparado") {
    if (pedido.status !== "paid") {
      return NextResponse.json(
        { message: "Solo se puede marcar preparado un pedido pagado." },
        { status: 400 },
      );
    }
    if (pedido.fulfillment !== "pendiente") {
      return NextResponse.json(
        { message: "Este pedido ya salió de por preparar." },
        { status: 400 },
      );
    }
    await db
      .update(orders)
      .set({ fulfillment: "preparado", preparadoAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, pedido.id));
    await registrarEvento(pedido.id, usuario.id, "preparado", detalle);
    return NextResponse.json({ ok: true });
  }

  if (accion === "entregado") {
    if (pedido.status !== "paid") {
      return NextResponse.json(
        { message: "Solo se puede marcar entregado un pedido pagado." },
        { status: 400 },
      );
    }
    // Se puede entregar desde por preparar o desde preparado: un retiro en
    // tienda a veces se arma y se entrega en el mismo movimiento.
    if (pedido.fulfillment !== "pendiente" && pedido.fulfillment !== "preparado") {
      return NextResponse.json(
        { message: "Este pedido no está en un estado que se pueda entregar." },
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
      .set({
        fulfillment: "pendiente",
        deliveredAt: null,
        preparadoAt: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, pedido.id));
    await registrarEvento(pedido.id, usuario.id, "nota", "Se volvió a dejar por preparar");
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

  // Cobro fuera de Flow (transferencia): se usa en las ventas manuales que no se
  // pagaron con el link. settleOrder hace la transición atómica, así que los
  // efectos de "pagado" (correos, cupo del descuento, inventario) corren una sola
  // vez aunque dos personas del equipo aprieten el botón a la vez.
  if (accion === "pago-manual") {
    if (pedido.status !== "pending") {
      return NextResponse.json(
        { message: "Solo se puede marcar pagado un pedido pendiente." },
        { status: 400 },
      );
    }
    const settled = await settleOrder({
      commerceOrder: pedido.commerceOrder,
      status: "paid",
      paymentMedia: "transferencia",
    });
    if (!settled) return NextResponse.json({ message: "Pedido no encontrado." }, { status: 404 });

    if (settled.seVolvioPagado) {
      await alPagarse(settled.order);
      await registrarEvento(
        pedido.id,
        usuario.id,
        "pago",
        "Marcado pagado manualmente (transferencia)",
      );
    }
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

    // Mercado Pago no permite devolver por API los pagos hechos por transferencia
    // bancaria (Fintoc): responde 403 sin más explicación. Se avisa antes de
    // intentar, con el camino manual, en vez de dejar un error críptico.
    if (pedido.gateway === "mercadopago" && /fintoc|transfer|bank/i.test(pedido.paymentMedia ?? "")) {
      return NextResponse.json(
        {
          message:
            "Este pago se hizo por transferencia bancaria (Fintoc) y Mercado Pago no permite devolverlo desde acá. Devuélvelo desde el panel de Mercado Pago (Actividad → el pago → Devolver dinero) y deja una nota interna en el pedido.",
        },
        { status: 400 },
      );
    }

    // El reembolso va contra la pasarela que cobró ESTE pedido.
    if (pedido.gateway === "manual") {
      return NextResponse.json(
        { message: "Este pedido se cobró por transferencia: la devolución se hace por transferencia y se anota como nota." },
        { status: 400 },
      );
    }
    const credsMP = pedido.gateway === "mercadopago" ? getMPCredentials() : null;
    const credsTBK = pedido.gateway === "transbank" ? getTBKCredentials() : null;
    const credsFlow = pedido.gateway === "flow" ? getFlowCredentials() : null;
    if (!credsMP && !credsTBK && !credsFlow) {
      const faltante =
        pedido.gateway === "mercadopago"
          ? "Mercado Pago (MP_ACCESS_TOKEN)"
          : pedido.gateway === "transbank"
            ? "Transbank (TBK_COMMERCE_CODE y TBK_API_KEY)"
            : "Flow";
      return NextResponse.json(
        { message: `No se puede reembolsar: faltan las credenciales de ${faltante}.` },
        { status: 503 },
      );
    }

    const importe = Math.round(monto);
    const referencia = `RF-${pedido.commerceOrder}-${crypto.randomBytes(3).toString("hex")}`;

    // Se reserva el monto ANTES de llamar a Flow, con una condición en la misma
    // sentencia. Si dos personas del equipo reembolsan a la vez, la segunda no
    // pasa de acá: leer el saldo y después escribirlo dejaba una ventana para
    // devolver dos veces el mismo dinero.
    const reservado = await db
      .update(orders)
      .set({
        refundedAmount: sql`${orders.refundedAmount} + ${importe}`,
        refundedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, pedido.id),
          sql`${orders.refundedAmount} + ${importe} <= ${orders.amount}`,
        ),
      )
      .returning({ id: orders.id });

    if (reservado.length === 0) {
      return NextResponse.json(
        { message: "Otro reembolso dejó el pedido sin saldo disponible. Recarga la página." },
        { status: 409 },
      );
    }

    try {
      let refTexto = referencia;
      let estadoRef: string | null = null;
      if (credsMP) {
        // El id del pago MP quedó guardado en flowOrder al asentarse.
        if (!pedido.flowOrder) throw new Error("pedido sin id de pago de Mercado Pago");
        const r = await reembolsarPago(credsMP, pedido.flowOrder, importe, referencia);
        refTexto = String(r.id);
        estadoRef = r.status ?? null;
      } else if (credsTBK) {
        // Webpay reembolsa contra el token de la transacción, que quedó guardado
        // en flowToken al asentarse el pedido en el retorno.
        if (!pedido.flowToken) throw new Error("pedido sin token de Webpay");
        const r = await reembolsarTransaccion(credsTBK, pedido.flowToken, importe);
        // REVERSED (reversa del día) y NULLIFIED (anulación) son los dos éxitos.
        if (r.type !== "REVERSED" && r.type !== "NULLIFIED") {
          throw new Error(`Webpay respondió type ${r.type ?? "sin type"}`);
        }
        refTexto = r.authorization_code ?? referencia;
        estadoRef = r.type ?? null;
      } else if (credsFlow) {
        const r = await createRefund(credsFlow, {
          refundCommerceOrder: referencia,
          receiverEmail: pedido.customerEmail,
          amount: importe,
          urlCallBack: `${SITE_URL}/api/checkout/confirm`,
          commerceTrxId: pedido.commerceOrder,
        });
        refTexto = r.token ?? referencia;
        estadoRef = r.status ?? null;
      }
      const refund = { status: estadoRef };
      await db
        .update(orders)
        .set({ refundReference: refTexto, updatedAt: new Date() })
        .where(eq(orders.id, pedido.id));
      const nombrePasarela =
        pedido.gateway === "mercadopago"
          ? "Mercado Pago"
          : pedido.gateway === "transbank"
            ? "Transbank"
            : "Flow";
      await registrarEvento(
        pedido.id,
        usuario.id,
        "reembolsado",
        `${importe} solicitado a ${nombrePasarela} (${refund.status ?? "sin estado"})${detalle ? ` · ${detalle}` : ""}`,
      );
      // Avisar al cliente. Si el correo falla, el reembolso ya está hecho: solo
      // queda constancia en la bitácora.
      const correo = await correoReembolso({ ...pedido, items: pedido.items }, importe, nombrePasarela);
      if (!correo.enviado) {
        await registrarEvento(pedido.id, null, "correo", `reembolso: ${correo.detalle}`);
      }
      return NextResponse.json({ ok: true, estado: refund.status ?? null });
    } catch (error) {
      // Flow no aceptó: se libera la reserva para que el saldo vuelva a estar
      // disponible y el pedido quede como si nada hubiera pasado.
      await db
        .update(orders)
        .set({ refundedAmount: sql`${orders.refundedAmount} - ${importe}`, updatedAt: new Date() })
        .where(eq(orders.id, pedido.id));
      // Sin datos del cliente en el log; el motivo de la pasarela sí queda en la
      // bitácora del pedido, que es donde el equipo lo va a buscar.
      const motivo = error instanceof Error ? error.message : "error desconocido";
      console.error("reembolso falló:", motivo);
      await registrarEvento(pedido.id, usuario.id, "reembolso_fallido", `${importe} · ${motivo}`);
      return NextResponse.json(
        { message: `La pasarela rechazó el reembolso. No se registró ninguna devolución. Motivo: ${motivo}` },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ message: "Acción desconocida." }, { status: 400 });
}
