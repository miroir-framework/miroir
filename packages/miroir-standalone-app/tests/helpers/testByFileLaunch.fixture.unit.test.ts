import { describe, expect, it } from "vitest";

/**
 * Fixture for `testByFileLaunch.integ.test.ts` (#307): three failing cases, run only when
 * that test launches `testByFile` with MIROIR_TEST_BY_FILE_FIXTURE=1; skipped otherwise.
 */
describe.skipIf(process.env.MIROIR_TEST_BY_FILE_FIXTURE !== "1")("testByFile fixture", () => {
  it("fixture case one", () => expect(1).toBe(2));
  it("fixture case two", () => expect(1).toBe(2));
  it("fixture case three", () => expect(1).toBe(2));
});
