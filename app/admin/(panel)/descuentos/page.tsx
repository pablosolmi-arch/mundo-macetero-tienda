import { desc } from "drizzle-orm";
import { db } from "../../../../db/client";
import { discounts } from "../../../../db/schema";
import { formatCLP } from "../../../../lib/format";
import { GestorDescuentos, ToggleDescuento } from "../../../../components/admin/GestorDescuentos";

export const dynamic = "force-dynamic";

export default async function AdminDescuentos() {
  const codigos = await db.query.discounts.findMany({
    orderBy: [desc(discounts.createdAt)],
  });

  const ahora = new Date();

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 16px" }}>
        Descuentos
      </h1>

      <GestorDescuentos />

      {codigos.length === 0 ? (
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
          Todavía no hay códigos de descuento.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#faf9f7", textAlign: "left" }}>
                  {["Código", "Descuento", "Usos", "Vence", "Estado", ""].map((h, i) => (
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
                {codigos.map((d) => {
                  const valor = Number(d.valor);
                  // Un código puede estar activo y aun así no servir: se muestra el
                  // motivo para no dejar a nadie buscando por qué el checkout lo rechaza.
                  const vencido = d.expiraEn != null && d.expiraEn < ahora;
                  const agotado = d.maxUsos != null && d.usos >= d.maxUsos;
                  return (
                    <tr key={d.id} style={{ borderTop: "1px solid #f0eeea" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{d.codigo}</td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        {d.tipo === "monto" ? formatCLP(valor) : `${valor}%`}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {d.maxUsos != null ? `${d.usos} de ${d.maxUsos}` : String(d.usos)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {d.expiraEn
                          ? d.expiraEn.toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: d.activo && !vencido && !agotado ? "#e7f0e7" : "#efede9",
                            color: d.activo && !vencido && !agotado ? "#2f5d2f" : "#6f6c66",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "999px",
                          }}
                        >
                          {d.activo ? "Activo" : "Inactivo"}
                        </span>
                        {d.activo && (vencido || agotado) && (
                          <div style={{ fontSize: "11.5px", color: "#9b978f", marginTop: "4px" }}>
                            {vencido ? "vencido" : "sin cupos"}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <ToggleDescuento id={d.id} activo={d.activo} />
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
