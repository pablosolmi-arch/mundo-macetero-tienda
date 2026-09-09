import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm, type Field } from "../../../components/forms/LeadForm";
import { TIENDA } from "../../../content/site";
import { getProductBySlug } from "../../../queries/catalog";

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

// La ficha de producto manda ?producto=<slug> al apretar "quiero que me
// asesoren". Sirve para dos cosas: que el cliente vea que no perdió lo que
// estaba mirando, y que la solicitud llegue diciendo por qué macetero pregunta.
// Un slug inventado en la URL simplemente no muestra nada.
interface Props {
  searchParams: Promise<{ producto?: string }>;
}

export default async function AsesoramientoPage({ searchParams }: Props) {
  const { producto } = await searchParams;
  const desde = producto ? await getProductBySlug(producto) : null;
  const consultado = desde && desde.status === "active" ? desde : null;

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
      {consultado && (
        <div
          style={{
            background: "#f6f2ec",
            border: "1px solid #e9e2d6",
            borderRadius: "12px",
            padding: "13px 16px",
            marginBottom: "18px",
            fontSize: "13.5px",
          }}
        >
          Consultando por{" "}
          <Link href={`/producto/${consultado.slug}`} style={{ fontWeight: 700, textDecoration: "underline" }}>
            {consultado.name}
          </Link>
          . Cuéntanos tu planta y tu espacio y te confirmamos si es la medida correcta.
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "14px", padding: "24px" }}>
        <LeadForm
          tipo="asesoria"
          contexto={consultado ? `Consulta desde la ficha: ${consultado.name} (${consultado.slug})` : undefined}
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
