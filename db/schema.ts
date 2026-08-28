// db/schema.ts
import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  images: text("images").array().notNull().default([]),
  // Versión de 600 px de cada imagen, en el mismo orden que `images`. Las tarjetas
  // y los mosaicos se ven entre 190 y 340 px: servirles el archivo de 1200 px
  // multiplicaba por cuatro el peso de la portada sin ganancia visible.
  thumbs: text("thumbs").array().notNull().default([]),
  stock: integer("stock").notNull().default(0),
  // El importador solo trae disponible/no disponible (stock 1/0), no cantidades.
  // Descontar sobre esos valores agotaría todo tras la primera venta, así que el
  // seguimiento de inventario se activa por producto cuando el equipo cargue
  // cantidades reales; hasta entonces manda el flag `available` de la variante.
  trackStock: boolean("track_stock").notNull().default(false),
  status: text("status").notNull().default("active"),
  // Names of the option axes, in order: ["Tamaño", "Color", "Drenaje"]. A product
  // sold in a single configuration has an empty array.
  optionNames: text("option_names").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One row per sellable COMBINATION of options, not per option value. Collapsing
// these to a single axis (as the first CSV import did) silently removed colour and
// drainage choices from 13 of 23 products, so combinations customers can buy on the
// current store could not be bought here at all.
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  // Full combination label, e.g. "Diámetro 50cm x Alto 40cm / Negro / Con doble fondo".
  name: text("name").notNull(),
  // The chosen value on each axis, aligned with products.optionNames.
  option1: text("option1"),
  option2: text("option2"),
  option3: text("option3"),
  priceOverride: numeric("price_override", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  // Whether this combination can currently be bought.
  available: boolean("available").notNull().default(true),
});

