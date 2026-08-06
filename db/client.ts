// db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// The pool is cached on globalThis. Next re-evaluates modules on hot reload and
// across build workers, and without this every re-evaluation opened ANOTHER pool
// while the old ones kept their connections: the Supabase pooler ends up
// saturated and queries start coming back as "canceling statement due to
// statement timeout" even though the database itself is idle.
const globalForDb = globalThis as unknown as {
  mmQueryClient?: ReturnType<typeof postgres>;
};

// `prepare: false` is required against Supabase's pooled connection (Supavisor,
// transaction mode on port 6543) — transaction-mode poolers don't support
// prepared statements, and postgres-js defaults to using them.
const queryClient =
  globalForDb.mmQueryClient ??
  postgres(process.env.DATABASE_URL, {
    prepare: false,
    // Small on purpose: serverless instances and build workers each hold a pool.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
  });

globalForDb.mmQueryClient = queryClient;

export const db = drizzle(queryClient, { schema });
