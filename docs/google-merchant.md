# Google Merchant Center

El sitio publica un feed de productos en
`https://<dominio>/feeds/google-merchant.xml` (RSS 2.0 con el namespace `g:`).
Se genera solo, desde el catálogo activo: no hay que subir ni mantener planillas.

## 1. Crear la cuenta

1. Entrar a <https://merchants.google.com> con la cuenta de Google de la tienda.
2. Datos del negocio: nombre "Mundo Macetero", país Chile, moneda CLP.
3. En "Sitio web", declarar el dominio de la tienda (con `https://` y sin barra
   final).

## 2. Verificar y reclamar el dominio

Dos caminos; basta con uno.

- **Meta tag (recomendado, ya está implementado).** Merchant Center o Search
  Console entrega una "Etiqueta HTML" del tipo
  `<meta name="google-site-verification" content="XXXXX">`. Copiar solo el valor
  de `content` y cargarlo en Vercel como variable de entorno
  `GOOGLE_SITE_VERIFICATION` (Project Settings -> Environment Variables, en
  Production). Volver a desplegar y apretar "Verificar". Sin la variable, el meta
  tag no se emite.
- **Registro TXT en el DNS (cPanel).** Zone Editor -> Add Record -> tipo TXT,
  nombre el dominio raíz, valor el string que entrega Google. Propaga en minutos.

Después de verificar hay que apretar **Reclamar** (claim): la verificación dice
que el dominio es tuyo, el reclamo lo asocia a esta cuenta de Merchant Center.

## 3. Agregar el feed

1. Productos -> Fuentes de datos -> Agregar fuente de datos -> "Archivo".
2. URL: `https://<dominio>/feeds/google-merchant.xml`.
3. Nombre: "Catálogo Mundo Macetero". Sin usuario ni contraseña: el feed es
   público, Google lo lee por URL.
4. Frecuencia: **diaria**. La hora conviene fuera del horario de venta (por
   ejemplo 05:00 America/Santiago). El feed se sirve con caché de 6 horas en la
   CDN de Vercel, así que una lectura diaria siempre trae datos frescos.
5. Guardar y apretar "Obtener ahora" para la primera carga.

## 4. Envío y devoluciones

El feed **no declara `g:shipping`** a propósito. La regla real de la tienda es:
retiro gratis en Quilicura, despacho gratis solo en las comunas del sector
oriente de Santiago, y para el resto de la Región Metropolitana y otras regiones
el despacho lo cotiza un transportista externo después de la compra. Como ese
costo es variable y la tienda no lo puede calcular, declarar "0 CLP" por item
sería prometer despacho gratis a todo Chile.

Entonces el envío se configura en Merchant Center, que sí permite expresarlo por
región:

1. Herramientas y configuración -> Envíos y devoluciones -> Servicio de envío.
2. Un servicio "Despacho gratis sector oriente" con tarifa 0 para las comunas de
   Las Condes, Vitacura, Lo Barnechea, Providencia, La Reina, Ñuñoa y Peñalolén.
3. Un segundo servicio para el resto del país con una **tarifa plana estimada**
   (Google no acepta "se cotiza"). Conviene un monto que cubra el promedio real
   de los despachos y revisarlo cada cierto tiempo.
4. En Devoluciones, cargar la política y apuntar a
   `https://<dominio>/politicas`, que es donde vive el texto vigente.

Si cambian las comunas con despacho gratis, se ajustan en `content/site.ts`
(`ENVIO.comunasOriente`) **y** en Merchant Center: son dos lugares distintos.

## 5. Qué se envía y qué no

- Una entrada por **variante** vendible. Los productos con variantes se agrupan
  con `g:item_group_id` (el slug), y cada variante enlaza a su combinación ya
  seleccionada: `/producto/<slug>?variante=<id>`.
- Se excluyen los productos archivados, los que no tienen ninguna imagen y las
  variantes con precio 0: Google rechaza esos items de todas formas.
- `g:identifier_exists` va en `no` porque los maceteros son de fabricación propia
  y no tienen GTIN ni MPN.
- La disponibilidad es la misma que muestra la ficha: un producto sin
  seguimiento de inventario siempre va `in_stock` (se fabrica a pedido). Si el
  feed y la ficha se contradicen, Google desaprueba el item.

## 6. Si Google rechaza items

Los avisos salen en Productos -> Diagnóstico. Los casos típicos:

- **Imagen no válida o muy chica.** El mínimo es 100x100 px (250x250 para
  imágenes de ropa), sin marcas de agua ni texto encima. Se corrige subiendo otra
  foto al producto desde el panel.
- **Título o descripción con problemas.** Sin MAYÚSCULAS completas, sin texto
  promocional ("OFERTA", "envío gratis") y sin HTML. El título se recorta solo a
  150 caracteres y la descripción a 5000.
- **Falta información de envío.** Es el punto 4: se resuelve en Merchant Center,
  no en el feed.
- **Precio inconsistente con la página.** Pasa si el catálogo cambió y el feed
  todavía no se releyó. Apretar "Obtener ahora" en la fuente de datos.
- **Página de destino no disponible.** Revisar que el producto siga activo: uno
  archivado responde 404 y sale del feed en la lectura siguiente.
- **Dominio no reclamado.** Punto 2, la parte del "Reclamar".

La aprobación inicial de la cuenta puede tardar unos días hábiles.
