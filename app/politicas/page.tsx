import type { Metadata } from "next";
import { TIENDA } from "../../content/site";
import { POLITICAS } from "../../content/policies";

export const metadata: Metadata = {
  title: "Políticas de la tienda",
  description: "Política de envío, reembolso, privacidad y términos del servicio de Mundo Macetero.",
};

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "16px 20px",
};

const SUMMARY: React.CSSProperties = { fontSize: "15px", fontWeight: 700, cursor: "pointer" };
const BODY: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#4c4944",
  margin: "12px 0 0",
};

export default function PoliticasPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 26px" }}>
        Políticas de la tienda
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {POLITICAS.map((politica, i) => (
          <details key={politica.slug} id={politica.slug} style={CARD} open={i === 0}>
            <summary style={SUMMARY}>{politica.titulo}</summary>
            {politica.parrafos.map((parrafo, j) => (
              <p key={j} style={BODY}>
                {parrafo}
              </p>
            ))}
          </details>
        ))}

        <details style={CARD}>
          <summary style={SUMMARY}>Información de contacto</summary>
          <p style={BODY}>
            {TIENDA.direccion} · {TIENDA.horario} · {TIENDA.telefonos.join(" · ")} · {TIENDA.email}
          </p>
        </details>
      </div>
    </div>
  );
}
