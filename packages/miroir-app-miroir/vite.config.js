/// <reference types="vitest" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const miroirCoreRoot = path.resolve(packageRoot, "../miroir-core");

export default defineConfig({
  resolve: {
    alias: {
      // #652: core's sources import the meta-model packages; the subpaths reach the same modules
      "@miroir-framework/core/meta-model": "miroir-app-miroir",
      "@miroir-framework/core/admin": "miroir-app-admin",
      "@miroir-framework/core": path.resolve(miroirCoreRoot, "src/index.ts"),
    },
  },
  test: {
    // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
    ...miroirTestTimingConfig(),
    root: "./tests",
    globals: true,
    watch: false,
  },
});
