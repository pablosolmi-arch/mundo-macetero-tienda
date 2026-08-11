import Link from "next/link";
import { listarPedidos } from "../../../../queries/admin";
import { formatCLP } from "../../../../lib/format";

export const dynamic = "force-dynamic";

const ESTADO_PAGO: Record<string, { texto: string; color: string; fondo: string }> = {
  paid: { texto: "Pagado", color: "#2f5d2f", fondo: "#e7f0e7" },
  pending: { texto: "Pendiente", color: "#8a6a2b", fondo: "#f6efdf" },
  rejected: { texto: "Rechazado", color: "#8f4a2b", fondo: "#f7e8e2" },
  annulled: { texto: "Anulado", color: "#6f6c66", fondo: "#efede9" },
};

const ENTREGA: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Por entregar", color: "#8a6a2b" },
  entregado: { texto: "Entregado", color: "#2f5d2f" },
  cancelado: { texto: "Cancelado", color: "#8f4a2b" },
};

function Etiqueta({ texto, color, fondo }: { texto: string; color: string; fondo: string }) {
  return (
    <span
      style={{
        background: fondo,
        color,
        fontSize: "11.5px",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </span>
  );
}

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const estado = typeof params.estado === "string" ? params.estado : undefined;
  const entrega = typeof params.entrega === "string" ? params.entrega : undefined;
  const buscar = typeof params.buscar === "string" ? params.buscar : undefined;

  const pedidos = await listarPedidos({ estado, entrega, buscar });

  const filtros: [string, string][] = [
    ["", "Todos"],
    ["paid", "Pagados"],
    ["pending", "Pendientes"],
    ["rejected", "Rechazados"],
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          margin: "0 0 16px",
        }}
      >
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Pedidos
        </h1>
        <Link
          href="/admin/pedidos/nuevo"
          style={{
            padding: "7px 14px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: 600,
            background: "#2a2925",
            color: "#fff",
          }}
        >
          + Nuevo pedido
        </Link>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "18px" }}>
        {filtros.map(([valor, label]) => (
          <Link
            key={label}
            href={valor ? `/admin/pedidos?estado=${valor}` : "/admin/pedidos"}
            style={{
              padding: "6px 12px",
              borderRadius: "7px",
              fontSize: "13px",
              border: (estado ?? "") === valor ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
              background: (estado ?? "") === valor ? "#2a2925" : "#fff",
              color: (estado ?? "") === valor ? "#fff" : "#2a2925",
              fontWeight: (estado ?? "") === valor ? 700 : 500,
            }}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/admin/pedidos?entrega=pendiente&estado=paid"
          style={{
            padding: "6px 12px",
            borderRadius: "7px",
            fontSize: "13px",
            border: entrega === "pendiente" ? "1.5px solid #a5613f" : "1px solid #d8d5cf",
            background: "#fff",
            color: "#a5613f",
            fontWeight: 600,
          }}
        >
          Por entregar
        </Link>
        <form action="/admin/pedidos" style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <input
            name="buscar"
            defaultValue={buscar ?? ""}
            placeholder="Buscar por pedido, correo o nombre"
            style={{
              padding: "7px 12px",
              border: "1px solid #d8d5cf",
              borderRadius: "7px",
              fontSize: "13px",
              background: "#fff",
              minWidth: "260px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="mm-btn-dark"
            style={{ border: "none", borderRadius: "7px", padding: "7px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Buscar
          </button>
        </form>
      </div>

      {pedidos.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e9e6e1",
            borderRadius: "12px",
            padding: "50px 20px",
            textAlign: "center",
            color: "#6f6c66",
            fontSize: "14px",
          }}
        >
          No hay pedidos con estos filtros.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                  {["Pedido", "Fecha", "Cliente", "Entrega", "Total", "Pago", "Estado"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: "#6f6c66", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => {
                  const pago = ESTADO_PAGO[p.status] ?? ESTADO_PAGO.pending;
                  const ent = ENTREGA[p.fulfillment] ?? ENTREGA.pendiente;
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #f0eeea" }}>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <Link href={`/admin/pedidos/${p.commerceOrder}`} style={{ fontWeight: 600, color: "#a5613f" }}>
                          {p.commerceOrder}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {p.createdAt.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {p.customerName || "—"}
                        <div style={{ fontSize: "12px", color: "#9b978f" }}>{p.customerEmail}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6f6c66" }}>
                        {p.entrega === "retiro" ? "Retiro" : p.shippingCity || "Despacho"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatCLP(Number(p.amount))}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Etiqueta {...pago} />
                      </td>
                      <td style={{ padding: "10px 14px", color: ent.color, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {p.status === "paid" ? ent.texto : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
