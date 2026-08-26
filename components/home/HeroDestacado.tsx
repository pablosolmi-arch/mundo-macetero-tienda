import Link from "next/link";
import { Marcellus } from "next/font/google";

// Primer slide del hero, según el diseño aprobado "Opción 1B": foto a sangre
// completa con overlay oscuro y el mensaje de marca a la izquierda. El titular es
// el h1 de la portada; los demás slides del carrusel siguen usando h2.

// Marcellus se carga solo para este bloque: es la única serif del sitio.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const CHIPS = [
  "Hasta 90% más livianos que el concreto",
  "Ahorran hasta 40% de agua · térmicos",
  "Diseños únicos",
];

export function HeroDestacado() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <picture>
        <source media="(max-width: 1023px)" srcSet="/hero/plato-de-agua-1000.webp" />
        <img
          src="/hero/plato-de-agua-2000.webp"
          alt="Macetero plato de agua de Mundo Macetero con planta, en exterior"
          className="mm-hero-img"
          width={2000}
          height={2000}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </picture>

      {/* Overlay diagonal en escritorio; en móvil sube desde abajo, donde queda el texto. */}
      <div
        className="mm-desktop-only-block"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, rgba(18,20,16,0.82) 0%, rgba(18,20,16,0.55) 42%, rgba(18,20,16,0.05) 75%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="mm-mobile-only-block"
        style={{
          position: "absolute",
          inset: 0,
          // El titular ocupa casi todo el alto en móvil, así que el tramo alto del
          // gradiente sube de 0.2 a 0.45 para no perder contraste sobre el follaje.
          background:
            "linear-gradient(0deg, rgba(18,20,16,0.88) 0%, rgba(18,20,16,0.62) 55%, rgba(18,20,16,0.45) 100%)",
          pointerEvents: "none",
        }}
      />

      <div className="mm-hero-contenido">
        <div className="mm-hero-sobretitulo">Mundo Macetero</div>
        <h1 className={`${marcellus.className} mm-hero-titular`}>
          Maceteros ultra livianos que transforman tus espacios
        </h1>
        <div className="mm-hero-chips">
          {CHIPS.map((c) => (
            <span key={c} className="mm-hero-chip">
              {c}
            </span>
          ))}
        </div>
        <div>
          <Link href="/tienda" className="mm-hero-cta">
            Ver los más vendidos
          </Link>
        </div>
      </div>
    </div>
  );
}
