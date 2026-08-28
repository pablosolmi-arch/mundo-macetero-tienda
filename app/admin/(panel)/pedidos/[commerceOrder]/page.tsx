import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPedido, resumenConversion } from "../../../../../queries/admin";
import { formatCLP } from "../../../../../lib/format";
import { codigoPedido } from "../../../../../lib/pedido-codigo";
import {
  etiquetaPago,
  etiquetaPreparacion,
  nombreEvento,
  textoOrigen,
} from "../../../../../lib/pedido-vista";
import { Etiqueta } from "../../../../../components/admin/Etiqueta";
import { AccionesPedido } from "../../../../../components/admin/AccionesPedido";
import { esPendiente } from "../../../../../content/terminaciones";

export const dynamic = "force-dynamic";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "20px",
};

const TITULO: React.CSSProperties = { fontSize: "14px", fontWeight: 600, margin: "0 0 12px" };

const BOTON_SECUNDARIO: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  border: "1px solid #d8d5cf",
  background: "#fff",
  color: "#2a2925",
};

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "16px",
        padding: "5px 0",
        fontSize: "13.5px",
      }}
    >
      <span style={{ color: "#6f6c66" }}>{etiqueta}</span>
      <span style={{ textAlign: "right" }}>{valor}</span>
    </div>
  );
}

