/**
 * #708: the writer of evolution trace records. A record is appended to the chain of its application, in
 * the application's `modelVersion` section: its sequence number follows the last record's, and it names
 * that record as `previousTrace`. Appends of one application are serialized in this process, which holds
 * the stores, so two commits never read the same last record.
 */
import { v4 as uuidv4 } from "uuid";

import {
  Action2Error,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  type Action2ReturnType,
  type ActionImplementationHandler,
  type AppendEvolutionTraceRecordPayload,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  type Entity,
  type EntityInstance,
  type EvolutionTraceRecordRow,
} from "@miroir-framework/core";
import { entityEvolutionTraceRecord } from "@miroir-framework/core/meta-model";

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";

const applicationLocks = new Map<string, Promise<unknown>>();

/** Runs `run` after every earlier run for the same application has finished. */
async function withApplicationLock<T>(application: string, run: () => Promise<T>): Promise<T> {
  const previous = applicationLocks.get(application) ?? Promise.resolve();
  const current = previous.then(run, run);
  const settled = current.catch(() => undefined);
  applicationLocks.set(application, settled);
  try {
    return await current;
  } finally {
    if (applicationLocks.get(application) === settled) {
      applicationLocks.delete(application);
    }
  }
}

/** The record Entity, created in the application's model when absent, as the freeze does for its own. */
async function ensureRecordEntity(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  const modelEnvironment = host.asDomainControllerInterface().currentModelEnvironment(application, applicationDeploymentMap);
  if (modelEnvironment.currentModel.entities.some((entity) => entity.uuid === EVOLUTION_TRACE_RECORD_ENTITY_UUID)) {
    return undefined;
  }
  const created = await host.handleModelAction(
    {
      actionType: "createEntity",
      actionLabel: "appendEvolutionTraceRecordEnsureEntity",
      endpoint: MODEL_ENDPOINT_UUID,
      payload: { application, transactional: false, entities: [entityEvolutionTraceRecord as Entity] },
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  return created instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", "appendEvolutionTraceRecord could not create its Entity", [], created)
    : undefined;
}

/** Whether a stored row is a record: it has the sequence number the chain is ordered by. */
function isEvolutionTraceRecordRow(row: EntityInstance): row is EntityInstance & EvolutionTraceRecordRow {
  return typeof row.uuid === "string" && typeof (row as { sequenceNumber?: unknown }).sequenceNumber === "number";
}

/** The last record of an application's chain, by sequence number. */
function lastRecord(records: EvolutionTraceRecordRow[]): EvolutionTraceRecordRow | undefined {
  return records.reduce<EvolutionTraceRecordRow | undefined>(
    (last, record) => (!last || record.sequenceNumber > last.sequenceNumber ? record : last),
    undefined,
  );
}

/** The record a payload makes after `previous`. */
export function nextEvolutionTraceRecord(
  payload: AppendEvolutionTraceRecordPayload,
  previous: EvolutionTraceRecordRow | undefined,
  now: Date = new Date(),
  newUuid: () => string = uuidv4,
): EvolutionTraceRecordRow {
  const optional = Object.fromEntries(
    (["commitUuid", "actions", "complete", "version", "gitCommit"] as const)
      .filter((key) => payload[key] !== undefined)
      .map((key) => [key, payload[key]]),
  );
  return {
    uuid: newUuid(),
    parentName: "EvolutionTraceRecord",
    parentUuid: EVOLUTION_TRACE_RECORD_ENTITY_UUID,
    application: payload.application,
    sequenceNumber: (previous?.sequenceNumber ?? 0) + 1,
    ...(previous ? { previousTrace: previous.uuid } : {}),
    kind: payload.kind,
    ...optional,
    timestamp: now.toISOString(),
  };
}

/** Appends the record a payload describes to its application's chain, and returns it. */
export const handleAction_appendEvolutionTraceRecord: ActionImplementationHandler = async (
  host,
  action,
  context,
): Promise<Action2ReturnType> => {
  const payload = action.payload as AppendEvolutionTraceRecordPayload;
  const { applicationDeploymentMap } = context;
  return withApplicationLock(payload.application, async () => {
    const ensureFailure = await ensureRecordEntity(host, payload.application, applicationDeploymentMap);
    if (ensureFailure) {
      return ensureFailure;
    }
    const stored = await host.readSectionInstances(
      payload.application,
      applicationDeploymentMap,
      "modelVersion",
      EVOLUTION_TRACE_RECORD_ENTITY_UUID,
    );
    if (stored instanceof Action2Error) {
      return new Action2Error("FailedToHandleAction", "appendEvolutionTraceRecord could not read the chain", [], stored);
    }
    const record = nextEvolutionTraceRecord(payload, lastRecord(stored.filter(isEvolutionTraceRecordRow)));
    const written = await host.handleInstanceAction(
      {
        actionType: "createInstance",
        actionLabel: "appendEvolutionTraceRecord",
        endpoint: INSTANCE_ENDPOINT_UUID,
        payload: {
          application: payload.application,
          applicationSection: "modelVersion",
          objects: [record],
        },
      },
      applicationDeploymentMap,
    );
    if (written instanceof Action2Error) {
      return new Action2Error("FailedToHandleAction", "appendEvolutionTraceRecord could not write the record", [], written);
    }
    return { status: "ok", returnedDomainElement: record as any };
  });
};
