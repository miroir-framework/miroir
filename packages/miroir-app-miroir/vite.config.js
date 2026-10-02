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
      "miroir-core": path.resolve(miroirCoreRoot, "src/index.ts"),
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
