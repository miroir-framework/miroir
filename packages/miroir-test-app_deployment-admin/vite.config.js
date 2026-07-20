/// <reference types="vitest" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const miroirCoreRoot = path.resolve(packageRoot, "../miroir-core");

export default defineConfig({
  resolve: {
    alias: {
      "miroir-core": path.resolve(miroirCoreRoot, "src/index.ts"),
    },
  },
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
