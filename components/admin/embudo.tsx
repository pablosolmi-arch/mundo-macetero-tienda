// components/admin/embudo.tsx — las cuatro tarjetas del embudo del Resumen.
//
// Componentes de servidor, sin estado: reciben las cifras ya calculadas en
// queries/admin.ts y queries/admin-trafico.ts.
//
// Todos los pasos se miden en SESIONES ÚNICAS, incluido el último: así cada
// porcentaje compara lo mismo con lo mismo. Los pedidos van al lado como dato
// (una sesión puede comprar dos veces) y las ventas cargadas a mano quedan fuera
// del embudo, anotadas aparte.
import Link from "next/link";
import { codigoPedido } from "../../lib/pedido-codigo";
import { formatCLP, formatPorcentaje } from "../../lib/format";
import type { CheckoutsSinPagar } from "../../queries/admin";
import type { AbandonoCheckout, EmbudoCanal, EmbudoProducto } from "../../queries/admin-trafico";
import type { CifrasEmbudo } from "../../lib/embudo";
import { lecturaDelEmbudo, pasosDelEmbudo } from "../../lib/embudo";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "18px 20px",
};

const TITULO: React.CSSProperties = { fontSize: "15px", fontWeight: 600, marginBottom: "4px" };

const BAJADA: React.CSSProperties = {
  fontSize: "12px",
  color: "#6f6c66",
  margin: "0 0 14px",
  lineHeight: 1.45,
};

const VACIO: React.CSSProperties = { fontSize: "12.5px", color: "#9b978f" };

const CELDA: React.CSSProperties = {
  padding: "7px 0",
  borderBottom: "1px solid #f0eeea",
  fontSize: "13px",
  textAlign: "left",
  verticalAlign: "top",
};

// El padding izquierdo es lo que separa una columna de la anterior: sin él los
// números y los encabezados quedaban pegados ("SESIONESPEDIDOS").
const CELDA_NUM: React.CSSProperties = {
  ...CELDA,
  textAlign: "right",
  whiteSpace: "nowrap",
  paddingLeft: "16px",
};

