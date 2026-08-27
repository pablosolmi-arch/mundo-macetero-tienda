// app/llms.txt/route.ts
import { getAllCategories, getAllActiveProducts } from "../../queries/catalog";
import { SITE_URL, stripHtml } from "../../lib/seo";
import { COLECCIONES, COLECCION_GENERICA, GUIAS } from "../../content/geo";

// llms.txt: the plain-text index that assistants (ChatGPT, Claude, Perplexity)
// read to understand the site in one request, instead of crawling every page.
// Spec: https://llmstxt.org. Regenerated at most once an hour, like the sitemap.
export const revalidate = 3600;

const HEADER = `# Mundo Macetero

> Mundo Macetero fabrica maceteros de fibrocemento reforzado ultra livianos en Quilicura, Santiago de Chile. Tienen el aspecto y la textura del cemento con cerca de 90% menos peso, resisten sol, lluvia y heladas, y se fabrican a pedido en la forma, tamaño, terminación (cemento natural, blanco, negro, cantera, óxido de cobre) y drenaje (despiche, doble fondo, plato de agua) que cada espacio necesita. Venta online y a proyectos (inmobiliarias, paisajismo, hotelería, retail, municipalidades).

Datos de la empresa:
- Taller y tienda: Las Esteras Norte 2610, Galpón 16, Quilicura, Santiago, Chile. Lunes a viernes 8:30 a 18:00.
- Contacto: mundo@mundomacetero.cl, +56 9 9289 1754 (WhatsApp), +56 9 9829 4954, +56 2 2621 8765.
- Despacho: gratis en el sector oriente de Santiago (Las Condes, Vitacura, Lo Barnechea, Providencia, La Reina, Ñuñoa, Peñalolén); resto de Chile cotizado con transportista; retiro gratis en tienda.
- Pago: Mercado Pago (crédito, débito, prepago) y transferencia. Precios en CLP con IVA.
- Garantía por fallas de fabricación. Fabricación a pedido; plazo informado al confirmar la compra.
- Formatos: cubos 40–120 cm, jardineras 100–200 cm, Gotar S–L, redondos, cónicos, bowl, copón, colonial, Gema, Milán, Marroc, RP, vaso, platos de agua e invertidos.`;

const PAGINAS: [string, string][] = [
  ["Inicio", "/"],
  ["Tienda", "/tienda"],
  ["Quiénes somos", "/quienes-somos"],
  ["Asesoramiento gratuito", "/asesoramiento"],
  ["Tu espacio", "/tu-espacio"],
  ["Preguntas frecuentes", "/preguntas-frecuentes"],
  ["Blog", "/blog"],
  ["Contacto", "/contacto"],
  ["Políticas", "/politicas"],
];

function link(label: string, path: string, description: string): string {
  return `- [${label}](${SITE_URL}${path})${description ? `: ${description}` : ""}`;
}

export async function GET() {
  const [categories, products] = await Promise.all([getAllCategories(), getAllActiveProducts()]);

  const secciones = [
    HEADER,
    [
      "## Colecciones",
      ...categories.map((c) =>
        link(
          c.name,
          `/tienda/${c.slug}`,
          COLECCIONES[c.slug]?.metaDescription ?? COLECCION_GENERICA.metaDescription,
        ),
      ),
    ].join("\n"),
    [
      "## Productos",
      ...products.map((p) =>
        link(p.name, `/producto/${p.slug}`, stripHtml(p.description).slice(0, 160)),
      ),
    ].join("\n"),
    ["## Guías", ...GUIAS.map((g) => link(g.titulo, `/guias/${g.slug}`, g.metaDescription))].join("\n"),
    ["## Páginas", ...PAGINAS.map(([label, path]) => link(label, path, ""))].join("\n"),
    ["## Optional", `- [Sitemap XML](${SITE_URL}/sitemap.xml)`].join("\n"),
  ];

  return new Response(`${secciones.join("\n\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
