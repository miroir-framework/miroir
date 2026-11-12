/**
 * @miroir-framework/versioning (#696): application versioning, out of core. A process with the
 * `versioning` capability loads it on first use (the freeze, the evolution trace records), through the lazy
 * registration of core (`registerLazyActionImplementations`): never import it statically from a host.
 */
import type { ActionImplementationHandler } from "@miroir-framework/core";

import { handleAction_appendEvolutionTraceRecord } from "./evolutionTraceRecords.js";
import { handleAction_freezeApplicationVersion } from "./freezeApplicationVersion.js";

/** The action implementations of the package, by the `inMemoryImplementationFunctionName` of their Endpoint action. */
export const actionImplementations: Record<string, ActionImplementationHandler> = {
  handleAction_freezeApplicationVersion,
  handleAction_appendEvolutionTraceRecord,
};

export { handleAction_freezeApplicationVersion };
export * from "./applicationVersionFreeze.js";
export * from "./evolutionTraceRecords.js";
