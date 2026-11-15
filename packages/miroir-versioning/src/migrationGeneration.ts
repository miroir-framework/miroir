/**
 * #9 part B: the generation of a draft Migration between two versions of an application (analysis D7). It
 * runs where the stores are, on the authoring deployment, and writes the Migration into the application's
 * `modelVersion` section.
 *
 * The structure changes are those between the Entities of the two versions. With the evolution traces on
 * between the two version markers, the commit records replayed on the `from` version must give the `to`
 * version (Q29): the changes are then vouched for by the traces (`source: traces`); without records, they
 * come from the versions alone (`source: diff`). When the traces agree, the net effect of the records is the
 * difference of the two versions, so both sources give their changes from that difference.
 */
import { v4 as uuidv4 } from "uuid";

import {
  Action2Error,
  ACTION_OK,
  type Action2ReturnType,
  type ActionImplementationHandler,
  type ApplicationDeploymentMap,
  type CompositeActionSequence,
  type DomainControllerActionHost,
  type Entity,
  type EvolutionTraceRecordRow,
  type EvolutionTraceSwitchInput,
  getApplicationSection,
  isEvolutionTraceOn,
  type MetaModel,
  metaModelEntities,
  resolveVersioningMode,
} from "@miroir-framework/core";
import { entityMigration } from "@miroir-framework/core/meta-model";

import { followingDeploymentRefusal, refusal } from "./deploymentRole.js";
import { comparedCollections, differencesText, EVOLUTION_TRACES_DISAGREE, summarize } from "./evolutionTraceAgreement.js";
import { ensureApplicationEntity } from "./evolutionTraceRecords.js";
import { metaModelEntityUuids } from "./freezeApplicationVersion.js";
import { diffModelStates, sameJson } from "./modelStateDiff.js";
import { frozenStateOf, liveModelState, modelStateFromFiles, replayCommitRecords, type ModelState } from "./modelStates.js";

const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const DOMAIN_ENDPOINT_UUID = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

/** #9: Model Endpoint action that writes a draft Migration between two versions of an application. */
export const GENERATE_MIGRATION_ACTION_TYPE = "generateMigration" as const;

/** Payload of `generateMigration`: version names; `replace` replaces a Migration already there. */
export type GenerateMigrationActionPayload = {
  application: string;
  from: string;
  to: string;
  replace?: boolean;
};

export type MigrationChangeKind =
  | "addEntity"
  | "removeEntity"
  | "renameEntity"
  | "changeIdAttribute"
  | "addAttribute"
  | "removeAttribute"
  | "changeAttribute";

/** A structure change between two versions, classified (epic D1). */
export type MigrationChange = {
  kind: MigrationChangeKind;
  entity: string;
  entityName?: string;
  attribute?: string;
  backwardCompatible: boolean;
  supported: boolean;
  note?: string;
};

/** A step of a Migration: a composite action sequence with its flags (analysis D3). */
export type MigrationStep = {
  uuid: string;
  name: string;
  backwardCompatible: boolean;
  repeatable: boolean;
  action: CompositeActionSequence;
};

/** A stored Migration row. */
export type MigrationRow = {
  uuid: string;
  parentName: string;
  parentUuid: string;
  name: string;
  application: string;
  from: string;
  to: string;
  source: "traces" | "diff" | "manual";
  changes: MigrationChange[];
  expand: MigrationStep[];
  fill: MigrationStep[];
  contract: MigrationStep[];
  backwardCompatible: boolean;
  generatedAt?: string;
  description?: string;
};

type Row = Record<string, unknown>;

/** The attributes an Entity row declares, by name. */
function attributesOf(entity: Row): Row {
  return ((entity.mlSchema as Row | undefined)?.definition ?? {}) as Row;
}

function isOptional(definition: unknown): boolean {
  return (definition as { optional?: unknown } | undefined)?.optional === true;
}

