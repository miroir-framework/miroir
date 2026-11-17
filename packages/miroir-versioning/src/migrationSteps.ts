/**
 * #745 (D1, D2): the steps of a Migration. A Migration holds one ordered list of steps; a migration run
 * executes them in that order. A `model` step is one model Action the designer ran (`createEntity`,
 * `alterEntityAttribute`, `renameEntity`, `dropEntity`), or an instance write of a model row of the compared
 * collections (a Report, a Query, …), or, in `versioned-git`, the checkout of the `to` version. A `data` step
 * is a composite action sequence of data writes, written by the designer.
 *
 * Generation writes the model steps from the evolution trace records between the two versions, in trace
 * order (`stepsFromRecords`), or, with the traces off, from the diff of the two versions in a fixed order
 * (`stepsFromDiff`). Either way it replays its steps in memory on `from` and checks the result against `to`
 * (`replaySteps`), so that the Migration holds its own proof.
 */
import { v4 as uuidv4 } from "uuid";

import {
  Action2Error,
  type CompositeActionSequence,
  type EvolutionTraceRecordRow,
  getApplicationSection,
  metaModelCollections,
  metaModelEntities,
  type MetaModelCollection,
} from "@miroir-framework/core";

import { refusal } from "./deploymentRole.js";
import { AGREEMENT_COLLECTIONS, comparedCollections, differencesText, summarize, type EvolutionTraceDifferences } from "./evolutionTraceAgreement.js";
import { metaModelEntityUuids } from "./freezeApplicationVersion.js";
import { diffModelStates } from "./modelStateDiff.js";
import { applyModelStateActions, REPLAYED_MODEL_ACTION_TYPES, type ModelState } from "./modelStates.js";

export const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
export const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
export const DOMAIN_ENDPOINT_UUID = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
/** The meta-Entity `Entity`: its rows are the Entities of an application. */
export const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

/** The action of the `versioned-git` model step: the checkout of the `to` version's tag. */
export const GIT_CHECKOUT_ACTION_TYPE = "checkoutVersion" as const;

/** The instance writes a `model` step may hold. */
export const INSTANCE_WRITE_ACTION_TYPES: ReadonlySet<string> = new Set(["createInstance", "updateInstance", "deleteInstance"]);

/** The model Actions a `model` step may hold. */
export const MODEL_STEP_ACTION_TYPES = REPLAYED_MODEL_ACTION_TYPES;

export type MigrationStepKind = "model" | "data";

/** The action of a `model` step: one model Action, one instance write of a model row, or the Git checkout. */
export type MigrationModelStepAction = {
  actionType: string;
  actionLabel?: string;
  endpoint: string;
  payload: Record<string, unknown>;
};

/** A step of a Migration (D1). `trace` names the evolution trace record a generated model step comes from. */
export type MigrationStep = {
  uuid: string;
  name: string;
  kind: MigrationStepKind;
  backwardCompatible: boolean;
  action: MigrationModelStepAction | CompositeActionSequence;
  trace?: string;
};

/** The refusals of generation that come from the steps. */
export const MIGRATION_GENERATION_REFUSALS = {
  migrationEntityRowWrite: "migrationEntityRowWrite",
  migrationIncompleteRecord: "migrationIncompleteRecord",
  migrationUnsupportedApplication: "migrationUnsupportedApplication",
  migrationNoModelAction: "migrationNoModelAction",
} as const;

type Row = Record<string, unknown>;

type InstanceWrite = {
  actionType: string;
  payload: { application: string; applicationSection?: string; parentUuid?: string; objects?: Row[] };
};

/** An empty data step, whose actions the designer writes. */
export function emptyDataStep(name: string, backwardCompatible = true): MigrationStep {
  return {
    uuid: uuidv4(),
    name,
    kind: "data",
    backwardCompatible,
    action: {
      actionType: "compositeActionSequence",
      actionLabel: name,
      endpoint: DOMAIN_ENDPOINT_UUID,
      payload: { actionSequence: [] },
    } as CompositeActionSequence,
  };
}

function modelStep(name: string, backwardCompatible: boolean, action: MigrationModelStepAction, trace?: string): MigrationStep {
  return { uuid: uuidv4(), name, kind: "model", backwardCompatible, action, ...(trace ? { trace } : {}) };
}

