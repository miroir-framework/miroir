/**
 * Composed playfield + init triple for integ testbed reset (#258 slice 1).
 * Canonical type for registry compose → session → resetIntegTestbed.
 */
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion.js";
import { remapLibraryAppModelForRunTarget } from "../1_core/model/cloneApplication/remapApplicationModelAtPaths.js";
import { deepReplaceUuidStrings } from "./deepReplaceUuidStrings.js";
import type { SuitePlayfieldSeed } from "./resolveSuitePlayfieldSeed.js";
import type { TestbedUuids } from "./TestbedUuids.js";

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
 * #588: move the whole seed onto an ephemeral run target. The seed is written for the canonical
 * application (Library); the run target is a fresh application and deployment. The model is
 * remapped by {@link remapLibraryAppModelForRunTarget}; the init params (SelfApplication, branch,
 * version) and the instances get the same uuid replacement as the action leaves
 * (`remapActionTestLeafForRunTarget`), or actions that look the application up
 * (freezeApplicationVersion) do not find it. Returns `resetParams` itself on the canonical target.
 */
export function remapIntegTestbedResetParamsForRunTarget(
  resetParams: IntegTestbedResetParams,
  canonicalApplicationUuid: Uuid,
  canonicalDeploymentUuid: Uuid,
  runTarget: TestbedUuids,
): IntegTestbedResetParams {
  if (runTarget.applicationUuid === canonicalApplicationUuid) {
    return resetParams;
  }
  const toRunTarget = {
    [canonicalApplicationUuid]: runTarget.applicationUuid,
    [canonicalDeploymentUuid]: runTarget.deploymentUuid,
  };
  return {
    testbedModel: remapLibraryAppModelForRunTarget(
      resetParams.testbedModel,
      canonicalApplicationUuid,
      canonicalDeploymentUuid,
      runTarget,
    ),
    testbedEntitiesAndInstances: deepReplaceUuidStrings(resetParams.testbedEntitiesAndInstances, toRunTarget),
    testbedInitApplicationParameters: deepReplaceUuidStrings(
      resetParams.testbedInitApplicationParameters,
      toRunTarget,
    ),
  };
}
