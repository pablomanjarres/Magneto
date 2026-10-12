import { readFileSync } from "node:fs";
import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

export const pool = new Pool({ connectionString });

// An idle client dying (a Postgres restart, a killed backend) emits 'error' on
// the pool; with no listener EventEmitter rethrows and takes the process down.
// The pool already discards the broken client, so logging is the whole fix.
pool.on("error", (error) => console.error("pg pool error", error));

export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
