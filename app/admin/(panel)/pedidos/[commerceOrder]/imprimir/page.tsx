import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPedido } from "../../../../../../queries/admin";
import { formatCLP } from "../../../../../../lib/format";
import { codigoPedido } from "../../../../../../lib/pedido-codigo";
import { TIENDA } from "../../../../../../content/site";
import { BotonImprimir } from "../../../../../../components/admin/BotonImprimir";

export const dynamic = "force-dynamic";

// Nota de entrega para meter en la caja. La barra del panel y los botones llevan
// la clase mm-no-print, así que en el papel solo sale la hoja.

const CELDA: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #e9e6e1",
  fontSize: "13px",
  textAlign: "left",
  verticalAlign: "top",
};

const CELDA_DER: React.CSSProperties = { ...CELDA, textAlign: "right", whiteSpace: "nowrap" };

const ETIQUETA: React.CSSProperties = { fontSize: "11.5px", color: "#6f6c66", fontWeight: 600 };

function Bloque({ titulo, lineas }: { titulo: string; lineas: string[] }) {
  return (
    <div>
      <div style={{ ...ETIQUETA, marginBottom: "5px" }}>{titulo}</div>
      {lineas.map((linea) => (
        <div key={linea} style={{ fontSize: "13px", lineHeight: 1.5 }}>
          {linea}
        </div>
      ))}
    </div>
  );
}

export default async function ImprimirPedido({
  params,
}: {
  params: Promise<{ commerceOrder: string }>;
}) {
  const { commerceOrder } = await params;
  const pedido = await obtenerPedido(commerceOrder);
  if (!pedido) notFound();

  const codigo = codigoPedido(pedido.numero, pedido.createdAt);
  const total = Number(pedido.amount);

  const entrega =
    pedido.entrega === "retiro"
      ? ["Retiro en tienda", TIENDA.direccion, TIENDA.horario]
      : [
          pedido.shippingLabel || "Despacho a domicilio",
          pedido.shippingAddress || "Sin dirección",
          [pedido.shippingCity, pedido.shippingRegion].filter(Boolean).join(", ") || "Sin comuna",
        ];

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto", background: "#fff" }}>
      <div
        className="mm-no-print"
        style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}
      >
        <Link
          href={`/admin/pedidos/${pedido.commerceOrder}`}
          style={{ fontSize: "13px", color: "#a5613f", fontWeight: 600 }}
        >
          ← Volver al pedido
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <BotonImprimir />
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "12px",
          padding: "28px 30px",
          color: "#2a2925",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            borderBottom: "2px solid #2a2925",
            paddingBottom: "14px",
          }}
        >
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-email.png"
              alt={TIENDA.nombre}
              style={{ height: "34px", width: "auto", display: "block" }}
            />
            <div style={{ fontSize: "11.5px", color: "#6f6c66", marginTop: "8px", lineHeight: 1.5 }}>
              {TIENDA.direccion}
              <br />
              {TIENDA.telefonos[0]} · {TIENDA.email}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-display" style={{ fontSize: "24px", fontWeight: 700 }}>
              {codigo}
            </div>
            <div style={{ fontSize: "12px", color: "#6f6c66", marginTop: "4px" }}>
              {pedido.createdAt.toLocaleString("es-CL", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </div>
            <div style={{ fontSize: "11px", color: "#9b978f", marginTop: "2px" }}>
              Referencia de pago: {pedido.commerceOrder}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            margin: "20px 0 22px",
          }}
        >
          <Bloque
            titulo="Cliente"
            lineas={[
              pedido.customerName || "Sin nombre",
              pedido.customerEmail,
              pedido.customerPhone || "Sin teléfono",
            ]}
          />
          <Bloque titulo="Entrega" lineas={entrega} />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...CELDA, ...ETIQUETA }}>Producto</th>
              <th style={{ ...CELDA_DER, ...ETIQUETA }}>Cantidad</th>
              <th style={{ ...CELDA_DER, ...ETIQUETA }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((it) => (
              <tr key={it.id}>
                <td style={CELDA}>
                  {it.productName}
                  {it.variantName && it.variantName !== "Default Title" && (
                    <div style={{ fontSize: "11.5px", color: "#6f6c66" }}>{it.variantName}</div>
                  )}
                </td>
                <td style={CELDA_DER}>{it.qty}</td>
                <td style={CELDA_DER}>{formatCLP(Number(it.unitPrice) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "14px", marginLeft: "auto", maxWidth: "260px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
            <span style={{ color: "#6f6c66" }}>Subtotal</span>
            <span>{formatCLP(Number(pedido.subtotal))}</span>
          </div>
          {Number(pedido.discountAmount) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
              <span style={{ color: "#6f6c66" }}>Descuento {pedido.discountCode ?? ""}</span>
              <span>−{formatCLP(Number(pedido.discountAmount))}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
            <span style={{ color: "#6f6c66" }}>Envío</span>
            <span>
              {Number(pedido.shippingCost) > 0
                ? formatCLP(Number(pedido.shippingCost))
                : "Sin cargo"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #2a2925",
              marginTop: "6px",
              paddingTop: "8px",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{formatCLP(total)}</span>
          </div>
        </div>

        {pedido.note && (
          <div style={{ marginTop: "20px" }}>
            <div style={ETIQUETA}>Indicaciones</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>{pedido.note}</div>
          </div>
        )}

        <div
          style={{
            marginTop: "26px",
            borderTop: "1px solid #e9e6e1",
            paddingTop: "12px",
            fontSize: "11.5px",
            color: "#6f6c66",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <span>Nota de entrega</span>
          <span>
            {TIENDA.nombre} · {codigo}
          </span>
        </div>
      </div>
    </div>
  );
}
