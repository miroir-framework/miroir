/**
 * @miroir-framework/versioning (#696): application versioning, out of core. A process with the
 * `versioning` capability loads it on first use (the freeze, the evolution traces), through the lazy registration of core
 * (`registerLazyActionImplementations`): never import it statically from a host.
 */
import type { ActionImplementationHandler } from "@miroir-framework/core";

import { recordEvolutionTrace } from "./evolutionTraceRecorder.js";
import { handleAction_appendEvolutionTraceRecord } from "./evolutionTraceRecords.js";
import { handleAction_freezeApplicationVersion } from "./freezeApplicationVersion.js";

/** The action implementations of the package, by the `inMemoryImplementationFunctionName` of their Endpoint action. */
export const actionImplementations: Record<string, ActionImplementationHandler> = {
  handleAction_freezeApplicationVersion,
  handleAction_appendEvolutionTraceRecord,
};

/** #696: the evolution trace recorder core calls after its cheap checks. */
export const evolutionTraceRecorder = recordEvolutionTrace;

export { handleAction_freezeApplicationVersion, recordEvolutionTrace };
export * from "./applicationVersionFreeze.js";
export * from "./evolutionTraceCompaction.js";
export * from "./evolutionTraceRecords.js";
export * from "./evolutionTraceDefVersion.js";
export * from "./evolutionTraceRuntime.js";
export * from "./evolutionTraceWriter.js";
