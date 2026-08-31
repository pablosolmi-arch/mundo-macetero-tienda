// Aviso a IndexNow, el protocolo que usan Bing y Yandex (y que alimenta las
// respuestas de Copilot y parte de ChatGPT) para enterarse de un cambio sin
// esperar a que su rastreador pase solo.
//
// La clave vive en `public/<clave>.txt` y debe seguir publicada: IndexNow la
// descarga en cada envío para comprobar que quien avisa es dueño del dominio.
//
// Google NO participa de este protocolo: sus URLs se piden a mano en Search
// Console.

const CLAVE = "ed6c4207362747488c563492d6948253";
const HOST = "mundomacetero.cl";
const ENDPOINT = "https://api.indexnow.org/IndexNow";

/**
 * Avisa a IndexNow que estas rutas cambiaron. Nunca lanza: un aviso fallido no
 * puede tumbar el guardado de un producto ni la respuesta de una ruta.
 * Devuelve el código HTTP recibido, o null si no se pudo enviar.
 */
export async function avisarIndexNow(rutas: string[]): Promise<number | null> {
  // Solo tiene sentido en producción: desde un entorno de vista previa o local
  // estaríamos avisando de URLs que el buscador vería distintas o no vería.
  if (process.env.VERCEL_ENV !== "production") return null;

  const urlList = [...new Set(rutas)]
    .filter(Boolean)
    .map((r) => (r.startsWith("http") ? r : `https://${HOST}${r.startsWith("/") ? r : `/${r}`}`))
    // IndexNow rechaza el lote completo (422) si una sola URL es de otro host.
    .filter((u) => u.startsWith(`https://${HOST}/`) || u === `https://${HOST}`);

  if (urlList.length === 0) return null;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: CLAVE,
        keyLocation: `https://${HOST}/${CLAVE}.txt`,
        urlList,
      }),
    });
    return res.status;
  } catch {
    return null;
  }
}

/**
 * Rutas que conviene avisar cuando cambia un producto: su ficha, el catálogo y
 * la portada, que muestran su nombre y su precio.
 */
export function rutasDeProducto(slug: string): string[] {
  return ["/", "/tienda", `/producto/${slug}`];
}
