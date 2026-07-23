import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  InstanceCUDAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import type { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  EVOLUTION_TRACE_ENTITY_UUID,
  EVOLUTION_TRACE_EVENT_ENTITY_UUID,
  generateEvolutionBaseline,
  type EvolutionTraceDeploymentState,
} from "./evolutionTraceBaseline.js";
import {
  produceEvolutionTraceEvent,
  type EvolutionTraceableAction,
  type EvolutionTraceCommitContext,
  type TraceEventResolutionContext,
} from "./evolutionTraceWriter.js";

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;

function isEvolutionTraceEntityUuid(uuid: string | undefined): boolean {
  return uuid === EVOLUTION_TRACE_ENTITY_UUID || uuid === EVOLUTION_TRACE_EVENT_ENTITY_UUID;
}

/**
 * Evolution-trace instances are stored in the evolving application's **model**
 * section (same place as SelfApplication / Branch / Version history for that app).
 */
export function collectEvolutionTraceStateFromDomainState(
  domainState: DomainState,
  applicationDeploymentUuid: Uuid,
  targetApplicationUuid: string,
): EvolutionTraceDeploymentState {
  const modelSection = domainState?.[applicationDeploymentUuid]?.["model"] ?? {};
  const rootsIndex = modelSection[EVOLUTION_TRACE_ENTITY_UUID] ?? {};
  const eventsIndex = modelSection[EVOLUTION_TRACE_EVENT_ENTITY_UUID] ?? {};

  const roots = Object.values(rootsIndex).filter(
    (root): root is ApplicationEvolutionTrace =>
      !!root &&
      typeof root === "object" &&
      (root as ApplicationEvolutionTrace).applicationUuid === targetApplicationUuid,
  );

  const rootUuids = new Set(roots.map((r) => r.uuid));
  const events = Object.values(eventsIndex).filter(
    (event): event is ApplicationEvolutionTraceEvent =>
      !!event &&
      typeof event === "object" &&
      rootUuids.has((event as ApplicationEvolutionTraceEvent).traceRootUuid),
  );

  return {
    applicationUuid: targetApplicationUuid,
    roots,
    events,
  };
}

function createTraceInstanceAction(
  applicationUuid: string,
  parentUuid: string,
  objects: object[],
  actionLabel: string,
): InstanceCUDAction {
  return {
    actionType: "createInstance",
    actionLabel,
    endpoint: INSTANCE_ENDPOINT,
    payload: {
      application: applicationUuid,
      applicationSection: "model",
      parentUuid,
      objects,
    },
  };
}

/**
 * Builds createInstance actions (targeting the evolving application's model
 * section) that ensure baseline + append a raw trace event for `action` when
 * the tracking policy allows.
 *
 * Skips tracing of evolution-trace entities themselves (avoids recursion).
 */
export function buildEvolutionTracePersistenceActions(
  action: EvolutionTraceableAction,
  existing: EvolutionTraceDeploymentState,
  resolutionContext?: TraceEventResolutionContext,
  timestamp: Date = new Date(),
  commitContext?: EvolutionTraceCommitContext,
): InstanceCUDAction[] {
  if (
    "objects" in action.payload &&
    action.payload.objects?.some((obj) => isEvolutionTraceEntityUuid(obj.parentUuid))
  ) {
    return [];
  }

  let state = existing;
  if (state.roots.length === 0 || !state.events.some((e) => e.operationType === "squashedBaseline")) {
    state = generateEvolutionBaseline(state, timestamp);
  }

  const root = state.roots.find((r) => r.branchName === "master") ?? state.roots[0];
  if (!root) {
    return [];
  }

  const nextSequence =
    state.events.reduce((max, event) => Math.max(max, event.sequenceNumber), 0) + 1;

  const event = produceEvolutionTraceEvent(
    action,
    root,
    nextSequence,
    timestamp.toISOString(),
    resolutionContext,
    commitContext,
  );
  if (!event) {
    // Policy skipped — do not create a baseline for non-traced writes.
    return [];
  }

  const applicationUuid = existing.applicationUuid;
  const actions: InstanceCUDAction[] = [];
  const existingRootUuids = new Set(existing.roots.map((r) => r.uuid));
  for (const candidateRoot of state.roots) {
    if (!existingRootUuids.has(candidateRoot.uuid)) {
      actions.push(
        createTraceInstanceAction(
          applicationUuid,
          EVOLUTION_TRACE_ENTITY_UUID,
          [candidateRoot],
          "evolutionTrace_ensureRoot",
        ),
      );
    }
  }

  const existingEventUuids = new Set(existing.events.map((e) => e.uuid));
  for (const candidateEvent of state.events) {
    if (!existingEventUuids.has(candidateEvent.uuid)) {
      actions.push(
        createTraceInstanceAction(
          applicationUuid,
          EVOLUTION_TRACE_EVENT_ENTITY_UUID,
          [candidateEvent],
          "evolutionTrace_ensureBaselineEvent",
        ),
      );
    }
  }

  actions.push(
    createTraceInstanceAction(
      applicationUuid,
      EVOLUTION_TRACE_EVENT_ENTITY_UUID,
      [event],
      "evolutionTrace_appendEvent",
    ),
  );

  return actions;
}
