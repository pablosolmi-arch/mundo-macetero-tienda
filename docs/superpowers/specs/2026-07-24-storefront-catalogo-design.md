# Fase 1 — Storefront + Catálogo (Mundo Macetero)

## Contexto

`mundomacetero.cl` corre hoy en Shopify. Las ventas cayeron por dos motivos combinados: baja de tráfico y baja de conversión; un intento previo de SEO dentro de Shopify no dio resultado. El objetivo de negocio es dejar de pagar la mensualidad base de Shopify (~USD 30/mes) sin perder nada de lo que Shopify ofrece hoy: sitio público, gestión de pedidos, monitoreo de eventos/visitas.

Este proyecto se descompuso en 5 fases independientes. Este spec cubre **solo la Fase 1**: el sitio público y el catálogo de productos. Checkout/pagos (Fase 2), gestión de pedidos + Trello (Fase 3), analytics (Fase 4) y el corte de dominio (Fase 5) son specs separados que se construyen después, sobre esta base.

Ya existe un activo reutilizable como referencia: el theme Shopify fue exportado (`~/Downloads/mundomacetero-theme/`, formato Liquid) incluyendo una versión "SEO optimizado" que el usuario ya había intentado. Un theme Liquid no corre fuera de Shopify (depende de su motor de renderizado, checkout y APIs), así que se usa como **referencia de diseño y contenido**, no como código a reutilizar.

## Alcance de la Fase 1

Incluye:
- Sitio público (home, listado de categoría, ficha de producto) en Next.js, desplegado en Vercel
- Base de datos de catálogo (productos, variantes, precios, stock, categorías, imágenes)
- Migración del catálogo actual desde el export CSV de Shopify
- SEO técnico y GEO desde el día uno

No incluye (quedan para specs posteriores):
- Carrito y checkout (Fase 2)
- Cobro con Flow (Fase 2)
- Panel de gestión de pedidos e integración con Trello/Agente Arquipol (Fase 3)
- Analytics de eventos/conversión (Fase 4)
- Corte de DNS del dominio `mundomacetero.cl` (Fase 5) — hasta entonces, este sitio se despliega en un dominio de prueba (`*.vercel.app`)

## Arquitectura

- **Frontend/backend**: Next.js (App Router), desplegado en Vercel.
- **Base de datos**: Postgres provisionado vía Supabase (Vercel Marketplace, `vercel integration add`), no una simulación ni datos de ejemplo.
- **Imágenes de producto**: se migran a Vercel Blob. (Alternativa evaluada: dejarlas en el CDN de Shopify — se descarta porque depende de que la cuenta de Shopify siga activa; al cancelar el plan pago, esas URLs podrían dejar de servir.)
- **Estilo visual**: se reconstruyen home, colección y ficha de producto en React/Tailwind, usando el theme exportado como referencia de layout, textos y fotografía — no como código.

## Modelo de datos (alto nivel)

- `products`: id, slug, nombre, descripción, precio, categoría, imágenes, stock, estado (activo/archivado)
- `product_variants`: id, product_id, nombre de variante (ej. tamaño/color), precio propio si difiere, stock propio
- `categories`: id, slug, nombre

No se modela `orders` en esta fase — eso pertenece a la Fase 2/3, cuando exista checkout.

## Migración de catálogo

1. Exportar el catálogo completo desde el admin de Shopify (Products → Export → CSV, todos los productos).
2. Script de importación puebla `products`/`product_variants`/`categories` a partir del CSV.
3. Verificación de integridad: el conteo de productos importados debe ser exactamente igual al conteo de filas de producto del CSV original (no un subconjunto ni una muestra).

## SEO y GEO

- Metadata dinámica (`title`, `description`, Open Graph) generada por producto y por categoría a partir de sus datos reales.
- `sitemap.xml` autogenerado a partir del catálogo en base de datos.
- Datos estructurados JSON-LD (`Product`, `Offer`, `BreadcrumbList`) en cada ficha de producto.
- Contenido de producto redactado de forma clara y autocontenida (preguntas frecuentes, especificaciones) pensando en que motores de IA (GEO) puedan citarlo con precisión, no solo en ranking clásico de Google.
- Se dejan preparadas (no activadas) las reglas de redirect 301 de las URLs actuales de Shopify hacia las nuevas — se activan recién en la Fase 5, cuando se corte el DNS.

## Criterios de éxito

- El sitio en Vercel muestra el 100% de los productos activos migrados, con precio, descripción, fotos y stock correctos.
- Cada ficha de producto pasa validación de rich results de Google (structured data sin errores).
- El sitio carga con buen Core Web Vitals (LCP/CLS) en mobile, verificado con Lighthouse.

## Fuera de alcance / riesgos conocidos

- Hasta que no se conecte la Fase 4 (analytics), no hay forma de comparar tráfico/conversión contra el sitio Shopify actual — la comparación real solo es posible después del corte de dominio.
- La causa raíz de la caída de tráfico (orgánico vs. conversión) no está diagnosticada todavía; se recomienda revisar Search Console/GA4 en paralelo (Fase 0) para no repetir el mismo error de SEO.
