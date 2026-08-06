import type { Metadata } from "next";
import { LeadForm, type Field } from "../../components/forms/LeadForm";
import { TIENDA } from "../../content/site";

export const metadata: Metadata = {
  title: "Tu espacio con un macetero",
  description:
    "Mándanos una foto de tu terraza, jardín o living y te la devolvemos transformada con nuestros maceteros.",
};

const FIELDS: Field[] = [
  { name: "nombre", placeholder: "Nombre *", kind: "text", required: true, half: true },
  { name: "email", placeholder: "Correo *", kind: "email", required: true, half: true },
  { name: "telefono", placeholder: "Teléfono / WhatsApp", kind: "tel" },
  {
    name: "mensaje",
    placeholder: "¿Qué te imaginas? Estilo, colores, cantidad de maceteros…",
    kind: "textarea",
    rows: 4,
  },
];

export default function TuEspacioPage() {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 8px" }}>
        ¿Quieres ver tu espacio con un macetero nuestro?
      </h1>
      <p style={{ fontSize: "15px", color: "#6f6c66", margin: "0 0 26px" }}>
        Mándanos una foto de tu terraza, jardín o living. Te la devolvemos transformada con nuestros maceteros, para que
        veas cómo quedaría antes de comprar.
      </p>
      <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "14px", padding: "24px" }}>
        <LeadForm
          tipo="espacio"
          fields={FIELDS}
          submitLabel="Quiero ver mi espacio"
          okTitle="¡Recibimos tus datos!"
          okBody="Ahora mándanos la foto y te devolvemos tu espacio transformado dentro de 2 días hábiles."
          nota={
            <>
              Envía la foto por{" "}
              <a href={TIENDA.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: "#a5613f", fontWeight: 600 }}>
                WhatsApp
              </a>{" "}
              o a {TIENDA.email}, así llega en buena calidad y queda asociada a tu correo.
            </>
          }
        />
      </div>
    </div>
  );
}
