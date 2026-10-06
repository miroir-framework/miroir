import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-cli",
    globals: true,
    environment: "node",
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Test files share the test environment's stores (.miroir/<environment>/), reseeded per file.
    fileParallelism: false,
  },
});
