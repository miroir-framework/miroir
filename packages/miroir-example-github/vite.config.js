/// <reference types="vitest" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const miroirCoreRoot = path.resolve(packageRoot, "../miroir-core");

export default defineConfig({
  resolve: {
    alias: {
      "@miroir-framework/core/model-validation-fs": path.resolve(
        miroirCoreRoot,
        "src/5_tests/ModelValidationToolsFilesystem.ts",
      ),
      // #652: core's sources import the meta-model packages; the subpaths reach the same modules
      "@miroir-framework/core/meta-model": "miroir-app-miroir",
      "@miroir-framework/core/admin": "miroir-app-admin",
      "@miroir-framework/core": path.resolve(miroirCoreRoot, "src/index.ts"),
    },
  },
  test: {
    root: ".",
    include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    globals: true,
    watch: false,
  },
});
