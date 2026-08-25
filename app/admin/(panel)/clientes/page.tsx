import Link from "next/link";
import { listarClientes } from "../../../../queries/admin-clientes";
import { formatCLP } from "../../../../lib/format";

export const dynamic = "force-dynamic";

const CELDA: React.CSSProperties = { padding: "10px 14px", verticalAlign: "top" };

const COLUMNAS = [
  "Cliente",
  "Correo",
  "Ubicación",
  "Pedidos",
  "Importe gastado",
  "Cliente desde",
  "Último pedido",
];

function fechaCorta(valor: Date | null): string {
  if (!valor) return "-";
  return valor.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminClientes({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const buscar = typeof params.buscar === "string" ? params.buscar : "";
  const clientes = await listarClientes(buscar);

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "6px",
        }}
      >
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Clientes
        </h1>
        <form action="/admin/clientes" style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <input
            name="buscar"
            defaultValue={buscar}
            placeholder="Buscar por nombre o correo"
            style={{
              padding: "7px 12px",
              border: "1px solid #d8d5cf",
              borderRadius: "7px",
              fontSize: "13px",
              background: "#fff",
              minWidth: "240px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="mm-btn-dark"
            style={{
              border: "none",
              borderRadius: "7px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Buscar
          </button>
        </form>
      </div>
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
          {buscar ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e9e6e1",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                  {COLUMNAS.map((h) => (
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
                {clientes.map((c) => (
                  <tr key={c.email} style={{ borderTop: "1px solid #f0eeea" }}>
                    <td style={CELDA}>
                      <Link
                        href={`/admin/clientes/${encodeURIComponent(c.email)}`}
                        style={{ color: "#a5613f", fontWeight: 600 }}
                      >
                        {c.nombre || "Sin nombre"}
                      </Link>
                    </td>
                    <td style={{ ...CELDA, color: "#6f6c66" }}>{c.email}</td>
                    <td style={{ ...CELDA, color: "#6f6c66" }}>
                      {/* Sin comuna es porque solo ha retirado en tienda. */}
                      {c.comuna ? (
                        <>
                          {c.comuna}
                          {c.region && (
                            <div style={{ fontSize: "12px", color: "#9b978f" }}>{c.region}</div>
                          )}
                        </>
                      ) : (
                        "Retiro"
                      )}
                    </td>
                    <td style={{ ...CELDA, color: "#6f6c66" }}>
                      {c.pedidos}
                      {c.pagados !== c.pedidos && (
                        <div style={{ fontSize: "12px", color: "#9b978f" }}>
                          {c.pagados} pagados
                        </div>
                      )}
                    </td>
                    <td style={{ ...CELDA, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatCLP(c.totalGastado)}
                    </td>
                    <td style={{ ...CELDA, color: "#6f6c66", whiteSpace: "nowrap" }}>
                      {fechaCorta(c.primerPedido)}
                    </td>
                    <td style={{ ...CELDA, color: "#6f6c66", whiteSpace: "nowrap" }}>
                      {fechaCorta(c.ultimoPedido)}
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
