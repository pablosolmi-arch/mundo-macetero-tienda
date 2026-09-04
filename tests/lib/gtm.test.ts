// tests/lib/gtm.test.ts
//
// La capa de datos de GTM. Lo que se comprueba acá es la FORMA de lo que se
// empuja, porque de eso dependen los disparadores que la agencia armó dentro del
// contenedor: si cambia el nombre del evento o desaparece el `ecommerce: null`
// previo, las conversiones de Ads se rompen sin que nada falle en el sitio.
import { describe, it, expect, beforeEach } from "vitest";
import { agregarAlCarro, clicWhatsapp, empujarSimple } from "../../lib/gtm";

// El entorno de estos tests es node, sin DOM: se finge el objeto mínimo que
// lib/gtm.ts necesita en vez de arrastrar jsdom para tres asserts.
const global = globalThis as { window?: { dataLayer?: unknown[] } };

function capa(): unknown[] {
  return global.window?.dataLayer ?? [];
}

describe("capa de datos de GTM", () => {
  beforeEach(() => {
    global.window = { dataLayer: [] };
  });

  it("empuja el clic de WhatsApp con su origen y sin objeto de comercio", () => {
    clicWhatsapp("flotante");
    expect(capa()).toEqual([{ event: "click_whatsapp", origen: "flotante" }]);
  });

  it("no arrastra el `ecommerce: null` de los eventos de comercio", () => {
    empujarSimple("click_whatsapp", { origen: "flotante" });
    expect(capa()).toHaveLength(1);
  });

  it("sigue limpiando el objeto anterior en los eventos de comercio", () => {
    agregarAlCarro({ item_id: "macetero-x", item_name: "Macetero X", price: 1000, quantity: 2 });
    expect(capa()[0]).toEqual({ ecommerce: null });
    expect(capa()[1]).toMatchObject({
      event: "add_to_cart",
      ecommerce: { currency: "CLP", value: 2000 },
    });
  });
});
