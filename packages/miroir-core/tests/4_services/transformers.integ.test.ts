/**
 * @deprecated Prefer: `npm run testMiroir -- --suites miroirCoreTransformers --mode integration`
 * Keeps `RUN_TEST=transformers.integ.test` and `testByFile -- transformers.integ` working.
 */
import * as vitest from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const testSuiteName = "transformers.integ.test";

if (RUN_TEST !== undefined && RUN_TEST !== testSuiteName) {
  vitest.test.skip(
    `${testSuiteName} skipped (set RUN_TEST=${testSuiteName} to run)`,
    () => {},
  );
} else {
  process.env.MIROIR_TEST_SUITES ??= "miroirCoreTransformers";
  process.env.MIROIR_TEST_MODE = "integration";
  await import("../miroir-tests.integ.test");
}