/** A model Action as a step holds it: no `transactional` flag (the migration run sets it), labelled by the step. */
function modelActionOf(actionType: string, name: string, payload: Row): MigrationModelStepAction {
  const { transactional: _transactional, ...rest } = payload;
  return { actionType, actionLabel: name, endpoint: MODEL_ENDPOINT_UUID, payload: rest };
}

function entityNameIn(state: ModelState, entityUuid: string): string {
  return String((state.entities.find((entity) => entity.uuid === entityUuid) as Row | undefined)?.name ?? entityUuid);
}

function isOptional(definition: unknown): boolean {
  return (definition as { optional?: unknown } | undefined)?.optional === true;
}

/**
 * The steps of one model Action (the D2 table): a `createEntity` gives one step per Entity; an
 * `alterEntityAttribute` gives the add, an empty data step `fill <Entity>.<attribute>` per added attribute,
 * then the remove; `renameEntity` and `dropEntity` give themselves. `state` is the model before the Action.
 */
export function modelActionSteps(action: { actionType: string; payload: Row }, state: ModelState, trace?: string): MigrationStep[] {
  const payload = action.payload ?? {};
  switch (action.actionType) {
    case "createEntity": {
      const entities = (payload.entities ?? []) as Row[];
      return entities.map((entity) => {
        const name = `create Entity ${String(entity.name ?? entity.uuid)}`;
        return modelStep(name, true, modelActionOf("createEntity", name, { ...payload, entities: [entity] }), trace);
      });
    }
    case "alterEntityAttribute": {
      const entityUuid = String(payload.entityUuid);
      const entityName = String(payload.entityName ?? entityNameIn(state, entityUuid));
      const addColumns = (payload.addColumns ?? []) as { name: string; definition: unknown }[];
      const removeColumns = (payload.removeColumns ?? []) as string[];
      const { addColumns: _add, removeColumns: _remove, ...rest } = payload;
      const steps: MigrationStep[] = [];
      if (addColumns.length > 0) {
        const name = `add ${addColumns.map((column) => `${entityName}.${column.name}`).join(", ")}`;
        steps.push(
          modelStep(
            name,
            addColumns.every((column) => isOptional(column.definition)),
            modelActionOf("alterEntityAttribute", name, { ...rest, addColumns }),
            trace,
          ),
          ...addColumns.map((column) => emptyDataStep(`fill ${entityName}.${column.name}`)),
        );
      }
      if (removeColumns.length > 0) {
        const name = `remove ${removeColumns.map((column) => `${entityName}.${column}`).join(", ")}`;
        steps.push(modelStep(name, false, modelActionOf("alterEntityAttribute", name, { ...rest, removeColumns }), trace));
      }
      return steps;
    }
    case "renameEntity": {
      const entityUuid = String(payload.entityUuid);
      const name = `rename Entity ${String(payload.entityName ?? entityNameIn(state, entityUuid))} to ${String(payload.targetValue)}`;
      return [modelStep(name, false, modelActionOf("renameEntity", name, payload), trace)];
    }
    case "dropEntity": {
      const name = `drop Entity ${entityNameIn(state, String(payload.entityUuid))}`;
      return [modelStep(name, false, modelActionOf("dropEntity", name, payload), trace)];
    }
    default:
      return [];
  }
}

/** The collection of the meta-model Entity `entityUuid`, when the model has one. */
function collectionOf(entityUuid: string): MetaModelCollection | undefined {
  return metaModelCollections.find(({ entity }) => entity.uuid === entityUuid)?.collection;
}

/** How generation takes an object of an instance write to the model (the D2 table). */
type ObjectClass = "entityRow" | "replayed" | "settings";

function objectClass(application: string, write: InstanceWrite, object: Row): ObjectClass {
  const entityUuid = String(object.parentUuid ?? write.payload.parentUuid);
  if (entityUuid === ENTITY_ENTITY_UUID) {
    return "entityRow";
  }
  const collection = collectionOf(entityUuid);
  if (collection === undefined) {
    // a model row of no collection of the model state: replayed as the designer wrote it
    return "replayed";
  }
  if (!AGREEMENT_COLLECTIONS.includes(collection) || getApplicationSection(application, entityUuid) !== (write.payload.applicationSection ?? "model")) {
    return "settings";
  }
  return "replayed";
}

