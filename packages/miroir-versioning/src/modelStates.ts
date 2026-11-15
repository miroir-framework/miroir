/**
 * #708 part B: the states of an application's model. A model state is a `MetaModel` holding every
 * collection of the one list of core (`metaModelCollections`, analysis D7-a), whatever it is read from: the
 * live model, a frozen version, or the model files at a Git ref.
 */
import {
  Action2Error,
  buildMetaModelCollections,
  getApplicationSection,
  metaModelCollections,
  ModelEntityActionTransformer,
  TransformerFailure,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  type ApplicationSection,
  type EntityInstance,
  type EvolutionTraceRecordRow,
  type GitRepositoryInterface,
  type MetaModel,
  type MetaModelCollection,
  type ModelAction,
} from "@miroir-framework/core";

import {
  blobVersionType,
  endpointVersionType,
  entityVersionType,
  FREEZE_IDENTITY_ATTRIBUTES,
  menuVersionType,
  miroirTestVersionType,
  mlSchemaVersionType,
  queryVersionType,
  reportVersionType,
  runnerVersionType,
  testConfigurationVersionType,
  themeVersionType,
  transformerDefinitionVersionType,
  type VersionedElementType,
} from "./applicationVersionFreeze.js";

/** The model of an application at one point of its history, in the shape of its live model. */
export type ModelState = MetaModel;

/**
 * The live model of `application`: each collection read from the section where its Entity's rows are
 * (`model`, or `modelVersion` for the history), from the store of this process or from the server.
 */
