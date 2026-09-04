// components/admin/graficos-trafico.tsx — sección "Tráfico" del resumen del panel.
//
// Todo se dibuja con CSS y SVG en línea, sin librerías de gráficos, y sin estado:
// son componentes de servidor que reciben las cifras ya calculadas en
// queries/admin-trafico.ts.
import { formatCLP, formatPorcentaje } from "../../lib/format";
import type {
  CanalTrafico,
  DispositivoTrafico,
  FuenteTrafico,
  PaginaVista,
  SesionesDia,
  TotalesSesiones,
} from "../../queries/admin-trafico";
import { GraficoBarras } from "./GraficoBarras";

const TARJETA: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "18px 20px",
};

const TITULO: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  marginBottom: "14px",
};

const VACIO: React.CSSProperties = { fontSize: "12.5px", color: "#9b978f" };

const NOTA_SIN_DATO =
  "El origen se registra desde hoy; los eventos anteriores aparecen como Sin dato.";

// Nombres para mostrar. Las claves son los valores que guarda la base.
const NOMBRE_CANAL: Record<string, string> = {
  directo: "Visita directa",
  busqueda: "Búsqueda",
  social: "Redes sociales",
  pagado: "Publicidad pagada",
  referido: "Sitios referentes",
  correo: "Correo",
  "sin dato": "Sin dato",
};

const NOMBRE_DISPOSITIVO: Record<string, string> = {
  movil: "Móvil",
  tablet: "Tablet",
  escritorio: "Escritorio",
  "sin dato": "Sin dato",
};

const COLOR_DISPOSITIVO: Record<string, string> = {
  movil: "#a5613f",
  tablet: "#c99a6b",
  escritorio: "#4c7a4c",
  "sin dato": "#cfcbc4",
};

function nombreCanal(canal: string): string {
  return NOMBRE_CANAL[canal] ?? canal;
}

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

const DOS_COLUMNAS: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))",
  gap: "16px",
};

function haySinDato(claves: string[]): boolean {
  return claves.includes("sin dato");
}

// Ojo con la diferencia, que antes no se decía en ninguna parte: el total de la
// tarjeta son sesiones distintas de TODO el período (contadas una vez), y cada
// barra son las sesiones distintas DE ESE DÍA. Sumar las barras da más que el
// total, porque la sesión que vuelve otro día aparece en los dos.
function SesionesPorDia({
  dias,
  datos,
  totales,
}: {
  dias: number;
  datos: SesionesDia[];
  totales: TotalesSesiones;
}) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Sesiones por día · últimos {dias} días
      </div>
      <div
        style={{
          display: "flex",
          gap: "26px",
          flexWrap: "wrap",
          margin: "-6px 0 14px",
          fontSize: "13px",
        }}
      >
        <span>
          <strong style={{ fontWeight: 700 }}>
            {totales.sesionesUnicas.toLocaleString("es-CL")}
          </strong>{" "}
          <span style={{ color: "#6f6c66" }}>sesiones únicas en el período</span>
        </span>
        <span>
          <strong style={{ fontWeight: 700 }}>{totales.paginas.toLocaleString("es-CL")}</strong>{" "}
          <span style={{ color: "#6f6c66" }}>páginas vistas</span>
        </span>
        <span>
          <strong style={{ fontWeight: 700 }}>
            {totales.paginasPorSesion.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </strong>{" "}
          <span style={{ color: "#6f6c66" }}>páginas por sesión</span>
        </span>
        <span>
          <strong style={{ fontWeight: 700 }}>{totales.whatsapp.toLocaleString("es-CL")}</strong>{" "}
          <span style={{ color: "#6f6c66" }}>
            clics a WhatsApp
            {totales.whatsapp > 0
              ? ` (${totales.whatsappSesiones.toLocaleString("es-CL")} ${totales.whatsappSesiones === 1 ? "sesión" : "sesiones"})`
              : ""}
          </span>
        </span>
      </div>
      {totales.sesionesUnicas === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <>
          <GraficoBarras
            dias={dias}
            datos={datos.map((d) => ({
              dia: d.dia,
              valor: d.sesiones,
              detalle: `${d.paginas.toLocaleString("es-CL")} páginas vistas`,
            }))}
            etiquetaValor="sesiones únicas del día"
          />
          <div style={{ ...VACIO, marginTop: "10px", lineHeight: 1.5 }}>
            Cada barra son las sesiones únicas del día. Una misma sesión que vuelve otro día
            cuenta en ambos días; el total del período la cuenta una vez. Una sesión expira
            tras 30 días sin actividad.
          </div>
        </>
      )}
    </div>
  );
}

