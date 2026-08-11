// Correos transaccionales vía Resend (API REST directa, sin SDK).
//
// Sin RESEND_API_KEY configurada no se envía nada y la función lo dice en su
// resultado: el que llama decide si anotarlo en la bitácora. Un correo fallido
// jamás debe romper la confirmación de un pago, así que aquí no se lanza nada.
//
// Variables:
//   RESEND_API_KEY  clave de Resend
//   MAIL_FROM       remitente, ej: "Mundo Macetero <pedidos@mundomacetero.cl>"
//                   (el dominio debe estar verificado en Resend)
//   MAIL_EQUIPO     a quién avisar de cada venta (por defecto, el correo de la tienda)

import { TIENDA } from "../content/site";
import { formatCLP } from "./format";

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
const EQUIPO = process.env.MAIL_EQUIPO || TIENDA.email;
const SITE_URL = process.env.SITE_URL || "https://fase1-storefront-catalogo.vercel.app";

export interface ResultadoCorreo {
  enviado: boolean;
  detalle: string;
}

async function enviar(to: string, subject: string, html: string): Promise<ResultadoCorreo> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { enviado: false, detalle: "omitido: falta RESEND_API_KEY" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
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
    <div style="background:#23221f;color:#f4f3f1;padding:18px 24px;font-size:18px;font-weight:bold">
      mundo macetero<span style="color:#d99e77">.</span></div>
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
    `Recibimos tu pago · Pedido ${p.commerceOrder}`,
    marco(
      "¡Gracias por tu compra!",
      `<p style="font-size:14px">Hola ${esc(p.customerName || "")}, tu pago del pedido
       <strong>${esc(p.commerceOrder)}</strong> quedó confirmado.</p>
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
    `Nueva venta ${formatCLP(Number(p.amount))} · ${p.commerceOrder}`,
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

// Al cliente, cuando se le devuelve dinero.
export async function correoReembolso(
  p: DatosPedido,
  monto: number,
): Promise<ResultadoCorreo> {
  return enviar(
    p.customerEmail,
    `Reembolso de ${formatCLP(monto)} · Pedido ${p.commerceOrder}`,
    marco(
      "Procesamos tu reembolso",
      `<p style="font-size:14px">Solicitamos a Flow la devolución de
       <strong>${formatCLP(monto)}</strong> del pedido ${esc(p.commerceOrder)}.
       El abono puede tardar algunos días hábiles según tu banco.</p>`,
    ),
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
