// Static site content and business rules ported from the Claude Design source
// ("Mundo Macetero.dc.html" + "products.json"). Product data itself is NOT here:
// products, prices, variants and images all come from the database.

export const TIENDA = {
  nombre: "Mundo Macetero",
  direccion: "Las Esteras Norte 2610, Galpón 16, Quilicura",
  horario: "Lun a Vie de 8:30 a 18:00",
  telefonos: ["+56 9 92891754", "+56 9 98294954", "+56 2 26218765"],
  email: "mundo@mundomacetero.cl",
  instagram: "https://www.instagram.com/mundomacetero/",
  facebook: "https://www.facebook.com/maceteroslivianos",
  whatsapp: "https://wa.me/56992891754",
  // Número de ventas: es el que atiende el botón flotante de la tienda y el que
  // usa lib/whatsapp.ts para armar los mensajes con contexto del producto.
  whatsappVentasNumero: "56998294954",
  whatsappVentas:
    "https://wa.me/56998294954?text=%C2%A1Hola%21%20Vi%20los%20maceteros%20en%20mundomacetero.cl%20y%20quiero%20hacer%20una%20consulta",
  // Teléfono para llamar, en formato marcable. Es el mismo número de ventas: el
  // cliente que prefiere hablar antes de comprar llega a quien puede venderle.
  telefonoVentas: "+56998294954",
  telefonoVentasTexto: "+56 9 9829 4954",
} as const;

// Delivery rule, as the shop actually operates it: free only in Santiago's eastern
// sector, and everything else is quoted with an external carrier and coordinated
// after the purchase. No shipping amount is ever charged online, so the storefront
// must not quote one.
export const ENVIO = {
  comunasOriente: [
    "Las Condes",
    "Vitacura",
    "Lo Barnechea",
    "Providencia",
    "La Reina",
    "Ñuñoa",
    "Peñalolén",
  ],
  regionRM: "Metropolitana de Santiago",
  notaExterna:
    "El despacho se cotiza con un transportista externo y lo coordinamos contigo después de la compra.",
  retiro: "Retiro en tienda (Quilicura)",
} as const;

export const REGIONES = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
] as const;

export const COMUNAS_RM = [
  "Cerrillos",
  "Cerro Navia",
  "Colina",
  "Conchalí",
  "El Bosque",
  "Estación Central",
  "Huechuraba",
  "Independencia",
  "La Cisterna",
  "La Florida",
  "La Granja",
  "La Pintana",
  "La Reina",
  "Lampa",
  "Las Condes",
  "Lo Barnechea",
  "Lo Espejo",
  "Lo Prado",
  "Macul",
  "Maipú",
  "Ñuñoa",
  "Padre Hurtado",
  "Pedro Aguirre Cerda",
  "Peñalolén",
  "Providencia",
  "Pudahuel",
  "Puente Alto",
  "Quilicura",
  "Quinta Normal",
  "Recoleta",
  "Renca",
  "San Bernardo",
  "San Joaquín",
  "San Miguel",
  "San Ramón",
  "Santiago Centro",
  "Vitacura",
] as const;

export const TERMINACIONES = [
  { id: "cemento", nombre: "Cemento Natural", hex: "#b8b2a7" },
  { id: "negro", nombre: "Negro", hex: "#2e2c2a" },
  { id: "grafito", nombre: "Grafito", hex: "#55524e" },
  { id: "cantera", nombre: "Cantera Café", hex: "#8a6f5c" },
] as const;

// Swatch colours for option values whose name matches a finish.
export const HEXES: Record<string, string> = {
  cemento: "#b8b2a7",
  negro: "#2e2c2a",
  grafito: "#55524e",
  cantera: "#8a6f5c",
  blanco: "#f2f0ec",
  gris: "#9a968f",
};

export interface HeroSlide {
  titulo: string;
  sub: string;
  cta: string;
  href: string;
  // El primer slide trae su propia foto (no sale del catálogo); los demás la
  // reciben desde HERO_IMGS en la portada.
  imagen?: string;
  imagenMovil?: string;
  alt?: string;
  // Cifras grandes a la derecha de la foto. Solo el slide de marca las trae: el
  // subtítulo se acorta porque las cifras dicen el resto. El salto de línea del
  // texto es literal y se respeta al renderizar.
  cifras?: { valor: string; texto: string }[];
}

// Todos los slides del hero comparten la misma composición: foto a sangre,
// título, subtítulo y botón blanco. El primero es el de marca.
export const HERO_SLIDES: HeroSlide[] = [
  {
    titulo: "Maceteros ultra livianos que transforman tus espacios",
    sub: "Fabricados en Chile con tecnología EIFS.",
    cta: "Ver los más vendidos",
    href: "/maceteros/bowls-y-platos",
    imagen: "/hero/plato-de-agua-2000.webp",
    imagenMovil: "/hero/plato-de-agua-1000.webp",
    alt: "Macetero plato de agua de Mundo Macetero con planta, en exterior",
    cifras: [
      { valor: "90%", texto: "más livianos\nque el concreto" },
      { valor: "40%", texto: "de ahorro de agua\npor ser térmicos" },
      { valor: "Únicos", texto: "diseños que no verás\nen otro lugar" },
    ],
  },
  {
    titulo: "¿Quieres ver tu espacio con un macetero nuestro?",
    sub: "Mándanos una foto. Te lo devolvemos transformado.",
    cta: "¡Envíanos tu foto!",
    href: "/tu-espacio",
    alt: "Terraza decorada con maceteros livianos de Mundo Macetero",
  },
  {
    titulo: "Maceteros que transforman tus espacios",
    sub: "Bienvenido a Mundo Macetero.",
    cta: "Ver Maceteros",
    href: "/tienda",
    alt: "Conjunto de maceteros tipo cemento de Mundo Macetero en un espacio interior",
  },
  {
    titulo: "Encuentra la jardinera que más te guste",
    sub: "Distintas medidas, colores y terminaciones.",
    cta: "Ver Jardineras",
    href: "/tienda/jardinera",
    alt: "Jardinera rectangular de Mundo Macetero plantada con verde",
  },
];

