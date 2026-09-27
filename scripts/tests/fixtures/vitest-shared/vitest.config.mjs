// #318 fixture: files for the shared runner tests in test_run_nonreg.py. The two leak files
// pass alone but interfere when they share module state (--no-isolate), like real files can.
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { miroirTestTimingConfig } from "../../../vitest/timing.mjs";

export default defineConfig({
  test: {
    root: path.dirname(fileURLToPath(import.meta.url)),
    include: ["*.fixture.test.mjs"],
    watch: false,
    pool: "threads",
    poolOptions: { threads: { singleThread: true } },
    ...miroirTestTimingConfig(),
  },
});
