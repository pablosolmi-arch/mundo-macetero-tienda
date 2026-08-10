import Link from "next/link";
import type { Metadata } from "next";
import { getOrderWithItems } from "../../../queries/orders";
import { formatCLP } from "../../../lib/format";
import { ClearCartOnPaid } from "../../../components/cart/ClearCartOnPaid";

export const metadata: Metadata = { title: "Estado de tu pedido" };
export const dynamic = "force-dynamic";

// Flow sends the customer back through /api/checkout/return, which settles the
// order and forwards `pedido` + `estado` here. The real order is then read from
// the database, so this page reports what was actually recorded and charged
// rather than trusting the query string.

const COPY: Record<string, { title: string; body: string; icon: string; iconBg: string }> = {
  paid: {
    title: "¡Gracias por tu compra!",
    body: "Recibimos tu pago. Te contactaremos para coordinar el envío o retiro.",
    icon: "✓",
    iconBg: "#4c7a4c",
  },
  pending: {
    title: "Tu pago está pendiente",
    body: "Flow aún no confirma el pago. Si pagaste con transferencia o cupón puede tardar un momento; te avisaremos en cuanto se acredite.",
    icon: "…",
    iconBg: "#a5613f",
  },
  rejected: {
    title: "Tu pago fue rechazado",
    body: "No pudimos procesar el pago y no se realizó ningún cobro. Puedes intentar de nuevo con otro medio de pago.",
    icon: "✕",
    iconBg: "#8f4a2b",
  },
  annulled: {
    title: "El pago fue anulado",
    body: "La transacción se anuló y no se realizó ningún cobro.",
    icon: "✕",
    iconBg: "#8f4a2b",
  },
};

const FALLBACK = {
  title: "Recibimos tu pedido",
  body: "Estamos confirmando el estado del pago con Flow. Te contactaremos por correo.",
  icon: "…",
  iconBg: "#a5613f",
};

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const pedidoRef = typeof params.pedido === "string" ? params.pedido : null;
  const order = pedidoRef ? await getOrderWithItems(pedidoRef) : null;

  const estado = order?.status ?? (typeof params.estado === "string" ? params.estado : "desconocido");
  const copy = COPY[estado] ?? FALLBACK;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "60px 24px 80px" }}>
      {estado === "paid" && <ClearCartOnPaid />}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "16px",
          padding: "36px",
          textAlign: "center",
          animation: "mmUp .3s ease",
        }}
      >
        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            background: copy.iconBg,
            color: "#fff",
            fontSize: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          {copy.icon}
        </div>
        <h1 className="font-display" style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 6px" }}>
          {copy.title}
        </h1>
        {order && (
          <div style={{ fontSize: "14px", color: "#6f6c66", marginBottom: "22px" }}>
            Pedido <span style={{ fontWeight: 700, color: "#2a2925" }}>{order.commerceOrder}</span> ·{" "}
            {order.createdAt.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}

        {order && (
          <div style={{ textAlign: "left", borderTop: "1px solid #e9e6e1", paddingTop: "14px" }}>
            {order.items.map((it) => (
              <div
                key={it.id}
                style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13.5px", padding: "6px 0" }}
              >
                <span style={{ color: "#4c4944" }}>
                  {it.productName} <span style={{ color: "#9b978f" }}>× {it.qty}</span>
                  {it.variantName && it.variantName !== "Default Title" && (
                    <>
                      <br />
                      <span style={{ fontSize: "11.5px", color: "#9b978f" }}>{it.variantName}</span>
                    </>
                  )}
                </span>
                <span style={{ fontWeight: 600 }}>{formatCLP(Number(it.unitPrice) * it.qty)}</span>
              </div>
            ))}

            {Number(order.discountAmount) > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                  padding: "6px 0",
                  color: "#4c7a4c",
                }}
              >
                <span>Descuento {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <span style={{ fontWeight: 600 }}>−{formatCLP(Number(order.discountAmount))}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: 700,
                borderTop: "1px solid #e9e6e1",
                marginTop: "8px",
                paddingTop: "12px",
              }}
            >
              <span>Total</span>
              <span>{formatCLP(Number(order.amount))}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#6f6c66", marginTop: "6px" }}>
              Entrega: {order.shippingLabel || "Retiro en tienda"}
              {Number(order.shippingCost) > 0 ? ` — ${formatCLP(Number(order.shippingCost))}` : ""}
            </div>
          </div>
        )}

        <div
          style={{
            background: "#f0ece5",
            borderRadius: "10px",
            padding: "13px 16px",
            fontSize: "13px",
            color: "#4c4944",
            margin: "20px 0",
            textAlign: "left",
          }}
        >
          {copy.body}
          {order && (
            <>
              {" "}
              Te escribiremos a <span style={{ fontWeight: 700 }}>{order.customerEmail}</span>.
            </>
          )}
        </div>

        <Link
          href="/tienda"
          className="mm-btn-dark"
          style={{
            display: "inline-block",
            padding: "13px 28px",
            borderRadius: "9px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
