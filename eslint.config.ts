import js from "@eslint/js";
import tseslint from "typescript-eslint";

// TypeScript only. No .js or .jsx anywhere in this repo, including config:
// ESLint reads this .ts file through jiti (see the devDependency).
export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/.turbo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Program", message: "This repo is TypeScript only. Write it as .ts." },
      ],
    },
  },
);
