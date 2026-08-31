// "Intent collections": landing pages under /maceteros/<slug> that group the
// existing catalog by what people actually search for (size, use, colour,
// drainage, plant) instead of by model name. Nothing here touches the database:
// each collection is a set of RULES evaluated against products and their
// variants at request time (see lib/intenciones.ts).
//
// Copy is written answer-first for search engines and AI assistants. Facts that
// must stay true: EIFS (poliestireno expandido + malla de fibra de vidrio +
// recubrimiento de cemento), ~90% más liviano que el cemento, fabricados a pedido
// en Quilicura, despiche y doble fondo a pedido. No prices here.

import type { Faq } from "./geo";

export type Regla =
  /** Every sellable macetero (excludes accessories: piedras, platos, bases). */
  | { kind: "todos" }
  /** At least one variant whose LARGEST dimension in cm is >= cm. */
  | { kind: "dimMin"; cm: number }
  /** At least one variant whose LARGEST dimension in cm is <= cm. */
  | { kind: "dimMax"; cm: number }
  /** At least one variant whose HEIGHT ("Alto") in cm is >= cm. */
  | { kind: "altoMin"; cm: number }
  /** Any variant option value (case-insensitive) contains one of these words. */
  | { kind: "color"; match: string[] }
  /** Product optionNames or any variant option value contains this text. */
  | { kind: "opcion"; match: string[] }
  /** Curated product slugs. */
  | { kind: "slugs"; slugs: string[] };

export type Intencion = {
  slug: string;
  /** Grouping shown in nav and on the /maceteros hub. */
  grupo: "Por uso" | "Por tamaño" | "Por color" | "Por función" | "Por planta" | "Por estilo";
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Answer-first intro, rendered under the H1 (2–3 short paragraphs). */
  intro: string[];
  /** ALL rules must match (AND). */
  reglas: Regla[];
  faqs: Faq[];
  /** Related intent slugs. */
  relacionadas: string[];
  /** Guide slugs (/guias/<slug>) to link. */
  guias: string[];
};

// Accessory slugs are never "maceteros" for the "todos" rule.
export const ACCESORIOS = ["piedras-decorativas-xl", "macetero-plato-de-agua", "macetero-plato-invertido", "bases-metalicas"];

