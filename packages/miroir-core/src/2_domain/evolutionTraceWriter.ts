import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  ApplicationSection,
  InstanceCUDAction,
  ModelActionReplayableAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { shouldTraceEvolutionEvent } from "./evolutionTracePolicy.js";

/**
 * UUID of the ApplicationEvolutionTraceEvent entity — used as parentUuid on
 * every instance to anchor it to its defining entity (same convention as all
 * other Miroir entity instances).
 */
const EVOLUTION_TRACE_EVENT_ENTITY_UUID = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";

export type EvolutionTraceableAction = ModelActionReplayableAction | InstanceCUDAction;

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
  };

  switch (action.actionType) {
    case "createEntity":
      return {
        ...base,
        targetEntityUuid: action.payload.entities[0]?.entity.uuid,
      };
    case "renameEntity":
    case "dropEntity":
    case "alterEntityAttribute":
      return {
        ...base,
        targetEntityUuid: action.payload.entityUuid,
      };
  }
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
): ApplicationEvolutionTraceEvent {
  const firstObject = action.payload.objects[0];
  return {
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
): ApplicationEvolutionTraceEvent | undefined {
  const applicationUuid = action.payload.application;
  const applicationSection = resolveActionSection(action);

  if (!shouldTraceEvolutionEvent(applicationUuid, applicationSection)) {
    return undefined;
  }

  if (isModelReplayableAction(action)) {
    return createTraceEventFromModelAction(action, traceRoot, sequenceNumber, timestamp);
  }

  return createTraceEventFromInstanceAction(action, traceRoot, sequenceNumber, timestamp);
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
