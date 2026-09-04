// Registro de eventos de la tienda, del lado del cliente.
//
// Guarda solo un identificador de sesión aleatorio, sin nada que identifique a la
// persona: ni correo, ni nombre, ni IP. Sirve para armar el embudo
// visita → ficha → carrito → checkout → pago en el panel, y para saber de dónde
// llegó cada sesión (canal, fuente, campaña y tipo de dispositivo).

import { detectarDispositivo, resolverOrigen, type Canal } from "./origen";

// Los tres últimos miden lo que pasa DENTRO del formulario de checkout: qué
// campos alcanzó a completar la sesión, por qué se rechazó el envío y si llegó a
// apretar pagar. Viajan con `campo`, que es el nombre del campo o un código
// corto de error, nunca lo que la persona escribió.
export type EventoTipo =
  | "visita"
  | "producto"
  | "agregar"
  | "checkout"
  | "checkout_campo"
  | "checkout_error"
  | "checkout_envio"
  // Clic en el botón flotante de WhatsApp. Va con `campo` = de dónde se apretó
  // ('flotante'), para poder sumar otros puntos de contacto más adelante sin
  // mezclar los números.
  | "whatsapp";

const CLAVE_SESION = "mm_sid";
const CLAVE_ORIGEN = "mm_origen";

// Una sesión que no ve actividad por 30 días se considera terminada: sin esto el
// identificador vivía para siempre y "sesiones" no medía nada.
const VENCE_MS = 30 * 24 * 60 * 60 * 1000;

export interface OrigenSesion {
  sessionId: string;
  canal: Canal;
  fuente: string;
  campana: string;
}

interface Guardado {
  canal: Canal;
  fuente: string;
  campana: string;
  // Último evento de la sesión, en milisegundos.
  ts: number;
}

function calcular(): { canal: Canal; fuente: string; campana: string } {
  return resolverOrigen({ url: window.location.href, referrer: document.referrer || "" });
}

function leerGuardado(): Guardado | null {
  const crudo = localStorage.getItem(CLAVE_ORIGEN);
  if (!crudo) return null;
  try {
    const dato = JSON.parse(crudo) as Partial<Guardado>;
    if (typeof dato?.canal !== "string" || typeof dato?.ts !== "number") return null;
    return {
      canal: dato.canal as Canal,
      fuente: typeof dato.fuente === "string" ? dato.fuente : "",
      campana: typeof dato.campana === "string" ? dato.campana : "",
      ts: dato.ts,
    };
  } catch {
    return null;
  }
}

// El origen es del PRIMER contacto de la sesión: se calcula una sola vez y se
// reutiliza. Así un cliente que vuelve mañana desde Google no borra el anuncio o
// el enlace que lo trajo la primera vez. Solo una sesión nueva recalcula.
export function origenSesion(): OrigenSesion {
  const vacio: OrigenSesion = { sessionId: "", canal: "directo", fuente: "directo", campana: "" };
  if (typeof window === "undefined") return vacio;

  try {
    const id = localStorage.getItem(CLAVE_SESION);
    const guardado = leerGuardado();
    const vencida = !guardado || Date.now() - guardado.ts > VENCE_MS;

    let sessionId = id ?? "";
    let actual: Guardado;
    if (!sessionId || vencida) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(CLAVE_SESION, sessionId);
      actual = { ...calcular(), ts: Date.now() };
    } else {
      actual = { ...guardado, ts: Date.now() };
    }
    localStorage.setItem(CLAVE_ORIGEN, JSON.stringify(actual));
    return { sessionId, canal: actual.canal, fuente: actual.fuente, campana: actual.campana };
  } catch {
    // Almacenamiento bloqueado por el navegador: el evento se manda sin sesión, con
    // el origen calculado al vuelo. Nunca hay que romper la navegación por esto.
    try {
      return { sessionId: "", ...calcular() };
    } catch {
      return vacio;
    }
  }
}

export function track(
  tipo: EventoTipo,
  extra?: { path?: string; productSlug?: string; campo?: string },
): void {
  if (typeof window === "undefined") return;
  const origen = origenSesion();
  const cuerpo = JSON.stringify({
    tipo,
    path: extra?.path ?? window.location.pathname,
    productSlug: extra?.productSlug ?? null,
    campo: extra?.campo ?? null,
    sessionId: origen.sessionId,
    referrer: document.referrer || "",
    canal: origen.canal,
    fuente: origen.fuente,
    campana: origen.campana,
    dispositivo: detectarDispositivo(navigator.userAgent || ""),
  });

  // sendBeacon sobrevive a la navegación; fetch es el respaldo. Nunca bloquea la
  // interfaz ni rompe nada si falla: son métricas, no parte de la compra.
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/eventos", new Blob([cuerpo], { type: "application/json" }));
      return;
    }
  } catch {
    // sigue al fetch
  }
  void fetch("/api/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {});
}