export default async function AdminPedidoDetalle({
  params,
}: {
  params: Promise<{ commerceOrder: string }>;
}) {
  const { commerceOrder } = await params;
  const pedido = await obtenerPedido(commerceOrder);
  if (!pedido) notFound();

  const conversion = await resumenConversion(pedido);

  const total = Number(pedido.amount);
  const devuelto = Number(pedido.refundedAmount);
  const disponible = Math.max(0, total - devuelto);
  const codigo = codigoPedido(pedido.numero, pedido.createdAt);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Link href="/admin/pedidos" style={{ fontSize: "13px", color: "#a5613f", fontWeight: 600 }}>
        ← Pedidos
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          margin: "10px 0 4px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 className="font-display" style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>
              {codigo}
            </h1>
            <Etiqueta {...etiquetaPago(pedido.status)} />
            {(pedido.status === "paid" || pedido.fulfillment === "cancelado") && (
              <Etiqueta {...etiquetaPreparacion(pedido.fulfillment)} />
            )}
          </div>
          <div style={{ fontSize: "13.5px", color: "#6f6c66", marginTop: "5px" }}>
            {pedido.createdAt.toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" })} ·{" "}
            {pedido.origen === "manual" ? "Manual" : "Tienda online"}
          </div>
          <div style={{ fontSize: "12px", color: "#9b978f", marginTop: "3px" }}>
            Referencia de pago: {pedido.commerceOrder}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href={`/admin/pedidos/${pedido.commerceOrder}/imprimir`}
            target="_blank"
            style={BOTON_SECUNDARIO}
          >
            Imprimir
          </Link>
          <Link
            href={`/admin/pedidos/nuevo?desde=${encodeURIComponent(pedido.commerceOrder)}`}
            style={BOTON_SECUNDARIO}
          >
            Duplicar
          </Link>
        </div>
      </div>

      {devuelto > 0 && (
        <div style={{ fontSize: "13px", color: "#8f4a2b", fontWeight: 600, margin: "8px 0" }}>
          Reembolsado {formatCLP(devuelto)}
          {pedido.refundReference ? ` · ref ${pedido.refundReference}` : ""}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px",
          marginTop: "18px",
        }}
      >
        <div style={TARJETA}>
          <h2 className="font-display" style={TITULO}>
            Productos
          </h2>
          {pedido.items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                padding: "7px 0",
                borderBottom: "1px solid #f0eeea",
                fontSize: "13.5px",
              }}
            >
              <span>
                {it.productName} <span style={{ color: "#9b978f" }}>× {it.qty}</span>
                {it.variantName && it.variantName !== "Default Title" && (
                  <div style={{ fontSize: "12px", color: "#9b978f" }}>{it.variantName}</div>
                )}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatCLP(Number(it.unitPrice) * it.qty)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: "10px" }}>
            <Fila etiqueta="Subtotal" valor={formatCLP(Number(pedido.subtotal))} />
            {Number(pedido.discountAmount) > 0 && (
              <Fila
                etiqueta={`Descuento ${pedido.discountCode ?? ""}`}
                valor={`−${formatCLP(Number(pedido.discountAmount))}`}
              />
            )}
            <Fila
              etiqueta="Envío"
              valor={
                Number(pedido.shippingCost) > 0
                  ? formatCLP(Number(pedido.shippingCost))
                  : "Sin cargo"
              }
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #e9e6e1",
                marginTop: "8px",
                paddingTop: "10px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{formatCLP(total)}</span>
            </div>
          </div>
        </div>

        <div style={TARJETA}>
          <h2 className="font-display" style={TITULO}>
            Cliente y entrega
          </h2>
          <Fila etiqueta="Nombre" valor={pedido.customerName || "Sin nombre"} />
          <Fila
            etiqueta="Correo"
            valor={
              <Link
                href={`/admin/clientes/${encodeURIComponent(pedido.customerEmail)}`}
                style={{ color: "#a5613f", fontWeight: 600 }}
              >
                {pedido.customerEmail}
              </Link>
            }
          />
          <Fila etiqueta="Teléfono" valor={pedido.customerPhone || "Sin teléfono"} />
          <Fila
            etiqueta="Modalidad"
            valor={pedido.entrega === "retiro" ? "Retiro en tienda" : "Despacho"}
          />
          {pedido.entrega === "despacho" && (
            <>
              <Fila etiqueta="Dirección" valor={pedido.shippingAddress || "Sin dirección"} />
              <Fila etiqueta="Comuna" valor={pedido.shippingCity || "Sin comuna"} />
              <Fila etiqueta="Región" valor={pedido.shippingRegion || "Sin región"} />
            </>
          )}
          {pedido.shippingLabel && <Fila etiqueta="Despacho" valor={pedido.shippingLabel} />}
          {pedido.note && <Fila etiqueta="Indicaciones" valor={pedido.note} />}
          {pedido.flowOrder && <Fila etiqueta="Orden Flow" valor={pedido.flowOrder} />}
          {pedido.paidAt && (
            <Fila
              etiqueta="Pagado el"
              valor={pedido.paidAt.toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            />
          )}
          {pedido.preparadoAt && (
            <Fila
              etiqueta="Preparado el"
              valor={pedido.preparadoAt.toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            />
          )}
          {pedido.deliveredAt && (
            <Fila
              etiqueta="Entregado el"
              valor={pedido.deliveredAt.toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            />
          )}
        </div>
      </div>

      <div style={{ ...TARJETA, marginTop: "16px" }}>
        <h2 className="font-display" style={TITULO}>
          Resumen de conversión
        </h2>
        <Fila
          etiqueta="Historial del cliente"
          valor={
            conversion.numeroDelCliente === 1
              ? "Es su primer pedido"
              : `Este es su pedido número ${conversion.numeroDelCliente}`
          }
        />
        <Fila etiqueta="Origen" valor={textoOrigen(pedido)} />
        <Fila
          etiqueta="Sesiones antes de comprar"
          valor={
            conversion.sesionesAntes == null
              ? "Sin sesión asociada"
              : String(conversion.sesionesAntes)
          }
        />
      </div>

      {pedido.items.some((it) => esPendiente(it.terminacion)) && (
        <div
          style={{
            marginTop: "16px",
            padding: "13px 16px",
            borderRadius: "12px",
            border: "1px solid #e6cf9a",
            background: "#fbf3df",
            color: "#8a6a2b",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Terminación pendiente: confirmar con el cliente antes de fabricar
        </div>
      )}

      <div style={{ ...TARJETA, marginTop: "16px" }}>
        <h2 className="font-display" style={TITULO}>
          Acciones
        </h2>
        <AccionesPedido
          commerceOrder={pedido.commerceOrder}
          pagado={pedido.status === "paid"}
          pendiente={pedido.status === "pending"}
          preparado={pedido.fulfillment === "preparado"}
          entregado={pedido.fulfillment === "entregado"}
          cancelado={pedido.fulfillment === "cancelado"}
          disponibleParaReembolso={disponible}
          nombrePasarela={
            pedido.gateway === "mercadopago"
              ? "Mercado Pago"
              : pedido.gateway === "transbank"
                ? "Transbank"
                : pedido.gateway === "flow"
                  ? "Flow"
                  : "pago manual"
          }
        />
      </div>

      <div style={{ ...TARJETA, marginTop: "16px" }}>
        <h2 className="font-display" style={TITULO}>
          Historial
        </h2>
        {pedido.eventos.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#9b978f" }}>Sin movimientos registrados.</div>
        ) : (
          pedido.eventos.map((e) => (
            <div
              key={e.id}
              style={{ fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #f0eeea" }}
            >
              <span style={{ fontWeight: 600 }}>{nombreEvento(e.tipo)}</span>
              {e.detalle && <span style={{ color: "#6f6c66" }}> · {e.detalle}</span>}
              <span style={{ color: "#9b978f" }}>
                {" "}
                · {e.createdAt.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                {/* Sin autor son los movimientos automáticos (correos, pagos de la pasarela). */}
                {(e.autor ?? e.autorEmail) ? ` · ${e.autor ?? e.autorEmail}` : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
