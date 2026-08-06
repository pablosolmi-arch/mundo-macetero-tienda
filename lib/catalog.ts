// View-model helpers shared by every surface that renders a product card.

export interface VariantLike {
  id: number;
  name: string;
  priceOverride: string | null;
  stock: number;
}

export interface ProductLike {
  slug: string;
  name: string;
  basePrice: string;
  images: string[];
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
  image: string | null;
}

// A variant's price is its override when set, otherwise the product's base price.
export function variantPrice(product: ProductLike, variant?: VariantLike | null): number {
  if (variant?.priceOverride != null) return Number(variant.priceOverride);
  return Number(product.basePrice);
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
    image: product.images?.[0] ?? null,
  };
}
