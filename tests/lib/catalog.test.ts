import { describe, it, expect } from "vitest";
import { toVariantOptions } from "../../lib/catalog";

// Los maceteros se fabrican a pedido, así que la tienda debe vender siempre. El
// gate de disponibilidad solo existe para los productos con seguimiento de
// inventario (`trackStock`); el stock 1/0 que trajo el import de Shopify no puede
// dejar una combinación sin comprar.

const sampleProduct = {
  slug: "macetero-terracota",
  name: "Macetero Terracota",
  basePrice: "9990",
  images: [] as string[],
  trackStock: false,
  variants: [
    {
      id: 11,
      name: "50cm / Negro",
      priceOverride: null,
      stock: 0,
      option1: "50cm",
      option2: "Negro",
      option3: null,
      available: false,
    },
    {
      id: 12,
      name: "60cm / Blanco",
      priceOverride: "14990",
      stock: 3,
      option1: "60cm",
      option2: "Blanco",
      option3: null,
      available: true,
    },
  ],
};

describe("toVariantOptions", () => {
  it("offers every combination when the product does not track inventory", () => {
    const options = toVariantOptions(sampleProduct);
    expect(options.map((o) => o.available)).toEqual([true, true]);
  });

  it("respects the variant flag when the product tracks inventory", () => {
    const options = toVariantOptions({ ...sampleProduct, trackStock: true });
    expect(options.map((o) => o.available)).toEqual([false, true]);
  });

  it("leaves the raw stock untouched, since it never gates the sale", () => {
    const options = toVariantOptions(sampleProduct);
    expect(options.map((o) => o.stock)).toEqual([0, 3]);
  });

  it("carries the option axes and the resolved price of each variant", () => {
    const options = toVariantOptions(sampleProduct);
    expect(options[0]).toEqual({
      id: 11,
      name: "50cm / Negro",
      price: 9990,
      stock: 0,
      option1: "50cm",
      option2: "Negro",
      option3: null,
      available: true,
    });
    // El override manda sobre el precio base.
    expect(options[1].price).toBe(14990);
  });

  it("returns nothing for a product with no variants", () => {
    expect(toVariantOptions({ ...sampleProduct, variants: [] })).toEqual([]);
  });
});
