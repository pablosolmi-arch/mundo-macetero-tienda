import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerCliente } from "../../../../../queries/admin-clientes";
import { formatAntiguedad, formatCLP } from "../../../../../lib/format";
import { codigoPedido } from "../../../../../lib/pedido-codigo";
import { etiquetaPago, etiquetaPreparacion, lineaArticulo } from "../../../../../lib/pedido-vista";
import { Etiqueta } from "../../../../../components/admin/Etiqueta";

export const dynamic = "force-dynamic";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "18px 20px",
};

const TITULO: React.CSSProperties = { fontSize: "14px", fontWeight: 600, margin: "0 0 12px" };

const CELDA: React.CSSProperties = { padding: "10px 14px", verticalAlign: "top" };

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div style={TARJETA}>
      <div style={{ fontSize: "12px", color: "#6f6c66", marginBottom: "6px" }}>{etiqueta}</div>
      <div className="font-display" style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.1 }}>
        {valor}
      </div>
      {nota && <div style={{ fontSize: "12px", color: "#9b978f", marginTop: "4px" }}>{nota}</div>}
    </div>
  );
}

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

export default async function AdminClienteFicha({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  // El correo viaja codificado en la URL: puede traer "+" y otros caracteres.
  const { email } = await params;
  const cliente = await obtenerCliente(decodeURIComponent(email));
  if (!cliente) notFound();

  const ultimo = cliente.historial[0];
  const direccion = [cliente.direccion, cliente.comuna, cliente.region].filter(Boolean).join(", ");

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Link href="/admin/clientes" style={{ fontSize: "13px", color: "#a5613f", fontWeight: 600 }}>
        ← Clientes
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          margin: "10px 0 18px",
        }}
      >
        <div>
          <h1 className="font-display" style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>
            {cliente.nombre || "Sin nombre"}
          </h1>
          <div style={{ fontSize: "13.5px", color: "#6f6c66", marginTop: "4px" }}>
            {cliente.email}
          </div>
        </div>
        <Link
          href={`/admin/pedidos/nuevo?email=${encodeURIComponent(cliente.email)}`}
          style={{
            marginLeft: "auto",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            background: "#2a2925",
            color: "#fff",
          }}
        >
          Crear pedido
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <Dato
          etiqueta="Importe gastado"
          valor={formatCLP(cliente.totalGastado)}
          nota={`${cliente.pagados} pedidos pagados`}
        />
        <Dato etiqueta="Pedidos" valor={String(cliente.pedidos)} nota="incluye los no pagados" />
        <Dato
          etiqueta="Cliente desde"
          valor={cliente.primerPedido ? formatAntiguedad(cliente.primerPedido) : "-"}
          nota={
            cliente.primerPedido
              ? cliente.primerPedido.toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : undefined
          }
        />
        <Dato
          etiqueta="Ticket promedio"
          valor={cliente.pagados > 0 ? formatCLP(cliente.ticketPromedio) : "-"}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px",
        }}
      >
        <div style={TARJETA}>
          <h2 className="font-display" style={TITULO}>
            Datos de contacto
          </h2>
          <Fila etiqueta="Nombre" valor={cliente.nombre || "Sin nombre"} />
          <Fila etiqueta="Correo" valor={cliente.email} />
          <Fila etiqueta="Teléfono" valor={cliente.telefono || "Sin teléfono"} />
          <Fila
            etiqueta="Dirección predeterminada"
            valor={direccion || "Solo ha retirado en tienda"}
          />
          <Fila
            etiqueta="Suscrito al newsletter"
            valor={cliente.newsletter ? "Suscrito" : "No suscrito"}
          />
        </div>

        <div style={TARJETA}>
          <h2 className="font-display" style={TITULO}>
            Último pedido
          </h2>
          {!ultimo ? (
            <div style={{ fontSize: "13px", color: "#9b978f" }}>Todavía no tiene pedidos.</div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <Link
                  href={`/admin/pedidos/${ultimo.commerceOrder}`}
                  style={{ fontWeight: 700, color: "#a5613f", fontSize: "14px" }}
                >
                  {codigoPedido(ultimo.numero, ultimo.createdAt)}
                </Link>
                <Etiqueta {...etiquetaPago(ultimo.status)} />
                {(ultimo.status === "paid" || ultimo.fulfillment === "cancelado") && (
                  <Etiqueta {...etiquetaPreparacion(ultimo.fulfillment)} />
                )}
              </div>
              {ultimo.items.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#9b978f" }}>Sin artículos.</div>
              ) : (
                ultimo.items.map((it, i) => (
                  <div
                    key={`${it.productName}-${i}`}
                    style={{ fontSize: "13.5px", padding: "4px 0", color: "#4c4944" }}
                  >
                    {lineaArticulo(it)}
                  </div>
                ))
              )}
              <div style={{ marginTop: "10px" }}>
                <Fila
                  etiqueta="Entrega"
                  valor={ultimo.entrega === "retiro" ? "Retiro en tienda" : "Despacho"}
                />
                <Fila etiqueta="Total" valor={formatCLP(Number(ultimo.amount))} />
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "12px",
          overflow: "hidden",
          marginTop: "16px",
        }}
      >
        <div
          className="font-display"
          style={{
            fontSize: "14px",
            fontWeight: 600,
            padding: "16px 20px 12px",
          }}
        >
          Todos sus pedidos
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                {["Pedido", "Fecha", "Total", "Pago", "Preparación"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      color: "#6f6c66",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cliente.historial.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f0eeea" }}>
                  <td style={{ ...CELDA, whiteSpace: "nowrap" }}>
                    <Link
                      href={`/admin/pedidos/${p.commerceOrder}`}
                      style={{ fontWeight: 600, color: "#a5613f" }}
                    >
                      {codigoPedido(p.numero, p.createdAt)}
                    </Link>
                  </td>
                  <td style={{ ...CELDA, color: "#6f6c66", whiteSpace: "nowrap" }}>
                    {p.createdAt.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ ...CELDA, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {formatCLP(Number(p.amount))}
                  </td>
                  <td style={CELDA}>
                    <Etiqueta {...etiquetaPago(p.status)} />
                  </td>
                  <td style={CELDA}>
                    {p.status === "paid" || p.fulfillment === "cancelado" ? (
                      <Etiqueta {...etiquetaPreparacion(p.fulfillment)} />
                    ) : (
                      <span style={{ color: "#9b978f" }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
