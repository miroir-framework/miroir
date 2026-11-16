/**
 * @miroir-framework/versioning (#696): application versioning, out of core. A process with the
 * `versioning` capability loads it on first use (the freeze, the evolution trace records), through the lazy
 * registration of core (`registerLazyActionImplementations`): never import it statically from a host.
 */
import type { ActionImplementationHandler } from "@miroir-framework/core";

import { handleAction_appendEvolutionTraceRecord } from "./evolutionTraceRecords.js";
import {
  handleAction_checkStagedEvolutionTraces,
  handleAction_freezeApplicationVersion,
  handleAction_rebaselineEvolutionTraces,
} from "./freezeApplicationVersion.js";
import { handleAction_installApplicationVersion } from "./applicationVersionInstall.js";
import { handleAction_generateMigration } from "./migrationGeneration.js";
import { handleAction_runMigration } from "./migrationRun.js";

/** The action implementations of the package, by the `inMemoryImplementationFunctionName` of their Endpoint action. */
export const actionImplementations: Record<string, ActionImplementationHandler> = {
  handleAction_freezeApplicationVersion,
  handleAction_appendEvolutionTraceRecord,
  handleAction_rebaselineEvolutionTraces,
  handleAction_checkStagedEvolutionTraces,
  handleAction_installApplicationVersion, // #9
  handleAction_generateMigration, // #9
  handleAction_runMigration, // #9
};

export {
  handleAction_checkStagedEvolutionTraces,
  handleAction_freezeApplicationVersion,
  handleAction_rebaselineEvolutionTraces,
  HISTORY_ENTITIES,
} from "./freezeApplicationVersion.js";
export * from "./applicationVersionFreeze.js";
export * from "./applicationVersionInstall.js";
export * from "./deploymentRole.js";
export * from "./migrationGeneration.js";
export * from "./migrationRun.js";
export * from "./evolutionTraceAgreement.js";
export * from "./evolutionTraceRecords.js";
export * from "./modelStates.js";
export * from "./modelStateDiff.js";
