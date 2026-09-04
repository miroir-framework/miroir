/**
 * Resolve testbed init params from a MiroirTestSuite literal ref (#258 slice 2).
 */
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite } from "./runnerTestSuiteResolve.js";

export type TestbedInitApplicationParametersRef = NonNullable<
  MiroirTestSuite["testbedInitApplicationParameters"]
>;

type MiroirTestSuiteWithInitRef = MiroirTestSuite;

export function resolveSuiteTestbedInitApplicationParameters(
  suite: MiroirTestSuite,
  getInitApplicationParameters: (
    ref: TestbedInitApplicationParametersRef,
  ) => InitApplicationParameters,
): InitApplicationParameters | null {
  if (resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(suite)) {
    return null;
  }

  const ref = (suite as MiroirTestSuiteWithInitRef).testbedInitApplicationParameters;
  if (ref === undefined) {
    throw new Error(
      `MiroirTestSuite "${suite.miroirTestLabel}" is missing testbedInitApplicationParameters`,
    );
  }

  return getInitApplicationParameters(ref);
}