// An order is created as 'pending' before the customer is sent to Flow, so the
// cart and shipping details survive even if the payment is abandoned or Flow's
// confirmation callback never arrives. Only Flow's confirmation moves it to
// 'paid' — see app/api/checkout/confirm/route.ts.
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  // Our own reference, sent to Flow as `commerceOrder` and used to reconcile.
  commerceOrder: text("commerce_order").notNull().unique(),
  status: text("status").notNull().default("pending"),
  // Every money column below is recomputed server-side; never a client figure.
  // `amount` is what Flow is asked to charge: subtotal - discount + shipping.
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountCode: text("discount_code"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  shippingLabel: text("shipping_label").notNull().default(""),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("CLP"),
  // 'retiro' (store pickup) or 'despacho' (delivery).
  entrega: text("entrega").notNull().default("retiro"),
  // 'web' (checkout de la tienda) o 'manual' (creado desde el panel).
  origen: text("origen").notNull().default("web"),
  // Pasarela que cobró: 'mercadopago' | 'flow' | 'manual' (transferencia). Decide
  // contra quién se hace un reembolso.
  gateway: text("gateway").notNull().default("flow"),
  customerName: text("customer_name").notNull().default(""),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  shippingCity: text("shipping_city").notNull().default(""),
  shippingRegion: text("shipping_region").notNull().default(""),
  note: text("note").notNull().default(""),
  flowToken: text("flow_token"),
  flowOrder: text("flow_order"),
  paymentMedia: text("payment_media"),
  paidAt: timestamp("paid_at"),
  // Estado logístico, independiente del estado del pago: un pedido pagado puede
  // estar por preparar, entregado o cancelado.
  fulfillment: text("fulfillment").notNull().default("pendiente"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  // Reembolsos: monto acumulado devuelto y referencia de Flow.
  refundedAmount: numeric("refunded_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  refundedAt: timestamp("refunded_at"),
  refundReference: text("refund_reference"),
  // Correlativo humano del pedido (1, 2, 3…), independiente de commerceOrder. Se
  // muestra como "#7-25/08" (correlativo + día/mes de creación). Lo asigna la
  // secuencia `orders_numero_seq` al crear el pedido.
  numero: integer("numero").unique(),
  // Estado logístico intermedio: el pedido está armado y listo para entregar.
  preparadoAt: timestamp("preparado_at"),
  // Origen de la visita que terminó comprando: mismo sessionId anónimo que
  // site_events, y el canal/fuente/campaña del primer contacto de esa sesión.
  sessionId: text("session_id"),
  origenCanal: text("origen_canal"),
  origenFuente: text("origen_fuente"),
  origenCampana: text("origen_campana"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Line items snapshot the name and price at purchase time: the catalog is
// re-imported from Shopify regularly, so live product rows cannot be trusted to
// still describe what the customer actually bought.
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  // Acabado elegido en la ficha (ver content/terminaciones.ts). Va también pegado
  // al final de `variantName`, porque el correo al cliente, la hoja de impresión y
  // el panel imprimen ese campo por línea; esta columna guarda el dato limpio para
  // poder consultarlo, y "Decidir más tarde" es lo que gatilla el aviso de
  // terminación pendiente en el panel. Nulo en los pedidos anteriores a la
  // pregunta: no se les puede inventar un acabado que nadie eligió.
  terminacion: text("terminacion"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  qty: integer("qty").notNull(),
});

// Enquiries from the advice / your-space / professional-project forms. The design
// only flipped a local flag on submit, which would tell a customer "mensaje
// enviado" while nothing was sent anywhere; storing them makes that true.
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  // 'asesoria' | 'espacio' | 'proyecto'
  tipo: text("tipo").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  telefono: text("telefono").notNull().default(""),
  empresa: text("empresa").notNull().default(""),
  // Free-form answers, kept as one text blob per field label.
  detalle: text("detalle").notNull().default(""),
  mensaje: text("mensaje").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Códigos de descuento gestionables desde el panel (antes había uno solo fijo en
// el código). El checkout los valida SIEMPRE contra esta tabla en el servidor;
// `usos` se incrementa solo cuando el pedido queda pagado, para que un checkout
// abandonado no queme un cupo.
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  // 'porcentaje' (valor = %) o 'monto' (valor = CLP fijos)
  tipo: text("tipo").notNull().default("porcentaje"),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  expiraEn: timestamp("expira_en"),
  maxUsos: integer("max_usos"),
  usos: integer("usos").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Administración ---

// Cada persona del equipo con su cuenta, para que quede registro de quién marcó
// un pedido como entregado o lo canceló, y se pueda revocar un acceso sin
// cambiarle la clave a todos.
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull().default(""),
  // scrypt: "salt:hash" en hexadecimal. Nunca la clave en texto plano.
  passwordHash: text("password_hash").notNull(),
  rol: text("rol").notNull().default("staff"),
  activo: boolean("activo").notNull().default(true),
  // Freno a la fuerza bruta: tras varios fallos seguidos la cuenta queda
  // bloqueada un rato. En serverless no sirve un contador en memoria, así que
  // vive en la base.
  intentosFallidos: integer("intentos_fallidos").notNull().default(0),
  bloqueadoHasta: timestamp("bloqueado_hasta"),
  ultimoIngreso: timestamp("ultimo_ingreso"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sesiones en tabla (no un JWT) para poder cerrarlas del lado del servidor.
// `tokenHash` guarda el SHA-256 del token que viaja en la cookie: si alguien lee
// la base, no obtiene sesiones utilizables.
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiraEn: timestamp("expira_en").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Enlaces de "olvidé mi clave". Igual que las sesiones, se guarda solo el
// SHA-256 del token que viaja en el correo: si alguien lee la base, no puede
// armar el enlace. `usadoEn` deja el token de un solo uso y las filas viejas
// sirven de freno: más de unas pocas solicitudes por hora no crean otra.
export const adminPasswordResets = pgTable("admin_password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiraEn: timestamp("expira_en").notNull(),
  usadoEn: timestamp("usado_en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bitácora de lo que se hace sobre un pedido: quién, qué y cuándo.
export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  userId: integer("user_id").references(() => adminUsers.id),
  // 'entregado' | 'cancelado' | 'reembolsado' | 'nota' | 'pago'
  tipo: text("tipo").notNull(),
  detalle: text("detalle").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Eventos de la tienda para medir el embudo real: visita → ficha → carrito →
// checkout → pago. Sin datos personales: solo un identificador de sesión anónimo.
export const siteEvents = pgTable("site_events", {
  id: serial("id").primaryKey(),
  // 'visita' | 'producto' | 'agregar' | 'checkout' | 'pago'
  tipo: text("tipo").notNull(),
  path: text("path").notNull().default(""),
  productSlug: text("product_slug"),
  // Identificador aleatorio de la sesión del visitante, no ligado a una persona.
  sessionId: text("session_id").notNull().default(""),
  // Monto en los eventos de pago, para calcular ingresos por origen.
  monto: numeric("monto", { precision: 12, scale: 2 }),
  referrer: text("referrer").notNull().default(""),
  // Atribución del primer contacto de la sesión, calculada en el navegador a
  // partir de utm_* y del referrer: canal ('directo' | 'busqueda' | 'social' |
  // 'pagado' | 'referido' | 'correo'), fuente (google, instagram, un dominio…),
  // campaña (utm_campaign) y dispositivo ('movil' | 'escritorio' | 'tablet').
  canal: text("canal"),
  fuente: text("fuente"),
  campana: text("campana"),
  dispositivo: text("dispositivo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Discount = typeof discounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
