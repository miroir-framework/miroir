/**
 * #696: the implementation of ModelEndpoint's `freezeApplicationVersion`, moved out of core's DomainController.
 * It runs in the process that holds the stores (a remote client forwards the action), after the
 * DomainController checked the `versioning` capability, and only calls the DomainController through
 * `DomainControllerActionHost`.
 *
 * Phase 6 of #216: plan the freeze against the payload application's model, then persist the
 * SelfApplicationVersion, the historical versions and their Cross rows with createInstance.
 */
import {
  Action2Error,
  ACTION_OK,
  APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE,
  getApplicationSection,
  isEvolutionTraceOn,
  metaModelEntities,
  MiroirLoggerFactory,
  resolveVersioningMode,
  selfApplicationRowLocation,
  versionHistoryEntityUuids,
  type Action2ReturnType,
  type Action2VoidReturnType,
  type ActionImplementationHandler,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type ActionImplementationContext,
  type CheckStagedEvolutionTracesPayload,
  type DomainControllerActionHost,
  type Entity,
  type EntityInstance,
  type EvolutionTraceSwitchInput,
  type FreezeApplicationVersionActionPayload,
  type LoggerInterface,
  type MiroirModelEnvironment,
  type RebaselineEvolutionTracesActionPayload,
} from "@miroir-framework/core";
import {
  entityApplicationVersionCrossBlobVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossMenuVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityApplicationVersionCrossMlSchemaVersion,
  entityApplicationVersionCrossQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityApplicationVersionCrossTestVersion,
  entityApplicationVersionCrossThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entityBlob,
  entityEntityVersion,
  entityHistoricalBlobVersion,
  entityHistoricalEndpointVersion,
  entityHistoricalMenuVersion,
  entityHistoricalMiroirTestVersion,
  entityHistoricalMlSchemaVersion,
  entityHistoricalQueryVersion,
  entityHistoricalReportVersion,
  entityHistoricalRunnerVersion,
  entityHistoricalTestConfigurationVersion,
  entityHistoricalTestVersion,
  entityHistoricalThemeVersion,
  entityHistoricalTransformerDefinitionVersion,
  entitySelfApplicationVersion,
  entityTest,
  entityTestConfiguration,
} from "@miroir-framework/core/meta-model";

import {
  loadVersionHistoryFreezeSlice,
  mergeVersionHistoryIntoFreezeMetaModel,
  planFreezeApplicationVersionFromMetaModel,
  selectEntitiesToFreeze,
  type FreezeApplicationVersionPlan,
  type FreezeMetaModelSlice,
  type StoredInstanceForFreeze,
} from "./applicationVersionFreeze.js";
import { followingDeploymentRefusal } from "./deploymentRole.js";
import { checkEvolutionTraceAgreement, checkStagedEvolutionTraceAgreement } from "./evolutionTraceAgreement.js";
import { handleAction_appendEvolutionTraceRecord } from "./evolutionTraceRecords.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("miroir-versioning", "3", "freezeApplicationVersion");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";

/**
 * The history Entities a freeze writes into, created in the application's model when absent (init or a
 * filtered model may leave them out). In the order the freeze created them before #696.
 */
export const HISTORY_ENTITIES = [
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityHistoricalQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityHistoricalReportVersion,
  entityApplicationVersionCrossMenuVersion,
  entityHistoricalMenuVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityHistoricalEndpointVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityHistoricalRunnerVersion,
  entityApplicationVersionCrossThemeVersion,
  entityHistoricalThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entityHistoricalTransformerDefinitionVersion,
  // #230
  entityApplicationVersionCrossMlSchemaVersion,
  entityHistoricalMlSchemaVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityHistoricalMiroirTestVersion,
  // #706
  entityApplicationVersionCrossBlobVersion,
  entityHistoricalBlobVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityHistoricalTestConfigurationVersion,
  entityApplicationVersionCrossTestVersion,
  entityHistoricalTestVersion,
] as Entity[];