export async function liveModelState(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<ModelState | Action2Error> {
  const read = await Promise.all(
    metaModelCollections.map(({ entity }) =>
      host.readSectionInstances(
        application,
        applicationDeploymentMap,
        getApplicationSection(application, entity.uuid),
        entity.uuid,
      ),
    ),
  );
  const failed = read.find((rows): rows is Action2Error => rows instanceof Action2Error);
  if (failed) {
    return new Action2Error(
      "FailedToHandleAction",
      `liveModelState could not read the model of ${application}`,
      [],
      failed,
    );
  }
  const collections = buildMetaModelCollections((_entry, index) => read[index] as EntityInstance[]);
  return {
    applicationUuid: application,
    applicationName: collections.applications.find((row) => row.uuid === application)?.name ?? "",
    ...collections,
  };
}

/**
 * A collection a freeze snapshots: the version rows of a version are the rows of `versions` that a row of
 * `cross` links to it through `crossAttribute`.
 */
type FrozenCollection = {
  collection: MetaModelCollection;
  versions: MetaModelCollection;
  cross: MetaModelCollection;
  crossAttribute: string;
  type: VersionedElementType;
};

const frozenCollections: readonly FrozenCollection[] = [
  { collection: "entities", versions: "entityVersions", cross: "applicationVersionCrossEntityVersion", crossAttribute: "entityVersion", type: entityVersionType },
  { collection: "storedQueries", versions: "queryVersions", cross: "applicationVersionCrossQueryVersion", crossAttribute: "queryVersion", type: queryVersionType },
  { collection: "reports", versions: "reportVersions", cross: "applicationVersionCrossReportVersion", crossAttribute: "reportVersion", type: reportVersionType },
  { collection: "menus", versions: "menuVersions", cross: "applicationVersionCrossMenuVersion", crossAttribute: "menuVersion", type: menuVersionType },
  { collection: "endpoints", versions: "endpointVersions", cross: "applicationVersionCrossEndpointVersion", crossAttribute: "endpointVersion", type: endpointVersionType },
  { collection: "runners", versions: "runnerVersions", cross: "applicationVersionCrossRunnerVersion", crossAttribute: "runnerVersion", type: runnerVersionType },
  { collection: "themes", versions: "themeVersions", cross: "applicationVersionCrossThemeVersion", crossAttribute: "themeVersion", type: themeVersionType },
  {
    collection: "transformerDefinitions",
    versions: "transformerDefinitionVersions",
    cross: "applicationVersionCrossTransformerDefinitionVersion",
    crossAttribute: "transformerDefinitionVersion",
    type: transformerDefinitionVersionType,
  },
  { collection: "mlSchemas", versions: "mlSchemaVersions", cross: "applicationVersionCrossMlSchemaVersion", crossAttribute: "mlSchemaVersion", type: mlSchemaVersionType },
  { collection: "tests", versions: "miroirTestVersions", cross: "applicationVersionCrossMiroirTestVersion", crossAttribute: "miroirTestVersion", type: miroirTestVersionType },
  { collection: "blobs", versions: "blobVersions", cross: "applicationVersionCrossBlobVersion", crossAttribute: "blobVersion", type: blobVersionType },
  {
    collection: "testConfigurations",
    versions: "testConfigurationVersions",
    cross: "applicationVersionCrossTestConfigurationVersion",
    crossAttribute: "testConfigurationVersion",
    type: testConfigurationVersionType,
  },
];

/** Versions frozen before #708 part B keep these TransformerDefinition attributes under `definition`. */
const LEGACY_TRANSFORMER_DEFINITION_BODY = ["classification", "runnableAsSql", "transformerInterface", "transformerImplementation"];

type Row = Record<string, unknown>;

function rowsOf(model: MetaModel, collection: MetaModelCollection): Row[] {
  return model[collection] as Row[];
}

/** The live row a version row was minted from: its attributes, under the live row's uuid and Entity. */
function liveRowOfVersion(version: Row, frozen: FrozenCollection): Row {
  const liveEntity = metaModelCollections.find(({ collection }) => collection === frozen.collection)!.entity;
  const keptIdentity = frozen.type === entityVersionType ? ["conceptLevel"] : [];
  const attributes = Object.fromEntries(
    Object.entries(version).filter(
      ([attribute]) =>
        attribute !== frozen.type.liveUuidAttribute &&
        (!FREEZE_IDENTITY_ATTRIBUTES.includes(attribute) || keptIdentity.includes(attribute)),
    ),
  );
  const body = attributes.definition as Row | undefined;
  if (frozen.type === transformerDefinitionVersionType && body && attributes.transformerImplementation === undefined) {
    delete attributes.definition;
    LEGACY_TRANSFORMER_DEFINITION_BODY.filter((attribute) => body[attribute] !== undefined).forEach((attribute) => {
      attributes[attribute] = body[attribute];
    });
  }
  return {
    uuid: version[frozen.type.liveUuidAttribute],
    parentUuid: liveEntity.uuid,
    parentName: liveEntity.name,
    ...attributes,
  };
}

/**
 * The model of `application` as frozen at `applicationVersion`: each snapshotted collection holds the live
 * rows its version rows were minted from (their `parentDefinitionVersionUuid` and, but on Entities,
 * `conceptLevel` are not kept by a freeze). The application, its branches and the Application Version are
 * those of the live model; the other history collections are empty.
 */
export async function frozenModelState(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  applicationVersion: string,
): Promise<ModelState | Action2Error> {
  const live = await liveModelState(host, application, applicationDeploymentMap);
  return live instanceof Action2Error ? live : frozenStateOf(live, applicationVersion);
}

/** `frozenModelState` on a live model state already read: the version rows are among its collections. */
export function frozenStateOf(live: ModelState, applicationVersion: string): ModelState | Action2Error {
  const version = live.applicationVersions.find((row) => row.uuid === applicationVersion);
  if (!version) {
    return new Action2Error(
      "FailedToHandleAction",
      `frozenModelState found no Application Version ${applicationVersion} for ${live.applicationUuid}`,
    );
  }
  const frozenRows = new Map(
    frozenCollections.map((frozen) => {
      const versionsByUuid = new Map(rowsOf(live, frozen.versions).map((row) => [row.uuid, row]));
      const rows = rowsOf(live, frozen.cross)
        .filter((cross) => cross.applicationVersion === applicationVersion)
        .map((cross) => versionsByUuid.get(cross[frozen.crossAttribute]))
        .filter((row): row is Row => row !== undefined)
        .map((row) => liveRowOfVersion(row, frozen));
      return [frozen.collection, rows];
    }),
  );
  const collections = buildMetaModelCollections(({ collection }) => {
    if (collection === "applications" || collection === "applicationModelBranches") {
      return live[collection];
    }
    if (collection === "applicationVersions") {
      return [version];
    }
    return frozenRows.get(collection) ?? [];
  });
  return { applicationUuid: live.applicationUuid, applicationName: live.applicationName, ...collections };
}

/**
 * The model of `application` in the files of a Git commit (`ref`), read from the commit without a checkout:
 * each collection holds the JSON files of its Entity's folder (`<section folder>/<Entity uuid>/*.json`) in
 * the folder of the section its rows belong to. `sectionFolders` gives each section's folder,
 * repository-relative (`library_model`); a section without a folder reads as empty. `ref` is resolved to
 * one commit first, so that a ref moved during the read does not mix two commits; a ref that names no
 * commit reads as an empty model.
 */
export async function gitModelState(
  repository: Pick<GitRepositoryInterface, "listFiles" | "log" | "readFile">,
  application: string,
  sectionFolders: Partial<Record<ApplicationSection, string>>,
  ref: string,
): Promise<ModelState> {
  const commit = (await repository.log({ ref, depth: 1 }))[0]?.oid;
  const files = commit ? await repository.listFiles(commit) : [];
  const read = await Promise.all(
    metaModelCollections.map(async ({ entity }) => {
      const folder = sectionFolders[getApplicationSection(application, entity.uuid)];
      if (folder === undefined || !commit) {
        return [];
      }
      const prefix = `${folder.replace(/\/+$/, "")}/${entity.uuid}/`;
      const paths = files.filter((path) => path.startsWith(prefix) && path.endsWith(".json") && !path.slice(prefix.length).includes("/"));
      const texts = await Promise.all(paths.map((path) => repository.readFile(path, commit)));
      return texts.filter((text): text is string => text !== undefined).map((text) => JSON.parse(text) as EntityInstance);
    }),
  );
  const collections = buildMetaModelCollections((_entry, index) => read[index]);
  return {
    applicationUuid: application,
    applicationName: collections.applications.find((row) => row.uuid === application)?.name ?? "",
    ...collections,
  };
}

/** The model Actions a record holds; its other Actions are instance writes. */
const REPLAYED_MODEL_ACTION_TYPES: ReadonlySet<string> = new Set(["createEntity", "alterEntityAttribute", "renameEntity", "dropEntity"]);

/** An instance write as a record holds it (`recordedInstanceWrite` of core). */
type RecordedInstanceWrite = {
  actionType: string;
  payload: { application: string; applicationSection?: string; parentUuid?: string; objects?: Row[] };
};

/**
 * `state` with an instance write applied: each object goes to the collection of its Entity, when that
 * Entity is a collection of the model and the write is to the section where its rows are. A create or an
 * update replaces the row of the same uuid or adds it; a delete removes it.
 */
function applyInstanceWrite(state: ModelState, write: RecordedInstanceWrite): ModelState {
  const next: ModelState = { ...state };
  for (const object of write.payload.objects ?? []) {
    const entityUuid = String(object.parentUuid ?? write.payload.parentUuid);
    const entry = metaModelCollections.find(({ entity }) => entity.uuid === entityUuid);
    if (!entry || getApplicationSection(state.applicationUuid, entityUuid) !== write.payload.applicationSection) {
      continue;
    }
    const others = rowsOf(next, entry.collection).filter((row) => row.uuid !== object.uuid);
    Object.assign(next, { [entry.collection]: write.actionType === "deleteInstance" ? others : [...others, object] });
  }
  return next;
}

/** `state` with the Actions of one record applied, in order; model Actions become instance writes first. */
function applyRecordActions(state: ModelState, record: EvolutionTraceRecordRow): ModelState | Action2Error {
  let current = state;
  for (const action of record.actions ?? []) {
    const actionType = String((action as { actionType?: unknown }).actionType);
    if (!REPLAYED_MODEL_ACTION_TYPES.has(actionType)) {
      current = applyInstanceWrite(current, action as RecordedInstanceWrite);
      continue;
    }
    let writes: ReturnType<typeof ModelEntityActionTransformer.modelActionToInstanceAction>;
    try {
      writes = ModelEntityActionTransformer.modelActionToInstanceAction(record.application, action as ModelAction, current);
    } catch (error) {
      writes = new TransformerFailure({ queryFailure: "FailedTransformer", failureMessage: String(error) });
    }
    if (writes instanceof TransformerFailure) {
      return new Action2Error(
        "FailedToHandleAction",
        `replayEvolutionTraceRecords could not replay ${actionType} of record ${record.sequenceNumber}: ${writes.failureMessage ?? ""}`,
      );
    }
    current = writes.reduce((replayed, write) => applyInstanceWrite(replayed, write as RecordedInstanceWrite), current);
  }
  return current;
}

/**
 * The model of an application after `state`, a frozen model state, with the `commit` records of its chain
 * that follow the marker of its Application Version (a `version` marker, or a `rebaseline` naming it, #708
 * part C), replayed in sequence order. A record that
 * is not complete (its commit stopped part way) replays the Actions it holds, which are those the commit
 * wrote. An `Action2Error` when the chain has no marker for the version, or restarts (`rebaseline`) after it.
 */
export function replayEvolutionTraceRecords(
  state: ModelState,
  records: readonly EvolutionTraceRecordRow[],
): ModelState | Action2Error {
  const version = state.applicationVersions.length === 1 ? state.applicationVersions[0].uuid : undefined;
  const chain = records
    .filter((record) => record.application === state.applicationUuid)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const marker = chain.reduce(
    (last, record, index) =>
      (record.kind === "version" || record.kind === "rebaseline") && record.version === version ? index : last,
    -1,
  );
  if (version === undefined || marker < 0) {
    return new Action2Error(
      "FailedToHandleAction",
      `replayEvolutionTraceRecords found no version marker for the Application Version of the state (${version ?? "not one version"})`,
    );
  }
  const since = chain.slice(marker + 1);
  if (since.some((record) => record.kind === "rebaseline")) {
    return new Action2Error(
      "FailedToHandleAction",
      `replayEvolutionTraceRecords: the chain of ${state.applicationUuid} restarts after the marker of version ${version}`,
    );
  }
  let current: ModelState = state;
  for (const record of since.filter((record) => record.kind === "commit")) {
    const replayed = applyRecordActions(current, record);
    if (replayed instanceof Action2Error) {
      return replayed;
    }
    current = replayed;
  }
  return current;
}