/**
 * Whether an attribute's change keeps the `from` version able to run on migrated data: its type is the same
 * and it does not become required.
 */
function changeKeepsCompatibility(previous: unknown, next: unknown): boolean {
  const sameType = (previous as Row | undefined)?.type === (next as Row | undefined)?.type;
  return sameType && (isOptional(next) || !isOptional(previous));
}

/**
 * The classification table (epic D1, analysis D7 step 6): the structure changes of one Entity from its row in
 * `from` (`previous`) to its row in `to` (`next`); an absent row is an Entity added or removed.
 */
export function entityStructureChanges(previous: Row | undefined, next: Row | undefined): MigrationChange[] {
  if (!next) {
    return previous
      ? [{ kind: "removeEntity", entity: String(previous.uuid), entityName: String(previous.name), backwardCompatible: false, supported: true }]
      : [];
  }
  const entity = String(next.uuid);
  const entityName = String(next.name);
  if (!previous) {
    return [{ kind: "addEntity", entity, entityName, backwardCompatible: true, supported: true }];
  }
  const changes: MigrationChange[] = [];
  if (previous.name !== next.name) {
    changes.push({
      kind: "renameEntity",
      entity,
      entityName,
      backwardCompatible: false,
      supported: false,
      note: `renamed from ${String(previous.name)}: a SQL store names the table after the Entity, and the jump does not move the data (#215)`,
    });
  }
  if (!sameJson(previous.idAttribute ?? "uuid", next.idAttribute ?? "uuid")) {
    changes.push({
      kind: "changeIdAttribute",
      entity,
      entityName,
      backwardCompatible: false,
      supported: false,
      note: "the primary key of the stored instances changes, which the jump does not do",
    });
  }
  const before = attributesOf(previous);
  const after = attributesOf(next);
  for (const [attribute, definition] of Object.entries(after)) {
    if (!(attribute in before)) {
      changes.push({ kind: "addAttribute", entity, entityName, attribute, backwardCompatible: isOptional(definition), supported: true });
    } else if (!sameJson(before[attribute], definition)) {
      changes.push({
        kind: "changeAttribute",
        entity,
        entityName,
        attribute,
        backwardCompatible: changeKeepsCompatibility(before[attribute], definition),
        supported: true,
      });
    }
  }
  for (const attribute of Object.keys(before).filter((attribute) => !(attribute in after))) {
    changes.push({ kind: "removeAttribute", entity, entityName, attribute, backwardCompatible: false, supported: true });
  }
  return changes;
}

/**
 * The structure changes from the Entities of `from` to those of `to`. The meta-model Entities the
 * application's model holds are left out. Changes of other model elements have no storage effect and are not
 * listed.
 */
export function migrationChanges(application: string, from: ModelState, to: ModelState): MigrationChange[] {
  const metaModel = metaModelEntityUuids(metaModelEntities);
  const entitiesOf = (state: ModelState) =>
    new Map((comparedCollections(application, state, metaModel).entities ?? []).map((entity): [string, Row] => [entity.uuid, { ...entity }]));
  const before = entitiesOf(from);
  const after = entitiesOf(to);
  return [
    ...[...after].flatMap(([uuid, next]) => entityStructureChanges(before.get(uuid), next)),
    ...[...before].filter(([uuid]) => !after.has(uuid)).flatMap(([, previous]) => entityStructureChanges(previous, undefined)),
  ];
}

/** An empty step: the designer writes its actions (fill), or #733 brings them (contract). */
function emptyStep(name: string, backwardCompatible: boolean): MigrationStep {
  return {
    uuid: uuidv4(),
    name,
    backwardCompatible,
    repeatable: true,
    action: {
      actionType: "compositeActionSequence",
      actionLabel: name,
      endpoint: DOMAIN_ENDPOINT_UUID,
      payload: { actionSequence: [] },
    } as CompositeActionSequence,
  };
}

