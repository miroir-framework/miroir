/**
 * #9: the rewrite of an application's model to a target model state (`applyModelState`, analysis D2), and
 * the install of a version on a following deployment (`installApplicationVersion`, D6). Both run where the
 * stores are, and only call the DomainController through `DomainControllerActionHost`.
 *
 * The rewrite touches the application's own model rows only: the collections the agreement check compares,
 * without the meta-model Entities its model holds (history, records), the SelfApplication, its branches and
 * versions. An added Entity is created with `createEntity`, an added attribute with `alterEntityAttribute`
 * before the Entity row gets its target value, so that storage follows as when a designer runs them;
 * removed Entities and attributes are left in storage for the contract phase. Every write carries the run
 * mark, the only model write a following deployment accepts.
 */
import {
  Action2Error,
  ACTION_OK,
  DEPLOYMENT_STATE_ENTITY_UUID,
  deploymentRoleOf,
  getApplicationSection,
  markMigrationRun,
  metaModelEntities,
  MiroirLoggerFactory,
  type Action2ReturnType,
  type ActionImplementationContext,
  type ActionImplementationHandler,
  type ApplicationDeploymentMap,
  type DeploymentStateRow,
  type DomainControllerActionHost,
  type Entity,
  type EntityInstance,
  type InstallApplicationVersionActionPayload,
  type LoggerInterface,
  type MetaModelCollection,
  type MiroirModelEnvironment,
} from "@miroir-framework/core";
import { adminSelfApplication, entityDeploymentState } from "@miroir-framework/core/admin";
import { entityEvolutionTraceRecord } from "@miroir-framework/core/meta-model";

import { selectEntitiesToFreeze } from "./applicationVersionFreeze.js";
import { AGREEMENT_COLLECTIONS } from "./evolutionTraceAgreement.js";
import { withApplicationLock } from "./evolutionTraceRecords.js";
import { refusal, storedDeploymentRow, withAdmin } from "./deploymentRole.js";
import { HISTORY_ENTITIES, metaModelEntityUuids } from "./freezeApplicationVersion.js";
import { frozenCollectionsOf, frozenStateOf, liveModelState, type ModelState } from "./modelStates.js";
import { sameJson } from "./modelStateDiff.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("miroir-versioning", "3", "applicationVersionInstall");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const MIROIR_SELF_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

type Row = Record<string, unknown>;

/** The live attributes a frozen row does not hold, kept on the rows the rewrite updates. */
const KEPT_LIVE_ATTRIBUTES = ["parentDefinitionVersionUuid", "conceptLevel"] as const;

/** What a rewrite changed, by collection: the uuids of the rows created, updated and deleted. */
export type ModelStateRewrite = Partial<Record<MetaModelCollection, { created: string[]; updated: string[]; deleted: string[] }>>;

/** The model environment of `application` on the deployment the map names. */
export function modelEnvironmentOf(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment | undefined,
): MiroirModelEnvironment {
  if (
    modelEnvironment?.deploymentUuid !== undefined &&
    modelEnvironment.deploymentUuid === applicationDeploymentMap[application]
  ) {
    return modelEnvironment;
  }
  return host.asDomainControllerInterface().currentModelEnvironment(application, applicationDeploymentMap);
}

/** Loads the model of `application` from its stores into this process's local cache. */
export function reloadModel(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment | undefined,
): Promise<Action2ReturnType> {
  return host.handleModelAction(
    { actionType: "rollback", actionLabel: "applicationVersionInstallReload", endpoint: MODEL_ENDPOINT_UUID, payload: { application } },
    applicationDeploymentMap,
    modelEnvironmentOf(host, application, applicationDeploymentMap, modelEnvironment),
  );
}

/** The rows of a collection the rewrite owns: an application's own Entities, or every row of the others. */
function ownedRows(application: string, state: ModelState, collection: MetaModelCollection): Row[] {
  if (collection === "entities") {
    return selectEntitiesToFreeze(application, state.entities, metaModelEntityUuids(metaModelEntities)).map((entity): Row => ({ ...entity }));
  }
  return (state[collection] as readonly object[]).map((row): Row => ({ ...row }));
}

