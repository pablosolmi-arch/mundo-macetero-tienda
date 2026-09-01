// components/admin/GraficoBarras.tsx — gráfico de barras por día, con ejes.
//
// Componente de servidor: dibuja un SVG en línea, sin librerías ni estado. Se
// usa en "Sesiones por día" y en "Ingresos por día" del Resumen.
//
// Dos decisiones que importan para no mentir con el gráfico:
//   1. La serie de días la arma el propio componente con `serieDeDias`, así que
//      un día sin datos aparece como barra en cero. Antes esos días simplemente
//      no se dibujaban y el gráfico daba una continuidad falsa.
//   2. Los días son días chilenos (ver queries/dia-santiago.ts), los mismos que
//      agrupan las consultas.
import { serieDeDias } from "../../queries/dia-santiago";

export interface PuntoDia {
  dia: string;
  valor: number;
  // Segunda cifra opcional, solo para el tooltip ("96 páginas vistas").
  detalle?: string;
}

// Un "YYYY-MM-DD" se lee al mediodía UTC para que ningún desfase de horas lo
// corra al día anterior al formatearlo.
function comoFecha(dia: string): Date {
  return new Date(`${dia}T12:00:00Z`);
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "lun 25" para rangos cortos; "25 ago" cuando las etiquetas van espaciadas.
export function etiquetaDia(dia: string, conDiaSemana: boolean): string {
  const fecha = comoFecha(dia);
  const partes: Intl.DateTimeFormatOptions = conDiaSemana
    ? { weekday: "short", day: "numeric", timeZone: "UTC" }
    : { day: "numeric", month: "short", timeZone: "UTC" };
  return new Intl.DateTimeFormat("es-CL", partes).format(fecha).replace(".", "");
}

// "Lunes 25 de agosto de 2026", para el tooltip.
export function fechaLarga(dia: string): string {
  return conMayuscula(
    new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(comoFecha(dia)),
  );
}

// Pesos abreviados para el eje: $50 mil, $1,2 M.
export function montoCorto(valor: number): string {
  if (valor >= 1_000_000) {
    return `$${(valor / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  }
  if (valor >= 1_000) {
    return `$${Math.round(valor / 1_000).toLocaleString("es-CL")} mil`;
  }
  return `$${Math.round(valor).toLocaleString("es-CL")}`;
}

// Techo y paso "redondos" para el eje Y: 0, 50, 100, 150 en vez de 0, 47, 94.
export function escalaEjeY(maximo: number, lineas = 4): number[] {
  // Sin datos no se inventa un techo: queda solo la línea del cero. Poner un "1"
  // arriba hacía leer el gráfico como si hubiera algo que mirar.
  if (maximo <= 0) return [0];
  const crudo = maximo / lineas;
  const magnitud = Math.pow(10, Math.floor(Math.log10(crudo)));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= crudo) ?? magnitud * 10;
  const techo = Math.ceil(maximo / paso) * paso;
  const marcas: number[] = [];
  for (let v = 0; v <= techo + paso / 2; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

// Cada cuántos días se escribe una etiqueta en el eje X. La última siempre se
// escribe: el día de hoy es el que más se mira.
function pasoEtiquetas(dias: number): number {
  if (dias <= 10) return 1;
  if (dias <= 31) return 5;
  return 15;
}

const ANCHO = 1000;
const MARGEN = { arriba: 12, derecha: 10, abajo: 30, izquierda: 62 };

export function GraficoBarras({
  dias,
  datos,
  etiquetaValor,
  color = "#a5613f",
  alto = 210,
  formatoEjeY = (n) => n.toLocaleString("es-CL"),
  formatoValor,
}: {
  dias: number;
  datos: PuntoDia[];
  // Cómo se llama lo que mide la barra: "sesiones únicas del día".
  etiquetaValor: string;
  color?: string;
  alto?: number;
  formatoEjeY?: (n: number) => string;
  formatoValor?: (n: number) => string;
}) {
  const porDia = new Map(datos.map((d) => [d.dia, d]));
  const serie = serieDeDias(dias).map((dia) => porDia.get(dia) ?? { dia, valor: 0 });

  const marcas = escalaEjeY(Math.max(...serie.map((d) => d.valor), 0));
  const techo = marcas[marcas.length - 1] || 1;

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;
  const paso = anchoUtil / serie.length;
  // Con 90 días las barras quedan finas; con 7, anchas pero no gigantes.
  const anchoBarra = Math.max(2, Math.min(paso * 0.72, 52));
  const y = (valor: number) => MARGEN.arriba + altoUtil - (valor / techo) * altoUtil;

  const cadaCuantas = pasoEtiquetas(dias);
  const conDiaSemana = dias <= 10;
  const mostrarValor = formatoValor ?? formatoEjeY;

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${alto}`}
      width="100%"
      height={alto}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${etiquetaValor}, últimos ${dias} días`}
      style={{ display: "block", overflow: "visible" }}
    >
      {marcas.map((marca) => (
        <g key={marca}>
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO - MARGEN.derecha}
            y1={y(marca)}
            y2={y(marca)}
            stroke={marca === 0 ? "#d8d5cf" : "#efede9"}
            strokeWidth="1"
          />
          <text
            x={MARGEN.izquierda - 8}
            y={y(marca) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#9b978f"
          >
            {formatoEjeY(marca)}
          </text>
        </g>
      ))}

      {serie.map((d, i) => {
        const centro = MARGEN.izquierda + paso * (i + 0.5);
        const altura = Math.max(d.valor > 0 ? 2 : 0, (d.valor / techo) * altoUtil);
        const etiqueta = (serie.length - 1 - i) % cadaCuantas === 0;
        return (
          <g key={d.dia}>
            <rect
              x={centro - anchoBarra / 2}
              y={MARGEN.arriba + altoUtil - altura}
              width={anchoBarra}
              height={altura}
              rx="2"
              fill={d.valor > 0 ? color : "#e3e1dc"}
            >
              <title>
                {`${fechaLarga(d.dia)}: ${mostrarValor(d.valor)} ${etiquetaValor}` +
                  (d.detalle ? `, ${d.detalle}` : "")}
              </title>
            </rect>
            {etiqueta && (
              <text
                x={centro}
                y={alto - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6f6c66"
              >
                {etiquetaDia(d.dia, conDiaSemana)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
