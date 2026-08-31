"use client";

import { useState } from "react";
import { BadgeDestacado } from "../BadgeDestacado";

// Main image plus a four-up thumbnail strip, as in the design. The main image
// zooms slightly on hover.
export function ProductGallery({
  images,
  thumbs,
  alt,
  slug,
}: {
  images: string[];
  // Miniaturas de 600 px para la tira inferior; la imagen grande usa `images`.
  thumbs?: string[];
  alt: string;
  // El slug decide si la foto grande lleva la etiqueta del más vendido.
  slug: string;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0] ?? null;
  const tira = (thumbs?.length ? thumbs : images).slice(0, 8);

  return (
    <div>
      <div
        style={{
          position: "relative",
          borderRadius: "14px",
          overflow: "hidden",
          aspectRatio: "1/1",
          background: "#e7e4df",
        }}
      >
        <div className="mm-zoom" style={{ width: "100%", height: "100%" }}>
          {main && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={main}
              alt={alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
             loading="lazy" decoding="async" />
          )}
        </div>
        <BadgeDestacado slug={slug} />
      </div>
      {tira.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginTop: "10px" }}>
          {tira.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                aspectRatio: "1/1",
                background: "#eceae6",
                padding: 0,
                cursor: "pointer",
                border: i === active ? "1.5px solid #2a2925" : "1px solid #e3e1dc",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt}, vista ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}  loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
