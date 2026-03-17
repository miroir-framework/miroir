/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    root: "./tests",
    globals: true,
    watch: false,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