const ENCABEZADO: React.CSSProperties = {
  ...CELDA,
  fontSize: "11.5px",
  color: "#6f6c66",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const ENCABEZADO_NUM: React.CSSProperties = {
  ...ENCABEZADO,
  textAlign: "right",
  whiteSpace: "nowrap",
  paddingLeft: "16px",
};

const NOMBRE_CANAL: Record<string, string> = {
  directo: "Visita directa",
  busqueda: "Búsqueda",
  social: "Redes sociales",
  pagado: "Publicidad pagada",
  referido: "Sitios referentes",
  correo: "Correo",
  "sin dato": "Sin dato",
};

export function nombreCanal(canal: string): string {
  return NOMBRE_CANAL[canal] ?? canal;
}

// Un decimal solo cuando el número es chico: "74%" se lee mejor que "74,0%",
// pero "3%" escondería la diferencia entre 3,2% y 3,8%.
function porcentaje(parte: number, total: number): string {
  if (total <= 0) return "—";
  const valor = (parte / total) * 100;
  return formatPorcentaje(valor, valor > 0 && valor < 10 ? 1 : 0);
}

export function EmbudoCompra({
  dias,
  embudo,
  pedidos,
  ventasManuales,
}: {
  dias: number;
  embudo: CifrasEmbudo;
  pedidos: number;
  ventasManuales: number;
}) {
  const pasos = pasosDelEmbudo(embudo);
  const total = pasos[0].sesiones;
  const lectura = lecturaDelEmbudo(pasos);

  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Embudo de compra · últimos {dias} días
      </div>
      <p style={BAJADA}>
        Sesiones únicas en cada paso. El % grande es respecto del paso anterior; el
        chico, respecto de todas las visitas.
      </p>

      {total === 0 ? (
        <div style={VACIO}>
          Todavía no hay visitas registradas en el período. El embudo se llena a medida
          que entra tráfico.
        </div>
      ) : (
        <>
          {pasos.map((p, i) => {
            const previo = i > 0 ? pasos[i - 1] : null;
            const caida = previo ? previo.sesiones - p.sesiones : 0;
            const ultimo = i === pasos.length - 1;
            return (
              <div key={p.nombre} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "10px",
                    fontSize: "13px",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    {p.nombre}
                    {ultimo && (
                      <span style={{ color: "#9b978f", marginLeft: "6px" }}>({pedidos} pedidos)</span>
                    )}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    <strong style={{ fontWeight: 600 }}>{p.sesiones.toLocaleString("es-CL")}</strong>
                    {previo && previo.sesiones > 0 && (
                      <span style={{ color: "#6f6c66", marginLeft: "8px" }}>
                        {porcentaje(p.sesiones, previo.sesiones)} del paso anterior
                      </span>
                    )}
                    <span style={{ color: "#9b978f", marginLeft: "8px" }}>
                      {porcentaje(p.sesiones, total)} del total
                    </span>
                  </span>
                </div>
                <div
                  style={{ height: "9px", background: "#efede9", borderRadius: "4px", overflow: "hidden" }}
                  title={`${p.nombre}: ${p.sesiones} sesiones únicas`}
                >
                  <div
                    style={{
                      width: `${total > 0 ? (p.sesiones / total) * 100 : 0}%`,
                      height: "100%",
                      background: ultimo ? "#4c7a4c" : "#a5613f",
                    }}
                  />
                </div>
                {previo && caida > 0 && (
                  <div style={{ fontSize: "11.5px", color: "#a8482f", marginTop: "3px" }}>
                    −{caida.toLocaleString("es-CL")} sesiones se fueron aquí
                  </div>
                )}
              </div>
            );
          })}

          {lectura && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                background: "#faf7f3",
                border: "1px solid #eee6dc",
                borderRadius: "8px",
                fontSize: "12.5px",
                lineHeight: 1.5,
              }}
            >
              {lectura}
            </div>
          )}

          {ventasManuales > 0 && (
            <div style={{ ...VACIO, marginTop: "10px" }}>
              Además {ventasManuales} {ventasManuales === 1 ? "venta manual" : "ventas manuales"} en
              el período: no pasaron por el sitio, así que quedan fuera del embudo.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function EmbudoCanales({ dias, datos }: { dias: number; datos: EmbudoCanal[] }) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Embudo por canal · últimos {dias} días
      </div>
      <p style={BAJADA}>
        Cada porcentaje es sobre las sesiones de ese canal. Sirve para ver qué canal trae
        tráfico que mira y no compra.
      </p>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "440px" }}>
            <thead>
              <tr>
                <th style={ENCABEZADO}>Canal</th>
                <th style={ENCABEZADO_NUM}>Sesiones</th>
                <th style={ENCABEZADO_NUM}>% ficha</th>
                <th style={ENCABEZADO_NUM}>% carrito</th>
                <th style={ENCABEZADO_NUM}>% checkout</th>
                <th style={ENCABEZADO_NUM}>% pago</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((c) => (
                <tr key={c.canal}>
                  <td style={CELDA}>{nombreCanal(c.canal)}</td>
                  <td style={CELDA_NUM}>{c.sesiones.toLocaleString("es-CL")}</td>
                  <td style={CELDA_NUM}>{porcentaje(c.fichas, c.sesiones)}</td>
                  <td style={CELDA_NUM}>{porcentaje(c.carritos, c.sesiones)}</td>
                  <td style={CELDA_NUM}>{porcentaje(c.checkouts, c.sesiones)}</td>
                  <td style={{ ...CELDA_NUM, fontWeight: 600 }}>
                    {porcentaje(c.pagos, c.sesiones)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// La mediana marca la línea: los productos por debajo se pintan en ámbar. Es una
// referencia contra la propia tienda, no un umbral inventado.
function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 === 0 ? (orden[medio - 1] + orden[medio]) / 2 : orden[medio];
}

export function EmbudoProductos({ dias, datos }: { dias: number; datos: EmbudoProducto[] }) {
  const corte = mediana(datos.map((d) => d.conversion));

  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Dónde se pierde la venta por producto · últimos {dias} días
      </div>
      <p style={BAJADA}>
        Las diez fichas más vistas y cuántas de esas sesiones agregaron el producto al
        carrito. En ámbar, las que convierten bajo la mediana ({formatPorcentaje(corte)}): ahí
        conviene mirar foto, precio y descripción.
      </p>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay fichas vistas en el período.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "420px" }}>
            <thead>
              <tr>
                <th style={ENCABEZADO}>Producto</th>
                <th style={ENCABEZADO_NUM}>Vistas de ficha</th>
                <th style={ENCABEZADO_NUM}>Al carrito</th>
                <th style={ENCABEZADO_NUM}>Ficha → carrito</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((p) => {
                const bajo = p.conversion < corte;
                return (
                  <tr key={p.slug}>
                    <td style={CELDA}>
                      <Link href={`/producto/${p.slug}`} style={{ color: "#2a2925" }}>
                        {p.nombre}
                      </Link>
                    </td>
                    <td style={CELDA_NUM}>{p.fichas.toLocaleString("es-CL")}</td>
                    <td style={CELDA_NUM}>{p.carritos.toLocaleString("es-CL")}</td>
                    <td
                      style={{
                        ...CELDA_NUM,
                        fontWeight: 600,
                        color: bajo ? "#b3701a" : "#2a2925",
                      }}
                    >
                      {porcentaje(p.carritos, p.fichas)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ ...VACIO, marginTop: "10px" }}>
            Sesiones únicas: una misma sesión que ve la ficha tres veces cuenta una.
          </div>
        </div>
      )}
    </div>
  );
}

