// Feed de productos para Google Merchant Center (RSS 2.0 con el namespace
// `g:`, https://support.google.com/merchants/answer/7052112). Este módulo es
// puro: recibe el catálogo ya leído y devuelve los items y el XML, para poder
// probarlo sin base de datos ni servidor.

// Mismo valor por defecto que app/layout.tsx y app/sitemap.ts. Vive acá para que
// la ruta del feed no repita la URL literal.
export const URL_SITIO_POR_DEFECTO = "https://fase1-storefront-catalogo.vercel.app";

// Categoría de Google (id 721): maceteros y jardineras.
export const CATEGORIA_GOOGLE = "Home & Garden > Lawn & Garden > Gardening > Pots & Planters";

export const MARCA = "Mundo Macetero";

// Google corta los títulos en 150 caracteres y rechaza descripciones de más de
// 5000, así que se recortan acá y no en Merchant Center.
const MAX_TITULO = 150;
const MAX_DESCRIPCION = 5000;

// Una imagen principal (g:image_link) más hasta 10 adicionales.
const MAX_IMAGENES_ADICIONALES = 10;

export interface VarianteMerchant {
  id: number;
  name: string;
  priceOverride: string | null;
  stock: number;
  available: boolean;
}

export interface ProductoMerchant {
  slug: string;
  name: string;
  description: string;
  basePrice: string;
  images: string[];
  status: string;
  stock: number;
  trackStock: boolean;
  // Nombre de la colección, tal como lo entrega getActiveProductsWithVariants.
  colNombre?: string;
  variants?: VarianteMerchant[];
}

export interface ItemMerchant {
  id: string;
  itemGroupId: string | null;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: "in_stock" | "out_of_stock";
  price: string;
  brand: string;
  condition: "new";
  identifierExists: "no";
  googleProductCategory: string;
  productType: string;
}

// Texto plano para un consumidor automático: sin etiquetas, con las entidades
// decodificadas, espacios colapsados y con el largo máximo de Google. No se
// reutiliza el stripHtml de lib/seo.ts porque ahí basta con quitar las etiquetas
// (el navegador decodifica las entidades al renderizar), mientras que en el feed
// un "&amp;amp;" quedaría literal en la ficha de Google.
export function aTextoPlano(html: string): string {
  const sinEtiquetas = html.replace(/<[^>]*>/g, " ");
  return decodificarEntidades(sinEtiquetas).replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPCION);
}

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (completa, cuerpo: string) => {
    if (cuerpo.startsWith("#")) {
      const codigo =
        cuerpo[1] === "x" || cuerpo[1] === "X"
          ? Number.parseInt(cuerpo.slice(2), 16)
          : Number.parseInt(cuerpo.slice(1), 10);
      // Un código inválido o fuera de rango se deja tal cual antes que romper la
      // descripción con un carácter de reemplazo.
      if (!Number.isFinite(codigo) || codigo <= 0 || codigo > 0x10ffff) return completa;
      return String.fromCodePoint(codigo);
    }
    return ENTIDADES[cuerpo.toLowerCase()] ?? completa;
  });
}

function urlAbsoluta(imagen: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(imagen)) return imagen;
  const base = siteUrl.replace(/\/+$/, "");
  return `${base}${imagen.startsWith("/") ? "" : "/"}${imagen}`;
}

// Misma regla de disponibilidad que lib/seo.ts y lib/catalog.ts: los maceteros se
// fabrican a pedido, así que mientras el producto no controle inventario
// (`trackStock` en false, el caso por defecto) siempre se vende y el `available`
// heredado del import de Shopify no lo agota. Es la misma disponibilidad que
// declara el JSON-LD de la ficha: si el feed dijera "out_of_stock" y la ficha
// "InStock", Google rechaza el item por dato inconsistente.
function disponibilidad(
  producto: ProductoMerchant,
  variante?: VarianteMerchant,
): "in_stock" | "out_of_stock" {
  if (!producto.trackStock) return "in_stock";
  if (variante) {
    return variante.available && variante.stock > 0 ? "in_stock" : "out_of_stock";
  }
  return producto.stock > 0 ? "in_stock" : "out_of_stock";
}

function precioEntero(producto: ProductoMerchant, variante?: VarianteMerchant): number {
  const bruto = variante?.priceOverride ?? producto.basePrice;
  return Math.round(Number(bruto));
}

function recortar(texto: string, max: number): string {
  return texto.length > max ? texto.slice(0, max).trimEnd() : texto;
}