/** The target row, with the live values of the attributes a frozen row does not hold. */
function withKeptLiveAttributes(target: Row, live: Row): Row {
  const kept = Object.fromEntries(
    KEPT_LIVE_ATTRIBUTES.filter((attribute) => live[attribute] !== undefined).map((attribute) => [attribute, live[attribute]]),
  );
  return { ...target, ...kept };
}

/** The attributes the target Entity declares and the live one does not. */
function addedAttributes(live: Row, target: Row): { name: string; definition: unknown }[] {
  const liveDefinition = ((live.mlSchema as Row | undefined)?.definition ?? {}) as Row;
  const targetDefinition = ((target.mlSchema as Row | undefined)?.definition ?? {}) as Row;
  return Object.entries(targetDefinition)
    .filter(([name]) => !(name in liveDefinition))
    .map(([name, definition]) => ({ name, definition }));
}

/**
 * The storage changes of an Entity the target changes, through the model actions a designer runs: a
 * rename (a SQL store names the table after the Entity), then the attributes the target adds. Attributes
 * the target removes or changes stay in storage, for the contract phase.
 */
async function alterEntityStorage(
  modelAction: (action: Record<string, unknown>) => Promise<Action2ReturnType>,
  application: string,
  liveRow: Row,
  targetRow: Row,
): Promise<Action2Error | undefined> {
  const entityUuid = liveRow.uuid as string;
  if (liveRow.name !== targetRow.name) {
    const renamed = await modelAction({
      actionType: "renameEntity",
      actionLabel: "applyModelState renameEntity",
      payload: { application, transactional: false, entityName: liveRow.name, entityUuid, targetValue: targetRow.name },
    });
    if (renamed instanceof Action2Error) {
      return renamed;
    }
  }
  const addColumns = addedAttributes(liveRow, targetRow);
  if (addColumns.length === 0) {
    return undefined;
  }
  const altered = await modelAction({
    actionType: "alterEntityAttribute",
    actionLabel: "applyModelState alterEntityAttribute",
    payload: { application, transactional: false, entityName: targetRow.name, entityUuid, addColumns },
  });
  return altered instanceof Action2Error ? altered : undefined;
}

/**
 * Rewrites the model of `application` (on the deployment `applicationDeploymentMap` names) from `current`,
 * its live state, to `target`. Stops at the first failed write.
 */
