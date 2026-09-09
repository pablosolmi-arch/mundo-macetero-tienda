// Correos transaccionales vía Resend (API REST directa, sin SDK).
//
// Sin RESEND_API_KEY configurada no se envía nada y la función lo dice en su
// resultado: el que llama decide si anotarlo en la bitácora. Un correo fallido
// jamás debe romper la confirmación de un pago, así que aquí no se lanza nada.
//
// Variables:
//   RESEND_API_KEY  clave de Resend
//   MAIL_FROM       remitente, ej: "Mundo Macetero <mundo@mundomacetero.cl>"
//                   (el dominio debe estar verificado en Resend)
//   MAIL_EQUIPO     a quién avisar de cada venta (por defecto, el correo de la tienda)

import { TIENDA } from "../content/site";
import { formatCLP } from "./format";
import { codigoPedido } from "./pedido-codigo";

// Todo dato que escribió el cliente (nombre, dirección, comuna) se escapa antes
// de interpolarlo en el HTML del correo: si no, un nombre como
// "<img src=x onerror=...>" se ejecutaría en el correo que recibe el equipo.
function esc(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FROM = process.env.MAIL_FROM || "Mundo Macetero <onboarding@resend.dev>";
// Varios destinatarios separados por coma: cada venta avisa a todo el equipo.
const EQUIPO = (process.env.MAIL_EQUIPO || TIENDA.email)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export interface ResultadoCorreo {
  enviado: boolean;
  detalle: string;
}

async function enviar(to: string | string[], subject: string, html: string): Promise<ResultadoCorreo> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { enviado: false, detalle: "omitido: falta RESEND_API_KEY" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    if (!res.ok) return { enviado: false, detalle: `Resend respondió ${res.status}` };
    return { enviado: true, detalle: subject };
  } catch {
    return { enviado: false, detalle: "sin conexión con Resend" };
  }
}

interface LineaPedido {
  productName: string;
  variantName: string | null;
  unitPrice: string;
  qty: number;
}

interface DatosPedido {
  commerceOrder: string;
  // Correlativo humano y fecha de creación: juntos forman el código "#7-25/08",
  // que es el que el cliente y el equipo usan para hablar del pedido.
  numero: number | null;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  amount: string;
  subtotal: string;
  discountAmount: string;
  discountCode: string | null;
  shippingLabel: string;
  entrega: string;
  shippingAddress: string;
  shippingCity: string;
  items: LineaPedido[];
}

const ESTILO_TABLA = 'style="width:100%;border-collapse:collapse;font-size:14px"';
const CELDA = 'style="padding:8px 0;border-bottom:1px solid #e9e6e1"';
const CELDA_DER = 'style="padding:8px 0;border-bottom:1px solid #e9e6e1;text-align:right;white-space:nowrap"';

function tablaItems(p: DatosPedido): string {
  const filas = p.items
    .map(
      (it) => `<tr>
        <td ${CELDA}>${esc(it.productName)}${it.variantName && it.variantName !== "Default Title" ? `<br><span style="color:#6f6c66;font-size:12px">${esc(it.variantName)}</span>` : ""} × ${it.qty}</td>
        <td ${CELDA_DER}>${formatCLP(Number(it.unitPrice) * it.qty)}</td>
      </tr>`,
    )
    .join("");
  const descuento =
    Number(p.discountAmount) > 0
      ? `<tr><td ${CELDA}>Descuento ${esc(p.discountCode ?? "")}</td><td ${CELDA_DER}>−${formatCLP(Number(p.discountAmount))}</td></tr>`
      : "";
  return `<table ${ESTILO_TABLA}>${filas}${descuento}
    <tr><td style="padding:10px 0;font-weight:bold">Total</td>
    <td style="padding:10px 0;font-weight:bold;text-align:right">${formatCLP(Number(p.amount))}</td></tr></table>`;
}