function rowLabel(row: Row): string {
  return String(row.name ?? row.defaultLabel ?? row.uuid);
}

/** The Entity name of a meta-model Entity uuid. */
function metaEntityName(entityUuid: string): string {
  return String(
    (metaModelEntities.find((entity) => (entity as Row).uuid === entityUuid) as Row | undefined)?.name ??
      metaModelCollections.find(({ entity }) => entity.uuid === entityUuid)?.entity.name ??
      entityUuid,
  );
}

/** A settings row written between the two versions: listed in `changes`, not replayed (D2). */
export type SettingsChange = {
  kind: "settingsChange";
  entity: string;
  entityName: string;
  backwardCompatible: true;
  supported: true;
  note: string;
};

/**
 * The commit records of `application` that refuse generation, checked before any step is written: an
 * incomplete one (`migrationIncompleteRecord`), then one holding an instance write on an Entity row
 * (`migrationEntityRowWrite`, #748). `undefined` when there is none.
 */
export function recordsRefusal(
  application: string,
  records: readonly EvolutionTraceRecordRow[],
  check: "incomplete" | "entityRowWrite",
): Action2Error | undefined {
  const commits = records.filter((record) => record.kind === "commit").sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  if (check === "incomplete") {
    const incomplete = commits.find((record) => record.complete === false);
    return incomplete
      ? refusal(
          `generateMigration: the commit of record ${incomplete.sequenceNumber} (${incomplete.uuid}) stopped part way: a replay of its Actions would meet its own work; re-baseline the traces and write the Migration by hand`,
          MIGRATION_GENERATION_REFUSALS.migrationIncompleteRecord,
          { record: incomplete.uuid },
        )
      : undefined;
  }
  for (const record of commits) {
    for (const action of record.actions ?? []) {
      const write = action as InstanceWrite;
      if (!INSTANCE_WRITE_ACTION_TYPES.has(write.actionType)) {
        continue;
      }
      const entityRow = (write.payload?.objects ?? []).find((object) => objectClass(application, write, object) === "entityRow");
      if (entityRow) {
        return refusal(
          `generateMigration: record ${record.sequenceNumber} (${record.uuid}) holds a ${write.actionType} of the Entity row ${rowLabel(entityRow)}: only createEntity, alterEntityAttribute, renameEntity and dropEntity may write an Entity row (#748); re-baseline the traces after the edit and write the Migration by hand`,
          MIGRATION_GENERATION_REFUSALS.migrationEntityRowWrite,
          { record: record.uuid, entity: entityRow.uuid, actionType: write.actionType },
        );
      }
    }
  }
  return undefined;
}

/**
 * The steps of the commit records between two versions, in trace order (D2), and the settings rows they
 * write. `records` hold no Entity row write and no incomplete commit (`recordsRefusal` first).
 */
export function stepsFromRecords(
  application: string,
  fromState: ModelState,
  records: readonly EvolutionTraceRecordRow[],
): { steps: MigrationStep[]; settingsChanges: SettingsChange[] } | Action2Error {
  const commits = records.filter((record) => record.kind === "commit").sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const steps: MigrationStep[] = [];
  const settings = new Map<string, SettingsChange>();
  let current = fromState;
  for (const record of commits) {
    for (const action of record.actions ?? []) {
      const actionType = String((action as { actionType?: unknown }).actionType);
      if (MODEL_STEP_ACTION_TYPES.has(actionType)) {
        steps.push(...modelActionSteps(action as { actionType: string; payload: Row }, current, record.uuid));
      } else if (INSTANCE_WRITE_ACTION_TYPES.has(actionType)) {
        const write = action as InstanceWrite;
        const objects = write.payload.objects ?? [];
        const replayed = objects.filter((object) => objectClass(application, write, object) === "replayed");
        for (const object of objects.filter((candidate) => objectClass(application, write, candidate) === "settings")) {
          const entityUuid = String(object.parentUuid ?? write.payload.parentUuid);
          settings.set(`${entityUuid}/${String(object.uuid)}`, {
            kind: "settingsChange",
            entity: entityUuid,
            entityName: metaEntityName(entityUuid),
            backwardCompatible: true,
            supported: true,
            note: `${rowLabel(object)}: not replayed, a following deployment keeps its own settings`,
          });
        }
        if (replayed.length > 0) {
          const entityUuid = String(replayed[0].parentUuid ?? write.payload.parentUuid);
          const name = `${actionType} ${metaEntityName(entityUuid)} ${replayed.map(rowLabel).join(", ")}`;
          steps.push(
            modelStep(
              name,
              true,
              {
                actionType,
                actionLabel: name,
                endpoint: INSTANCE_ENDPOINT_UUID,
                payload: { ...write.payload, applicationSection: write.payload.applicationSection ?? "model", objects: replayed },
              },
              record.uuid,
            ),
          );
        }
      }
      const next = applyModelStateActions(current, application, [action], `record ${record.sequenceNumber}`);
      if (next instanceof Action2Error) {
        return next;
      }
      current = next;
    }
  }
  return { steps, settingsChanges: [...settings.values()] };
}

