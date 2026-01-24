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
