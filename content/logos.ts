// Logos de clientes para "Confían en nuestros Maceteros".
//
// Los originales de Shopify vienen dentro de un lienzo cuadrado con mucho margen
// en blanco, así que en la grilla se veían diminutos aunque la celda fuera
// grande. Estos están recortados al borde de la marca y guardados en
// public/logos, por lo que ocupan todo el alto que les da la celda.

export interface LogoCliente {
  src: string;
  nombre: string;
}

export const LOGOS_CLIENTES: LogoCliente[] = [
  { src: "/logos/novotel.webp", nombre: "Novotel Hotels & Resorts" },
  { src: "/logos/concepcion.webp", nombre: "Municipalidad de Concepción" },
  { src: "/logos/hilton.webp", nombre: "Hilton Hotels & Resorts" },
  { src: "/logos/coquimbo.webp", nombre: "Municipalidad de Coquimbo" },
  { src: "/logos/socovesa.webp", nombre: "Socovesa" },
  { src: "/logos/almagro.webp", nombre: "Almagro" },
  { src: "/logos/estadio-espanol.webp", nombre: "Estadio Español Las Condes" },
  { src: "/logos/plant-art.webp", nombre: "Plant Art" },
  { src: "/logos/ingevec.webp", nombre: "Ingevec Empresas" },
  { src: "/logos/mena-y-ovalle.webp", nombre: "Mena y Ovalle" },
  { src: "/logos/passalacqua.webp", nombre: "Passalacqua Paisajismo" },
  { src: "/logos/siena.webp", nombre: "Siena" },
];
