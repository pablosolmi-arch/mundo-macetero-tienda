CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"telefono" text DEFAULT '' NOT NULL,
	"empresa" text DEFAULT '' NOT NULL,
	"detalle" text DEFAULT '' NOT NULL,
	"mensaje" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_label" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "entrega" text DEFAULT 'retiro' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_region" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note" text DEFAULT '' NOT NULL;