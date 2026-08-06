// db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// The pool is cached on globalThis: Next re-evaluates modules on hot reload, and
// without this each re-evaluation opened another pool while the previous ones
// kept their connections.
const globalForDb = globalThis as unknown as {
  mmQueryClient?: ReturnType<typeof postgres>;
};

// `prepare: false` is required against Supabase's pooled connection (Supavisor,
// transaction mode on port 6543) — transaction-mode poolers don't support
// prepared statements, and postgres-js defaults to using them.
//
// Do NOT lower `max` here. Capping the pool made prerendering deadlock: exactly
// `max` pages would render and every page after that waited forever for a
// connection, surfacing as "canceling statement due to statement timeout".
const queryClient =
  globalForDb.mmQueryClient ?? postgres(process.env.DATABASE_URL, { prepare: false });

globalForDb.mmQueryClient = queryClient;

export const db = drizzle(queryClient, { schema });
