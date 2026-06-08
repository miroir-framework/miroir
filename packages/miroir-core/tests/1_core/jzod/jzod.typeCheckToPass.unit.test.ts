/**
 * @deprecated Cases live in transformerTestSuite_jzodTypeCheck (deployment entity).
 * Run: npx vitest run tests/1_core/jzod/jzodTypeCheck.test.ts
 * Kept so RUN_TEST=jzod.typeCheckToPass.unit.test still resolves for CI filters.
 */
import * as vitest from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const deprecatedName = "jzod.typeCheckToPass.unit.test";

if (RUN_TEST && RUN_TEST !== deprecatedName) {
  vitest.test.skip(`${deprecatedName} skipped — use jzodTypeCheck.test.ts`, () => {});
} else {
  await import("./jzodTypeCheck.test");
}
