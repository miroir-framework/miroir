/**
 * #708 part C: the agreement check. With an application's traces on, the version its chain starts from,
 * replayed with the commit records since, must give its model; otherwise something changed the model
 * without a record (a file edited outside Miroir, a write while traces were off) and a freeze is refused,
 * listing the differences.
 */
import {
  Action2Error,
  isEvolutionTraceOn,
  selfApplicationRowLocation,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  type EvolutionTraceRecordRow,
  type EvolutionTraceSwitchInput,
  type MetaModelCollection,
} from "@miroir-framework/core";

import { selectEntitiesToFreeze } from "./applicationVersionFreeze.js";
import { diffModelStates, type ModelStateCollections, type ModelStateDiff } from "./modelStateDiff.js";
import { frozenStateOf, liveModelState, replayEvolutionTraceRecords, type ModelState } from "./modelStates.js";

/** The `errorContext.reason` of a refusal by the check. */
export const EVOLUTION_TRACES_DISAGREE = "evolutionTracesDisagree";

/** The collections a freeze snapshots: those the check compares. */
export const AGREEMENT_COLLECTIONS: readonly MetaModelCollection[] = [
  "entities",
  "storedQueries",
  "reports",
  "menus",
  "endpoints",
  "runners",
  "themes",
  "transformerDefinitions",
  "mlSchemas",
  "tests",
  "blobs",
  "testConfigurations",
];

type Row = Record<string, unknown>;

/** A recorded write of the application's SelfApplication row that turns its traces off. */
function turnsTracesOff(application: string, record: EvolutionTraceRecordRow): boolean {
  const { entityUuid } = selfApplicationRowLocation(application);
  return (record.actions ?? []).some((action) => {
    const write = action as { actionType?: string; payload?: { parentUuid?: string; objects?: Row[] } };
    return (write.payload?.objects ?? []).some(
      (object) =>
        object.uuid === application &&
        (object.parentUuid ?? write.payload?.parentUuid) === entityUuid &&
        (write.actionType === "deleteInstance" || !isEvolutionTraceOn(object as EvolutionTraceSwitchInput)),
    );
  });
}

/**
 * The Application Version the check starts from: the one named by the last marker of the chain. None when
 * the chain has no marker, when its last marker names no version (a `rebaseline` of `resetModel` or
 * `initModel`), or when traces were turned off since: the changes made while they were off have no record,
 * so there is nothing to check until the next freeze.
 */
export function agreementStart(application: string, records: readonly EvolutionTraceRecordRow[]): string | undefined {
  const chain = records
    .filter((record) => record.application === application)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const markerIndex = chain.reduce(
    (last, record, index) => (record.kind === "version" || record.kind === "rebaseline" ? index : last),
    -1,
  );
  const marker = chain[markerIndex];
  if (!marker?.version) {
    return undefined;
  }
  const since = chain.slice(markerIndex + 1);
  return since.some((record) => record.kind === "commit" && turnsTracesOff(application, record)) ? undefined : marker.version;
}

/**
 * The record two records of the chain since the marker of `version` both follow (`previousTrace`), when the
 * chain forks there: two writers appended to it, as two Git branches each with its records, merged. Its
 * order is then not the order of the changes, and the check fails.
 */
export function evolutionTraceFork(
  application: string,
  records: readonly EvolutionTraceRecordRow[],
  version: string,
): string | undefined {
  const chain = records
    .filter((record) => record.application === application)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const markerIndex = chain.reduce(
    (last, record, index) => ((record.kind === "version" || record.kind === "rebaseline") && record.version === version ? index : last),
    -1,
  );
  const followed = new Set<string>();
  for (const record of chain.slice(Math.max(markerIndex, 0) + 1)) {
    if (!record.previousTrace) {
      continue;
    }
    if (followed.has(record.previousTrace)) {
      return record.previousTrace;
    }
    followed.add(record.previousTrace);
  }
  return undefined;
}

/**
 * The collections the check compares: the application's own Entities (not the meta-model ones its model
 * holds, which the freeze and the record writer create without a record), `conceptLevel` defaulting to
 * `Model` as a frozen Entity has it.
 */
