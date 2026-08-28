import { Estrellas, GoogleRating } from "./GoogleRating";
import { GOOGLE_PERFIL, RESENAS } from "../../content/resenas";

// Sección de prueba social para la portada: la nota del perfil y tres reseñas
// textuales. La banda replica el ritmo vertical de <Banda tono="claro"> para
// poder intercalarse entre las demás secciones sin romper la alternancia, y la
// caja interior repite el crema de las cajas de "¿Te ayudamos a elegir?".

const BOTON: React.CSSProperties = {
  display: "inline-block",
  borderRadius: "9px",
  padding: "12px 24px",
  fontSize: "13.5px",
  fontWeight: 600,
};

export function ResenasGoogle() {
  return (
    <section className="mm-reveal" style={{ padding: "64px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ background: "var(--cream)", borderRadius: "14px", padding: "26px 24px" }}>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 600, margin: "0 0 10px" }}
          >
            Lo que dicen nuestros clientes
          </h2>
          <GoogleRating size="md" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: "16px",
              margin: "22px 0 20px",
            }}
          >
            {RESENAS.map((r) => (
              <div
                key={`${r.autor}-${r.fecha}`}
                style={{
                  background: "#fff",
                  border: "1px solid #e9e6e1",
                  borderRadius: "12px",
                  padding: "16px 18px",
                }}
              >
                <Estrellas valor={r.estrellas} px={13} />
                <blockquote style={{ margin: "10px 0 0" }}>
                  <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "#4c4944", margin: 0, textWrap: "pretty" }}>
                    “{r.texto}”
                  </p>
                  <footer style={{ fontSize: "13px", color: "#6f6c66", marginTop: "10px" }}>
                    {r.autor} · {r.fecha}
                  </footer>
                </blockquote>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href={GOOGLE_PERFIL.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-btn-select"
              style={{ ...BOTON, border: "1px solid #2a2925" }}
            >
              Ver todas las reseñas en Google
            </a>
            <a
              href={GOOGLE_PERFIL.urlEscribir}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-btn-select"
              style={{ ...BOTON, border: "1px solid #d8d5cf" }}
            >
              Dejar una reseña
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
