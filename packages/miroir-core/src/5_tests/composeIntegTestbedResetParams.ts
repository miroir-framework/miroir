/**
 * Composed playfield + init triple for integ testbed reset (#258 slice 1).
 * Canonical type for registry compose → session → resetIntegTestbed.
 */
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import { deepReplaceUuidStrings } from "./deepReplaceUuidStrings.js";
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

/**
 * #588: move the seed onto the application it initializes. A suite on an ephemeral run target
 * initializes a fresh application uuid with a seed written for the canonical one (Library); the
 * seeded SelfApplication, its branch, version and Entities must carry the run target's uuid, as
 * the remapped action leaves do, or actions that look the application up (freezeApplicationVersion)
 * do not find it. Returns `resetParams` itself when it already targets `applicationUuid`.
 */
export function rebindIntegTestbedResetParamsToApplication(
  resetParams: IntegTestbedResetParams,
  applicationUuid: Uuid,
): IntegTestbedResetParams {
  const seededApplicationUuid = resetParams.testbedInitApplicationParameters.selfApplication.uuid;
  if (seededApplicationUuid === applicationUuid) {
    return resetParams;
  }
  return deepReplaceUuidStrings(resetParams, { [seededApplicationUuid]: applicationUuid });
}
