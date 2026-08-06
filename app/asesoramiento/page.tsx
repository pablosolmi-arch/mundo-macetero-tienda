import type { Metadata } from "next";
import { LeadForm, type Field } from "../../components/forms/LeadForm";
import { TIENDA } from "../../content/site";

export const metadata: Metadata = {
  title: "Te asesoramos",
  description:
    "Cuéntanos qué planta tienes y dónde vivirá: te recomendamos el macetero ideal en modelo, medida y terminación.",
};

const PASOS = [
  { n: "1 · Cuéntanos", t: "Qué planta tienes y dónde vivirá: interior, terraza, jardín." },
  { n: "2 · Te recomendamos", t: "Modelo, medida y color según la especie y el espacio." },
  { n: "3 · Lo recibes", t: "Compra con despacho o retiro, listo para plantar." },
];

const FIELDS: Field[] = [
  { name: "nombre", placeholder: "Nombre *", kind: "text", required: true, half: true },
  { name: "email", placeholder: "Correo *", kind: "email", required: true, half: true },
  { name: "telefono", placeholder: "Teléfono", kind: "tel", half: true },
  {
    name: "ubicacion",
    placeholder: "¿Interior o exterior?",
    kind: "select",
    options: ["Interior", "Exterior", "Ambos"],
    half: true,
  },
  {
    name: "planta",
    placeholder: "¿Qué planta o árbol tienes? (ej: olivo, ficus, palmera…)",
    kind: "text",
  },
  { name: "medidas", placeholder: "Medidas aproximadas del espacio (opcional)", kind: "text" },
  { name: "mensaje", placeholder: "Comentarios adicionales", kind: "textarea", rows: 4 },
];

export default function AsesoramientoPage() {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 8px" }}>
        ¿Cuál es el macetero ideal para tu planta?
      </h1>
      <p style={{ fontSize: "15px", color: "#6f6c66", margin: "0 0 26px" }}>
        Te lo decimos nosotros. Completa el formulario y nuestro equipo te responde con una recomendación de modelo,
        medida y terminación.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: "12px",
          marginBottom: "30px",
        }}
      >
        {PASOS.map((p) => (
          <div key={p.n} style={{ background: "#f0ece5", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{p.n}</div>
            <div style={{ fontSize: "12.5px", color: "#6f6c66", lineHeight: 1.5 }}>{p.t}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "14px", padding: "24px" }}>
        <LeadForm
          tipo="asesoria"
          fields={FIELDS}
          submitLabel="¡Quiero que me asesoren!"
          okTitle="¡Recibimos tu solicitud!"
          okBody="Te enviaremos una recomendación personalizada dentro de 1 día hábil."
          nota={
            <>
              Si quieres mandarnos una foto de tu planta o espacio, escríbenos por{" "}
              <a href={TIENDA.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: "#a5613f", fontWeight: 600 }}>
                WhatsApp
              </a>{" "}
              o a {TIENDA.email}.
            </>
          }
        />
      </div>
    </div>
  );
}
