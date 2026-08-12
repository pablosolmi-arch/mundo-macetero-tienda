// View-model helpers shared by every surface that renders a product card.

import type { VariantOption } from "../components/product/AddToCart";

export interface VariantLike {
  id: number;
  name: string;
  priceOverride: string | null;
  stock: number;
}

// Una variante completa, tal como la entrega la base de datos: lo que necesita la
// ficha de producto, no solo la tarjeta.
export interface SellableVariantLike extends VariantLike {
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
}

export interface ProductLike {
  slug: string;
  name: string;
  basePrice: string;
  images: string[];
  thumbs?: string[];
  colNombre?: string;
  colSlug?: string | null;
  variants?: VariantLike[];
}

export interface ProductCardData {
  slug: string;
  nombre: string;
  colNombre: string;
  // Lowest price a customer can actually pay for this product.
  precio: number;
  // True when variants cost different amounts, so the price reads "A partir de".
  desde: boolean;
  // Miniatura de 600 px para tarjetas; `image` queda para usos a mayor tamaño.
  image: string | null;
}

// A variant's price is its override when set, otherwise the product's base price.
export function variantPrice(product: ProductLike, variant?: VariantLike | null): number {
  if (variant?.priceOverride != null) return Number(variant.priceOverride);
  return Number(product.basePrice);
}

// Las variantes tal como las consume el buy box. Los maceteros se fabrican a
// pedido, así que mientras el producto no controle inventario (`trackStock` en
// false, el caso por defecto) toda combinación existente se ofrece disponible: el
// `available` que trajo el import de Shopify (stock 1/0) recién gatea la venta
// cuando el equipo activa el seguimiento de inventario. AddToCart sigue usando
// `available` para tachar las combinaciones que no existen, y el servidor
// (/api/checkout) revalida el stock antes de cobrar.
export function toVariantOptions(
  product: Omit<ProductLike, "variants"> & { trackStock: boolean; variants: SellableVariantLike[] },
): VariantOption[] {
  return product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    price: variantPrice(product, v),
    stock: v.stock,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    available: product.trackStock ? v.available : true,
  }));
}

export function toCard(product: ProductLike): ProductCardData {
  const variants = product.variants ?? [];
  const prices = variants.length
    ? variants.map((v) => variantPrice(product, v))
    : [Number(product.basePrice)];
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    slug: product.slug,
    nombre: product.name,
    colNombre: product.colNombre ?? "",
    precio: min,
    desde: max > min,
    image: product.thumbs?.[0] ?? product.images?.[0] ?? null,
  };
}