/** The model a freeze plans against: the one the server passes from its stores, else the local cache's. */
function targetModelEnvironment(
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

/** Creates each history Entity missing from the model, outside any transaction. */
async function ensureHistoryEntities(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Action2VoidReturnType> {
  const present = new Set(modelEnvironment.currentModel.entities.map((entity) => entity.uuid));
  for (const historyEntity of HISTORY_ENTITIES) {
    if (present.has(historyEntity.uuid)) {
      continue;
    }
    const created = await host.handleModelAction(
      {
        actionType: "createEntity",
        actionLabel: `freezeEnsure${historyEntity.name}Entity`,
        endpoint: MODEL_ENDPOINT_UUID,
        payload: { application, transactional: false, entities: [historyEntity] },
      },
      applicationDeploymentMap,
      modelEnvironment,
    );
    if (created instanceof Action2Error) {
      return new Action2Error(
        "FailedToHandleAction",
        `freezeApplicationVersion failed to ensure ${historyEntity.name} Entity exists`,
        [],
        created,
      );
    }
  }
  return ACTION_OK;
}

/** The MetaModel collections a freeze plans with. */
function freezeMetaModelSlice(metaModel: MiroirModelEnvironment["currentModel"]): FreezeMetaModelSlice {
  return {
    applications: metaModel.applications,
    entities: metaModel.entities,
    storedQueries: metaModel.storedQueries,
    reports: metaModel.reports,
    menus: metaModel.menus,
    endpoints: metaModel.endpoints,
    runners: metaModel.runners,
    themes: metaModel.themes,
    transformerDefinitions: metaModel.transformerDefinitions,
    applicationVersions: metaModel.applicationVersions,
    entityVersions: metaModel.entityVersions,
    applicationVersionCrossEntityVersion: metaModel.applicationVersionCrossEntityVersion,
    applicationVersionCrossQueryVersion: metaModel.applicationVersionCrossQueryVersion,
    queryVersions: metaModel.queryVersions,
    applicationVersionCrossReportVersion: metaModel.applicationVersionCrossReportVersion,
    reportVersions: metaModel.reportVersions,
    applicationVersionCrossMenuVersion: metaModel.applicationVersionCrossMenuVersion,
    menuVersions: metaModel.menuVersions,
    applicationVersionCrossEndpointVersion: metaModel.applicationVersionCrossEndpointVersion,
    endpointVersions: metaModel.endpointVersions,
    applicationVersionCrossRunnerVersion: metaModel.applicationVersionCrossRunnerVersion,
    runnerVersions: metaModel.runnerVersions,
    applicationVersionCrossThemeVersion: metaModel.applicationVersionCrossThemeVersion,
    themeVersions: metaModel.themeVersions,
    applicationVersionCrossTransformerDefinitionVersion:
      metaModel.applicationVersionCrossTransformerDefinitionVersion,
    transformerDefinitionVersions: metaModel.transformerDefinitionVersions,
    mlSchemas: metaModel.mlSchemas,
    tests: metaModel.tests,
    applicationVersionCrossMlSchemaVersion: metaModel.applicationVersionCrossMlSchemaVersion,
    mlSchemaVersions: metaModel.mlSchemaVersions,
    applicationVersionCrossMiroirTestVersion: metaModel.applicationVersionCrossMiroirTestVersion,
    miroirTestVersions: metaModel.miroirTestVersions,
  };
}

/**
 * #706: the live Blob, TestConfiguration and Test instances a freeze snapshots. The MetaModel has no
 * collection for them, so they are read from the store: Miroir's data section, or the model section of
 * another application. A failed read fails the freeze before anything is written, so that a version never
 * silently lacks rows that exist.
 */
async function loadInstancesToFreeze(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Pick<FreezeMetaModelSlice, "blobs" | "testConfigurations" | "testInstances"> | Action2Error> {
  const loaded: StoredInstanceForFreeze[][] = [];
  for (const entity of [entityBlob, entityTestConfiguration, entityTest]) {
    const section = getApplicationSection(application, entity.uuid);
    const instances = await host.readSectionInstances(application, applicationDeploymentMap, section, entity.uuid);
    if (instances instanceof Action2Error) {
      return new Action2Error(
        "FailedToHandleAction",
        `freezeApplicationVersion failed to read the ${entity.name} instances of ${application} in section ${section}`,
        [],
        instances,
      );
    }
    loaded.push(instances as StoredInstanceForFreeze[]);
  }
  const [blobs, testConfigurations, testInstances] = loaded;
  return { blobs, testConfigurations, testInstances };
}

/** The rows of a freeze plan, in the order they are written: versions first, then their Cross rows. */
function planBatches(
  plan: FreezeApplicationVersionPlan,
): Array<[label: string, objects: unknown[], parentEntityUuid: string, section: ApplicationSection]> {
  const historySection = plan.entityVersionApplicationSection;
  return [
    ["freezeSelfApplicationVersion", [plan.selfApplicationVersion], entitySelfApplicationVersion.uuid, historySection],
    ["freezeEntityVersions", plan.entityVersions, entityEntityVersion.uuid, plan.entityVersionApplicationSection],
    ["freezeQueryVersions", plan.queryVersions, entityHistoricalQueryVersion.uuid, plan.queryVersionApplicationSection],
    ["freezeReportVersions", plan.reportVersions, entityHistoricalReportVersion.uuid, plan.reportVersionApplicationSection],
    ["freezeMenuVersions", plan.menuVersions, entityHistoricalMenuVersion.uuid, plan.menuVersionApplicationSection],
    [
      "freezeEndpointVersions",
      plan.endpointVersions,
      entityHistoricalEndpointVersion.uuid,
      plan.endpointVersionApplicationSection,
    ],
    ["freezeRunnerVersions", plan.runnerVersions, entityHistoricalRunnerVersion.uuid, plan.runnerVersionApplicationSection],
    ["freezeThemeVersions", plan.themeVersions, entityHistoricalThemeVersion.uuid, plan.themeVersionApplicationSection],
    [
      "freezeTransformerDefinitionVersions",
      plan.transformerDefinitionVersions,
      entityHistoricalTransformerDefinitionVersion.uuid,
      plan.transformerDefinitionVersionApplicationSection,
    ],
    [
      "freezeMlSchemaVersions",
      plan.mlSchemaVersions,
      entityHistoricalMlSchemaVersion.uuid,
      plan.mlSchemaVersionApplicationSection,
    ],
    [
      "freezeMiroirTestVersions",
      plan.miroirTestVersions,
      entityHistoricalMiroirTestVersion.uuid,
      plan.miroirTestVersionApplicationSection,
    ],
    // #706
    ["freezeBlobVersions", plan.blobVersions, entityHistoricalBlobVersion.uuid, historySection],
    [
      "freezeTestConfigurationVersions",
      plan.testConfigurationVersions,
      entityHistoricalTestConfigurationVersion.uuid,
      historySection,
    ],
    ["freezeTestVersions", plan.testVersions, entityHistoricalTestVersion.uuid, historySection],
    ["freezeCrossEntityVersions", plan.crossEntityVersions, entityApplicationVersionCrossEntityVersion.uuid, historySection],
    ["freezeCrossQueryVersions", plan.crossQueryVersions, entityApplicationVersionCrossQueryVersion.uuid, historySection],
    ["freezeCrossReportVersions", plan.crossReportVersions, entityApplicationVersionCrossReportVersion.uuid, historySection],
    ["freezeCrossMenuVersions", plan.crossMenuVersions, entityApplicationVersionCrossMenuVersion.uuid, historySection],
    [
      "freezeCrossEndpointVersions",
      plan.crossEndpointVersions,
      entityApplicationVersionCrossEndpointVersion.uuid,
      historySection,
    ],
    ["freezeCrossRunnerVersions", plan.crossRunnerVersions, entityApplicationVersionCrossRunnerVersion.uuid, historySection],
    ["freezeCrossThemeVersions", plan.crossThemeVersions, entityApplicationVersionCrossThemeVersion.uuid, historySection],
    [
      "freezeCrossTransformerDefinitionVersions",
      plan.crossTransformerDefinitionVersions,
      entityApplicationVersionCrossTransformerDefinitionVersion.uuid,
      historySection,
    ],
    [
      "freezeCrossMlSchemaVersions",
      plan.crossMlSchemaVersions,
      entityApplicationVersionCrossMlSchemaVersion.uuid,
      historySection,
    ],
    [
      "freezeCrossMiroirTestVersions",
      plan.crossMiroirTestVersions,
      entityApplicationVersionCrossMiroirTestVersion.uuid,
      historySection,
    ],
    ["freezeCrossBlobVersions", plan.crossBlobVersions, entityApplicationVersionCrossBlobVersion.uuid, historySection],
    [
      "freezeCrossTestConfigurationVersions",
      plan.crossTestConfigurationVersions,
      entityApplicationVersionCrossTestConfigurationVersion.uuid,
      historySection,
    ],
    ["freezeCrossTestVersions", plan.crossTestVersions, entityApplicationVersionCrossTestVersion.uuid, historySection],
  ];
}

/**
 * #216 Phase 6: persists the rows of a freeze plan at once, with createInstance (no transactional
 * createEntity, no commit replay).
 */
async function persistFreezeApplicationVersionPlan(
  host: DomainControllerActionHost,
  plan: FreezeApplicationVersionPlan,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2VoidReturnType> {
  for (const [actionLabel, objects, , applicationSection] of planBatches(plan)) {
    if (objects.length === 0) {
      continue;
    }
    const result = await host.handleInstanceAction(
      {
        actionType: "createInstance",
        actionLabel,
        endpoint: INSTANCE_ENDPOINT_UUID,
        payload: { application, applicationSection, objects: objects as EntityInstance[] },
      },
      applicationDeploymentMap,
    );
    if (result instanceof Action2Error) {
      return new Action2Error("FailedToHandleAction", `freezeApplicationVersion failed to persist ${actionLabel}`, [], result);
    }
  }
  return ACTION_OK;
}

/** Freezes the application the payload names, from the model of its own deployment. */
export const handleAction_freezeApplicationVersion: ActionImplementationHandler = async (host, action, context) => {
  const payload = action.payload as FreezeApplicationVersionActionPayload;
  // #9: a version is frozen on the authoring deployment
  const following = await followingDeploymentRefusal(host, "freezeApplicationVersion", payload.application, context.applicationDeploymentMap);
  return following ?? freezeVersion(host, payload, context, "version");
};

/**
 * #708 part C: restarts the application's traces from its current model. A `versioned-internal`
 * application freezes `versionName` without the agreement check, its marker a `rebaseline` naming the
 * version; a `versioned-git` application appends a `rebaseline` marker, which the next Git commit holds with
 * the model. Refused while the traces are off.
 */
/**
 * #708 part C: the check `gitAction_commit` runs on an application with traces on (`versioned-git`): the
 * model the commit holds must be the model of HEAD replayed with the commit records it adds.
 */
export const handleAction_checkStagedEvolutionTraces: ActionImplementationHandler = async (_host, action) => {
  const payload = (action as { payload: CheckStagedEvolutionTracesPayload }).payload;
  return checkStagedEvolutionTraceAgreement(payload, metaModelEntityUuids(metaModelEntities)) ?? ACTION_OK;
};

export const handleAction_rebaselineEvolutionTraces: ActionImplementationHandler = async (host, action, context) => {
  const payload = action.payload as RebaselineEvolutionTracesActionPayload;
  // #9: the traces are those of the authoring deployment
  const following = await followingDeploymentRefusal(host, "rebaselineEvolutionTraces", payload.application, context.applicationDeploymentMap);
  if (following) {
    return following;
  }
  const selfApplication = await storedSelfApplication(host, payload.application, context);
  if (!isEvolutionTraceOn(selfApplication)) {
    return new Action2Error(
      "FailedToHandleAction",
      `the evolution traces of ${payload.application} are off: there is nothing to re-baseline`,
      undefined,
      undefined,
      { reason: "evolutionTracesOff" },
    );
  }
  if (resolveVersioningMode(selfApplication!) === "versioned-git") {
    return handleAction_appendEvolutionTraceRecord(
      host,
      { actionType: APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE, payload: { application: payload.application, kind: "rebaseline" } },
      context,
    );
  }
  if (!payload.versionName?.trim()) {
    return new Action2Error("InvalidAction", "rebaselineEvolutionTraces of a versioned-internal application needs a versionName");
  }
  const { application, versionName, description, branch } = payload;
  return freezeVersion(host, { application, versionName, description, branch }, context, "rebaseline");
};

/**
 * The freeze of `payload`. With the traces on, a `version` freeze is refused when the agreement check
 * fails, and appends a `version` marker; a `rebaseline` freeze skips the check, and its marker restarts the
 * chain from the version.
 */
async function freezeVersion(
  host: DomainControllerActionHost,
  payload: FreezeApplicationVersionActionPayload,
  context: ActionImplementationContext,
  marker: "version" | "rebaseline",
): Promise<Action2ReturnType> {
  const { applicationDeploymentMap } = context;
  // Plan against the payload application's model, not the caller's (the Versioning Runner is
  // Miroir-hosted while it freezes Library).
  const modelEnvironment = targetModelEnvironment(host, payload.application, applicationDeploymentMap, context.modelEnvironment);
  const metaModel = modelEnvironment.currentModel;
  const metaBootstrapUuids = metaModelEntityUuids(modelEnvironment.miroirMetaModel?.entities ?? []);
  const tracesOn = isEvolutionTraceOn(await storedSelfApplication(host, payload.application, context));

  // #708 part C: refused, before anything is written, when the traces do not give the model to freeze
  if (tracesOn && marker === "version") {
    const disagreement = await checkEvolutionTraceAgreement(host, payload.application, applicationDeploymentMap, metaBootstrapUuids);
    if (disagreement) {
      return disagreement;
    }
  }

  const ensured = await ensureHistoryEntities(host, payload.application, applicationDeploymentMap, modelEnvironment);
  if (ensured instanceof Action2Error) {
    return ensured;
  }

  const applicationEntities = selectEntitiesToFreeze(payload.application, metaModel.entities, metaBootstrapUuids);

  const instancesToFreeze = await loadInstancesToFreeze(host, payload.application, applicationDeploymentMap);
  if (instancesToFreeze instanceof Action2Error) {
    return instancesToFreeze;
  }
  // #232: the persisted version history (chain tips, diffs), read without touching the live model cache
  const persistedHistory = await loadVersionHistoryFreezeSlice(async (parentEntityUuid) => {
    const instances = await host.readSectionInstances(
      payload.application,
      applicationDeploymentMap,
      "modelVersion",
      parentEntityUuid,
    );
    return instances instanceof Action2Error ? [] : (instances as Array<{ uuid: string }>);
  });
  const enrichedMetaModel = mergeVersionHistoryIntoFreezeMetaModel(freezeMetaModelSlice(metaModel), persistedHistory);

  const plan = planFreezeApplicationVersionFromMetaModel(payload, {
    ...enrichedMetaModel,
    entities: applicationEntities,
    storedQueries: enrichedMetaModel.storedQueries,
    ...instancesToFreeze,
  });

  const persisted = await persistFreezeApplicationVersionPlan(host, plan, payload.application, applicationDeploymentMap);
  if (persisted instanceof Action2Error) {
    return persisted;
  }
  if (tracesOn) {
    await appendVersionMarker(host, payload.application, plan.selfApplicationVersion.uuid, marker, context);
  }
  return persisted;
}

/**
 * The MetaModel bootstrap Entities (Entity, Report, the history Entities…) that may appear in an
 * application's `currentModel.entities`: a freeze freezes the application's own Entities only. #230: for
 * Miroir itself, the meta-model Entities are the application's Entities (`selectEntitiesToFreeze`).
 */
export function metaModelEntityUuids(metaModelEntityRows: readonly { uuid: string }[]): Set<string> {
  const uuids = new Set(metaModelEntityRows.map((e) => e.uuid));
  for (const historyEntity of HISTORY_ENTITIES) {
    uuids.add(historyEntity.uuid);
  }
  // #708: the record Entity too, created in the model by the first trace record
  for (const versionHistoryEntityUuid of versionHistoryEntityUuids) {
    uuids.add(versionHistoryEntityUuid);
  }
  return uuids;
}

/** #708: the application's SelfApplication row in the store, where its traces switch is read. */
async function storedSelfApplication(
  host: DomainControllerActionHost,
  application: string,
  context: ActionImplementationContext,
): Promise<EvolutionTraceSwitchInput | undefined> {
  const { section, entityUuid } = selfApplicationRowLocation(application);
  const rows = await host.readSectionInstances(application, context.applicationDeploymentMap, section, entityUuid);
  return (rows instanceof Action2Error ? undefined : rows.find((row) => row.uuid === application)) as
    | EvolutionTraceSwitchInput
    | undefined;
}

/**
 * #708 (D4): with the application's traces on, a freeze appends a marker naming the version it wrote, so
 * the records between two versions are those between their markers: a `version` marker, or a `rebaseline`
 * one for a re-baseline (part C). The freeze stands when the marker cannot be appended.
 */
async function appendVersionMarker(
  host: DomainControllerActionHost,
  application: string,
  version: string,
  kind: "version" | "rebaseline",
  context: ActionImplementationContext,
): Promise<void> {
  const appended = await handleAction_appendEvolutionTraceRecord(
    host,
    { actionType: APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE, payload: { application, kind, version } },
    context,
  );
  if (appended instanceof Action2Error) {
    log.warn("freezeApplicationVersion: no version marker appended for", application, appended);
  }
}
