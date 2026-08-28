# Migración de mundomacetero.cl desde Shopify a Vercel

Estado al 28-08-2026: el código ya está listo (redirecciones 301 publicadas, dominio
agregado al proyecto de Vercel). Falta el cambio de DNS y el paso final de
`SITE_URL`, que **no** puede hacerse antes del corte.

## Cómo está el DNS hoy

El dominio está inscrito en NIC.cl, pero la **zona DNS no vive ahí**: NIC.cl delega
a los servidores de nombres del hosting.

```
NS      ns.cpanelhost.cl / ns2.cpanelhost.cl
A  @    23.227.38.65            → Shopify
CNAME www shops.myshopify.com   → Shopify
MX      mail.mundomacetero.cl   → 190.107.177.235  (correo, en el servidor cPanel)
A mail/webmail/ftp/cpanel       → 190.107.177.235
TXT     v=spf1 +a +mx +ip4:190.107.177.235 +ip4:200.63.100.227 ~all
```

El correo `mundo@mundomacetero.cl` y el webmail viven en el servidor cPanel, **no**
en Shopify. Por eso el cambio se hace registro por registro y no moviendo los
servidores de nombres.

## Lo que NO hay que hacer

No cambiar los nameservers a `ns1/ns2.vercel-dns.com` en NIC.cl. Eso vaciaría la
zona actual y se caerían el correo, el webmail, el FTP y el acceso a cPanel hasta
recrear cada registro a mano en Vercel DNS. La web se puede mover sin tocar los NS.

## Pasos del corte

1. **Entrar al panel de cPanel** (cpanelhost.cl) → *Editor de zona DNS* de
   mundomacetero.cl.
2. **Cambiar el registro A de la raíz**: de `23.227.38.65` a `76.76.21.21`.
3. **Cambiar el CNAME de www**: de `shops.myshopify.com` a `cname.vercel-dns.com`.
   Si el panel no acepta CNAME en www porque ya existe un registro A, borrar el A
   de www primero.
4. **No tocar** MX, `mail`, `webmail`, `ftp`, `cpanel` ni el TXT de SPF.
5. Esperar la propagación (minutos a un par de horas) y que Vercel emita el
   certificado. Verificar con `vercel domains inspect mundomacetero.cl`.
6. **Recién ahí**, definir la variable de entorno y volver a desplegar:
   ```
   vercel env add SITE_URL production   # https://mundomacetero.cl
   vercel --prod
   ```

## Por qué `SITE_URL` va al final

`SITE_URL` no solo arma los canonical y el sitemap: también arma las URLs de
retorno y los webhooks de pago (`lib/pagos.ts`, `app/api/checkout/*`). Si se
define antes de que el dominio apunte a Vercel, un cliente que pague sería
devuelto a mundomacetero.cl (todavía Shopify) y el webhook de Mercado Pago
llegaría a Shopify, así que el pedido nunca quedaría marcado como pagado.

## Después del corte

- Search Console: enviar `sitemap.xml` del dominio nuevo y pedir indexación de
  `/`, `/maceteros`, `/guias`, `/preguntas-frecuentes`.
- Comprobar redirecciones en producción, por ejemplo
  `https://mundomacetero.cl/products/macetero-cubo-cu40` debe llevar a
  `/producto/macetero-cubo-cu40` con un 301.
- Actualizar el enlace del sitio en el perfil de Google y en Instagram.
- Avisar a la agencia de Google Ads: las URLs de destino de los anuncios cambian
  de `/collections/...` y `/products/...` a `/tienda/...` y `/producto/...`. Las
  redirecciones las cubren, pero conviene actualizarlas para no perder calidad.
- Mantener la tienda Shopify sin publicar durante unas semanas por si hay que
  volver atrás; el rollback es devolver el registro A a `23.227.38.65`.
