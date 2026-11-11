/**
 * #696: records the evolution trace of a model or instance write, moved out of core's DomainController.
 * Core calls it after its cheap checks (traces enabled, a traceable action type, a known deployment, the
 * `versioning` capability on), so a process that records no trace never loads this package. The writers
 * are those of before #696: a client and its server each record what they handle.
 *
 * Trace instances live in the evolving application's model section, or in data for Miroir (#222). A write
 * of the trace Entities themselves records nothing.
 */
import {
  Action2Error,
  MiroirLoggerFactory,
  type EvolutionTraceRecorder,
  type LoggerInterface,
} from "@miroir-framework/core";

import { buildEvolutionTracePersistenceActions, collectEvolutionTraceStateFromDomainState } from "./evolutionTraceRuntime.js";
import type { EvolutionTraceableAction } from "./evolutionTraceWriter.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("miroir-versioning", "3", "evolutionTraceRecorder");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export const recordEvolutionTrace: EvolutionTraceRecorder = async (
  host,
  action,
  applicationDeploymentMap,
  commitContext,
) => {
  const targetApplicationUuid = action.payload.application;
  const targetDeploymentUuid = applicationDeploymentMap[targetApplicationUuid];
  if (!targetDeploymentUuid) {
    return;
  }
  const existing = collectEvolutionTraceStateFromDomainState(
    host.asDomainControllerInterface().getDomainState(),
    targetDeploymentUuid,
    targetApplicationUuid,
  );
  const persistenceActions = buildEvolutionTracePersistenceActions(
    action as EvolutionTraceableAction,
    existing,
    undefined,
    new Date(),
    commitContext,
  );
  for (const persistenceAction of persistenceActions) {
    const result = await host.handleInstanceAction(persistenceAction, applicationDeploymentMap);
    if (result instanceof Action2Error) {
      log.warn("recordEvolutionTrace failed to persist trace action", persistenceAction.actionLabel, result);
    }
  }
};
