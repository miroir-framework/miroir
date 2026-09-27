import { describe, expect, it } from "vitest";

import {
  resolveSuiteTestbedReset,
  resolveSuitesTestbedReset,
  withTestbedResetPolicy,
} from "../../src/5_tests/testbedResetPolicy.js";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST || RUN_TEST === "testbedResetPolicy" || RUN_TEST === "testbedResetPolicy.unit.test";

function suite(testbedReset?: MiroirTestSuite["testbedReset"]): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: "s",
    ...(testbedReset ? { testbedReset } : {}),
    miroirTests: [],
  };
}

describe.runIf(shouldRun)("testbedResetPolicy (#318)", () => {
  it("defaults to perTest when the attribute is absent", () => {
    expect(resolveSuiteTestbedReset(suite())).toBe("perTest");
    expect(resolveSuiteTestbedReset(suite("perTest"))).toBe("perTest");
    expect(resolveSuiteTestbedReset(suite("perSuite"))).toBe("perSuite");
  });

  it("several suites are perSuite only when all of them are", () => {
    expect(resolveSuitesTestbedReset([suite("perSuite"), suite("perSuite")])).toBe("perSuite");
    expect(resolveSuitesTestbedReset([suite("perSuite"), suite()])).toBe("perTest");
    expect(resolveSuitesTestbedReset([])).toBe("perTest");
  });

  it("perTest resets on every call", async () => {
    let resets = 0;
    const reset = withTestbedResetPolicy("perTest", async () => {
      resets++;
    });
    await reset("a");
    await reset("a");
    await reset();
    expect(resets).toBe(3);
  });

  it("perSuite resets once per scope key", async () => {
    const scopes: (string | undefined)[] = [];
    const reset = withTestbedResetPolicy("perSuite", async (scope) => {
      scopes.push(scope);
    });
    await reset("a");
    await reset("a");
    await reset("b");
    await reset("b");
    await reset("a");
    expect(scopes).toEqual(["a", "b", "a"]);
  });

  it("perSuite without a scope key resets once", async () => {
    let resets = 0;
    const reset = withTestbedResetPolicy("perSuite", async () => {
      resets++;
    });
    await reset();
    await reset();
    expect(resets).toBe(1);
  });

  it("perSuite resets again after a failed reset", async () => {
    let calls = 0;
    const reset = withTestbedResetPolicy("perSuite", async () => {
      calls++;
      if (calls === 1) throw new Error("boom");
    });
    await expect(reset("a")).rejects.toThrow("boom");
    await reset("a");
    await reset("a");
    expect(calls).toBe(2);
  });
});
