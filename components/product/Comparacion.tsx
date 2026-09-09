import { COMPARACION, COMPARACION_COLUMNAS, COMPARACION_TITULO } from "../../content/valor";

// Por qué es mejor que la alternativa tradicional, sin hablar de precio.
//
// La columna de la derecha se queda en propiedades del material (peso, aislación,
// comportamiento a la intemperie): no dice nada sobre otras marcas ni sobre lo
// que cobran. La idea es que el cliente entienda que está comparando dos cosas
// distintas, no dos precios.
export function Comparacion() {
  return (
    <section style={{ marginTop: "56px" }}>
      <h2
        className="font-display"
        style={{ fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 600, margin: "0 0 18px" }}
      >
        {COMPARACION_TITULO}
      </h2>
      {/* Scroll propio: en teléfonos angostos la tabla se desliza sola en vez de
          empujar el ancho de la página. */}
      <div style={{ overflowX: "auto", border: "1px solid #e9e6e1", borderRadius: "14px", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: "22%" }} />
              <th style={{ ...TH, color: "#2a2925", background: "#f6f2ec" }}>
                {COMPARACION_COLUMNAS.nuestro}
              </th>
              <th style={{ ...TH, color: "#6f6c66" }}>{COMPARACION_COLUMNAS.tradicional}</th>
            </tr>
          </thead>
          <tbody>
            {COMPARACION.map((fila) => (
              <tr key={fila.aspecto}>
                <th scope="row" style={{ ...TD, fontWeight: 700, textAlign: "left", color: "#6f6c66" }}>
                  {fila.aspecto}
                </th>
                <td style={{ ...TD, fontWeight: 600, background: "#f6f2ec" }}>{fila.nuestro}</td>
                <td style={{ ...TD, color: "#6f6c66" }}>{fila.tradicional}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const TH: React.CSSProperties = {
  fontSize: "12.5px",
  fontWeight: 700,
  textAlign: "left",
  padding: "13px 16px",
  borderBottom: "1px solid #e9e6e1",
};

const TD: React.CSSProperties = {
  fontSize: "13.5px",
  padding: "13px 16px",
  borderBottom: "1px solid #f0eeea",
  verticalAlign: "top",
  lineHeight: 1.45,
};
