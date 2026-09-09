// Políticas de la tienda, escritas para reflejar la operación real de Mundo
// Macetero (retiro gratis en Quilicura, despacho gratis solo en el sector
// oriente, resto cotizado con transportista externo, pago con Mercado Pago o
// transferencia, boleta/factura manual). Reemplazan el texto heredado del
// Shopify antiguo, que prometía condiciones de envío y medios de pago que no
// son los que aplica esta tienda. El Shopify viejo no se corrige desde aquí.
//
// Formato: texto plano. app/(tienda)/politicas/page.tsx renderiza cada párrafo
// en un <p>, sin HTML ni markdown.

import { ENVIO } from "./site";

export interface Politica {
  slug: string;
  titulo: string;
  parrafos: string[];
}

export const POLITICAS: Politica[] = [
  {
    slug: "envio",
    titulo: "Política de envío",
    parrafos: [
      "Retiro en tienda, gratis: Puedes retirar tu pedido sin costo en Las Esteras Norte 2610, Galpón 16, Quilicura, de lunes a viernes de 8:30 a 18:00. Te avisamos por correo o teléfono cuando tu pedido esté listo para retirar.",
      // Las comunas se nombran una por una y salen de ENVIO, la misma lista que
      // usa lib/pricing.ts para calcular el total: la política, la ficha y el
      // checkout no pueden decir cosas distintas.
      `Despacho gratis en el sector oriente de Santiago: El despacho es gratuito en ${ENVIO.comunasOriente.join(", ")}. No tienes que pagar nada adicional por la entrega.`,
      "Resto de la Región Metropolitana y otras regiones: El despacho se cotiza con un transportista externo y lo coordinamos contigo después de la compra. El valor depende de la dirección, del tamaño y de la cantidad de maceteros, y se paga aparte de la compra online. Si el costo no te acomoda, puedes optar por el retiro en tienda o cancelar el pedido y te devolvemos el total.",
      "Cobertura: Solo despachamos dentro de Chile.",
      "Plazos: Muchos de nuestros maceteros se fabrican a pedido según el tamaño y el color que elijas. Al confirmar tu compra te informamos el plazo de fabricación y la fecha estimada de entrega o retiro.",
      "Datos de entrega: Necesitamos que la dirección, el teléfono y el correo estén correctos y completos para poder coordinar la entrega. Si algún dato falta o está equivocado, te contactamos antes de despachar.",
      "Productos dañados en el traslado: Entregamos los maceteros en óptimas condiciones. Si tu pedido llega dañado, escríbenos a mundo@mundomacetero.cl o llámanos al +56 9 92891754 lo antes posible y lo resolvemos contigo.",
    ],
  },
  {
    slug: "reembolso",
    titulo: "Política de reembolso",
    parrafos: [
      "Cancelación antes de la entrega: Si cancelas tu pedido antes de que sea despachado o retirado, te devolvemos el total pagado por el mismo medio de pago que usaste. Para cancelar, escríbenos a mundo@mundomacetero.cl o llámanos al +56 9 92891754.",
      "Derecho de retracto: En las compras hechas por este sitio tienes derecho a retractarte dentro de los 10 días corridos desde que recibes el producto, según la Ley 19.496 sobre protección de los derechos de los consumidores. El macetero debe estar sin uso y en su embalaje original.",
      "Productos hechos a pedido: La ley excluye del retracto los productos fabricados a medida o según las especificaciones del cliente. Nuestros maceteros se fabrican a pedido en la combinación de tamaño y color que eliges, y con las perforaciones de drenaje que nos pidas, así que esa excepción aplica a la mayoría de nuestros productos. Aun así, si tu compra no resultó como esperabas, escríbenos: preferimos buscar una solución contigo antes que ampararnos en la excepción.",
      "Garantía: Todos nuestros maceteros tienen garantía. Si el producto llega dañado o presenta una falla de fabricación, lo reponemos o lo reparamos sin costo para ti. La garantía no cubre daños por golpes, mal uso o instalación inadecuada.",
      "Costos de devolución: Si la devolución es por una falla nuestra o por un error en el pedido, el retiro corre por nuestra cuenta. En un retracto, el costo de devolver el producto a nuestra bodega es del cliente.",
      "Plazo del reembolso: Una vez que revisamos el producto devuelto, procesamos el reembolso por el mismo medio de pago. Cuando pagaste con tarjeta, el reflejo en tu estado de cuenta depende de los plazos de tu banco o de Mercado Pago.",
      "Si tienes dudas sobre esta política, escríbenos y te ayudamos.",
    ],
  },
  {
    slug: "privacidad",
    titulo: "Política de privacidad",
    parrafos: [
      "Esta política explica qué datos personales recibimos en mundomacetero.cl, para qué los usamos y cómo puedes pedir que los eliminemos.",
      "Qué datos pedimos: Tu nombre, correo electrónico, teléfono y dirección de entrega. Los pedimos en el formulario de compra y, si nos escribes, en el canal que uses para contactarnos.",
      "Para qué los usamos: Solo para procesar tu pedido, coordinar la entrega o el retiro, emitir tu boleta o factura, enviarte los correos de la compra (confirmación y estado del pedido) y responder tus consultas.",
      "Con quién los compartimos: No vendemos ni arrendamos tus datos, y no los compartimos con terceros para publicidad. Compartimos únicamente lo necesario con los proveedores que hacen posible la compra: la pasarela de pago que procesa la transacción y el transportista que realiza la entrega.",
      "Datos de pago: Los pagos con tarjeta se procesan íntegramente en la plataforma de Mercado Pago. Nunca vemos ni guardamos el número de tu tarjeta.",
      "Eliminación y corrección: Puedes pedirnos en cualquier momento que corrijamos o eliminemos tus datos escribiendo a mundo@mundomacetero.cl. Cumplimos la solicitud salvo que la ley nos obligue a conservar algo, como los documentos tributarios de una compra ya emitida.",
      "Seguridad: Guardamos la información en sistemas con acceso restringido a las personas del equipo que necesitan verla para preparar y entregar tu pedido.",
    ],
  },
  {
    slug: "terminos",
    titulo: "Términos del servicio",
    parrafos: [
      "Mundo Macetero vende maceteros con tecnología EIFS ultra livianos, fabricados en Chile. Esta tienda online es nuestro canal de venta directa. Al comprar aquí aceptas estos términos.",
      "Productos: Nuestros maceteros son livianos, resistentes al exterior y están disponibles en distintos tamaños, formas y colores. Si necesitas perforaciones de drenaje, las hacemos a pedido: indícalo al momento de comprar o escríbenos.",
      "Precios: Todos los precios están en pesos chilenos (CLP) e incluyen IVA. El precio publicado no incluye el costo de despacho cuando corresponde cotizarlo, según lo indicado en nuestra política de envío.",
      "Medios de pago: Aceptamos tarjetas de crédito, débito y prepago a través de Mercado Pago, y transferencia bancaria coordinada con nuestro equipo. Al pagar con tarjeta, confirmas que eres el titular o que estás autorizado a usarla.",
      "Boleta o factura: Emitimos el documento tributario de forma manual y lo entregamos junto con el producto. Si necesitas factura, indícanos los datos de la empresa (razón social, RUT, giro y dirección) al momento de la compra.",
      "Plazos de fabricación: Un pedido queda confirmado cuando el pago está acreditado. Como buena parte de nuestros maceteros se fabrica a pedido en la combinación de tamaño y color que eliges, el plazo de fabricación lo coordinamos contigo después de la compra y te informamos la fecha estimada de entrega o retiro.",
      "Entrega y retiro: Las condiciones de despacho gratuito, de despacho cotizado y de retiro en tienda están detalladas en nuestra política de envío.",
      "Garantía: Nuestros maceteros tienen garantía por fallas de fabricación. Las condiciones, los plazos de retracto y el proceso de devolución están en nuestra política de reembolso.",
      "Uso del producto: Los maceteros deben usarse e instalarse con cuidado. No respondemos por daños derivados de golpes, sobrecarga, traslados mal hechos o instalaciones que no consideren el peso del macetero con tierra y plantas.",
      "Disponibilidad: Trabajamos para mantener el catálogo y el stock actualizados. Si un producto que compraste no está disponible, te contactamos para ofrecerte una alternativa o devolverte el total pagado.",
      "Ley aplicable: Estos términos se rigen por la ley chilena, incluida la Ley 19.496 sobre protección de los derechos de los consumidores. Cualquier controversia se somete a los tribunales de Chile.",
      "Contacto: mundo@mundomacetero.cl o +56 9 92891754, de lunes a viernes de 8:30 a 18:00.",
    ],
  },
];