export function construirItemsMerchant(
  productos: ProductoMerchant[],
  siteUrl: string,
): ItemMerchant[] {
  const items: ItemMerchant[] = [];

  for (const producto of productos) {
    // Un producto archivado no tiene ficha (la page responde 404), así que
    // enviarlo solo genera items rechazados.
    if (producto.status !== "active") continue;

    const imagenes = producto.images.filter(Boolean).map((img) => urlAbsoluta(img, siteUrl));
    // Google exige g:image_link: un producto sin foto no forma un item válido.
    if (imagenes.length === 0) continue;

    const descripcion = aTextoPlano(producto.description);
    const productType = producto.colNombre ?? "";
    const variantes = producto.variants ?? [];

    const base = {
      description: descripcion,
      imageLink: imagenes[0],
      additionalImageLinks: imagenes.slice(1, 1 + MAX_IMAGENES_ADICIONALES),
      brand: MARCA,
      condition: "new" as const,
      identifierExists: "no" as const,
      googleProductCategory: CATEGORIA_GOOGLE,
      productType,
    };

    if (variantes.length === 0) {
      const precio = precioEntero(producto);
      // Un precio 0 (o inválido) es un item rechazado por Google, igual que una
      // variante sin precio.
      if (!Number.isFinite(precio) || precio <= 0) continue;
      items.push({
        ...base,
        id: producto.slug,
        itemGroupId: null,
        title: recortar(producto.name, MAX_TITULO),
        link: `${siteUrl}/producto/${producto.slug}`,
        availability: disponibilidad(producto),
        price: `${precio} CLP`,
      });
      continue;
    }

    for (const variante of variantes) {
      const precio = precioEntero(producto, variante);
      if (!Number.isFinite(precio) || precio <= 0) continue;
      items.push({
        ...base,
        id: `${producto.slug}-${variante.id}`,
        // Todas las variantes de un producto son el mismo artículo en distintas
        // configuraciones: Merchant Center las agrupa por item_group_id.
        itemGroupId: producto.slug,
        title: recortar(`${producto.name} - ${variante.name}`, MAX_TITULO),
        link: `${siteUrl}/producto/${producto.slug}?variante=${variante.id}`,
        availability: disponibilidad(producto, variante),
        price: `${precio} CLP`,
      });
    }
  }

  return items;
}

export function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function etiqueta(nombre: string, valor: string): string {
  return `      <${nombre}>${escaparXml(valor)}</${nombre}>`;
}

// No se declara g:shipping. La regla real de envío (lib/pricing.ts + content/site.ts)
// es: retiro gratis en Quilicura, despacho gratis solo en las comunas del sector
// oriente de Santiago y, para el resto de la RM y regiones, el despacho lo cotiza
// un transportista externo después de la compra. O sea el costo es variable y la
// tienda no lo puede calcular, así que declarar "0 CLP" a nivel de item sería
// declarar despacho gratis a todo Chile. El envío se configura en Merchant Center
// (ver docs/google-merchant.md), que es donde se puede expresar por región.
function itemXml(item: ItemMerchant): string {
  const lineas = [
    etiqueta("g:id", item.id),
    etiqueta("g:title", item.title),
    etiqueta("g:description", item.description),
    etiqueta("g:link", item.link),
    etiqueta("g:image_link", item.imageLink),
    ...item.additionalImageLinks.map((url) => etiqueta("g:additional_image_link", url)),
    etiqueta("g:availability", item.availability),
    etiqueta("g:price", item.price),
    etiqueta("g:brand", item.brand),
    etiqueta("g:condition", item.condition),
    etiqueta("g:identifier_exists", item.identifierExists),
    etiqueta("g:google_product_category", item.googleProductCategory),
  ];

  if (item.itemGroupId) lineas.splice(1, 0, etiqueta("g:item_group_id", item.itemGroupId));
  if (item.productType) lineas.push(etiqueta("g:product_type", item.productType));

  return `    <item>\n${lineas.join("\n")}\n    </item>`;
}

export function renderFeedXml(
  items: ItemMerchant[],
  siteUrl: string = URL_SITIO_POR_DEFECTO,
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escaparXml(MARCA)}</title>`,
    `    <link>${escaparXml(siteUrl)}</link>`,
    `    <description>${escaparXml(
      "Maceteros ultra livianos tipo cemento para interior y exterior, fabricados en Chile.",
    )}</description>`,
    ...items.map(itemXml),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