function PorCanal({ dias, datos }: { dias: number; datos: CanalTrafico[] }) {
  const maximo = Math.max(1, ...datos.map((d) => d.sesiones));
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Tráfico por canal · últimos {dias} días
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "420px" }}>
              <thead>
                <tr>
                  <th style={ENCABEZADO}>Canal</th>
                  <th style={ENCABEZADO_NUM}>Sesiones únicas</th>
                  <th style={ENCABEZADO_NUM}>Pedidos</th>
                  <th style={ENCABEZADO_NUM}>Ingresos</th>
                  <th style={ENCABEZADO_NUM}>Conversión</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((c) => (
                  <tr key={c.canal}>
                    <td style={CELDA}>
                      {nombreCanal(c.canal)}
                      <div
                        style={{
                          height: "6px",
                          background: "#efede9",
                          borderRadius: "3px",
                          overflow: "hidden",
                          marginTop: "5px",
                        }}
                      >
                        <div
                          style={{
                            width: `${(c.sesiones / maximo) * 100}%`,
                            height: "100%",
                            background: c.pedidos > 0 ? "#4c7a4c" : "#a5613f",
                          }}
                        />
                      </div>
                    </td>
                    <td style={CELDA_NUM}>{c.sesiones.toLocaleString("es-CL")}</td>
                    <td style={{ ...CELDA_NUM, fontWeight: 600 }}>{c.pedidos}</td>
                    <td style={CELDA_NUM}>{c.ingresos > 0 ? formatCLP(c.ingresos) : "—"}</td>
                    <td style={{ ...CELDA_NUM, color: "#6f6c66" }}>
                      {c.sesiones > 0 ? formatPorcentaje(c.conversion, 2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {haySinDato(datos.map((d) => d.canal)) && (
            <div style={{ ...VACIO, marginTop: "10px" }}>{NOTA_SIN_DATO}</div>
          )}
        </>
      )}
    </div>
  );
}

