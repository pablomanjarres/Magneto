import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { pool } from "./pool.js";

// Every .sql file in migrations/, in filename order. Each one is written to be
// re-runnable, so there is no ledger table to keep in sync.
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  await pool.query(readFileSync(join(dir, file), "utf8"));
  console.log(`migrated ${file}`);
}

await pool.end();
