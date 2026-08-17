import type { NextConfig } from "next";

// The workspace packages ship TypeScript source, so Next compiles them itself.
const config: NextConfig = {
  transpilePackages: ["@moonlight/core", "@moonlight/db", "@moonlight/types"],
};

export default config;
