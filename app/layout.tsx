import type { Metadata } from "next";
import { Sora, Public_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "../lib/seo";
import { HERO_IMGS } from "../content/images";

// Layout raíz: solo el documento y las tipografías. La tienda y el administrador
// aportan su propia navegación en sus respectivos layouts.
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

// Sin `alternates.canonical` aquí a propósito: un canónico en el layout raíz se
// hereda por TODAS las rutas y las haría apuntar todas a la portada. Cada página
// declara el suyo.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mundo Macetero · Maceteros Livianos Tipo Cemento",
    template: "%s | Mundo Macetero",
  },
  description:
    "Maceteros ultra livianos tipo cemento, fabricados a pedido en Chile: 90% menos peso, resistentes a sol, lluvia y heladas. Despacho gratis en el sector oriente.",
  keywords: [
    "maceteros",
    "maceteros livianos",
    "maceteros premium",
    "maceteros EIFS",
    "maceteros para terraza",
    "maceteros resistentes",
    "maceteros de exterior",
    "jardineras",
    "maceteros Chile",
  ],
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Mundo Macetero",
    url: SITE_URL,
    images: [HERO_IMGS[2]],
  },
  twitter: { card: "summary_large_image" },
  robots: "index, follow",
  // Meta tag con el que Google Search Console y Merchant Center verifican el
  // dominio. Solo se emite si la variable existe: un `content` vacío hace que
  // Google marque la verificación como fallida.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  other: {
    // Verificación de Bing Webmaster Tools, que alimenta también a Copilot y a
    // parte de ChatGPT. Bing pide no quitar la etiqueta después de verificar.
    "msvalidate.01": "A21F3F0925A8E32AB9A240E38273BA2B",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sora.variable} ${publicSans.variable} h-full`}>
      <body style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>{children}</body>
    </html>
  );
}