export const INTENCIONES: Intencion[] = [
  // ───────────────────────── Por uso ─────────────────────────
  {
    slug: "maceteros-para-terraza",
    grupo: "Por uso",
    h1: "Maceteros para terraza",
    metaTitle: "Maceteros para Terraza y Balcón | Mundo Macetero",
    metaDescription:
      "Maceteros para terraza y balcón: livianos para losas y pisos altos, estables al viento y con despiche, doble fondo o plato. Fabricados en Chile.",
    intro: [
      "Un macetero para terraza tiene que resolver tres cosas: no sobrecargar la losa, no volcarse con el viento y no manchar el piso al regar. Los nuestros están fabricados con tecnología EIFS (poliestireno expandido, malla de fibra de vidrio y recubrimiento de cemento), pesan cerca de 90% menos que el hormigón y se piden con despiche, doble fondo o plato de agua según el caso.",
      "Los formatos de base ancha (cubo, redondo, jardinera, bowl) son los más estables en pisos altos; el Gotar, el cónico y el vaso dan altura con plantas de copa liviana. Todos se fabrican a pedido en Quilicura y suben por ascensor o escalera sin problema.",
    ],
    reglas: [
      {
        kind: "slugs",
        slugs: ["macetero-cubo-cu40", "macetero-redondo", "macetero-gotar-g9", "macetero-gotar-g5", "macetero-gema", "macetero-conico-c2", "macetero-vaso", "jardineras", "macetero-piramidal", "macetero-bowl-cantera-cafe"],
      },
    ],
    faqs: [
      { q: "¿Puedo poner un macetero grande en una terraza de departamento?", a: "Sí. El envase pesa una fracción de uno de cemento, así que la carga la define el sustrato. Cubos de 60 a 80 cm y jardineras de hasta 200 cm se instalan en pisos altos sin cálculo estructural en la mayoría de los casos." },
      { q: "¿Qué macetero de terraza no se vuelca con el viento?", a: "Los de base ancha: cubo, jardinera, bowl y redondo. Si quieres altura, el Gotar y el cónico son estables con plantas de copa liviana." },
      { q: "¿Cómo evito manchar el piso de la terraza?", a: "Con plato de agua bajo el despiche o con doble fondo, que retiene el agua dentro del macetero. Ambas opciones se eligen al comprar." },
    ],
    relacionadas: ["maceteros-grandes", "maceteros-con-doble-fondo", "maceteros-livianos"],
    guias: ["maceteros-para-terraza-y-balcon", "como-elegir-tamano-y-drenaje-de-un-macetero"],
  },
  {
    slug: "maceteros-para-interior",
    grupo: "Por uso",
    h1: "Maceteros para interior",
    metaTitle: "Maceteros para Interior Tipo Cemento | Mundo Macetero",
    metaDescription:
      "Maceteros de interior con textura de cemento para living, hall y oficina: livianos, sin despiche o con plato de agua. Fabricados en Chile.",
    intro: [
      "Para interior un macetero debe verse bien de cerca, poder moverse en la limpieza y no dañar el piso. Los maceteros Mundo Macetero tienen textura mineral real (recubrimiento de cemento sobre EIFS), pesan cerca de 90% menos que el hormigón y se piden sin despiche o con plato de agua a juego para pisos de madera y porcelanato.",
      "Los formatos más usados en interior son el Gotar y el Gema para plantas erguidas junto a una ventana, el cónico y el piramidal para halls, y el cubo y el redondo de 40 a 60 cm para ficus, monsteras y palmeras de interior. Terminaciones cemento natural, blanco y negro.",
    ],
    reglas: [
      {
        kind: "slugs",
        slugs: ["macetero-gotar-g9", "macetero-gema", "macetero-conico-c2", "macetero-colonial-c1", "macetero-bowl-cantera-cafe", "macetero-piramidal", "macetero-redondo", "macetero-cubo-cu40", "macetero-gotar-g5"],
      },
    ],
    faqs: [
      { q: "¿Los maceteros de interior vienen sin agujero?", a: "Se fabrican con o sin despiche según lo que elijas al comprar. Para interior recomendamos sin despiche, o con despiche y plato de agua a juego." },
      { q: "¿El cemento mancha o suelta polvo en interior?", a: "No. La superficie va sellada y con terminación, no suelta polvo ni transfiere humedad al piso." },
      { q: "¿Qué tamaño para un ficus o una monstera?", a: "Cubo o redondo de 40 a 60 cm, o Gotar M a L. Si dudas entre dos tamaños, elige el mayor." },
    ],
    relacionadas: ["maceteros-pequenos-y-medianos", "maceteros-blancos", "maceteros-de-diseno"],
    guias: ["que-macetero-para-cada-planta", "como-elegir-tamano-y-drenaje-de-un-macetero"],
  },
  {
    slug: "maceteros-para-jardin",
    grupo: "Por uso",
    h1: "Maceteros para jardín y exterior",
    metaTitle: "Maceteros para Jardín y Exterior | Mundo Macetero",
    metaDescription:
      "Maceteros de exterior para jardín, acceso y patio: tecnología EIFS, resistentes a sol, lluvia y heladas, de 40 a 200 cm. Hechos en Chile.",
    intro: [
      "Un macetero de jardín vive a la intemperie todo el año. Los nuestros usan la misma tecnología que reviste fachadas de edificios (EIFS: poliestireno expandido, malla de fibra de vidrio y cemento), por lo que resisten sol, lluvia y heladas durante décadas, y se piden con despiche para que el agua nunca quede estancada.",
      "Para accesos y jardines funcionan los formatos de mayor presencia: RP y Luxor, Belga, copón, Milán, cubos y redondos grandes, y jardineras de hasta 200 cm para cercos verdes y bordes de piscina.",
    ],
    reglas: [
      {
        kind: "slugs",
        slugs: ["macetero-cubo-cu40", "macetero-redondo", "jardineras", "macetero-belga", "macetero-luxor-rp", "macetero-ri", "macetero-copon", "macetero-vaso", "macetero-milan", "macetero-conico-c2", "macetero-gotar-g5", "macetero-marroc-cantera-oxido-de-cobre"],
      },
    ],
    faqs: [
      { q: "¿Se quiebran con las heladas?", a: "No, si el agua puede salir. El EIFS soporta ciclos de hielo y deshielo; lo que rompe cualquier macetero es el agua estancada que se congela. Pídelos con despiche." },
      { q: "¿Se decoloran con el sol?", a: "No. La terminación es mineral, no plástica: no amarillea ni se vuelve quebradiza con los rayos UV." },
      { q: "¿Puedo dejarlos directo sobre la tierra?", a: "Mejor sobre una base firme de gravilla, placa o plato invertido, para que la base no esté en contacto permanente con barro." },
    ],
    relacionadas: ["maceteros-extra-grandes", "maceteros-para-olivo", "maceteros-cemento-natural"],
    guias: ["maceteros-resistentes-para-exterior", "que-macetero-para-cada-planta"],
  },

  // ───────────────────────── Por tamaño ─────────────────────────
  {
    slug: "maceteros-grandes",
    grupo: "Por tamaño",
    h1: "Maceteros grandes",
    metaTitle: "Maceteros Grandes de 70 a 100 cm | Mundo Macetero",
    metaDescription:
      "Maceteros grandes de 70 a 100 cm para árboles, palmeras y accesos: ultra livianos gracias al EIFS y resistentes al exterior. Hechos en Chile.",
    intro: [
      "Los maceteros grandes (desde 70 cm de diámetro, lado o alto) son los que un macetero de hormigón vuelve inviables: pesan cientos de kilos y no se pueden mover. Los nuestros, fabricados con EIFS, pesan cerca de 90% menos, así que un cubo de 80 cm o un Gotar XL se instalan en una terraza y se reubican cuando el proyecto cambia.",
      "Sirven para olivos, limoneros, palmeras y arbustos formados, como hito en accesos de edificios y para proyectos de paisajismo y hotelería. Disponibles en cubo, redondo, Gotar, cónico, vaso, RP, Belga, copón y jardineras.",
    ],
    reglas: [{ kind: "todos" }, { kind: "dimMin", cm: 70 }],
    faqs: [
      { q: "¿Cuánto pesa un macetero grande de 80 cm?", a: "Una fracción de uno de cemento: el volumen es poliestireno expandido y el cemento es solo la capa exterior, así que lo mueve una persona. Con tierra y planta el peso lo define el sustrato." },
      { q: "¿Necesito refuerzo estructural en una terraza?", a: "En la mayoría de los casos no, porque el envase casi no pesa. Para muchas piezas grandes en un balcón antiguo, consulta al administrador o a un calculista." },
      { q: "¿Qué planta va bien en un macetero grande?", a: "Olivo, limonero, laurel, palmeras y arbustos formados. Desde 70 cm para ejemplares formados." },
    ],
    relacionadas: ["maceteros-extra-grandes", "maceteros-para-olivo", "maceteros-altos"],
    guias: ["maceteros-para-terraza-y-balcon", "que-macetero-para-cada-planta"],
  },
  {
    slug: "maceteros-extra-grandes",
    grupo: "Por tamaño",
    h1: "Maceteros extra grandes",
    metaTitle: "Maceteros Extra Grandes, 100 cm o Más | Mundo Macetero",
    metaDescription:
      "Maceteros extra grandes de 100 a 200 cm para árboles, accesos de edificios, hotelería y paisajismo. Ultra livianos en EIFS, fabricados a pedido en Chile.",
    intro: [
      "Los maceteros extra grandes (100 cm o más en alguna dimensión) son piezas de proyecto: árboles en macetero, hitos en accesos de edificios, cercos verdes con jardineras de 200 cm, terrazas de hotel. En hormigón son prácticamente imposibles de instalar; en EIFS se trasladan, se suben y se montan sobre losa sin refuerzo.",
      "Fabricamos cubos hasta 120 cm, redondos y cónicos hasta 100 a 110 cm, Milán hasta 160 cm de alto, Belga hasta 120 cm de diámetro y jardineras hasta 200 cm de largo, en series iguales para proyectos.",
    ],
    reglas: [{ kind: "todos" }, { kind: "dimMin", cm: 100 }],
    faqs: [
      { q: "¿Hacen series iguales para proyectos?", a: "Sí. Fabricamos a pedido varias piezas con la misma medida y terminación para inmobiliarias, hotelería, retail y municipalidades, y emitimos factura." },
      { q: "¿Cómo se despacha un macetero de más de un metro?", a: "Con transportista coordinado después de la compra; el despacho es gratis en el sector oriente de Santiago. Por su bajo peso no requiere grúa." },
      { q: "¿Sirven para árboles?", a: "Sí. Son el formato indicado para olivos formados, cítricos, palmeras y árboles ornamentales en macetero." },
    ],
    relacionadas: ["maceteros-grandes", "maceteros-para-jardin", "maceteros-altos"],
    guias: ["maceteros-resistentes-para-exterior", "maceteros-livianos-eifs"],
  },
  {
    slug: "maceteros-pequenos-y-medianos",
    grupo: "Por tamaño",
    h1: "Maceteros pequeños y medianos",
    metaTitle: "Maceteros Pequeños y Medianos | Mundo Macetero",
    metaDescription:
      "Maceteros medianos de hasta 50 cm con textura de cemento para interior, balcón y mesa de terraza. Livianos, con o sin despiche, fabricados en Chile.",
    intro: [
      "Los maceteros pequeños y medianos (hasta 50 cm en su mayor dimensión) son los de living, balcón, escritorio y mesa de terraza. Mantienen la textura mineral y las terminaciones de las piezas grandes, con la ventaja de que en EIFS incluso un cubo de 40 o 50 cm se mueve con una mano.",
      "Son el formato para ficus jóvenes, aromáticas, suculentas y plantas de interior en cubo, redondo, Gotar S, Gema S, bowl y colonial.",
    ],
    reglas: [{ kind: "todos" }, { kind: "dimMax", cm: 50 }],
    faqs: [
      { q: "¿Cuál es el macetero más chico que fabrican?", a: "Cubos y redondos desde 40 cm, jardineras de 30 cm de alto y Gotar o Gema en talla S." },
      { q: "¿Sirven para interior sobre piso de madera?", a: "Sí, pídelos sin despiche o con plato de agua a juego." },
      { q: "¿Puedo combinar varios tamaños?", a: "Sí, es lo más usado: dos o tres piezas del mismo modelo en tallas distintas forman una composición." },
    ],
    relacionadas: ["maceteros-para-interior", "maceteros-blancos", "maceteros-negros"],
    guias: ["como-elegir-tamano-y-drenaje-de-un-macetero", "que-macetero-para-cada-planta"],
  },
  {
    slug: "maceteros-altos",
    grupo: "Por tamaño",
    h1: "Maceteros altos",
    metaTitle: "Maceteros Altos para Palmeras | Mundo Macetero",
    metaDescription:
      "Maceteros altos de 80 a 160 cm para palmeras, dracenas y plantas erguidas: Gotar, cónico, vaso y Milán. Livianos y aptos para exterior.",
    intro: [
      "Un macetero alto (desde 80 cm) da presencia vertical sin ocupar piso y es el formato correcto para plantas de raíz profunda como palmeras, dracenas y bambú. En EIFS un macetero de 1 metro de alto sigue siendo estable y liviano a la vez.",
      "Los formatos altos de Mundo Macetero son el Gotar (hasta 110 cm), el cónico (hasta 110 cm), el vaso (hasta 95 cm) y el Milán (100 a 160 cm), en cemento natural, blanco, negro y cantera.",
    ],
    reglas: [{ kind: "todos" }, { kind: "altoMin", cm: 80 }],
    faqs: [
      { q: "¿Un macetero alto se vuelca con el viento?", a: "Con planta de copa liviana y sustrato completo, no: el peso del sustrato baja el centro de gravedad. Para copas densas en zonas ventosas preferimos formatos de base ancha." },
      { q: "¿Hay que llenarlo completo de tierra?", a: "No necesariamente. Se puede poner una base de material liviano y sustrato en la parte superior, según la profundidad de raíz de la planta." },
      { q: "¿Qué plantas van en un macetero alto?", a: "Palmeras, dracenas, bambú, ficus columnares y arbustos de porte vertical." },
    ],
    relacionadas: ["maceteros-para-palmeras", "maceteros-grandes", "maceteros-de-diseno"],
    guias: ["que-macetero-para-cada-planta"],
  },

  // ───────────────────────── Por color ─────────────────────────
  {
    slug: "maceteros-negros",
    grupo: "Por color",
    h1: "Maceteros negros",
    metaTitle: "Maceteros Negros de Cemento | Mundo Macetero",
    metaDescription:
      "Maceteros negros con textura de cemento para terraza, jardín e interior: dramatizan el verde y resisten el exterior. Livianos, fabricados a pedido en Chile.",
    intro: [
      "El negro es la terminación que más resalta el verde de la planta y la que mejor combina con arquitectura contemporánea, deck de madera y piedra. Nuestros maceteros negros llevan la terminación aplicada a mano sobre el recubrimiento de cemento, sellada para exterior, sin decolorarse con el sol.",
      "Disponible en cubo, redondo, Gotar, Gema, cónico, vaso, piramidal, bowl y jardineras.",
    ],
    reglas: [{ kind: "todos" }, { kind: "color", match: ["negro", "grafito", "oscurecido"] }],
    faqs: [
      { q: "¿El negro se destiñe con el sol?", a: "No. La terminación es mineral y sellada; no amarillea ni se vuelve gris con los rayos UV." },
      { q: "¿El negro calienta más la raíz?", a: "Absorbe algo más de calor que el blanco, pero el poliestireno del EIFS aísla la raíz mucho mejor que un macetero de plástico o metal." },
      { q: "¿Combina con cemento natural?", a: "Sí, es la combinación más pedida: piezas negras y cemento natural del mismo modelo en tallas distintas." },
    ],
    relacionadas: ["maceteros-cemento-natural", "maceteros-blancos", "maceteros-de-diseno"],
    guias: ["maceteros-premium-de-diseno"],
  },
  {
    slug: "maceteros-blancos",
    grupo: "Por color",
    h1: "Maceteros blancos",
    metaTitle: "Maceteros Blancos de Cemento | Mundo Macetero",
    metaDescription:
      "Maceteros blancos con textura de cemento para terraza, jardín e interior: luminosos, mediterráneos y resistentes al exterior. Fabricados a pedido en Chile.",
    intro: [
      "El cemento blanco ilumina el espacio y hace resaltar plantas de hoja oscura como olivos, laureles y ficus. Es la terminación de las terrazas mediterráneas y los interiores claros. Como el resto de nuestras terminaciones, se aplica a mano sobre el recubrimiento de cemento y va sellada para exterior.",
      "Disponible en Gotar, Gema, cónico y otros modelos según talla.",
    ],
    reglas: [{ kind: "todos" }, { kind: "color", match: ["blanco"] }],
    faqs: [
      { q: "¿El blanco se ensucia con el riego?", a: "Las salpicaduras de tierra se limpian con agua y un paño; la superficie está sellada. En exterior el blanco envejece con carácter, como una fachada." },
      { q: "¿Qué plantas se ven mejor en blanco?", a: "Olivo, laurel, ficus, lavanda, romero y en general plantas de hoja verde oscuro o gris." },
      { q: "¿Es blanco puro o blanco cemento?", a: "Es cemento blanco: un blanco mineral, ligeramente cálido, no un blanco plástico brillante." },
    ],
    relacionadas: ["maceteros-negros", "maceteros-cemento-natural", "maceteros-para-interior"],
    guias: ["maceteros-premium-de-diseno"],
  },
  {
    slug: "maceteros-cemento-natural",
    grupo: "Por color",
    h1: "Maceteros de cemento natural",
    metaTitle: "Maceteros de Cemento Natural | Mundo Macetero",
    metaDescription:
      "Maceteros tipo cemento en su color natural: textura mineral con variaciones de tono propias de la terminación a mano. Livianos, hechos en Chile.",
    intro: [
      "El cemento natural es el color del material: un gris mineral con pequeñas variaciones de tono que hacen que cada pieza sea única. Es la terminación más pedida para jardines, terrazas y proyectos de arquitectura, porque envejece como una fachada y combina con todo.",
      "Toda la línea está disponible en cemento natural: cubo, redondo, Gotar, Gema, cónico, vaso, RP, Belga, copón, colonial, bowl, piramidal y jardineras.",
    ],
    reglas: [{ kind: "todos" }, { kind: "color", match: ["cemento natural", "cemento liso", "cemento"] }],
    faqs: [
      { q: "¿Por qué dos maceteros de cemento natural no son idénticos?", a: "Porque la terminación se aplica a mano pieza por pieza y el cemento tiene variaciones de tono naturales. Es parte del carácter del producto." },
      { q: "¿Se puede pintar después?", a: "Sí. La capa exterior es cemento: acepta esmalte al agua para exterior o pintura mineral." },
      { q: "¿Es el mismo color que un macetero de hormigón?", a: "Sí, es el mismo cemento, con la diferencia de que pesa cerca de 90% menos." },
    ],
    relacionadas: ["maceteros-negros", "maceteros-de-cemento", "maceteros-para-jardin"],
    guias: ["maceteros-livianos-eifs"],
  },
  {
    slug: "maceteros-texturas-especiales",
    grupo: "Por color",
    h1: "Maceteros con texturas especiales: cantera, óxido y rústico",
    metaTitle: "Maceteros Cantera y Óxido de Cobre | Mundo Macetero",
    metaDescription:
      "Terminaciones especiales hechas a mano: cantera negro y beige, óxido de cobre, ocre viejo y rústico blanco. Piezas únicas sobre EIFS.",
    intro: [
      "Además de los colores lisos, aplicamos terminaciones especiales a mano: cantera (textura pétrea con relieve, en negro, beige o café), óxido de cobre, ocre viejo, cemento texturizado y rústico blanco. Son las terminaciones de las piezas protagonistas y de los proyectos de hotelería y paisajismo.",
      "Cada pieza con textura especial es única: el relieve y el veteado no se repiten. Disponible en Gotar, Marroc, bowl, Luxor RP, copón, cónico y otros según talla.",
    ],
    reglas: [{ kind: "todos" }, { kind: "color", match: ["cantera", "oxido", "óxido", "ocre", "rústico", "rustico", "texturizado", "café", "cafe"] }],
    faqs: [
      { q: "¿La textura cantera resiste el exterior?", a: "Sí. Es un acabado mineral sobre el recubrimiento de cemento, sellado igual que las terminaciones lisas." },
      { q: "¿El óxido de cobre es metal real?", a: "Es una terminación que reproduce el color y el veteado del cobre oxidado sobre cemento; no es metal, así que no mancha ni sigue oxidándose." },
      { q: "¿Puedo pedir una textura en otro modelo?", a: "Escríbenos. Para proyectos y series evaluamos terminaciones especiales en cualquier modelo." },
    ],
    relacionadas: ["maceteros-de-diseno", "maceteros-cemento-natural", "maceteros-negros"],
    guias: ["maceteros-premium-de-diseno"],
  },

  // ───────────────────────── Por función ─────────────────────────
  {
    slug: "maceteros-con-doble-fondo",
    grupo: "Por función",
    h1: "Maceteros con doble fondo (autorregantes)",
    metaTitle: "Maceteros con Doble Fondo Autorregantes | Mundo Macetero",
    metaDescription:
      "Maceteros con doble fondo: cámara de reserva de agua que espacia el riego y no drena al piso. Ideales para balcones, interiores y proyectos.",
    intro: [
      "El doble fondo es una placa interior que separa el sustrato de una cámara de reserva de agua en la base. El agua sobrante baja a la cámara en vez de salir hacia afuera y la planta la toma por capilaridad: el riego se espacia, la planta tolera mejor una semana sin atención y el piso queda limpio. Es el equivalente a un macetero autorregante, con textura de cemento.",
      "Es la opción indicada para balcones sobre vecinos, interiores sobre piso delicado y proyectos comerciales con mantención esporádica. Se pide como opción al comprar en los modelos que lo ofrecen.",
    ],
    reglas: [{ kind: "opcion", match: ["doble fondo"] }],
    faqs: [
      { q: "¿El doble fondo reemplaza al despiche?", a: "Sí, en exterior cubierto e interior. A la intemperie con lluvia intensa conviene combinarlo con un rebosadero o elegir despiche con plato." },
      { q: "¿Cuánto tiempo aguanta la planta sin riego?", a: "Depende de la especie y el clima, pero la cámara de reserva permite espaciar el riego varios días respecto de un macetero convencional." },
      { q: "¿Se puede agregar doble fondo a un modelo que no lo lista?", a: "Consúltanos al comprar; en varios modelos se fabrica a pedido." },
    ],
    relacionadas: ["maceteros-para-terraza", "maceteros-para-interior", "maceteros-con-drenaje"],
    guias: ["como-elegir-tamano-y-drenaje-de-un-macetero", "maceteros-para-terraza-y-balcon"],
  },
  {
    slug: "maceteros-con-drenaje",
    grupo: "Por función",
    h1: "Maceteros con drenaje (despiche)",
    metaTitle: "Maceteros con Drenaje o Despiche | Mundo Macetero",
    metaDescription:
      "Todos nuestros maceteros se fabrican con o sin despiche a pedido. Cuándo conviene, cómo combinarlo con plato de agua y qué plantas lo necesitan.",
    intro: [
      "El despiche es la perforación en la base por donde sale el agua sobrante. Es imprescindible a la intemperie y para plantas que no toleran encharcamiento: olivo, cítricos, suculentas, lavanda. Como fabricamos a pedido, cualquier macetero de la línea se puede pedir con despiche, y se combina con plato de agua a juego cuando el piso debe quedar limpio.",
      "Aquí están todos los modelos; al comprar eliges con o sin drenaje.",
    ],
    reglas: [{ kind: "todos" }],
    faqs: [
      { q: "¿Todos los maceteros pueden llevar despiche?", a: "Sí. Se perfora en la fabricación según lo que elijas al comprar." },
      { q: "¿Cuántos orificios lleva?", a: "Depende del tamaño de la base; en formatos grandes se hacen varios para que el drenaje sea uniforme." },
      { q: "¿Qué pasa si lo pido sin despiche y después lo necesito?", a: "Se puede perforar después con broca para hormigón, con cuidado; pero es mejor decidirlo al comprar." },
    ],
    relacionadas: ["maceteros-con-doble-fondo", "maceteros-para-jardin", "maceteros-para-terraza"],
    guias: ["como-elegir-tamano-y-drenaje-de-un-macetero"],
  },
  {
    slug: "maceteros-livianos",
    grupo: "Por función",
    h1: "Maceteros livianos",
    metaTitle: "Maceteros Livianos Tipo Cemento | Mundo Macetero",
    metaDescription:
      "Maceteros ultra livianos con aspecto de cemento: tecnología EIFS, cerca de 90% menos peso que el hormigón y aptos para exterior. Hechos en Chile.",
    intro: [
      "Todos los maceteros Mundo Macetero son livianos: usamos tecnología EIFS (poliestireno expandido, malla de fibra de vidrio y recubrimiento de cemento), la misma de las fachadas de edificios, y el resultado pesa cerca de 90% menos que un macetero de hormigón del mismo tamaño, con la misma textura y resistencia al clima.",
      "Eso permite formatos grandes en terrazas y balcones, mover las piezas en la limpieza o al cambiar la distribución, y despachar a todo Chile sin grúa. Aquí está la línea completa.",
    ],
    reglas: [{ kind: "todos" }],
    faqs: [
      { q: "¿Qué tan livianos son?", a: "Cerca de 90% menos que el cemento. Un cubo de 60 cm que en hormigón supera los 100 kilos, en EIFS lo levanta una persona." },
      { q: "¿Liviano significa frágil?", a: "No. La malla de fibra de vidrio y el recubrimiento de cemento dan una piel dura que resiste golpes moderados, y si se daña se resana y repinta." },
      { q: "¿Son de plástico o fibra de vidrio?", a: "No. La superficie es cemento real; la fibra de vidrio va embebida como refuerzo y el volumen es poliestireno expandido." },
    ],
    relacionadas: ["maceteros-grandes", "maceteros-para-terraza", "maceteros-de-cemento"],
    guias: ["maceteros-livianos-eifs", "maceteros-resistentes-para-exterior"],
  },
  {
    slug: "maceteros-de-cemento",
    grupo: "Por función",
    h1: "Maceteros de cemento",
    metaTitle: "Maceteros de Cemento Livianos | Mundo Macetero",
    metaDescription:
      "Maceteros de cemento sin el peso del cemento: recubrimiento real sobre EIFS, aptos para exterior, de 40 a 200 cm y terminados a mano en Chile.",
    intro: [
      "Si buscas maceteros de cemento, estos tienen exactamente esa superficie (recubrimiento de cemento aplicado sobre malla de fibra de vidrio y núcleo de poliestireno expandido) sin el problema del cemento: el peso. Se ven y se sienten como hormigón, resisten el exterior como una fachada y se mueven con una mano.",
      "Terminaciones cemento natural, blanco, negro y texturas especiales, en cubo, redondo, Gotar, Gema, cónico, vaso, RP, Belga, copón, colonial, bowl, piramidal, Milán y jardineras.",
    ],
    reglas: [{ kind: "todos" }],
    faqs: [
      { q: "¿Es cemento de verdad?", a: "Sí. La capa exterior es cemento aplicado sobre malla de fibra de vidrio; el volumen interior es poliestireno expandido, por eso pesa tan poco." },
      { q: "¿Se fisura como el hormigón?", a: "Menos: la malla de fibra de vidrio trabaja a tracción y evita las fisuras que el cemento solo no aguanta." },
      { q: "¿Qué es la tecnología EIFS?", a: "Es el sistema de revestimiento de fachadas de edificios: núcleo de poliestireno expandido, malla de fibra de vidrio y recubrimiento de cemento." },
    ],
    relacionadas: ["maceteros-cemento-natural", "maceteros-livianos", "maceteros-para-jardin"],
    guias: ["maceteros-livianos-eifs"],
  },

  // ───────────────────────── Por planta ─────────────────────────
  {
    slug: "maceteros-para-olivo",
    grupo: "Por planta",
    h1: "Maceteros para olivo",
    metaTitle: "Maceteros para Olivo | Mundo Macetero",
    metaDescription:
      "Qué macetero usar para un olivo: desde 50 a 60 cm con despiche, en cubo, redondo o RP. Livianos para terraza y resistentes al exterior.",
    intro: [
      "El olivo en macetero necesita volumen de raíz, drenaje libre y un envase estable frente al viento. Recomendamos cubo, redondo, RP o Belga desde 50 a 60 cm para un ejemplar joven y 70 a 80 cm para uno formado, siempre con despiche y sustrato drenante.",
      "En cemento natural o negro el olivo se ve mediterráneo y contemporáneo; en blanco, más luminoso. Como los maceteros son livianos, un olivo grande se puede tener en terraza y en piso alto.",
    ],
    reglas: [{ kind: "slugs", slugs: ["macetero-cubo-cu40", "macetero-redondo", "macetero-luxor-rp", "macetero-ri", "macetero-belga", "macetero-copon"] }, { kind: "dimMin", cm: 50 }],
    faqs: [
      { q: "¿Qué tamaño de macetero necesita un olivo?", a: "Desde 50 a 60 cm para un olivo joven y 70 a 80 cm para uno formado, con despiche." },
      { q: "¿Con o sin despiche para olivo?", a: "Siempre con despiche: el olivo no tolera el encharcamiento. Combínalo con plato de agua si está en terraza." },
      { q: "¿Se puede tener un olivo en un balcón?", a: "Sí. El macetero pesa una fracción de uno de cemento y el olivo tolera sol y viento; elige formato de base ancha." },
    ],
    relacionadas: ["maceteros-grandes", "maceteros-para-jardin", "maceteros-con-drenaje"],
    guias: ["que-macetero-para-cada-planta"],
  },
  {
    slug: "maceteros-para-palmeras",
    grupo: "Por planta",
    h1: "Maceteros para palmeras",
    metaTitle: "Maceteros para Palmeras · Altos y Profundos | Mundo Macetero",
    metaDescription:
      "Maceteros para palmeras (kentia, fénix, areca) y plantas de raíz profunda: Gotar, cónico, vaso y Milán, altos y aptos para exterior.",
    intro: [
      "Las palmeras crecen hacia abajo antes que a los lados, así que el macetero debe ser profundo más que ancho. Los formatos indicados son el Gotar en tallas M a XXL, el cónico, el vaso y el Milán, todos desde 55 cm de alto, con despiche.",
      "El Gotar, con su base angosta y cadera alta, deja ver la palmera completa y aporta altura visual sin ocupar mucho piso; el Milán es la pieza para halls y accesos de gran altura.",
    ],
    reglas: [{ kind: "slugs", slugs: ["macetero-gotar-g9", "macetero-gotar-g5", "macetero-conico-c2", "macetero-vaso", "macetero-milan", "macetero-piramidal"] }],
    faqs: [
      { q: "¿Qué macetero conviene para una kentia de interior?", a: "Gotar M o L o cónico de 60 a 70 cm de alto, sin despiche o con plato de agua." },
      { q: "¿Y para una palmera fénix de exterior?", a: "Vaso, cónico o Gotar XL en adelante, con despiche, en cemento natural o negro." },
      { q: "¿Hay que llenar todo el macetero de tierra?", a: "No necesariamente: se puede usar una base liviana y sustrato en la parte superior según la profundidad de raíz." },
    ],
    relacionadas: ["maceteros-altos", "maceteros-para-interior", "maceteros-de-diseno"],
    guias: ["que-macetero-para-cada-planta"],
  },

  // ───────────────────────── Por estilo ─────────────────────────
  {
    slug: "maceteros-de-diseno",
    grupo: "Por estilo",
    h1: "Maceteros de diseño",
    metaTitle: "Maceteros de Diseño Premium | Mundo Macetero",
    metaDescription:
      "Maceteros de diseño con proporciones cuidadas y terminación a mano: Gotar, Gema, Marroc, Milán, copón y Luxor RP. Cada pieza es única.",
    intro: [
      "Un macetero de diseño se distingue por la forma, la proporción y la terminación. El Gotar con silueta de gota, el Gema facetado, el Marroc con textura cantera y óxido de cobre, el Milán de líneas rectas y gran altura, el copón sobre pie y el Luxor RP de cadera ancha son las piezas protagonistas de la línea.",
      "Cada una se fabrica a pedido y se termina a mano, por lo que no hay dos exactamente iguales. Son las piezas para accesos, halls, terrazas de hotel y proyectos de arquitectura.",
    ],
    reglas: [{ kind: "slugs", slugs: ["macetero-gema", "macetero-gotar-g9", "macetero-gotar-g5", "macetero-marroc-cantera-oxido-de-cobre", "macetero-milan", "macetero-copon", "macetero-luxor-rp", "macetero-autor-gotar-aqua", "macetero-piramidal"] }],
    faqs: [
      { q: "¿Qué hace que un macetero sea de diseño?", a: "Proporciones cuidadas, una terminación aplicada a mano y un material que envejece bien. No es solo el precio: es cómo se ve en el espacio a lo largo de los años." },
      { q: "¿Son aptos para exterior?", a: "Sí. Todos son EIFS sellado, resistente a sol, lluvia y heladas, con despiche o doble fondo a pedido." },
      { q: "¿Hacen piezas de autor?", a: "Sí, desarrollamos ediciones limitadas y colaboraciones para proyectos de arquitectura y paisajismo." },
    ],
    relacionadas: ["maceteros-texturas-especiales", "maceteros-altos", "maceteros-para-interior"],
    guias: ["maceteros-premium-de-diseno"],
  },
  {
    slug: "maceteros-cuadrados",
    grupo: "Por estilo",
    h1: "Maceteros cuadrados y rectangulares",
    metaTitle: "Maceteros Cuadrados y Jardineras | Mundo Macetero",
    metaDescription:
      "Maceteros cuadrados (cubos de 40 a 120 cm) y jardineras de 90 a 200 cm para alinear contra muros, esquinas y bordes. Hechos en Chile.",
    intro: [
      "El formato cuadrado y rectangular es el que mejor aprovecha el espacio: calza contra un muro o en una esquina y se alinea en serie sin dejar espacio muerto entre piezas. Los cubos van de 40 a 120 cm de lado y las jardineras de 90 a 200 cm de largo con 30 a 50 cm de alto y profundidad.",
      "En cemento natural, negro y grafito, con o sin despiche, son la base de cercos verdes, separaciones de terraza y bordes de piscina.",
    ],
    reglas: [{ kind: "slugs", slugs: ["macetero-cubo-cu40", "jardineras", "piedras-decorativas-xl"] }],
    faqs: [
      { q: "¿Se pueden alinear varios cubos sin separación?", a: "Sí, las caras son rectas y las medidas exactas, así que forman una línea continua." },
      { q: "¿Qué jardinera para un cerco verde?", a: "Jardineras de 150 a 200 cm de largo y 40 a 50 cm de alto y profundidad, en línea, con despiche." },
      { q: "¿Los cubos grandes se pueden poner en terraza?", a: "Sí. Un cubo de 80 o 100 cm en EIFS pesa una fracción de uno de cemento." },
    ],
    relacionadas: ["maceteros-para-terraza", "maceteros-grandes", "maceteros-negros"],
    guias: ["maceteros-para-terraza-y-balcon"],
  },
  {
    slug: "maceteros-mas-vendidos",
    grupo: "Por estilo",
    h1: "Maceteros más vendidos",
    metaTitle: "Maceteros Más Vendidos | Mundo Macetero",
    metaDescription:
      "Los productos más vendidos de Mundo Macetero: macetero cubo, jardineras y plato de agua. Livianos, resistentes al exterior y fabricados a pedido en Chile.",
    intro: [
      "Estos son los tres productos que más eligen nuestros clientes: el macetero cubo, por su versatilidad y porque se alinea en serie contra muros y esquinas; las jardineras, para cercos verdes, separaciones de terraza y aromáticas junto a la cocina; y el plato de agua, que protege el piso y completa cualquier macetero con despiche.",
      "Todos en EIFS, cerca de 90% más livianos que el cemento, con despiche o doble fondo a pedido y terminación a mano.",
    ],
    reglas: [{ kind: "slugs", slugs: ["macetero-cubo-cu40", "jardineras", "macetero-plato-de-agua"] }],
    faqs: [
      { q: "¿Cuál es el macetero más vendido?", a: "El cubo, seguido de las jardineras. El plato de agua es el accesorio más vendido porque acompaña a casi todos los maceteros con despiche." },
      { q: "¿Los más vendidos tienen stock inmediato?", a: "Se fabrican a pedido en la medida y color que eliges; al confirmar la compra te informamos el plazo." },
      { q: "¿Puedo ver los maceteros antes de comprar?", a: "Sí, en nuestro taller de Quilicura, de lunes a viernes." },
    ],
    relacionadas: ["maceteros-cuadrados", "maceteros-para-terraza", "maceteros-con-drenaje"],
    guias: ["como-elegir-tamano-y-drenaje-de-un-macetero"],
  },
];

export const INTENCIONES_BY_SLUG: Record<string, Intencion> = Object.fromEntries(INTENCIONES.map((i) => [i.slug, i]));

export const GRUPOS: Intencion["grupo"][] = ["Por uso", "Por tamaño", "Por color", "Por función", "Por planta", "Por estilo"];