function marco(titulo: string, cuerpo: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#2a2925">
    <div style="background:#23221f;padding:18px 24px">
      <img src="${SITE_URL}/logo-email.png" alt="Mundo Macetero" height="28" style="display:block"></div>
    <div style="padding:24px;background:#ffffff;border:1px solid #e9e6e1;border-top:none">
      <h1 style="font-size:20px;margin:0 0 12px">${titulo}</h1>${cuerpo}
      <p style="font-size:12px;color:#9b978f;margin-top:24px">${TIENDA.nombre} · ${TIENDA.direccion} · ${TIENDA.email}</p>
    </div></div>`;
}

// Al cliente, cuando su pago queda confirmado.
export async function correoConfirmacion(p: DatosPedido): Promise<ResultadoCorreo> {
  const entrega =
    p.entrega === "retiro"
      ? `Puedes retirar en ${TIENDA.direccion} (${TIENDA.horario}).`
      : `Coordinaremos el despacho a ${esc(p.shippingAddress)}, ${esc(p.shippingCity)}. ${esc(p.shippingLabel)}.`;
  return enviar(
    p.customerEmail,
    `Recibimos tu pago · Pedido ${codigoPedido(p.numero, p.createdAt)}`,
    marco(
      "¡Gracias por tu compra!",
      `<p style="font-size:14px">Hola ${esc(p.customerName || "")}, tu pago del pedido
       <strong>${esc(codigoPedido(p.numero, p.createdAt))}</strong> quedó confirmado.</p>
       ${tablaItems(p)}
       <p style="font-size:14px">${entrega}</p>
       <p style="font-size:14px">Cualquier duda, respóndenos a este correo o escríbenos al ${TIENDA.telefonos[0]}.</p>`,
    ),
  );
}

// Al equipo, para que sepan que entró una venta sin abrir el panel.
export async function correoAvisoEquipo(p: DatosPedido): Promise<ResultadoCorreo> {
  return enviar(
    EQUIPO,
    `Nueva venta ${formatCLP(Number(p.amount))} · Pedido ${codigoPedido(p.numero, p.createdAt)}`,
    marco(
      "Nuevo pedido pagado",
      `<p style="font-size:14px"><strong>${esc(p.customerName || "Cliente")}</strong> (${esc(p.customerEmail)})
       · ${p.entrega === "retiro" ? "Retiro en tienda" : `Despacho a ${esc(p.shippingCity)}`}</p>
       ${tablaItems(p)}
       <p style="font-size:14px"><a href="${SITE_URL}/admin/pedidos/${encodeURIComponent(p.commerceOrder)}"
       style="color:#a5613f;font-weight:bold">Ver el pedido en el panel →</a></p>`,
    ),
  );
}

// Al cliente, cuando se le devuelve dinero. La pasarela es la que procesó el
// pago original (orders.gateway): hoy Mercado Pago o Flow.
export async function correoReembolso(
  p: DatosPedido,
  monto: number,
  pasarela = "la pasarela de pago",
): Promise<ResultadoCorreo> {
  return enviar(
    p.customerEmail,
    `Reembolso de ${formatCLP(monto)} · Pedido ${codigoPedido(p.numero, p.createdAt)}`,
    marco(
      "Procesamos tu reembolso",
      `<p style="font-size:14px">Solicitamos a ${esc(pasarela)} la devolución de
       <strong>${formatCLP(monto)}</strong> del pedido ${esc(codigoPedido(p.numero, p.createdAt))}.
       El abono puede tardar algunos días hábiles según tu banco.</p>`,
    ),
  );
}

// A quien pidió recuperar su clave del panel. El enlace lleva un token de un
// solo uso que vence en 30 minutos, así que no se guarda ni se registra en
// ninguna parte fuera de este correo.
export async function correoRecuperarClave(
  destino: string,
  nombre: string,
  enlace: string,
): Promise<ResultadoCorreo> {
  return enviar(
    destino,
    "Recupera tu clave del panel · Mundo Macetero",
    marco(
      "Crea una clave nueva",
      `<p style="font-size:14px">Hola ${esc(nombre || "")}, alguien pidió recuperar la clave
       de la cuenta <strong>${esc(destino)}</strong> en el panel de Mundo Macetero.
       Si fuiste tú, entra por aquí y elige una clave nueva:</p>
       <p style="margin:20px 0"><a href="${esc(enlace)}"
       style="background:#2a2925;color:#fff;padding:12px 22px;border-radius:8px;
       text-decoration:none;font-weight:bold;font-size:14px">Crear clave nueva</a></p>
       <p style="font-size:13px;color:#6f6c66">El enlace vence en 30 minutos y sirve una sola vez.
       Al usarlo se cerrarán todas las sesiones abiertas de tu cuenta.</p>
       <p style="font-size:13px;color:#6f6c66">Si no lo pediste, ignora este correo:
       tu clave actual sigue funcionando y nadie puede entrar sin este enlace.</p>`,
    ),
  );
}

// Al equipo, cuando alguien pide que lo contacten: asesoría, "tu espacio", un
// proyecto profesional o una llamada desde el checkout.
//
// Existe porque una solicitud que solo queda en la base de datos no sirve de
// nada: hasta ahora las consultas se guardaban en `leads` y nadie recibía aviso,
// así que había que entrar al panel a buscarlas. La de llamada es la más urgente
// de todas: quien la pide está con el carrito lleno esperando.
export async function correoSolicitudContacto(s: {
  tipo: string;
  titulo: string;
  nombre: string;
  email: string;
  telefono: string;
  detalle: string;
  mensaje: string;
}): Promise<ResultadoCorreo> {
  const filas = [
    ["Nombre", s.nombre],
    ["Correo", s.email],
    ["Teléfono", s.telefono],
  ]
    .filter(([, valor]) => !!valor)
    .map(
      ([etiqueta, valor]) =>
        `<tr><td ${CELDA} style="padding:8px 0;border-bottom:1px solid #e9e6e1;color:#6f6c66;width:90px">${etiqueta}</td>
         <td ${CELDA}><strong>${esc(valor)}</strong></td></tr>`,
    )
    .join("");

  // El detalle y el mensaje son texto libre escrito por la persona: se escapan y
  // los saltos de línea se respetan, nada más.
  const libre = [s.detalle, s.mensaje]
    .filter(Boolean)
    .map((t) => `<p style="font-size:14px;white-space:pre-line">${esc(t)}</p>`)
    .join("");

  return enviar(
    EQUIPO,
    `${s.titulo}${s.nombre ? ` · ${s.nombre}` : ""}`,
    marco(s.titulo, `<table ${ESTILO_TABLA}>${filas}</table>${libre}`),
  );
}

// Al cliente que dejó un pago a medias, con un link que restaura su carrito.
export async function correoCarritoAbandonado(p: DatosPedido): Promise<ResultadoCorreo> {
  return enviar(
    p.customerEmail,
    "Tu pedido quedó a un paso · Mundo Macetero",
    marco(
      "Tu carrito te espera",
      `<p style="font-size:14px">Hola ${esc(p.customerName || "")}, vimos que empezaste una compra
       y quedó a medio camino. Guardamos tu pedido:</p>
       ${tablaItems(p)}
       <p style="margin:20px 0"><a href="${SITE_URL}/retomar/${encodeURIComponent(p.commerceOrder)}"
       style="background:#2a2925;color:#fff;padding:12px 22px;border-radius:8px;
       text-decoration:none;font-weight:bold;font-size:14px">Retomar mi compra</a></p>
       <p style="font-size:13px;color:#6f6c66">Si tuviste algún problema con el pago,
       respóndenos y te ayudamos.</p>`,
    ),
  );
}
