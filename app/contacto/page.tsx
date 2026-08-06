import type { Metadata } from "next";
import { LeadForm, type Field } from "../../components/forms/LeadForm";
import { TIENDA } from "../../content/site";

export const metadata: Metadata = {
  title: "Proyecto Profesional",
  description:
    "Paisajistas, arquitectos, constructoras e inmobiliarias: cuéntanos tu proyecto y te preparamos una propuesta con precios por volumen.",
};

const FIELDS: Field[] = [
  { name: "nombre", placeholder: "Nombre *", kind: "text", required: true },
  { name: "empresa", placeholder: "Empresa", kind: "text" },
  { name: "email", placeholder: "Correo *", kind: "email", required: true, half: true },
  { name: "telefono", placeholder: "Teléfono", kind: "tel", half: true },
  {
    name: "tipoProyecto",
    placeholder: "Tipo de proyecto",
    kind: "select",
    options: ["Paisajismo", "Inmobiliario", "Arquitectura / construcción", "Hotelería y comercio", "Otro"],
  },
  {
    name: "mensaje",
    placeholder: "Cuéntanos del proyecto: cantidades, plazos, ubicación…",
    kind: "textarea",
    rows: 5,
  },
];

export default function ContactoPage() {
  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 8px" }}>
        Proyecto Profesional
      </h1>
      <p style={{ fontSize: "15px", color: "#6f6c66", margin: "0 0 30px", maxWidth: "640px" }}>
        ¿Eres paisajista, arquitecto, constructora o inmobiliaria? Cuéntanos tu proyecto y te preparamos una propuesta
        con precios por volumen.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "14px", padding: "24px" }}>
          <LeadForm
            tipo="proyecto"
            fields={FIELDS}
            submitLabel="Enviar mensaje"
            okTitle="Mensaje enviado"
            okBody="Te contactaremos dentro de 1 día hábil."
          />
        </div>
        <div style={{ background: "#23221f", color: "#efece6", borderRadius: "14px", padding: "26px" }}>
          <div className="font-display" style={{ fontWeight: 600, fontSize: "17px", marginBottom: "16px" }}>
            Contáctanos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", fontSize: "13.5px", lineHeight: 1.5 }}>
            <a
              href="https://goo.gl/maps/x5Kixi1EfCGNdQpL9"
              target="_blank"
              rel="noopener noreferrer"
              className="mm-footer-link"
              style={{ color: "#efece6" }}
            >
              📍 {TIENDA.direccion}
            </a>
            <span style={{ color: "#a29d94" }}>Horarios: {TIENDA.horario}</span>
            {TIENDA.telefonos.map((t) => (
              <a key={t} href={`tel:${t.replace(/\s/g, "")}`} className="mm-footer-link" style={{ color: "#efece6" }}>
                {t}
              </a>
            ))}
            <a href={`mailto:${TIENDA.email}`} className="mm-footer-link" style={{ color: "#efece6" }}>
              {TIENDA.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
