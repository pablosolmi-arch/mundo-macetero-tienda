// Social proof from the Google Business Profile "Mundo Macetero y Arquipol".
// Source: https://maps.app.goo.gl/eoZEtA5Z3YXaLnq7A (read on 2026-08-27).
// Update RESUMEN when the profile changes and append quotes to RESENAS as they
// are collected from the Business Profile panel. Only public reviews, first
// name + initial, verbatim text.

export const GOOGLE_PERFIL = {
  url: "https://maps.app.goo.gl/eoZEtA5Z3YXaLnq7A",
  urlEscribir: "https://search.google.com/local/writereview?placeid=&cid=11942874174915233299",
  nombre: "Mundo Macetero y Arquipol",
} as const;

export const RESUMEN = {
  rating: 4.6,
  total: 22,
  actualizado: "2026-08-27",
} as const;

export type Resena = {
  autor: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  /** Relative or absolute, as shown by Google. */
  fecha: string;
  texto: string;
};

export const RESENAS: Resena[] = [
  {
    autor: "Enrique D.",
    estrellas: 5,
    fecha: "2025",
    texto: "Excelente lugar y muy buena atención.",
  },
  {
    autor: "Carla G.",
    estrellas: 5,
    fecha: "2021",
    texto: "Excelente atención y productos de muy buen diseño.",
  },
  {
    autor: "Alejandro R.",
    estrellas: 5,
    fecha: "2021",
    texto: "Muy buenos productos, maceteros y molduras de poliestireno. Deberían publicitarse más.",
  },
];
