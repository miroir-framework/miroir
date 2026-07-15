import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-react",
    globals: true,
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
