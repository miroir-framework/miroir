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
  getApplicationSection,
  type Action2ReturnType,
  type Action2VoidReturnType,
  type ActionImplementationHandler,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type DomainControllerActionHost,
  type Entity,
  type EntityInstance,
  type FreezeApplicationVersionActionPayload,
  type MiroirModelEnvironment,
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
  type StoredQueryForFreeze,
} from "./applicationVersionFreeze.js";

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";

/**
 * The history Entities a freeze writes into, created in the application's model when absent (init or a
 * filtered model may leave them out). In the order the freeze created them before #696.
 */
const HISTORY_ENTITIES = [
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
    storedQueries: metaModel.storedQueries as StoredQueryForFreeze[],
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
export const handleAction_freezeApplicationVersion: ActionImplementationHandler = async (
  host,
  action,
  context,
): Promise<Action2ReturnType> => {
  const payload = action.payload as FreezeApplicationVersionActionPayload;
  const { applicationDeploymentMap } = context;
  // Plan against the payload application's model, not the caller's (the Versioning Runner is
  // Miroir-hosted while it freezes Library).
  const modelEnvironment = targetModelEnvironment(host, payload.application, applicationDeploymentMap, context.modelEnvironment);
  const metaModel = modelEnvironment.currentModel;

  const ensured = await ensureHistoryEntities(host, payload.application, applicationDeploymentMap, modelEnvironment);
  if (ensured instanceof Action2Error) {
    return ensured;
  }

  // Freeze the application's Entities only, not the MetaModel bootstrap Entities (Entity, Report, the
  // history Entities…) that may appear in currentModel.entities. #230: for Miroir itself, the
  // meta-model Entities are the application's Entities.
  const metaBootstrapUuids = new Set((modelEnvironment.miroirMetaModel?.entities ?? []).map((e) => e.uuid));
  for (const historyEntity of HISTORY_ENTITIES) {
    metaBootstrapUuids.add(historyEntity.uuid);
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
    storedQueries: enrichedMetaModel.storedQueries as StoredQueryForFreeze[],
    ...instancesToFreeze,
  });

  return persistFreezeApplicationVersionPlan(host, plan, payload.application, applicationDeploymentMap);
};
