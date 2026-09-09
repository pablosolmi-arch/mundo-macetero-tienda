// tests/lib/whatsapp.test.ts
//
// Los enlaces de WhatsApp: un solo número, mensaje con contexto del producto y
// nada del cliente dentro de la URL.
import { describe, it, expect } from "vitest";
import { PREGUNTAS, linkWhatsapp } from "../../lib/whatsapp";
import { TIENDA } from "../../content/site";
import { CLAVE_DUDA, MOTIVOS_DUDA } from "../../lib/eventos-checkout";

function texto(url: string): string {
  return decodeURIComponent(new URL(url).searchParams.get("text") ?? "");
}

describe("enlaces de WhatsApp", () => {
  it("usa siempre el número de ventas, el mismo del botón flotante", () => {
    for (const url of [linkWhatsapp(), linkWhatsapp({ producto: "Macetero Bowl" })]) {
      expect(url.startsWith(`https://wa.me/${TIENDA.whatsappVentasNumero}?`)).toBe(true);
    }
    // El botón flotante histórico apunta al mismo número.
    expect(TIENDA.whatsappVentas).toContain(TIENDA.whatsappVentasNumero);
  });

  it("sin contexto manda el mensaje general", () => {
    const t = texto(linkWhatsapp());
    expect(t).toContain("mundomacetero.cl");
    expect(t).toContain("antes de comprar");
    expect(t).not.toContain("Estoy viendo");
  });

  it("nombra el producto, la variante y la terminación cuando las hay", () => {
    const t = texto(
      linkWhatsapp({ producto: "Macetero Bowl", variante: "Grande", terminacion: "Negro" }),
    );
    expect(t).toContain("Estoy viendo el Macetero Bowl (Grande, Negro).");
  });

  it("omite el paréntesis cuando solo hay producto", () => {
    expect(texto(linkWhatsapp({ producto: "Macetero Bowl" }))).toContain(
      "Estoy viendo el Macetero Bowl.",
    );
  });

  it("escapa el texto: un nombre con & o # no rompe la URL", () => {
    const url = linkWhatsapp({ producto: "Bowl & Plato #2" });
    expect(() => new URL(url)).not.toThrow();
    expect(texto(url)).toContain("Bowl & Plato #2");
  });

  it("tiene una pregunta escrita para cada motivo de duda del modal", () => {
    for (const motivo of MOTIVOS_DUDA) {
      expect(PREGUNTAS[CLAVE_DUDA[motivo]]).toBeTruthy();
    }
    expect(PREGUNTAS.asesoria).toBeTruthy();
  });
});
