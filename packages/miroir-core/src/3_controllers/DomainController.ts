
import { v4 as uuidv4 } from 'uuid';

import { Uuid } from '../0_interfaces/1_core/EntityVersion.js';
import {
  DomainControllerInterface,
  DomainState,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";

import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import {
  LocalCacheInterface
} from "../0_interfaces/4-services/LocalCacheInterface";
import {
  PersistenceStoreLocalOrRemoteInterface
} from "../0_interfaces/4-services/PersistenceInterface";


import {
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationVersion,
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
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationVersionInitialMiroirVersion
} from "miroir-test-app_deployment-miroir";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  ApplicationSection,
  CompositeActionSequence,
  CompositeActionTemplate,
  Deployment,
  DomainAction,
  Entity,
  EntityInstance,
  EntityVersion,
  InstanceAction,
  MetaModel,
  ModelAction,
  ModelActionResetModel,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  TestAssertion,
  TestBuildPlusRuntimeCompositeAction,
  TestBuildPlusRuntimeCompositeActionSuite,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplateSuite,
  TestResult,
  TransactionalInstanceAction,
  UndoRedoAction,
  type CompositeActionSequenceTemplate,
  type CompositeRunBoxedQueryAction,
  type CompositeRunBoxedQueryTemplateAction,
  type CoreTransformerForBuildPlusRuntime,
  type EndpointDefinition,
  type ModelActionInitModel,
  type SelfApplication
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import {
  resolveEntitiesToFetchOnRefresh,
} from "../1_core/localCache/cacheRefreshPolicy.js";
import { ACTION_OK } from "../1_core/constants";
import { defaultMiroirMetaModel } from "../1_core/defaultMiroirMetaModel";
import { expandResolvableResetAndinitializeDeploymentCompositeAction } from "../1_core/Deployment.js";
import {
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS
} from "../1_core/versioning/applicationVersioning.js";
import {
  loadVersionHistoryFreezeSlice,
  mergeVersionHistoryIntoFreezeMetaModel,
  planFreezeApplicationVersionFromMetaModel,
  type FreezeApplicationVersionPlan,
  type FreezeMetaModelSlice,
  type StoredQueryForFreeze,
} from "../1_core/versioning/applicationVersionFreeze.js";
import {
  defaultMiroirModelEnvironment,
  getApplicationSection,
  metaModelEntities,
  miroirModelEntities,
} from "../1_core/Model";
import { rejectPartialMutationInstanceAction } from "../1_core/localCache/partialMutationGuard.js";
import {
  buildEvolutionTracePersistenceActions,
  collectEvolutionTraceStateFromDomainState,
} from "../2_domain/evolutionTraceRuntime.js";
import type { EvolutionTraceableAction } from "../2_domain/evolutionTraceWriter.js";
import { resolveCompositeActionTemplate } from "../2_domain/ResolveCompositeActionTemplate";
import { transformer_extended_apply, transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime.js";
import { LoggerGlobalContext } from '../4_services/LoggerContext.js';
import {
  logPhaseForActionType,
  summarizeRollbackInstanceCollections,
} from "../4_services/rollbackLog.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { packageName } from "../constants";

import {
  devRelativePathPrefix,
  getClientEnvironment,
  getMiroirEnvironmentMode,
  prodRelativePathPrefix,
  resolvePathOnObject,
} from "../tools";
import { cleanLevel } from "./constants";
// import { Endpoint } from "./Endpoint";
import { CallUtils } from "./ErrorHandling/CallUtils";
// import { TestSuiteContext } from '../4_services/TestSuiteContext.js';
import { defaultApplicationSection } from '../0_interfaces/1_core/Model.js';
import {
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  Domain2ElementFailed,
  TransformerFailure,
  type TransformerReturnType
} from "../0_interfaces/2_domain/DomainElement.js";
import {
  defaultEndpointApplicationMap,
  type ApplicationDeploymentMap,
  type EndpointApplicationMap,
} from "../1_core/Deployment.js";
import { resolveTestCompositeActionTemplateSuite } from '../2_domain/TestSuiteTemplate.js';
import {
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  removeUndefinedProperties,
  unNullify,
} from "../4_services/otherTools.js";
import { ConfigurationService } from './ConfigurationService.js';

export const templateEvaluationParams = {
  env: { NODE_ENV: getMiroirEnvironmentMode() === "dev" ? "development" : "production" },
  devRelativePathPrefix,
  prodRelativePathPrefix,
  clientEnvironment: getClientEnvironment(),
};

const autocommit = true;
// const autocommit = false;

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainController");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "action"
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface DeploymentConfiguration {
  adminConfigurationDeployment: EntityInstance,
  selfApplicationDeployment: Deployment,
}

// ################################################################################################
export async function resetAndInitApplicationDeployment(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  selfAdminConfigurationDeployments: Deployment[], // TODO: use Deployment Entity Type!
) {

  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction(
      {
        actionType: "resetModel",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: selfAdminConfigurationDeployment.selfApplication,
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment
    );
  }
  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction(
      {
        actionType: "initModel",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: selfAdminConfigurationDeployment.selfApplication,
          params: {
            dataStoreType:
              selfAdminConfigurationDeployment.uuid == deployment_Miroir.uuid
                ? "miroir"
                : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
            metaModel: defaultMiroirMetaModel,
            // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
            selfApplication: selfApplicationMiroir as SelfApplication,
            // deployment: selfAdminConfigurationDeployment,
            applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
            // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
            applicationVersion: selfApplicationVersionInitialMiroirVersion,
          },
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment
    );
  }
  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetAndInitApplicationDeployment APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );
  for (const d of selfAdminConfigurationDeployments) {
    log.info("resetAndInitApplicationDeployment rollback for deployment", d.uuid);
    await domainController.handleAction(
      {
        actionType: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: d.selfApplication,
          // deploymentUuid: d.uuid,
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment
    );
  }
  return Promise.resolve(ACTION_OK);
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * domain level contains "business" logic related to concepts defined whithin the
 * selfApplication: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  private callUtil: CallUtils;
  // private actionHandler: ActionHandler;
  // ##############################################################################################
  constructor(
    private persistenceStoreAccessMode: "local" | "remote",
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private persistenceStoreLocalOrRemote: PersistenceStoreLocalOrRemoteInterface, // instance of PersistenceReduxSaga
    // private endpoint: EndpointDefinition,
  ) {
    // this.callUtil = new CallUtils(miroirContext.errorLogService, persistenceStoreLocalOrRemote);
    this.callUtil = new CallUtils(persistenceStoreLocalOrRemote);
    // Make the server-configured filesystem deployment root available to transformer evaluation.
    // Falls back to the NODE_ENV-based constants for backward compatibility.
    
    // const serverCfg = ((miroirContext.extendMiroirConfigWithExtraDeploymentConfiguration() as MiroirConfigServer)?.server) as any;
  }

  getPersistenceStoreAccessMode(): "local" | "remote" {
    return this.persistenceStoreAccessMode;
  }
  // ##############################################################################################
  // TODO: remove? only used in commented code in index.tsx
  getRemoteStore(): PersistenceStoreLocalOrRemoteInterface {
    return this.persistenceStoreLocalOrRemote;
  }
  // ##############################################################################################
  currentModel(
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: Uuid,
  ): MetaModel {
    return this.localCache.currentModel(application, applicationDeploymentMap);
  }

  // ##############################################################################################
  currentModelEnvironment(
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: Uuid,
  ): MiroirModelEnvironment {
    return this.localCache.currentModelEnvironment(
      application,
      applicationDeploymentMap,
      // deploymentUuid,
    );
  }

  // ##############################################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelAction)[] {
    return this.localCache.currentTransaction();
  }

  // ##############################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  // ###############################################################################
  getDomainState(): DomainState {
    return this.localCache.getDomainState();
  }

  // ###############################################################################
  getLocalCache(): LocalCacheInterface {
    return this.localCache;
  }

  // ##############################################################################################
  // ACTIONS
  // ##############################################################################################
  // converts a Domain transactional action into a set of local cache actions and remote store actions
  async handleDomainUndoRedoAction(
    deploymentUuid: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
    undoRedoAction: UndoRedoAction,
    currentModelEnvironment: MiroirModelEnvironment,
  ): Promise<Action2VoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainUndoRedoAction start actionType",
      undoRedoAction.actionType,
      "deployment",
      deploymentUuid,
      "action",
      undoRedoAction,
    );
    try {
      switch (undoRedoAction.actionType) {
        case "undo":
        case "redo": {
          this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            undoRedoAction,
          );

          break;
        }
        default: {
          log.warn(
            "DomainController handleDomainUndoRedoAction cannot handle action name for",
            undoRedoAction,
          );
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleDomainUndoRedoAction caught exception when handling",
        undoRedoAction.actionType,
        "deployment",
        deploymentUuid,
        "action",
        undoRedoAction,
        "exception",
        error,
      );
    }
    return Promise.resolve(ACTION_OK);
  }

  //####################################################################################
  //####################################################################################
  //####################################################################################
  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromPersistenceStore(
    applicationUuid: Uuid,
    deploymentUuid: string,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    return this.miroirContext.miroirActivityTracker.trackAction(
      "rollback",
      "rollback",
      () =>
        this.executeLoadConfigurationFromPersistenceStore(
          applicationUuid,
          deploymentUuid,
          applicationDeploymentMap,
        ),
      {
        phase: "rollback",
        enterExtra: `application=${applicationUuid}`,
      },
    );
  }

  private async executeLoadConfigurationFromPersistenceStore(
    applicationUuid: Uuid,
    deploymentUuid: string,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    // log.info(
    //   "DomainController loadConfigurationFromPersistenceStore called for",
    //   "application",
    //   applicationUuid,
    //   "deployment",
    //   deploymentUuid,
    //   "applicationDeploymentMap",
    //   applicationDeploymentMap,
    // );
    try {
      const persistenceReadActionType =
        this.persistenceStoreAccessMode === "local"
          ? ("LocalPersistenceAction_read" as const)
          : ("RestPersistenceAction_read" as const);

      const result = await this.callUtil
        .callPersistenceAction(
          {}, // context
          {
            addResultToContextAsName: "dataEntitiesFromModelSection",
            expectedDomainElementType: "entityInstanceCollection",
          }, // continuation
          applicationDeploymentMap,
          {
            actionType: persistenceReadActionType,
            endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
            payload: {
              application: applicationUuid,
              section: "model",
              parentName: entityEntity.name,
              parentUuid: entityEntity.uuid,
            },
          },
        )
        .then(async (context) => {
          if (context instanceof Action2Error) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application " +
                applicationUuid +
                " deployment " +
                deploymentUuid +
                " could not fetch entity instance list " +
                JSON.stringify(context, undefined, 2),
            );
          }

          // log.info(
          //   "DomainController loadConfigurationFromPersistenceStore fetched list of Entities for",
          //   "application",
          //   applicationUuid,
          //   "deployment",
          //   deploymentUuid,
          //   "found data entities from Model Section dataEntitiesFromModelSection",
          //   context.dataEntitiesFromModelSection,
          // );

          if (
            !context.dataEntitiesFromModelSection ||
            context.dataEntitiesFromModelSection instanceof Action2Error
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application" +
                applicationUuid +
                "deployment" +
                deploymentUuid +
                " could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2),
            );
          }

          if (
            !context.dataEntitiesFromModelSection.returnedDomainElement ||
            context.dataEntitiesFromModelSection.returnedDomainElement instanceof
              Domain2ElementFailed
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application" +
                applicationUuid +
                "deployment" +
                deploymentUuid +
                " could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2),
            );
          }

          // TODO: information has to come from localCacheSlice, not from hard-coded source!
          const modelEntitiesToFetch: Entity[] =
            deploymentUuid == deployment_Miroir.uuid
              ? miroirModelEntities
              : metaModelEntities;
          const dataEntitiesToFetch: Entity[] =
            deploymentUuid == deployment_Miroir.uuid
              ? (
                  context.dataEntitiesFromModelSection.returnedDomainElement?.instances ?? []
                ).filter(
                  (dataEntity: EntityInstance) =>
                    modelEntitiesToFetch.filter(
                      (modelEntity) => dataEntity.uuid == modelEntity.uuid,
                    ).length == 0,
                )
              : (context.dataEntitiesFromModelSection.returnedDomainElement?.instances ?? []); // hack, hack, hack

          // log.info(
          //   "DomainController loadConfigurationFromPersistenceStore for",
          //   "application",
          //   applicationUuid,
          //   "deployment",
          //   deploymentUuid,
          //   "found data entities to fetch",
          //   dataEntitiesToFetch.map((e) => e.name),
          //   "model entities to fetch",
          //   modelEntitiesToFetch.map((e) => e.name),
          // );

          const fetchEntityInstances = (e: {
            section: ApplicationSection;
            entity: Entity;
          }) => {
            return this.callUtil
              .callPersistenceAction(
                {}, // context
                {
                  addResultToContextAsName: "entityInstanceCollection",
                  expectedDomainElementType: "entityInstanceCollection",
                }, // continuation
                applicationDeploymentMap,
                {
                  actionType: persistenceReadActionType,
                  endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                  payload: {
                    application: applicationUuid,
                    section: e.section,
                    parentName: e.entity.name,
                    parentUuid: e.entity.uuid,
                  },
                },
              )
              .then((fetchContext: Record<string, any> | Action2Error) => {
                if (fetchContext instanceof Action2Error) {
                  // Bundled / unversioned deployments may omit modelVersion (#232 Slice 4).
                  if (
                    e.section === "modelVersion" &&
                    fetchContext.errorMessage?.includes(
                      "modelVersion section is not configured",
                    )
                  ) {
                    return {
                      parentName: e.entity.name,
                      parentUuid: e.entity.uuid,
                      applicationSection: "modelVersion" as ApplicationSection,
                      instances: [],
                    };
                  }
                  return fetchContext;
                } else {
                  return fetchContext["entityInstanceCollection"].returnedDomainElement;
                }
              })
              .catch((reason) => {
                const reasonMessage =
                  reason instanceof Error
                    ? reason.message
                    : typeof reason === "string"
                      ? reason
                      : JSON.stringify(reason);
                if (
                  e.section === "modelVersion" &&
                  reasonMessage.includes("modelVersion section is not configured")
                ) {
                  return {
                    parentName: e.entity.name,
                    parentUuid: e.entity.uuid,
                    applicationSection: "modelVersion" as ApplicationSection,
                    instances: [],
                  };
                }
                log.error(
                  "DomainController loadConfigurationFromPersistenceStore failed to fetch entity instances for entity ",
                  e.entity.name,
                  "application",
                  applicationUuid,
                  "deployment",
                  deploymentUuid,
                  reason,
                );
                return new Action2Error(
                  "FailedToHandleAction",
                  "DomainController loadConfigurationFromPersistenceStore application" +
                    applicationUuid +
                    "deployment" +
                    deploymentUuid +
                    " failed to fetch entity instances for " +
                    e.entity.name +
                    " reason: " +
                    reason,
                );
              });
          };

          // Model is always loaded entirely (application concepts). Fetch model first so
          // Entity cache policies are available for non-model refresh (#232 modelVersion).
          const modelFetchTargets = modelEntitiesToFetch.map((e) => ({
            section: "model" as ApplicationSection,
            entity: e,
          }));
          const modelInstances = await Promise.all(modelFetchTargets.map(fetchEntityInstances));

          // Optional cache-policy fallback from EntityVersion when EV was fetched in the
          // model phase (Library / Admin). Miroir EV is not in miroirModelEntities;
          // empty map is fine — refresh policy uses Entity.cache from model-fetched Entities.
          const entityDefinitionsByEntityUuid: Record<string, EntityVersion> = {};
          const entityDefinitionFetchIndex = modelEntitiesToFetch.findIndex(
            (e) => e.uuid === entityEntityVersion.uuid,
          );
          if (entityDefinitionFetchIndex >= 0) {
            const entityDefinitionCollection = modelInstances[entityDefinitionFetchIndex];
            if (
              !(entityDefinitionCollection instanceof Action2Error) &&
              entityDefinitionCollection &&
              Array.isArray(entityDefinitionCollection.instances)
            ) {
              for (const def of entityDefinitionCollection.instances as EntityVersion[]) {
                if (def?.entityUuid) {
                  entityDefinitionsByEntityUuid[def.entityUuid] = def;
                }
              }
            }
          }

          const toFetchEntities = resolveEntitiesToFetchOnRefresh(
            applicationUuid,
            modelEntitiesToFetch,
            dataEntitiesToFetch as Entity[],
            entityDefinitionsByEntityUuid,
          );
          const nonModelFetchTargets = toFetchEntities.filter((e) => e.section !== "model");
          const nonModelInstances = await Promise.all(
            nonModelFetchTargets.map(fetchEntityInstances),
          );

          const allInstances = [...modelInstances, ...nonModelInstances];

          const errors = allInstances.filter((result) => result instanceof Action2Error);
          const nonErrors = allInstances.filter((result) => !(result instanceof Action2Error));
          const { summaries, perEntity } = summarizeRollbackInstanceCollections(
            applicationUuid,
            nonErrors as { applicationSection?: string; parentName?: string; instances?: unknown[] }[],
          );
          for (const line of summaries) {
            log.info(line);
          }
          for (const line of perEntity) {
            log.debug(line);
          }
          // log.info(
          //   "DomainController loadConfigurationFromPersistenceStore fetched all instances for",
          //   "application",
          //   applicationUuid,
          //   "deployment",
          //   deploymentUuid,
          //   "allInstances",
          //   allInstances,
          //   "errors",
          //   errors,
          // );
          // Batch all local cache updates in a single operation to leverage React 18's automatic batching
          if (nonErrors.length > 0) {
            await this.callUtil.callLocalCacheAction(
              context, // context
              {}, // continuation
              applicationDeploymentMap,
              {
                actionType: "loadNewInstancesInLocalCache",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  application: applicationUuid,
                  objects: allInstances,
                },
              },
            );
          }

          // removes current transaction
          await this.callUtil.callLocalCacheAction(
            context, // context
            {}, // continuation
            applicationDeploymentMap,
            {
              actionType: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              payload: {
                application: applicationUuid,
              },
            },
          );

          if (errors.length > 0) {
            return Promise.resolve(
              new Action2Error(
                "FailedToLoadNewInstancesInLocalCache",
                "DomainController loadConfigurationFromPersistenceStore application" +
                  applicationUuid +
                  "deployment" +
                  deploymentUuid +
                  " failed to load new instances in local cache: " +
                  errors.map((e) => JSON.stringify(e, undefined, 2)).join(", "),
              ),
            );
          }

          // log.info(
          //   "DomainController loadConfigurationFromPersistenceStore done rollback, currentTransaction=",
          //   this.currentTransaction(),
          // );

          // log.debug(
          //   "DomainController loadConfigurationFromPersistenceStore",
          //   "application",
          //   applicationUuid,
          //   "deployment",
          //   deploymentUuid,
          //   "all instances stored!",
          //   toFetchEntities.map((e) => ({ section: e.section, uuid: e.entity.uuid })),
          //   // JSON.stringify(this.localCache.getState(), circularReplacer())
          // );
          return context;
        });
      if (result instanceof Action2Error) {
        return result;
      } else {
        log.debug(
          "DomainController loadConfigurationFromPersistenceStore completed successfully for",
          "application",
          applicationUuid,
          "deployment",
          deploymentUuid,
        );
        return Promise.resolve(ACTION_OK);
      }
    } catch (error) {
      log.warn("DomainController loadConfigurationFromPersistenceStore caught error:", error);
      // throw error;
      return new Action2Error(
        "FailedToLoadNewInstancesInLocalCache",
        "DomainController loadConfigurationFromPersistenceStore caught error: " + error,
      );
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // called only in server.ts to handle queries on the server side
  // used in RootComponent to fetch data from the server
  // used in Importer.tsx
  // used in scripts.ts
  // used in tests
  async handleBoxedExtractorOrQueryAction(
    runBoxedExtractorOrQueryAction: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment,
  ): Promise<Action2ReturnType> {
    const strategy =
      runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy ?? "localCacheOrFail";
    return this.miroirContext.miroirActivityTracker.trackAction(
      "runBoxedQueryAction",
      "DC.handleBoxedQuery",
      () =>
        this.executeBoxedExtractorOrQueryAction(
          runBoxedExtractorOrQueryAction,
          applicationDeploymentMap,
          currentModel,
        ),
      {
        phase: "query",
        enterExtra: `strategy=${strategy} mode=${this.persistenceStoreAccessMode}`,
      },
    );
  }

  private async executeBoxedExtractorOrQueryAction(
    runBoxedExtractorOrQueryAction: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment,
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    try {
      LoggerGlobalContext.setAction(runBoxedExtractorOrQueryAction.actionType);
      // Also set in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(runBoxedExtractorOrQueryAction.actionType);
      // log.info(
      //   "handleBoxedExtractorOrQueryAction",
      //   // "deploymentUuid",
      //   "persistenceStoreAccessMode=",
      //   this.persistenceStoreAccessMode,
      //   "actionType=",
      //   (runBoxedExtractorOrQueryAction as any).actionType,
      //   "actionType=",
      //   runBoxedExtractorOrQueryAction?.actionType,
      //   "queryExecutionStrategy=",
      //   runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy,
      //   // "objects=",
      //   // JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2),
      // );
      /**
       * TODO: if the query is contained whithin a transactional action, it shall only access the localCache
       * if a query is contained whithin a composite action, then it shall access only the persistent storage (?)
       * handle the case of transactionInstanceActions...
       */
      if (this.persistenceStoreAccessMode == "local") {
        /**
         * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
         */

        const result: Action2ReturnType =
          await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalPersistenceStore(
            runBoxedExtractorOrQueryAction,
            applicationDeploymentMap,
          );
        // const result: Action2ReturnType = await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalCache(
        //   runBoxedExtractorOrQueryAction
        // );
        // log.info(
        //   "DomainController handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
        //   result,
        // );
        return result;
      } else {
        // we're on the client, the query is sent to the server for execution.
        // is it right? We're limiting querying for script execution to remote queries right there!
        // principle: the scripts using transactional (thus Model) actions are limited to localCache access
        // while non-transactional accesses are limited to persistence store access (does this make sense?)
        // in both cases this enforces only the most up-to-date data is accessed.
        // log.info(
        //   "DomainController handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction executing query",
        //   "strategy",
        //   runBoxedExtractorOrQueryAction.queryExecutionStrategy,
        //   // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
        //   runBoxedExtractorOrQueryAction
        // );
        // Transactional / model scripts mutate the local cache until commit; defaulting to
        // storage makes uncommitted create/undo/redo invisible to boxed queries.
        const executionStrategy =
          runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy ?? "localCacheOrFail";
        switch (executionStrategy) {
          case "ServerCache":
          case "localCacheOrFetch": {
            throw new Error(
              "DomainController handleBoxedExtractorOrQueryAction could not handle queryExecutionStrategy " +
                runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy,
            );
          }
          case "localCacheOrFail": {
            const result =
              await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalCache(
                runBoxedExtractorOrQueryAction,
                applicationDeploymentMap,
              );
            // log.info(
            //   "handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
            //   result,
            // );
            return result;
          }
          case "storage": {
            const result =
              await this.persistenceStoreLocalOrRemote.handlePersistenceActionForRemoteStore(
                runBoxedExtractorOrQueryAction,
                applicationDeploymentMap,
              );
            // log.info(
            //   "handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
            //   result,
            // );
            return result;
            // break;
          }
          default: {
            throw new Error(
              "DomainController handleBoxedExtractorOrQueryAction unknown queryExecutionStrategy " +
                runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy,
            );
            break;
          }
        }
        // const result = await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalCache(runBoxedExtractorOrQueryAction)
        // log.info(
        //   "handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
        //   result
        // );
        // return result;
        // return result["dataEntitiesFromModelSection"];
      }
    } catch (error) {
      log.error(
        "DomainController handleBoxedExtractorOrQueryAction caught exception",
        error,
        "actionType",
        (runBoxedExtractorOrQueryAction as any).actionType,
        "actionType",
        runBoxedExtractorOrQueryAction?.actionType,
        "objects",
        JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2),
      );
    } finally {
      LoggerGlobalContext.setAction(undefined);
      // Also clear in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(undefined);
    }

    return ACTION_OK;
  }

  // ##############################################################################################
  // called only in server.ts to handle queries on the server side
  // used in RootComponent to fetch data from the server
  // used in Importer.tsx
  // used in scripts.ts
  // used in tests
  async handleQueryTemplateActionForServerONLY(
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleQueryTemplateActionForServerONLY",
      "actionType",
      (runBoxedQueryTemplateAction as any).actionType,
      "actionType",
      runBoxedQueryTemplateAction?.actionType,
      "objects",
      JSON.stringify((runBoxedQueryTemplateAction as any)["objects"], null, 2),
    );

    if (this.persistenceStoreAccessMode == "local") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: Action2ReturnType =
        await this.persistenceStoreLocalOrRemote.handlePersistenceAction(
          runBoxedQueryTemplateAction,
          applicationDeploymentMap,
        );
      // log.info(
      //   "DomainController handleQueryTemplateActionForServerONLY callPersistenceAction Result=",
      //   result,
      // );
      return result;
    } else {
      // we're on the client, the query is sent to the server for execution.
      // is it right? We're limiting querying for script execution to remote queries right there!
      // principle: the scripts using transactional (thus Model) actions are limited to localCache access
      // while non-transactional accesses are limited to persistence store access (does this make sense?)
      // in both cases this enforces only the most up-to-date data is accessed.
      // log.info(
      //   "DomainController handleQueryTemplateActionForServerONLY sending query to server for execution",
      //   // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
      //   runBoxedQueryTemplateAction,
      // );
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        applicationDeploymentMap,
        runBoxedQueryTemplateAction,
      );
      // log.info("handleQueryTemplateActionForServerONLY callPersistenceAction Result=", result);
      if (result instanceof Action2Error) {
        return result;
      }
      return result["dataEntitiesFromModelSection"];
    }

    return ACTION_OK;
  }


  // ##############################################################################################
  // ACTION TEMPLATES
  // ##############################################################################################
  async handleInstanceAction(
    instanceAction: InstanceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    const rejectedPartial = rejectPartialMutationInstanceAction(instanceAction);
    if (rejectedPartial) {
      log.error(
        "DomainController handleInstanceAction rejected partial mutation (#214)",
        instanceAction.actionType,
        rejectedPartial
      );
      return Promise.resolve(rejectedPartial);
    }

    const deploymentUuid = applicationDeploymentMap[instanceAction.payload.application];

    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleInstanceAction application",
    //   instanceAction.payload.application,
    //   "deployment",
    //   deploymentUuid,
    //   "start",
    //   "instanceAction",
    //   instanceAction,
    // );

    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    // The same action is performed on the local cache and on the remote store for Data Instances.
    const handleActionResult = await this.callUtil.callPersistenceAction(
      {}, // context
      {}, // continuation
      applicationDeploymentMap,
      instanceAction,
    );
    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
    //   deploymentUuid,
    //   "handleInstanceAction done calling handleRemoteStoreRestCRUDAction",
    //   instanceAction,
    //   "result is error",
    //   handleActionResult instanceof Action2Error,
    //   "handleActionResult",
    //   handleActionResult,
    // );
    if (handleActionResult instanceof Action2Error) {
      log.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
        deploymentUuid,
        "handleInstanceAction error calling handleRemoteStoreRestCRUDAction",
        instanceAction,
        handleActionResult,
      );
      return Promise.resolve(handleActionResult);
    }
    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
    //   deploymentUuid,
    //   "handleInstanceAction done calling handleRemoteStoreRestCRUDAction",
    //   instanceAction,
    // );
    const result = await this.callUtil.callLocalCacheAction(
      {}, // context
      {}, // continuation
      applicationDeploymentMap,
      instanceAction,
    );

    if (!(result instanceof Action2Error)) {
      await this.maybeRecordEvolutionTrace(instanceAction, applicationDeploymentMap);
    }

    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
    //   deploymentUuid,
    //   "handleInstanceAction end",
    //   instanceAction,
    //   "result",
    //   result,
    // );
    return Promise.resolve(ACTION_OK);
    // return Promise.resolve(result);
  }

  /**
   * Append-only evolution-trace persistence (WP1). Trace instances live in the
   * evolving application's model section.
   * No-ops when policy skips or when the action itself mutates evolution-trace entities.
   */
  private async maybeRecordEvolutionTrace(
    action: InstanceAction | ModelAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    commitContext?: {
      commitUuid: string;
      fromVersionUuid: string;
      toVersionUuid: string;
    },
  ): Promise<void> {
    const actionType = action.actionType;
    const isModelReplayable =
      actionType === "createEntity" ||
      actionType === "renameEntity" ||
      actionType === "dropEntity" ||
      actionType === "alterEntityAttribute";
    const isInstanceCud =
      actionType === "createInstance" ||
      actionType === "updateInstance" ||
      actionType === "deleteInstance";

    if (!isModelReplayable && !isInstanceCud) {
      return;
    }

    const targetApplicationUuid = action.payload.application;
    const targetDeploymentUuid = applicationDeploymentMap[targetApplicationUuid];
    if (!targetDeploymentUuid) {
      return;
    }

    const existing = collectEvolutionTraceStateFromDomainState(
      this.localCache.getDomainState(),
      targetDeploymentUuid,
      targetApplicationUuid,
    );

    const persistenceActions = buildEvolutionTracePersistenceActions(
      action as EvolutionTraceableAction,
      existing,
      undefined,
      new Date(),
      commitContext,
    );
    for (const persistenceAction of persistenceActions) {
      const result = await this.handleInstanceAction(persistenceAction, applicationDeploymentMap);
      if (result instanceof Action2Error) {
        log.warn(
          "DomainController maybeRecordEvolutionTrace failed to persist trace action",
          persistenceAction.actionLabel,
          result,
        );
      }
    }
  }

  // ##############################################################################################
  // converts a Domain model action into a set of local cache actions and remote store actions
  private async createModelInstancesFromResetModel(
    kindLabel: string,
    actionLabel: string,
    instances: any[],
    parentEntity: Entity,
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    // log.info(
    //   "handleModelAction resetModel creating",
    //   instances.length,
    //   kindLabel,
    //   instances,
    // );
    const createInstanceAction: InstanceAction = {
      actionType: "createInstance",
      actionLabel,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application,
        // #222 — Miroir framework instances (Report/Menu/…) live in data; Library MetaModel peers stay model
        applicationSection: getApplicationSection(application, parentEntity.uuid),
        objects: instances,
      },
    };
    const createInstanceResult = await this.handleAction(
      {
        actionType: "transactionalInstanceAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          application,
          instanceAction: createInstanceAction,
        },
      },
      applicationDeploymentMap,
    );
    if (createInstanceResult instanceof Action2Error) {
      log.error(
        `handleModelAction resetModel failed to create ${kindLabel}`,
        createInstanceResult,
      );
      return new Action2Error(
        "FailedToHandleAction",
        `handleModelAction resetModel failed to create ${kindLabel} from model`,
        [],
        createInstanceResult,
      );
    }
    // log.info(`handleModelAction resetModel successfully created all ${kindLabel}`);
    return ACTION_OK;
  }

  /**
   * #232 — load persisted version-history rows for freeze planning (chain tips, diffs).
   * Does not mutate the live model cache; only supplements the freeze meta-model slice.
   */
  private async loadModelVersionHistoryForFreeze(
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Partial<FreezeMetaModelSlice>> {
    const instanceEndpoint = "ed520de4-55a9-4550-ac50-b1b713b72a89";
    const loadInstances = async (parentEntityUuid: string): Promise<Array<{ uuid: string }>> => {
      const localInstances =
        await this.persistenceStoreLocalOrRemote.readLocalPersistenceSectionInstances(
          application,
          applicationDeploymentMap,
          "modelVersion",
          parentEntityUuid,
        );
      if (localInstances.length > 0 || this.persistenceStoreAccessMode === "local") {
        return localInstances as Array<{ uuid: string }>;
      }
      const result = await this.persistenceStoreLocalOrRemote.handlePersistenceAction(
        {
          actionType: "getInstances",
          endpoint: instanceEndpoint,
          payload: {
            application,
            applicationSection: "modelVersion",
            parentUuid: parentEntityUuid,
          },
        },
        applicationDeploymentMap,
      );
      if (result instanceof Action2Error) {
        return [];
      }
      const collection = result.returnedDomainElement;
      if (!collection || collection instanceof Domain2ElementFailed) {
        return [];
      }
      return (collection.instances ?? []) as Array<{ uuid: string }>;
    };
    return loadVersionHistoryFreezeSlice(loadInstances);
  }

  /**
   * #216 Phase 6 — persist freeze plan rows immediately (SAV + historical EVs + Cross).
   * Uses createInstance (not transactional createEntity / commit replay).
   */
  private async persistFreezeApplicationVersionPlan(
    plan: FreezeApplicationVersionPlan,
    application: Uuid,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    const persistBatch = async (
      actionLabel: string,
      objects: EntityInstance[],
      parentEntityUuid: Uuid,
      applicationSection: ApplicationSection,
    ): Promise<Action2VoidReturnType> => {
      if (objects.length === 0) {
        return ACTION_OK;
      }
      const result = await this.handleInstanceAction(
        {
          actionType: "createInstance",
          actionLabel,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application,
            applicationSection,
            objects,
          },
        },
        applicationDeploymentMap,
      );
      if (result instanceof Action2Error) {
        return new Action2Error(
          "FailedToHandleAction",
          `freezeApplicationVersion failed to persist ${actionLabel}`,
          [],
          result,
        );
      }
      return ACTION_OK;
    };

    const historySection = plan.entityVersionApplicationSection;

    const savResult = await persistBatch(
      "freezeSelfApplicationVersion",
      [plan.selfApplicationVersion as EntityInstance],
      entitySelfApplicationVersion.uuid,
      historySection,
    );
    if (savResult instanceof Action2Error) {
      return savResult;
    }

    const evResult = await persistBatch(
      "freezeEntityVersions",
      plan.entityVersions as EntityInstance[],
      entityEntityVersion.uuid,
      plan.entityVersionApplicationSection,
    );
    if (evResult instanceof Action2Error) {
      return evResult;
    }

    const qvResult = await persistBatch(
      "freezeQueryVersions",
      plan.queryVersions as EntityInstance[],
      entityHistoricalQueryVersion.uuid,
      plan.queryVersionApplicationSection,
    );
    if (qvResult instanceof Action2Error) {
      return qvResult;
    }

    const rvResult = await persistBatch(
      "freezeReportVersions",
      plan.reportVersions as EntityInstance[],
      entityHistoricalReportVersion.uuid,
      plan.reportVersionApplicationSection,
    );
    if (rvResult instanceof Action2Error) {
      return rvResult;
    }

    const mvResult = await persistBatch(
      "freezeMenuVersions",
      plan.menuVersions as EntityInstance[],
      entityHistoricalMenuVersion.uuid,
      plan.menuVersionApplicationSection,
    );
    if (mvResult instanceof Action2Error) {
      return mvResult;
    }

    const epvResult = await persistBatch(
      "freezeEndpointVersions",
      plan.endpointVersions as EntityInstance[],
      entityHistoricalEndpointVersion.uuid,
      plan.endpointVersionApplicationSection,
    );
    if (epvResult instanceof Action2Error) {
      return epvResult;
    }

    const ruvResult = await persistBatch(
      "freezeRunnerVersions",
      plan.runnerVersions as EntityInstance[],
      entityHistoricalRunnerVersion.uuid,
      plan.runnerVersionApplicationSection,
    );
    if (ruvResult instanceof Action2Error) {
      return ruvResult;
    }

    const tuvResult = await persistBatch(
      "freezeThemeVersions",
      plan.themeVersions as EntityInstance[],
      entityHistoricalThemeVersion.uuid,
      plan.themeVersionApplicationSection,
    );
    if (tuvResult instanceof Action2Error) {
      return tuvResult;
    }

    const tdvResult = await persistBatch(
      "freezeTransformerDefinitionVersions",
      plan.transformerDefinitionVersions as EntityInstance[],
      entityHistoricalTransformerDefinitionVersion.uuid,
      plan.transformerDefinitionVersionApplicationSection,
    );
    if (tdvResult instanceof Action2Error) {
      return tdvResult;
    }

    const crossEvResult = await persistBatch(
      "freezeCrossEntityVersions",
      plan.crossEntityVersions as EntityInstance[],
      entityApplicationVersionCrossEntityVersion.uuid,
      historySection,
    );
    if (crossEvResult instanceof Action2Error) {
      return crossEvResult;
    }

    const crossQvResult = await persistBatch(
      "freezeCrossQueryVersions",
      plan.crossQueryVersions as EntityInstance[],
      entityApplicationVersionCrossQueryVersion.uuid,
      historySection,
    );
    if (crossQvResult instanceof Action2Error) {
      return crossQvResult;
    }

    const crossRvResult = await persistBatch(
      "freezeCrossReportVersions",
      plan.crossReportVersions as EntityInstance[],
      entityApplicationVersionCrossReportVersion.uuid,
      historySection,
    );
    if (crossRvResult instanceof Action2Error) {
      return crossRvResult;
    }

    const crossMvResult = await persistBatch(
      "freezeCrossMenuVersions",
      plan.crossMenuVersions as EntityInstance[],
      entityApplicationVersionCrossMenuVersion.uuid,
      historySection,
    );
    if (crossMvResult instanceof Action2Error) {
      return crossMvResult;
    }

    const crossEpResult = await persistBatch(
      "freezeCrossEndpointVersions",
      plan.crossEndpointVersions as EntityInstance[],
      entityApplicationVersionCrossEndpointVersion.uuid,
      historySection,
    );
    if (crossEpResult instanceof Action2Error) {
      return crossEpResult;
    }

    const crossRuResult = await persistBatch(
      "freezeCrossRunnerVersions",
      plan.crossRunnerVersions as EntityInstance[],
      entityApplicationVersionCrossRunnerVersion.uuid,
      historySection,
    );
    if (crossRuResult instanceof Action2Error) {
      return crossRuResult;
    }

    const crossThResult = await persistBatch(
      "freezeCrossThemeVersions",
      plan.crossThemeVersions as EntityInstance[],
      entityApplicationVersionCrossThemeVersion.uuid,
      historySection,
    );
    if (crossThResult instanceof Action2Error) {
      return crossThResult;
    }

    return persistBatch(
      "freezeCrossTransformerDefinitionVersions",
      plan.crossTransformerDefinitionVersions as EntityInstance[],
      entityApplicationVersionCrossTransformerDefinitionVersion.uuid,
      historySection,
    );
  }

  // ##############################################################################################
  async handleModelAction(
    modelAction: ModelAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment: MiroirModelEnvironment,
  ): Promise<Action2VoidReturnType> {
    const deploymentUuid =
      applicationDeploymentMap[modelAction.payload.application] ?? "DEPLOYMENT_UUID_NOT_FOUND";
    // log.info(
    //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction START actionType=",
    //   modelAction["actionType"],
    //   "application",
    //   modelAction.payload.application,
    //   "deployment",
    //   deploymentUuid,
    //   "applicationDeploymentMap",
    //   applicationDeploymentMap,
    //   // modelAction.payload["deploymentUuid"],
    //   "action",
    //   ![
    //     "initModel", 
    //     // "resetModel"
    //   ].includes(modelAction.actionType) ? JSON.stringify(modelAction, null, 2) : modelAction,
    //   // modelAction,
    // );
    try {
      switch (modelAction.actionType) {
        case "remoteLocalCacheRollback": {
          if (this.persistenceStoreAccessMode == "local") {
            // if the domain controller is deployed on the server, we refresh the local cache from the remote store
            // log.info(
            //   "handleModelAction reloading current configuration from local PersistenceStore!",
            // );
            const result = await this.loadConfigurationFromPersistenceStore(
              modelAction.payload.application,
              deploymentUuid,
              applicationDeploymentMap,
            );
            // log.info(
            //   "handleModelAction reloading current configuration from local PersistenceStore DONE!",
            //   result,
            // );
            return Promise.resolve(result);
          } else {
            // if the domain controller is deployed on the client, we send the "remoteLocalCacheRollback" action to the server
            await this.callUtil.callPersistenceAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              modelAction,
            );
          }
          break;
        }
        case "rollback": {
          const result = await this.loadConfigurationFromPersistenceStore(
            modelAction.payload.application,
            deploymentUuid,
            applicationDeploymentMap,
          );
          return Promise.resolve(result);
          break;
        }
        case "alterEntityAttribute":
        case "createEntity":
        case "renameEntity":
        case "dropEntity": {
          if (modelAction.payload.transactional == false) {
            // the modelAction is not transactional, we update the persistentStore directly
            log.warn("handleModelAction running for non-transactional action!");
            const result = await this.callUtil.callPersistenceAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              modelAction,
            );
            if (result instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "handleModelAction non-transactional action failed",
                [],
                result,
              );
            }
            // log.info("handleModelAction running for non-transactional action DONE!");
          }

          const result = await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          if (result instanceof Action2Error) {
            return new Action2Error(
              "FailedToHandleAction",
              "handleModelAction localCache action failed",
              [],
              result,
            );
          }
          break;
        }
        case "resetModel": {
          const modelActionResetModel = modelAction as ModelActionResetModel;
          
          // First, call persistence action to clear the model
          await this.callUtil.callPersistenceAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          
          // If a model is provided, create entities from it
          if (modelActionResetModel.payload.model) {
            const model = modelActionResetModel.payload.model;
            // log.info("handleModelAction resetModel creating entities from provided model", {
            //   entitiesCount: model.entities?.length || 0,
            //   entityDefinitionsCount: model.entityVersions?.length || 0
            // });
            
            // Combine entities with their definitions
            const entitiesToCreate: { entity: Entity; entityVersion?: EntityVersion }[] = [];
            
            // Create a map of entityDefinitions by entityUuid for quick lookup
            const entityDefinitionMap = new Map<string, EntityVersion>();
            if (model.entityVersions) {
              for (const entityDef of model.entityVersions) {
                entityDefinitionMap.set(entityDef.entityUuid, entityDef);
              }
            }
            
            // Match entities with their definitions (#217 Phase 11: Entity-complete needs no live ED)
            if (model.entities) {
              for (const entity of model.entities) {
                const entityVersion = entityDefinitionMap.get(entity.uuid);
                if (entityVersion) {
                  entitiesToCreate.push({ entity, entityVersion });
                } else if (entity.mlSchema) {
                  entitiesToCreate.push({ entity });
                } else {
                  log.warn(
                    "handleModelAction resetModel: no entityVersion found for entity",
                    entity.uuid,
                    entity.name
                  );
                }
              }
            }
            
            if (entitiesToCreate.length > 0) {
              // log.info(
              //   "handleModelAction resetModel creating",
              //   entitiesToCreate.length,
              //   "entities",
              //   entitiesToCreate,
              // );
              
              // Create entities via persistence action for each entity
              for (const { entity, entityVersion } of entitiesToCreate) {
                const createEntityAction: ModelAction = {
                  actionType: "createEntity",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: modelActionResetModel.payload.application,
                    // #220 — entities: Entity[]; enrich from EV when incomplete
                    entities:[entity],
                  }
                };
                
                // const createResult = await this.callUtil.callPersistenceAction(
                const createResult = await this.handleModelAction(
                  createEntityAction,
                  applicationDeploymentMap,
                  currentModelEnvironment,
                  // {}, // context
                  // {}, // continuation
                );
                
                if (createResult instanceof Action2Error) {
                  log.error(
                    "handleModelAction resetModel failed to create entity",
                    entity.uuid,
                    entity.name,
                    createResult
                  );
                  return new Action2Error(
                    "FailedToHandleAction",
                    "handleModelAction resetModel failed to create entity from model",
                    [],
                    createResult,
                  );
                }
              }
              
              log.info("handleModelAction resetModel successfully created all entities");
            }

            if (model.reports && model.reports.length > 0) {
              const createReportsResult = await this.createModelInstancesFromResetModel(
                "reports",
                "Create Reports from Model",
                model.reports,
                entityReport as Entity,
                modelActionResetModel.payload.application,
                applicationDeploymentMap,
              );
              if (createReportsResult instanceof Action2Error) {
                return createReportsResult;
              }
            }

            if (model.menus && model.menus.length > 0) {
              const createMenusResult = await this.createModelInstancesFromResetModel(
                "menus",
                "Create Menus from Model",
                model.menus,
                entityMenu as Entity,
                modelActionResetModel.payload.application,
                applicationDeploymentMap,
              );
              if (createMenusResult instanceof Action2Error) {
                return createMenusResult;
              }
            }

            if (model.endpoints && model.endpoints.length > 0) {
              const createEndpointsResult = await this.createModelInstancesFromResetModel(
                "endpoints",
                "Create Endpoints from Model",
                model.endpoints,
                entityEndpointVersion as Entity,
                modelActionResetModel.payload.application,
                applicationDeploymentMap,
              );
              if (createEndpointsResult instanceof Action2Error) {
                return createEndpointsResult;
              }
            }
          }
          // Dispatch resetModel to local cache to clear any uncommitted transactions (pastModelPatches).
          // This prevents stale transactions from being accidentally committed during subsequent beforeEach.
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          break;
        }
        case "resetData": {
          await this.callUtil.callPersistenceAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          // Dispatch resetData to local cache to clear any uncommitted transactions (pastModelPatches).
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          break;
        }
        case "initModel": {
          const modelActionInitModel = modelAction as ModelActionInitModel;
          await this.callUtil.callPersistenceAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction,
          );
          // If a model is provided, create entities from it
          if (modelActionInitModel.payload.model) {
            const model = modelActionInitModel.payload.model;
            log.info("handleModelAction resetModel creating entities from provided model", {
              entitiesCount: model.entities?.length || 0,
              entityDefinitionsCount: model.entityVersions?.length || 0
            });
            
            if (model.entities && model.entities.length > 0) {
              log.info(
                "handleModelAction resetModel creating",
                model.entities.length,
                "entities",
                model.entities,
              );
              
              // Create entities via persistence action for each entity
              for (const entity of model.entities) {
                const createEntityAction: ModelAction = {
                  actionType: "createEntity",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: modelActionInitModel.payload.application,
                    // #220 — entities: Entity[]; enrich from EV when incomplete
                    // entities: model.entities,
                    entities: [entity],
                  }
                };
                
                // const createResult = await this.callUtil.callPersistenceAction(
                const createResult = await this.handleModelAction(
                  createEntityAction,
                  applicationDeploymentMap,
                  currentModelEnvironment,
                  // {}, // context
                  // {}, // continuation
                );
                
                if (createResult instanceof Action2Error) {
                  log.error(
                    "handleModelAction resetModel failed to create entity",
                    entity.uuid,
                    entity.name,
                    createResult
                  );
                  return new Action2Error(
                    "FailedToHandleAction",
                    "handleModelAction resetModel failed to create entity from model",
                    [],
                    createResult,
                  );
                }
              }
              
              log.info("handleModelAction resetModel successfully created all entities");
            }

            if (model.reports && model.reports.length > 0) {
              const createReportsResult = await this.createModelInstancesFromResetModel(
                "reports",
                "Create Reports from Model",
                model.reports,
                entityReport as Entity,
                modelActionInitModel.payload.application,
                applicationDeploymentMap,
              );
              if (createReportsResult instanceof Action2Error) {
                return createReportsResult;
              }
            }

            if (model.runners && model.runners.length > 0) {
              const createRunnersResult = await this.createModelInstancesFromResetModel(
                "runners",
                "Create Runners from Model",
                model.runners,
                entityRunner as Entity,
                modelActionInitModel.payload.application,
                applicationDeploymentMap,
              );
              if (createRunnersResult instanceof Action2Error) {
                return createRunnersResult;
              }
            }

            if (model.menus && model.menus.length > 0) {
              const createMenusResult = await this.createModelInstancesFromResetModel(
                "menus",
                "Create Menus from Model",
                model.menus,
                entityMenu as Entity,
                modelActionInitModel.payload.application,
                applicationDeploymentMap,
              );
              if (createMenusResult instanceof Action2Error) {
                return createMenusResult;
              }
            }

            if (model.endpoints && model.endpoints.length > 0) {
              const createEndpointsResult = await this.createModelInstancesFromResetModel(
                "endpoints",
                "Create Endpoints from Model",
                model.endpoints,
                entityEndpointVersion as Entity,
                modelActionInitModel.payload.application,
                applicationDeploymentMap,
              );
              if (createEndpointsResult instanceof Action2Error) {
                return createEndpointsResult;
              }
            }
            if (model.storedQueries && model.storedQueries.length > 0) {
              const createStoredQueriesResult = await this.createModelInstancesFromResetModel(
                "storedQueries",
                "Create Stored Queries from Model",
                model.storedQueries,
                entityQueryVersion as Entity,
                modelActionInitModel.payload.application,
                applicationDeploymentMap,
              );
              if (createStoredQueriesResult instanceof Action2Error) {
                return createStoredQueriesResult;
              }
            }
          }

          break;
        }
        case "commit": {
          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit START",
            // this.localCache.currentTransaction()
          );

          // TODO: disable autocommit and do all operations in one transaction
          if (!currentModelEnvironment) {
            // throw new Error(
            //   "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions."
            // );
            return Promise.resolve(
              new Action2Error(
                "FailedToHandleAction",
                "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions.",
                [],
                undefined,
                { domainAction: modelAction },
              ),
            );
          }
          const currentTransactions = this.localCache.currentTransaction();
          if (currentTransactions.length == 0) {
            // log.info(
            //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit no current transaction to commit",
            // );
            return Promise.resolve(ACTION_OK);
          }
          const currentApplication = currentTransactions[0].payload.application;
          const currentDeploymentUuid: Uuid = deploymentUuid;

          if (currentDeploymentUuid != deploymentUuid) {
            log.warn(
              "commit operation deploymentUuid mismatch between current replay action (",
              currentDeploymentUuid,
              ") and modelAction(",
              deploymentUuid,
              ")",
              "currentTransactions:",
              currentTransactions,
            );
          }
          const filteredDeployments =
            currentTransactions.length > 1
              ? // currentTransactions.filter((tx) => tx.payload.deploymentUuid != modelAction.payload.deploymentUuid) : [];
                currentTransactions.filter(
                  (tx) => tx.payload.application != modelAction.payload.application,
                )
              : [];
          if (filteredDeployments.length > 0) {
            log.warn(
              "commit operation deploymentUuid mismatch among current transactions.",
              "application:",
              currentApplication,
              "Committing for deploymentUuid:",
              currentDeploymentUuid,
              "Ignoring transactions for other deployments:",
              filteredDeployments,
            );
          }

          // #216 ADR D6 / Phase 7: commit does NOT publish Application Versions.
          // Freeze (`freezeApplicationVersion`) is the sole version publisher.
          // commitUuid is for WP1 evolution-trace correlation only — do not
          // construct or persist placeholder SelfApplicationVersion rows here.
          const commitUuid = uuidv4();

          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replaying currentTransaction",
            JSON.stringify(this.localCache.currentTransaction(), null, 2),
          );
          for (const replayAction of this.localCache.currentTransaction()) {
            // log.info(
            //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction",
            //   replayAction,
            // );
            switch (replayAction.actionType) {
              case "transactionalInstanceAction": {
                const replayActionType = replayAction.payload.instanceAction.actionType.toString();
                const newActionType = replayActionType.includes("_")
                  ? // ? replayActionType.slice(replayActionType.lastIndexOf('_') + 1)
                    replayActionType.slice(replayActionType.lastIndexOf("_") + 1)
                  : replayActionType;
                // log.info(
                //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction transactionalInstanceAction",
                //   "derived newActionType",
                //   newActionType,
                // );
                const replayActionResult = await this.callUtil.callPersistenceAction(
                  {}, // context
                  {}, // continuation
                  applicationDeploymentMap,
                  {
                    actionType: newActionType,
                    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                    payload: {
                      // deploymentUuid: replayAction.payload.instanceAction.payload.deploymentUuid,
                      application: replayAction.payload.instanceAction.payload.application,
                      applicationSection:
                        replayAction.payload.instanceAction.payload.applicationSection ?? defaultApplicationSection,
                      section:
                        replayAction.payload.instanceAction.payload.applicationSection ?? defaultApplicationSection,
                      parentName: replayAction.payload.instanceAction.payload.objects[0].parentName,
                      parentUuid: replayAction.payload.instanceAction.payload.objects[0].parentUuid,
                      // objects: replayAction.payload.instanceAction.payload.objects[0].instances,
                      objects: replayAction.payload.instanceAction.payload.objects,
                    },
                  } as any,
                );
                if (replayActionResult instanceof Action2Error) {
                  log.warn(
                    "DomainController handleModelAction commit replayAction transactionalInstanceAction failed",
                    replayActionResult,
                  );
                  return replayActionResult;
                }
                break;
              }
              // case "modelAction":
              case "alterEntityAttribute":
              case "createEntity":
              case "dropEntity":
              case "renameEntity": {
                const replayActionResult = await this.callUtil.callPersistenceAction(
                  {}, // context
                  {}, // continuation
                  applicationDeploymentMap,
                  {
                    ...replayAction,
                    payload: {
                      ...replayAction.payload,
                      transactional: false,
                    } as any, // TODO: remove as any
                  },
                );
                if (replayActionResult instanceof Action2Error) {
                  log.warn(
                    "DomainController handleModelAction commit replayAction transactionalInstanceAction failed",
                    replayActionResult,
                  );
                  return replayActionResult;
                }
                await this.maybeRecordEvolutionTrace(replayAction, applicationDeploymentMap, {
                  commitUuid,
                  // Observational only — not an Application Version tip (#216 ADR D6).
                  fromVersionUuid: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa",
                  toVersionUuid: commitUuid,
                });
                break;
              }
              default:
                throw new Error(
                  "DomainController handleModelAction commit could not handle replay action:" +
                    JSON.stringify(replayAction),
                );
                break;
            }
          }

          // log.debug(
          //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed, currentTransaction:",
          //   this.localCache.currentTransaction(),
          // );

          await this.callUtil
            .callLocalCacheAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              {
                actionType: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: currentApplication,
                  // deploymentUuid: currentDeploymentUuid,
                },
              },
            );
          // #216 ADR D6: do not createInstance SelfApplicationVersion on commit.
          // log.info(
          //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done!",
          // );

          // log.info(
          //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done, end of handleModelAction!",
          // );
          break;
        }
        case "freezeApplicationVersion": {
          // Phase 6: plan then persist SAV + EntityVersions + Cross via createInstance.
          // Plan against the *payload* application's model — not the caller's
          // environment (Versioning Runner is Miroir-hosted while freezing Library).
          const payload = modelAction.payload as {
            application: string;
            versionName: string;
            description?: string;
            branch?: string;
          };
          const targetModelEnvironment = this.currentModelEnvironment(
            payload.application,
            applicationDeploymentMap,
          );
          const metaModel = targetModelEnvironment.currentModel;

          // Cross Entity may be absent from app model when init/filter did not create it.
          const crossEntityUuid = entityApplicationVersionCrossEntityVersion.uuid;
          const crossEntityPresent = metaModel.entities.some((e) => e.uuid === crossEntityUuid);
          if (!crossEntityPresent) {
            const ensureCross = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossEntityVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossEntityVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCross instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Entity exists",
                [],
                ensureCross,
              );
            }
          }

          const crossQueryEntityUuid = entityApplicationVersionCrossQueryVersion.uuid;
          const crossQueryEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossQueryEntityUuid,
          );
          if (!crossQueryEntityPresent) {
            const ensureCrossQuery = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossQueryVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossQueryVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossQuery instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Query Entity exists",
                [],
                ensureCrossQuery,
              );
            }
          }

          const queryVersionEntityUuid = entityHistoricalQueryVersion.uuid;
          const queryVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === queryVersionEntityUuid,
          );
          if (!queryVersionEntityPresent) {
            const ensureQueryVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalQueryVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalQueryVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureQueryVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure QueryVersion Entity exists",
                [],
                ensureQueryVersionEntity,
              );
            }
          }

          const crossReportEntityUuid = entityApplicationVersionCrossReportVersion.uuid;
          const crossReportEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossReportEntityUuid,
          );
          if (!crossReportEntityPresent) {
            const ensureCrossReport = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossReportVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossReportVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossReport instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Report Entity exists",
                [],
                ensureCrossReport,
              );
            }
          }

          const reportVersionEntityUuid = entityHistoricalReportVersion.uuid;
          const reportVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === reportVersionEntityUuid,
          );
          if (!reportVersionEntityPresent) {
            const ensureReportVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalReportVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalReportVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureReportVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure ReportVersion Entity exists",
                [],
                ensureReportVersionEntity,
              );
            }
          }

          const crossMenuEntityUuid = entityApplicationVersionCrossMenuVersion.uuid;
          const crossMenuEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossMenuEntityUuid,
          );
          if (!crossMenuEntityPresent) {
            const ensureCrossMenu = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossMenuVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossMenuVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossMenu instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Menu Entity exists",
                [],
                ensureCrossMenu,
              );
            }
          }

          const menuVersionEntityUuid = entityHistoricalMenuVersion.uuid;
          const menuVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === menuVersionEntityUuid,
          );
          if (!menuVersionEntityPresent) {
            const ensureMenuVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalMenuVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalMenuVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureMenuVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure MenuVersion Entity exists",
                [],
                ensureMenuVersionEntity,
              );
            }
          }

          const crossEndpointEntityUuid = entityApplicationVersionCrossEndpointVersion.uuid;
          const crossEndpointEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossEndpointEntityUuid,
          );
          if (!crossEndpointEntityPresent) {
            const ensureCrossEndpoint = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossEndpointVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossEndpointVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossEndpoint instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Endpoint Entity exists",
                [],
                ensureCrossEndpoint,
              );
            }
          }

          const endpointVersionEntityUuid = entityHistoricalEndpointVersion.uuid;
          const endpointVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === endpointVersionEntityUuid,
          );
          if (!endpointVersionEntityPresent) {
            const ensureEndpointVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalEndpointVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalEndpointVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureEndpointVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure EndpointVersion Entity exists",
                [],
                ensureEndpointVersionEntity,
              );
            }
          }

          const crossRunnerEntityUuid = entityApplicationVersionCrossRunnerVersion.uuid;
          const crossRunnerEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossRunnerEntityUuid,
          );
          if (!crossRunnerEntityPresent) {
            const ensureCrossRunner = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossRunnerVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossRunnerVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossRunner instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Runner Entity exists",
                [],
                ensureCrossRunner,
              );
            }
          }

          const runnerVersionEntityUuid = entityHistoricalRunnerVersion.uuid;
          const runnerVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === runnerVersionEntityUuid,
          );
          if (!runnerVersionEntityPresent) {
            const ensureRunnerVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalRunnerVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalRunnerVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureRunnerVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure RunnerVersion Entity exists",
                [],
                ensureRunnerVersionEntity,
              );
            }
          }

          const crossThemeEntityUuid = entityApplicationVersionCrossThemeVersion.uuid;
          const crossThemeEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossThemeEntityUuid,
          );
          if (!crossThemeEntityPresent) {
            const ensureCrossTheme = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossThemeVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossThemeVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossTheme instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross Theme Entity exists",
                [],
                ensureCrossTheme,
              );
            }
          }

          const themeVersionEntityUuid = entityHistoricalThemeVersion.uuid;
          const themeVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === themeVersionEntityUuid,
          );
          if (!themeVersionEntityPresent) {
            const ensureThemeVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalThemeVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalThemeVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureThemeVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure ThemeVersion Entity exists",
                [],
                ensureThemeVersionEntity,
              );
            }
          }

          const crossTransformerDefinitionEntityUuid =
            entityApplicationVersionCrossTransformerDefinitionVersion.uuid;
          const crossTransformerDefinitionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === crossTransformerDefinitionEntityUuid,
          );
          if (!crossTransformerDefinitionEntityPresent) {
            const ensureCrossTransformerDefinition = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureApplicationVersionCrossTransformerDefinitionVersion",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityApplicationVersionCrossTransformerDefinitionVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureCrossTransformerDefinition instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure Cross TransformerDefinition Entity exists",
                [],
                ensureCrossTransformerDefinition,
              );
            }
          }

          const transformerDefinitionVersionEntityUuid =
            entityHistoricalTransformerDefinitionVersion.uuid;
          const transformerDefinitionVersionEntityPresent = metaModel.entities.some(
            (e) => e.uuid === transformerDefinitionVersionEntityUuid,
          );
          if (!transformerDefinitionVersionEntityPresent) {
            const ensureTransformerDefinitionVersionEntity = await this.handleModelAction(
              {
                actionType: "createEntity",
                actionLabel: "freezeEnsureHistoricalTransformerDefinitionVersionEntity",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: payload.application,
                  transactional: false,
                  entities: [entityHistoricalTransformerDefinitionVersion as Entity],
                },
              },
              applicationDeploymentMap,
              targetModelEnvironment,
            );
            if (ensureTransformerDefinitionVersionEntity instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "freezeApplicationVersion failed to ensure TransformerDefinitionVersion Entity exists",
                [],
                ensureTransformerDefinitionVersionEntity,
              );
            }
          }

          // Freeze application Entities only — exclude MetaModel bootstrap Entities
          // (Entity, Report, Cross, …) that may appear in currentModel.entities.
          const metaBootstrapUuids = new Set(
            (targetModelEnvironment.miroirMetaModel?.entities ?? []).map((e) => e.uuid),
          );
          metaBootstrapUuids.add(crossEntityUuid);
          metaBootstrapUuids.add(crossQueryEntityUuid);
          metaBootstrapUuids.add(queryVersionEntityUuid);
          metaBootstrapUuids.add(crossReportEntityUuid);
          metaBootstrapUuids.add(reportVersionEntityUuid);
          metaBootstrapUuids.add(crossMenuEntityUuid);
          metaBootstrapUuids.add(menuVersionEntityUuid);
          metaBootstrapUuids.add(crossEndpointEntityUuid);
          metaBootstrapUuids.add(endpointVersionEntityUuid);
          metaBootstrapUuids.add(crossRunnerEntityUuid);
          metaBootstrapUuids.add(runnerVersionEntityUuid);
          metaBootstrapUuids.add(crossThemeEntityUuid);
          metaBootstrapUuids.add(themeVersionEntityUuid);
          metaBootstrapUuids.add(crossTransformerDefinitionEntityUuid);
          metaBootstrapUuids.add(transformerDefinitionVersionEntityUuid);
          const applicationEntities = metaModel.entities.filter(
            (e) => !metaBootstrapUuids.has(e.uuid),
          );

          const freezeMetaModelSlice: FreezeMetaModelSlice = {
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
          };
          const persistedHistory = await this.loadModelVersionHistoryForFreeze(
            payload.application,
            applicationDeploymentMap,
          );
          const enrichedMetaModel = mergeVersionHistoryIntoFreezeMetaModel(
            freezeMetaModelSlice,
            persistedHistory,
          );

          const plan = planFreezeApplicationVersionFromMetaModel(payload, {
            applications: enrichedMetaModel.applications,
            entities: applicationEntities,
            storedQueries: enrichedMetaModel.storedQueries as StoredQueryForFreeze[],
            applicationVersions: enrichedMetaModel.applicationVersions,
            entityVersions: enrichedMetaModel.entityVersions,
            applicationVersionCrossEntityVersion: enrichedMetaModel.applicationVersionCrossEntityVersion,
            applicationVersionCrossQueryVersion: enrichedMetaModel.applicationVersionCrossQueryVersion,
            queryVersions: enrichedMetaModel.queryVersions,
            applicationVersionCrossReportVersion: enrichedMetaModel.applicationVersionCrossReportVersion,
            reportVersions: enrichedMetaModel.reportVersions,
            reports: enrichedMetaModel.reports,
            applicationVersionCrossMenuVersion: enrichedMetaModel.applicationVersionCrossMenuVersion,
            menuVersions: enrichedMetaModel.menuVersions,
            menus: enrichedMetaModel.menus,
            applicationVersionCrossEndpointVersion:
              enrichedMetaModel.applicationVersionCrossEndpointVersion,
            endpointVersions: enrichedMetaModel.endpointVersions,
            endpoints: enrichedMetaModel.endpoints,
            applicationVersionCrossRunnerVersion:
              enrichedMetaModel.applicationVersionCrossRunnerVersion,
            runnerVersions: enrichedMetaModel.runnerVersions,
            runners: enrichedMetaModel.runners,
            applicationVersionCrossThemeVersion:
              enrichedMetaModel.applicationVersionCrossThemeVersion,
            themeVersions: enrichedMetaModel.themeVersions,
            themes: enrichedMetaModel.themes,
            applicationVersionCrossTransformerDefinitionVersion:
              enrichedMetaModel.applicationVersionCrossTransformerDefinitionVersion,
            transformerDefinitionVersions: enrichedMetaModel.transformerDefinitionVersions,
            transformerDefinitions: enrichedMetaModel.transformerDefinitions,
          });

          const persistResult = await this.persistFreezeApplicationVersionPlan(
            plan,
            payload.application,
            applicationDeploymentMap,
          );
          if (persistResult instanceof Action2Error) {
            return persistResult;
          }
          break;
        }
        default: {
          log.warn("DomainController handleModelAction cannot handle action name for", modelAction);
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleModelAction caught exception when handling",
        modelAction["actionType"],
        "application",
        modelAction.payload.application,
        "deploymen+t",
        deploymentUuid,
        "action",
        modelAction,
        "error instanceof Action2Error=",
        error instanceof Action2Error,
        "exception",
        error,
      );
      if (error instanceof Action2Error) {
        return error;
      }
      return new Action2Error(
        "FailedToHandleAction",
        "DomainController handleModelAction caught error:" +
          (error instanceof Error ? error.message : "Action2Error"),
        [],
        error as any,
      );
    }
    log.debug(
      "DomainController handleModelAction DONE actionType=",
      modelAction["actionType"],
      "application",
      modelAction.payload.application,
      "deployment",
      deploymentUuid,
    );

    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // private async trackAction<T>(
  //   actionType: string,
  //   actionLabel: string | undefined,
  //   actionFn: () => Promise<T>
  // ): Promise<T> {
  //   const trackingId = this.miroirContext.miroirActivityTracker.startEvent(actionType, actionLabel);
  //   try {
  //     const result = await actionFn();
  //     this.miroirContext.miroirActivityTracker.endEvent(trackingId);
  //     return result;
  //   } catch (error) {
  //     this.miroirContext.miroirActivityTracker.endEvent(trackingId, error instanceof Error ? error.message : String(error));
  //     throw error;
  //   }
  // }

  // ##############################################################################################
  async handleActionFromUI(
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment,
    endpointApplicationMap?: EndpointApplicationMap,
  ): Promise<Action2VoidReturnType> {
    return this.miroirContext.miroirActivityTracker.trackAction(
      domainAction.actionType,
      (domainAction as any).actionLabel,
      (async () => {
        // log.info(
        //   "handleActionFromUI running for action type",
        //   domainAction.actionType,
        //   // "on deployment",
        //   "autocommit=",
        //   autocommit,
        //   "domainAction",
        //   domainAction,
        // );
        if (autocommit) {
          return this.handleActionInternal(
            domainAction,
            applicationDeploymentMap,
            currentModelEnvironment,
          ).then(async (result: Action2ReturnType) => {
            const application = (domainAction.payload as any).application ?? "APPLICATION_UUID_NOT_FOUND";
            const deploymentUuid =
              // domainAction.payload.deploymentUuid ??
              applicationDeploymentMap[application];
            if (result instanceof Action2Error) {
              log.error(
                "handleActionFromUI not autocommitting due to error result for action",
                domainAction.actionType,
                "application",
                application,
                "deployment",
                deploymentUuid,
                "domainAction",
                domainAction,
                "result",
                result,
              );
              return result;
            }
            // else {
            //   log.info(
            //     "handleActionFromUI autocommitting (if necessary) for action",
            //     domainAction.actionType,
            //     "domainAction",
            //     domainAction,
            //     "result instance of Action2Error",
            //     result instanceof Action2Error,
            //     "result",
            //     result,
            //   );
            // }
            if (
              domainAction.actionType == "transactionalInstanceAction" ||
              domainAction.actionType == "alterEntityAttribute" ||
              domainAction.actionType == "createEntity" ||
              domainAction.actionType == "renameEntity" ||
              domainAction.actionType == "dropEntity" ||
              domainAction.actionType == "compositeActionSequence"
            ) {
              // automatically commit after each model action from the UI if autocommit is enabled
              const commitAction: ModelAction = {
                actionType: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: application,
                },
              };
              const result = await this.handleActionInternal(
                commitAction,
                applicationDeploymentMap,
                currentModelEnvironment,
              );
              // log.info(
              //   "handleActionFromUI autocommit done for action",
              //   domainAction.actionType,
              //   "application",
              //   domainAction.payload.application,
              //   "deployment",
              //   deploymentUuid,
              //   "domainAction",
              //   domainAction,
              //   "result instance of Action2Error",
              //   result instanceof Action2Error,
              //   "commit result",
              //   result,
              // );
              return Promise.resolve(result);
            } else {
              // log.info(
              //   "handleActionFromUI no autocommit for action",
              //   domainAction.actionType,
              //   "domainAction",
              //   domainAction,
              // );
              return result;
            }
          });
        }
        return this.handleActionInternal(
          domainAction,
          applicationDeploymentMap,
          currentModelEnvironment,
        );
        // return Promise.resolve();
      }).bind(this),
    );
    // return Promise.resolve(ACTION_OK);
  }
  // ##############################################################################################
  // private async trackAction<T>(
  //   actionType: string,
  //   actionLabel: string | undefined,
  //   actionFn: () => Promise<T>
  // ): Promise<T> {
  //   const trackingId = this.miroirContext.miroirActivityTracker.startEvent(actionType, actionLabel);
  //   try {
  //     const result = await actionFn();
  //     this.miroirContext.miroirActivityTracker.endEvent(trackingId);
  //     return result;
  //   } catch (error) {
  //     this.miroirContext.miroirActivityTracker.endEvent(trackingId, error instanceof Error ? error.message : String(error));
  //     throw error;
  //   }
  // }

  // ##############################################################################################
  async handleAction(
    domainAction: DomainAction, // TODO: actions from other applications can be handled, too!
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment,
    endpointApplicationMap?: EndpointApplicationMap,
    actionParamValues?: Record<string, unknown>,
  ): Promise<Action2VoidReturnType> {
    log.debug("DomainController handleAction START actionType=", domainAction["actionType"]);
    return this.miroirContext.miroirActivityTracker.trackAction(
      domainAction.actionType,
      (domainAction as any).actionLabel,
      (async () => {
        // Derive the application UUID from the endpoint using the endpointApplicationMap.
        // This replaces the former envelope-level `application` field.
        const resolvedEndpointApplicationMap = endpointApplicationMap ?? defaultEndpointApplicationMap;
        const endpointUuid = (domainAction as any)?.endpoint;
        const applicationUuid = endpointUuid ? resolvedEndpointApplicationMap[endpointUuid] : undefined;
        log.debug(
          "DomainController handleAction",
          domainAction.actionType,
          "endpoint",
          endpointUuid,
          "derived applicationUuid",
          applicationUuid,
          "received endpointApplicationMap",
          endpointApplicationMap,
          "resolvedEndpointApplicationMap used for resolution",
          resolvedEndpointApplicationMap,
          "resulting applicationUuid",
          applicationUuid,
        );
        if (applicationUuid !== undefined && (
          applicationUuid !== selfApplicationMiroir.uuid ||
          (domainAction as any).actionType == "entity_DuplicateAttribute" 
        )) {
          return this.handleApplicationAction(
            domainAction,
            applicationDeploymentMap,
            currentModelEnvironment,
            actionParamValues,
          );
        } else {
          return this.handleActionInternal(
            domainAction,
            applicationDeploymentMap,
            currentModelEnvironment,
          );
        }
        // return Promise.resolve();
      }).bind(this),
    );
    // return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  private async handleApplicationAction(
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment,
    actionParamValues?: Record<string, unknown>,
  ): Promise<Action2VoidReturnType> {
    log.info(
      "DomainController handleApplicationAction",
      domainAction.actionType,
      "domainAction",
      JSON.stringify(domainAction, null, 2),
      "endpoints",
      JSON.stringify(Object.keys(currentModelEnvironment?.endpointsByUuid || {}), null, 2),
    );
    if (!currentModelEnvironment) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction call is missing currentModelEnvironment argument",
          [],
        ),
      );
    }
    if (!(domainAction as any).endpoint) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction missing endpoint in action",
          [],
        ),
      );
    }
    if (!(domainAction as any).actionType) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction missing actionType in action",
          [],
        ),
      );
    }
    // look up the action implementation in the currentModelEnvironment
    const currentEndpointDefinition: EndpointDefinition | undefined =
      currentModelEnvironment?.endpointsByUuid[(domainAction as any).endpoint] ??
      currentModelEnvironment?.miroirMetaModel?.endpoints?.find((e) => e.uuid === (domainAction as any).endpoint);

    log.info(
      "DomainController handleApplicationAction currentEndpointDefinition",
      currentEndpointDefinition,
    );
    if (!currentEndpointDefinition) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction could not find action endpoint: " +
            (domainAction as any).endpoint +
            " in current model environment endpoints: " +
            Object.keys(currentModelEnvironment?.endpointsByUuid || {}).join(", ") +
            " currentModelEnvironment deploymentUuid: " +
            (currentModelEnvironment as any).deploymentUuid,
          [],
          undefined, // innerError
          { 
            domainAction, 
            deploymentUuid: currentModelEnvironment.deploymentUuid,
            applicationName: currentModelEnvironment.currentModel?.applicationName,
            applicationUuid: currentModelEnvironment.currentModel?.applicationUuid,
            endpointsInModelEnvironment: Object.keys(currentModelEnvironment?.endpointsByUuid || {}),
            application: currentModelEnvironment.currentModel?.applications,
          },
        ),
      );
    }
    const currentActionDefinition = currentEndpointDefinition.definition.actions.find(
      (ac) => ac.actionParameters.actionType.definition == (domainAction as any).actionType,
    );
    // log.info(
    //   "DomainController handleApplicationAction currentActionDefinition",
    //   currentActionDefinition,
    // );
    if (!currentActionDefinition) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction unknown actionType in action: " +
            (domainAction as any).actionType,
          [],
        ),
      );
    }
    if (!currentActionDefinition.actionImplementation) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction actionType has no implementation: " +
            (domainAction as any).actionType,
          [],
        ),
      );
    }
    if (
      currentActionDefinition.actionImplementation.actionImplementationType !=
      "compositeActionTemplate"
    ) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction actionImplementationType not supported yet: " +
            currentActionDefinition.actionImplementation.actionImplementationType,
          [],
        ),
      );
    }

    const result = this.handleCompositeActionTemplate(
      currentActionDefinition.actionImplementation.definition as CompositeActionTemplate,
      applicationDeploymentMap,
      currentModelEnvironment,
      {
        ...(actionParamValues ?? {}),
        ...domainAction,
        deploymentUuid: applicationDeploymentMap[currentEndpointDefinition.application],
      },
    );
    return result;
  }
  // ##############################################################################################
  private async handleActionInternal(
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    // localContext: Record<string, any> = {},
    currentModel?: MiroirModelEnvironment,
  ): Promise<Action2VoidReturnType> {
    log.debug("handleActionInternal START for action", domainAction);
    const application = (domainAction.payload as any).application ?? "APPLICATION_UUID_NOT_FOUND";
    const deploymentUuid = applicationDeploymentMap[application];
    const actionPhase = logPhaseForActionType(domainAction.actionType);


    // if (
    //   domainAction.actionType != "initModel"
    // ) {
    //   // log.debug(
    //   //   "DomainController handleAction domainAction",
    //   //   JSON.stringify(domainAction, null, 2),
    //   // );
    // }
    // //  else {
    // //   log.debug("DomainController handleAction domainAction", domainAction);
    // // }
    try {
      LoggerGlobalContext.setAction(domainAction.actionType);
      // Also set in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(domainAction.actionType);
      if (actionPhase) {
        this.miroirContext.miroirActivityTracker.pushPhase(actionPhase);
      }
      switch (domainAction.actionType) {
        // case "modelAction":
        case "initModel":
        case "commit":
        case "rollback":
        case "remoteLocalCacheRollback":
        case "resetModel":
        case "resetData":
        case "alterEntityAttribute":
        case "renameEntity":
        case "createEntity":
        case "dropEntity":
        case "freezeApplicationVersion": {
          if (!currentModel) {
            // throw new Error(
            //   "DomainController handleAction for modelAction needs a currentModel argument"
            // );
            return Promise.resolve(
              new Action2Error(
                "InvalidAction",
                "DomainController handleAction for modelAction needs a currentModel argument",
                [],
                undefined,
                { domainAction },
              ),
            );
          }
          return this.handleModelAction(domainAction, applicationDeploymentMap, currentModel);
        }
        // case "instanceAction": {
        case "createInstance":
        case "deleteInstance":
        case "deleteInstanceWithCascade":
        case "updateInstance":
        case "loadNewInstancesInLocalCache":
        case "getInstance":
        case "getInstances": {
          return this.handleInstanceAction(domainAction, applicationDeploymentMap);
        }
        // case "storeManagementAction": {
        case "storeManagementAction_createStore":
        case "storeManagementAction_deleteStore":
        case "storeManagementAction_resetAndInitApplicationDeployment":
        case "storeManagementAction_openStore":
        case "storeManagementAction_closeStore": {
          if (
            domainAction.actionType == "storeManagementAction_resetAndInitApplicationDeployment"
          ) {
            await resetAndInitApplicationDeployment(
              this,
              applicationDeploymentMap,
              domainAction.payload.deployments as any as Deployment[],
            ); // TODO: works because only uuid of deployments is accessed in resetAndInitApplicationDeployment
          } else {
            try {
              switch (this.persistenceStoreAccessMode) {
                case "local": {
                  const result =
                    await this.persistenceStoreLocalOrRemote.handleStoreOrBundleActionForLocalStore(
                      domainAction,
                      applicationDeploymentMap,
                    );
                  if (result instanceof Action2Error) {
                    return result as any;
                  } else {
                    return Promise.resolve(ACTION_OK);
                  }
                  break;
                }
                case "remote": {
                  const result = await this.callUtil.callPersistenceAction(
                    {}, // context
                    {}, // continuation
                    applicationDeploymentMap,
                    domainAction,
                  );
                  if (result instanceof Action2Error) {
                    return result as any;
                  } else {
                    return Promise.resolve(ACTION_OK);
                  }
                  break;
                }
                default: {
                  log.error(
                    "DomainController handleAction storeManagementAction unknown persistenceStoreAccessMode",
                    this.persistenceStoreAccessMode,
                  );
                  throw new Error(
                    "DomainController handleAction storeManagementAction unknown persistenceStoreAccessMode " +
                      this.persistenceStoreAccessMode,
                  );
                  break;
                }
              }
            } catch (error) {
              log.warn(
                "DomainController handleAction caught exception when handling",
                domainAction.actionType,
                "application",
                domainAction.payload.application,
                "deployment",
                applicationDeploymentMap[domainAction.payload.application],
                "action",
                domainAction,
                "exception",
                error,
              );
            }
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        case "bundleAction": {
          // TODO: create a test for this!
          try {
            await this.callUtil.callPersistenceAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              domainAction,
            );
          } catch (error) {
            log.warn(
              "DomainController handleAction caught exception when handling",
              domainAction.actionType,
              "deployment",
              deploymentUuid,
              "action",
              domainAction,
              "exception",
              error,
            );
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        case "undo":
        case "redo": {
          if (!currentModel) {
            throw new Error(
              "DomainController handleAction for undoRedoAction needs a currentModel argument",
            );
          }
          // TODO: create callSyncActionHandler
          return this.handleDomainUndoRedoAction(
            deploymentUuid,
            applicationDeploymentMap,
            domainAction,
            currentModel,
          );
        }
        case "transactionalInstanceAction": {
          try {
            await this.callUtil.callLocalCacheAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              domainAction,
            );
          } catch (error) {
            log.warn(
              "DomainController handleAction caught exception when handling",
              domainAction.actionType,
              "application",
              domainAction.payload.application,
              "deployment",
              applicationDeploymentMap[domainAction.payload.application],
              "action",
              domainAction,
              "exception",
              error,
            );
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        case "compositeRunBoxedQueryTemplateAction": {
          return this.handleCompositeRunBoxedQueryTemplateAction(
            domainAction,
            applicationDeploymentMap,
            {},
            {},
          );
          throw new Error(
            "DomainController handleAction compositeRunBoxedQueryTemplateAction is not implemented yet",
          );
        }
        case 'compositeRunBoxedQueryAction':{
          return this.handleCompositeRunBoxedQueryAction(domainAction, applicationDeploymentMap, {});
          // throw new Error(
          //   "DomainController handleAction compositeRunBoxedQueryAction is not implemented yet",
          // );
        }
        case "compositeActionSequence": {
          // old school, not used anymore (or should not be used anymore)
          return this.handleCompositeAction(
            domainAction,
            applicationDeploymentMap,
            currentModel ?? ({} as MiroirModelEnvironment),
            {}, // actionParamValues, not used in the old compositeActionSequence, should be removed from the signature
          );
          // throw new Error(
          //   "DomainController handleAction compositeActionSequence should not be used anymore",
          // );
          break;
        }
        default:
          log.error(
            "DomainController handleAction action could not be taken into account, unkown action",
            domainAction,
          );
      }
      return Promise.resolve(ACTION_OK);
    } catch (error) {
      log.error("DomainController handleAction caught error", error);
      if (error instanceof Action2Error) {
        return error;
      }
      return new Action2Error(
        "FailedToHandleAction",
        "DomainController handleAction caught error" + JSON.stringify(error, null, 2),
      );
    } finally {
      if (actionPhase) {
        this.miroirContext.miroirActivityTracker.popPhase();
      }
      LoggerGlobalContext.setAction(undefined);
      // Also clear in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(undefined);
    }
  }

  // ##############################################################################################
  // TODO: used in tests only?!
  async handleCompositeAction(
    compositeActionSequence: CompositeActionSequence,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    return this.miroirContext.miroirActivityTracker.trackAction(
      "compositeActionSequence",
      compositeActionSequence.actionLabel,
      (async () =>
        this.handleCompositeActionInternal(
          compositeActionSequence,
          modelEnvironment,
          applicationDeploymentMap,
          actionParamValues,
        )).bind(this),
    );
  }

  // ##############################################################################################
  private async handleCompositeActionInternal(
    compositeActionSequence: CompositeActionSequence,
    modelEnvironment: MiroirModelEnvironment,
    applicationDeploymentMap: ApplicationDeploymentMap,
    actionParamValues: Record<string, any>,
    actionContext: Record<string, any> = {},
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    const sequenceToExecute = expandResolvableResetAndinitializeDeploymentCompositeAction(
      compositeActionSequence,
      localActionParams,
    );

    // log.info(
    //   "handleCompositeAction compositeActionSequence",
    //   compositeActionSequence,
    //   // JSON.stringify(compositeActionSequence, null, 2),
    //   "localActionParams keys",
    //   Object.keys(localActionParams),
    // );

    for (const currentAction of sequenceToExecute.payload.actionSequence) {
      let actionResult: Action2ReturnType | undefined = undefined;
      try {
        log.debug(
          "handleCompositeAction compositeActionSequence handling sub action",
          currentAction,
          "modelEnvironment deploymentUuid",
          modelEnvironment.deploymentUuid,
          "currentModel uuid",
          modelEnvironment.currentModel.applicationUuid,
          "currentModel endpoints",
          modelEnvironment.currentModel.endpoints.map((ep) => ({uuid: ep.uuid, name: ep.name})).join(", ")
        );
        LoggerGlobalContext.setAction(currentAction.actionLabel);
        // Also set in MiroirActivityTracker for MiroirEventService
        this.miroirContext.miroirActivityTracker.setAction(currentAction.actionLabel);
        // log.info(
        //   "handleCompositeAction compositeInstanceAction handling sub currentAction",
        //   JSON.stringify(currentAction, null, 2),
        //   // currentAction,
        //   "localContext keys",
        //   Object.keys(localContext),
        // );
        switch (currentAction.actionType) {
          case "compositeActionSequence": {
            // composite pattern, recursive call
            // log.info(
            //   "handleCompositeAction compositeActionSequence action to handle",
            //   JSON.stringify(currentAction, null, 2),
            // );
            actionResult = await this.handleCompositeActionTemplate(
              currentAction as any,
              applicationDeploymentMap,
              modelEnvironment,
              localActionParams,
              actionContext,
            );
            break;
          }
          case "compositeRunBoxedQueryAction": {
            // throw new Error(
            //   "DomainController handleCompositeAction compositeRunBoxedQueryAction should not be used in compositeActionSequence, it should be used in compositeActionTemplate instead",
            // );
            actionResult = await this.handleCompositeRunBoxedQueryAction(
              currentAction,
              applicationDeploymentMap,
              localContext,
            );
            if (actionResult instanceof Action2Error) {
              return actionResult;
            }
            break;
          }
          case "compositeRunTestAssertion": {
            actionResult = await this.miroirContext.miroirActivityTracker.trackTestAssertion(
              currentAction.actionLabel || "unnamed assertion",
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              (async () =>
                this.handleTestCompositeActionAssertion(
                  currentAction,
                  modelEnvironment,
                  localContext,
                  actionResult,
                )).bind(this),
            );
            break;
          }
          case 'compositeRunBoxedQueryTemplateAction': {
            throw new Error(
              "DomainController handleCompositeAction compositeRunBoxedQueryTemplateAction should not be used in compositeActionSequence, it should be used in compositeActionTemplate instead",
            );
          }
          // case "instanceAction":
          case "createInstance":
          case "deleteInstance":
          case "deleteInstanceWithCascade":
          case "updateInstance":
          case "loadNewInstancesInLocalCache":
          case "getInstance":
          case "getInstances":
          //
          case "undo":
          case "redo":
          // case "modelAction":
          case "initModel":
          case "commit":
          case "rollback":
          case "remoteLocalCacheRollback":
          case "resetModel":
          case "resetData":
          case "alterEntityAttribute":
          case "renameEntity":
          case "createEntity":
          case "dropEntity":
          case "freezeApplicationVersion":
          case "transactionalInstanceAction":
          // case "storeManagementAction":
          case "storeManagementAction_createStore":
          case "storeManagementAction_deleteStore":
          case "storeManagementAction_resetAndInitApplicationDeployment":
          case "storeManagementAction_openStore":
          case "storeManagementAction_closeStore":
          //
          case "bundleAction":
          default: {
            // these are PreActions, the runtime transformers present in them must be resolved before the action is executed
            if (
              // currentAction.actionType !== "modelAction" ||
              currentAction.actionType !== "initModel"
            ) {
              log.debug(
                "handleCompositeAction domainAction action to handle",
                JSON.stringify(currentAction, null, 2),
              );
            }
            actionResult = await this.handleAction(
              currentAction,
              applicationDeploymentMap,
              modelEnvironment,
              undefined,
              localActionParams,
            );
            if (actionResult instanceof Action2Error) {
              log.error(
                "handleCompositeAction Error on action",
                JSON.stringify(currentAction, null, 2),
                "actionResult",
                JSON.stringify(actionResult, null, 2),
              );
              throw new Error(
                "handleCompositeAction Error on action" +
                  JSON.stringify(currentAction, null, 2) +
                  "actionResult" +
                  JSON.stringify(actionResult, null, 2),
              );
            }
            break;
          }
          // default: {
          //   log.error("handleCompositeAction unknown actionType", currentAction);
          //   break;
          // }
        }
        if (actionResult instanceof Action2Error) {
          log.error(
            "handleCompositeAction error",
            JSON.stringify(actionResult, null, 2),
            "on action",
            JSON.stringify(currentAction, null, 2),
          );
          return new Action2Error(
            "FailedTestAction",
            "handleCompositeAction error",
            [
              currentAction.actionLabel ?? currentAction.actionType,
              ...(actionResult.errorStack ?? ([] as any)),
            ],
            actionResult,
          );
        }
      } catch (error) {
        return new Action2Error(
          "FailedTestAction",
          "handleCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType],
        );
      } finally {
        // LoggerGlobalContext.setCompositeAction(undefined);
        // Also clear in MiroirActivityTracker for MiroirEventService
        this.miroirContext.miroirActivityTracker.setCompositeAction(undefined);
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleRuntimeCompositeActionDO_NOT_USE(
    compositeActionSequenceTemplate: CompositeActionSequenceTemplate,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    // log.info(
    //   "handleRuntimeCompositeAction compositeActionSequence",
    //   JSON.stringify(compositeActionSequenceTemplate, null, 2),
    //   "localActionParams keys",
    //   Object.keys(localActionParams),
    // );

    for (const currentAction of compositeActionSequenceTemplate.payload.actionSequence) {
      let actionResult: Action2ReturnType | undefined = undefined;
      const currentActionlabel: string | undefined = currentAction.actionLabel
        ? (currentAction as any).actionLabel instanceof String
          ? (currentAction.actionLabel as string)
          : transformer_extended_apply(
              "runtime",
              [],
              JSON.stringify(currentAction.actionLabel),
              currentAction.actionLabel as any as CoreTransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext, // contextResults
            )
        : currentAction.actionType;
      try {
        LoggerGlobalContext.setAction(currentActionlabel);
        // Also set in MiroirActivityTracker for MiroirEventService
        this.miroirContext.miroirActivityTracker.setAction(currentActionlabel);

        switch (currentAction.actionType) {
          case "compositeActionSequence": {
            // composite pattern, recursive call
            // log.info(
            //   "handleRuntimeCompositeAction compositeActionSequence action to handle",
            //   JSON.stringify(currentAction, null, 2),
            // );
            actionResult = await this.handleRuntimeCompositeActionDO_NOT_USE(
              currentAction,
              applicationDeploymentMap,
              modelEnvironment,
              actionParamValues,
            );
            break;
          }
          // case "instanceAction":
          case "createInstance":
          case "deleteInstance":
          case "deleteInstanceWithCascade":
          case "updateInstance":
          case "loadNewInstancesInLocalCache":
          case "getInstance":
          case "getInstances":
          //
          case "redo":
          case "undo":
          // case "modelAction":
          // case 'compositeRunBoxedExtractorAction':
          case "initModel":
          case "commit":
          case "rollback":
          case "remoteLocalCacheRollback":
          case "resetModel":
          case "resetData":
          case "alterEntityAttribute":
          case "renameEntity":
          case "createEntity":
          case "dropEntity":
          //
          case "transactionalInstanceAction":
          // case "storeManagementAction":
          case "storeManagementAction_createStore":
          case "storeManagementAction_deleteStore":
          case "storeManagementAction_resetAndInitApplicationDeployment":
          case "storeManagementAction_openStore":
          case "storeManagementAction_closeStore":
          //
          case "bundleAction": {
            // these are PreActions, the runtime transformers present in them must be resolved before the action is executed
            if (
              // currentAction.actionType !== "modelAction" ||
              currentAction.actionType !== "initModel"
            ) {
              // log.info(
              //   "handleRuntimeCompositeAction domainAction action to handle",
              //   JSON.stringify(currentAction, null, 2),
              // );
            }
            // // TODO: resolve runtime transformers for all composite actions. Should there be preserved areas?
            const resolvedAction = transformer_extended_apply(
              "runtime",
              [],
              currentActionlabel,
              currentAction as any as CoreTransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext, // contextResults
            );

            // log.info(
            //   "handleRuntimeCompositeAction resolvedAction action to handle",
            //   JSON.stringify(resolvedAction, null, 2),
            // );

            if (resolvedAction instanceof Domain2ElementFailed) {
              log.error(
                "handleRuntimeCompositeAction resolvedAction error",
                JSON.stringify(resolvedAction, null, 2),
              );
              return new Action2Error(
                "FailedToResolveTemplate",
                "handleRuntimeCompositeAction error resolving action",
                [currentActionlabel],
                undefined, // innerError,
                resolvedAction,
              );
            }
            actionResult = await this.handleAction(
              resolvedAction,
              applicationDeploymentMap,
              modelEnvironment,
              undefined,
              actionParamValues,
            );
            // actionResult = await this.handleAction(currentAction, currentModel);
            if (actionResult instanceof Action2Error) {
              log.error(
                "handleRuntimeCompositeAction Error on action",
                JSON.stringify(currentAction, null, 2),
                "actionResult",
                JSON.stringify(actionResult, null, 2),
              );
              throw new Error(
                "handleRuntimeCompositeAction Error on action" +
                  JSON.stringify(currentAction, null, 2) +
                  "actionResult" +
                  JSON.stringify(actionResult, null, 2),
              );
            }
            break;
          }
          case "compositeRunBoxedQueryAction": {
            const resolvedActionWithProtectedRuntimeTranformers: CompositeRunBoxedQueryAction =
              transformer_extended_apply(
                "build",
                [],
                currentAction.actionLabel,
                currentAction as any as CoreTransformerForBuildPlusRuntime,
                "value",
                modelEnvironment,
                actionParamValues, // queryParams
                localContext, // contextResults
              );
            actionResult = await this.handleCompositeRunBoxedQueryAction(
              resolvedActionWithProtectedRuntimeTranformers,
              applicationDeploymentMap,
              localContext,
            );
            if (actionResult instanceof Action2Error) {
              return actionResult;
            }

            break;
          }
          case "compositeRunTestAssertion": {
            const resolvedAction = transformer_extended_apply(
              "runtime",
              [],
              currentAction.actionLabel,
              currentAction as any as CoreTransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext, // contextResults
            );

            log.info(
              "handleRuntimeCompositeAction resolvedAction action to handle",
              JSON.stringify(resolvedAction, null, 2),
            );

            if (resolvedAction instanceof Domain2ElementFailed) {
              log.error(
                "handleRuntimeCompositeAction resolvedAction error",
                JSON.stringify(resolvedAction, null, 2),
              );
              return new Action2Error(
                "FailedToResolveTemplate",
                "handleRuntimeCompositeAction error resolving action ",
                [currentAction.actionLabel ?? currentAction.actionType],
                undefined, // innerError,
                resolvedAction,
              );
            }

            actionResult = this.handleTestCompositeActionAssertion(
              resolvedAction, //currentAction,
              modelEnvironment,
              localContext,
              actionResult,
            );
            if (actionResult instanceof Action2Error) {
              return actionResult;
            }
            break;
          }
          default: {
            log.error("handleRuntimeCompositeAction unknown actionType", currentAction);
            break;
          }
        }
        if (actionResult instanceof Action2Error) {
          log.error(
            "handleRuntimeCompositeAction error",
            JSON.stringify(actionResult, null, 2),
            "on action",
            JSON.stringify(currentAction, null, 2),
          );
          return new Action2Error(
            "FailedTestAction",
            "handleRuntimeCompositeAction error",
            [
              currentAction.actionLabel ?? currentAction.actionType,
              ...(actionResult.errorStack ?? ([] as any)),
            ],
            actionResult,
          );
        }
      } catch (error) {
        log.error(
          "handleRuntimeCompositeAction caught error",
          error,
          "for action",
          JSON.stringify(currentAction, null, 2),
        );
        return new Action2Error(
          "FailedTestAction",
          "handleRuntimeCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentActionlabel],
        );
      } finally {
        LoggerGlobalContext.setCompositeAction(undefined);
        // Also clear in MiroirActivityTracker for MiroirEventService
        this.miroirContext.miroirActivityTracker.setCompositeAction(undefined);
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleBuildPlusRuntimeCompositeAction(
    compositeActionSequenceTemplate: CompositeActionSequenceTemplate,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...templateEvaluationParams, ...actionParamValues };

    log.info(
      "handleBuildPlusRuntimeCompositeAction compositeActionSequence",
      JSON.stringify(compositeActionSequenceTemplate, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams),
    );

    const resolvedCompositeActionTemplates: any = {};
    // going imperatively to handle inner references
    if (compositeActionSequenceTemplate.payload.templates) {

      for (const t of Object.entries(compositeActionSequenceTemplate.payload.templates)) {
        const newLocalParameters: Record<string, any> = {
          ...localActionParams,
          ...resolvedCompositeActionTemplates,
        };
        log.info(
          "handleBuildPlusRuntimeCompositeAction",
          compositeActionSequenceTemplate.actionLabel,
          "resolving template",
          t[0],
          // t[1],
          "newLocalParameters",
          JSON.stringify(Object.keys(newLocalParameters))
        );
        const resolvedTemplate = transformer_extended_apply_wrapper(
          undefined, // activityTracker
          "runtime",//"build", // WHY BUILD??? this should be "runtime"! there will be no further resolution of templates! see resolveCompositeActionTemplate for correct version
          [],
          t[0],
          t[1] as any,
          "value",
          modelEnvironment,
          localActionParams, // queryParams
          newLocalParameters, // contextResults
        );
        if (resolvedTemplate.queryFailure) {
          log.error(
            "handleBuildPlusRuntimeCompositeAction resolved template error",
            resolvedTemplate,
          );
          return new Action2Error(
            "FailedToResolveTemplate",
            "handleBuildPlusRuntimeCompositeAction error resolving template ",
            [
              compositeActionSequenceTemplate.actionLabel ??
                compositeActionSequenceTemplate.actionType,
            ],
            undefined, // innerError,
            resolvedTemplate,
          );
          // throw new Error(
          //   "handleBuildPlusRuntimeCompositeAction error resolving template " +
          //   " " + t[0] + " " + JSON.stringify(resolvedTemplate, null, 2)
          // );
        } else {
          log.info(
            "handleBuildPlusRuntimeCompositeAction",
            compositeActionSequenceTemplate.actionLabel,
            "resolved template",
            t[0],
            "has value",
            resolvedTemplate,
          );
          resolvedCompositeActionTemplates[t[0]] = resolvedTemplate;
        }
      }
    }

    const queryParamsForActionResolution = {
      ...templateEvaluationParams,
      ...actionParamValues,
      ...resolvedCompositeActionTemplates, // TODO: remove, evaluated templates are available only at runtime!
    };

    let localContext: Record<string, any> = {
      ...actionParamValues,
      ...resolvedCompositeActionTemplates,
    };

    log.info(
      "handleBuildPlusRuntimeCompositeAction",
      compositeActionSequenceTemplate.actionLabel,
      "resolving action with templates",
      Object.keys(compositeActionSequenceTemplate.payload.templates ?? {}),
      "resolvedCompositeActionTemplates",
      resolvedCompositeActionTemplates,
      "actionParamValues",
      actionParamValues,
      // "queryParamsForActionResolution",
      // queryParamsForActionResolution,
      "localContext",
      localContext,
    );
    const resolvedActionDefinition: TransformerReturnType<any> = transformer_extended_apply_wrapper(
      undefined, // activityTracker
      "build",
      [],
      compositeActionSequenceTemplate.actionLabel,
      compositeActionSequenceTemplate.payload.actionSequence as any as CoreTransformerForBuildPlusRuntime,
      "value",
      modelEnvironment,
      queryParamsForActionResolution, // queryParams
      localContext, // contextResults
    );

    // log.info(
    //   "handleBuildPlusRuntimeCompositeAction resolvedActionDefinition",
    //   JSON.stringify(resolvedActionDefinition, null, 2)
    // );
    // if (resolvedActionDefinition instanceof Action2Error) {
    if (resolvedActionDefinition instanceof TransformerFailure) {
      log.error(
        "handleBuildPlusRuntimeCompositeAction Error on action",
        JSON.stringify(compositeActionSequenceTemplate, null, 2),
        "actionResult",
        JSON.stringify(compositeActionSequenceTemplate, null, 2),
      );
      return new Action2Error(
        "FailedToResolveAction",
        "handleBuildPlusRuntimeCompositeAction error",
        [
          compositeActionSequenceTemplate.actionLabel ?? compositeActionSequenceTemplate.actionType,
          ...(resolvedActionDefinition.errorStack ?? ([] as any)),
        ],
        resolvedActionDefinition as any, // TODO: Action2Error can not be constructed from TransformerFailure, should this be allowed?
      );
    } else {
      log.info(
        "handleBuildPlusRuntimeCompositeAction resolvedActionDefinition",
        JSON.stringify(resolvedActionDefinition, null, 2),
      );
    }

    const resolvedAction: CompositeActionSequence = {
      actionType: "compositeActionSequence",
      actionLabel: compositeActionSequenceTemplate.actionLabel,
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        actionSequence: resolvedActionDefinition as any,
        templates: resolvedCompositeActionTemplates,
      },
    };

    return this.handleCompositeActionInternal(
      resolvedAction,
      modelEnvironment,
      applicationDeploymentMap,
      actionParamValues,
      localContext,
    );
    // return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  private handleTestCompositeActionAssertion(
    currentAction: {
      actionType: "compositeRunTestAssertion";
      actionLabel?: string | undefined;
      nameGivenToResult: string;
      testAssertion: TestAssertion;
    },
    modelEnvironment: MiroirModelEnvironment,
    localContext: Record<string, any>,
    actionResult: Action2ReturnType | undefined,
  ): Action2ReturnType {
    if (!ConfigurationService.configurationService.testImplementation) {
      throw new Error(
        "ConfigurationService.testImplementation is not set, please inject a test implementation using ConfigurationService.registerTestImplementation on startup if you want to run tests at runtime.",
      );
    }
    let valueToTest: any = undefined;
    try {
      // this.miroirContext.miroirActivityTracker.setTestAssertion(currentAction.testAssertion.testLabel);

      // TODO: shall there be an interpretation at all?
      const prePreValueToTest = currentAction.testAssertion.definition.resultTransformer
        ? transformer_extended_apply(
            "runtime",
            [],
            undefined /**WHAT?? */,
            currentAction.testAssertion.definition.resultTransformer,
            "value",
            modelEnvironment,
            localContext,
            localContext, // TODO: should be {}?
          )
        : localContext;
      
      if (prePreValueToTest instanceof TransformerFailure) {
        log.error(
          "handleTestCompositeActionAssertion prePreValueToTest is a TransformerFailure",
          prePreValueToTest,
        );
        return new Action2Error(
          "FailedToResolveTemplate",
          "handleTestCompositeActionAssertion error resolving template ",
          [currentAction.testAssertion.testLabel],
          prePreValueToTest as any,
        );
      } else {
        log.debug(
          "handleTestCompositeActionAssertion prePreValueToTest is not a TransformerFailure, value=",
          prePreValueToTest,
        );
      }

      if (typeof prePreValueToTest === "object") {
        const preValueToTest =  resolvePathOnObject(
          prePreValueToTest,
          currentAction.testAssertion.definition.resultAccessPath ?? [],
        );
        // #220 / #217 — skinny Entity expectations ignore present-model fields now carried on Entity
        const assertionIgnoreAttributes = [
          ...(currentAction.testAssertion.definition.ignoreAttributes ?? []),
          ...ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
        ];
  
        valueToTest = removeUndefinedProperties(
          unNullify(
            Array.isArray(preValueToTest)
              ? ignorePostgresExtraAttributesOnList(
                  preValueToTest,
                  assertionIgnoreAttributes,
                )
              : ignorePostgresExtraAttributesOnObject(
                  preValueToTest,
                  assertionIgnoreAttributes,
                ),
          ),
        );
      } else {
        valueToTest = prePreValueToTest;
      }
      const assertionIgnoreAttributes = [
        ...(currentAction.testAssertion.definition.ignoreAttributes ?? []),
        ...ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
      ];
      const expectedValue = typeof currentAction.testAssertion.definition.expectedValue === "object"?
      Array.isArray(currentAction.testAssertion.definition.expectedValue)
        ? ignorePostgresExtraAttributesOnList(
            currentAction.testAssertion.definition.expectedValue,
            assertionIgnoreAttributes,
          )
        : ignorePostgresExtraAttributesOnObject(
            currentAction.testAssertion.definition.expectedValue,
            assertionIgnoreAttributes,
          ):currentAction.testAssertion.definition.expectedValue;
      log.debug(
        "handleTestCompositeActionAssertion compositeRunTestAssertion to handle",
        JSON.stringify(currentAction.testAssertion, null, 2),
        "ignoreAttributes",
        assertionIgnoreAttributes,
        "expectedValue",
        JSON.stringify(expectedValue, null, 2),
        "valueToTest",
        JSON.stringify(valueToTest, null, 2),
      );
      try {
        ConfigurationService.configurationService.testImplementation
          .expect(valueToTest, currentAction.nameGivenToResult)
          .toEqual(expectedValue);
        // .toEqual(currentAction.testAssertion.definition.expectedValue);
        log.info(
          "assertion",
          currentAction.testAssertion.testLabel,
          "ok",
        );
        actionResult = {
          status: "ok",
          returnedDomainElement: undefined,
        };
        // TestSuiteContext.setTestAssertionResult({
        //   assertionName: currentAction.testAssertion.testLabel,
        //   assertionResult: "ok",
        //   // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
        //   // assertionActualValue: valueToTest,
        // });
        // Set test result in MiroirActivityTracker for TestLogService
        this.miroirContext.miroirActivityTracker.setTestAssertionResult(
          this.miroirContext.miroirActivityTracker.getCurrentTestAssertionPath(),
          {
            assertionName: currentAction.testAssertion.testLabel,
            assertionResult: "ok",
          },
        );
      } catch (error) {
        log.info(
          "assertion",
          currentAction.testAssertion.testLabel,
          "fail",
        );
        // Set test result in MiroirActivityTracker for TestLogService
        this.miroirContext.miroirActivityTracker.setTestAssertionResult(
          this.miroirContext.miroirActivityTracker.getCurrentTestAssertionPath(),
          {
            assertionName: currentAction.testAssertion.testLabel,
            assertionResult: "error",
            assertionExpectedValue: currentAction.testAssertion.definition.expectedValue,
            assertionActualValue: valueToTest,
          },
        );
        // return ACTION_OK;
        actionResult = ACTION_OK;
      }
    } catch (error) {
      log.error("handleTestCompositeActionAssertion compositeRunTestAssertion error", error);
      // TODO: 2 try catch blocks, one for the expect, one for the rest
      // TestSuiteContext.setTestAssertionResult({
      //   assertionName: currentAction.testAssertion.testLabel,
      //   assertionResult: "error",
      //   // TODO: set error message
      //   // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
      //   // assertionActualValue: valueToTest,
      // });
      // Set test result in MiroirActivityTracker for TestLogService
      this.miroirContext.miroirActivityTracker.setTestAssertionResult(
        this.miroirContext.miroirActivityTracker.getCurrentTestAssertionPath(),
        {
          assertionName: currentAction.testAssertion.testLabel,
          assertionResult: "error",
        },
      );
      throw new Error(
        "handleTestCompositeActionAssertion compositeRunTestAssertion error" +
          JSON.stringify(error, null, 2),
      );
    } finally {
      // Clear test assertion in MiroirActivityTracker for TestLogService
      // this.miroirContext.miroirActivityTracker.setTestAssertion(undefined);
    }
    return actionResult;
  }

  // // ##############################################################################################
  // private async handleCompositeRunBoxedExtractorOrQueryAction(
  //   currentAction: {
  //     actionType: "compositeRunBoxedQueryAction";
  //     actionLabel?: string | undefined;
  //     nameGivenToResult: string;
  //     query: RunBoxedQueryAction;
  //   },
  //   applicationDeploymentMap: ApplicationDeploymentMap,
  //   actionParamValues: Record<string, any>,
  //   // actionResult: Action2ReturnType | undefined,
  //   localContext: Record<string, any>,
  // ) {
  //   log.info(
  //     "handleCompositeAction runBoxedExtractorOrQueryAction to handle",
  //     currentAction,
  //     "with actionParamValues",
  //     actionParamValues,
  //   );

  //   const actionResult = await this.handleBoxedExtractorOrQueryAction(
  //     currentAction.query,
  //     applicationDeploymentMap,
  //   ); // TODO: pass the current model
  //   if (actionResult.status == "error" /* actionResult instanceof Action2Error */) {
  //     log.error(
  //       "Error on runBoxedExtractorOrQueryAction with nameGivenToResult",
  //       currentAction.nameGivenToResult,
  //       "query=",
  //       JSON.stringify(actionResult, null, 2),
  //     );
  //     return new Action2Error(
  //       "FailedToRunBoxedExtractorOrQueryAction",
  //       "handleCompositeRunBoxedExtractorOrQueryAction error: " +
  //         JSON.stringify(actionResult, null, 2),
  //       [currentAction.actionLabel ?? currentAction.actionType],
  //       actionResult as any,
  //     );
  //   } else {
  //     if ((actionResult as any).returnedDomainElement instanceof Domain2ElementFailed) {
  //       log.error(
  //         "Error on runBoxedExtractorOrQueryAction (Domain2ElementFailed) with nameGivenToResult",
  //         currentAction.nameGivenToResult,
  //         "query=",
  //         JSON.stringify(actionResult, null, 2),
  //       );
  //       return new Action2Error(
  //         "FailedToRunBoxedExtractorOrQueryAction",
  //         "handleCompositeRunBoxedExtractorOrQueryAction error: " +
  //           JSON.stringify(actionResult, null, 2),
  //         [currentAction.actionLabel ?? currentAction.actionType],
  //         actionResult as any,
  //       );
  //     } else {
  //       log.info(
  //         "handleCompositeAction runBoxedExtractorOrQueryAction adding result to context as",
  //         currentAction.nameGivenToResult,
  //         "value",
  //         JSON.stringify(actionResult, null, 2),
  //       );
  //       localContext[currentAction.nameGivenToResult] = (actionResult as any).returnedDomainElement;
  //     }
  //   }
  //   return actionResult;
  // }

  // ##############################################################################################
  private async handleCompositeRunBoxedQueryAction(
    currentAction: CompositeRunBoxedQueryAction,
    // {
    //   actionType: "compositeRunBoxedQueryAction";
    //   actionLabel?: string | undefined;
    //   nameGivenToResult: string;
    //   queryTemplate: RunBoxedQueryAction;
    // },
    applicationDeploymentMap: ApplicationDeploymentMap,
    localContext: Record<string, any>,
  ) {
    return this.miroirContext.miroirActivityTracker.trackAction(
      "compositeRunBoxedQueryAction",
      "DC.compositeRunBoxedQuery",
      () =>
        this.executeCompositeRunBoxedQueryAction(
          currentAction,
          applicationDeploymentMap,
          localContext,
        ),
      { phase: "query" },
    );
  }

  private async executeCompositeRunBoxedQueryAction(
    currentAction: CompositeRunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    localContext: Record<string, any>,
  ) {
    if (currentAction.payload == undefined) {
      throw new Error("handleCompositeAction currentAction.payload is undefined");
    }

    // actionResult = await this.handleQueryTemplateActionForServerONLY(
    const actionResult = await this.handleBoxedExtractorOrQueryAction(
      currentAction.payload,
      applicationDeploymentMap,
    ); // TODO: pass the current model
    if (actionResult instanceof Action2Error) {
      log.error(
        "Error (Action2Error) on handleCompositeRunBoxedQueryAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "payload=",
        JSON.stringify(actionResult, null, 2),
      );
      return actionResult;
    } else {
      if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error (Domain2ElementFailed) on handleCompositeRunBoxedQueryAction with nameGivenToResult",
          currentAction.nameGivenToResult,
          "payload=",
          JSON.stringify(actionResult, null, 2),
        );
        return actionResult;
      } else {
        log.info(
          "handleCompositeRunBoxedQueryAction adding result to context as",
          currentAction.nameGivenToResult,
        );
        log.debug(
          "handleCompositeRunBoxedQueryAction result value",
          currentAction.nameGivenToResult,
          actionResult,
        );
        localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
      }
    }
    return actionResult;
  }

  // // ##############################################################################################
  // private async handleCompositeRunBoxedExtractorTemplateAction(
  //   currentAction: {
  //     actionType: "compositeRunBoxedExtractorTemplateAction";
  //     actionLabel?: string | undefined;
  //     nameGivenToResult: string;
  //     queryTemplate: RunBoxedExtractorTemplateAction;
  //   },
  //   actionParamValues: Record<string, any>,
  //   // actionResult: Action2ReturnType | undefined,
  //   localContext: Record<string, any>
  // ) {
  //   log.info(
  //     "handleCompositeAction resolved extractorTemplate action",
  //     currentAction,
  //     "with actionParamValues",
  //     actionParamValues
  //   );

  //   const actionResult = await this.handleBoxedExtractorTemplateActionForServerONLY(
  //     currentAction.queryTemplate
  //   );
  //   if (actionResult instanceof Action2Error) {
  //     log.error(
  //       "Error on runBoxedQueryTemplateAction with nameGivenToResult",
  //       currentAction.nameGivenToResult,
  //       "query=",
  //       JSON.stringify(actionResult, null, 2)
  //     );
  //   } else {
  //     if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
  //       log.error(
  //         "Error on runBoxedQueryTemplateAction with nameGivenToResult",
  //         currentAction.nameGivenToResult,
  //         "query=",
  //         JSON.stringify(actionResult, null, 2)
  //       );
  //     } else {
  //       log.info(
  //         "handleCompositeActionTemplate extractorTemplate adding result to context as",
  //         currentAction.nameGivenToResult,
  //         "value",
  //         actionResult
  //       );
  //       localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
  //     }
  //   }
  //   return actionResult;
  // }

  // ##############################################################################################
  private async handleCompositeRunBoxedQueryTemplateAction(
    currentAction: CompositeRunBoxedQueryTemplateAction,
    // {
    //   actionType: "compositeRunBoxedQueryTemplateAction";
    //   actionLabel?: string | undefined;
    //   nameGivenToResult: string;
    //   queryTemplate: RunBoxedQueryTemplateAction;
    // },
    applicationDeploymentMap: ApplicationDeploymentMap,
    actionParamValues: Record<string, any>,
    // actionResult: Action2ReturnType | undefined,
    localContext: Record<string, any>
  ) {
    log.info(
      "handleCompositeRunBoxedQueryTemplateAction to handle",
      currentAction,
      "with actionParamValues",
      actionParamValues
    );

    const actionResult = await this.handleQueryTemplateActionForServerONLY(
      currentAction.payload,
      applicationDeploymentMap,
    );
    if (actionResult instanceof Action2Error) {
      log.error(
        "Error on handleCompositeRunBoxedQueryTemplateAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "query=",
        JSON.stringify(actionResult, null, 2)
      );
    } else {
      if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error on handleCompositeRunBoxedQueryTemplateAction with nameGivenToResult",
          currentAction.nameGivenToResult,
          "query=",
          JSON.stringify(actionResult, null, 2)
        );
      } else {
        log.info(
          "handleCompositeRunBoxedQueryTemplateAction adding result to context as",
          currentAction.nameGivenToResult,
          "value",
          actionResult
        );
        localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
      }
    }
    return actionResult;
  }

  // ##############################################################################################
  async handleCompositeActionTemplate(
    compositeActionSequence: CompositeActionTemplate,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
    actionContext: Record<string, any> = {},
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...templateEvaluationParams, ...actionParamValues };
    const actionLabel = (compositeActionSequence as any).actionLabel ?? "no action label";
    log.info(
      "handleCompositeActionTemplate called with compositeActionSequence",
      actionLabel,
      "compositeActionSequence",
      compositeActionSequence,
      "localActionParams",
      localActionParams,
      "actionContext",
      actionContext,
    );
    const resolved: TransformerReturnType<{
      resolvedCompositeActionDefinition: CompositeActionSequence;
      resolvedCompositeActionTemplates: Record<string, any>;
    }> = resolveCompositeActionTemplate(
      compositeActionSequence,
      modelEnvironment,
      localActionParams,
    ); // resolves templates with "runtime" step and action sequence with "build" step

    if (resolved instanceof TransformerFailure) {
      return new Action2Error(
        "FailedToResolveTemplate",
        "handleCompositeActionTemplate error resolving composite action template",
        [actionLabel],
        resolved as any, // TODO: TransformerFailure to Action2Error
        compositeActionSequence,
      );
    }

    log.info("handleCompositeActionTemplate resolved Templates", {
      actionLabel,
      localActionParams,
      resolved,
    });
    // log.info("handleCompositeActionTemplate", actionLabel, "localActionParams", localActionParams);
    log.info(
      "handleCompositeActionTemplate",
      actionLabel,
      "resolvedCompositeActionDefinition",
      resolved.resolvedCompositeActionDefinition
      // JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    );

    let localContext: Record<string, any> = {
      ...actionParamValues,
      ...actionContext,
      ...resolved.resolvedCompositeActionTemplates,
    };

    // TODO: replace with handleCompositeAction
    for (const currentAction of resolved.resolvedCompositeActionDefinition.payload.actionSequence) {
      log.info(
        "handleCompositeActionTemplate",
        actionLabel,
        "currentAction",
        currentAction.actionLabel,
        currentAction,
        "localContext keys",
        Object.keys(localContext),
        "localContext",
        localContext,
      );
      const resolvedActionTemplate: any = transformer_extended_apply(
        "runtime",
        [],
        currentAction.actionLabel ?? "NO NAME",
        currentAction as any as CoreTransformerForBuildPlusRuntime, // TODO: correct type
        "value",
        modelEnvironment,
        localActionParams,
        localContext,
      ) as InstanceAction;
      log.info(
        "handleCompositeActionTemplate compositeInstanceAction",
        currentAction.actionLabel ?? "without step name",
        "resolvedActionTemplate instanceof TransformerFailure",
        resolvedActionTemplate instanceof TransformerFailure,
        "resolved action Template",
        JSON.stringify(resolvedActionTemplate, null, 2),
      );
      if (resolvedActionTemplate instanceof TransformerFailure) {
        return new Action2Error(
          "FailedToResolveTemplate",
          "handleCompositeActionTemplate compositeInstanceAction error resolving action",
          [],
          resolvedActionTemplate as any,
          currentAction,
        );
      }
      switch (currentAction.actionType) {
        case "compositeRunBoxedQueryAction": {
          const actionResult = await this.handleCompositeRunBoxedQueryAction(
            resolvedActionTemplate,
            applicationDeploymentMap,
            localContext,
          );
          log.info(
            "handleCompositeActionTemplate",
            actionLabel,
            "handled compositeRunBoxedQueryAction",
            currentAction,
            "is error",
            actionResult instanceof Action2Error,
            "with actionParamValues",
            actionParamValues,
            "resulting context",
            localContext,
          );
          if (actionResult instanceof Action2Error) {
            return actionResult;
          }
          // return actionResult;
          break;
        }
        case 'compositeRunBoxedQueryTemplateAction': {
          const actionResult = await this.handleCompositeRunBoxedQueryTemplateAction(
            resolvedActionTemplate,
            applicationDeploymentMap,
            actionParamValues,
            localContext,
          );
          if (actionResult instanceof Action2Error) {
            return actionResult;
          }
          break
        }
        case "compositeRunTestAssertion": {
          log.error(
            "handleCompositeActionTemplate",
            actionLabel,
            "can not handle actionType",
            currentAction,
          );
          // throw new Error(
          //   "handleCompositeActionTemplate " +
          //     actionLabel +
          //     " unknown actionType: " +
          //     currentAction.actionType
          // );
          return new Action2Error(
            "FailedToHandleAction",
            "handleCompositeActionTemplate " +
              actionLabel +
              " can not handle actionType: " +
              currentAction.actionType,
            [currentAction.actionLabel ?? currentAction.actionType],
          );
          break;
        }
        // case "instanceAction":
        case "createInstance":
        case "deleteInstance":
        case "deleteInstanceWithCascade":
        case "updateInstance":
        case "loadNewInstancesInLocalCache":
        case "getInstance":
        case "getInstances":
        //
        case "undo":
        case "redo":
        case "initModel":
        case "commit":
        case "rollback":
        case "remoteLocalCacheRollback":
        case "resetModel":
        case "resetData":
        case "alterEntityAttribute":
        case "renameEntity":
        case "createEntity":
        case "dropEntity":
        case "freezeApplicationVersion":
        //
        case "transactionalInstanceAction":
        case "compositeActionSequence":
        case "storeManagementAction_createStore":
        case "storeManagementAction_deleteStore":
        case "storeManagementAction_resetAndInitApplicationDeployment":
        case "storeManagementAction_openStore":
        case "storeManagementAction_closeStore":
        //
        case "bundleAction": 
        default: {
          // case "domainAction": {
          // log.info(
          //   "handleCompositeActionTemplate compositeInstanceAction action to resolve",
          //   JSON.stringify(currentAction.domainAction, null, 2)
          // );
          const actionResult = await this.handleAction(
            resolvedActionTemplate,
            applicationDeploymentMap,
            modelEnvironment,
            undefined,
            localActionParams,
          );
          log.info(
            "handleCompositeActionTemplate",
            actionLabel,
            "received actionResult from compositeInstanceAction",
            currentAction,
            "actionResult",
            JSON.stringify(actionResult, null, 2),
          );
          if (actionResult instanceof Action2Error) {
            log.error(
              "handleCompositeActionTemplate compositeInstanceAction error on running action",
              JSON.stringify(currentAction, null, 2) +
                "actionResult" +
                JSON.stringify(actionResult, null, 2),
            );
            // throw new Error(
            //   "handleCompositeActionTemplate compositeInstanceAction error on action" +
            //     JSON.stringify(resolveCompositeActionTemplate, null, 2) +
            //     "actionResult" +
            //     JSON.stringify(actionResult, null, 2)
            // );
            return new Action2Error(
              "FailedToHandleAction",
              "handleCompositeActionTemplate compositeInstanceAction error",
              [
                currentAction.actionLabel ?? currentAction.actionType,
                ...(actionResult.errorStack ?? ([] as any)),
              ],
              actionResult,
            );
          }
          break;
        }
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // TESTS
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // TODO: not used, not tested!
  /**
   * TestCompositeActions shall allow access to both localCache and persistence store, unlike CompositeActions
   * which are limited to persistence store access. The target is that CompositeActoins have to be replayable!
   *
   * @param testAction
   * @param actionParamValues
   * @param currentModelEnvironment
   * @returns
   */
  async handleTestCompositeAction(
    // testAction: TestCompositeAction | TestBuildPlusRuntimeCompositeAction,
    testAction: TestCompositeAction | TestBuildPlusRuntimeCompositeAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.debug(
      "handleTestCompositeAction testAction",
      testAction,
      "localActionParams",
      localActionParams,
    );

    // log.info(
    //   "handleCompositeAction compositeInstanceAction resolvedCompositeActionDefinition",
    //   JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );
    this.miroirContext.miroirActivityTracker.setTest(testAction.testLabel);

    if (testAction.beforeTestSetupAction) {
      log.debug(
        "handleTestCompositeAction beforeAll",
        testAction.beforeTestSetupAction.actionLabel,
        testAction.beforeTestSetupAction,
      );
      const beforeAllResult = await this.handleCompositeAction(
        testAction.beforeTestSetupAction,
        applicationDeploymentMap,
        modelEnvironment,
        localActionParams,
      );
      if (beforeAllResult instanceof Action2Error) {
        log.error("Error on beforeTestSetupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.debug("handleTestCompositeAction no beforeTestSetupAction!");
    }

    switch (testAction.testType) {
      case "testCompositeAction": {
        const localCompositeAction: CompositeActionSequence = {
          ...testAction.compositeActionSequence,
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          payload: {
            actionSequence: [
              ...testAction.compositeActionSequence.payload.actionSequence,
              ...testAction.testCompositeActionAssertions,
            ],
          },
        };
        await this.handleCompositeAction(
          localCompositeAction,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
        break;
      }
      case "testBuildPlusRuntimeCompositeAction": {
        const localCompositeAction: CompositeActionSequenceTemplate = {
          ...testAction.compositeActionSequence,
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          payload: {
            // application: "IGNORED",
            actionSequence: [
              ...testAction.compositeActionSequence.payload.actionSequence,
              ...testAction.testCompositeActionAssertions,
            ] as any, // TODO: correct type
          },
        };
        await this.handleRuntimeCompositeActionDO_NOT_USE(
          localCompositeAction,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
        break;
      }
    }

    if (testAction.afterTestCleanupAction) {
      log.debug(
        "handleTestCompositeAction afterTestCleanupAction",
        testAction.afterTestCleanupAction.actionLabel,
        testAction.afterTestCleanupAction,
      );
      const beforeAllResult = await this.handleCompositeAction(
        testAction.afterTestCleanupAction,
        applicationDeploymentMap,
        modelEnvironment,
        localActionParams,
      );
      if (beforeAllResult instanceof Action2Error) {
        log.error("Error on afterTestCleanupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.debug("handleTestCompositeAction no afterTestCleanupAction!");
    }
    // TestSuiteContext.setTest(undefined);
    this.miroirContext.miroirActivityTracker.setTest(undefined);

    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleTestCompositeActionSuite(
    testApplication: Uuid,
    testAction: TestCompositeActionSuite | TestBuildPlusRuntimeCompositeActionSuite,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    // let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleTestCompositeActionSuite testAction",
      testAction,
      "localActionParams",
      Object.keys(localActionParams),
    );

    // const testSuiteResult: Record<string, TestResult> = {};

    try {
      // TestSuiteContext.setTestSuite(testAction.testLabel);
      this.miroirContext.miroirActivityTracker.setTestSuite(testAction.testLabel);

      if (testAction.beforeAll) {
        // LoggerGlobalContext.setTest("beforeAll");
        this.miroirContext.miroirActivityTracker.setTest(testAction.testLabel + ".beforeAll");
        // log.info(
        //   "handleTestCompositeActionSuite beforeAll",
        //   testAction.beforeAll.actionLabel,
        //   testAction.beforeAll
        // );
        const beforeAllResult = await this.handleCompositeAction(
          testAction.beforeAll,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
        if (beforeAllResult instanceof Action2Error) {
          log.error("Error on beforeAll", JSON.stringify(beforeAllResult, null, 2));
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          return new Action2Error(
            "FailedToSetupTest",
            "handleTestCompositeActionSuite beforeAll error: " +
              JSON.stringify(beforeAllResult.errorMessage, null, 2),
            beforeAllResult.errorStack,
            beforeAllResult,
          );
        }
        this.miroirContext.miroirActivityTracker.setTest(undefined);
        // LoggerGlobalContext.setTest(undefined);
      } else {
        log.info("handleTestCompositeActionSuite no beforeAll!");
      }

      // ##########################################################################################
      // testAction.testCompositeActions
      for (const testCompositeAction of Object.entries(testAction.testCompositeActions) as [
        string,
        (
          // TestCompositeAction | TestRuntimeCompositeAction | TestBuildPlusRuntimeCompositeAction
          TestCompositeAction | TestBuildPlusRuntimeCompositeAction
        ),
      ][]) {
        // expect.getState().currentTestName = testCompositeAction[0];
        log.info("handleTestCompositeActionSuite test", testCompositeAction[0], "beforeEach");

        if (testAction.beforeEach) {
          // log.info(
          //   "handleTestCompositeActionSuite beforeEach",
          //   testAction.beforeEach.actionLabel,
          //   testAction.beforeEach
          // );
          // LoggerGlobalContext.setTest(testCompositeAction[1].testLabel + ".beforeEach");
          this.miroirContext.miroirActivityTracker.setTest(
            testCompositeAction[1].testLabel + ".beforeEach",
          );
          const beforeEachResult = await this.handleCompositeAction(
            testAction.beforeEach,
            applicationDeploymentMap,
            modelEnvironment,
            localActionParams,
          );
          if (beforeEachResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on beforeEach",
              JSON.stringify(beforeEachResult, null, 2),
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite error: " +
                JSON.stringify(beforeEachResult.errorMessage, null, 2),
              beforeEachResult.errorStack,
              beforeEachResult,
            );
          }
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          // LoggerGlobalContext.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no beforeEach!");
        }

        const currentTestModelEnvironment = this.currentModelEnvironment(
          testApplication,
          applicationDeploymentMap,
        );

        log.info(
          "handleTestCompositeActionSuite testApplication",
          testApplication,
          "currentTestModelEnvironment",
          currentTestModelEnvironment,
          testCompositeAction,
        );
        // beforeTestSetupAction
        if (testCompositeAction[1].beforeTestSetupAction) {
          this.miroirContext.miroirActivityTracker.setTest(
            testCompositeAction[1].testLabel + ".beforeTestSetupAction",
          );
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "beforeTestSetupAction",
            testCompositeAction[1].beforeTestSetupAction.actionLabel,
            testCompositeAction[1].beforeTestSetupAction,
          );
          const beforeTestResult = await this.handleCompositeAction(
            testCompositeAction[1].beforeTestSetupAction,
            applicationDeploymentMap,
            currentTestModelEnvironment,
            localActionParams,
          );
          if (beforeTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on beforeTestSetupAction",
              JSON.stringify(beforeTestResult, null, 2),
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite beforeTest error",
              beforeTestResult.errorStack,
              beforeTestResult,
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no beforeTestSetupAction!",
          );
        }

        let testResult: Action2ReturnType | undefined = undefined;
        switch (testCompositeAction[1].testType) {
          case "testBuildPlusRuntimeCompositeAction": {
            const localTestCompositeAction: CompositeActionSequenceTemplate = {
              ...testCompositeAction[1].compositeActionSequence,
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                ...(testCompositeAction[1].compositeActionSequence.payload.templates
                  ? {
                      templates: {
                        ...testCompositeAction[1].compositeActionSequence.payload.templates,
                      },
                    }
                  : {}),
                actionSequence: [
                  ...testCompositeAction[1].compositeActionSequence.payload.actionSequence,
                  ...testCompositeAction[1].testCompositeActionAssertions,
                ] as any, // TODO: correct type
              },
            };
            // TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel);
            testResult = await this.miroirContext.miroirActivityTracker.trackTest(
              testCompositeAction[1].testLabel,
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              async () =>
                await this.handleBuildPlusRuntimeCompositeAction(
                  localTestCompositeAction,
                  applicationDeploymentMap,
                  currentTestModelEnvironment,
                  localActionParams,
                ),
            );
            break;
          }
          case "testCompositeAction": {
            const localTestCompositeAction: CompositeActionSequence = {
              ...testCompositeAction[1].compositeActionSequence,
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                // application: "IGNORED",
                actionSequence: [
                  ...testCompositeAction[1].compositeActionSequence.payload.actionSequence,
                  ...testCompositeAction[1].testCompositeActionAssertions,
                ],
              },
            };
            // TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel);
            testResult = await this.miroirContext.miroirActivityTracker.trackTest(
              testCompositeAction[1].testLabel,
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              async () =>
                await this.handleCompositeAction(
                  localTestCompositeAction,
                  applicationDeploymentMap,
                  currentTestModelEnvironment,
                  localActionParams,
                ),
            );
            break;
          }
        }
        if (testResult instanceof Action2Error) {
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          return new Action2Error(
            "FailedTestAction",
            "handleTestCompositeActionSuite error: ",
            [
              testCompositeAction[1].testLabel ?? testCompositeAction[1].testType,
              ...(testResult.errorStack ?? []),
            ],
            testResult,
          );
        } else {
          log.info(
            "handleTestCompositeActionSuite testResult",
            JSON.stringify(testResult, null, 2),
          );
        }
        // TestSuiteContext.setTest(undefined);
        this.miroirContext.miroirActivityTracker.setTest(undefined);

        if (testCompositeAction[1].afterTestCleanupAction) {
          // TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterTestCleanupAction");
          this.miroirContext.miroirActivityTracker.setTest(
            testCompositeAction[1].testLabel + ".afterTestCleanupAction",
          );
          log.info(
            "handleTestCompositeAction",
            testCompositeAction[0],
            "afterTestCleanupAction",
            testCompositeAction[1].afterTestCleanupAction.actionLabel,
            testCompositeAction[1].afterTestCleanupAction,
          );
          const afterTestResult = await this.handleCompositeAction(
            testCompositeAction[1].afterTestCleanupAction,
            applicationDeploymentMap,
            currentTestModelEnvironment,
            localActionParams,
          );
          if (afterTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeAction",
              testCompositeAction[0],
              "Error on afterTestCleanupAction",
              JSON.stringify(afterTestResult, null, 2),
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterTestCleanup error:",
              ["afterTestCleanupAction", ...(afterTestResult.errorStack ?? [])],
              afterTestResult,
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no afterTestSetupAction!",
          );
        }

        if (testAction.afterEach) {
          // TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterEach");
          this.miroirContext.miroirActivityTracker.setTest(
            testCompositeAction[1].testLabel + ".afterEach",
          );
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "afterEach",
            testAction.afterEach.actionLabel,
            testAction.beforeAll,
          );
          const beforeAllResult = await this.handleCompositeAction(
            testAction.afterEach,
            applicationDeploymentMap,
            modelEnvironment,
            localActionParams,
          );
          if (beforeAllResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on afterEach",
              JSON.stringify(beforeAllResult, null, 2),
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterEach error:",
              beforeAllResult.errorStack,
              beforeAllResult,
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no afterEach!");
        }
      } // end for testCompositeActions
      // ##########################################################################################

      if (testAction.afterAll) {
        // TestSuiteContext.setTest("afterAll");
        this.miroirContext.miroirActivityTracker.setTest("afterAll");
        log.info(
          "handleTestCompositeActionSuite afterAll",
          testAction.afterAll.actionLabel,
          testAction.beforeAll,
        );
        const afterAllResult = await this.handleCompositeAction(
          testAction.afterAll,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
        if (afterAllResult instanceof Action2Error) {
          log.error("Error on afterAll", JSON.stringify(afterAllResult, null, 2));
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          return new Action2Error(
            "FailedToTeardownTest",
            "handleTestCompositeActionSuite afterAll error:",
            afterAllResult.errorStack,
            afterAllResult,
          );
        }
        // TestSuiteContext.setTest(undefined);
        this.miroirContext.miroirActivityTracker.setTest(undefined);
      } else {
        log.info("handleTestCompositeActionSuite no afterAll!");
      }
      return Promise.resolve(ACTION_OK);
    } catch (error) {
      log.error("handleTestCompositeActionSuite caught error", error);
      return new Action2Error(
        "FailedToTeardownTest",
        "handleTestCompositeActionSuite caught error: " + JSON.stringify(error, null, 2),
      );
    } finally {
      // this.miroirContext.miroirActivityTracker.resetContext();
    }
  }

  // ##############################################################################################
  async handleTestCompositeActionTemplateSuite(
    testAction: TestCompositeActionTemplateSuite,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleTestCompositeActionTemplateSuite resolving testAction",
      testAction,
      "localActionParams",
      Object.keys(localActionParams),
    );

    const resolvedAction: {
      resolvedTestCompositeActionDefinition: TestCompositeActionSuite;
      resolvedCompositeActionTemplates: Record<string, any>;
    } = resolveTestCompositeActionTemplateSuite(testAction, modelEnvironment, localActionParams);

    const resolveErrors = Object.entries(
      resolvedAction.resolvedTestCompositeActionDefinition.testCompositeActions,
    ).filter(
      (e: [string, TestCompositeAction]) =>
        (e[1].compositeActionSequence.payload.actionSequence as any).queryFailure != undefined,
    );

    if (resolveErrors.length > 0) {
      log.error("handleTestCompositeActionTemplateSuite errors", resolveErrors);
      return new Action2Error(
        "FailedToResolveTemplate",
        "handleTestCompositeActionTemplateSuite resolveTestCompositeActionTemplateSuite errors for entries: ",
        [],
        undefined, // innerError,
        resolveErrors.map((e) => e[0]),
        // resolveErrors[0] as any,
      );
    }
    log.info(
      "handleTestCompositeActionTemplateSuite resolved testSuite template:",
      JSON.stringify(resolvedAction.resolvedTestCompositeActionDefinition),
    );

    const testSuiteResult: Record<string, TestResult> = {};

    return this.handleTestCompositeActionSuite(
      testAction.testApplication,
      resolvedAction.resolvedTestCompositeActionDefinition,
      applicationDeploymentMap,
      modelEnvironment,
      localActionParams,
    );
  }
} // class DomainController

// // ##############################################################################################
// // ##############################################################################################
// // ##############################################################################################
// // ##############################################################################################
// // ##############################################################################################
// // const TrackedDomainController: typeof DomainController = MiroirLoggerFactory.createTrackedClass<DomainController>(
// const TrackedDomainController: typeof DomainController = class extends DomainController {
//   private activityId: string | undefined;

//   constructor(...args: any[]) {
//     super(...args);
//     MiroirLoggerFactory.trackObject(this, "DomainController");
//   }  
// }

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

type AsyncHandlerFunction = (...props: any[]) => Promise<Action2VoidReturnType>
type AsyncHandlerClosure = () => Promise<Action2VoidReturnType>

/**
 * actionType -> actionName -> handler
 * in the end, shall be:
 * actionType -> actionName -> {compositeActionSequence, compositeActionParams}
 * also, the allowed actionNames shall be different for each actionType, depending on the actionType
 */
// export type ActionHandler= Record<string, Record<string, (domainAction: DomainAction, currentModel?: MetaModel) => Promise<Action2VoidReturnType>>>;
export type ActionHandlerKind = "local" | "remote" | "*";
export type ActionHandler = Record<string, Record<string, { [K in ActionHandlerKind]?: any }>>;

