import type { Metadata } from "next";
import type { Product, ProductVariant } from "../db/schema";

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

// Serializes JSON-LD for safe embedding inside a <script type="application/ld+json">
// tag. Without this, a product name/image URL containing "</script>" (or a raw
// "<") could break out of the script context and inject markup (XSS). U+2028 and
// U+2029 are also escaped: they're valid in JSON strings but are line terminators
// to some JS parsers, which would corrupt the inline script.
export function serializeJsonLd(jsonLd: object): string {
  return JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildProductMetadata(product: Product): Metadata {
  const cleanDescription = stripHtml(product.description).slice(0, 160);
  return {
    // Plain string title: the root layout's title.template ("%s | Mundo Macetero")
    // adds the site-name suffix once. Do NOT pre-suffix here, or it double-suffixes.
    title: product.name,
    description: cleanDescription,
    openGraph: {
      title: product.name,
      description: cleanDescription,
      images: product.images,
    },
  };
}
