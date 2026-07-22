import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  ModelActionReplayableAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/**
 * UUID of the ApplicationEvolutionTraceEvent entity — used as parentUuid on
 * every instance to anchor it to its defining entity (same convention as all
 * other Miroir entity instances).
 */
const EVOLUTION_TRACE_EVENT_ENTITY_UUID = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";

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
