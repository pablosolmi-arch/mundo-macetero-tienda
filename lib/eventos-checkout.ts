// lib/eventos-checkout.ts — el vocabulario de la medición del checkout.
//
// La página de checkout, el endpoint que recibe los eventos y el panel hablan
// todos de los mismos campos y de los mismos motivos de error. Vive aparte y sin
// dependencias para poder probarlo solo y para que la lista blanca del servidor
// sea exactamente la misma que usa el navegador.
//
// Nada de esto identifica a nadie: se guarda el NOMBRE del campo que se completó
// o un código corto de por qué falló el envío, nunca lo que la persona escribió.

// Los campos del formulario, EN EL ORDEN en que aparecen en pantalla: así se
// dibuja la caída del panel sin tener que reordenar nada después.
export const CAMPOS_CHECKOUT = [
  "email",
  "nombre",
  "apellido",
  "fono",
  "entrega",
  "direccion",
  "depto",
  "region",
  "comuna",
  "notas",
  "cupon",
] as const;

export type CampoCheckout = (typeof CAMPOS_CHECKOUT)[number];

export const ETIQUETAS_CAMPO: Record<CampoCheckout, string> = {
  email: "Correo",
  nombre: "Nombre",
  apellido: "Apellido",
  fono: "Teléfono",
  entrega: "Eligió entrega",
  direccion: "Dirección",
  depto: "Depto / casa",
  region: "Región",
  comuna: "Comuna",
  notas: "Indicaciones",
  cupon: "Código de descuento",
};

// Los motivos que EXISTEN de verdad: seis los rechaza la propia página antes de
// enviar y el resto son las respuestas de error de POST /api/checkout. No hay
// motivos inventados; si el servidor cambia sus mensajes, cae en 'desconocido'.
export const MOTIVOS_CHECKOUT = [
  // Validación local, antes de salir del navegador.
  "falta_email",
  "email_invalido",
  "falta_nombre",
  "falta_fono",
  "falta_direccion",
  "falta_comuna",
  // Respuestas del servidor.
  "carrito_vacio",
  "pedido_invalido",
  "producto_no_disponible",
  "variante_no_existe",
  "sin_stock",
  "monto_invalido",
  "pasarela_sin_config",
  "pasarela",
  "sin_conexion",
  "desconocido",
] as const;

export type MotivoCheckout = (typeof MOTIVOS_CHECKOUT)[number];

export const ETIQUETAS_MOTIVO: Record<MotivoCheckout, string> = {
  falta_email: "Sin correo",
  email_invalido: "Correo mal escrito",
  falta_nombre: "Sin nombre",
  falta_fono: "Sin teléfono",
  falta_direccion: "Sin dirección",
  falta_comuna: "Sin comuna",
  carrito_vacio: "Carrito vacío",
  pedido_invalido: "Pedido inválido",
  producto_no_disponible: "Producto no disponible",
  variante_no_existe: "Variante inexistente",
  sin_stock: "Sin stock suficiente",
  monto_invalido: "Monto inválido",
  pasarela_sin_config: "Pasarela sin configurar",
  pasarela: "Pasarela rechazó el pago",
  sin_conexion: "No se pudo conectar",
  desconocido: "Otro",
};

// Todo lo que puede viajar en el campo `campo` de un evento: el servidor no
// guarda nada que no esté acá.
export const VALORES_CAMPO_EVENTO: ReadonlySet<string> = new Set<string>([
  ...CAMPOS_CHECKOUT,
  ...MOTIVOS_CHECKOUT,
]);

// El error que devolvió POST /api/checkout, en código corto. Primero el estado
// HTTP (la pasarela no manda mensaje propio) y después el texto, que es el único
// dato que distingue una validación de otra.
export function motivoRespuestaCheckout(estado: number, mensaje?: unknown): MotivoCheckout {
  // 503 = no hay credenciales de pasarela configuradas; 502 = la pasarela
  // contestó que no. Son problemas distintos y se arreglan distinto.
  if (estado === 503) return "pasarela_sin_config";
  if (estado === 502) return "pasarela";

  const texto = typeof mensaje === "string" ? mensaje.toLowerCase() : "";
  if (texto.includes("carrito está vacío")) return "carrito_vacio";
  if (texto.includes("correo del cliente")) return "falta_email";
  if (texto.includes("comuna de despacho")) return "falta_comuna";
  if (texto.includes("pedido inválido")) return "pedido_invalido";
  if (texto.includes("ya no está disponible")) return "producto_no_disponible";
  if (texto.includes("ya no existe")) return "variante_no_existe";
  if (texto.includes("solo quedan")) return "sin_stock";
  if (texto.includes("monto del pedido")) return "monto_invalido";
  if (texto.includes("pasarela")) return "pasarela";
  return "desconocido";
}
