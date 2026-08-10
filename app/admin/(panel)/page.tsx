import Link from "next/link";
import { metricas } from "../../../queries/admin";
import { formatCLP } from "../../../lib/format";

export const dynamic = "force-dynamic";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "18px 20px",
};

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div style={TARJETA}>
      <div style={{ fontSize: "12px", color: "#6f6c66", marginBottom: "6px" }}>{etiqueta}</div>
      <div className="font-display" style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1.1 }}>
        {valor}
      </div>
      {nota && <div style={{ fontSize: "12px", color: "#9b978f", marginTop: "4px" }}>{nota}</div>}
    </div>
  );
}

export default async function AdminResumen({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const dias = Number(typeof params.dias === "string" ? params.dias : 30) || 30;
  const m = await metricas(dias);

  const pasos = [
    { nombre: "Visitas", n: m.embudo.visitas },
    { nombre: "Vieron una ficha", n: m.embudo.fichas },
    { nombre: "Agregaron al carrito", n: m.embudo.carritos },
    { nombre: "Iniciaron el pago", n: m.embudo.checkouts },
    { nombre: "Pagaron", n: m.embudo.pagos },
  ];
  const maxPaso = Math.max(1, ...pasos.map((p) => p.n));
  const maxDia = Math.max(1, ...m.porDia.map((d) => d.ingresos));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Resumen
        </h1>
        <div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin?dias=${d}`}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: d === dias ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
                background: d === dias ? "#2a2925" : "#fff",
                color: d === dias ? "#fff" : "#2a2925",
                fontWeight: d === dias ? 700 : 500,
              }}
            >
              {d} días
            </Link>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: "14px",
          margin: "20px 0 26px",
        }}
      >
        <Dato etiqueta="Ingresos" valor={formatCLP(m.ingresos)} nota={`${m.pedidosPagados} pedidos pagados`} />
        <Dato etiqueta="Ticket promedio" valor={m.pedidosPagados ? formatCLP(m.ticketPromedio) : "—"} />
        <Dato
          etiqueta="Conversión"
          valor={m.embudo.visitas ? `${m.conversion.toFixed(2)}%` : "—"}
          nota={m.embudo.visitas ? `${m.embudo.visitas} visitantes` : "sin visitas registradas"}
        />
        <Dato etiqueta="Por entregar" valor={String(m.porEntregar)} nota="pagados y sin despachar" />
        <Dato etiqueta="Pagos sin completar" valor={String(m.pendientes)} nota="checkout iniciado, sin pagar" />
        {m.reembolsado > 0 && <Dato etiqueta="Reembolsado" valor={formatCLP(m.reembolsado)} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
        <div style={TARJETA}>
          <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
            Embudo de compra
          </div>
          {pasos.map((p, i) => (
            <div key={p.nombre} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                <span>{p.nombre}</span>
                <span style={{ color: "#6f6c66" }}>
                  {p.n}
                  {i > 0 && pasos[i - 1].n > 0 && (
                    <span style={{ color: "#9b978f", marginLeft: "6px" }}>
                      {Math.round((p.n / pasos[i - 1].n) * 100)}%
                    </span>
                  )}
                </span>
              </div>
              <div style={{ height: "8px", background: "#efede9", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(p.n / maxPaso) * 100}%`,
                    height: "100%",
                    background: i === pasos.length - 1 ? "#4c7a4c" : "#a5613f",
                  }}
                />
              </div>
            </div>
          ))}
          {m.embudo.visitas === 0 && (
            <div style={{ fontSize: "12.5px", color: "#9b978f", marginTop: "10px" }}>
              Todavía no hay visitas registradas. El embudo se llena a medida que entra tráfico.
            </div>
          )}
        </div>

        <div style={TARJETA}>
          <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
            Ingresos por día
          </div>
          {m.porDia.length === 0 ? (
            <div style={{ fontSize: "12.5px", color: "#9b978f" }}>Sin pedidos en el período.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "140px" }}>
              {m.porDia.map((d) => (
                <div
                  key={d.dia}
                  title={`${d.dia}: ${formatCLP(d.ingresos)} (${d.pedidos} pedidos)`}
                  style={{
                    flex: 1,
                    minWidth: "4px",
                    // Con pocos días una barra sola llenaría la tarjeta entera.
                    maxWidth: "46px",
                    height: `${Math.max(2, (d.ingresos / maxDia) * 100)}%`,
                    background: d.ingresos > 0 ? "#a5613f" : "#e3e1dc",
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={TARJETA}>
          <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
            Más vendidos
          </div>
          {m.topProductos.length === 0 ? (
            <div style={{ fontSize: "12.5px", color: "#9b978f" }}>Sin ventas en el período.</div>
          ) : (
            m.topProductos.map((p) => (
              <div
                key={p.nombre}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  fontSize: "13px",
                  padding: "6px 0",
                  borderBottom: "1px solid #f0eeea",
                }}
              >
                <span>
                  {p.nombre} <span style={{ color: "#9b978f" }}>× {p.unidades}</span>
                </span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatCLP(p.ingresos)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: "22px" }}>
        <Link href="/admin/pedidos" style={{ fontSize: "13.5px", fontWeight: 600, color: "#a5613f" }}>
          Ver todos los pedidos →
        </Link>
      </div>
    </div>
  );
}
