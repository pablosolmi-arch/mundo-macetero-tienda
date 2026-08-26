"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { HeroSlide } from "../../content/site";

// Auto-advancing hero from the design: cross-fading slides with a slow Ken Burns
// zoom, prev/next arrows and pill indicators. Images come from the catalog.
// `destacado` es un primer slide con su propia composición (el hero de marca);
// los slides de `slides` siguen con la estructura imagen + título + botón.
export function HeroCarousel({
  slides,
  destacado,
}: {
  slides: (HeroSlide & { image: string | null })[];
  destacado?: ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const total = slides.length + (destacado ? 1 : 0);

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

  const desfase = destacado ? 1 : 0;

  return (
    <section
      className="mm-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#e7e4df",
      }}
    >
      {destacado && <div style={capa(0)}>{destacado}</div>}

      {slides.map((s, i) => (
        <div key={s.titulo} style={capa(i + desfase)}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, animation: "mmKen 16s ease-in-out infinite alternate" }}>
              {s.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg,rgba(24,22,19,.55) 0%,rgba(24,22,19,.25) 55%,rgba(24,22,19,0) 80%)",
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

      <button
        onClick={prev}
        aria-label="Anterior"
        className="mm-hero-flecha"
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          background: "rgba(255,255,255,.85)",
          border: "none",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "16px",
          color: "#2a2925",
        }}
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Siguiente"
        className="mm-hero-flecha"
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          background: "rgba(255,255,255,.85)",
          border: "none",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "16px",
          color: "#2a2925",
        }}
      >
        ›
      </button>
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          zIndex: 5,
          display: "flex",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Ir al slide ${i + 1}`}
            style={{
              width: i === idx ? "22px" : "8px",
              height: "8px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              background: i === idx ? "#fff" : "rgba(255,255,255,.55)",
              transition: "all .25s",
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
}
