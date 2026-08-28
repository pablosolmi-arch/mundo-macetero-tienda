import Link from "next/link";
import { kpisPedidos, listarPedidos } from "../../../../queries/admin";
import { formatCLP } from "../../../../lib/format";
import { codigoPedido } from "../../../../lib/pedido-codigo";
import { etiquetaPago, etiquetaPreparacion, resumenArticulos } from "../../../../lib/pedido-vista";
import { Etiqueta } from "../../../../components/admin/Etiqueta";
import { esPendiente } from "../../../../content/terminaciones";

export const dynamic = "force-dynamic";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "13px 15px",
};

const CELDA: React.CSSProperties = { padding: "10px 14px", verticalAlign: "top" };

// Períodos del selector de KPIs. `dias` viaja en la URL.
const PERIODOS: [number, string][] = [
  [1, "Hoy"],
  [7, "7 días"],
  [30, "30 días"],
];

const FILTROS_PAGO: [string, string][] = [
  ["", "Todos"],
  ["paid", "Pagados"],
  ["pending", "Pendientes"],
  ["rejected", "Rechazados"],
];

const FILTROS_PREPARACION: [string, string][] = [
  ["pendiente", "Por preparar"],
  ["preparado", "Preparados"],
  ["entregado", "Entregados"],
];

const COLUMNAS = [
  "Pedido",
  "Fecha",
  "Cliente",
  "Artículos",
  "Canal",
  "Total",
  "Pago",
  "Preparación",
  "Entrega",
];

function Kpi({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div style={TARJETA}>
      <div style={{ fontSize: "11.5px", color: "#6f6c66", marginBottom: "4px" }}>{etiqueta}</div>
      <div className="font-display" style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.1 }}>
        {valor}
      </div>
    </div>
  );
}

function Chip({
  href,
  activo,
  children,
  acento = false,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
  acento?: boolean;
}) {
  const color = acento ? "#a5613f" : "#2a2925";
  return (
    <Link
      href={href}
      style={{
        padding: "6px 12px",
        borderRadius: "7px",
        fontSize: "13px",
        border: activo ? `1.5px solid ${color}` : "1px solid #d8d5cf",
        background: activo ? color : "#fff",
        color: activo ? "#fff" : color,
        fontWeight: activo ? 700 : 500,
      }}
    >
      {children}
    </Link>
  );
}

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const uno = (clave: string) => (typeof params[clave] === "string" ? (params[clave] as string) : undefined);
  const estado = uno("estado");
  const entrega = uno("entrega");
  const buscar = uno("buscar");
  const dias = PERIODOS.some(([d]) => String(d) === uno("dias")) ? Number(uno("dias")) : 30;

  const [pedidos, kpis] = await Promise.all([
    listarPedidos({ estado, entrega, buscar }),
    kpisPedidos(dias),
  ]);

  // Los enlaces de filtro conservan lo que ya estaba puesto: cambiar de período
  // no debería borrar la búsqueda ni el estado que el equipo venía mirando.
  function url(cambios: Record<string, string | undefined>): string {
    const actuales: Record<string, string | undefined> = {
      estado,
      entrega,
      buscar,
      dias: dias === 30 ? undefined : String(dias),
      ...cambios,
    };
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(actuales)) {
      if (valor) query.set(clave, valor);
    }
    const texto = query.toString();
    return texto ? `/admin/pedidos?${texto}` : "/admin/pedidos";
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
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
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {PERIODOS.map(([d, label]) => (
            <Chip key={d} href={url({ dias: String(d) })} activo={d === dias}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <Kpi etiqueta="Pedidos" valor={String(kpis.pedidos)} />
        <Kpi etiqueta="Artículos pedidos" valor={String(kpis.articulos)} />
        <Kpi etiqueta="Ingresos" valor={formatCLP(kpis.ingresos)} />
        <Kpi etiqueta="Reembolsos" valor={formatCLP(kpis.reembolsos)} />
        <Kpi etiqueta="Por preparar" valor={String(kpis.porPreparar)} />
        <Kpi etiqueta="Preparados" valor={String(kpis.preparados)} />
        <Kpi etiqueta="Entregados" valor={String(kpis.entregados)} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        {FILTROS_PAGO.map(([valor, label]) => (
          <Chip
            key={label}
            href={url({ estado: valor || undefined, entrega: undefined })}
            activo={(estado ?? "") === valor && !entrega}
          >
            {label}
          </Chip>
        ))}
        {FILTROS_PREPARACION.map(([valor, label]) => (
          <Chip
            key={valor}
            href={url({ entrega: valor, estado: "paid" })}
            activo={entrega === valor}
            acento
          >
            {label}
          </Chip>
        ))}
        <form action="/admin/pedidos" style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {/* Buscar no debería tirar por la borda el período ni los filtros puestos. */}
          {estado && <input type="hidden" name="estado" value={estado} />}
          {entrega && <input type="hidden" name="entrega" value={entrega} />}
          {dias !== 30 && <input type="hidden" name="dias" value={String(dias)} />}
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
                {pedidos.map((p) => {
                  const articulos = resumenArticulos(p.items);
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #f0eeea" }}>
                      <td style={{ ...CELDA, whiteSpace: "nowrap" }}>
                        <Link
                          href={`/admin/pedidos/${p.commerceOrder}`}
                          style={{ fontWeight: 600, color: "#a5613f" }}
                        >
                          {codigoPedido(p.numero, p.createdAt)}
                        </Link>
                        {p.items.some((it) => esPendiente(it.terminacion)) && (
                          <span
                            title="Terminación por confirmar con el cliente"
                            style={{
                              display: "inline-block",
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "#d9a13b",
                              marginLeft: "6px",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                      <td style={{ ...CELDA, color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {p.createdAt.toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                        })}
                        <div style={{ fontSize: "12px", color: "#9b978f" }}>
                          {p.createdAt.toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td style={CELDA}>
                        {p.customerName || "Sin nombre"}
                        <div style={{ fontSize: "12px", color: "#9b978f" }}>{p.customerEmail}</div>
                      </td>
                      <td
                        style={{ ...CELDA, color: "#4c4944", minWidth: "220px" }}
                        title={articulos.completo}
                      >
                        {articulos.visibles.length === 0 ? (
                          <span style={{ color: "#9b978f" }}>Sin artículos</span>
                        ) : (
                          articulos.visibles.map((linea) => <div key={linea}>{linea}</div>)
                        )}
                        {articulos.extra > 0 && (
                          <div style={{ fontSize: "12px", color: "#9b978f" }}>
                            +{articulos.extra} más
                          </div>
                        )}
                      </td>
                      <td style={{ ...CELDA, color: "#6f6c66", whiteSpace: "nowrap" }}>
                        {p.origen === "manual" ? "Manual" : "Tienda online"}
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
                      <td style={{ ...CELDA, color: "#6f6c66" }}>
                        {p.entrega === "retiro" ? "Retiro" : p.shippingCity || "Despacho"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ fontSize: "12px", color: "#9b978f", marginTop: "10px" }}>
        Las tarjetas de arriba resumen el período elegido. La tabla muestra los últimos 100 pedidos
        que cumplen los filtros, del más nuevo al más antiguo.
      </div>
    </div>
  );
}
