import { getActiveProductsWithVariants } from "../../../queries/catalog";
import {
  construirItemsMerchant,
  renderFeedXml,
  URL_SITIO_POR_DEFECTO,
} from "../../../lib/merchant";

// Feed de productos que Google Merchant Center lee por URL, sin autenticación
// (ver docs/google-merchant.md). No lleva `revalidate`: como el resto del repo,
// todo se lee bajo demanda porque un prerender al build golpea la base de datos
// de Supabase (plan gratuito) y ese es justamente el modo de falla que tumba los
// despliegues.
export const dynamic = "force-dynamic";

// `||` (no `??`) para que un SITE_URL="" también caiga al valor por defecto,
// igual que en app/layout.tsx y app/sitemap.ts.
const BASE_URL = process.env.SITE_URL || URL_SITIO_POR_DEFECTO;

export async function GET() {
  const productos = await getActiveProductsWithVariants();
  const xml = renderFeedXml(construirItemsMerchant(productos, BASE_URL), BASE_URL);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // El feed se programa una vez al día en Merchant Center: no necesita estar
      // al segundo, y así la CDN de Vercel absorbe las lecturas repetidas.
      "Cache-Control": "public, max-age=3600, s-maxage=21600",
    },
  });
}
