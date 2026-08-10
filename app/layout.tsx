import type { Metadata } from "next";
import { Sora, Public_Sans } from "next/font/google";
import "./globals.css";

// Layout raíz: solo el documento y las tipografías. La tienda y el administrador
// aportan su propia navegación en sus respectivos layouts.
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

// `||` (no `??`) para que un SITE_URL="" también caiga al valor por defecto:
// new URL("") lanzaría al cargar el módulo y tumbaría todas las rutas.
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mundo Macetero",
    template: "%s | Mundo Macetero",
  },
  description:
    "Maceteros ultra livianos tipo cemento para interior y exterior, fabricados en Chile. Compra online en Mundo Macetero.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sora.variable} ${publicSans.variable} h-full`}>
      <body style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>{children}</body>
    </html>
  );
}
