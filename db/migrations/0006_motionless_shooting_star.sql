ALTER TABLE "admin_users" ADD COLUMN "intentos_fallidos" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "bloqueado_hasta" timestamp;