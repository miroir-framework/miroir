import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
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
