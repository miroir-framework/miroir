import { defineConfig } from "vitest/config";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

export default defineConfig({
  test: {
    // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
    ...miroirTestTimingConfig(),
    name: "miroir-mcp",
    globals: true,
    environment: "node",
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Vitest 3 defaults to the "forks" pool, which runs test FILES in parallel processes.
    // Integration files share on-disk stores (.miroir/<test environment>/) and ports, so they MUST run
    // sequentially: one worker.
    pool: "threads",
    maxWorkers: 1,
  },
});
