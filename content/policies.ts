// Políticas de la tienda, copiadas literalmente desde mundomacetero.cl
// (/policies/*). Son texto legal del comercio: no se editan aquí. Si cambian en
// la tienda, se vuelven a copiar tal cual.
//
// Dos diferencias respecto de lo publicado hoy en Shopify, ambas a confirmar allá:
//   - El párrafo de "Costo de Envío" decía "gratis en toda la RM" y "$9.990 a otras
//     regiones". La regla real es: gratis solo en el sector oriente, el resto se
//     cotiza con un transportista externo. Aquí queda la regla real, que es la que
//     además aplica el checkout.
//   - "Condiciones de venta y pago" menciona Mercado Pago; este sitio cobra con Flow.

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
      "Costo de Envío: Los envíos solo aplican para compras online. El despacho es gratuito en las comunas del sector oriente de Santiago. Para el resto de la Región Metropolitana y otras regiones, el despacho se cotiza con un transportista externo y se coordina contigo después de la compra.",
      "En caso de aplicar costo de envío, este servicio es con cargo al cliente.",
      "Área de Cobertura: Actualmente, ofrecemos envíos solamente dentro de Chile. Nuestros servicios de entrega cubren principalmente alguna comunas de la RM. Si deseas realizar un pedido desde otra región, te recomendamos que te pongas en contacto con nosotros directamente para gestionar la entrega mediante un tercero.",
      "Método de Envío: Utilizamos servicios de envío propios y de terceros, según lo que consideremos más conveniente internamente para cada caso.",
      "Tiempo de Entrega: El tiempo de entrega estimado para nuestros maceteros es de 15 días hábiles en promedio.",
      "Responsabilidad por Productos Dañados o Perdidos: Nos hacemos responsables de entregar nuestros maceteros en óptimas condiciones al cliente final. Si tu pedido llega dañado o no llega en absoluto, por favor contáctanos para resolver el problema.",
      "Información de Envío Incorrecta o Incompleta: El cliente es responsable de proporcionar la información correcta y completa de la dirección de envío. No podemos hacernos responsables por entregas fallidas o demoras causadas por direcciones incorrectas o incompletas. Sin embargo, siempre intentaremos confirmar la dirección de envío antes de realizar la entrega.",
      "Si tienes alguna pregunta o inquietud sobre nuestra política de envíos, no dudes en contactarnos. Estamos aquí para ayudarte y garantizar que tu experiencia de compra sea lo más satisfactoria posible.",
    ],
  },
  {
    slug: "reembolso",
    titulo: "Política de reembolso",
    parrafos: [
      "Plazo para Solicitar Reembolsos o Cambios: Los clientes tienen 5 días desde la recepción del producto para solicitar un cambio.",
      "Condiciones del Producto: Para ser elegible para un reembolso o cambio, el producto debe estar en perfectas condiciones y sin ningún defecto. No es necesario que se mantenga en su empaque original, pero el producto no debe presentar ningún tipo de daño.",
      "Productos Elegibles: Todos nuestros maceteros son elegibles para reembolso o cambio.",
      "Responsabilidad de Gastos de Envío: El comprador es responsable de los gastos de envío para devolver el producto y cambiarlo por uno nuevo. El cambio se realizará solo si el producto devuelto está en perfectas condiciones.",
      "Proceso para Solicitar Reembolsos o Cambios: Para solicitar un reembolso o cambio, ponte en contacto con nuestro equipo de atención al cliente a través de cualquier medio. Recomendamos llamar por teléfono o enviarnos un correo electrónico a mundo@mundomacetero.cl.",
      "Tiempo de Procesamiento de Reembolsos: Los reembolsos se procesarán en un máximo de 2 días hábiles, siempre y cuando el proceso de devolución y verificación del producto esté totalmente en orden.",
      "Si tienes alguna pregunta o inquietud sobre nuestra política de reembolsos, no dudes en contactarnos. Estamos aquí para ayudarte y garantizar que tu experiencia de compra sea lo más satisfactoria posible.",
    ],
  },
  {
    slug: "privacidad",
    titulo: "Política de privacidad",
    parrafos: [
      "La presente política de privacidad establece las prácticas de Mundo Macetero en relación con la recolección, uso y protección de la información personal de los usuarios en nuestro sitio web.",
      "Tipos de información personal recolectada: En Mundo Macetero, obtenemos información de contacto de los usuarios, como nombre, dirección de correo electrónico y número de teléfono, únicamente cuando éstos realizan un pedido en nuestra tienda o nos proporcionan dicha información de forma proactiva a través del chat de atención al cliente.",
      "Procedimientos de recolección de información: La información de los usuarios es recolectada mediante formularios de compra y chats en nuestro sitio web.",
      "Finalidad del uso de la información recolectada: La información recolectada es empleada con el propósito de procesar pedidos y ofrecer una atención al cliente de calidad. En un futuro, podríamos utilizar dicha información para enviar a nuestros clientes ofertas y promociones exclusivas.",
      "No compartimos información con terceros: Mundo Macetero se compromete a no compartir la información personal de los usuarios con terceros.",
      "Medidas de protección de la información de los usuarios: Nos esforzamos por garantizar la seguridad y confidencialidad de la información de los usuarios, implementando las medidas de protección proporcionadas por la plataforma Shopify y nuestras rigurosas políticas internas de confidencialidad.",
      "Modificación o eliminación de información personal: Los usuarios tienen derecho a solicitar la actualización, corrección o eliminación de su información personal. Para ello, pueden ponerse en contacto con nosotros y tomaremos las acciones necesarias para atender su solicitud.",
      "Si tiene alguna pregunta o inquietud acerca de nuestra política de privacidad, no dude en ponerse en contacto con nosotros. Nuestro compromiso es garantizar que su experiencia de compra sea segura y satisfactoria.",
    ],
  },
  {
    slug: "terminos",
    titulo: "Términos del servicio",
    parrafos: [
      "La presente sección establece los términos y condiciones bajo los cuales Mundo Macetero ofrece sus productos y servicios a los usuarios a través de su sitio web. Al realizar una compra en nuestra tienda, usted acepta cumplir con estos términos de servicio.",
      "Condiciones de venta y pago: Mundo Macetero acepta todos los pedidos que hayan sido pagados. Aceptamos todos los medios de pago disponibles a través de Mercado Pago, incluyendo tarjetas de crédito y débito. Al realizar un pedido, el cliente confirma que es el titular de la tarjeta de crédito o débito utilizada para la transacción.",
      "Garantía de satisfacción: En Mundo Macetero nuestro objetivo es garantizar que nuestros clientes estén satisfechos con los productos adquiridos. Si no estás satisfecho con tu compra, por favor ponte en contacto con nosotros para discutir tus preocupaciones y encontrar una solución adecuada.",
      "Uso y manipulación adecuada de los productos: Los productos ofrecidos por Mundo Macetero deben ser utilizados y manipulados con cuidado y de acuerdo con las instrucciones proporcionadas. No nos hacemos responsables de los daños o pérdidas resultantes del uso indebido o negligente de nuestros productos.",
      "Políticas de cancelación de pedidos y devoluciones: Por favor, consulta nuestra política de reembolso y la política de envíos para obtener información detallada sobre estos temas.",
      "Responsabilidad: Mundo Macetero no asume ninguna responsabilidad por daños o pérdidas causadas por el uso inadecuado de nuestros productos. Al realizar una compra, el cliente acepta utilizar los productos de acuerdo con las instrucciones proporcionadas y asume la responsabilidad de cualquier daño o pérdida resultante del incumplimiento de estas instrucciones.",
      "Legislación aplicable y jurisdicción: Estos términos de servicio se rigen e interpretan de acuerdo con las leyes de Chile. Cualquier disputa relacionada con estos términos de servicio estará sujeta a la jurisdicción exclusiva de los tribunales de Chile.",
      "Si tiene alguna pregunta o inquietud acerca de nuestros términos de servicio, no dude en ponerse en contacto con nosotros. Estamos aquí para ayudarte y garantizar que tu experiencia de compra sea lo más satisfactoria posible.",
    ],
  },
];