/**
 * The steps of the changes (analysis D7, step 7): an empty fill step per added attribute; an empty contract
 * step per removed Entity or attribute, named after what it must drop (D4, #733); no expand step.
 */
export function migrationSteps(changes: readonly MigrationChange[]): Pick<MigrationRow, "expand" | "fill" | "contract"> {
  const label = (change: MigrationChange) =>
    change.attribute ? `${change.entityName ?? change.entity}.${change.attribute}` : (change.entityName ?? change.entity);
  return {
    expand: [],
    fill: changes.filter((change) => change.kind === "addAttribute").map((change) => emptyStep(`fill ${label(change)}`, true)),
    contract: changes
      .filter((change) => change.kind === "removeEntity" || change.kind === "removeAttribute")
      .map((change) => emptyStep(`drop ${label(change)}`, false)),
  };
}

/** The records between two versions, or why there are none to read, or the re-baseline between them. */
type RecordsBetween = { records: EvolutionTraceRecordRow[] } | { none: string } | { rebaseline: EvolutionTraceRecordRow };

/** `versioned-internal`: the records between the markers of two frozen versions. */
function recordsBetween(
  application: string,
  records: readonly EvolutionTraceRecordRow[],
  fromVersion: string,
  toVersion: string,
): RecordsBetween {
  const chain = records
    .filter((record) => record.application === application)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const isMarkerOf = (record: EvolutionTraceRecordRow, version: string) =>
    (record.kind === "version" || record.kind === "rebaseline") && record.version === version;
  const fromIndex = chain.reduce((last, record, index) => (isMarkerOf(record, fromVersion) ? index : last), -1);
  if (fromIndex < 0) {
    return { none: "the traces have no marker of the from version" };
  }
  const toIndex = chain.findIndex((record, index) => index > fromIndex && isMarkerOf(record, toVersion));
  if (toIndex < 0) {
    return { none: "the traces have no marker of the to version after the from one" };
  }
  const between = chain.slice(fromIndex + 1, toIndex);
  const rebaseline = [...between, chain[toIndex]].find((record) => record.kind === "rebaseline");
  return rebaseline ? { rebaseline } : { records: between };
}

/**
 * `versioned-git`: the records the `to` commit holds and the `from` one does not. A commit holds the chain
 * up to it, so these are the records appended between the two; none when the traces are off at `to`.
 */
function recordsAdded(application: string, fromState: ModelState, toState: ModelState, to: string): RecordsBetween {
  const selfApplication = toState.applications.find((row) => row.uuid === application) as EvolutionTraceSwitchInput | undefined;
  if (!isEvolutionTraceOn(selfApplication)) {
    return { none: `the traces are off at ${to}` };
  }
  const known = new Set((fromState.evolutionTraceRecords as EvolutionTraceRecordRow[]).map((record) => record.uuid));
  const added = (toState.evolutionTraceRecords as EvolutionTraceRecordRow[])
    .filter((record) => record.application === application && !known.has(record.uuid))
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const rebaseline = added.find((record) => record.kind === "rebaseline");
  return rebaseline ? { rebaseline } : { records: added };
}

/** The two versions of a Migration, and the records between them. */
type VersionStates = { fromState: ModelState; toState: ModelState; between: RecordsBetween };

/** `versioned-internal`: the two frozen versions named by the payload. */
function frozenVersionStates(live: ModelState, payload: GenerateMigrationActionPayload): VersionStates | Action2Error {
  const versionNamed = (name: string) => live.applicationVersions.find((row) => row.name === name);
  const fromVersion = versionNamed(payload.from);
  const toVersion = versionNamed(payload.to);
  if (!fromVersion || !toVersion) {
    return new Action2Error(
      "FailedToHandleAction",
      `generateMigration: ${payload.application} has no Application Version named ${!fromVersion ? payload.from : payload.to}`,
    );
  }
  const fromState = frozenStateOf(live, fromVersion.uuid);
  const toState = frozenStateOf(live, toVersion.uuid);
  if (fromState instanceof Action2Error || toState instanceof Action2Error) {
    return fromState instanceof Action2Error ? fromState : (toState as Action2Error);
  }
  const records = recordsBetween(payload.application, live.evolutionTraceRecords as EvolutionTraceRecordRow[], fromVersion.uuid, toVersion.uuid);
  return { fromState, toState, between: records };
}

