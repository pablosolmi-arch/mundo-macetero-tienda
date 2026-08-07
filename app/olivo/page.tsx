import Link from "next/link";
import type { Metadata } from "next";
import { getActiveProductsWithVariants } from "../../queries/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Maceteros para tu Olivo",
  description:
    "Qué macetero elegir para un olivo y cómo cuidarlo: medidas recomendadas, riego, drenaje y poda.",
};

const CUIDADOS = [
  "Sol directo: mínimo 6 horas diarias.",
  "Riego moderado: deja secar el sustrato entre riegos.",
  "Drenaje obligatorio: pide tu macetero con perforación.",
  "Sustrato aireado, con arena o perlita.",
  "Poda ligera a fines de invierno para mantener la copa.",
];

export default async function OlivoPage() {
  const productos = await getActiveProductsWithVariants();
  // Link to the models actually in the catalog rather than to fixed slugs.
  const sugeridos = ["macetero-gotar-g5", "macetero-redondo", "macetero-ri"]
    .map((slug) => productos.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const hero = productos.find((p) => (p.images?.length ?? 0) > 4)?.images?.[3] ?? null;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 22px" }}>
        Maceteros para tu Olivo
      </h1>
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          aspectRatio: "16/8",
          background: "#e7e4df",
          marginBottom: "26px",
        }}
      >
        {hero && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}  loading="lazy" decoding="async" />
        )}
      </div>
      <div style={{ fontSize: "15px", lineHeight: 1.75, color: "#4c4944" }}>
        <p style={{ margin: "0 0 14px", textWrap: "pretty" }}>
          El olivo es de las especies que mejor viven en macetero: raíz noble, buen comportamiento en volumen contenido y
          una presencia única. Para un olivo adulto recomendamos maceteros desde 60 cm de diámetro y profundidad
          {sugeridos.length > 0 && (
            <>
              , como{" "}
              {sugeridos.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && (i === sugeridos.length - 1 ? " o " : ", ")}
                  <Link href={`/producto/${p.slug}`} style={{ color: "#a5613f", fontWeight: 600 }}>
                    {p.name}
                  </Link>
                </span>
              ))}
            </>
          )}
          .
        </p>
      </div>
      <h2 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "30px 0 12px" }}>
        Cuidados para tu Olivo
      </h2>
      <ul style={{ fontSize: "15px", lineHeight: 1.9, color: "#4c4944", margin: 0, paddingLeft: "22px" }}>
        {CUIDADOS.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div style={{ background: "#f0ece5", borderRadius: "12px", padding: "18px 20px", marginTop: "26px", fontSize: "14px" }}>
        ¿Dudas con tu caso?{" "}
        <Link href="/asesoramiento" style={{ color: "#a5613f", fontWeight: 700 }}>
          Pide asesoría gratuita →
        </Link>
      </div>
    </div>
  );
}
