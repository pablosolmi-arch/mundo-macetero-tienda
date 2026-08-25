ALTER TABLE "orders" ADD COLUMN "numero" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preparado_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "origen_canal" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "origen_fuente" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "origen_campana" text;--> statement-breakpoint
ALTER TABLE "site_events" ADD COLUMN "canal" text;--> statement-breakpoint
ALTER TABLE "site_events" ADD COLUMN "fuente" text;--> statement-breakpoint
ALTER TABLE "site_events" ADD COLUMN "campana" text;--> statement-breakpoint
ALTER TABLE "site_events" ADD COLUMN "dispositivo" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_numero_unique" UNIQUE("numero");
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "orders_numero_seq" START 1;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "numero" SET DEFAULT nextval('orders_numero_seq');
--> statement-breakpoint
UPDATE "orders" SET "numero" = nextval('orders_numero_seq') WHERE "numero" IS NULL;
