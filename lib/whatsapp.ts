// lib/whatsapp.ts — un solo lugar donde se arman los enlaces de WhatsApp.
//
// El botón flotante ya existía con un mensaje fijo. Cuando el contacto nace en
// una ficha, en el carrito o dentro del checkout, el mensaje lleva de qué se
// está hablando: así el vendedor no tiene que preguntar "¿qué macetero viste?",
// que es justo la fricción que hace que el cliente no escriba.
//
// El número es el de ventas (TIENDA.whatsappVentasNumero), el mismo del botón
// flotante. No hay un segundo número ni un segundo botón.

import { TIENDA } from "../content/site";

const SALUDO = "¡Hola! Los vi en mundomacetero.cl";

export interface ContextoWhatsapp {
  // Nombre del producto, tal como se lee en la ficha.
  producto?: string | null;
  // Tamaño/forma elegidos, y terminación si ya la eligió.
  variante?: string | null;
  terminacion?: string | null;
  // Qué quiere resolver, en una frase ya escrita por nosotros.
  pregunta?: string | null;
}

/**
 * Enlace wa.me con el mensaje ya escrito. Sin contexto devuelve el mensaje
 * general, que es el mismo que usaba el botón flotante.
 */
export function linkWhatsapp(ctx: ContextoWhatsapp = {}): string {
  const partes: string[] = [SALUDO];

  if (ctx.producto) {
    const detalle = [ctx.variante, ctx.terminacion].filter(Boolean).join(", ");
    partes.push(detalle ? `Estoy viendo el ${ctx.producto} (${detalle}).` : `Estoy viendo el ${ctx.producto}.`);
  }

  partes.push(ctx.pregunta ?? "Quiero hacer una consulta antes de comprar.");

  const texto = partes.join(" ");
  return `https://wa.me/${TIENDA.whatsappVentasNumero}?text=${encodeURIComponent(texto)}`;
}

// Las preguntas ya escritas que ofrecemos, para no dejar al cliente frente a un
// campo de texto en blanco. Las claves son las mismas que los motivos de duda
// del modal de abandono, así el mensaje calza con lo que acaba de responder.
export const PREGUNTAS: Record<string, string> = {
  producto: "Tengo una duda sobre el producto: medida, terminación y con qué planta funciona.",
  despacho: "Tengo una duda sobre el despacho a mi dirección.",
  pago: "Tengo una duda sobre las formas de pago.",
  otra: "Tengo una duda antes de completar mi compra.",
  asesoria: "Quiero que me ayuden a elegir la medida y la terminación.",
};
