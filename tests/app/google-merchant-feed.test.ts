import { describe, it, expect } from "vitest";
import { GET } from "../../app/feeds/google-merchant.xml/route";

// Como el resto de los tests que tocan el catálogo, este lee la base de datos
// real (DATABASE_URL de .env.local) y no escribe nada.
describe("GET /feeds/google-merchant.xml", () => {
  it("responde XML cacheable con el feed del catálogo activo", async () => {
    const res = await GET();
    const xml = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=21600");
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<g:id>");
    expect(xml).toContain("<g:price>");
    expect(xml).toContain("<g:brand>Mundo Macetero</g:brand>");
  }, 20000);
});
