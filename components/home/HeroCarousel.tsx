"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "../../content/site";

// Auto-advancing hero from the design: cross-fading slides with a slow Ken Burns
// zoom. Todos los slides comparten la misma composición (foto + título +
// subtítulo + botón blanco); el primero es el de marca y carga con prioridad.
// Los controles (flecha, puntos, flecha) van en una franja clara bajo la foto,
// como en el sitio de referencia.
export function HeroCarousel({ slides }: { slides: (HeroSlide & { image: string | null })[] }) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIdx((i) => (i + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [total]);

  const prev = () => setIdx((i) => (i + total - 1) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  // Capa común de cada slide: el cruzado de opacidad no depende del contenido.
  const capa = (i: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transition: "opacity .7s",
    opacity: i === idx ? 1 : 0,
    zIndex: i === idx ? 2 : 1,
    pointerEvents: i === idx ? "auto" : "none",
  });

  return (
    <>
      <section
        className="mm-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#e7e4df",
        }}
      >
        {slides.map((s, i) => (
          <div key={s.titulo} style={capa(i)}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, animation: "mmKen 16s ease-in-out infinite alternate" }}>
                {s.image && (
                  <picture>
                    {s.imagenMovil && <source media="(max-width: 1023px)" srcSet={s.imagenMovil} />}
                    <img
                      src={s.image}
                      alt={s.alt ?? ""}
                      // El encuadre móvil solo se corrige en el slide que trae su
                      // propia foto; los banners del catálogo van centrados.
                      className={s.imagen ? "mm-hero-img" : undefined}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </picture>
                )}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                // El slide que trae su propia foto conserva su degradado, más
                // profundo a la izquierda: la loza es clara y el texto blanco se
                // perdería con el degradado de los banners del catálogo.
                background: s.imagen
                  ? "linear-gradient(100deg,rgba(18,20,16,.82) 0%,rgba(18,20,16,.55) 42%,rgba(18,20,16,.05) 75%)"
                  : "linear-gradient(90deg,rgba(24,22,19,.55) 0%,rgba(24,22,19,.25) 55%,rgba(24,22,19,0) 80%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 68px", width: "100%" }}>
                <div style={{ maxWidth: "560px", color: "#fff" }}>
                  <h2
                    className="font-display"
                    style={{
                      fontSize: "clamp(26px,4vw,44px)",
                      fontWeight: 700,
                      lineHeight: 1.15,
                      margin: 0,
                      textWrap: "pretty",
                      textShadow: "0 2px 18px rgba(0,0,0,.35)",
                    }}
                  >
                    {s.titulo}
                  </h2>
                  <p
                    style={{
                      fontSize: "clamp(14px,1.6vw,17px)",
                      margin: "14px 0 22px",
                      opacity: 0.92,
                      textShadow: "0 1px 10px rgba(0,0,0,.4)",
                    }}
                  >
                    {s.sub}
                  </p>
                  <Link
                    href={s.href}
                    className="mm-btn-white"
                    style={{
                      pointerEvents: "auto",
                      display: "inline-block",
                      padding: "13px 26px",
                      borderRadius: "9px",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    {s.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="mm-hero-controles">
        <button onClick={prev} aria-label="Anterior" className="mm-hero-flecha">
          ‹
        </button>
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Ir a la imagen ${i + 1}`}
            aria-current={i === idx ? "true" : undefined}
            className="mm-hero-punto"
            style={{ background: i === idx ? "#2a2925" : "transparent" }}
          />
        ))}
        <button onClick={next} aria-label="Siguiente" className="mm-hero-flecha">
          ›
        </button>
      </div>
    </>
  );
}
