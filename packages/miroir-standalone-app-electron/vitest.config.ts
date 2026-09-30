import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "miroir-standalone-app-electron",
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 120000,
  },
});