export async function applyModelState(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  current: ModelState,
  target: ModelState,
  modelEnvironment?: MiroirModelEnvironment,
  collections: readonly MetaModelCollection[] = AGREEMENT_COLLECTIONS,
): Promise<ModelStateRewrite | Action2Error> {
  const environment = modelEnvironmentOf(host, application, applicationDeploymentMap, modelEnvironment);
  const rewrite: ModelStateRewrite = {};

  const instanceWrite = async (actionType: "createInstance" | "updateInstance" | "deleteInstance", row: Row) => {
    const parentUuid = row.parentUuid as string;
    return host.handleInstanceAction(
      markMigrationRun({
        actionType,
        actionLabel: `applyModelState ${actionType}`,
        endpoint: INSTANCE_ENDPOINT_UUID,
        payload: {
          application,
          applicationSection: getApplicationSection(application, parentUuid),
          parentUuid,
          objects: [row as EntityInstance],
        },
      }) as any,
      applicationDeploymentMap,
    );
  };
  const modelAction = (action: Record<string, unknown>) =>
    host.handleModelAction(
      markMigrationRun({ endpoint: MODEL_ENDPOINT_UUID, ...action }) as any,
      applicationDeploymentMap,
      environment,
    );
  const failed = (what: string, error: Action2Error) =>
    new Action2Error("FailedToHandleAction", `applyModelState of ${application}: ${what}`, [], error);

  for (const collection of collections) {
    const liveRows = new Map(ownedRows(application, current, collection).map((row) => [row.uuid as string, row]));
    const targetRows = ownedRows(application, target, collection);
    const done = { created: [] as string[], updated: [] as string[], deleted: [] as string[] };
    const targetUuids = new Set(targetRows.map((row) => row.uuid as string));

    for (const targetRow of targetRows) {
      const uuid = targetRow.uuid as string;
      const liveRow = liveRows.get(uuid);
      if (!liveRow) {
        const created =
          collection === "entities"
            ? await modelAction({
                actionType: "createEntity",
                actionLabel: "applyModelState createEntity",
                payload: { application, transactional: false, entities: [targetRow] },
              })
            : await instanceWrite("createInstance", targetRow);
        if (created instanceof Action2Error) {
          return failed(`could not create ${collection} row ${uuid}`, created);
        }
        done.created.push(uuid);
        continue;
      }
      const next = withKeptLiveAttributes(targetRow, liveRow);
      if (sameJson(next, liveRow)) {
        continue;
      }
      if (collection === "entities") {
        const storageFailure = await alterEntityStorage(modelAction, application, liveRow, targetRow);
        if (storageFailure) {
          return failed(`could not change the storage of Entity ${uuid}`, storageFailure);
        }
      }
      const updated = await instanceWrite("updateInstance", next);
      if (updated instanceof Action2Error) {
        return failed(`could not update ${collection} row ${uuid}`, updated);
      }
      done.updated.push(uuid);
    }

    for (const [uuid, liveRow] of liveRows) {
      if (targetUuids.has(uuid)) {
        continue;
      }
      // an Entity's storage stays, for the contract phase: only its row goes
      const deleted = await instanceWrite("deleteInstance", liveRow);
      if (deleted instanceof Action2Error) {
        return failed(`could not delete ${collection} row ${uuid}`, deleted);
      }
      done.deleted.push(uuid);
    }
    if (done.created.length + done.updated.length + done.deleted.length > 0) {
      rewrite[collection] = done;
    }
  }
  return rewrite;
}

/**
 * The meta-model Entities a following deployment reads its shared `modelVersion` section with (the history
 * Entities and the record Entity), created in its model when absent: the freeze and the record writer
 * create them on the authoring deployment only.
 */
async function ensureVersionHistoryEntities(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  current: ModelState,
  modelEnvironment: MiroirModelEnvironment | undefined,
): Promise<Action2Error | undefined> {
  const present = new Set(current.entities.map((entity) => entity.uuid));
  const missing = [...HISTORY_ENTITIES, entityEvolutionTraceRecord as Entity].filter((entity) => !present.has(entity.uuid));
  if (missing.length === 0) {
    return undefined;
  }
  const created = await host.handleModelAction(
    markMigrationRun({
      actionType: "createEntity",
      actionLabel: "installApplicationVersionEnsureHistoryEntities",
      endpoint: MODEL_ENDPOINT_UUID,
      payload: { application, transactional: false, entities: missing },
    }) as any,
    applicationDeploymentMap,
    modelEnvironmentOf(host, application, applicationDeploymentMap, modelEnvironment),
  );
  return created instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `could not create the history Entities of ${application}`, [], created)
    : undefined;
}

/**
 * The DeploymentState row of `deploymentUuid`, read from the store; `undefined` when it has none, or when
 * the Admin model has no DeploymentState Entity yet (Admin stores older than #9). A read that fails is an
 * error: it never reads as "not installed".
 */