function Fuentes({ dias, datos }: { dias: number; datos: FuenteTrafico[] }) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Fuentes y campañas · últimos {dias} días
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay fuentes registradas en el período.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={ENCABEZADO}>Fuente</th>
              <th style={ENCABEZADO}>Canal</th>
              <th style={ENCABEZADO_NUM}>Sesiones únicas</th>
              <th style={ENCABEZADO_NUM}>Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((f) => (
              <tr key={`${f.canal}|${f.fuente}|${f.campana}`}>
                <td style={CELDA}>
                  {f.fuente === "sin dato" ? "Sin dato" : f.fuente}
                  {f.campana && (
                    <div style={{ fontSize: "11.5px", color: "#9b978f" }}>{f.campana}</div>
                  )}
                </td>
                <td style={{ ...CELDA, color: "#6f6c66" }}>{nombreCanal(f.canal)}</td>
                <td style={CELDA_NUM}>{f.sesiones}</td>
                <td style={{ ...CELDA_NUM, fontWeight: 600 }}>{f.pedidos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Dispositivos({ dias, datos }: { dias: number; datos: DispositivoTrafico[] }) {
  const total = datos.reduce((n, d) => n + d.sesiones, 0);
  // Anillo dibujado con un solo círculo por segmento: el largo del trazo es la
  // porción, y el desplazamiento lo corre hasta donde terminó el anterior.
  const R = 54;
  const VUELTA = 2 * Math.PI * R;
  const arcos: { dispositivo: string; sesiones: number; largo: number; desde: number }[] = [];
  for (const d of datos) {
    const anterior = arcos[arcos.length - 1];
    arcos.push({
      dispositivo: d.dispositivo,
      sesiones: d.sesiones,
      largo: total > 0 ? (d.sesiones / total) * VUELTA : 0,
      desde: anterior ? anterior.desde + anterior.largo : 0,
    });
  }

  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Dispositivos · últimos {dias} días
      </div>
      {total === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Sesiones por dispositivo">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#efede9" strokeWidth="18" />
            {arcos.map((a) => (
              <circle
                key={a.dispositivo}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={COLOR_DISPOSITIVO[a.dispositivo] ?? "#cfcbc4"}
                strokeWidth="18"
                strokeDasharray={`${a.largo} ${VUELTA - a.largo}`}
                strokeDashoffset={-a.desde}
                transform="rotate(-90 70 70)"
              >
                <title>{`${NOMBRE_DISPOSITIVO[a.dispositivo] ?? a.dispositivo}: ${a.sesiones} sesiones`}</title>
              </circle>
            ))}
          </svg>
          <div style={{ flex: 1, minWidth: "150px" }}>
            {datos.map((d) => (
              <div
                key={d.dispositivo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  padding: "5px 0",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: COLOR_DISPOSITIVO[d.dispositivo] ?? "#cfcbc4",
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{NOMBRE_DISPOSITIVO[d.dispositivo] ?? d.dispositivo}</span>
                <span style={{ color: "#6f6c66", whiteSpace: "nowrap" }}>
                  {d.sesiones}
                  <span style={{ color: "#9b978f", marginLeft: "6px" }}>
                    {formatPorcentaje((d.sesiones / total) * 100, 0)}
                  </span>
                </span>
              </div>
            ))}
            {haySinDato(datos.map((d) => d.dispositivo)) && (
              <div style={{ ...VACIO, marginTop: "8px" }}>{NOTA_SIN_DATO}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Paginas({
  dias,
  datos,
  totalPaginas,
}: {
  dias: number;
  datos: PaginaVista[];
  // Todas las páginas vistas del período, para el "% del total": el top diez no
  // alcanza para calcularlo, y con la suma de las diez el porcentaje mentiría.
  totalPaginas: number;
}) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Páginas más vistas · últimos {dias} días
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay páginas vistas en el período.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "380px" }}>
            <thead>
              <tr>
                <th style={ENCABEZADO}>Página</th>
                <th style={ENCABEZADO_NUM}>Vistas</th>
                <th style={ENCABEZADO_NUM}>Sesiones únicas</th>
                <th style={ENCABEZADO_NUM}>% del total</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((p) => (
                <tr key={p.path}>
                  <td style={CELDA}>
                    {p.nombre ?? (p.path === "/" ? "Portada" : p.path)}
                    {p.nombre && (
                      <div style={{ fontSize: "11.5px", color: "#9b978f" }}>{p.path}</div>
                    )}
                  </td>
                  <td style={CELDA_NUM}>{p.vistas.toLocaleString("es-CL")}</td>
                  <td style={CELDA_NUM}>{p.sesiones.toLocaleString("es-CL")}</td>
                  <td style={{ ...CELDA_NUM, color: "#6f6c66" }}>
                    {totalPaginas > 0 ? formatPorcentaje((p.vistas / totalPaginas) * 100) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ ...VACIO, marginTop: "10px" }}>
            El porcentaje es sobre las {totalPaginas.toLocaleString("es-CL")} páginas vistas del
            período, no solo sobre estas diez.
          </div>
        </div>
      )}
    </div>
  );
}

export function SeccionTrafico({
  dias,
  sesiones,
  totales,
  canales,
  fuentes,
  equipos,
  paginas,
}: {
  dias: number;
  sesiones: SesionesDia[];
  totales: TotalesSesiones;
  canales: CanalTrafico[];
  fuentes: FuenteTrafico[];
  equipos: DispositivoTrafico[];
  paginas: PaginaVista[];
}) {
  return (
    <div style={{ marginTop: "30px" }}>
      <h2 className="font-display" style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 6px" }}>
        Tráfico
      </h2>
      <p style={{ fontSize: "12.5px", color: "#6f6c66", margin: "0 0 16px" }}>
        Calculado con los eventos de la propia tienda: una sesión es un visitante
        anónimo con actividad, sin guardar IP, correo ni nombre. Los días son días
        chilenos y el filtro de arriba manda en todas estas tarjetas.
      </p>

      <SesionesPorDia dias={dias} datos={sesiones} totales={totales} />

      {/* Las tablas de cinco columnas van solas en su fila: en una grilla de
          tres se cortaban y el encabezado quedaba ilegible. */}
      <div style={{ marginTop: "16px" }}>
        <PorCanal dias={dias} datos={canales} />
      </div>

      <div style={{ ...DOS_COLUMNAS, marginTop: "16px" }}>
        <Fuentes dias={dias} datos={fuentes} />
        <Dispositivos dias={dias} datos={equipos} />
      </div>

      <div style={{ marginTop: "16px" }}>
        <Paginas dias={dias} datos={paginas} totalPaginas={totales.paginas} />
      </div>
    </div>
  );
}
