import type { CSSProperties, ReactNode } from "react";

// El sitio actual alterna el color de fondo sección a sección: claro, oscuro,
// claro, oscuro… hasta cerrar con el footer oscuro. Cada bloque de la home se
// envuelve en esta banda para no repetir el fondo, el ancho y el padding, y para
// que no queden márgenes sueltos entre una banda y la siguiente.
export function Banda({
  tono,
  children,
  fondo,
  interior,
}: {
  tono: "claro" | "oscuro";
  children: ReactNode;
  // Fondo alternativo para una banda clara puntual (por ejemplo el crema del
  // newsletter). El tono sigue mandando en los colores de texto.
  fondo?: string;
  interior?: CSSProperties;
}) {
  const oscuro = tono === "oscuro";

  return (
    <section
      className="mm-reveal"
      style={{
        background: fondo ?? (oscuro ? "var(--ink)" : "var(--background)"),
        color: oscuro ? "var(--on-ink)" : "var(--foreground)",
        padding: "64px 0",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", ...interior }}>
        {children}
      </div>
    </section>
  );
}
