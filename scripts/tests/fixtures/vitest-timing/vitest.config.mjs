// #318 fixture: a tiny vitest project whose timings are known (see test_run_nonreg.py).
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { miroirTestTimingConfig } from "../../../vitest/timing.mjs";

export default defineConfig({
  test: {
    root: path.dirname(fileURLToPath(import.meta.url)),
    include: ["*.fixture.test.mjs"],
    watch: false,
    ...miroirTestTimingConfig(),
  },
});
