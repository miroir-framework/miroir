/**
 * Testbed reset policy of a MiroirTestSuite for CLI integ runs (#318).
 *
 * `perTest` (the default) resets the testbed before every test. `perSuite` resets it once per
 * suite, for suites whose tests do not modify it. Runs from the UI ignore the policy and always
 * reset per test.
 */
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type TestbedResetPolicy = NonNullable<MiroirTestSuite["testbedReset"]>;

export function resolveSuiteTestbedReset(suite: MiroirTestSuite): TestbedResetPolicy {
  return suite.testbedReset ?? "perTest";
}

/** One launch running several suites with a single session: `perSuite` only if all are. */
export function resolveSuitesTestbedReset(suites: MiroirTestSuite[]): TestbedResetPolicy {
  if (suites.length === 0) {
    return "perTest";
  }
  return suites.every((suite) => resolveSuiteTestbedReset(suite) === "perSuite")
    ? "perSuite"
    : "perTest";
}

/**
 * Wraps a testbed reset for a `beforeEach` hook. With `perSuite`, the reset runs only when the
 * scope key (the suite of the current test) differs from the one of the last successful reset.
 */
export function withTestbedResetPolicy(
  policy: TestbedResetPolicy,
  reset: (scopeKey?: string) => Promise<void>,
): (scopeKey?: string) => Promise<void> {
  if (policy === "perTest") {
    return reset;
  }
  let lastResetScope: { key: string | undefined } | undefined;
  return async (scopeKey?: string) => {
    if (lastResetScope && lastResetScope.key === scopeKey) {
      return;
    }
    lastResetScope = undefined;
    await reset(scopeKey);
    lastResetScope = { key: scopeKey };
  };
}
