// Editorial content for Generative Engine Optimization: buying guides, collection
// intros and the site-wide FAQ. Every text opens with a direct, self-contained
// answer so that ChatGPT, Perplexity, Gemini and Google AI Overviews can quote it.
//
// Facts that must stay true (source: content/site.ts, content/policies.ts and the
// product descriptions in the database): maceteros con tecnología EIFS,
// ~90% más livianos que el cemento, fabricados a pedido en Quilicura, despacho
// gratis en el sector oriente de Santiago, resto cotizado con transportista,
// retiro gratis en tienda, garantía por fallas de fabricación, pago con
// Mercado Pago o transferencia. Do NOT add prices here; they live in the database.

export type Faq = { q: string; a: string };
export type Seccion = { titulo: string; parrafos: string[] };

export type Guia = {
  slug: string;
  titulo: string;
  metaTitle: string;
  metaDescription: string;
  /** Answer-first lead paragraph (40–70 words). */
  resumen: string;
  keywords: string[];
  secciones: Seccion[];
  faqs: Faq[];
  /** Collection slugs (/tienda/<slug>) to link as "Colecciones recomendadas". */
  colecciones: string[];
  /** Other guide slugs. */
  relacionadas: string[];
  fechaPublicacion: string; // ISO date
};

export const GUIAS: Guia[] = [
  {
    slug: "maceteros-livianos-eifs",
    titulo: "Maceteros livianos EIFS: qué son y por qué pesan 90% menos",
    metaTitle: "Maceteros Livianos EIFS · Guía Completa | Mundo Macetero",
    metaDescription:
      "Qué es un macetero con tecnología EIFS, por qué pesa hasta 90% menos que uno de cemento, cuánto dura en exterior y cómo elegir tamaño y color. Fabricados en Chile.",
    resumen:
      "Un macetero liviano EIFS es un macetero fabricado con la tecnología de revestimiento de fachadas de construcción: un núcleo de poliestireno expandido, malla de fibra de vidrio y un recubrimiento de cemento con terminación de color o textura. Tiene el aspecto y la textura del cemento, pero pesa alrededor de un 90% menos que un macetero de hormigón del mismo tamaño. Mundo Macetero los fabrica a pedido en Quilicura, Santiago de Chile, en formatos de 30 a 200 centímetros.",
    keywords: [
      "maceteros livianos",
      "maceteros EIFS",
      "maceteros ultra livianos",
      "maceteros tipo cemento",
      "maceteros livianos Chile",
      "maceteros livianos grandes",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "Cómo se fabrica un macetero EIFS",
        parrafos: [
          "Usamos el sistema EIFS (Exterior Insulation and Finishing System), el mismo con que se revisten fachadas de edificios. El cuerpo del macetero se forma en poliestireno expandido, que da el volumen sin peso. Sobre él se adhiere una malla de fibra de vidrio, que trabaja a tracción y evita fisuras, y encima se aplica el recubrimiento de cemento que le da la piel dura, el aspecto y la textura mineral. Al final va la terminación: color (cemento natural, blanco, negro) o texturas especiales como cantera u óxido de cobre. Como casi todo el volumen es poliestireno y el cemento es solo la capa exterior, un cubo de 60 centímetros que en hormigón puede superar los 100 kilos, en EIFS lo levanta una persona.",
          "Cada pieza se termina a mano: se aplica la terminación de color o textura, se sella y, si el cliente lo pide, se perforan los orificios de drenaje (despiche). Por eso los maceteros se fabrican a pedido en la combinación de forma, tamaño y color que eliges, y no hay dos exactamente iguales.",
        ],
      },
      {
        titulo: "Ventajas frente a cemento, plástico y fibra de vidrio",
        parrafos: [
          "Frente al hormigón: mismo aspecto, misma sensación de masa y estabilidad visual, pero se puede mover, subir por escalera y montar sobre losas, terrazas y balcones sin cálculo estructural. Frente al plástico: no se decolora ni se vuelve quebradizo con el sol, no se vuelca con el viento porque tiene más peso propio, y envejece como un material mineral, no como un polímero. Frente a la fibra de vidrio pura: en el EIFS la malla de fibra de vidrio va embebida bajo el cemento, así que la superficie es genuinamente mineral, no se raya dejando ver la fibra y no necesita gel-coat; un macetero solo de fibra de vidrio se ve y se siente como plástico rígido.",
        ],
      },
      {
        titulo: "Durabilidad en exterior",
        parrafos: [
          "El EIFS es un sistema de fachada: está hecho para resistir lluvia, sol, heladas y cambios de temperatura durante décadas en un edificio. Un macetero EIFS bien sellado y con drenaje correcto dura décadas al aire libre. Los dos cuidados que importan son evitar que el agua quede estancada en invierno (por eso recomendamos despiche o doble fondo en exterior) y no arrastrar la pieza por el suelo, porque el borde inferior es la zona más expuesta a golpes.",
        ],
      },
      {
        titulo: "Tamaños y formatos disponibles",
        parrafos: [
          "Mundo Macetero fabrica cubos de 40 a 120 centímetros de lado, jardineras de 100 a 200 centímetros de largo, maceteros redondos, cónicos, bowl, gota (Gotar), vaso, copón, colonial, Gema, Milán, Marroc, RP y platos de agua, en terminaciones cemento natural, cemento blanco, negro, cantera negro, cantera café y óxido de cobre según el modelo. Todos se pueden pedir con o sin despiche y varios con doble fondo.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cuánto pesa un macetero EIFS?",
        a: "Alrededor de un 90% menos que un macetero de cemento u hormigón del mismo tamaño, porque el volumen es poliestireno expandido y el cemento es solo la capa exterior. Un formato grande, de 60 a 80 centímetros, lo mueve una persona sin ayuda; con tierra y planta el peso total lo define el sustrato, no el macetero.",
      },
      {
        q: "¿El EIFS se quiebra con las heladas?",
        a: "No, si el agua puede salir. El EIFS es un sistema de fachada y soporta ciclos de hielo y deshielo. Lo que daña cualquier macetero es el agua estancada que se congela y expande, por eso en exterior recomendamos despiche o doble fondo.",
      },
      {
        q: "¿Se puede pintar un macetero EIFS?",
        a: "Sí. La capa exterior es cemento, así que se puede repintar con esmalte al agua para exterior o pintura mineral después de limpiar la superficie. Nosotros los entregamos ya sellados y con la terminación que eliges.",
      },
      {
        q: "¿Los maceteros EIFS sirven para interior?",
        a: "Sí. Son livianos para mover en la limpieza y su textura de cemento funciona muy bien en interiores de estilo contemporáneo. Para interior conviene pedirlos sin despiche o usar un plato de agua para proteger el piso.",
      },
      {
        q: "¿Dónde se fabrican los maceteros de Mundo Macetero?",
        a: "En nuestro taller de Las Esteras Norte 2610, Galpón 16, Quilicura, Santiago de Chile. Se fabrican a pedido y se pueden retirar ahí sin costo o despachar a todo Chile.",
      },
    ],
    colecciones: ["cubo", "gotar", "redondos", "jardinera"],
    relacionadas: ["maceteros-resistentes-para-exterior", "maceteros-para-terraza-y-balcon"],
  },

  {
    slug: "maceteros-para-terraza-y-balcon",
    titulo: "Maceteros para terraza y balcón: peso, viento, drenaje y tamaño ideal",
    metaTitle: "Maceteros para Terraza y Balcón · Cómo Elegir | Mundo Macetero",
    metaDescription:
      "Guía para elegir maceteros de terraza y balcón: cuánto peso soporta una losa, qué formatos resisten el viento, cómo resolver el drenaje sin manchar el piso y qué tamaño usar según la planta.",
    resumen:
      "El mejor macetero para una terraza o balcón es uno liviano, estable frente al viento y con un sistema de drenaje que no manche ni inunde el piso. Los maceteros con tecnología EIFS cumplen las tres condiciones: pesan hasta 90% menos que el cemento, tienen suficiente masa para no volcarse y se fabrican con despiche, doble fondo o plato de agua según lo que el espacio necesite.",
    keywords: [
      "maceteros para terraza",
      "maceteros de terraza",
      "maceteros para balcón",
      "maceteros grandes para terraza",
      "maceteros livianos para departamento",
      "maceteros para exterior departamento",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "El peso es el primer límite de una terraza",
        parrafos: [
          "Las losas de terrazas y balcones se diseñan para una sobrecarga de uso acotada, y un macetero de hormigón grande con tierra húmeda puede concentrar varios cientos de kilos en menos de un metro cuadrado. Con EIFS el peso del envase casi desaparece de la ecuación: lo que pesa es el sustrato. Eso permite usar formatos grandes (cubos de 60 a 80 centímetros, jardineras de 150 a 200) en pisos altos, y además moverlos para limpiar, cambiar la distribución o proteger las plantas del viento en invierno.",
          "Si la terraza es sobre un deck de madera o una losa antigua, conviene además repartir la carga con jardineras largas en vez de pocos maceteros muy profundos, y usar sustratos livianos con perlita o fibra de coco.",
        ],
      },
      {
        titulo: "Viento: base ancha y altura moderada",
        parrafos: [
          "En pisos altos el viento vuelca los maceteros de plástico y los formatos muy esbeltos. Los formatos con base ancha (cubo, jardinera, bowl, redondo) son los más estables. Si quieres altura, el Gotar y el cónico funcionan bien con plantas de copa liviana; para árboles o arbustos de copa densa en zonas ventosas, preferimos cubo o RP de mayor diámetro. El peso propio del EIFS, mayor que el del plástico pero manejable, ayuda a que la pieza no se mueva.",
        ],
      },
      {
        titulo: "Drenaje sin manchar el piso",
        parrafos: [
          "Hay tres soluciones y elegimos una según el caso. Despiche (perforación de drenaje) con plato de agua debajo: es la opción clásica para plantas que necesitan drenar libremente; el plato del mismo material recoge el exceso sin manchar. Doble fondo: una placa interior separa el sustrato de una cámara de reserva de agua en la base; el macetero no drena hacia afuera, la planta toma agua por capilaridad y el riego se espacia. Es la opción más limpia para balcones sobre vecinos. Sin despiche: solo para interior o plantas de riego muy controlado.",
        ],
      },
      {
        titulo: "Qué tamaño usar según la planta",
        parrafos: [
          "Regla práctica: el diámetro o lado del macetero debe ser al menos un tercio de la altura final de la planta, y para árboles pequeños (olivo, limonero, laurel) desde 50 centímetros. Aromáticas y plantas bajas en hilera van en jardineras de 30 centímetros de alto. Palmeras y ficus de interior-exterior en cubos o redondos de 50 a 70 centímetros. Cercos verdes o divisiones de terraza en jardineras de 100 a 200 centímetros de largo.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Puedo poner un macetero grande en un balcón sin revisar la estructura?",
        a: "Con EIFS, en la gran mayoría de los casos sí, porque el envase pesa una fracción del cemento y la carga total la define el sustrato. Para instalaciones de muchas jardineras grandes en un mismo balcón antiguo recomendamos consultar al administrador o a un calculista.",
      },
      {
        q: "¿Qué macetero de terraza no se vuelca con el viento?",
        a: "Los de base ancha: cubo, jardinera, bowl y redondo. Si quieres altura, el Gotar y el cónico son estables con plantas de copa liviana.",
      },
      {
        q: "¿Cómo evito que el macetero manche el piso de la terraza?",
        a: "Con plato de agua bajo el despiche, o con doble fondo, que retiene el agua dentro del macetero y no drena hacia afuera. Ambas opciones se fabrican a pedido.",
      },
      {
        q: "¿Qué macetero sirve para un olivo en terraza?",
        a: "Un cubo, redondo o RP desde 50 a 60 centímetros, con despiche, en cemento natural o negro. El olivo necesita buen drenaje y un envase estable frente al viento.",
      },
      {
        q: "¿Hacen despacho a departamentos en Santiago?",
        a: "Sí. El despacho es gratis en las comunas del sector oriente (Las Condes, Vitacura, Lo Barnechea, Providencia, La Reina, Ñuñoa, Peñalolén) y se cotiza con transportista para el resto. Al ser livianos, los maceteros suben por ascensor o escalera sin problema.",
      },
    ],
    colecciones: ["cubo", "jardinera", "gotar", "plato-de-agua"],
    relacionadas: ["maceteros-livianos-eifs", "como-elegir-tamano-y-drenaje-de-un-macetero"],
  },

  {
    slug: "maceteros-resistentes-para-exterior",
    titulo: "Maceteros resistentes para exterior: comparación de materiales",
    metaTitle: "Maceteros Resistentes para Exterior · EIFS vs Cemento, Plástico y Fibra | Mundo Macetero",
    metaDescription:
      "Qué macetero resiste mejor sol, lluvia y heladas: comparamos EIFS, hormigón, plástico, fibra de vidrio, greda y madera, y explicamos cuál conviene para jardín, terraza y proyectos comerciales.",
    resumen:
      "Los maceteros más resistentes para exterior son los de materiales minerales con buen drenaje: EIFS y hormigón. El EIFS, hecho con la misma tecnología de las fachadas de edificios, tiene la misma resistencia a sol, lluvia y heladas que el hormigón, pero pesa cerca de 90% menos, lo que lo hace más práctico para terrazas, accesos y proyectos comerciales. El plástico se degrada con los rayos UV, la greda se quiebra con las heladas y la madera se pudre si no se mantiene.",
    keywords: [
      "maceteros resistentes",
      "maceteros para exterior",
      "maceteros resistentes al sol",
      "maceteros para jardín",
      "maceteros de exterior grandes",
      "mejor material para maceteros de exterior",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "Comparación material por material",
        parrafos: [
          "Tecnología EIFS (poliestireno expandido + malla de fibra de vidrio + recubrimiento de cemento): resistente a UV, lluvia y heladas; textura mineral; liviano; se fabrica en formatos grandes y se repinta. Es la tecnología que usamos en Mundo Macetero, la misma de las fachadas de edificios. Hormigón o cemento vaciado: igual de resistente al clima, pero muy pesado, difícil de mover e instalar, y con riesgo de fisuras en piezas grandes mal curadas. Plástico y polipropileno: liviano y barato, pero se decolora y se vuelve quebradizo con el sol en pocos años, y se vuelca con el viento. Fibra de vidrio: liviana y resistente al agua, pero el gel-coat se raya, amarillea y deja ver la fibra; se ve como plástico rígido. Greda y terracota: hermosas y porosas, pero absorben agua y se quiebran con las heladas; en formatos grandes son pesadas y frágiles. Madera: cálida pero requiere mantención anual y se pudre en contacto con tierra húmeda.",
        ],
      },
      {
        titulo: "Qué hace que un macetero resista años afuera",
        parrafos: [
          "Tres factores pesan más que el material en sí. Drenaje: el agua estancada que se congela es lo que rompe maceteros; despiche o doble fondo lo evitan. Sellado: una superficie sellada no absorbe agua ni acumula hongos ni sales; nuestros maceteros se entregan sellados y con terminación. Apoyo: un macetero que apoya en un plano firme y nivelado no sufre esfuerzos en la base; en jardín, una base de gravilla o una placa evita el contacto directo con barro.",
        ],
      },
      {
        titulo: "Maceteros resistentes para proyectos comerciales",
        parrafos: [
          "Inmobiliarias, hoteles, restaurantes, municipalidades y retail necesitan maceteros que aguanten tráfico de personas, limpieza frecuente y años sin reposición. El EIFS cumple porque no se decolora, resiste golpes moderados, se repara y se repinta, y su peso permite instalar formatos grandes en accesos, terrazas de edificios y patios de comida sin refuerzo estructural. Fabricamos series de piezas iguales en color y medida para proyectos.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué macetero resiste mejor el sol directo?",
        a: "Los de material mineral: EIFS y hormigón. No se decoloran ni se vuelven frágiles con los rayos UV, a diferencia del plástico y la fibra de vidrio.",
      },
      {
        q: "¿Los maceteros EIFS resisten heladas?",
        a: "Sí, siempre que tengan drenaje. Lo que rompe cualquier macetero en invierno es el agua estancada que se congela; con despiche o doble fondo el EIFS soporta ciclos de hielo y deshielo sin problema.",
      },
      {
        q: "¿Un macetero EIFS se puede reparar si se golpea?",
        a: "Sí. Como la capa exterior es cemento, los golpes superficiales se resanan con mortero fino y se repintan con la misma terminación. Además, todos nuestros maceteros tienen garantía por fallas de fabricación.",
      },
      {
        q: "¿Qué macetero conviene para el acceso de un edificio o un local?",
        a: "Formatos grandes y estables como cubo, RP o redondo, en EIFS, con despiche o doble fondo. Fabricamos series iguales para proyectos de inmobiliarias, hotelería, retail y municipalidades.",
      },
      {
        q: "¿Cuánto duran los maceteros EIFS en exterior?",
        a: "Décadas, con el mismo comportamiento que el EIFS de las fachadas de edificios. El único cuidado es que el agua drene y que la pieza no se arrastre por el suelo.",
      },
    ],
    colecciones: ["cubo", "rp", "redondos", "marroc"],
    relacionadas: ["maceteros-livianos-eifs", "maceteros-premium-de-diseno"],
  },

  {
    slug: "maceteros-premium-de-diseno",
    titulo: "Maceteros premium de diseño: terminaciones, formas y piezas de autor",
    metaTitle: "Maceteros Premium de Diseño en Chile · Terminaciones y Autor | Mundo Macetero",
    metaDescription:
      "Qué distingue a un macetero premium: forma, terminación, proporción y fabricación a pedido. Colecciones Gotar, Gema, Milán, Marroc y maceteros de autor en EIFS, fabricados en Chile.",
    resumen:
      "Un macetero premium se distingue por cuatro cosas: una forma con proporciones cuidadas, una terminación hecha a mano (cemento natural, blanco, negro, cantera u óxido de cobre), un material que envejece bien y una fabricación a pedido en la medida y color exactos del proyecto. Mundo Macetero fabrica maceteros premium con tecnología EIFS en Quilicura, Chile, incluidas colaboraciones de autor en edición limitada.",
    keywords: [
      "maceteros premium",
      "maceteros de diseño",
      "maceteros de lujo",
      "maceteros modernos",
      "maceteros de autor",
      "maceteros de diseño Chile",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "Formas: cada colección resuelve un espacio distinto",
        parrafos: [
          "Gotar: silueta de gota, base angosta y cadera alta, para plantas erguidas donde el envase se ve completo. Gema: caras facetadas que cambian con la luz, para accesos y puntos focales. Milán y Marroc: volúmenes de líneas rectas y textura cantera, pensados para arquitectura contemporánea y hotelería. Cubo: la pieza que se alinea en serie sin espacio muerto, para muros y esquinas. Bowl y copón: formatos bajos y abiertos para composiciones de suculentas, agaves y plantas de porte horizontal. Colonial y vaso: perfiles clásicos para jardines y patios tradicionales.",
        ],
      },
      {
        titulo: "Terminaciones a mano",
        parrafos: [
          "Cemento natural: el gris mineral del material, con sus variaciones de tono, para quien quiere la pieza más honesta. Cemento blanco: luminoso, ideal para plantas de hoja oscura y espacios mediterráneos. Negro: dramatiza el verde y funciona en interiores contemporáneos. Cantera negro y cantera café: textura pétrea con relieve, que esconde el polvo y envejece con carácter. Óxido de cobre: terminación de acento para piezas protagonistas. Cada terminación se aplica a mano pieza por pieza, por eso cada macetero es único y las pequeñas variaciones son parte del carácter del producto.",
        ],
      },
      {
        titulo: "Piezas únicas y maceteros de autor",
        parrafos: [
          "Cada macetero se termina a mano, pieza por pieza, así que no hay dos exactamente iguales: las variaciones de tono y textura son parte del carácter del producto. Además de las colecciones, desarrollamos maceteros de autor en edición limitada y colaboraciones personalizadas para proyectos de arquitectura y paisajismo.",
        ],
      },
      {
        titulo: "Por qué la fabricación a pedido es parte de lo premium",
        parrafos: [
          "Un macetero de catálogo masivo se fabrica en dos o tres medidas y un color. Los nuestros se producen para cada pedido en la combinación de forma, tamaño, terminación y drenaje que el espacio necesita, lo que permite series iguales para un proyecto o una pieza única para un living. Además ofrecemos asesoría gratuita: nos cuentas qué planta tienes y dónde vivirá, o nos mandas una foto del espacio, y te devolvemos una recomendación.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué hace que un macetero sea premium?",
        a: "Proporciones cuidadas, terminación aplicada a mano, un material mineral que envejece bien y la posibilidad de fabricarlo a pedido en la medida y color exactos. No es solo el precio: es el resultado en el espacio a lo largo de los años.",
      },
      {
        q: "¿Tienen maceteros de autor o ediciones limitadas?",
        a: "Sí. Desarrollamos maceteros de autor en edición limitada y colaboraciones personalizadas para proyectos. Y cada macetero de catálogo es único, porque la terminación se aplica a mano.",
      },
      {
        q: "¿Puedo pedir una terminación o color que no está en la tienda?",
        a: "Escríbenos. Para proyectos y series evaluamos terminaciones especiales; para piezas individuales trabajamos con las terminaciones de catálogo, que ya cubren desde el cemento natural hasta el óxido de cobre.",
      },
      {
        q: "¿Los maceteros premium sirven para exterior?",
        a: "Sí. Todas las colecciones son de EIFS sellado, apto para sol, lluvia y heladas, con despiche o doble fondo a pedido.",
      },
      {
        q: "¿Ofrecen asesoría para elegir?",
        a: "Sí, sin costo. Cuéntanos qué planta tienes y dónde vivirá en la página de asesoramiento, o mándanos una foto de tu terraza o living y te la devolvemos con una propuesta de maceteros.",
      },
    ],
    colecciones: ["gotar", "gema", "milan", "marroc"],
    relacionadas: ["maceteros-resistentes-para-exterior", "que-macetero-para-cada-planta"],
  },

  {
    slug: "que-macetero-para-cada-planta",
    titulo: "Qué macetero usar para cada planta: olivo, palmera, ficus, aromáticas y más",
    metaTitle: "Qué Macetero Usar para Cada Planta · Olivo, Palmera, Ficus | Mundo Macetero",
    metaDescription:
      "Tamaño, forma y drenaje recomendados para olivo, limonero, palmera, ficus, suculentas, aromáticas y cercos verdes en macetero. Guía práctica de Mundo Macetero, fabricantes en Chile.",
    resumen:
      "Cada planta pide un macetero distinto: los árboles pequeños como el olivo o el limonero necesitan desde 50 centímetros de lado y buen drenaje; las palmeras, profundidad; las suculentas, formatos bajos y abiertos; las aromáticas y los cercos verdes, jardineras largas. Esta guía resume las medidas y formas que recomendamos en Mundo Macetero después de años de asesorar proyectos residenciales y comerciales en Chile.",
    keywords: [
      "macetero para olivo",
      "macetero para palmera",
      "macetero para limonero",
      "macetero para ficus",
      "maceteros para suculentas",
      "jardinera para aromáticas",
      "qué macetero usar",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "Olivo, limonero y árboles pequeños",
        parrafos: [
          "Necesitan volumen de raíz y drenaje libre. Recomendamos cubo, redondo o RP desde 50 a 60 centímetros para un ejemplar joven y 70 a 80 para uno formado, siempre con despiche y plato de agua o base de gravilla. El olivo prefiere sustrato drenante y sol; el limonero, riego más regular, por lo que el doble fondo es una buena alternativa. En cemento natural o negro el árbol se ve mediterráneo; en blanco, más luminoso. Tenemos una página dedicada al olivo en macetero.",
        ],
      },
      {
        titulo: "Palmeras y plantas de raíz profunda",
        parrafos: [
          "Las palmeras (kentia, fénix, areca) y los dracenas crecen hacia abajo antes que a los lados, así que priorizamos profundidad: Gotar en tallas M y L, cónico o vaso de 55 centímetros hacia arriba. El Gotar, con su base angosta, deja ver la planta completa y aporta altura visual sin ocupar mucho piso.",
        ],
      },
      {
        titulo: "Ficus, monsteras y plantas de interior grandes",
        parrafos: [
          "Van bien en cubos y redondos de 40 a 60 centímetros, sin despiche si están en interior sobre piso delicado, o con plato de agua. Al ser livianos, los maceteros EIFS permiten girar la planta hacia la luz o moverla en la limpieza sin esfuerzo.",
        ],
      },
      {
        titulo: "Suculentas, agaves y composiciones bajas",
        parrafos: [
          "Formatos abiertos y poco profundos: bowl, copón y plato invertido. Permiten componer varias especies, drenan rápido (pídelos con despiche) y se lucen en mesas de terraza, accesos y bordes de piscina. Las piedras decorativas cubren el sustrato y terminan la composición.",
        ],
      },
      {
        titulo: "Aromáticas, hortalizas y cercos verdes",
        parrafos: [
          "Jardineras de 30 centímetros de alto y 100 a 200 de largo. Junto a la cocina, una jardinera de un metro sostiene una hilera de albahaca, romero, tomillo y ciboulette. Para separar terrazas, cerrar un borde de piscina o formar un cerco con bambú, laurel o pittosporum, jardineras de 150 a 200 centímetros en línea, con despiche.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué tamaño de macetero necesita un olivo?",
        a: "Desde 50 a 60 centímetros de lado o diámetro para un olivo joven y 70 a 80 para uno formado, con despiche. Cubo, redondo o RP son los formatos que mejor funcionan.",
      },
      {
        q: "¿Qué macetero conviene para una palmera?",
        a: "Uno profundo: Gotar M o L, cónico o vaso desde 55 centímetros de alto, porque las raíces de palmera crecen hacia abajo.",
      },
      {
        q: "¿Puedo plantar aromáticas en una jardinera EIFS?",
        a: "Sí. Nuestras jardineras de 30 centímetros de alto y 100 a 200 de largo son ideales para aromáticas y hortalizas de hoja; pídelas con despiche y usa sustrato para huerto.",
      },
      {
        q: "¿Qué macetero uso para suculentas y cactus?",
        a: "Formatos bajos y abiertos como bowl, copón o plato invertido, con despiche para que el sustrato drene rápido.",
      },
      {
        q: "¿Me pueden recomendar el macetero para mi planta?",
        a: "Sí, gratis. En la página de asesoramiento nos cuentas qué planta tienes y dónde vivirá, y te recomendamos modelo, medida y terminación dentro de un día hábil.",
      },
    ],
    colecciones: ["cubo", "gotar", "bowl", "jardinera"],
    relacionadas: ["como-elegir-tamano-y-drenaje-de-un-macetero", "maceteros-para-terraza-y-balcon"],
  },

  {
    slug: "como-elegir-tamano-y-drenaje-de-un-macetero",
    titulo: "Cómo elegir el tamaño y el drenaje de un macetero: despiche, doble fondo y plato",
    metaTitle: "Tamaño y Drenaje de un Macetero · Despiche, Doble Fondo y Plato | Mundo Macetero",
    metaDescription:
      "Cómo calcular el tamaño de macetero según la planta y qué sistema de drenaje elegir: despiche, doble fondo o plato de agua. Explicado por los fabricantes de Mundo Macetero.",
    resumen:
      "Para elegir un macetero hay dos decisiones: el tamaño, que se calcula a partir de la altura final de la planta y el volumen de raíz, y el drenaje, que puede ser despiche (perforación en la base), doble fondo (cámara de agua interior) o plato de agua. En Mundo Macetero cada macetero se fabrica a pedido con el sistema de drenaje que el espacio necesita, en interior o exterior.",
    keywords: [
      "tamaño de macetero",
      "macetero con drenaje",
      "macetero sin drenaje",
      "despiche macetero",
      "macetero doble fondo",
      "plato para macetero",
      "cómo elegir un macetero",
    ],
    fechaPublicacion: "2026-08-26",
    secciones: [
      {
        titulo: "Cómo calcular el tamaño",
        parrafos: [
          "Regla general: el lado o diámetro del macetero debe ser al menos un tercio de la altura final de la planta, y la profundidad, similar al diámetro para árboles y mayor para palmeras. Un arbusto de 1,5 metros pide un envase de 50 centímetros; un árbol de 2,5 metros, de 70 a 80. Para plantas bajas manda el ancho de la composición, no la altura. Si dudas entre dos tamaños, elige el mayor: la planta crecerá y un macetero grande EIFS sigue siendo fácil de mover.",
        ],
      },
      {
        titulo: "Despiche: la perforación de drenaje",
        parrafos: [
          "El despiche es el orificio en la base por el que sale el agua sobrante. Es imprescindible en exterior, donde la lluvia puede saturar el sustrato, y para plantas que no toleran el encharcamiento (olivo, suculentas, cítricos). Lo hacemos a pedido en la fabricación, así que indícalo al comprar. En exterior se combina con una base de gravilla o con un plato de agua para no manchar el piso.",
        ],
      },
      {
        titulo: "Doble fondo: reserva de agua y piso limpio",
        parrafos: [
          "El doble fondo es una placa interior que separa el sustrato de una cámara en la base del macetero. El agua sobrante baja a la cámara en vez de salir hacia afuera y la planta la toma por capilaridad. Ventajas: el macetero no drena al piso, el riego se espacia y la planta tolera mejor una semana sin atención. Es la mejor opción para balcones sobre vecinos, interiores y proyectos comerciales con mantención esporádica. Está disponible en varios modelos como opción de fabricación.",
        ],
      },
      {
        titulo: "Plato de agua: la solución clásica",
        parrafos: [
          "El plato de agua es una base del mismo material y terminación que recibe el agua del despiche. Sirve para interior sobre piso de madera o porcelanato y para terrazas donde el agua no puede correr. Fabricamos platos de agua a juego con los maceteros y también el plato invertido, que funciona como pedestal bajo para elevar la pieza.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Los maceteros vienen con agujero de drenaje?",
        a: "Se fabrican con o sin despiche según lo que elijas al comprar. Para exterior y plantas sensibles al exceso de agua recomendamos con despiche; para interior, sin despiche o con plato de agua.",
      },
      {
        q: "¿Qué es el doble fondo de un macetero?",
        a: "Una placa interior que crea una cámara de reserva de agua en la base. El macetero no drena hacia afuera y la planta toma el agua por capilaridad, lo que espacia el riego y mantiene el piso limpio.",
      },
      {
        q: "¿Puedo usar un macetero sin despiche en exterior?",
        a: "Solo bajo techo o con doble fondo. A la intemperie, la lluvia acumulada sin salida daña la planta y, en invierno, el agua congelada puede dañar cualquier macetero.",
      },
      {
        q: "¿Qué tamaño de macetero elijo si dudo entre dos?",
        a: "El mayor. La planta va a crecer, el sustrato extra retiene más humedad y un macetero grande EIFS sigue siendo liviano para moverlo.",
      },
      {
        q: "¿Venden platos a juego con los maceteros?",
        a: "Sí. Fabricamos platos de agua en el mismo material y terminación, y el plato invertido que sirve como base o pedestal bajo.",
      },
    ],
    colecciones: ["plato-de-agua", "plato-invertido", "cubo", "redondos"],
    relacionadas: ["que-macetero-para-cada-planta", "maceteros-para-terraza-y-balcon"],
  },
];

export const GUIAS_BY_SLUG: Record<string, Guia> = Object.fromEntries(GUIAS.map((g) => [g.slug, g]));

// Collection intros keyed by category slug. `intro` is rendered under the H1 on
// /tienda/<slug>; `metaDescription` feeds the page metadata. Unknown slugs fall
// back to the generic entry.
export type ColeccionCopy = { h1?: string; intro: string; metaDescription: string };

export const COLECCIONES: Record<string, ColeccionCopy> = {
  bowl: {
    h1: "Maceteros Bowl",
    intro:
      "El Bowl es un macetero bajo y abierto, de boca ancha, pensado para composiciones de suculentas, agaves y plantas de porte horizontal. Con tecnología EIFS, pesa cerca de 90% menos que uno de cemento, así que se puede usar sobre mesas de terraza, accesos y bordes de piscina. Disponible en cemento natural, negro y cantera, con o sin despiche.",
    metaDescription:
      "Maceteros Bowl EIFS livianos para suculentas y composiciones bajas. Formato abierto, apto para exterior, fabricado a pedido en Chile.",
  },
  colonial: {
    h1: "Maceteros Colonial",
    intro:
      "El Colonial recupera el perfil clásico del macetero de patio chileno, con borde marcado y cuerpo abombado, fabricado en EIFS liviano para que un formato grande se pueda mover sin ayuda. Funciona en jardines tradicionales, corredores y accesos, en cemento natural o terminaciones de color.",
    metaDescription:
      "Maceteros Colonial EIFS livianos: perfil clásico para patios y jardines, resistente al exterior, fabricado a pedido en Quilicura, Chile.",
  },
  conico: {
    h1: "Maceteros Cónicos",
    intro:
      "El Cónico es el formato de altura por excelencia: base más angosta que la boca, líneas rectas y mucha presencia vertical con poco piso ocupado. Ideal para palmeras, dracenas y plantas erguidas en terrazas y accesos. Con tecnología EIFS resiste sol, lluvia y heladas con una fracción del peso del cemento.",
    metaDescription:
      "Maceteros cónicos EIFS livianos para palmeras y plantas erguidas. Altura y estabilidad para terrazas y accesos. Fabricados en Chile.",
  },
  copon: {
    h1: "Maceteros Copón",
    intro:
      "El Copón es un formato de copa abierta sobre pie, que eleva la composición y la separa del suelo. Se usa para suculentas, flores de temporada y arreglos bajos en accesos, patios y hotelería. EIFS liviano, terminaciones a mano, con o sin despiche.",
    metaDescription:
      "Maceteros Copón EIFS: copa abierta sobre pie para composiciones bajas en accesos y patios. Livianos y resistentes al exterior.",
  },
  cubo: {
    h1: "Maceteros Cubo",
    intro:
      "El Cubo es el macetero de caras rectas, de 40 a 120 centímetros de lado, en cemento natural o negro y con o sin despiche. Es el formato que mejor calza contra un muro o en una esquina y el único que se alinea en serie sin dejar espacio entre piezas. Con tecnología EIFS pesa cerca de 90% menos que un cubo de cemento, por lo que incluso las medidas grandes se instalan en terrazas y balcones.",
    metaDescription:
      "Maceteros cubo EIFS livianos de 40 a 120 cm. Se alinean en serie, resisten exterior y pesan 90% menos que el cemento. Fabricados en Chile.",
  },
  gema: {
    h1: "Maceteros Gema",
    intro:
      "El Gema tiene caras facetadas que cambian de tono con la luz, como una piedra tallada. Es una pieza protagonista para accesos, halls y terrazas contemporáneas, en EIFS liviano con terminaciones cemento, negro y cantera. Se fabrica a pedido con o sin despiche.",
    metaDescription:
      "Maceteros Gema EIFS: caras facetadas de diseño para accesos y terrazas contemporáneas. Livianos, resistentes y fabricados en Chile.",
  },
  gotar: {
    h1: "Maceteros Gotar",
    intro:
      "El Gotar tiene silueta de gota, base angosta y cadera alta, en tallas S a L y cuatro terminaciones que van del cemento blanco al cantera negro. Es un macetero para planta erguida, donde la forma del envase se ve completa. Con tecnología EIFS pesa cerca de 90% menos que un macetero de cemento del mismo tamaño, algo que se agradece en piezas de 55 centímetros hacia arriba.",
    metaDescription:
      "Maceteros Gotar EIFS: silueta de gota, tallas S a L, cuatro terminaciones. Livianos, para palmeras y plantas erguidas. Fabricados en Chile.",
  },
  jardinera: {
    h1: "Jardineras",
    intro:
      "Jardineras de 30 centímetros de alto y 100 a 200 centímetros de largo para plantar en hilera: cercos verdes, separación de terrazas, borde de piscina o una línea de aromáticas junto a la cocina. Al ser de EIFS, una jardinera larga sigue siendo manejable, con cerca de 90% menos peso que su equivalente en cemento, y se monta sobre deck, losa o balcón sin cálculo estructural.",
    metaDescription:
      "Jardineras EIFS livianas de 100 a 200 cm para cercos verdes, terrazas y aromáticas. 90% más livianas que el cemento. Fabricadas en Chile.",
  },
  macetero: {
    h1: "Maceteros",
    intro:
      "Maceteros ultra livianos fabricados con tecnología EIFS (poliestireno expandido, malla de fibra de vidrio y recubrimiento de cemento), a pedido en Quilicura, Santiago. Tienen el aspecto y la textura del cemento con cerca de 90% menos peso, resisten sol, lluvia y heladas, y se producen en la forma, tamaño, terminación y drenaje que tu espacio necesita.",
    metaDescription:
      "Maceteros EIFS ultra livianos para interior y exterior, fabricados a pedido en Chile. Tipo cemento, 90% más livianos, resistentes al clima.",
  },
  marroc: {
    h1: "Maceteros Marroc",
    intro:
      "El Marroc combina volumen recto con textura cantera y terminación óxido de cobre, pensado para arquitectura contemporánea, hotelería y proyectos donde el macetero es parte del diseño. EIFS liviano, apto para exterior, fabricado a pedido.",
    metaDescription:
      "Maceteros Marroc EIFS con textura cantera y óxido de cobre. Diseño contemporáneo para hotelería y arquitectura. Fabricados en Chile.",
  },
  milan: {
    h1: "Maceteros Milán",
    intro:
      "El Milán es un macetero de líneas rectas y proporciones altas para espacios contemporáneos: halls, terrazas de edificio, restaurantes. Con tecnología EIFS, resiste el exterior y se mueve sin esfuerzo, con terminaciones cemento, blanco, negro y cantera.",
    metaDescription:
      "Maceteros Milán EIFS livianos: líneas rectas y proporciones altas para espacios contemporáneos. Resistentes al exterior, fabricados en Chile.",
  },
  piedras: {
    h1: "Piedras decorativas",
    intro:
      "Piedras decorativas para cubrir el sustrato de tus maceteros y jardineras: terminan la composición, reducen la evaporación y evitan que la tierra salpique al regar. Complemento ideal para bowls, copones y cubos.",
    metaDescription:
      "Piedras decorativas para maceteros y jardineras: cubren el sustrato, reducen la evaporación y terminan la composición. Mundo Macetero, Chile.",
  },
  "plato-de-agua": {
    h1: "Platos de agua",
    intro:
      "Platos de agua EIFS a juego con los maceteros: reciben el agua del despiche y protegen pisos de madera, porcelanato y terrazas sobre vecinos. Misma terminación que el macetero para que la pieza se lea completa.",
    metaDescription:
      "Platos de agua EIFS a juego con los maceteros Mundo Macetero. Protegen el piso y recogen el drenaje. Fabricados en Chile.",
  },
  "plato-invertido": {
    h1: "Platos invertidos",
    intro:
      "El plato invertido es una base o pedestal bajo del mismo material que eleva el macetero, mejora el drenaje al separarlo del suelo y le da presencia en accesos y terrazas. Combina con cubos, redondos y Gotar.",
    metaDescription:
      "Platos invertidos EIFS: base o pedestal para elevar el macetero, mejorar el drenaje y dar presencia. Mundo Macetero, Chile.",
  },
  redondos: {
    h1: "Maceteros Redondos",
    intro:
      "Maceteros redondos EIFS livianos, el formato más versátil para olivos, ficus, arbustos y composiciones en jardín, terraza e interior. Base ancha y estable frente al viento, en cemento natural, blanco, negro y cantera, con o sin despiche.",
    metaDescription:
      "Maceteros redondos EIFS livianos para olivos, ficus y arbustos. Estables, resistentes al exterior y 90% más livianos que el cemento.",
  },
  rp: {
    h1: "Maceteros RP",
    intro:
      "La línea RP es un formato de gran diámetro y proporción sólida para árboles en macetero, accesos de edificios y proyectos comerciales. Con tecnología EIFS, permite instalar volúmenes grandes sin refuerzo estructural y moverlos cuando el proyecto cambia.",
    metaDescription:
      "Maceteros RP EIFS: gran formato para árboles, accesos y proyectos comerciales. Livianos, resistentes y fabricados a pedido en Chile.",
  },
  vaso: {
    h1: "Maceteros Vaso",
    intro:
      "El Vaso es un macetero alto de perfil clásico, más ancho en la boca que en la base, para palmeras, plantas erguidas y composiciones verticales en patios y terrazas. EIFS liviano, terminaciones a mano, con o sin despiche.",
    metaDescription:
      "Maceteros Vaso EIFS livianos: formato alto clásico para palmeras y plantas erguidas. Resistentes al exterior, fabricados en Chile.",
  },
};

export const COLECCION_GENERICA: ColeccionCopy = {
  intro:
    "Maceteros con tecnología EIFS ultra livianos, fabricados a pedido en Quilicura, Chile. Aspecto de cemento, cerca de 90% menos peso, resistentes a sol, lluvia y heladas.",
  metaDescription:
    "Maceteros EIFS ultra livianos fabricados a pedido en Chile. Tipo cemento, resistentes al exterior, para terraza, jardín e interior.",
};

// Site-wide FAQ: /preguntas-frecuentes and (first 6) the home page.
export const FAQ_GENERAL: Faq[] = [
  {
    q: "¿De qué material son los maceteros de Mundo Macetero?",
    a: "Con tecnología EIFS, la misma que se usa en fachadas de construcción: núcleo de poliestireno expandido, malla de fibra de vidrio y recubrimiento de cemento con terminación de color o textura. Tienen el aspecto y la textura del cemento, pero pesan cerca de 90% menos que un macetero de hormigón del mismo tamaño.",
  },
  {
    q: "¿Los maceteros sirven para exterior?",
    a: "Sí. El EIFS es un sistema de fachadas y resiste sol, lluvia y heladas. Para exterior recomendamos pedirlos con despiche (perforación de drenaje) o con doble fondo, para que el agua no quede estancada.",
  },
  {
    q: "¿Dónde se fabrican y dónde puedo verlos?",
    a: "Se fabrican a pedido en nuestro taller de Las Esteras Norte 2610, Galpón 16, Quilicura, Santiago. Puedes visitarnos de lunes a viernes de 8:30 a 18:00 y retirar tu pedido ahí sin costo.",
  },
  {
    q: "¿Cuánto cuesta el despacho?",
    a: "Es gratis en las comunas del sector oriente de Santiago: Las Condes, Vitacura, Lo Barnechea, Providencia, La Reina, Ñuñoa y Peñalolén. Para el resto de la Región Metropolitana y otras regiones se cotiza con un transportista externo y se coordina contigo después de la compra. El retiro en tienda es siempre gratis.",
  },
  {
    q: "¿Cuánto demora un pedido?",
    a: "Muchos maceteros se fabrican a pedido en la combinación de tamaño, color y drenaje que eliges. Al confirmar la compra te informamos el plazo de fabricación y la fecha estimada de entrega o retiro.",
  },
  {
    q: "¿Puedo pedir el macetero con o sin agujero de drenaje?",
    a: "Sí. El despiche se hace a pedido: indícalo al comprar. También ofrecemos doble fondo en varios modelos y platos de agua a juego.",
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "Tarjetas de crédito, débito y prepago a través de Mercado Pago, y transferencia bancaria coordinada con nuestro equipo. Todos los precios están en pesos chilenos e incluyen IVA.",
  },
  {
    q: "¿Tienen garantía?",
    a: "Sí. Todos los maceteros tienen garantía por fallas de fabricación: si llega dañado o presenta una falla, lo reponemos o reparamos sin costo. No cubre golpes, mal uso o instalación inadecuada.",
  },
  {
    q: "¿Venden a empresas y proyectos?",
    a: "Sí. Trabajamos con inmobiliarias, constructoras, paisajistas, hotelería, municipalidades y retail, fabricando series iguales en medida y terminación. Emitimos factura con los datos de la empresa.",
  },
  {
    q: "¿Me ayudan a elegir el macetero para mi planta o mi espacio?",
    a: "Sí, sin costo. En la página de asesoramiento nos cuentas qué planta tienes y dónde vivirá, o en Tu espacio nos mandas una foto de tu terraza o living y te la devolvemos con una propuesta de maceteros.",
  },
];