// Una fila de la caída del checkout: nombre, sesiones, % y la barra. Los pasos
// finales (apretó pagar, creó el pedido) usan la misma fila para que se lean
// como continuación de los campos, no como otra cosa.
function FilaAbandono({
  nombre,
  sesiones,
  total,
  destacado = false,
}: {
  nombre: string;
  sesiones: number;
  total: number;
  destacado?: boolean;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10px",
          fontSize: "13px",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontWeight: destacado ? 600 : 400 }}>{nombre}</span>
        <span style={{ whiteSpace: "nowrap" }}>
          <strong style={{ fontWeight: 600 }}>{sesiones.toLocaleString("es-CL")}</strong>
          <span style={{ color: "#9b978f", marginLeft: "8px" }}>{porcentaje(sesiones, total)}</span>
        </span>
      </div>
      <div
        style={{ height: "9px", background: "#efede9", borderRadius: "4px", overflow: "hidden" }}
        title={`${nombre}: ${sesiones} sesiones únicas`}
      >
        <div
          style={{
            width: `${total > 0 ? (sesiones / total) * 100 : 0}%`,
            height: "100%",
            background: destacado ? "#4c7a4c" : "#a5613f",
          }}
        />
      </div>
    </div>
  );
}

// En qué parte del formulario se queda la gente. Cada barra es "sesiones que
// completaron este campo", en el orden en que los campos aparecen en pantalla,
// así que el primer desplome marca dónde se abandona.
export function AbandonoDelCheckout({ dias, datos }: { dias: number; datos: AbandonoCheckout }) {
  const hayMedicion =
    datos.llegaron > 0 || datos.campos.some((c) => c.sesiones > 0) || datos.errores.length > 0;

  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Dónde se abandona el checkout · últimos {dias} días
      </div>
      <p style={BAJADA}>
        Sesiones únicas que completaron cada campo, en el orden del formulario. El % es
        sobre las {datos.llegaron.toLocaleString("es-CL")} sesiones que abrieron el
        checkout. Se guarda el nombre del campo, nunca lo que se escribió.
      </p>

      {!hayMedicion ? (
        <div style={VACIO}>Aún no hay datos: la medición empieza ahora.</div>
      ) : (
        <>
          {datos.campos.map((c) => (
            <FilaAbandono
              key={c.campo}
              nombre={c.etiqueta}
              sesiones={c.sesiones}
              total={datos.llegaron}
            />
          ))}

          <div style={{ borderTop: "1px solid #f0eeea", paddingTop: "12px", marginTop: "14px" }}>
            <FilaAbandono nombre="Apretó pagar" sesiones={datos.envios} total={datos.llegaron} />
            <FilaAbandono
              nombre="Creó el pedido"
              sesiones={datos.pedidos}
              total={datos.llegaron}
              destacado
            />
          </div>

          {datos.errores.length > 0 && (
            <div style={{ marginTop: "16px", overflowX: "auto" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, marginBottom: "6px" }}>
                Por qué se rechazó el envío
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "320px" }}>
                <thead>
                  <tr>
                    <th style={ENCABEZADO}>Motivo</th>
                    <th style={ENCABEZADO_NUM}>Veces</th>
                    <th style={ENCABEZADO_NUM}>Sesiones</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.errores.map((e) => (
                    <tr key={e.motivo}>
                      <td style={CELDA}>{e.etiqueta}</td>
                      <td style={CELDA_NUM}>{e.veces.toLocaleString("es-CL")}</td>
                      <td style={CELDA_NUM}>{e.sesiones.toLocaleString("es-CL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CheckoutsPendientes({
  dias,
  datos,
}: {
  dias: number;
  datos: CheckoutsSinPagar;
}) {
  const restantes = datos.total - datos.filas.length;

  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Checkouts sin pagar · últimos {dias} días
      </div>
      <p style={BAJADA}>
        {datos.total === 0
          ? "Pedidos que llegaron al checkout y quedaron sin pagar."
          : `${formatCLP(datos.monto)} sobre la mesa en ${datos.total} ${datos.total === 1 ? "pedido" : "pedidos"} que llegaron al checkout y quedaron sin pagar.`}
      </p>
      {datos.filas.length === 0 ? (
        <div style={VACIO}>No quedaron pagos a medias en el período.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "380px" }}>
            <thead>
              <tr>
                <th style={ENCABEZADO}>Pedido</th>
                <th style={ENCABEZADO}>Canal</th>
                <th style={ENCABEZADO_NUM}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((f) => (
                <tr key={f.commerceOrder}>
                  <td style={CELDA}>
                    <Link
                      href={`/admin/pedidos/${f.commerceOrder}`}
                      style={{ color: "#a5613f", fontWeight: 600 }}
                    >
                      {codigoPedido(f.numero, f.createdAt)}
                    </Link>
                    <div style={{ fontSize: "11.5px", color: "#9b978f" }}>
                      {new Intl.DateTimeFormat("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Santiago",
                      }).format(f.createdAt)}
                    </div>
                  </td>
                  <td style={{ ...CELDA, color: "#6f6c66" }}>{nombreCanal(f.canal)}</td>
                  <td style={{ ...CELDA_NUM, fontWeight: 600 }}>{formatCLP(f.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {restantes > 0 && (
            <div style={{ ...VACIO, marginTop: "10px" }}>y {restantes} más.</div>
          )}
        </div>
      )}
    </div>
  );
}
