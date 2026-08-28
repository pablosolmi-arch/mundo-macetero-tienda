import { CartProvider } from "../../components/cart/CartContext";
import { CartDrawer } from "../../components/cart/CartDrawer";
import { Header } from "../../components/site/Header";
import { Footer } from "../../components/site/Footer";
import { Tracker } from "../../components/site/Tracker";
import { getNavData } from "../../queries/catalog";
import { navIntenciones } from "../../lib/intenciones";
import { TIENDA } from "../../content/site";
import { GOOGLE_PERFIL, RESENAS, RESUMEN } from "../../content/resenas";
import {
  LOCAL_BUSINESS_ID,
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
  serializeJsonLd,
} from "../../lib/seo";

// Chrome de la tienda. Vive en un grupo de rutas para que /admin no lo herede:
// el administrador tiene su propia navegación y no debe mostrar el carrito.
export const dynamic = "force-dynamic";

// Dirección del taller, partida en campos para PostalAddress. TIENDA.direccion la
// trae en una sola línea con la comuna incluida, que no sirve como streetAddress.
const DIRECCION = {
  "@type": "PostalAddress",
  streetAddress: "Las Esteras Norte 2610, Galpón 16",
  addressLocality: "Quilicura",
  addressRegion: "Región Metropolitana",
  addressCountry: "CL",
};

// Identidad del sitio, emitida una sola vez para toda la tienda: las fichas de
// producto y las guías solo referencian estos @id en vez de repetir la empresa.
// No lleva SearchAction: no existe una ruta de resultados de búsqueda que un
// buscador pueda invocar (el buscador del header filtra en el cliente).
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": ORGANIZATION_ID,
      name: TIENDA.nombre,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-email.png`,
      description:
        "Mundo Macetero fabrica maceteros de fibrocemento reforzado ultra livianos en Quilicura, Santiago de Chile.",
      email: TIENDA.email,
      telephone: TIENDA.telefonos.map((t) => t.replace(/\s/g, "")),
      address: DIRECCION,
      sameAs: [TIENDA.instagram, TIENDA.facebook, GOOGLE_PERFIL.url],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+56992891754",
        contactType: "sales",
        availableLanguage: ["es"],
        areaServed: "CL",
      },
      areaServed: { "@type": "Country", name: "Chile" },
      knowsAbout: [
        "Maceteros de fibrocemento",
        "Maceteros livianos",
        "Maceteros para terraza",
        "Maceteros de exterior",
        "Jardineras",
        "Maceteros de diseño",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": LOCAL_BUSINESS_ID,
      name: TIENDA.nombre,
      url: SITE_URL,
      parentOrganization: { "@id": ORGANIZATION_ID },
      address: DIRECCION,
      email: TIENDA.email,
      telephone: "+56992891754",
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "18:00",
      },
      priceRange: "$$",
      hasMap: "https://goo.gl/maps/x5Kixi1EfCGNdQpL9",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: RESUMEN.rating,
        reviewCount: RESUMEN.total,
        bestRating: 5,
        worstRating: 1,
      },
      review: RESENAS.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.autor },
        reviewRating: { "@type": "Rating", ratingValue: r.estrellas, bestRating: 5 },
        reviewBody: r.texto,
        datePublished: r.fecha,
      })),
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: TIENDA.nombre,
      url: SITE_URL,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "es-CL",
    },
  ],
};

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const { productos, colecciones, otros } = await getNavData();

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(SITE_JSON_LD) }}
      />
      {/* Las intenciones salen de content/intenciones.ts, no de la base. Se
          resuelven aquí, en el servidor, para que los párrafos de copy de cada
          colección no viajen al bundle del header, que es un client component. */}
      <Header
        productos={productos}
        colecciones={colecciones}
        otros={otros}
        intenciones={navIntenciones()}
      />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
      <Tracker />
    </CartProvider>
  );
}
