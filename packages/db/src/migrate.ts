import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { pool } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "migrations", "001_init.sql"), "utf8");

await pool.query(sql);
console.log("migrated: vacancies, vacancy_requirements, profiles");
await pool.end();
