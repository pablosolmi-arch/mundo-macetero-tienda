CREATE TABLE "discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"tipo" text DEFAULT 'porcentaje' NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"expira_en" timestamp,
	"max_usos" integer,
	"usos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discounts_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "origen" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "track_stock" boolean DEFAULT false NOT NULL;