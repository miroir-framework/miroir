import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-ai",
    globals: true,
    environment: "node",
    setupFiles: [],
    testTimeout: 10000,
    hookTimeout: 10000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
