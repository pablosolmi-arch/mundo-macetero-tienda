import type { Metadata } from "next";
import { Sora, Public_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../components/cart/CartContext";
import { CartDrawer } from "../components/cart/CartDrawer";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { getNavData } from "../queries/catalog";

// Typefaces from the design source: Sora for headings, Public Sans for body.
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

// `||` (not `??`) so a blank SITE_URL="" (as documented in .env.example) also
// falls back — new URL("") would throw at module load and crash every route.
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

// Rendered per request instead of prerendered at build time. Every page needs the
// catalog (the header's menu and search come from it), and prerendering ~20 pages
// in parallel overwhelmed the free-tier Supabase instance: renders hit the 60s
// prerender timeout and the build failed intermittently. Serving on demand keeps
// the database access next to the function instead of inside the build, at the
// cost of static caching — worth revisiting if the instance is upgraded.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mundo Macetero",
    template: "%s | Mundo Macetero",
  },
  description:
    "Maceteros ultra livianos tipo cemento para interior y exterior, fabricados en Chile. Compra online en Mundo Macetero.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { productos, colecciones, otros } = await getNavData();

  return (
    <html lang="es" className={`${sora.variable} ${publicSans.variable} h-full`}>
      <body style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
        <CartProvider>
          <Header productos={productos} colecciones={colecciones} otros={otros} />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