export async function storedDeploymentState(
  host: DomainControllerActionHost,
  deploymentUuid: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<DeploymentStateRow | undefined | Action2Error> {
  const map = withAdmin(applicationDeploymentMap);
  const entities = await host.readSectionInstances(adminSelfApplication.uuid, map, "model", ENTITY_ENTITY_UUID);
  if (entities instanceof Action2Error) {
    return entities;
  }
  if (!entities.some((entity) => entity.uuid === DEPLOYMENT_STATE_ENTITY_UUID)) {
    return undefined;
  }
  const rows = await host.readSectionInstances(adminSelfApplication.uuid, map, "data", DEPLOYMENT_STATE_ENTITY_UUID);
  return rows instanceof Action2Error ? rows : (rows.find((row) => row.uuid === deploymentUuid) as DeploymentStateRow | undefined);
}

/** The DeploymentState Entity, created in the Admin model when absent (Admin stores older than #9). */
async function ensureDeploymentStateEntity(
  host: DomainControllerActionHost,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  const map = withAdmin(applicationDeploymentMap);
  const entities = await host.readSectionInstances(adminSelfApplication.uuid, map, "model", ENTITY_ENTITY_UUID);
  if (entities instanceof Action2Error) {
    return entities;
  }
  if (entities.some((entity) => entity.uuid === DEPLOYMENT_STATE_ENTITY_UUID)) {
    return undefined;
  }
  const created = await host.handleModelAction(
    {
      actionType: "createEntity",
      actionLabel: "installApplicationVersionEnsureDeploymentStateEntity",
      endpoint: MODEL_ENDPOINT_UUID,
      payload: { application: adminSelfApplication.uuid, transactional: false, entities: [entityDeploymentState as Entity] },
    },
    map,
    host.asDomainControllerInterface().currentModelEnvironment(adminSelfApplication.uuid, map),
  );
  return created instanceof Action2Error ? created : undefined;
}

/** Writes the DeploymentState row of a deployment: created, or replaced when it has one. */
export async function writeDeploymentState(
  host: DomainControllerActionHost,
  state: Omit<DeploymentStateRow, "uuid" | "parentName" | "parentUuid">,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  const ensured = await ensureDeploymentStateEntity(host, applicationDeploymentMap);
  if (ensured) {
    return new Action2Error("FailedToHandleAction", "could not create the DeploymentState Entity", [], ensured);
  }
  const existing = await storedDeploymentState(host, state.deployment, applicationDeploymentMap);
  if (existing instanceof Action2Error) {
    return existing;
  }
  const row: DeploymentStateRow = {
    uuid: state.deployment,
    parentName: entityDeploymentState.name,
    parentUuid: DEPLOYMENT_STATE_ENTITY_UUID,
    ...state,
  };
  const written = await host.handleInstanceAction(
    {
      actionType: existing ? "updateInstance" : "createInstance",
      actionLabel: "writeDeploymentState",
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        parentUuid: DEPLOYMENT_STATE_ENTITY_UUID,
        objects: [row],
      },
    } as any,
    withAdmin(applicationDeploymentMap),
  );
  return written instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `could not write the DeploymentState of ${state.deployment}`, [], written)
    : undefined;
}

/**
 * #9: brings the model of a following deployment to the version named `version`: the model read again
 * from the store, the version's frozen state checked complete, the history Entities ensured, then the
 * rewrite of the model (`applyModelState`). The installation of a version and the jump of a migration run
 * share it. `label` names the action in the refusals.
 */
export async function bringModelToVersion(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  version: string,
  modelEnvironment: MiroirModelEnvironment | undefined,
  label: string,
): Promise<ModelStateRewrite | Action2Error> {
  // the model actions of the rewrite read the deployment's model in this process's local cache
  const loaded = await reloadModel(host, application, applicationDeploymentMap, modelEnvironment);
  if (loaded instanceof Action2Error) {
    return loaded;
  }
  const current = await liveModelState(host, application, applicationDeploymentMap);
  if (current instanceof Action2Error) {
    return current;
  }
  const versionRow = current.applicationVersions.find((row) => row.name === version);
  if (!versionRow) {
    return new Action2Error("FailedToHandleAction", `${label}: ${application} has no Application Version named ${version}`);
  }
  const target = frozenStateOf(current, versionRow.uuid);
  if (target instanceof Action2Error) {
    return target;
  }
  const frozen = frozenCollectionsOf(current, versionRow.uuid);
  const incomplete = frozen.filter(({ missingVersionRows }) => missingVersionRows.length > 0);
  if (incomplete.length > 0) {
    return refusal(
      `${label}: version ${version} of ${application} names rows it does not hold (${incomplete
        .map(({ collection, missingVersionRows }) => `${collection}: ${missingVersionRows.join(", ")}`)
        .join("; ")})`,
      "versionIncomplete",
    );
  }
  // the version row names the collections its freeze snapshotted (#9); a version frozen before #9 does
  // not, and one frozen before #706 has no Cross rows for these collections: they are unknown, not empty
  const snapshotted = (versionRow as { frozenCollections?: string[] }).frozenCollections;
  const collections = AGREEMENT_COLLECTIONS.filter(
    (collection) =>
      !COLLECTIONS_FROZEN_SINCE_706.includes(collection) ||
      (snapshotted
        ? snapshotted.includes(collection)
        : (frozen.find((entry) => entry.collection === collection)?.crossRows ?? 0) > 0),
  );
  const ensured = await ensureVersionHistoryEntities(host, application, applicationDeploymentMap, current, modelEnvironment);
  if (ensured) {
    return ensured;
  }
  return applyModelState(host, application, applicationDeploymentMap, current, target, modelEnvironment, collections);
}

