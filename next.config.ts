import type { NextConfig } from "next";

// Redirecciones permanentes desde las URLs de la tienda Shopify que vive hoy en
// mundomacetero.cl. Al cortar el dominio hacia Vercel, cada URL antigua tiene que
// llegar a su equivalente aquí: si respondieran 404, Google perdería el
// posicionamiento acumulado de esas páginas y los enlaces publicados en redes,
// campañas y directorios quedarían rotos.
//
// El listado sale del sitemap de Shopify leído el 2026-08-28: 24 productos,
// 25 colecciones, 11 páginas y 6 entradas de blog.

// Los slugs de producto coinciden uno a uno, así que /products/<slug> se traduce
// con una sola regla comodín; estas son las colecciones, páginas y notas, que no.
const REDIRECCIONES: [string, string][] = [
  // ── Colecciones ────────────────────────────────────────────────────────────
  ["/collections/maceteros-cubo", "/tienda/cubo"],
  ["/collections/bowl", "/tienda/bowl"],
  ["/collections/luxor-rp", "/tienda/rp"],
  ["/collections/titan", "/tienda/rp"],
  ["/collections/plato-invertido", "/tienda/plato-invertido"],
  ["/collections/jardineras", "/tienda/jardinera"],
  ["/collections/platos-de-agua", "/tienda/plato-de-agua"],
  ["/collections/conicos", "/tienda/conico"],
  ["/collections/redondos", "/tienda/redondos"],
  ["/collections/milano", "/tienda/milan"],
  ["/collections/copon", "/tienda/copon"],
  ["/collections/vaso", "/tienda/vaso"],
  ["/collections/marroc", "/tienda/marroc"],
  ["/collections/gema-1", "/tienda/gema"],
  ["/collections/gotar", "/tienda/gotar"],
  ["/collections/piedras-decorativas", "/tienda/piedras"],
  ["/collections/belga", "/producto/macetero-belga"],
  ["/collections/piramidales", "/producto/macetero-piramidal"],
  ["/collections/packs", "/producto/macetero-bowl-copia"],
  // Colecciones sin equivalente directo: van a la página de intención más cercana.
  ["/collections/nuestros-disenos", "/maceteros/maceteros-de-diseno"],
  ["/collections/tradicionales", "/maceteros/maceteros-de-cemento"],
  ["/collections/accesorios", "/maceteros/maceteros-con-drenaje"],
  ["/collections/linea-2025", "/maceteros/maceteros-mas-vendidos"],
  ["/collections/sale", "/tienda"],
  ["/collections/desfasado", "/tienda"],
  ["/collections/all", "/tienda"],

  // ── Páginas ────────────────────────────────────────────────────────────────
  ["/pages/contact", "/contacto"],
  ["/pages/quienes-somos", "/quienes-somos"],
  ["/pages/te-asesoramos", "/asesoramiento"],
  ["/pages/tu-espacio-con-nuestro-maceteros", "/tu-espacio"],
  ["/pages/paleta-de-colores-y-terminaciones", "/paleta"],
  ["/pages/tengo-un-olivo", "/olivo"],
  ["/pages/cuidados-para-tu-olivo", "/olivo"],
  ["/pages/macetero-de-autor-gotar", "/producto/macetero-autor-gotar-aqua"],
  ["/pages/macetero-gotar-g9", "/producto/macetero-gotar-g9"],
  ["/pages/macetero-anfora", "/tienda"],
  ["/pages/ven-a-vernos-a-la-expo-pool-garden-en-espacio-riesco-stand-19", "/blog"],

  // ── Blog ───────────────────────────────────────────────────────────────────
  ["/blogs/noticias", "/blog"],
  ["/blogs/ferias-2023", "/blog"],
  ["/blogs/noticias/nuestro-exito-en-la-expo-jardines-2024", "/blog/expo-jardines-2024"],
  ["/blogs/noticias/estuvimos-en-la-feria-de-jardineria", "/blog/feria-jardineria-2022"],
  ["/blogs/noticias/un-nuevo-macetero-de-autor-plumas-al-viento", "/blog/macetero-de-autor-plumas-al-viento"],
  ["/blogs/noticias/feria-plantas-diciembre-2019", "/blog"],

  // ── Slugs propios que cambiaron después de publicarse ──────────────────────
  // La guía pasó a llamarse por la tecnología (EIFS) y su URL anterior ya estaba
  // enviada a Google, así que no puede quedar en 404.
  ["/guias/maceteros-livianos-fibrocemento", "/guias/maceteros-livianos-eifs"],

  // ── Rutas propias de Shopify ───────────────────────────────────────────────
  ["/cart", "/carrito"],
  ["/collections", "/tienda"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Los slugs de producto son los mismos en ambas tiendas.
      { source: "/products/:slug", destination: "/producto/:slug", permanent: true },
      // Shopify sirve el producto también dentro de la colección.
      { source: "/collections/:coleccion/products/:slug", destination: "/producto/:slug", permanent: true },
      // Next evalúa en orden: las rutas con destino propio van antes que los
      // comodines, o el comodín de blog se llevaría las notas ya mapeadas.
      ...REDIRECCIONES.map(([source, destination]) => ({ source, destination, permanent: true })),
      // Cualquier otra nota del blog cae en el índice en vez de dar 404.
      { source: "/blogs/:blog/:articulo", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
