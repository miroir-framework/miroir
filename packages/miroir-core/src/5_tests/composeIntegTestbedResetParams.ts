/**
 * Composed playfield + init triple for integ testbed reset (#258 slice 1).
 * Canonical type for registry compose → session → resetIntegTestbed.
 */
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type { SuitePlayfieldSeed } from "./resolveSuitePlayfieldSeed.js";

export type IntegTestbedResetParams = {
  testbedModel: SuitePlayfieldSeed["testbedModel"];
  testbedEntitiesAndInstances: SuitePlayfieldSeed["testbedEntitiesAndInstances"];
  testbedInitApplicationParameters: InitApplicationParameters;
};

/**
 * Merge suite/config playfield (model + instances) with registry init params.
 */
export function composeIntegTestbedResetParams(
  playfieldSeed: SuitePlayfieldSeed,
  testbedInitApplicationParameters: InitApplicationParameters,
): IntegTestbedResetParams {
  return {
    testbedModel: playfieldSeed.testbedModel,
    testbedEntitiesAndInstances: playfieldSeed.testbedEntitiesAndInstances,
    testbedInitApplicationParameters,
  };
}
