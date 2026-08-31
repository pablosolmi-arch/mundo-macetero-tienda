import { describe, it, expect } from "vitest";
import {
  construirItemsMerchant,
  renderFeedXml,
  aTextoPlano,
  type ProductoMerchant,
} from "../../lib/merchant";

const SITIO = "https://tienda.example.com";

const conVariantes: ProductoMerchant = {
  slug: "macetero-bowl",
  name: "Macetero Bowl",
  description: "<p>Macetero con <strong>tecnología EIFS</strong> ultra liviano.</p>",
  basePrice: "39990",
  images: ["https://cdn.example.com/bowl-1.jpg", "https://cdn.example.com/bowl-2.jpg"],
  status: "active",
  stock: 0,
  trackStock: false,
  colNombre: "Maceteros",
  variants: [
    { id: 11, name: "Diámetro 40cm / Negro", priceOverride: null, stock: 0, available: true },
    { id: 12, name: "Diámetro 50cm / Blanco", priceOverride: "49990", stock: 0, available: true },
  ],
};

const sinVariantes: ProductoMerchant = {
  slug: "piedras-decorativas-xl",
  name: "Piedras decorativas XL",
  description: "Piedras blancas para terminación.",
  basePrice: "9990",
  images: ["https://cdn.example.com/piedras.jpg"],
  status: "active",
  stock: 5,
  trackStock: false,
  variants: [],
};

describe("construirItemsMerchant", () => {
  it("agrupa las variantes de un producto y usa el precio de cada una", () => {
    const items = construirItemsMerchant([conVariantes], SITIO);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id)).toEqual(["macetero-bowl-11", "macetero-bowl-12"]);
    expect(new Set(items.map((i) => i.id)).size).toBe(2);
    expect(items.every((i) => i.itemGroupId === "macetero-bowl")).toBe(true);
    // Sin priceOverride manda el precio base; con override, el de la variante.
    expect(items[0].price).toBe("39990 CLP");
    expect(items[1].price).toBe("49990 CLP");
    expect(items[0].title).toBe("Macetero Bowl - Diámetro 40cm / Negro");
    expect(items[0].link).toBe(`${SITIO}/producto/macetero-bowl?variante=11`);
    expect(items[0].imageLink).toBe("https://cdn.example.com/bowl-1.jpg");
    expect(items[0].additionalImageLinks).toEqual(["https://cdn.example.com/bowl-2.jpg"]);
    expect(items[0].productType).toBe("Maceteros");
    expect(items[0].brand).toBe("Mundo Macetero");
    expect(items[0].condition).toBe("new");
    expect(items[0].identifierExists).toBe("no");
    expect(items[0].googleProductCategory).toBe(
      "Home & Garden > Lawn & Garden > Gardening > Pots & Planters",
    );
  });

  it("usa el slug como id y no agrupa cuando el producto no tiene variantes", () => {
    const [item] = construirItemsMerchant([sinVariantes], SITIO);

    expect(item.id).toBe("piedras-decorativas-xl");
    expect(item.itemGroupId).toBeNull();
    expect(item.title).toBe("Piedras decorativas XL");
    expect(item.link).toBe(`${SITIO}/producto/piedras-decorativas-xl`);
    expect(item.price).toBe("9990 CLP");
    // Sin colección, g:product_type queda vacío y no se emite.
    expect(item.productType).toBe("");
  });

  it("excluye los productos archivados", () => {
    const items = construirItemsMerchant(
      [{ ...conVariantes, status: "archived" }, sinVariantes],
      SITIO,
    );

    expect(items.map((i) => i.id)).toEqual(["piedras-decorativas-xl"]);
  });

  it("excluye las variantes con precio 0", () => {
    const items = construirItemsMerchant(
      [
        {
          ...conVariantes,
          variants: [
            { id: 11, name: "Sin precio", priceOverride: "0", stock: 0, available: true },
            conVariantes.variants![1],
          ],
        },
      ],
      SITIO,
    );

    expect(items.map((i) => i.id)).toEqual(["macetero-bowl-12"]);
  });

  it("convierte la descripción HTML a texto plano", () => {
    const [item] = construirItemsMerchant([conVariantes], SITIO);
    expect(item.description).toBe("Macetero con tecnología EIFS ultra liviano.");
  });

  it("recorta el título a 150 caracteres", () => {
    const [item] = construirItemsMerchant(
      [{ ...conVariantes, name: "M".repeat(200), variants: [] }],
      SITIO,
    );
    expect(item.title).toHaveLength(150);
  });

  it("hace absolutas las imágenes relativas", () => {
    const [item] = construirItemsMerchant(
      [{ ...sinVariantes, images: ["/img/piedras.jpg"] }],
      SITIO,
    );
    expect(item.imageLink).toBe(`${SITIO}/img/piedras.jpg`);
  });

  it("deja hasta 10 imágenes adicionales", () => {
    const doce = Array.from({ length: 12 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
    const [item] = construirItemsMerchant([{ ...sinVariantes, images: doce }], SITIO);

    expect(item.imageLink).toBe(doce[0]);
    expect(item.additionalImageLinks).toHaveLength(10);
  });

  describe("disponibilidad", () => {
    it("mantiene en stock un producto que no controla inventario, aunque el stock sea 0", () => {
      const items = construirItemsMerchant([conVariantes], SITIO);
      expect(items.every((i) => i.availability === "in_stock")).toBe(true);
    });

    it("agota la variante sin stock cuando el producto controla inventario", () => {
      const items = construirItemsMerchant(
        [
          {
            ...conVariantes,
            trackStock: true,
            variants: [
              { id: 11, name: "Negro", priceOverride: null, stock: 3, available: true },
              { id: 12, name: "Blanco", priceOverride: null, stock: 0, available: true },
              { id: 13, name: "Arena", priceOverride: null, stock: 5, available: false },
            ],
          },
        ],
        SITIO,
      );

      expect(items.map((i) => i.availability)).toEqual([
        "in_stock",
        "out_of_stock",
        "out_of_stock",
      ]);
    });

    it("agota un producto sin variantes que controla inventario y quedó en 0", () => {
      const [item] = construirItemsMerchant(
        [{ ...sinVariantes, trackStock: true, stock: 0 }],
        SITIO,
      );
      expect(item.availability).toBe("out_of_stock");
    });
  });
});

