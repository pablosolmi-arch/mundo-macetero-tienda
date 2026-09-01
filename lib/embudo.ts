// lib/embudo.ts — los pasos del embudo y su lectura, sin nada de presentación.
//
// Vive aparte del componente para poder probarlo solo: la frase que se muestra
// bajo el embudo es una conclusión sobre los datos, y conviene tenerla cubierta.

export interface PasoEmbudo {
  nombre: string;
  // Nombre corto para la frase de lectura ("entre Carrito y Checkout").
  corto: string;
  sesiones: number;
}

export interface CifrasEmbudo {
  visitas: number;
  fichas: number;
  carritos: number;
  checkouts: number;
  pagos: number;
}

export function pasosDelEmbudo(embudo: CifrasEmbudo): PasoEmbudo[] {
  return [
    { nombre: "Visitas", corto: "Visitas", sesiones: embudo.visitas },
    { nombre: "Vieron una ficha", corto: "Ficha", sesiones: embudo.fichas },
    { nombre: "Agregaron al carrito", corto: "Carrito", sesiones: embudo.carritos },
    { nombre: "Iniciaron el pago", corto: "Checkout", sesiones: embudo.checkouts },
    { nombre: "Pagaron", corto: "Pago", sesiones: embudo.pagos },
  ];
}

// Dónde está el mayor salto de pérdida, en una frase. Solo el dato: qué hacer
// con eso lo decide quien lo lee, así que acá no van recomendaciones.
//
// Devuelve null cuando no hay nada que leer: sin visitas, o cuando ningún paso
// pierde gente.
export function lecturaDelEmbudo(pasos: PasoEmbudo[]): string | null {
  let peor: { desde: PasoEmbudo; hasta: PasoEmbudo; caida: number } | null = null;
  for (let i = 1; i < pasos.length; i++) {
    const previo = pasos[i - 1];
    if (previo.sesiones === 0) continue;
    const caida = 1 - pasos[i].sesiones / previo.sesiones;
    if (!peor || caida > peor.caida) peor = { desde: previo, hasta: pasos[i], caida };
  }
  if (!peor || peor.caida <= 0) return null;
  return `El mayor salto de pérdida está entre ${peor.desde.corto} y ${peor.hasta.corto}: se van ${Math.round(peor.caida * 100)} de cada 100.`;
}
