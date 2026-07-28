import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// `||` (not `??`) so a blank SITE_URL="" (as documented in .env.example) also
// falls back — new URL("") would throw at module load and crash every route.
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mundo Macetero",
    template: "%s | Mundo Macetero",
  },
  description: "Maceteros, molduras y gárgolas fabricados en Chile. Compra online en Mundo Macetero.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
