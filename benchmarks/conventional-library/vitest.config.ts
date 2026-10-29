import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // The tests share prisma/dev.db: run the files one after the other.
    fileParallelism: false,
  },
});
