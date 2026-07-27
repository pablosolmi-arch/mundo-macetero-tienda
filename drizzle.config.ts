// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Node scripts (drizzle-kit) don't get .env.local auto-loaded the way Next.js
// runtime does, so load it explicitly here. `quiet: true` suppresses dotenv's
// promotional console tip so tool output stays clean.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
