// Registro de eventos de la tienda, del lado del cliente.
//
// Guarda solo un identificador de sesión aleatorio, sin nada que identifique a la
// persona: ni correo, ni nombre, ni IP. Sirve para armar el embudo
// visita → ficha → carrito → checkout → pago en el panel.

export type EventoTipo = "visita" | "producto" | "agregar" | "checkout";

const CLAVE_SESION = "mm_sid";

function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(CLAVE_SESION);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLAVE_SESION, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function track(tipo: EventoTipo, extra?: { path?: string; productSlug?: string }): void {
  if (typeof window === "undefined") return;
  const cuerpo = JSON.stringify({
    tipo,
    path: extra?.path ?? window.location.pathname,
    productSlug: extra?.productSlug ?? null,
    sessionId: sessionId(),
    referrer: document.referrer || "",
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
