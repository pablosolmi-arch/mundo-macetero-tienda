import type { Metadata } from "next";
import type { Product, ProductVariant } from "../db/schema";

const SITE_NAME = "Mundo Macetero";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildProductJsonLd(product: Product & { variants: ProductVariant[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description),
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
  const cleanDescription = stripHtml(product.description).slice(0, 160);
  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: cleanDescription,
    openGraph: {
      title: product.name,
      description: cleanDescription,
      images: product.images,
    },
  };
}
