// vitest.setup.ts
// Vitest doesn't get .env.local auto-loaded the way Next.js runtime does,
// so load it explicitly here for tests that need DATABASE_URL etc.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