/** The own Entities of a model state, by uuid, as the agreement check compares them. */
function entitiesOf(application: string, state: ModelState): Map<string, Row> {
  const metaModel = metaModelEntityUuids(metaModelEntities);
  return new Map((comparedCollections(application, state, metaModel).entities ?? []).map((entity): [string, Row] => [entity.uuid, { ...entity }]));
}

function attributesOf(entity: Row): Row {
  return ((entity.mlSchema as Row | undefined)?.definition ?? {}) as Row;
}

/**
 * With the traces off (`source: diff`), the steps from the diff of the two versions, as the same model
 * Actions in a fixed order (D2): Entities created, renamed, attributes added (with their fill steps),
 * attributes removed, Entities dropped, then the other model rows created, updated, deleted. A change no
 * model Action writes (an attribute changed, the key changed, an Entity field that changes no storage)
 * gives no step: the replay check finds it.
 */
export function stepsFromDiff(application: string, fromState: ModelState, toState: ModelState): MigrationStep[] {
  const before = entitiesOf(application, fromState);
  const after = entitiesOf(application, toState);
  const created = [...after.values()].filter((entity) => !before.has(String(entity.uuid)));
  const kept = [...after.values()].filter((entity) => before.has(String(entity.uuid)));
  const dropped = [...before.values()].filter((entity) => !after.has(String(entity.uuid)));
  const steps: MigrationStep[] = [];

  for (const entity of created) {
    steps.push(...modelActionSteps({ actionType: "createEntity", payload: { application, entities: [entity] } }, fromState));
  }
  for (const entity of kept) {
    const previous = before.get(String(entity.uuid))!;
    if (previous.name !== entity.name) {
      steps.push(
        ...modelActionSteps(
          { actionType: "renameEntity", payload: { application, entityName: previous.name, entityUuid: entity.uuid, targetValue: entity.name } },
          fromState,
        ),
      );
    }
  }
  for (const entity of kept) {
    const previousAttributes = attributesOf(before.get(String(entity.uuid))!);
    const addColumns = Object.entries(attributesOf(entity))
      .filter(([attribute]) => !(attribute in previousAttributes))
      .map(([name, definition]) => ({ name, definition }));
    if (addColumns.length > 0) {
      steps.push(
        ...modelActionSteps(
          { actionType: "alterEntityAttribute", payload: { application, entityName: entity.name, entityUuid: entity.uuid, addColumns } },
          fromState,
        ),
      );
    }
  }
  for (const entity of kept) {
    const attributes = attributesOf(entity);
    const removeColumns = Object.keys(attributesOf(before.get(String(entity.uuid))!)).filter((attribute) => !(attribute in attributes));
    if (removeColumns.length > 0) {
      steps.push(
        ...modelActionSteps(
          { actionType: "alterEntityAttribute", payload: { application, entityName: entity.name, entityUuid: entity.uuid, removeColumns } },
          fromState,
        ),
      );
    }
  }
  for (const entity of dropped) {
    steps.push(...modelActionSteps({ actionType: "dropEntity", payload: { application, entityUuid: entity.uuid } }, fromState));
  }

  // the other model rows, as instance writes of the model section
  const rowWrites: { actionType: string; rows: Row[]; entityUuid: string }[] = [];
  for (const collection of AGREEMENT_COLLECTIONS.filter((candidate) => candidate !== "entities")) {
    const entityUuid = metaModelCollections.find((entry) => entry.collection === collection)!.entity.uuid;
    const previous = new Map((fromState[collection] as Row[]).map((row) => [String(row.uuid), row]));
    const next = new Map((toState[collection] as Row[]).map((row) => [String(row.uuid), row]));
    const createdRows = [...next.values()].filter((row) => !previous.has(String(row.uuid)));
    const updatedRows = [...next.values()].filter(
      (row) => previous.has(String(row.uuid)) && JSON.stringify(previous.get(String(row.uuid))) !== JSON.stringify(row),
    );
    const deletedRows = [...previous.values()].filter((row) => !next.has(String(row.uuid)));
    rowWrites.push(
      { actionType: "createInstance", rows: createdRows, entityUuid },
      { actionType: "updateInstance", rows: updatedRows, entityUuid },
      { actionType: "deleteInstance", rows: deletedRows, entityUuid },
    );
  }
  for (const actionType of ["createInstance", "updateInstance", "deleteInstance"]) {
    for (const write of rowWrites.filter((candidate) => candidate.actionType === actionType && candidate.rows.length > 0)) {
      const name = `${actionType} ${metaEntityName(write.entityUuid)} ${write.rows.map(rowLabel).join(", ")}`;
      steps.push(
        modelStep(name, true, {
          actionType,
          actionLabel: name,
          endpoint: INSTANCE_ENDPOINT_UUID,
          payload: {
            application,
            applicationSection: getApplicationSection(application, write.entityUuid),
            parentUuid: write.entityUuid,
            objects: write.rows,
          },
        }),
      );
    }
  }
  return steps;
}

