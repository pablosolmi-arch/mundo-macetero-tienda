// content/valor.ts — la propuesta de valor, en un solo lugar.
//
// La ficha, el carrito y el checkout dicen lo MISMO sobre por qué el producto es
// distinto. Antes cada pantalla tenía su propia frase suelta y se contradecían.
//
// REGLA: acá solo entran datos que el proyecto ya publica y que el taller
// respalda (ver content/material.ts y las cifras del hero en content/site.ts).
// Las dos cifras son "hasta": 90% más liviano que el hormigón y hasta 40% menos
// agua por ser térmico. No se redondean hacia arriba (confirmado por Pablo el
// 9-sep-2026: la forma correcta es "necesita hasta 40% menos agua").

export interface Ventaja {
  // Cifra o palabra corta que se lee primero.
  destacado: string;
  titulo: string;
  detalle: string;
}

// Las tres que importan en el momento de decidir, junto al precio. Ordenadas por
// cuánto explican el precio: peso, agua, exclusividad.
export const VENTAJAS_CLAVE: Ventaja[] = [
  {
    destacado: "90%",
    titulo: "más liviano que el hormigón",
    detalle: "Lo mueves tú, y sirve en terrazas y pisos en altura sin sobrecargar la losa.",
  },
  {
    destacado: "40%",
    titulo: "menos agua por ser térmico",
    detalle: "El núcleo aísla la tierra: mantiene la humedad y necesita hasta 40% menos agua que un macetero sin aislación.",
  },
  {
    destacado: "Único",
    titulo: "hecho a pedido en Chile",
    detalle: "Fabricado y terminado a mano en Quilicura, con garantía. Interior y exterior.",
  },
];

// Frente a un macetero tradicional. La columna de la derecha se queda en
// propiedades físicas del material, sin afirmar nada sobre otras marcas.
export interface FilaComparacion {
  aspecto: string;
  nuestro: string;
  tradicional: string;
}

export const COMPARACION_TITULO = "Frente a un macetero tradicional";
export const COMPARACION_COLUMNAS = {
  nuestro: "Mundo Macetero · tecnología EIFS",
  tradicional: "Hormigón o cerámica",
} as const;

export const COMPARACION: FilaComparacion[] = [
  {
    aspecto: "Peso",
    nuestro: "Hasta 90% más liviano",
    tradicional: "Del mismo tamaño, pesa varias veces más",
  },
  {
    aspecto: "Cambiarlo de lugar",
    nuestro: "Una persona lo mueve plantado",
    tradicional: "Difícil de mover una vez plantado",
  },
  {
    aspecto: "Terrazas y altura",
    nuestro: "No sobrecarga la losa",
    tradicional: "Hay que revisar la carga que admite el piso",
  },
  {
    aspecto: "Agua",
    nuestro: "Térmico: necesita hasta 40% menos agua",
    tradicional: "Sin aislación, la tierra se seca antes",
  },
  {
    aspecto: "Intemperie",
    nuestro: "Resiste golpes, sol, lluvia y heladas",
    tradicional: "La cerámica se pica y se quiebra con el frío",
  },
  {
    aspecto: "Terminación",
    nuestro: "Cuatro terminaciones, aplicadas a mano",
    tradicional: "El color con que salió de fábrica",
  },
  {
    aspecto: "Medidas",
    nuestro: "Se fabrica a pedido en la medida que eliges",
    tradicional: "Las medidas del catálogo",
  },
];

// Una línea, para el carrito y el checkout: recuerda por qué se está comprando
// esto sin repetir la ficha completa.
export const VALOR_UNA_LINEA =
  "Maceteros con tecnología EIFS: hasta 90% más livianos que el hormigón, térmicos (necesitan hasta 40% menos agua) " +
  "y fabricados a pedido en Quilicura, con garantía.";
