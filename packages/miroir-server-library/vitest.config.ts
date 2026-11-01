import { defineConfig } from "vitest/config";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

export default defineConfig({
  test: {
    // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
    ...miroirTestTimingConfig(),
    name: "miroir-server-library",
    globals: true,
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 120000,
    // Integration files share on-disk stores (.miroir/<test environment>/): one worker, files in sequence.
    pool: "threads",
    maxWorkers: 1,
  },
});
