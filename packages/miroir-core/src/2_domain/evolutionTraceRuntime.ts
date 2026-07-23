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
import { MIROIR_APPLICATION_UUID } from "./evolutionTracePolicy.js";

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;

function isEvolutionTraceEntityUuid(uuid: string | undefined): boolean {
  return uuid === EVOLUTION_TRACE_ENTITY_UUID || uuid === EVOLUTION_TRACE_EVENT_ENTITY_UUID;
}

/**
 * Evolution-trace instances are stored under the Miroir application data section
 * (entities live on the Miroir meta-model). Roots still record the target app via
 * `applicationUuid`.
 */
export function collectEvolutionTraceStateFromDomainState(
  domainState: DomainState,
  miroirDeploymentUuid: Uuid,
  targetApplicationUuid: string,
): EvolutionTraceDeploymentState {
  const dataSection = domainState?.[miroirDeploymentUuid]?.["data"] ?? {};
  const rootsIndex = dataSection[EVOLUTION_TRACE_ENTITY_UUID] ?? {};
  const eventsIndex = dataSection[EVOLUTION_TRACE_EVENT_ENTITY_UUID] ?? {};

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

/**
 * Builds createInstance actions (targeting Miroir data) that ensure baseline +
 * append a raw trace event for `action` when the tracking policy allows.
 *
 * Skips tracing of evolution-trace entities themselves (avoids recursion).
 */
export function buildEvolutionTracePersistenceActions(
  action: EvolutionTraceableAction,
  existing: EvolutionTraceDeploymentState,
  resolutionContext?: TraceEventResolutionContext,
  timestamp: string = new Date().toISOString(),
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
    timestamp,
    resolutionContext,
    commitContext,
  );
  if (!event) {
    // Policy skipped — still persist baseline if we just generated it.
    return persistenceActionsForNewBaselineOnly(existing, state);
  }

  const actions: InstanceCUDAction[] = [];
  const existingRootUuids = new Set(existing.roots.map((r) => r.uuid));
  for (const candidateRoot of state.roots) {
    if (!existingRootUuids.has(candidateRoot.uuid)) {
      actions.push({
        actionType: "createInstance",
        actionLabel: "evolutionTrace_ensureRoot",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: MIROIR_APPLICATION_UUID,
          applicationSection: "data",
          parentUuid: EVOLUTION_TRACE_ENTITY_UUID,
          objects: [candidateRoot],
        },
      });
    }
  }

  const existingEventUuids = new Set(existing.events.map((e) => e.uuid));
  for (const candidateEvent of state.events) {
    if (!existingEventUuids.has(candidateEvent.uuid)) {
      actions.push({
        actionType: "createInstance",
        actionLabel: "evolutionTrace_ensureBaselineEvent",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: MIROIR_APPLICATION_UUID,
          applicationSection: "data",
          parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
          objects: [candidateEvent],
        },
      });
    }
  }

  actions.push({
    actionType: "createInstance",
    actionLabel: "evolutionTrace_appendEvent",
    endpoint: INSTANCE_ENDPOINT,
    payload: {
      application: MIROIR_APPLICATION_UUID,
      applicationSection: "data",
      parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
      objects: [event],
    },
  });

  return actions;
}

function persistenceActionsForNewBaselineOnly(
  existing: EvolutionTraceDeploymentState,
  state: EvolutionTraceDeploymentState,
): InstanceCUDAction[] {
  const actions: InstanceCUDAction[] = [];
  const existingRootUuids = new Set(existing.roots.map((r) => r.uuid));
  const existingEventUuids = new Set(existing.events.map((e) => e.uuid));
  for (const root of state.roots) {
    if (!existingRootUuids.has(root.uuid)) {
      actions.push({
        actionType: "createInstance",
        actionLabel: "evolutionTrace_ensureRoot",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: MIROIR_APPLICATION_UUID,
          applicationSection: "data",
          parentUuid: EVOLUTION_TRACE_ENTITY_UUID,
          objects: [root],
        },
      });
    }
  }
  for (const event of state.events) {
    if (!existingEventUuids.has(event.uuid)) {
      actions.push({
        actionType: "createInstance",
        actionLabel: "evolutionTrace_ensureBaselineEvent",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: MIROIR_APPLICATION_UUID,
          applicationSection: "data",
          parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
          objects: [event],
        },
      });
    }
  }
  return actions;
}
