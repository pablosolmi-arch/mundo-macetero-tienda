// tests/lib/origen.test.ts
import { describe, it, expect } from "vitest";
import { CANALES, detectarDispositivo, resolverOrigen } from "../../lib/origen";

// De esta función depende a qué canal se le atribuye cada venta en el panel: si
// clasifica mal, la decisión de dónde invertir en publicidad se toma con cifras
// falsas. La URL del sitio siempre es mundomacetero.cl en estos casos.
const SITIO = "https://www.mundomacetero.cl";

function origen(url: string, referrer = "") {
  return resolverOrigen({ url, referrer });
}

describe("resolverOrigen con utm_*", () => {
  it("clasifica como pagado cada medio de anuncios", () => {
    for (const medio of ["cpc", "ppc", "paid", "paid_social", "ads"]) {
      const o = origen(`${SITIO}/?utm_source=Google&utm_medium=${medio}&utm_campaign=Verano`);
      expect(o.canal).toBe("pagado");
      expect(o.fuente).toBe("google");
      expect(o.campana).toBe("verano");
    }
  });

  it("clasifica el correo por su medio", () => {
    for (const medio of ["email", "newsletter"]) {
      const o = origen(`${SITIO}/?utm_source=mailchimp&utm_medium=${medio}`);
      expect(o.canal).toBe("correo");
      expect(o.fuente).toBe("mailchimp");
      expect(o.campana).toBe("");
    }
  });

  it("clasifica utm_medium=social como redes", () => {
    const o = origen(`${SITIO}/?utm_source=instagram&utm_medium=social`);
    expect(o).toEqual({ canal: "social", fuente: "instagram", campana: "" });
  });

  it("deja como referido una fuente con un medio que no reconoce", () => {
    const o = origen(`${SITIO}/?utm_source=Boletin+Barrio&utm_medium=partner`);
    expect(o.canal).toBe("referido");
    expect(o.fuente).toBe("boletin barrio");
  });

  it("deja como referido una fuente sin medio", () => {
    const o = origen(`${SITIO}/?utm_source=revista`);
    expect(o).toEqual({ canal: "referido", fuente: "revista", campana: "" });
  });

  it("las utm mandan sobre el referrer", () => {
    // Alguien llega desde Google pero con un enlace marcado como pagado: manda la
    // marca del enlace, no de dónde venía el clic.
    const o = origen(`${SITIO}/?utm_source=meta&utm_medium=cpc`, "https://www.google.com/");
    expect(o.canal).toBe("pagado");
    expect(o.fuente).toBe("meta");
  });

  it("usa el referrer como fuente cuando el enlace trae medio pero no fuente", () => {
    const o = origen(`${SITIO}/?utm_medium=cpc`, "https://www.instagram.com/");
    expect(o).toEqual({ canal: "pagado", fuente: "instagram", campana: "" });
  });

  it("marca la fuente como desconocida si no hay ni utm_source ni referrer", () => {
    const o = origen(`${SITIO}/?utm_medium=email&utm_campaign=agosto`);
    expect(o).toEqual({ canal: "correo", fuente: "desconocida", campana: "agosto" });
  });

  it("pasa fuente y campaña a minúsculas y las recorta a 80 caracteres", () => {
    const largo = "A".repeat(120);
    const o = origen(`${SITIO}/?utm_source=${largo}&utm_medium=cpc&utm_campaign=${largo}`);
    expect(o.fuente).toBe("a".repeat(80));
    expect(o.campana).toBe("a".repeat(80));
  });
});

describe("resolverOrigen con parámetros de clic", () => {
  it("reconoce gclid, fbclid y ttclid como publicidad pagada", () => {
    expect(origen(`${SITIO}/?gclid=abc123`)).toEqual({
      canal: "pagado",
      fuente: "google",
      campana: "",
    });
    expect(origen(`${SITIO}/?fbclid=abc123`).fuente).toBe("meta");
    expect(origen(`${SITIO}/?ttclid=abc123`).fuente).toBe("tiktok");
  });

  it("cede ante las utm cuando vienen las dos cosas", () => {
    const o = origen(`${SITIO}/?utm_source=newsletter&utm_medium=email&fbclid=abc`);
    expect(o.canal).toBe("correo");
  });

  it("conserva la campaña aunque solo venga utm_campaign", () => {
    const o = origen(`${SITIO}/?gclid=abc&utm_campaign=Maceteros+XL`);
    expect(o).toEqual({ canal: "pagado", fuente: "google", campana: "maceteros xl" });
  });
});

