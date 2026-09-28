/// <reference types="vitest" />
import { defineConfig } from "vite";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

export default defineConfig({
  test: {
    // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
    ...miroirTestTimingConfig(),
    root: "./tests",
    globals: true,
    watch: false,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
