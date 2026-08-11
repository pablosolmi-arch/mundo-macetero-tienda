import Link from "next/link";
import { listarClientes } from "../../../../queries/admin-clientes";
import { formatCLP } from "../../../../lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClientes() {
  const clientes = await listarClientes();

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 6px" }}>
        Clientes
      </h1>
      <p style={{ fontSize: "13px", color: "#6f6c66", margin: "0 0 18px" }}>
        Agrupados por correo, ordenados por lo que han gastado.
      </p>

      {clientes.length === 0 ? (
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
          Todavía no hay clientes.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                  {["Cliente", "Correo", "Pedidos", "Pagados", "Total gastado", "Último pedido"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: "#6f6c66", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.email} style={{ borderTop: "1px solid #f0eeea" }}>
                    <td style={{ padding: "10px 14px" }}>{c.nombre || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {/* La búsqueda de pedidos ya filtra por correo: es el camino
                          natural desde el cliente a su historial. */}
                      <Link
                        href={`/admin/pedidos?buscar=${encodeURIComponent(c.email)}`}
                        style={{ color: "#a5613f", fontWeight: 600 }}
                      >
                        {c.email}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6f6c66" }}>{c.pedidos}</td>
                    <td style={{ padding: "10px 14px", color: "#6f6c66" }}>{c.pagados}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatCLP(c.totalGastado)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                      {c.ultimoPedido
                        ? c.ultimoPedido.toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
