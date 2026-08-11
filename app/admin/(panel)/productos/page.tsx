import Link from "next/link";
import { listarProductos } from "../../../../queries/admin-productos";
import { formatCLP } from "../../../../lib/format";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, { texto: string; color: string; fondo: string }> = {
  active: { texto: "Publicado", color: "#2f5d2f", fondo: "#e7f0e7" },
  draft: { texto: "Borrador", color: "#8a6a2b", fondo: "#f6efdf" },
};

export default async function AdminProductos() {
  const productos = await listarProductos();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "0 0 16px" }}>
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Productos
        </h1>
        <span style={{ fontSize: "13.5px", color: "#6f6c66" }}>
          {productos.length} {productos.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      {productos.length === 0 ? (
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
          Todavía no hay productos en el catálogo.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                  {["", "Producto", "Desde", "Variantes", "Estado", "Inventario"].map((h, i) => (
                    <th
                      key={h || `col-${i}`}
                      style={{ padding: "10px 14px", fontWeight: 600, color: "#6f6c66", whiteSpace: "nowrap" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const estado = ESTADO[p.status] ?? ESTADO.draft;
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #f0eeea" }}>
                      <td style={{ padding: "8px 14px", width: "48px" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "#eceae6",
                            flexShrink: 0,
                          }}
                        >
                          {p.miniatura && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.miniatura}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <Link href={`/admin/productos/${p.slug}`} style={{ fontWeight: 600, color: "#a5613f" }}>
                          {p.name}
                        </Link>
                        <div style={{ fontSize: "12px", color: "#9b978f" }}>{p.slug}</div>
                      </td>
                      <td style={{ padding: "8px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatCLP(p.precioDesde)}
                      </td>
                      <td style={{ padding: "8px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {p.variantes}
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <span
                          style={{
                            background: estado.fondo,
                            color: estado.color,
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "999px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {estado.texto}
                        </span>
                      </td>
                      <td style={{ padding: "8px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {p.trackStock ? "Con control" : "Sin control"}
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
