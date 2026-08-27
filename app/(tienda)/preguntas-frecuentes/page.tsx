import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "../../../components/site/Breadcrumb";
import { FaqList } from "../../../components/site/FaqList";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, serializeJsonLd } from "../../../lib/seo";
import { FAQ_GENERAL, GUIAS } from "../../../content/geo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Preguntas frecuentes sobre maceteros de fibrocemento",
  description:
    "Material, resistencia al exterior, drenaje, despacho, plazos de fabricación, garantía y medios de pago de los maceteros livianos de Mundo Macetero.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    buildFaqJsonLd(FAQ_GENERAL),
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Preguntas frecuentes", path: "/preguntas-frecuentes" },
    ]),
  ],
};

export default function PreguntasFrecuentesPage() {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(JSON_LD) }} />

      <Breadcrumb items={[{ nombre: "Inicio", href: "/" }, { nombre: "Preguntas frecuentes" }]} />

      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 14px" }}>
        Preguntas frecuentes sobre nuestros maceteros
      </h1>
      <p style={{ fontSize: "15.5px", lineHeight: 1.75, color: "#4c4944", margin: "0 0 32px", textWrap: "pretty" }}>
        Todo lo que nos preguntan antes de comprar: de qué está hecho un macetero de fibrocemento, cómo se comporta
        afuera, qué drenaje pedir, cuánto demora la fabricación y cómo funcionan el despacho, la garantía y el pago.
      </p>

      <FaqList faqs={FAQ_GENERAL} />

      <div style={{ marginTop: "44px" }}>
        <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 6px" }}>
          Guías para elegir tu macetero
        </h2>
        <p style={{ fontSize: "14px", color: "#6f6c66", lineHeight: 1.6, margin: "0 0 16px" }}>
          Si tu duda es más de fondo, estas guías la responden en detalle.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {GUIAS.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="mm-link"
              style={{ fontSize: "14.5px", fontWeight: 600, color: "#a5613f", lineHeight: 1.5 }}
            >
              {g.titulo} →
            </Link>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: "44px",
          background: "var(--cream)",
          borderRadius: "14px",
          padding: "26px 24px",
        }}
      >
        <div className="font-display" style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
          ¿No encontraste tu respuesta?
        </div>
        <p style={{ fontSize: "14px", color: "#4c4944", lineHeight: 1.65, margin: "0 0 16px", textWrap: "pretty" }}>
          Cuéntanos qué planta tienes y dónde vivirá: te recomendamos modelo, medida y terminación sin costo.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href="/asesoramiento"
            className="mm-btn-select"
            style={{
              display: "inline-block",
              border: "1px solid #2a2925",
              borderRadius: "9px",
              padding: "12px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            Asesoría gratuita
          </Link>
          <Link
            href="/contacto"
            className="mm-btn-select"
            style={{
              display: "inline-block",
              border: "1px solid #d8d5cf",
              borderRadius: "9px",
              padding: "12px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            Escríbenos
          </Link>
        </div>
      </div>
    </div>
  );
}
