// Avisa a IndexNow (Bing, Yandex y de ahí Copilot) todas las URLs del sitemap.
//
//   node scripts/indexnow.mjs            → mundomacetero.cl
//   node scripts/indexnow.mjs <host> <clave>
//
// Se ejecuta después de publicar, cuando el sitio nuevo ya está en línea: si se
// avisara durante la compilación, el buscador vendría a mirar la versión vieja.
// Por eso `npm run deploy` encadena el despliegue y luego este aviso.
//
// Google no participa de IndexNow: sus URLs se piden a mano en Search Console.

const HOST = process.argv[2] ?? "mundomacetero.cl";
const CLAVE = process.argv[3] ?? "ed6c4207362747488c563492d6948253";

const sitemap = `https://${HOST}/sitemap.xml`;
const res = await fetch(sitemap, { headers: { "User-Agent": "indexnow-script" } });
if (!res.ok) {
  console.error(`No se pudo leer ${sitemap}: HTTP ${res.status}`);
  process.exit(1);
}
const xml = await res.text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (urlList.length === 0) {
  console.error(`El sitemap de ${HOST} no trajo ninguna URL.`);
  process.exit(1);
}

// La clave tiene que seguir publicada: IndexNow la descarga en cada envío para
// comprobar que quien avisa es dueño del dominio.
const clave = await fetch(`https://${HOST}/${CLAVE}.txt`);
const contenido = clave.ok ? (await clave.text()).trim() : "";
if (contenido !== CLAVE) {
  console.error(`La clave https://${HOST}/${CLAVE}.txt no responde con su propio valor (HTTP ${clave.status}).`);
  process.exit(1);
}

const envio = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: CLAVE,
    keyLocation: `https://${HOST}/${CLAVE}.txt`,
    urlList,
  }),
});

// 200 y 202 son los dos casos de éxito: recibido, y recibido pendiente de validar.
const ok = envio.status === 200 || envio.status === 202;
console.log(`${ok ? "OK" : "FALLÓ"} · ${HOST} · ${urlList.length} URLs · HTTP ${envio.status}`);
if (!ok) {
  console.error(await envio.text());
  process.exit(1);
}
