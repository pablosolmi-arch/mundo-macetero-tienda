import type { Metadata } from "next";
import type { Product, ProductVariant } from "../db/schema";

const SITE_NAME = "Mundo Macetero";

export function buildProductJsonLd(product: Product & { variants: ProductVariant[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "CLP",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export function buildProductMetadata(product: Product): Metadata {
  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images,
    },
  };
}
