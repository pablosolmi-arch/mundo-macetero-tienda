// One-off runner for a real catalog import. Loads .env.local (Node/tsx don't
// auto-load it the way Next.js does) so DATABASE_URL and BLOB_READ_WRITE_TOKEN
// are available, THEN dynamically imports the catalog module — a static import
// would be hoisted and evaluate db/client.ts (which reads DATABASE_URL at load)
// before dotenv runs. Usage: tsx scripts/run-import.ts <path-to-csv>
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("usage: tsx scripts/run-import.ts <path-to-csv>");
    process.exit(1);
  }
  const { importCatalogFromCsv } = await import("./import-catalog");
  const result = await importCatalogFromCsv(csvPath);
  console.log("IMPORT_OK", JSON.stringify(result));
  process.exit(0);
}

main().catch((err) => {
  console.error("IMPORT_FAIL", err);
  process.exit(1);
});
