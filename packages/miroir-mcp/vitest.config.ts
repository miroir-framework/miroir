import { defineConfig } from "vitest/config";

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
  },
});