/**
 * `versioned-git` (epic section 5.2): the model of the tag `from`, and the model of the tag `to` or, before
 * it is tagged, of `HEAD`; refused (`migrationSectionMissing`) when the deployment has no folder in the
 * repository for the section the Migration is written to.
 */
async function gitVersionStates(
  host: DomainControllerActionHost,
  payload: GenerateMigrationActionPayload,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<VersionStates | Action2Error> {
  const { application } = payload;
  const read = await host.readGitModelFiles(application, [payload.from, payload.to, "HEAD"], applicationDeploymentMap);
  if (read instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `generateMigration could not read the Git commits of ${application}`, [], read);
  }
  const migrationSection = getApplicationSection(application, entityMigration.uuid);
  if (read.sectionFolders[migrationSection] === undefined) {
    return refusal(
      `generateMigration: the deployment of ${application} has no ${migrationSection} folder in its repository, where the Migration would be committed`,
      "migrationSectionMissing",
      { section: migrationSection },
    );
  }
  const fromCommit = read.commits[payload.from];
  const toCommit = read.commits[payload.to] ?? read.commits.HEAD;
  if (!fromCommit || !toCommit) {
    return new Action2Error(
      "FailedToHandleAction",
      `generateMigration: the repository of ${application} has no ${!fromCommit ? `tag ${payload.from}` : "commit"}`,
    );
  }
  const fromState = modelStateFromFiles(application, read.sectionFolders, fromCommit.files);
  const toState = modelStateFromFiles(application, read.sectionFolders, toCommit.files);
  return { fromState, toState, between: recordsAdded(application, fromState, toState, read.commits[payload.to] ? payload.to : "HEAD") };
}

/** The Migration row for `payload`, from the two versions and, when there are, the records between them. */
export function draftMigration(
  live: ModelState,
  payload: GenerateMigrationActionPayload,
  fromState: ModelState,
  toState: ModelState,
  source: "traces" | "diff",
  note?: string,
): MigrationRow {
  const changes = migrationChanges(payload.application, fromState, toState);
  const steps = migrationSteps(changes);
  const backwardCompatible = [...changes, ...steps.expand, ...steps.fill, ...steps.contract].every((item) => item.backwardCompatible);
  return {
    uuid: uuidv4(),
    parentName: entityMigration.name,
    parentUuid: entityMigration.uuid,
    name: `${payload.from} → ${payload.to}`,
    application: payload.application,
    from: payload.from,
    to: payload.to,
    source,
    changes,
    ...steps,
    backwardCompatible,
    generatedAt: new Date().toISOString(),
    description: [
      `Draft generated from ${source === "traces" ? "the evolution trace records" : "the two versions (traces were off)"} of ${live.applicationName || payload.application}.`,
      note ?? "",
    ]
      .filter((part) => part !== "")
      .join(" "),
  };
}

/** The Migration of `application` from `from` to `to` among the stored ones. */
function storedMigration(live: MetaModel, payload: GenerateMigrationActionPayload): { uuid: string } | undefined {
  return live.migrations.find(
    (row) => row.application === payload.application && row.from === payload.from && row.to === payload.to,
  );
}