describe("aTextoPlano", () => {
  it("decodifica entidades y colapsa espacios", () => {
    expect(aTextoPlano("<p>Maceteros &amp; bases</p>\n<p>Ultra&nbsp;livianos</p>")).toBe(
      "Maceteros & bases Ultra livianos",
    );
  });

  it("recorta a 5000 caracteres", () => {
    expect(aTextoPlano("a".repeat(6000))).toHaveLength(5000);
  });
});

describe("renderFeedXml", () => {
  it("genera un RSS 2.0 con el namespace de Google y el canal", () => {
    const xml = renderFeedXml(construirItemsMerchant([sinVariantes], SITIO), SITIO);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<title>Mundo Macetero</title>");
    expect(xml).toContain(`<link>${SITIO}</link>`);
    expect(xml).toContain("<description>");
    expect(xml).toContain("<g:id>piedras-decorativas-xl</g:id>");
    expect(xml).toContain("<g:price>9990 CLP</g:price>");
    expect(xml).toContain("<g:availability>in_stock</g:availability>");
    // Sin colección no se emite g:product_type vacío.
    expect(xml).not.toContain("<g:product_type>");
    // El envío se configura en Merchant Center, no se declara por item.
    expect(xml).not.toContain("g:shipping");
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("escapa & y < en los valores", () => {
    const xml = renderFeedXml(
      construirItemsMerchant(
        [
          {
            ...sinVariantes,
            name: "Piedras & bases <XL>",
            description: "Piedras para 3 < 4 &amp; más",
          },
        ],
        SITIO,
      ),
      SITIO,
    );

    expect(xml).toContain("<g:title>Piedras &amp; bases &lt;XL&gt;</g:title>");
    // El "&amp;" del HTML se decodifica a "&" y vuelve a escaparse una sola vez.
    expect(xml).toContain("<g:description>Piedras para 3 &lt; 4 &amp; más</g:description>");
    expect(xml).not.toMatch(/<g:title>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
