import type { Metadata } from "next";
import { Breadcrumb } from "../../../components/site/Breadcrumb";
import { InstagramFeed } from "../../../components/site/InstagramFeed";
import { TIENDA } from "../../../content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Instagram · Nuestros maceteros en espacios reales",
  alternates: { canonical: "/instagram" },
  description:
    "Las últimas publicaciones de @mundomacetero: maceteros y jardineras instalados en terrazas, jardines, oficinas y proyectos en Chile.",
};

export default function InstagramPage() {
  return (
    <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <Breadcrumb items={[{ nombre: "Inicio", href: "/" }, { nombre: "Instagram" }]} />

      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 14px" }}>
        Síguenos en Instagram
      </h1>
      <p style={{ fontSize: "15.5px", lineHeight: 1.75, color: "#4c4944", margin: "0 0 32px", textWrap: "pretty" }}>
        En{" "}
        <a
          href={TIENDA.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mm-link"
          style={{ fontWeight: 600, color: "#a5613f" }}
        >
          @mundomacetero
        </a>{" "}
        publicamos nuestros maceteros en espacios reales: terrazas, jardines, oficinas y proyectos que fabricamos en
        Quilicura.
      </p>

      <InstagramFeed minHeight={420} />
    </div>
  );
}
