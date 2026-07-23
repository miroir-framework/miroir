import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
  InstanceCUDAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MIROIR_APPLICATION_UUID } from "./evolutionTracePolicy.js";

/** Entity UUID for ApplicationEvolutionTrace instances (parentUuid). */
export const EVOLUTION_TRACE_ENTITY_UUID = "de089f57-5fa5-4c0e-a43e-20f1a6df5a37";

/** Entity UUID for ApplicationEvolutionTraceEvent instances (parentUuid). */
export const EVOLUTION_TRACE_EVENT_ENTITY_UUID = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";

export const DEFAULT_EVOLUTION_BRANCH = "master";

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;

/**
 * In-memory deployment-scoped trace store used by the baseline generator.
 * Callers (DomainController / init flows) persist the returned roots/events.
 */
export type EvolutionTraceDeploymentState = {
  applicationUuid: string;
  roots: ApplicationEvolutionTrace[];
  events: ApplicationEvolutionTraceEvent[];
};

function findMasterRoot(
  roots: ApplicationEvolutionTrace[],
  applicationUuid: string,
): ApplicationEvolutionTrace | undefined {
  return roots.find(
    (root) =>
      root.applicationUuid === applicationUuid && root.branchName === DEFAULT_EVOLUTION_BRANCH,
  );
}

function findBaselineEvent(
  events: ApplicationEvolutionTraceEvent[],
  traceRootUuid: string,
): ApplicationEvolutionTraceEvent | undefined {
  return events.find(
    (event) =>
      event.traceRootUuid === traceRootUuid && event.operationType === "squashedBaseline",
  );
}

/**
 * Ensures an initial squashed baseline exists for the deployment's application.
 *
 * When no history exists: creates one ApplicationEvolutionTrace root on
 * `master` and one ApplicationEvolutionTraceEvent with
 * `operationType = "squashedBaseline"` / `compactionLevel = "version"`.
 *
 * Idempotent: if a squashedBaseline event already exists for that root,
 * returns the input state unchanged (no duplicate roots/events).
 */
export function generateEvolutionBaseline(
  deployment: EvolutionTraceDeploymentState,
  timestamp: string = new Date().toISOString(),
): EvolutionTraceDeploymentState {
  const existingRoot = findMasterRoot(deployment.roots, deployment.applicationUuid);
  if (existingRoot) {
    const existingBaseline = findBaselineEvent(deployment.events, existingRoot.uuid);
    if (existingBaseline) {
      return deployment;
    }
  }

  const root: ApplicationEvolutionTrace =
    existingRoot ??
    ({
      uuid: uuidv4(),
      parentUuid: EVOLUTION_TRACE_ENTITY_UUID,
      applicationUuid: deployment.applicationUuid,
      branchName: DEFAULT_EVOLUTION_BRANCH,
      createdAt: timestamp,
    } satisfies ApplicationEvolutionTrace);

  const baselineEvent: ApplicationEvolutionTraceEvent = {
    uuid: uuidv4(),
    parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
    traceRootUuid: root.uuid,
    sequenceNumber: 1,
    operationType: "squashedBaseline",
    applicationSection: "model",
    compactionLevel: "version",
    timestamp,
  };

  return {
    applicationUuid: deployment.applicationUuid,
    roots: existingRoot ? deployment.roots : [...deployment.roots, root],
    events: [...deployment.events, baselineEvent],
  };
}

/**
 * Builds createInstance actions that persist a squashed baseline for `applicationUuid`.
 * Trace instances always live in Miroir data; `applicationUuid` is recorded on the root.
 * Used by deployment initialisation for every app reset.
 */
export function buildEvolutionBaselineCreateInstanceActions(
  applicationUuid: string,
  timestamp: string = new Date().toISOString(),
): InstanceCUDAction[] {
  const { roots, events } = generateEvolutionBaseline(
    { applicationUuid, roots: [], events: [] },
    timestamp,
  );
  const root = roots[0];
  const event = events[0];

  return [
    {
      actionType: "createInstance",
      actionLabel: "generateEvolutionBaseline_createTraceRoot",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: MIROIR_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: EVOLUTION_TRACE_ENTITY_UUID,
        objects: [root],
      },
    },
    {
      actionType: "createInstance",
      actionLabel: "generateEvolutionBaseline_createBaselineEvent",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: MIROIR_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: EVOLUTION_TRACE_EVENT_ENTITY_UUID,
        objects: [event],
      },
    },
  ];
}
