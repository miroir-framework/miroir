import { defineConfig } from "vitest/config";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

export default defineConfig({
  test: {
    // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
    ...miroirTestTimingConfig(),
    name: "miroir-ai",
    globals: true,
    environment: "node",
    setupFiles: [],
    testTimeout: 10000,
    hookTimeout: 10000,
    // #627: integration files share the on-disk stores of a test environment (.miroir/<environment>/),
    // so test files run one at a time, as in miroir-mcp
    pool: "threads",
    maxWorkers: 1,
  },
});
