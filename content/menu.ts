// Menú de la tienda por forma del macetero, no por nombre de modelo: el cliente
// que llega no sabe qué es un "Gotar" ni un "Luxor RP", pero sí sabe si busca un
// bowl, algo alto o una jardinera. Estos grupos son la navegación (/maceteros/<slug>)
// y conviven con las colecciones de la base de datos, que siguen en /tienda/<slug>.
//
// La lista de slugs es la fuente de verdad del orden en que se muestran los
// productos del grupo. tests/lib/menu.test.ts la valida contra la base: todos los
// slugs deben existir y estar activos, y ningún producto activo puede quedar sin
// grupo, así que al agregar un producto nuevo el test avisa que falta clasificarlo.

export interface GrupoMenu {
  slug: string;
  nombre: string;
  /** Una línea, se usa como subtítulo de la página del grupo. */
  descripcion: string;
  /** Slugs de producto en el orden en que se muestran. Vacío para "todos". */
  productos: string[];
}

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    slug: "todos",
    nombre: "Todos los maceteros",
    descripcion: "El catálogo completo de maceteros, jardineras y complementos.",
    productos: [],
  },
  {
    slug: "bowls-y-platos",
    nombre: "Bowls y platos",
    descripcion: "Formas bajas y anchas, ideales para suculentas, cactus y centros de mesa.",
    productos: [
      "macetero-bowl-cantera-cafe",
      "macetero-plato-de-agua",
      "macetero-plato-invertido",
      "macetero-bowl-copia",
    ],
  },
  {
    slug: "maceteros-altos",
    nombre: "Maceteros altos",
    descripcion: "Maceteros de mayor altura para dar presencia en terrazas, accesos y rincones.",
    productos: [
      "macetero-milan",
      "macetero-conico-c2",
      "macetero-vaso",
      "macetero-piramidal",
      "macetero-gotar-g9",
      "macetero-gotar-g5",
    ],
  },
  {
    slug: "redondos-y-clasicos",
    nombre: "Redondos y clásicos",
    descripcion: "Las formas de siempre, redondas y equilibradas, que funcionan en cualquier espacio.",
    productos: [
      "macetero-redondo",
      "macetero-colonial-c1",
      "macetero-belga",
      "macetero-copon",
      "macetero-gema",
      "macetero-ri",
      "macetero-luxor-rp",
      "macetero-marroc-cantera-oxido-de-cobre",
      "macetero-autor-gotar-aqua",
    ],
  },
  {
    slug: "jardineras-y-cubos",
    nombre: "Jardineras y cubos",
    descripcion: "Formas rectas para delimitar espacios, separar ambientes y armar composiciones.",
    productos: ["jardineras", "macetero-cubo-cu40"],
  },
  {
    slug: "complementos",
    nombre: "Complementos",
    descripcion: "Piedras decorativas y bases metálicas para terminar la instalación del macetero.",
    productos: ["piedras-decorativas-xl", "bases-metalicas"],
  },
];

/** Producto que se destaca en el menú y en las tarjetas del catálogo. */
export const DESTACADO = {
  slug: "macetero-plato-de-agua",
  etiqueta: "Más vendido 2026",
} as const;

/** Grupos con lista propia, es decir todos menos "Todos los maceteros". */
export const GRUPOS_CON_PRODUCTOS = GRUPOS_MENU.filter((g) => g.productos.length > 0);

/** Ruta del grupo: "todos" apunta al catálogo completo que ya existe. */
export function rutaGrupo(slug: string): string {
  return slug === "todos" ? "/tienda" : `/maceteros/${slug}`;
}

export function grupoPorSlug(slug: string): GrupoMenu | null {
  return GRUPOS_CON_PRODUCTOS.find((g) => g.slug === slug) ?? null;
}
