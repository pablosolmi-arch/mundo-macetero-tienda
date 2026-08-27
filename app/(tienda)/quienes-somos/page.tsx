import type { Metadata } from "next";
import { EQUIPO_IMGS } from "../../../content/images";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Quiénes somos · Fabricantes de maceteros livianos en Chile",
  alternates: { canonical: "/quienes-somos" },
  description:
    "Mundo Macetero: maceteros ultra livianos tipo cemento fabricados en Chile, en nuestro taller de Quilicura.",
};

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "22px",
};

const VALORES = [
  {
    titulo: "Calidad",
    texto: "Materiales resistentes a la intemperie y terminaciones cuidadas pieza a pieza.",
  },
  {
    titulo: "Diseño de espacios",
    texto: "Te asesoramos para elegir formatos, colores y composiciones para tu espacio.",
  },
  {
    titulo: "Experiencia",
    texto: "Años de proyectos residenciales, comerciales e inmobiliarios en todo Chile.",
  },
];

export default function QuienesSomosPage() {
  const hero = EQUIPO_IMGS[0] ?? null;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "#a5613f",
          marginBottom: "10px",
        }}
      >
        Calidad | Diseño de espacios | Experiencia
      </div>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 22px" }}>
        Quiénes somos
      </h1>
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          aspectRatio: "16/7",
          background: "#e7e4df",
          marginBottom: "28px",
        }}
      >
        {hero && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={hero}
            alt="Alejandro de Solminihac y Karina Salinas con el equipo de Mundo Macetero"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
           loading="lazy" decoding="async" />
        )}
      </div>
      <div
        style={{
          fontSize: "15.5px",
          lineHeight: 1.75,
          color: "#4c4944",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "760px",
        }}
      >
        <p style={{ margin: 0, textWrap: "pretty" }}>
          Mundo Macetero nace de una necesidad concreta: construir jardines hermosos, con árboles y plantas a gran
          altura, sin que el proceso sea difícil ni costoso. La respuesta fueron nuestros maceteros ultra livianos tipo
          cemento, de fácil manipulación e instalación.
        </p>
        <p style={{ margin: 0, textWrap: "pretty" }}>
          Detrás del proyecto estamos Alejandro de Solminihac y Karina Salinas, co-fundadores, junto a un equipo de
          profesionales dedicados a la calidad y al diseño de cada pieza. Trabajamos con particulares, paisajistas,
          arquitectos e inmobiliarias, desde un macetero para el balcón hasta proyectos completos.
        </p>
        <p style={{ margin: 0, textWrap: "pretty" }}>
          Fabricamos en Chile, en nuestro taller de Quilicura, donde también puedes retirar tus compras y ver los
          productos en persona.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
          marginTop: "36px",
        }}
      >
        {VALORES.map((v) => (
          <div key={v.titulo} style={CARD}>
            <div className="font-display" style={{ fontWeight: 600, fontSize: "16px", marginBottom: "6px" }}>
              {v.titulo}
            </div>
            <div style={{ fontSize: "13.5px", color: "#6f6c66", lineHeight: 1.6 }}>{v.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