// Descriptions for the collection tiles, keyed by the category slug that the
// Shopify import actually created. Categories without an entry simply render
// without a description.
export const COLECCION_DESC: Record<string, string> = {
  jardinera: "Para plantas, flores o árboles. Distintas medidas.",
  bowl: "Maceteros tipo bowl.",
  cubo: "Maceteros tipo cubo.",
  conico: "Silueta cónica clásica.",
  colonial: "Estilo tradicional chileno.",
  copon: "Gran formato tipo copa.",
  gema: "Facetados geométricos.",
  gotar: "Maceteros con forma gotar.",
  marroc: "Inspiración mediterránea.",
  milan: "Minimalismo italiano.",
  "plato-de-agua": "Bajos y anchos, tipo espejo de agua.",
  "plato-invertido": "Volumen invertido, boca ancha.",
  redondos: "Cilíndricos clásicos.",
  vaso: "Proporción alta y esbelta.",
  piedras: "Piedras decorativas para terminar la composición.",
  rp: "Presencia escultórica de gran altura.",
  macetero: "Nuestra línea principal de maceteros.",
};

// The design flagged featured products and trending collections by hand. The
// database has no such flag, so the editorial choice lives here, expressed with
// real catalog slugs. Missing slugs are skipped and the row is topped up with
// other products, so this never breaks if the catalog is re-imported.
export const DESTACADOS_SLUGS = [
  "jardineras",
  "macetero-bowl-cantera-cafe",
  "macetero-cubo-cu40",
  "macetero-conico-c2",
  "macetero-redondo",
  "macetero-piramidal",
  "macetero-plato-de-agua",
  "macetero-bowl-copia",
];

export const TENDENCIAS_SLUGS = ["gema", "milan", "marroc"];

export interface BlogPost {
  slug: string;
  titulo: string;
  fecha: string;
  extracto: string;
  cuerpo: string[];
  // Índice dentro de BLOG_IMGS (content/images.ts), en el mismo orden en que las
  // notas aparecen en la tienda actual.
  imagen: number;
}

export const BLOG: BlogPost[] = [
  {
    slug: "expo-jardines-2024",
    imagen: 0,
    titulo: "Nuestro éxito en la EXPO JARDINES 2024",
    fecha: "Octubre 2024",
    extracto:
      "La feria nos permitió conectar con fanáticos de los jardines y expertos del rubro, y presentar nuestra nueva colección.",
    cuerpo: [
      "Participamos en la Expo Jardines 2024 con un stand donde exhibimos la línea clásica y adelantamos la nueva colección. Fue una gran oportunidad para conversar con paisajistas, arquitectos y aficionados, recoger ideas y mostrar en persona lo livianos que son nuestros maceteros.",
      "Gracias a todos los que nos visitaron. Varias de las novedades que mostramos en la feria ya están disponibles en la tienda.",
    ],
  },
  {
    slug: "feria-jardineria-2022",
    imagen: 1,
    titulo: "Feria de Jardinería 2022 en Parque Araucano",
    fecha: "Octubre 2022",
    extracto:
      "Estuvimos en la Feria de Jardinería de octubre 2022 mostrando nuestros maceteros ultra livianos.",
    cuerpo: [
      "En octubre de 2022 participamos en la Feria de Jardinería del Parque Araucano. Montamos un espacio con maceteros de distintos formatos y terminaciones, y muchos visitantes comprobaron en persona que un macetero de gran formato puede levantarse con una sola mano.",
      "Fue nuestra primera feria masiva y la recepción del público nos confirmó el camino: diseño, calidad y ligereza.",
    ],
  },
  {
    slug: "macetero-de-autor-plumas-al-viento",
    imagen: 2,
    titulo: 'Macetero de Autor: "Plumas al Viento"',
    fecha: "Mayo 2024",
    extracto: "Una colaboración única con la artista Marcela Nicolás Oddó.",
    cuerpo: [
      'Junto a la artista Marcela Nicolás Oddó desarrollamos "Plumas al Viento", un macetero de autor intervenido a mano en edición limitada. Cada pieza es única: la artista trabaja sobre la superficie del macetero convirtiéndolo en un objeto de arte utilitario.',
      "Si te interesa una pieza de esta serie o una colaboración personalizada, escríbenos.",
    ],
  },
];

export const CONFIANZA = [
  "Inmobiliaria",
  "Constructora",
  "Paisajismo",
  "Hotelería",
  "Municipalidad",
  "Retail",
];
