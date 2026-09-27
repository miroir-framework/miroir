import { defineConfig } from "vitest/config";
import { resolve } from "path";
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
    // Integration files share on-disk stores (tests/tmp) and ports, so they MUST run
    // sequentially: force the threads pool where singleThread below actually applies.
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    env: {
      MIROIR_MCP_CONFIG_PATH: resolve(__dirname, "tests/config.mcp-emulatedServer.json"),
    },
  },
});
