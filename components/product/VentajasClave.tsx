import { VENTAJAS_CLAVE } from "../../content/valor";

// La razón por la que este macetero cuesta lo que cuesta, junto al precio y al
// botón de comprar. Es información que ya existía en la ficha, pero escondida
// dentro del acordeón "Material y cuidados": quien decidía en 20 segundos nunca
// la abría.
//
// Deliberadamente son tres, con la cifra primero: no es un párrafo más de texto,
// es lo que hace que el producto no se compare con un macetero cualquiera.
export function VentajasClave() {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "0 0 22px",
        padding: "14px 0",
        borderTop: "1px solid #e3e1dc",
        borderBottom: "1px solid #e3e1dc",
        display: "flex",
        flexDirection: "column",
        gap: "11px",
      }}
    >
      {VENTAJAS_CLAVE.map((v) => (
        <li key={v.titulo} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
          <span
            className="font-display"
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#a5613f",
              minWidth: "54px",
              flex: "none",
              lineHeight: 1.2,
            }}
          >
            {v.destacado}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ fontSize: "13.5px", fontWeight: 700, display: "block", lineHeight: 1.35 }}>
              {v.titulo}
            </span>
            <span style={{ fontSize: "12.5px", color: "#6f6c66", lineHeight: 1.5, textWrap: "pretty" }}>
              {v.detalle}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
