ALTER TABLE "product_variants" ADD COLUMN "option1" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "option2" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "option3" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "available" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "option_names" text[] DEFAULT '{}' NOT NULL;