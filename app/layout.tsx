import type { Metadata } from "next";
import { Jost, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../components/cart/CartContext";
import { CartDrawer } from "../components/cart/CartDrawer";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { WhatsAppButton } from "../components/site/WhatsAppButton";
import { getAllCategories } from "../queries/catalog";

const jost = Jost({ variable: "--font-jost", subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });

// `||` (not `??`) so a blank SITE_URL="" (as documented in .env.example) also
// falls back — new URL("") would throw at module load and crash every route.
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mundo Macetero",
    template: "%s | Mundo Macetero",
  },
  description: "Maceteros, jardineras y molduras fabricados en Chile. Compra online en Mundo Macetero.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getAllCategories();

  return (
    <html lang="es" className={`${jost.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CartProvider>
          <Header categories={categories} />
          <div className="flex-1">{children}</div>
          <Footer categories={categories} />
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