/** The model Actions of the `model` steps, in order; data steps and the Git checkout write no model row. */
function replayedActions(steps: readonly MigrationStep[]): MigrationModelStepAction[] {
  return steps
    .filter((step) => step.kind === "model")
    .map((step) => step.action as MigrationModelStepAction)
    .filter((action) => MODEL_STEP_ACTION_TYPES.has(action.actionType) || INSTANCE_WRITE_ACTION_TYPES.has(action.actionType));
}

/** `fromState` with the model steps applied in memory, in order. */
export function replaySteps(application: string, fromState: ModelState, steps: readonly MigrationStep[]): ModelState | Action2Error {
  return applyModelStateActions(fromState, application, replayedActions(steps), "a step of the Migration");
}

/**
 * The differences between the model the steps give, replayed in memory on `fromState`, and `toState`, as
 * the agreement check compares them; `undefined` when there are none.
 */
export function stepsReplayDifferences(
  application: string,
  fromState: ModelState,
  toState: ModelState,
  steps: readonly MigrationStep[],
): EvolutionTraceDifferences | Action2Error | undefined {
  const replayed = replaySteps(application, fromState, steps);
  if (replayed instanceof Action2Error) {
    return replayed;
  }
  return modelStateDifferences(application, replayed, toState);
}

/**
 * #745 D6: the differences between two model states of `application`, as the agreement check compares them
 * (the compared collections, meta-model Entities left out); `undefined` when there are none.
 */
export function modelStateDifferences(application: string, state: ModelState, reference: ModelState): EvolutionTraceDifferences | undefined {
  const metaModel = metaModelEntityUuids(metaModelEntities);
  const diff = diffModelStates(comparedCollections(application, state, metaModel), comparedCollections(application, reference, metaModel));
  return Object.keys(diff.collections).length > 0 ? summarize(diff) : undefined;
}

export { differencesText };

/** `versioned-git` (D1): the one model step, the checkout of the `to` version, then a fill step per added attribute. */
export function gitSteps(application: string, to: string, addedAttributes: readonly { entityName: string; attribute: string }[]): MigrationStep[] {
  const name = `checkout ${to}`;
  return [
    modelStep(name, true, { actionType: GIT_CHECKOUT_ACTION_TYPE, actionLabel: name, endpoint: MODEL_ENDPOINT_UUID, payload: { application, version: to } }),
    ...addedAttributes.map(({ entityName, attribute }) => emptyDataStep(`fill ${entityName}.${attribute}`)),
  ];
}
