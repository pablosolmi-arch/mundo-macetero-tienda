import { describe, it, expect } from "vitest";
import { buildProductJsonLd, buildProductMetadata, serializeJsonLd } from "../../lib/seo";

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
  optionNames: [] as string[],
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

  it("strips HTML tags from description", () => {
    const htmlProduct = {
      ...sampleProduct,
      description: "<p>Macetero de <strong>terracota</strong> hecho a mano.</p>",
    };
    const jsonLd = buildProductJsonLd(htmlProduct);
    expect(jsonLd.description).toBe("Macetero de terracota hecho a mano.");
  });
});

describe("buildProductMetadata", () => {
  it("builds a plain-name title (the root layout template adds the site suffix)", () => {
    const metadata = buildProductMetadata(sampleProduct);
    // Plain product name only: app/layout.tsx's title.template appends
    // " | Mundo Macetero" once. Pre-suffixing here would double it.
    expect(metadata.title).toBe("Macetero Terracota");
    expect(metadata.description).toContain("Macetero de terracota hecho a mano.");
    expect(metadata.openGraph?.images).toEqual(["https://example.com/terracota-1.jpg"]);
  });

  it("strips HTML tags from description in metadata", () => {
    const htmlProduct = {
      ...sampleProduct,
      description: "<p>Macetero de <strong>terracota</strong> hecho a mano.</p>",
    };
    const metadata = buildProductMetadata(htmlProduct);
    expect(metadata.description).toBe("Macetero de terracota hecho a mano.");
    expect(metadata.openGraph?.description).toBe("Macetero de terracota hecho a mano.");
  });
});

describe("serializeJsonLd", () => {
  it("escapes </script> so a malicious product name can't break out of the script tag", () => {
    const maliciousProduct = {
      ...sampleProduct,
      name: '</script><script>alert(1)</script>',
    };
    const jsonLd = buildProductJsonLd(maliciousProduct);
    const serialized = serializeJsonLd(jsonLd);

    expect(serialized).not.toContain("</script>");

    // Still valid, script-safe JSON that round-trips the original data once
    // the escape is reversed (the browser's JSON.parse would see < the
    // same way it sees a literal "<").
    const roundTripped = JSON.parse(serialized.replace(/\\u003c/g, "<"));
    expect(roundTripped.name).toBe(maliciousProduct.name);
  });

  it("produces parseable JSON for a normal product", () => {
    const jsonLd = buildProductJsonLd(sampleProduct);
    const serialized = serializeJsonLd(jsonLd);
    const parsed = JSON.parse(serialized);
    expect(parsed.name).toBe("Macetero Terracota");
    expect(parsed["@type"]).toBe("Product");
  });
});
