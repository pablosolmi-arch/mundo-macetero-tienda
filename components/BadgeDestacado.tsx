import { DESTACADO } from "../content/menu";

// El más vendido se marca sobre la foto: es la única jerarquía que distingue un
// producto de otro en la grilla, en la ficha y en las tarjetas relacionadas.
// Vive aparte para que la etiqueta se vea igual en todos esos lugares.
export function BadgeDestacado({ slug }: { slug: string }) {
  if (slug !== DESTACADO.slug) return null;

  return (
    <span
      style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        zIndex: 1,
        background: "var(--ink)",
        color: "#fff",
        fontSize: "11px",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        padding: "4px 8px",
        borderRadius: "4px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {DESTACADO.etiqueta}
    </span>
  );
}
