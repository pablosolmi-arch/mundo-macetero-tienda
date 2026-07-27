// db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` is required against Supabase's pooled connection (Supavisor,
// transaction mode on port 6543, provisioned in Task 2) — transaction-mode
// poolers don't support prepared statements, and postgres-js defaults to using them.
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false });
export const db = drizzle(queryClient, { schema });
