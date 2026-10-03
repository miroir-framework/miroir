import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-server",
    environment: "node",
    testTimeout: 30000,
  },
});
