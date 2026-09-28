import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-env",
    environment: "node",
    testTimeout: 30000,
  },
});
