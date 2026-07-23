import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  ApplicationSection,
  InstanceCUDAction,
  ModelActionReplayableAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { shouldTraceEvolutionEvent } from "./evolutionTracePolicy.js";
import {
  resolveDefinitionVersionForTraceEvent,
  type ResolveDefinitionVersionInput,
} from "./evolutionTraceDefVersion.js";
import { EVOLUTION_TRACE_EVENT_ENTITY_UUID } from "./evolutionTraceBaseline.js";

export type EvolutionTraceableAction = ModelActionReplayableAction | InstanceCUDAction;

export type TraceEventResolutionContext = Pick<
  ResolveDefinitionVersionInput,
  "crossEntityLookup" | "warn"
>;

/** Optional commit / version stamps applied during model-commit replay. */
export type EvolutionTraceCommitContext = {
  commitUuid: string;
  fromVersionUuid: string;
  toVersionUuid: string;
};

function entityDefinitionUuidFromModelAction(
  action: ModelActionReplayableAction,
): string | undefined {
  switch (action.actionType) {
    case "createEntity":
      return action.payload.entities[0]?.entityDefinition?.uuid;
    case "renameEntity":
    case "dropEntity":
    case "alterEntityAttribute":
      return action.payload.entityDefinitionUuid;
  }
}

function applyDefinitionVersionResolution(
  event: ApplicationEvolutionTraceEvent,
  input: ResolveDefinitionVersionInput,
): ApplicationEvolutionTraceEvent {
  const resolved = resolveDefinitionVersionForTraceEvent(input);
  return {
    ...event,
    definitionVersionResolution: resolved.resolution,
    targetDefinitionVersionUuid: resolved.definitionVersionUuid,
  };
}

/**
 * Pure function: maps a model-level replayable action to a raw trace event.
 *
 * The caller is responsible for:
 * - providing a pre-existing or newly created ApplicationEvolutionTrace root
 * - supplying a monotonically increasing sequenceNumber within that root
 * - supplying the current timestamp
 *
 * ApplicationSection is always "model" because ModelActionReplayableAction
 * types only affect the model section by definition.
 */
export function createTraceEventFromModelAction(
  action: ModelActionReplayableAction,
  traceRoot: ApplicationEvolutionTrace,
  sequenceNumber: number,
  timestamp: string,
  resolutionContext?: TraceEventResolutionContext,
  commitContext?: EvolutionTraceCommitContext,
): ApplicationEvolutionTraceEvent {
  const base = {
    uuid: uuidv4(),
    parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
    traceRootUuid: traceRoot.uuid,
    sequenceNumber,
    operationType: action.actionType as ApplicationEvolutionTraceEvent["operationType"],
    applicationSection: "model" as const,
    compactionLevel: "raw" as const,
    timestamp,
    ...(commitContext
      ? {
          commitUuid: commitContext.commitUuid,
          fromVersionUuid: commitContext.fromVersionUuid,
          toVersionUuid: commitContext.toVersionUuid,
        }
      : {}),
  };

  let event: ApplicationEvolutionTraceEvent;
  switch (action.actionType) {
    case "createEntity":
      event = {
        ...base,
        targetEntityUuid: action.payload.entities[0]?.entity.uuid,
      };
      break;
    case "renameEntity":
    case "dropEntity":
    case "alterEntityAttribute":
      event = {
        ...base,
        targetEntityUuid: action.payload.entityUuid,
      };
      break;
  }

  return applyDefinitionVersionResolution(event, {
    entityDefinitionUuidFromPayload: entityDefinitionUuidFromModelAction(action),
    crossEntityLookup: resolutionContext?.crossEntityLookup
      ? {
          ...resolutionContext.crossEntityLookup,
          targetEntityUuid:
            resolutionContext.crossEntityLookup.targetEntityUuid ?? event.targetEntityUuid,
        }
      : undefined,
    warn: resolutionContext?.warn,
  });
}

/**
 * Pure function: maps an instance CUD action to a raw trace event.
 *
 * ApplicationSection is taken from the action payload (typically `"data"`;
 * Miroir may also carry model-level instances in the data section).
 */
export function createTraceEventFromInstanceAction(
  action: InstanceCUDAction,
  traceRoot: ApplicationEvolutionTrace,
  sequenceNumber: number,
  timestamp: string,
  resolutionContext?: TraceEventResolutionContext,
): ApplicationEvolutionTraceEvent {
  const firstObject = action.payload.objects[0];
  const event: ApplicationEvolutionTraceEvent = {
    uuid: uuidv4(),
    parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
    traceRootUuid: traceRoot.uuid,
    sequenceNumber,
    operationType: action.actionType as ApplicationEvolutionTraceEvent["operationType"],
    applicationSection: action.payload.applicationSection as "model" | "data",
    compactionLevel: "raw",
    timestamp,
    targetEntityUuid: firstObject?.parentUuid,
    targetInstanceUuid: firstObject?.uuid,
  };

  return applyDefinitionVersionResolution(event, {
    instance: firstObject
      ? {
          parentDefinitionVersionUuid: (
            firstObject as { parentDefinitionVersionUuid?: string }
          ).parentDefinitionVersionUuid,
        }
      : undefined,
    crossEntityLookup: resolutionContext?.crossEntityLookup
      ? {
          ...resolutionContext.crossEntityLookup,
          targetEntityUuid:
            resolutionContext.crossEntityLookup.targetEntityUuid ?? event.targetEntityUuid,
        }
      : undefined,
    warn: resolutionContext?.warn,
  });
}

function resolveActionSection(action: EvolutionTraceableAction): ApplicationSection {
  if ("applicationSection" in action.payload) {
    return action.payload.applicationSection;
  }
  return "model";
}

/**
 * Producer-path entry: applies the app/section tracking policy, then optionally
 * builds a raw ApplicationEvolutionTraceEvent.
 *
 * Returns `undefined` when the policy says the write must not be traced
 * (no unconditional writes).
 */
export function produceEvolutionTraceEvent(
  action: EvolutionTraceableAction,
  traceRoot: ApplicationEvolutionTrace,
  sequenceNumber: number,
  timestamp: string,
  resolutionContext?: TraceEventResolutionContext,
  commitContext?: EvolutionTraceCommitContext,
): ApplicationEvolutionTraceEvent | undefined {
  const applicationUuid = action.payload.application;
  const applicationSection = resolveActionSection(action);

  if (!shouldTraceEvolutionEvent(applicationUuid, applicationSection)) {
    return undefined;
  }

  if (isModelReplayableAction(action)) {
    return createTraceEventFromModelAction(
      action,
      traceRoot,
      sequenceNumber,
      timestamp,
      resolutionContext,
      commitContext,
    );
  }

  return createTraceEventFromInstanceAction(
    action,
    traceRoot,
    sequenceNumber,
    timestamp,
    resolutionContext,
  );
}

function isModelReplayableAction(
  action: EvolutionTraceableAction,
): action is ModelActionReplayableAction {
  return (
    action.actionType === "createEntity" ||
    action.actionType === "renameEntity" ||
    action.actionType === "dropEntity" ||
    action.actionType === "alterEntityAttribute"
  );
}