describe("resolverOrigen sin utm", () => {
  it("es directo sin referrer", () => {
    expect(origen(`${SITIO}/`)).toEqual({ canal: "directo", fuente: "directo", campana: "" });
  });

  it("es directo cuando el referrer es el propio sitio", () => {
    const o = origen(`${SITIO}/producto/macetero-cono`, "https://mundomacetero.cl/tienda");
    expect(o.canal).toBe("directo");
  });

  it("es directo cuando el referrer no es una URL válida", () => {
    expect(origen(`${SITIO}/`, "no-es-una-url").canal).toBe("directo");
  });

  it("reconoce los buscadores", () => {
    const casos: [string, string][] = [
      ["https://www.google.cl/", "google"],
      ["https://news.google.com/algo", "google"],
      ["https://www.bing.com/search?q=maceteros", "bing"],
      ["https://duckduckgo.com/", "duckduckgo"],
      ["https://search.yahoo.com/", "yahoo"],
      ["https://www.ecosia.org/", "ecosia"],
    ];
    for (const [referrer, fuente] of casos) {
      expect(origen(`${SITIO}/`, referrer)).toEqual({ canal: "busqueda", fuente, campana: "" });
    }
  });

  it("normaliza las redes sociales a un nombre por red", () => {
    const casos: [string, string][] = [
      ["https://www.instagram.com/", "instagram"],
      ["https://l.instagram.com/", "instagram"],
      ["https://www.facebook.com/", "facebook"],
      ["https://l.facebook.com/", "facebook"],
      ["https://lm.facebook.com/", "facebook"],
      ["https://m.facebook.com/", "facebook"],
      ["https://fb.me/", "facebook"],
      ["https://t.co/abc", "x"],
      ["https://twitter.com/", "x"],
      ["https://x.com/", "x"],
      ["https://www.tiktok.com/", "tiktok"],
      ["https://www.pinterest.cl/", "pinterest"],
      ["https://www.linkedin.com/feed/", "linkedin"],
      ["https://www.youtube.com/watch?v=1", "youtube"],
      ["https://youtu.be/abc", "youtube"],
      ["https://api.whatsapp.com/", "whatsapp"],
      ["https://wa.me/56900000000", "whatsapp"],
    ];
    for (const [referrer, fuente] of casos) {
      expect(origen(`${SITIO}/`, referrer)).toEqual({ canal: "social", fuente, campana: "" });
    }
  });

  it("deja cualquier otro sitio como referido, con el host sin www", () => {
    expect(origen(`${SITIO}/`, "https://www.revistaED.cl/notas/1")).toEqual({
      canal: "referido",
      fuente: "revistaed.cl",
      campana: "",
    });
  });

  it("clasifica igual cuando la URL de entrada no es válida", () => {
    const o = resolverOrigen({ url: "", referrer: "https://www.instagram.com/" });
    expect(o).toEqual({ canal: "social", fuente: "instagram", campana: "" });
  });

  it("devuelve siempre un canal de la lista blanca", () => {
    const entradas = [
      `${SITIO}/`,
      `${SITIO}/?utm_source=x&utm_medium=cpc`,
      `${SITIO}/?fbclid=1`,
      "",
    ];
    for (const url of entradas) {
      for (const referrer of ["", "https://www.google.com/", "https://otro.cl/"]) {
        expect(CANALES).toContain(resolverOrigen({ url, referrer }).canal);
      }
    }
  });
});

describe("detectarDispositivo", () => {
  it("reconoce teléfonos", () => {
    const uas = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
    ];
    for (const ua of uas) expect(detectarDispositivo(ua)).toBe("movil");
  });

  it("reconoce tablets", () => {
    const uas = [
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 12; Tablet) AppleWebKit/537.36 Safari/537.36",
    ];
    for (const ua of uas) expect(detectarDispositivo(ua)).toBe("tablet");
  });

  it("todo lo demás es escritorio, incluido un user agent vacío", () => {
    expect(detectarDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1")).toBe(
      "escritorio",
    );
    expect(detectarDispositivo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126")).toBe(
      "escritorio",
    );
    expect(detectarDispositivo("")).toBe("escritorio");
  });
});