/**
 * `installApplicationVersion`: on a following deployment, rewrites the application's model to the version
 * named `version` (read from the `modelVersion` section the deployment shares with its authoring one), then
 * writes the deployment's DeploymentState row with that version.
 */
export const handleAction_installApplicationVersion: ActionImplementationHandler = (
  host,
  action,
  context: ActionImplementationContext,
): Promise<Action2ReturnType> => {
  const { application } = action.payload as InstallApplicationVersionActionPayload;
  const deploymentUuid = context.applicationDeploymentMap[application];
  if (!deploymentUuid) {
    return Promise.resolve(new Action2Error("FailedToHandleAction", `installApplicationVersion: no deployment of ${application}`));
  }
  // the check that the deployment is not installed, the rewrite and the state write are one step
  return withApplicationLock(`deployment:${deploymentUuid}`, () => installApplicationVersion(host, action, context, deploymentUuid));
};

async function installApplicationVersion(
  host: DomainControllerActionHost,
  action: { payload: unknown },
  context: ActionImplementationContext,
  deploymentUuid: string,
): Promise<Action2ReturnType> {
  const { application, version } = action.payload as InstallApplicationVersionActionPayload;
  const { applicationDeploymentMap } = context;
  const deploymentRow = await storedDeploymentRow(host, deploymentUuid, applicationDeploymentMap);
  if (deploymentRow instanceof Action2Error) {
    return deploymentRow;
  }
  const installedState = await storedDeploymentState(host, deploymentUuid, applicationDeploymentMap);
  if (installedState instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `installApplicationVersion: could not read the state of deployment ${deploymentUuid}`, [], installedState);
  }
  if (deploymentRoleOf(deploymentRow) === "following" && installedState) {
    return refusal(
      `installApplicationVersion: deployment ${deploymentUuid} of ${application} is installed already; it changes version by a migration run`,
      "deploymentInstalled",
      { deployment: deploymentUuid },
    );
  }
  if (application === adminSelfApplication.uuid || application === MIROIR_SELF_APPLICATION_UUID || deploymentRoleOf(deploymentRow) !== "following") {
    return refusal(
      `installApplicationVersion: deployment ${deploymentUuid} of ${application} is an authoring deployment; a version is installed on a following deployment only`,
      "deploymentAuthors",
      { deployment: deploymentUuid },
    );
  }

  const installed = await (async (): Promise<Action2Error | undefined> => {
    const rewritten = await bringModelToVersion(host, application, applicationDeploymentMap, version, context.modelEnvironment, "installApplicationVersion");
    if (rewritten instanceof Action2Error) {
      return rewritten;
    }
    log.info("installApplicationVersion", application, "at", version, "on", deploymentUuid, rewritten);
    return writeDeploymentState(host, { deployment: deploymentUuid, application, version }, applicationDeploymentMap);
  })();
  // the model this process serves is the stored one, rewritten in whole or in part
  const reloaded = await reloadModel(host, application, applicationDeploymentMap, context.modelEnvironment);
  return installed ?? (reloaded instanceof Action2Error ? reloaded : ACTION_OK);
}

/** The collections a freeze snapshots since #706 only. */
const COLLECTIONS_FROZEN_SINCE_706: readonly MetaModelCollection[] = ["blobs", "tests", "testConfigurations"];
