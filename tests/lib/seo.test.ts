import { describe, it, expect } from "vitest";
import { buildProductJsonLd, buildProductMetadata } from "../../lib/seo";

const sampleProduct = {
  id: 1,
  slug: "macetero-terracota",
  name: "Macetero Terracota",
  description: "Macetero de terracota hecho a mano.",
  basePrice: "9990",
  categoryId: 1,
  images: ["https://example.com/terracota-1.jpg"],
  stock: 20,
  status: "active" as const,
  createdAt: new Date(),
  variants: [],
};

describe("buildProductJsonLd", () => {
  it("builds valid Product/Offer JSON-LD", () => {
    const jsonLd = buildProductJsonLd(sampleProduct);
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Macetero Terracota");
    expect(jsonLd.image).toEqual(["https://example.com/terracota-1.jpg"]);
    expect(jsonLd.offers["@type"]).toBe("Offer");
    expect(jsonLd.offers.price).toBe("9990");
    expect(jsonLd.offers.priceCurrency).toBe("CLP");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks out-of-stock products correctly", () => {
    const jsonLd = buildProductJsonLd({ ...sampleProduct, stock: 0 });
    expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("buildProductMetadata", () => {
  it("builds a title and description from the product", () => {
    const metadata = buildProductMetadata(sampleProduct);
    expect(metadata.title).toBe("Macetero Terracota | Mundo Macetero");
    expect(metadata.description).toContain("Macetero de terracota hecho a mano.");
    expect(metadata.openGraph?.images).toEqual(["https://example.com/terracota-1.jpg"]);
  });
});
