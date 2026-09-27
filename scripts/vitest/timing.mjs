// #318: opt-in timing profile for vitest runs (see docs/reference/testing.md, "Timings").
//
// Package vitest configs spread `miroirTestTimingConfig()` into `test`. It adds the timing
// runner only when MIROIR_TEST_TIMING=1, so a default run is unchanged.
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIMING_RUNNER_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "timingRunner.mjs",
);

export function isMiroirTestTimingEnabled(env = process.env) {
  return env.MIROIR_TEST_TIMING === "1";
}

/** Extra `test` config for vitest: `{ runner }` when timing is on, `{}` otherwise. */
export function miroirTestTimingConfig(env = process.env) {
  return isMiroirTestTimingEnabled(env) ? { runner: TIMING_RUNNER_PATH } : {};
}