function comparedCollections(application: string, state: ModelState, metaModelEntityUuids: ReadonlySet<string>): ModelStateCollections {
  return Object.fromEntries(
    AGREEMENT_COLLECTIONS.map((collection) => [
      collection,
      collection === "entities"
        ? selectEntitiesToFreeze(application, state.entities, metaModelEntityUuids).map((entity) => ({
            ...entity,
            conceptLevel: entity.conceptLevel ?? "Model",
          }))
        : state[collection],
    ]),
  ) as ModelStateCollections;
}

/** A row named for a person: its name, else its uuid. */
function rowLabel(row: Row): string {
  return String(row.name ?? row.defaultLabel ?? row.uuid);
}

/** The differences, by collection, with the rows named and the attributes that differ. */
export type EvolutionTraceDifferences = {
  collections: Partial<
    Record<
      MetaModelCollection,
      {
        added: { uuid: string; name: string }[];
        removed: { uuid: string; name: string }[];
        changed: { uuid: string; name: string; attributes: string[] }[];
      }
    >
  >;
  entityAttributes: ModelStateDiff["entityAttributes"];
};

function summarize(diff: ModelStateDiff): EvolutionTraceDifferences {
  const named = (row: Row) => ({ uuid: String(row.uuid), name: rowLabel(row) });
  return {
    collections: Object.fromEntries(
      Object.entries(diff.collections).map(([collection, rows]) => [
        collection,
        {
          added: rows!.added.map(named),
          removed: rows!.removed.map(named),
          changed: rows!.changed.map((change) => ({ ...named(change.next), attributes: change.attributes })),
        },
      ]),
    ),
    entityAttributes: diff.entityAttributes,
  };
}

/** One line per collection: what the model has that the traces do not give. */
function differencesText(differences: EvolutionTraceDifferences): string {
  return Object.entries(differences.collections)
    .map(([collection, rows]) => {
      const parts = [
        rows!.added.length > 0 ? `added ${rows!.added.map((row) => row.name).join(", ")}` : "",
        rows!.removed.length > 0 ? `removed ${rows!.removed.map((row) => row.name).join(", ")}` : "",
        rows!.changed.length > 0
          ? `changed ${rows!.changed.map((row) => `${row.name} (${row.attributes.join(", ")})`).join(", ")}`
          : "",
      ].filter((part) => part !== "");
      return `${collection}: ${parts.join("; ")}`;
    })
    .join("; ");
}

/**
 * Checks that the version the chain of `application` starts from, replayed with the commit records since,
 * gives its stored model. `undefined` when it does, or when there is nothing to check (`agreementStart`);
 * an `Action2Error` with reason `evolutionTracesDisagree` and the differences otherwise.
 */
export async function checkEvolutionTraceAgreement(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  metaModelEntityUuids: ReadonlySet<string>,
): Promise<Action2Error | undefined> {
  const live = await liveModelState(host, application, applicationDeploymentMap);
  if (live instanceof Action2Error) {
    return live;
  }
  const records = live.evolutionTraceRecords as EvolutionTraceRecordRow[];
  const version = agreementStart(application, records);
  if (!version) {
    return undefined;
  }
  const fork = evolutionTraceFork(application, records, version);
  if (fork) {
    return new Action2Error(
      "FailedToHandleAction",
      `the evolution traces of ${live.applicationName || application} fork after record ${fork}: two chains were merged, so the records do not tell the order of the changes since version ${version}`,
      undefined,
      undefined,
      { reason: EVOLUTION_TRACES_DISAGREE, version, fork },
    );
  }
  const frozen = frozenStateOf(live, version);
  const replayed = frozen instanceof Action2Error ? frozen : replayEvolutionTraceRecords(frozen, records);
  if (replayed instanceof Action2Error) {
    return new Action2Error(
      "FailedToHandleAction",
      `the evolution traces of ${live.applicationName || application} cannot be checked: ${replayed.errorMessage ?? ""}`,
      undefined,
      replayed,
      { reason: EVOLUTION_TRACES_DISAGREE, version },
    );
  }
  const diff = diffModelStates(
    comparedCollections(application, replayed, metaModelEntityUuids),
    comparedCollections(application, live, metaModelEntityUuids),
  );
  if (Object.keys(diff.collections).length === 0) {
    return undefined;
  }
  const differences = summarize(diff);
  return new Action2Error(
    "FailedToHandleAction",
    `the model of ${live.applicationName || application} changed without evolution trace records since its version ${version}: ${differencesText(differences)}`,
    undefined,
    undefined,
    { reason: EVOLUTION_TRACES_DISAGREE, version, differences },
  );
}
