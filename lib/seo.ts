import type { Metadata } from "next";
import type { Product, ProductVariant } from "../db/schema";

// Single source of truth for the site's absolute base URL: app/layout.tsx,
// app/sitemap.ts, app/robots.ts, app/llms.txt and every JSON-LD @id import this
// one constant so they can never drift apart.
// `||` (not `??`) so a blank SITE_URL="" also falls back to a valid absolute URL:
// new URL("") would throw at module load and take down every route.
export const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

// Stable @id nodes so any graph on any page can point at the same entities
// instead of re-declaring them (which would read as duplicate organizations).
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildProductJsonLd(product: Product & { variants: ProductVariant[] }) {
  const url = `${SITE_URL}/producto/${product.slug}`;

  // Los maceteros se fabrican a pedido: un producto sin seguimiento de
  // inventario (`trackStock` en false) siempre se vende, así que solo los que
  // sí lo controlan pueden anunciarse agotados a los buscadores.
  const availability =
    !product.trackStock || product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  // A product whose variants override the price is sold in a RANGE, not at one
  // price, and a single Offer would contradict what the page shows for most
  // combinations. Only variants that can actually be bought count.
  const availableVariants = product.variants.filter((v) => v.available);
  const variantPrices = availableVariants
    .map((v) => Number(v.priceOverride ?? product.basePrice))
    .filter((n) => Number.isFinite(n) && n > 0);
  const hasPriceOverrides = availableVariants.some((v) => v.priceOverride != null);

  const offers =
    hasPriceOverrides && variantPrices.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "CLP",
          lowPrice: Math.min(...variantPrices),
          highPrice: Math.max(...variantPrices),
          offerCount: variantPrices.length,
          availability,
          url,
        }
      : {
          "@type": "Offer",
          price: product.basePrice,
          priceCurrency: "CLP",
          availability,
          url,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": ORGANIZATION_ID },
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    description: stripHtml(product.description),
    image: product.images,
    sku: product.slug,
    brand: { "@type": "Brand", name: "Mundo Macetero" },
    manufacturer: { "@id": ORGANIZATION_ID },
    material: "Fibrocemento reforzado",
    category: "Maceteros",
    countryOfOrigin: { "@type": "Country", name: "Chile" },
    offers,
  };
}

// BreadcrumbList node WITHOUT "@context": callers either drop it into an
// "@graph" or add the context themselves when it goes in its own script tag.
export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// FAQPage node WITHOUT "@context", same reason as buildBreadcrumbJsonLd.
export function buildFaqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: cleanDescription,
      url: `${SITE_URL}/producto/${product.slug}`,
      images: product.images,
    },
  };
}
