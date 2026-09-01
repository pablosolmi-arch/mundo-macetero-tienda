import Link from "next/link";
import { checkoutsSinPagar, metricas } from "../../../queries/admin";
import {
  abandonoCheckout,
  dispositivos,
  embudoPorCanal,
  embudoPorProducto,
  paginasMasVistas,
  sesionesPorDia,
  topFuentes,
  totalesSesiones,
  traficoPorCanal,
} from "../../../queries/admin-trafico";
import { SeccionTrafico } from "../../../components/admin/graficos-trafico";
import { GraficoBarras, montoCorto } from "../../../components/admin/GraficoBarras";
import {
  AbandonoDelCheckout,
  CheckoutsPendientes,
  EmbudoCanales,
  EmbudoCompra,
  EmbudoProductos,
} from "../../../components/admin/embudo";
import { formatCLP, formatPorcentaje } from "../../../lib/format";

export const dynamic = "force-dynamic";

// Solo estos tres: cualquier otro valor en la URL cae al de siempre. Todas las
// consultas de la página reciben este mismo número, así que el filtro manda en
// cada tarjeta del Resumen, no solo en algunas.
const RANGOS = [7, 30, 90];

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "18px 20px",
};

// 460px de mínimo: con menos entraba una tercera columna y las tablas quedaban
// tan angostas que se cortaban solas.
const DOS_COLUMNAS: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))",
  gap: "16px",
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
  const pedido = Number(typeof params.dias === "string" ? params.dias : 30);
  const dias = RANGOS.includes(pedido) ? pedido : 30;
  const rango = `últimos ${dias} días`;

  // Todas en paralelo: son consultas independientes y la página se abre en cada
  // visita al panel. Todas reciben `dias`.
  const [
    m,
    sesiones,
    totales,
    canales,
    fuentes,
    equipos,
    paginas,
    porCanal,
    porProducto,
    pendientes,
    abandono,
  ] = await Promise.all([
      metricas(dias),
      sesionesPorDia(dias),
      totalesSesiones(dias),
      traficoPorCanal(dias),
      topFuentes(dias),
      dispositivos(dias),
      paginasMasVistas(dias),
      embudoPorCanal(dias),
      embudoPorProducto(dias),
      checkoutsSinPagar(dias),
      abandonoCheckout(dias),
    ]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Resumen
        </h1>
        <div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
          {RANGOS.map((d) => (
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

      <p style={{ fontSize: "12.5px", color: "#6f6c66", margin: "8px 0 0" }}>
        Todo lo que sigue es de los {rango}, contados en días chilenos: hoy más los{" "}
        {dias - 1} días anteriores completos.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: "14px",
          margin: "20px 0 26px",
        }}
      >
        <Dato
          etiqueta={`Ingresos · ${rango}`}
          valor={formatCLP(m.ingresos)}
          nota={`${m.pedidosPagados} ${m.pedidosPagados === 1 ? "pedido pagado" : "pedidos pagados"}`}
        />
        <Dato
          etiqueta={`Ticket promedio · ${rango}`}
          valor={m.pedidosPagados ? formatCLP(m.ticketPromedio) : "—"}
        />
        <Dato
          etiqueta={`Conversión · ${rango}`}
          valor={m.embudo.visitas ? formatPorcentaje(m.conversion, 2) : "—"}
          nota={
            m.embudo.visitas
              ? `${m.embudo.pagos} de ${m.embudo.visitas} sesiones compraron`
              : "sin visitas registradas"
          }
        />
        <Dato
          etiqueta={`Por entregar · ${rango}`}
          valor={String(m.porEntregar)}
          nota="pagados y sin despachar"
        />
        <Dato
          etiqueta={`Pagos sin completar · ${rango}`}
          valor={String(m.pendientes)}
          nota="checkout iniciado, sin pagar"
        />
        {m.reembolsado > 0 && (
          <Dato etiqueta={`Reembolsado · ${rango}`} valor={formatCLP(m.reembolsado)} />
        )}
      </div>

      <div style={{ ...TARJETA, marginBottom: "16px" }}>
        <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
          Ingresos por día · {rango}
        </div>
        <p style={{ fontSize: "12px", color: "#6f6c66", margin: "0 0 14px" }}>
          Solo pedidos pagados. Los días sin ventas se dibujan en cero, no se saltan.
        </p>
        {m.ingresos === 0 ? (
          // Un gráfico entero en cero es una franja en blanco que no dice nada;
          // los días sin ventas se dibujan cuando hay al menos una venta que ver.
          <div style={{ fontSize: "12.5px", color: "#9b978f" }}>
            Sin ventas pagadas en el período.
          </div>
        ) : (
          <GraficoBarras
            dias={dias}
            datos={m.porDia.map((d) => ({
              dia: d.dia,
              valor: d.ingresos,
              detalle: `${d.pedidos} ${d.pedidos === 1 ? "pedido" : "pedidos"}`,
            }))}
            etiquetaValor="en ventas pagadas"
            formatoEjeY={montoCorto}
            formatoValor={formatCLP}
          />
        )}
      </div>

      {/* Las tarjetas de tabla ancha van solas en su fila: apretadas en tres
          columnas las columnas se pisaban y el encabezado quedaba ilegible. */}
      <div style={DOS_COLUMNAS}>
        <EmbudoCompra
          dias={dias}
          embudo={m.embudo}
          pedidos={m.pedidosDelEmbudo}
          ventasManuales={m.ventasManuales}
        />

        <div style={TARJETA}>
          <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
            Más vendidos · {rango}
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

      <div style={{ marginTop: "16px" }}>
        <EmbudoCanales dias={dias} datos={porCanal} />
      </div>

      <div style={{ ...DOS_COLUMNAS, marginTop: "16px" }}>
        <EmbudoProductos dias={dias} datos={porProducto} />
        <CheckoutsPendientes dias={dias} datos={pendientes} />
      </div>

      {/* Debajo de "Checkouts sin pagar": ahí se ve cuánto quedó sin pagar y
          acá, en qué parte del formulario se fue esa gente. */}
      <div style={{ marginTop: "16px" }}>
        <AbandonoDelCheckout dias={dias} datos={abandono} />
      </div>

      <SeccionTrafico
        dias={dias}
        sesiones={sesiones}
        totales={totales}
        canales={canales}
        fuentes={fuentes}
        equipos={equipos}
        paginas={paginas}
      />

      <div style={{ marginTop: "22px" }}>
        <Link href="/admin/pedidos" style={{ fontSize: "13.5px", fontWeight: 600, color: "#a5613f" }}>
          Ver todos los pedidos →
        </Link>
      </div>
    </div>
  );
}