/** Writes `row` in the application's `modelVersion` section, replacing `replaced` when given. */
async function writeMigration(
  host: DomainControllerActionHost,
  row: MigrationRow,
  replaced: { uuid: string } | undefined,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2ReturnType> {
  const write = (actionType: "createInstance" | "updateInstance", object: MigrationRow) =>
    host.handleInstanceAction(
      {
        actionType,
        actionLabel: "generateMigration",
        endpoint: INSTANCE_ENDPOINT_UUID,
        payload: {
          application: row.application,
          applicationSection: "modelVersion",
          parentUuid: entityMigration.uuid,
          objects: [object],
        },
      } as any,
      applicationDeploymentMap,
    );
  return replaced ? write("updateInstance", { ...row, uuid: replaced.uuid }) : write("createInstance", row);
}

/**
 * `generateMigration`: refused on a following deployment, across a re-baseline (`migrationAcrossRebaseline`),
 * when the traces between the two versions disagree with them (`evolutionTracesDisagree`), and when a
 * Migration for the same versions exists (`migrationExists`, unless `replace`).
 */
export const handleAction_generateMigration: ActionImplementationHandler = async (host, action, context): Promise<Action2ReturnType> => {
  const payload = action.payload as GenerateMigrationActionPayload;
  const { application } = payload;
  const { applicationDeploymentMap } = context;
  const following = await followingDeploymentRefusal(host, GENERATE_MIGRATION_ACTION_TYPE, application, applicationDeploymentMap);
  if (following) {
    return following;
  }
  const live = await liveModelState(host, application, applicationDeploymentMap);
  if (live instanceof Action2Error) {
    return live;
  }
  const existing = storedMigration(live, payload);
  if (existing && payload.replace !== true) {
    return refusal(
      `generateMigration: a Migration from ${payload.from} to ${payload.to} exists already (${existing.uuid}); replace it explicitly`,
      "migrationExists",
      { migration: existing.uuid },
    );
  }
  const selfApplication = live.applications.find((row) => row.uuid === application);
  const states =
    selfApplication && resolveVersioningMode(selfApplication) === "versioned-git"
      ? await gitVersionStates(host, payload, applicationDeploymentMap)
      : frozenVersionStates(live, payload);
  if (states instanceof Action2Error) {
    return states;
  }
  const { fromState, toState, between } = states;
  if ("rebaseline" in between) {
    return refusal(
      `generateMigration: the evolution traces of ${live.applicationName || application} restart between ${payload.from} and ${payload.to} (record ${between.rebaseline.uuid}): the model was corrected outside Miroir there, so its Migration is written by hand`,
      "migrationAcrossRebaseline",
      { record: between.rebaseline.uuid },
    );
  }
  let source: "traces" | "diff" = "diff";
  let note: string | undefined;
  if ("records" in between) {
    const replayed = replayCommitRecords(fromState, between.records);
    if (replayed instanceof Action2Error) {
      return refusal(`generateMigration: the evolution traces cannot be replayed: ${replayed.errorMessage ?? ""}`, EVOLUTION_TRACES_DISAGREE);
    }
    const metaModel = metaModelEntityUuids(metaModelEntities);
    const diff = diffModelStates(comparedCollections(application, replayed, metaModel), comparedCollections(application, toState, metaModel));
    if (Object.keys(diff.collections).length > 0) {
      const differences = summarize(diff);
      return refusal(
        `generateMigration: the evolution traces of ${live.applicationName || application} between ${payload.from} and ${payload.to} do not give ${payload.to}: ${differencesText(differences)}`,
        EVOLUTION_TRACES_DISAGREE,
        { differences },
      );
    }
    source = "traces";
  } else {
    note = `No trace records: ${between.none}.`;
  }

  const ensured = await ensureApplicationEntity(host, application, applicationDeploymentMap, entityMigration as Entity, "generateMigrationEnsureEntity");
  if (ensured) {
    return ensured;
  }
  const row = draftMigration(live, payload, fromState, toState, source, note);
  const written = await writeMigration(host, row, existing, applicationDeploymentMap);
  return written instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `generateMigration could not write the Migration of ${application}`, [], written)
    : ACTION_OK;
};
