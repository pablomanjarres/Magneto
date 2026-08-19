import { resolve } from "node:path";
import type { NextConfig } from "next";

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
