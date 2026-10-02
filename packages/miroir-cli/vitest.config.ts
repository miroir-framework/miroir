import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-cli",
    globals: true,
    environment: "node",
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
