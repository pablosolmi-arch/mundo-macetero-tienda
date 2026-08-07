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
  stock: integer("stock").notNull().default(0),
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

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
