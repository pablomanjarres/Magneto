import { readFileSync } from "node:fs";
import { Pool } from "pg";

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://moonlight:moonlight@localhost:5433/moonlight";

export const pool = new Pool({ connectionString });

export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
