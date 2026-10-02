// #318 fixture config for suites-launcher.mjs (one entry file, one describe per suite).
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { miroirTestTimingConfig } from "../../../vitest/timing.mjs";

export default defineConfig({
  test: {
    root: path.dirname(fileURLToPath(import.meta.url)),
    include: ["suites.fixture.suites.mjs"],
    watch: false,
    pool: "threads",
    maxWorkers: 1,
    ...miroirTestTimingConfig(),
  },
});
