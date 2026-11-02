import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "create-app",
    environment: "node",
    testTimeout: 30000,
  },
});
