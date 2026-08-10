import Link from "next/link";
import type { Metadata } from "next";
import { TERMINACIONES } from "../../../content/site";

export const metadata: Metadata = {
  title: "Paleta de Colores y Terminaciones",
  description: "Terminaciones disponibles para todos los maceteros de Mundo Macetero.",
};

export default function PaletaPage() {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 8px" }}>
        Paleta de Colores y Terminaciones
      </h1>
      <p style={{ fontSize: "15px", color: "#6f6c66", margin: "0 0 28px" }}>
        Todos los maceteros pueden pedirse en estas terminaciones. Los tonos pueden variar levemente por lote: es parte
        del carácter artesanal del material.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px" }}>
        {TERMINACIONES.map((t) => (
          <div
            key={t.id}
            style={{ background: "#fff", border: "1px solid #e9e6e1", borderRadius: "12px", overflow: "hidden" }}
          >
            <div style={{ height: "110px", background: t.hex }} />
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{t.nombre}</div>
              <div style={{ fontSize: "12px", color: "#9b978f", fontFamily: "ui-monospace,monospace" }}>{t.hex}</div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{ background: "#f0ece5", borderRadius: "12px", padding: "18px 20px", marginTop: "26px", fontSize: "14px" }}
      >
        ¿Necesitas ver muestras reales? Visítanos en la tienda de Quilicura o{" "}
        <Link href="/contacto" style={{ color: "#a5613f", fontWeight: 700 }}>
          escríbenos →
        </Link>
      </div>
    </div>
  );
}
