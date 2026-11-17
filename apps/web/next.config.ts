import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// Next only reads env files from apps/web; the project keeps one at the repository root.
const rootEnv = resolve(process.cwd(), "..", "..", ".env.local");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// The workspace packages ship TypeScript source, so Next compiles them itself.
const config: NextConfig = {
  transpilePackages: ["@moonlight/core", "@moonlight/db", "@moonlight/types"],

  // Next runs from apps/web; the files it traces live across the whole monorepo.
  outputFileTracingRoot: resolve(process.cwd(), "..", ".."),

  // Those packages are ESM, so their relative imports carry the ".js" extension
  // Node requires. Next has to map each one back to the ".ts" file it means.
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default config;
