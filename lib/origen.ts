// lib/origen.ts — de dónde viene una visita.
//
// Función pura, sin acceso al navegador ni a la base, para poder probarla: recibe
// la URL de entrada y el referrer, y devuelve canal / fuente / campaña. No mira ni
// devuelve nada que identifique a la persona: ni IP, ni correo, ni nombre, ni el
// user agent completo (de él solo sale una de tres categorías de dispositivo).

export type Canal = "directo" | "busqueda" | "social" | "pagado" | "referido" | "correo";
export type Dispositivo = "movil" | "tablet" | "escritorio";

export const CANALES: readonly Canal[] = [
  "directo",
  "busqueda",
  "social",
  "pagado",
  "referido",
  "correo",
];

export const DISPOSITIVOS: readonly Dispositivo[] = ["movil", "tablet", "escritorio"];

export interface Origen {
  canal: Canal;
  fuente: string;
  campana: string;
}

// Fuente y campaña van a columnas de texto que después se agrupan en el panel:
// recortarlas y pasarlas a minúsculas evita que "Instagram" e "instagram" salgan
// como dos filas distintas.
const MAX_TEXTO = 80;

const MEDIOS_PAGADOS = new Set(["cpc", "ppc", "paid", "paid_social", "ads"]);
const MEDIOS_CORREO = new Set(["email", "newsletter"]);

// Cada patrón se evalúa contra el host del referrer ya sin "www.".
const BUSCADORES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\./, "bing"],
  [/(^|\.)duckduckgo\./, "duckduckgo"],
  [/(^|\.)yahoo\./, "yahoo"],
  [/(^|\.)ecosia\./, "ecosia"],
];

const REDES: [RegExp, string][] = [
  [/(^|\.)instagram\./, "instagram"],
  [/(^|\.)(facebook|fb)\./, "facebook"],
  [/^t\.co$/, "x"],
  [/(^|\.)(twitter|x)\.com$/, "x"],
  [/(^|\.)tiktok\./, "tiktok"],
  [/(^|\.)pinterest\./, "pinterest"],
  [/(^|\.)linkedin\./, "linkedin"],
  [/((^|\.)youtube\.|(^|\.)youtu\.be$)/, "youtube"],
  [/((^|\.)whatsapp\.|^wa\.me$)/, "whatsapp"],
];

function texto(valor: string | null | undefined): string {
  return (valor ?? "").trim().toLowerCase().slice(0, MAX_TEXTO);
}

// Host sin "www." y en minúsculas. Un valor que no sea una URL válida (o el
// referrer vacío) devuelve "".
function host(valor: string): string {
  try {
    return new URL(valor).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function busca(patrones: [RegExp, string][], h: string): string | null {
  for (const [patron, nombre] of patrones) if (patron.test(h)) return nombre;
  return null;
}

// Clasificación por referrer, cuando la URL no trae utm_* ni parámetros de clic.
function porReferrer(hostRef: string, hostPropio: string): { canal: Canal; fuente: string } {
  if (!hostRef || hostRef === hostPropio) return { canal: "directo", fuente: "directo" };
  const buscador = busca(BUSCADORES, hostRef);
  if (buscador) return { canal: "busqueda", fuente: buscador };
  const red = busca(REDES, hostRef);
  if (red) return { canal: "social", fuente: red };
  return { canal: "referido", fuente: hostRef.slice(0, MAX_TEXTO) };
}

export function resolverOrigen({ url, referrer }: { url: string; referrer: string }): Origen {
  let params: URLSearchParams | null = null;
  let hostPropio = "";
  try {
    const u = new URL(url);
    params = u.searchParams;
    hostPropio = u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    // Sin URL utilizable queda solo el referrer.
  }

  const fuenteUtm = texto(params?.get("utm_source"));
  const medio = texto(params?.get("utm_medium"));
  const campana = texto(params?.get("utm_campaign"));

  const referido = porReferrer(host(referrer), hostPropio);
  // Respaldo de fuente cuando el enlace trae utm_medium pero no utm_source: sirve
  // el referrer, salvo que sea una entrada directa (ahí no hay nada que decir).
  const respaldo = referido.canal === "directo" ? "desconocida" : referido.fuente;

  // Las utm_* mandan: las pone quien armó el enlace y describen la intención.
  if (medio && MEDIOS_PAGADOS.has(medio)) {
    return { canal: "pagado", fuente: fuenteUtm || respaldo, campana };
  }
  if (medio && MEDIOS_CORREO.has(medio)) {
    return { canal: "correo", fuente: fuenteUtm || respaldo, campana };
  }
  if (medio === "social") {
    return { canal: "social", fuente: fuenteUtm || respaldo, campana };
  }
  // utm_source con un medio que no reconocemos (o sin medio): sabemos de dónde
  // viene, no cómo, así que queda como referido.
  if (fuenteUtm) return { canal: "referido", fuente: fuenteUtm, campana };

  // Parámetros de clic de anuncios: llegan sin utm cuando la campaña no las
  // configuró, pero identifican igual de bien una visita pagada.
  if (params?.get("gclid")) return { canal: "pagado", fuente: "google", campana };
  if (params?.get("fbclid")) return { canal: "pagado", fuente: "meta", campana };
  if (params?.get("ttclid")) return { canal: "pagado", fuente: "tiktok", campana };

  return { canal: referido.canal, fuente: referido.fuente, campana };
}

// Heurística simple y deliberadamente gruesa: solo interesa saber si la tienda se
// ve más en teléfono o en computador. No se guarda el user agent completo.
export function detectarDispositivo(ua: string): Dispositivo {
  const s = ua || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(s)) return "tablet";
  // Android sin "Mobi" en el user agent es la señal habitual de una tablet.
  if (/Android/i.test(s) && !/Mobi/i.test(s)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(s)) return "movil";
  return "escritorio";
}
