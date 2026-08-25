// components/admin/graficos-trafico.tsx — sección "Tráfico" del resumen del panel.
//
// Todo se dibuja con CSS y SVG en línea, sin librerías de gráficos, y sin estado:
// son componentes de servidor que reciben las cifras ya calculadas en
// queries/admin-trafico.ts.
import { formatCLP } from "../../lib/format";
import type {
  CanalTrafico,
  DispositivoTrafico,
  FuenteTrafico,
  PaginaVista,
  SesionesDia,
} from "../../queries/admin-trafico";

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

const CELDA_NUM: React.CSSProperties = { ...CELDA, textAlign: "right", whiteSpace: "nowrap" };

const ENCABEZADO: React.CSSProperties = {
  ...CELDA,
  fontSize: "11.5px",
  color: "#6f6c66",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function haySinDato(claves: string[]): boolean {
  return claves.includes("sin dato");
}

function SesionesPorDia({ datos }: { datos: SesionesDia[] }) {
  const maximo = Math.max(1, ...datos.map((d) => d.sesiones));
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Sesiones por día
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "140px" }}>
            {datos.map((d) => (
              <div
                key={d.dia}
                title={`${d.dia}: ${d.sesiones} sesiones, ${d.paginas} páginas vistas`}
                style={{
                  flex: 1,
                  minWidth: "4px",
                  // Con pocos días una barra sola llenaría la tarjeta entera.
                  maxWidth: "46px",
                  height: `${Math.max(2, (d.sesiones / maximo) * 100)}%`,
                  background: d.sesiones > 0 ? "#a5613f" : "#e3e1dc",
                  borderRadius: "2px 2px 0 0",
                }}
              />
            ))}
          </div>
          <div style={{ ...VACIO, marginTop: "10px" }}>
            {datos.reduce((n, d) => n + d.sesiones, 0)} sesiones y{" "}
            {datos.reduce((n, d) => n + d.paginas, 0)} páginas vistas en el período.
          </div>
        </>
      )}
    </div>
  );
}

function PorCanal({ datos }: { datos: CanalTrafico[] }) {
  const maximo = Math.max(1, ...datos.map((d) => d.sesiones));
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Tráfico por canal
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay sesiones registradas en el período.</div>
      ) : (
        <>
          {datos.map((c) => (
            <div key={c.canal} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                <span>{nombreCanal(c.canal)}</span>
                <span style={{ color: "#6f6c66", whiteSpace: "nowrap" }}>
                  {c.sesiones} ses.
                  <span style={{ color: "#2a2925", marginLeft: "10px", fontWeight: 600 }}>
                    {c.pedidos} ped.
                  </span>
                  <span style={{ color: "#9b978f", marginLeft: "10px" }}>
                    {c.sesiones > 0 ? `${c.conversion.toFixed(2)}%` : "sin sesiones"}
                  </span>
                </span>
              </div>
              <div
                style={{ height: "8px", background: "#efede9", borderRadius: "4px", overflow: "hidden" }}
                title={`${nombreCanal(c.canal)}: ${c.sesiones} sesiones, ${c.pedidos} pedidos, ${formatCLP(c.ingresos)}`}
              >
                <div
                  style={{
                    width: `${(c.sesiones / maximo) * 100}%`,
                    height: "100%",
                    background: c.pedidos > 0 ? "#4c7a4c" : "#a5613f",
                  }}
                />
              </div>
            </div>
          ))}
          {haySinDato(datos.map((d) => d.canal)) && (
            <div style={{ ...VACIO, marginTop: "10px" }}>{NOTA_SIN_DATO}</div>
          )}
        </>
      )}
    </div>
  );
}

function Fuentes({ datos }: { datos: FuenteTrafico[] }) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Fuentes y campañas
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay fuentes registradas en el período.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={ENCABEZADO}>Fuente</th>
              <th style={ENCABEZADO}>Canal</th>
              <th style={{ ...ENCABEZADO, textAlign: "right" }}>Sesiones</th>
              <th style={{ ...ENCABEZADO, textAlign: "right" }}>Pedidos</th>
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

function Dispositivos({ datos }: { datos: DispositivoTrafico[] }) {
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
        Dispositivos
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
                    {Math.round((d.sesiones / total) * 100)}%
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

function Paginas({ datos }: { datos: PaginaVista[] }) {
  return (
    <div style={TARJETA}>
      <div className="font-display" style={TITULO}>
        Páginas más vistas
      </div>
      {datos.length === 0 ? (
        <div style={VACIO}>Todavía no hay páginas vistas en el período.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={ENCABEZADO}>Página</th>
              <th style={{ ...ENCABEZADO, textAlign: "right" }}>Vistas</th>
              <th style={{ ...ENCABEZADO, textAlign: "right" }}>Sesiones</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((p) => (
              <tr key={p.path}>
                <td style={CELDA}>
                  {p.nombre ?? (p.path === "/" ? "Portada" : p.path)}
                  {p.nombre && <div style={{ fontSize: "11.5px", color: "#9b978f" }}>{p.path}</div>}
                </td>
                <td style={CELDA_NUM}>{p.vistas}</td>
                <td style={CELDA_NUM}>{p.sesiones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function SeccionTrafico({
  sesiones,
  canales,
  fuentes,
  equipos,
  paginas,
}: {
  sesiones: SesionesDia[];
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
        anónimo con actividad, sin guardar IP, correo ni nombre.
      </p>

      <SesionesPorDia datos={sesiones} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <PorCanal datos={canales} />
        <Fuentes datos={fuentes} />
        <Dispositivos datos={equipos} />
        <Paginas datos={paginas} />
      </div>
    </div>
  );
}
