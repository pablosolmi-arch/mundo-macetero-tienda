import { GOOGLE_PERFIL, RESUMEN } from "../../content/resenas";

// Prueba social del perfil de Google, en formato compacto. Se usa suelta bajo el
// nombre del producto y dentro de las cajas de CTA, así que no trae márgenes:
// los pone quien la coloca.

const TAMANOS = {
  sm: { estrella: 13, texto: "12.5px" },
  md: { estrella: 16, texto: "14px" },
} as const;

// Path de estrella de 24×24, el mismo para el relleno y para el fondo vacío.
const ESTRELLA = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function Fila({ px, color }: { px: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px", flex: "none" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={px} height={px} viewBox="0 0 24 24" style={{ display: "block", flex: "none" }}>
          <path d={ESTRELLA} fill={color} />
        </svg>
      ))}
    </span>
  );
}

// Cinco estrellas rellenas en proporción a la nota: la fila de color se recorta
// con un contenedor de ancho porcentual, para no depender de gradientes con id
// (que colisionarían si la insignia aparece dos veces en la misma página).
export function Estrellas({ valor, px = 13 }: { valor: number; px?: number }) {
  const pct = Math.max(0, Math.min(100, (valor / 5) * 100));
  return (
    <span
      aria-hidden="true"
      style={{ position: "relative", display: "inline-flex", flex: "none", lineHeight: 0 }}
    >
      <Fila px={px} color="#d8d5cf" />
      <span style={{ position: "absolute", inset: 0, width: `${pct}%`, overflow: "hidden", display: "flex" }}>
        <Fila px={px} color="#a5613f" />
      </span>
    </span>
  );
}

// "4,6" con coma decimal, como se escribe la nota en Chile.
const NOTA = RESUMEN.rating.toFixed(1).replace(".", ",");

export function GoogleRating({ size = "md" }: { size?: "sm" | "md" }) {
  const { estrella, texto } = TAMANOS[size];

  return (
    <a
      href={GOOGLE_PERFIL.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ver reseñas de Mundo Macetero en Google"
      className="mm-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontSize: texto,
        color: "#4c4944",
        lineHeight: 1.3,
      }}
    >
      <Estrellas valor={RESUMEN.rating} px={estrella} />
      <span>
        <strong style={{ fontWeight: 600 }}>{NOTA} en Google</strong> · {RESUMEN.total} reseñas
      </span>
    </a>
  );
}
