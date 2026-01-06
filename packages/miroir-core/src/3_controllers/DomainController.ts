
import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
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


const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");
const adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
// const instanceConfigurationReference = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
const entityEntity = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
const entitySelfApplicationVersion = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');
const adminSelfApplication = require("../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json"); //assert { type: "json" };
const adminConfigurationDeploymentAdmin = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json"); //assert { type: "json" };

const selfApplicationLibrary = require("../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json");
const selfApplicationDeploymentLibrary = require("../assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json");

import {
  ApplicationSection,
  ApplicationVersion,
  BuildPlusRuntimeCompositeAction,
  CompositeActionSequence,
  CompositeActionTemplate,
  DomainAction,
  EntityInstance,
  InstanceAction,
  MetaModel,
  ModelAction,
  RestPersistenceAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  // RuntimeCompositeAction,
  SelfApplicationDeploymentConfiguration,
  TestAssertion,
  TestBuildPlusRuntimeCompositeAction,
  TestBuildPlusRuntimeCompositeActionSuite,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplateSuite,
  TestResult,
  // TestRuntimeCompositeAction,
  // TestRuntimeCompositeActionSuite,
  TransactionalInstanceAction,
  // TransformerForRuntime,
  UndoRedoAction,
  type EndpointDefinition,
  type TransformerForBuildPlusRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { ACTION_OK } from "../1_core/constants";
import { defaultMiroirMetaModel, defaultMiroirModelEnvironment, metaModelEntities, miroirModelEntities } from "../1_core/Model";
import { resolveCompositeActionTemplate } from "../2_domain/ResolveCompositeActionTemplate";
import { transformer_extended_apply, transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime.js";
import { LoggerGlobalContext } from '../4_services/LoggerContext.js';
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { packageName } from "../constants";

// const selfApplicationMiroir = require('../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json');
const selfApplicationMiroir = require('../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
const selfApplicationDeploymentMiroir = require('../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json');
const selfApplicationModelBranchMiroirMasterBranch = require('../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json');
const selfApplicationVersionInitialMiroirVersion = require('../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json');
const selfApplicationStoreBasedConfigurationMiroir = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/21840247-b5b1-4344-baec-f818f4797d92.json');

import { resolvePathOnObject } from "../tools";
import { cleanLevel } from "./constants";
import { Endpoint, libraryEndpointUuid } from "./Endpoint";
import { CallUtils } from "./ErrorHandling/CallUtils";
// import { TestSuiteContext } from '../4_services/TestSuiteContext.js';
import {
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  Domain2ElementFailed,
  TransformerFailure,
  type TransformerReturnType
} from "../0_interfaces/2_domain/DomainElement.js";
import { defaultSelfApplicationDeploymentMap, type ApplicationDeploymentMap } from '../1_core/Deployment.js';
import { resolveTestCompositeActionTemplateSuite } from '../2_domain/TestSuiteTemplate.js';
import {
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  removeUndefinedProperties,
  unNullify,
} from "../4_services/otherTools.js";
import { ConfigurationService } from './ConfigurationService.js';

// const defaultSelfApplicationDeploymentMap: Record<Uuid, Uuid> = {
//   [selfApplicationMiroir.uuid]: adminConfigurationDeploymentMiroir.uuid,
//   [adminSelfApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
//   [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
// };

const autocommit = true;
// const autocommit = false;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainController"), "action"
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface DeploymentConfiguration {
  adminConfigurationDeployment: EntityInstance,
  selfApplicationDeployment: SelfApplicationDeploymentConfiguration,
}

// ################################################################################################
export async function resetAndInitApplicationDeployment(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  selfAdminConfigurationDeployments: SelfApplicationDeploymentConfiguration[], // TODO: use Deployment Entity Type!
) {
  // const deployments = [adminConfigurationDeploymentLibrary, adminConfigurationDeploymentMiroir];

  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction(
      {
        actionType: "resetModel",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: adminSelfApplication.uuid,
          deploymentUuid: selfAdminConfigurationDeployment.uuid,
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
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: adminSelfApplication.uuid,
          deploymentUuid: selfAdminConfigurationDeployment.uuid,
          params: {
            dataStoreType:
              selfAdminConfigurationDeployment.uuid == adminConfigurationDeploymentMiroir.uuid
                ? "miroir"
                : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
            metaModel: defaultMiroirMetaModel,
            // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
            selfApplication: selfApplicationMiroir,
            // selfApplicationDeploymentConfiguration: selfAdminConfigurationDeployment,
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
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: d.selfApplication,
          deploymentUuid: d.uuid,
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
    private endpoint: Endpoint
  ) {
    // this.callUtil = new CallUtils(miroirContext.errorLogService, persistenceStoreLocalOrRemote);
    this.callUtil = new CallUtils(persistenceStoreLocalOrRemote);
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
  currentModel(application: Uuid, applicationDeploymentMap: ApplicationDeploymentMap, deploymentUuid: Uuid): MetaModel {
    return this.localCache.currentModel(application, applicationDeploymentMap, deploymentUuid);
  }

  // ##############################################################################################
  currentModelEnvironment(application: Uuid, applicationDeploymentMap: ApplicationDeploymentMap, deploymentUuid: Uuid): MiroirModelEnvironment {
    return this.localCache.currentModelEnvironment(application, applicationDeploymentMap, deploymentUuid);
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
    currentModelEnvironment: MiroirModelEnvironment
  ): Promise<Action2VoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainUndoRedoAction start actionType",
      undoRedoAction.actionType,
      "deployment",
      deploymentUuid,
      "action",
      undoRedoAction
    );
    try {
      switch (undoRedoAction.actionType) {
        case "undo":
        case "redo": {
          this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            undoRedoAction
          );

          break;
        }
        default: {
          log.warn(
            "DomainController handleDomainUndoRedoAction cannot handle action name for",
            undoRedoAction
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
        error
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
    application: Uuid,
    adminDeploymentUuid: string,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2VoidReturnType> {
    log.info(
      "DomainController loadConfigurationFromPersistenceStore called for",
      "application",
      application,
      "deployment",
      adminDeploymentUuid,
      "applicationDeploymentMap",
      applicationDeploymentMap
    );
    try {
      const result = await this.callUtil
        .callPersistenceAction(
          {}, // context
          {
            addResultToContextAsName: "dataEntitiesFromModelSection",
            expectedDomainElementType: "entityInstanceCollection",
          }, // continuation
          applicationDeploymentMap,
          {
            actionType: "RestPersistenceAction_read",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
            payload: {
              application,
              deploymentUuid: adminDeploymentUuid,
              section: "model",
              parentName: entityEntity.name,
              parentUuid: entityEntity.uuid,
            },
          }
        )
        .then(async (context) => {
          if (context instanceof Action2Error) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application" + 
              application +
              "deployment" +
              adminDeploymentUuid +
              "could not fetch entity instance list " +
                JSON.stringify(context, undefined, 2)
            );
          }

          log.info(
            "DomainController loadConfigurationFromPersistenceStore fetched list of Entities for",
            "application",
            application,
            "deployment",
            adminDeploymentUuid,
            "found data entities from Model Section dataEntitiesFromModelSection",
            context.dataEntitiesFromModelSection
          );

          if (
            !context.dataEntitiesFromModelSection ||
            context.dataEntitiesFromModelSection instanceof Action2Error
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application" +
              application +
              "deployment" +
              adminDeploymentUuid +
              " could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
            );
          }

          if (
            !context.dataEntitiesFromModelSection.returnedDomainElement ||
            context.dataEntitiesFromModelSection.returnedDomainElement instanceof
              Domain2ElementFailed
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore application" +
              application +
              "deployment" +
              adminDeploymentUuid +
              " could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
            );
          }

          // TODO: information has to come from localCacheSlice, not from hard-coded source!
          const modelEntitiesToFetch: MetaEntity[] =
            adminDeploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? miroirModelEntities
              : metaModelEntities;
          const dataEntitiesToFetch: MetaEntity[] =
            adminDeploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? (
                  context.dataEntitiesFromModelSection.returnedDomainElement?.instances ?? []
                ).filter(
                  (dataEntity: EntityInstance) =>
                    modelEntitiesToFetch.filter(
                      (modelEntity) => dataEntity.uuid == modelEntity.uuid
                    ).length == 0
                )
              : context.dataEntitiesFromModelSection.returnedDomainElement?.instances ?? []; // hack, hack, hack

          log.info(
            "DomainController loadConfigurationFromPersistenceStore for",
            "application",
            application,
            "deployment",
            adminDeploymentUuid,
            "found data entities to fetch",
            dataEntitiesToFetch.map((e) => e.name),
            "model entities to fetch",
            modelEntitiesToFetch.map((e) => e.name)
          );

          const toFetchEntities: { section: ApplicationSection; entity: MetaEntity }[] = [
            ...modelEntitiesToFetch.map((e) => ({
              section: "model" as ApplicationSection,
              entity: e,
            })),
            ...dataEntitiesToFetch.map((e) => ({
              section: "data" as ApplicationSection,
              entity: e as MetaEntity,
            })),
          ];
          log.debug(
            "DomainController loadConfigurationFromPersistenceStore for",
            "application", application,
            "deployment",
            adminDeploymentUuid,
            "found entities to fetch",
            toFetchEntities.map((e) => ({
              section: e.section,
              name: e.entity.name,
              uuid: e.entity.uuid,
            }))
          );

          // Batch all persistence operations for React 18 automatic batching
          const fetchPromises = toFetchEntities
          // .slice(1)
          .map((e) => {
            log.info(
              "DomainController loadConfigurationFromPersistenceStore",
              "application", application,
              "deployment",
              adminDeploymentUuid,
              "fetching instances from server for entity",
              JSON.stringify(e, undefined, 2)
            );
            return this.callUtil
              .callPersistenceAction(
                {}, // context
                {
                  addResultToContextAsName: "entityInstanceCollection",
                  expectedDomainElementType: "entityInstanceCollection",
                }, // continuation
                applicationDeploymentMap,
                {
                  actionType: "RestPersistenceAction_read",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                  payload: {
                    application,
                    deploymentUuid: adminDeploymentUuid,
                    section: e.section,
                    parentName: e.entity.name,
                    parentUuid: e.entity.uuid,
                  },
                }
              )
              .then((context: Record<string, any> | Action2Error) => {
                log.info(
                  "DomainController loadConfigurationFromPersistenceStore fetched instances for section",
                  e.section,
                  "entity",
                  e.entity.name,
                  context instanceof Action2Error,
                  context instanceof Action2Error ? "failed" : "succeeded",
                  "input", context
                );
                if (context instanceof Action2Error) {
                  return context;
                } else {
                  return context["entityInstanceCollection"].returnedDomainElement;
                }
              })
              .catch((reason) => {
                log.error(
                  "DomainController loadConfigurationFromPersistenceStore failed to fetch entity instances for entity ",
                  e.entity.name,
                  "application",
                  application,
                  "deployment",
                  adminDeploymentUuid,
                  reason
                );
                return new Action2Error(
                  "FailedToHandleAction",
                  "DomainController loadConfigurationFromPersistenceStore application" +
                  application + 
                  "deployment" +
                  adminDeploymentUuid +
                  " failed to fetch entity instances for " +
                  e.entity.name +
                  " reason: " +
                  reason
                );
                // throw reason;
              });
          });

          // Wait for all fetch operations to complete
          const allInstances = await Promise.all(fetchPromises);

          const errors = allInstances.filter(
            (result) => result instanceof Action2Error
          );
          log.info(
            "DomainController loadConfigurationFromPersistenceStore fetched all instances for",
            "application", application,
            "deployment",
            adminDeploymentUuid,
            "allInstances",
            allInstances,
            "errors", errors
          );
          if (errors.length > 0) {
            return Promise.resolve(new Action2Error(
              "FailedToLoadNewInstancesInLocalCache",
              "DomainController loadConfigurationFromPersistenceStore application" +
              application +
              "deployment" +
              adminDeploymentUuid +
              " failed to load new instances in local cache: " +
              errors.map((e) => JSON.stringify(e, undefined, 2)).join(", ")
            ));
          }
          // Batch all local cache updates in a single operation to leverage React 18's automatic batching
          if (allInstances.length > 0) {
            await this.callUtil.callLocalCacheAction(
              context, // context
              {}, // continuation
              applicationDeploymentMap,
              {
                actionType: "loadNewInstancesInLocalCache",
                application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  application,
                  deploymentUuid: adminDeploymentUuid,
                  objects: allInstances,
                },
              }
            );
          }

          // removes current transaction
          await this.callUtil.callLocalCacheAction(
            context, // context
            {}, // continuation
            applicationDeploymentMap,
            {
              actionType: "rollback",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              payload: {
                application,
                deploymentUuid: adminDeploymentUuid,
              },
            }
          );

          log.info(
            "DomainController loadConfigurationFromPersistenceStore done rollback, currentTransaction=",
            this.currentTransaction()
          );

          log.debug(
            "DomainController loadConfigurationFromPersistenceStore",
            "application", application,
            "deployment",
            adminDeploymentUuid,
            "all instances stored!",
            toFetchEntities.map((e) => ({ section: e.section, uuid: e.entity.uuid }))
            // JSON.stringify(this.localCache.getState(), circularReplacer())
          );
          return context;
        });
      if (result instanceof Action2Error) {
        return result;
      } else {
        log.info(
          "DomainController loadConfigurationFromPersistenceStore completed successfully for",
          "application", application,
          "deployment",
          adminDeploymentUuid, result
        );
        return Promise.resolve(ACTION_OK);
      }
      
    } catch (error) {
      log.warn("DomainController loadConfigurationFromPersistenceStore caught error:", error);
      // throw error;
      return new Action2Error(
        "FailedToLoadNewInstancesInLocalCache",
        "DomainController loadConfigurationFromPersistenceStore caught error: " + error
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
    runBoxedExtractorOrQueryAction: RunBoxedQueryAction | RunBoxedExtractorOrQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment,
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    try {
      LoggerGlobalContext.setAction(runBoxedExtractorOrQueryAction.actionType);
      // Also set in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(runBoxedExtractorOrQueryAction.actionType);
      log.info(
        "handleBoxedExtractorOrQueryAction",
        // "deploymentUuid",
        "persistenceStoreAccessMode=",
        this.persistenceStoreAccessMode,
        "actionType=",
        (runBoxedExtractorOrQueryAction as any).actionType,
        "actionType=",
        runBoxedExtractorOrQueryAction?.actionType,
        "queryExecutionStrategy=",
        runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy,
        "objects=",
        JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2)
      );
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
        log.info(
          "DomainController handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
          result
        );
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
        const executionStrategy =
          // runBoxedExtractorOrQueryAction.queryExecutionStrategy ?? "localCacheOrFail";
          runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy ?? "storage";
        switch (executionStrategy) {
          case "ServerCache":
          case "localCacheOrFetch": {
            throw new Error(
              "DomainController handleBoxedExtractorOrQueryAction could not handle queryExecutionStrategy " +
                runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy
            );
          }
          case "localCacheOrFail": {
            const result =
              await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalCache(
                runBoxedExtractorOrQueryAction,
                applicationDeploymentMap,
              );
            log.info(
              "handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
              result
            );
            return result;
          }
          case "storage": {
            const result =
              await this.persistenceStoreLocalOrRemote.handlePersistenceActionForRemoteStore(
                runBoxedExtractorOrQueryAction,
                applicationDeploymentMap,
              );
            log.info(
              "handleBoxedExtractorOrQueryAction runBoxedExtractorOrQueryAction callPersistenceAction Result=",
              result
            );
            return result;
            // break;
          }
          default: {
            throw new Error(
              "DomainController handleBoxedExtractorOrQueryAction unknown queryExecutionStrategy " +
                runBoxedExtractorOrQueryAction.payload.queryExecutionStrategy
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
        JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2)
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
      JSON.stringify((runBoxedQueryTemplateAction as any)["objects"], null, 2)
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
      log.info(
        "DomainController handleQueryTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
      return result;
    } else {
      // we're on the client, the query is sent to the server for execution.
      // is it right? We're limiting querying for script execution to remote queries right there!
      // principle: the scripts using transactional (thus Model) actions are limited to localCache access
      // while non-transactional accesses are limited to persistence store access (does this make sense?)
      // in both cases this enforces only the most up-to-date data is accessed.
      log.info(
        "DomainController handleQueryTemplateActionForServerONLY sending query to server for execution",
        // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
        runBoxedQueryTemplateAction
      );
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        applicationDeploymentMap,
        runBoxedQueryTemplateAction
      );
      log.info("handleQueryTemplateActionForServerONLY callPersistenceAction Result=", result);
      if (result instanceof Action2Error) {
        return result;
      }
      return result["dataEntitiesFromModelSection"];
    }

    return ACTION_OK;
  }

  // ##############################################################################################
  // called only in server.ts to handle queries on the server side
  // used in RootComponent to fetch data from the server
  // used in Importer.tsx
  // used in scripts.ts
  // used in tests
  async handleBoxedExtractorTemplateActionForServerONLY(
    runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleBoxedExtractorTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedQueryTemplateOrBoxedExtractorTemplateAction.deploymentUuid,
      "actionType",
      (runBoxedExtractorTemplateAction as any).actionType,
      "actionType",
      runBoxedExtractorTemplateAction?.actionType,
      "objects",
      JSON.stringify((runBoxedExtractorTemplateAction as any)["objects"], null, 2)
    );

    // if (this.persistenceStoreAccessMode == "remote") {
    if (this.persistenceStoreAccessMode == "local") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: Action2ReturnType =
        await this.persistenceStoreLocalOrRemote.handlePersistenceAction(
          runBoxedExtractorTemplateAction,
          applicationDeploymentMap,
        );
      log.info(
        "DomainController handleBoxedExtractorTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
      return result;
    } else {
      // we're on the client, the query is sent to the server for execution.
      // is it right? We're limiting querying for script execution to remote queries right there!
      // principle: the scripts using transactional (thus Model) actions are limited to localCache access
      // while non-transactional accesses are limited to persistence store access (does this make sense?)
      // in both cases this enforces only the most up-to-date data is accessed.
      log.info(
        "DomainController handleBoxedExtractorTemplateActionForServerONLY sending query to server for execution",
        // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
        runBoxedExtractorTemplateAction
      );
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        applicationDeploymentMap,
        runBoxedExtractorTemplateAction
      );
      log.info(
        "handleBoxedExtractorTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
      if (result instanceof Action2Error) {
        return result;
      }

      return result["dataEntitiesFromModelSection"];
    }

    return ACTION_OK;
  }

  // ##############################################################################################
  // called only in server.ts to handle queries on the server side
  // used in RootComponent to fetch data from the server
  // used in Importer.tsx
  // used in scripts.ts
  // used in tests
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedQueryTemplateOrBoxedExtractorTemplateAction.deploymentUuid,
      "persistenceStoreAccessMode=",
      this.persistenceStoreAccessMode,
      "actionType",
      (runBoxedQueryTemplateOrBoxedExtractorTemplateAction as any).actionType,
      "actionType",
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction?.actionType,
      "objects",
      JSON.stringify(
        (runBoxedQueryTemplateOrBoxedExtractorTemplateAction as any).payload.objects,
        null,
        2
      )
    );

    if (this.persistenceStoreAccessMode == "local") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: Action2ReturnType =
        await this.persistenceStoreLocalOrRemote.handlePersistenceAction(
          runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
          applicationDeploymentMap,
        );
      log.info(
        "DomainController handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
      return result;
    } else {
      // we're on the client, the query is sent to the server for execution.
      // is it right? We're limiting querying for script execution to remote queries right there!
      // principle: the scripts using transactional (thus Model) actions are limited to localCache access
      // while non-transactional accesses are limited to persistence store access (does this make sense?)
      // in both cases this enforces only the most up-to-date data is accessed.
      log.info(
        "DomainController handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY sending query to server for execution",
        // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction
      );
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        applicationDeploymentMap,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction
      );
      log.info(
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
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
    // deploymentUuid: Uuid,
    instanceAction: InstanceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType> {
    const deploymentUuid = applicationDeploymentMap[instanceAction.payload.application];

    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleInstanceAction application",
      instanceAction.payload.application,
      "deployment",
      deploymentUuid,
      "start",
      "instanceAction",
      instanceAction
    );

    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    // The same action is performed on the local cache and on the remote store for Data Instances.
    const handleActionResult = await this.callUtil.callPersistenceAction(
      {}, // context
      {}, // continuation
      applicationDeploymentMap,
      instanceAction,
    );
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
      deploymentUuid,
      "handleInstanceAction done calling handleRemoteStoreRestCRUDAction",
      instanceAction,
      "result is error",
      handleActionResult instanceof Action2Error,
      "handleActionResult",
      handleActionResult
    );
    if (handleActionResult instanceof Action2Error) {
      log.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
        deploymentUuid,
        "handleInstanceAction error calling handleRemoteStoreRestCRUDAction",
        instanceAction,
        handleActionResult
      );
      return Promise.resolve(handleActionResult);
    }
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
      deploymentUuid,
      "handleInstanceAction done calling handleRemoteStoreRestCRUDAction",
      instanceAction
    );
    const result = await this.callUtil.callLocalCacheAction(
      {}, // context
      {}, // continuation
      applicationDeploymentMap,
      instanceAction
    );

    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
      deploymentUuid,
      "handleInstanceAction end",
      instanceAction,
      "result",
      result
    );
    return Promise.resolve(ACTION_OK);
    // return Promise.resolve(result);
  }

  // ##############################################################################################
  // converts a Domain model action into a set of local cache actions and remote store actions
  async handleModelAction(
    // deploymentUuid: Uuid,
    modelAction: ModelAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment: MiroirModelEnvironment
  ): Promise<Action2VoidReturnType> {
    const deploymentUuid =
      modelAction.payload.deploymentUuid ??
      applicationDeploymentMap[modelAction.payload.application];
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction START actionType=",
      modelAction["actionType"],
      "deployment",
      modelAction.payload["deploymentUuid"],
      "action",
      modelAction.actionType != "initModel" ? JSON.stringify(modelAction, null, 2) : modelAction
      // modelAction,
    );
    try {
      switch (modelAction.actionType) {
        case "remoteLocalCacheRollback": {
          if (this.persistenceStoreAccessMode == "local") {
            // if the domain controller is deployed on the server, we refresh the local cache from the remote store
            log.info(
              "handleModelAction reloading current configuration from local PersistenceStore!"
            );
            const result = await this.loadConfigurationFromPersistenceStore(
              modelAction.payload.application,
              deploymentUuid,
              applicationDeploymentMap
            );
            log.info(
              "handleModelAction reloading current configuration from local PersistenceStore DONE!", result
            );
            return Promise.resolve(result);
          } else {
            // if the domain controller is deployed on the client, we send the "remoteLocalCacheRollback" action to the server
            await this.callUtil.callPersistenceAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              modelAction
            );
          }
          break;
        }
        case "rollback": {
          const result = await this.loadConfigurationFromPersistenceStore(
            modelAction.payload.application,
            deploymentUuid,
            applicationDeploymentMap
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
              modelAction
            );
            if (result instanceof Action2Error) {
              return new Action2Error(
                "FailedToHandleAction",
                "handleModelAction non-transactional action failed",
                [],
                result
              );
            }
            log.info("handleModelAction running for non-transactional action DONE!");
          }

          const result = await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction
          );
          if (result instanceof Action2Error) {
            return new Action2Error(
              "FailedToHandleAction",
              "handleModelAction localCache action failed",
              [],
              result
            );
          }
          break;
        }
        case "resetModel":
        case "resetData":
        case "initModel": {
          await this.callUtil.callPersistenceAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            modelAction
          );
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
            return Promise.resolve(new Action2Error(
              "FailedToHandleAction",
              "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions.",
              [],
              undefined,
              { domainAction: modelAction }
            ));
          }
          const currentTransactions = this.localCache.currentTransaction();
          if (currentTransactions.length == 0) {
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit no current transaction to commit"
            );
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
              currentTransactions
            );
          }
          const filteredDeployments = currentTransactions.length > 1 ?
            // currentTransactions.filter((tx) => tx.payload.deploymentUuid != modelAction.payload.deploymentUuid) : [];
            currentTransactions.filter((tx) => tx.payload.application != modelAction.payload.application) : [];
          if (filteredDeployments.length > 0) {
            log.warn(
              "commit operation deploymentUuid mismatch among current transactions.",
              "application:",
              currentApplication,
              "Committing for deploymentUuid:",
              currentDeploymentUuid,
              "Ignoring transactions for other deployments:",
              filteredDeployments
            );
          }
          
          const sectionOfapplicationEntities: ApplicationSection =
            currentDeploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model";
          const newModelVersionUuid = uuidv4();
          // TODO: this seems to be taken from the Admin Model Version
          // in the application, only the selfApplication could be used
          const newModelVersion: ApplicationVersion = {
            uuid: newModelVersionUuid,
            // conceptLevel: "Data",
            parentName: entitySelfApplicationVersion.name,
            parentUuid: entitySelfApplicationVersion.uuid,
            description: "TODO: no description yet",
            name: "TODO: No label was given to this version.",
            previousVersion: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa", // TODO: how to get the previous version? The current version shall be found somewhere in the schema
            branch: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa", // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
            selfApplication: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa", // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
            // adminApplication: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa", // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
          };

          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit create new version",
            newModelVersion
          );
          const newModelVersionAction: RestPersistenceAction = {
            actionType: "RestPersistenceAction_create",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
            payload: {
              application: currentApplication,
              deploymentUuid: currentDeploymentUuid,
              section: sectionOfapplicationEntities,
              parentName: entitySelfApplicationVersion.name ?? "Self Application",
              parentUuid: entitySelfApplicationVersion.uuid,
              objects: [newModelVersion],
              // objects: [{
              //   parentUuid: entitySelfApplicationVersion.uuid,
              //   instances: [newModelVersion]
              // }],
            },
          };

          // in the case of the Miroir app, this should be done in the 'data' section
          const newModelVersionActionResult = await this.callUtil.callPersistenceAction(
            {}, // context
            {}, // continuation
            applicationDeploymentMap,
            newModelVersionAction
          );
          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit persistenceActionResult for new version",
            newModelVersionActionResult,
            "newModelVersionActionResult instanceof Action2Error",
            newModelVersionActionResult instanceof Action2Error
          );
          if (newModelVersionActionResult instanceof Action2Error) {
            return Promise.resolve(new Action2Error(
              "FailedToHandleAction",
              "handleModelAction commit create new model version failed",
              [],
              newModelVersionActionResult
            ));
          }

          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replaying currentTransaction",
            JSON.stringify(
              this.localCache.currentTransaction(),
              null,
              2
            )
          );
          for (const replayAction of this.localCache.currentTransaction()) {
            // const localReplayAction: LocalCacheTransactionalInstanceActionWithDeployment | ModelAction = replayAction;
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction",
              replayAction
            );
            switch (replayAction.actionType) {
              case "transactionalInstanceAction": {
                // const localReplayAction: LocalCacheTransactionalInstanceActionWithDeployment = replayAction;
                //  log.warn("handleModelAction commit ignored transactional action" + replayAction)
                const replayActionType = replayAction.payload.instanceAction.actionType.toString();
                const newActionType = replayActionType.includes('_')
                  // ? replayActionType.slice(replayActionType.lastIndexOf('_') + 1)
                  ? replayActionType.slice(replayActionType.lastIndexOf('_') + 1)
                  : replayActionType;
                log.info(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction transactionalInstanceAction",
                  "derived newActionType",
                  newActionType
                );
                const replayActionResult = await this.callUtil.callPersistenceAction(
                  {}, // context
                  {}, // continuation
                  applicationDeploymentMap,
                  {
                    actionType: newActionType,
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                    payload: {
                      // deploymentUuid: replayAction.payload.instanceAction.payload.deploymentUuid,
                      application: replayAction.payload.instanceAction.payload.application,
                      section:
                        replayAction.payload.instanceAction.payload.applicationSection ?? "data",
                      parentName: replayAction.payload.instanceAction.payload.objects[0].parentName,
                      parentUuid: replayAction.payload.instanceAction.payload.objects[0].parentUuid,
                      // objects: replayAction.payload.instanceAction.payload.objects[0].instances,
                      objects: replayAction.payload.instanceAction.payload.objects,
                    },
                  } as any
                );
                if (replayActionResult instanceof Action2Error) {
                  log.warn(
                    "DomainController handleModelAction commit replayAction transactionalInstanceAction failed",
                    replayActionResult
                  );
                  return replayActionResult;
                }
                break;
              }
              // case "modelAction": 
              case 'alterEntityAttribute':
              case 'createEntity':
              case 'dropEntity':
              case 'renameEntity': {
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
                  }
                );
                if (replayActionResult instanceof Action2Error) {
                  log.warn(
                    "DomainController handleModelAction commit replayAction transactionalInstanceAction failed",
                    replayActionResult
                  );
                  return replayActionResult;
                }
                break;
              }
              default:
                throw new Error(
                  "DomainController handleModelAction commit could not handle replay action:" +
                    JSON.stringify(replayAction)
                );
                break;
            }
          }

          log.debug(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed, currentTransaction:",
            this.localCache.currentTransaction()
          );

          await this.callUtil
            .callLocalCacheAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              {
                actionType: "commit",
                application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: currentApplication,
                  deploymentUuid: currentDeploymentUuid,
                },
              }
            )
            .then((context) => {
              log.debug(
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed and notified to local cache, currentTransaction:",
                this.localCache.currentTransaction()
              );
              return this.callUtil.callLocalCacheAction(
                {}, // context
                {}, // continuation
                applicationDeploymentMap,
                {
                  actionType: "createInstance",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: currentApplication,
                    deploymentUuid: currentDeploymentUuid,
                    applicationSection: "model",
                    parentUuid: newModelVersion.parentUuid,
                    objects: [
                      {
                        parentUuid: newModelVersion.parentUuid,
                        applicationSection: sectionOfapplicationEntities,
                        instances: [newModelVersion],
                      },
                    ],
                  }
                }
              );
            })
          ;
          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done!"
          );
          
          log.info(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done, end of handleModelAction!"
          );
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
        "deployment",
        deploymentUuid,
        "action",
        modelAction,
        "error instanceof Action2Error=",
        error instanceof Action2Error,
        "exception",
        error
      );
      if (error instanceof Action2Error) {
        return error;
      }
      return new Action2Error(
        "FailedToHandleAction",
        "DomainController handleModelAction caught error:" + (error instanceof Error ? error.message : "Action2Error"),
        [],
        error as any
      );
    }
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction DONE actionType=",
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
    currentModelEnvironment?: MiroirModelEnvironment
  ): Promise<Action2VoidReturnType> {
    return this.miroirContext.miroirActivityTracker.trackAction(
      domainAction.actionType,
      (domainAction as any).actionLabel,
      (async () => {
        log.info(
          "handleActionFromUI running for action type",
          domainAction.actionType,
          // "on deployment",
          "autocommit=",
          autocommit,
          "domainAction",
          domainAction
        );
        if (autocommit) {
          return this.handleActionInternal(domainAction, applicationDeploymentMap, currentModelEnvironment).then(
            async (result: Action2ReturnType) => {
              const deploymentUuid =
                domainAction.payload.deploymentUuid ??
                applicationDeploymentMap[domainAction.payload.application];
              if (result instanceof Action2Error) {
                log.error(
                  "handleActionFromUI not autocommitting due to error result for action",
                  domainAction.actionType,
                  "application",
                  domainAction.payload.application,
                  "deployment",
                  deploymentUuid,
                  "domainAction",
                  domainAction,
                  "result",
                  result
                );
                return result;
              } else {
                log.info(
                  "handleActionFromUI autocommitting (if necessary) for action",
                  domainAction.actionType,
                  "domainAction",
                  domainAction,
                  "result instance of Action2Error",
                  result instanceof Action2Error,
                  "result",
                  result
                );
              }
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
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: domainAction.payload.application,
                    deploymentUuid: deploymentUuid, // deploymentUuid is not used in commit action but set for consistency
                  }
                };
                const result = await this.handleActionInternal(
                  commitAction,
                  applicationDeploymentMap,
                  currentModelEnvironment
                );
                log.info(
                  "handleActionFromUI autocommit done for action",
                  domainAction.actionType,
                  "application",
                  domainAction.payload.application,
                  "deployment",
                  deploymentUuid,
                  "domainAction",
                  domainAction,
                  "result instance of Action2Error",
                  result instanceof Action2Error,
                  "commit result",
                  result
                );
                return Promise.resolve(result);
              } else {
                log.info(
                  "handleActionFromUI no autocommit for action",
                  domainAction.actionType,
                  "domainAction",
                  domainAction
                );
                return result;
              }
            }
          );
        }
        return this.handleActionInternal(domainAction, applicationDeploymentMap, currentModelEnvironment);
        // return Promise.resolve();
      }).bind(this)
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
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment
  ): Promise<Action2VoidReturnType> {
    log.info(
      "DomainController handleAction START actionType=",
      domainAction["actionType"],
    );
    return this.miroirContext.miroirActivityTracker.trackAction(
      domainAction.actionType,
      (domainAction as any).actionLabel,
      (async () => {
        if ((domainAction as any)?.endpoint == libraryEndpointUuid) {
          return this.handleApplicationAction(domainAction, applicationDeploymentMap, currentModelEnvironment);
        } else {
          return this.handleActionInternal(domainAction, applicationDeploymentMap, currentModelEnvironment);
        }
        // return Promise.resolve();
      }).bind(this)
    );
    // return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  private async handleApplicationAction(
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment,
  ): Promise<Action2VoidReturnType> {
    log.info(
      "DomainController handleApplicationAction domainAction",
      JSON.stringify(domainAction, null, 2),
    );
    if (!currentModelEnvironment) {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction call is missing currentModelEnvironment argument",
        []
      ));
    }
    if (!(domainAction as any).endpoint) {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction missing endpoint in action",
        []
      ));
    }
    if (!(domainAction as any).actionType) {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction missing actionType in action",
        []
      ));
    }
    // look up the action implementation in the currentModelEnvironment
    const currentEndpointDefinition: EndpointDefinition | undefined =
      currentModelEnvironment?.endpointsByUuid[(domainAction as any).endpoint];

    log.info(
      "DomainController handleApplicationAction currentEndpointDefinition",
      currentEndpointDefinition
    );
    if (!currentEndpointDefinition) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction could not find action endpoint: " +
            (domainAction as any).endpoint +
            " in current model environment endpoints: " +
            Object.keys(currentModelEnvironment?.endpointsByUuid || {}).join(", ") + " currentModelEnvironment deploymentUuid: " +
            (currentModelEnvironment as any).deploymentUuid,
          []
        )
      );
    }
    const currentActionDefinition = currentEndpointDefinition.definition.actions.find(
      (ac) => ac.actionParameters.actionType.definition == (domainAction as any).actionType
    );
    log.info(
      "DomainController handleApplicationAction currentActionDefinition",
      currentActionDefinition
    );
    if (!currentActionDefinition) {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction unknown actionType in action: " + (domainAction as any).actionType,
        []
      ));
    }
    if (!currentActionDefinition.actionImplementation) {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction actionType has no implementation: " + (domainAction as any).actionType,
        []
      ));
    }
    if (currentActionDefinition.actionImplementation.actionImplementationType != "compositeActionTemplate") {
      return Promise.resolve(new Action2Error(
        "InvalidAction",
        "DomainController handleApplicationAction actionImplementationType not supported yet: " + currentActionDefinition.actionImplementation.actionImplementationType,
        []
      ));
    }

    const result = this.handleCompositeActionTemplate(
      currentActionDefinition.actionImplementation.definition as CompositeActionTemplate,
      applicationDeploymentMap,
      currentModelEnvironment,
      {...domainAction,
        deploymentUuid: applicationDeploymentMap[currentEndpointDefinition.application],
      }
    );
    return result;
    return Promise.resolve(new Action2Error(
      "NotImplemented",
      "DomainController handleApplicationAction not implemented yet",
      []
    ));
  }
  // ##############################################################################################
  private async handleActionInternal(
    domainAction: DomainAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2VoidReturnType> {
    const deploymentUuid =
      domainAction.payload.deploymentUuid ??
      applicationDeploymentMap[domainAction.payload.application];
    // let entityDomainAction:DomainAction | undefined = undefined;
    // log.info(
    //   "handleAction",
    //   "deploymentUuid",
    //   domainAction.deploymentUuid,
    //   "actionType",
    //   (domainAction as any).actionType,
    //   "actionType",
    //   domainAction?.actionType,
    //   "objects",
    //   JSON.stringify((domainAction as any)["objects"], null, 2)
    // );

    if (
      // !(
      domainAction.actionType != "initModel") {
      log.debug(
        "DomainController handleAction domainAction",
        JSON.stringify(domainAction, null, 2)
      );
    } else {
      log.debug("DomainController handleAction domainAction", domainAction);
    }
    try {
      LoggerGlobalContext.setAction(domainAction.actionType);
      // Also set in MiroirActivityTracker for MiroirEventService
      this.miroirContext.miroirActivityTracker.setAction(domainAction.actionType);
      switch (domainAction.actionType) {
        case "compositeActionSequence": {
          // old school, not used anymore (or should not be used anymore)
          throw new Error(
            "DomainController handleAction compositeActionSequence should not be used anymore"
          );
          break;
        }
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
        case "dropEntity": {
          if (!currentModel) {
            // throw new Error(
            //   "DomainController handleAction for modelAction needs a currentModel argument"
            // );
            return Promise.resolve(new Action2Error(
              "InvalidAction",
              "DomainController handleAction for modelAction needs a currentModel argument",
              [],
              undefined,
              { domainAction }
            ));
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
              domainAction.payload.deployments as any as SelfApplicationDeploymentConfiguration[]
            ); // TODO: works because only uuid of deployments is accessed in resetAndInitApplicationDeployment
          } else {
            try {
              switch (this.persistenceStoreAccessMode) {
                case "local": {
                  const result = await this.persistenceStoreLocalOrRemote.handleStoreOrBundleActionForLocalStore(
                    domainAction,
                    applicationDeploymentMap
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
                    domainAction
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
                    this.persistenceStoreAccessMode
                  );
                  throw new Error(
                    "DomainController handleAction storeManagementAction unknown persistenceStoreAccessMode " +
                      this.persistenceStoreAccessMode
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
                error
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
              domainAction
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
              error
            );
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        case "undo": 
        case "redo": {
          if (!currentModel) {
            throw new Error(
              "DomainController handleAction for undoRedoAction needs a currentModel argument"
            );
          }
          // TODO: create callSyncActionHandler
          return this.handleDomainUndoRedoAction(
            deploymentUuid,
            applicationDeploymentMap,
            domainAction,
            currentModel
          );
        }
        case "transactionalInstanceAction": {
          try {
            await this.callUtil.callLocalCacheAction(
              {}, // context
              {}, // continuation
              applicationDeploymentMap,
              domainAction
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
              error
            );
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        default:
          log.error(
            "DomainController handleAction action could not be taken into account, unkown action",
            domainAction
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
        "DomainController handleAction caught error: " + JSON.stringify(error, null, 2)
      );
    } finally {
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
          actionParamValues
        )).bind(this)
    );
  }

  // ##############################################################################################
  private async handleCompositeActionInternal(
    compositeActionSequence: CompositeActionSequence,
    modelEnvironment: MiroirModelEnvironment,
    applicationDeploymentMap: ApplicationDeploymentMap,
    actionParamValues: Record<string, any>,
    // currentModel: MiroirModelEnvironment // TODO: redundant with actionParamValues, remove it?
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    // let localContext: MiroirModelEnvironment & Record<string, any> = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleCompositeAction compositeActionSequence",
      compositeActionSequence,
      // JSON.stringify(compositeActionSequence, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams)
    );
    // log.info("handleCompositeAction compositeActionSequence", JSON.stringify(compositeActionSequence, null, 2), "localActionParams keys", Object.keys(localActionParams));
    // log.info("handleCompositeAction compositeActionSequence", compositeActionSequence, "localActionParams", localActionParams);

    for (const currentAction of compositeActionSequence.payload.definition) {
      let actionResult: Action2ReturnType | undefined = undefined;
      try {
        log.info(
          "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& handleCompositeAction compositeActionSequence handling sub action",
          currentAction,
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
            log.info(
              "handleCompositeAction compositeActionSequence action to handle",
              JSON.stringify(currentAction, null, 2)
            );
            actionResult = await this.handleCompositeAction(
              currentAction,
              applicationDeploymentMap,
              modelEnvironment,
              actionParamValues,
            );
            break;
          }
          // case "instanceAction":
          case 'createInstance':
          case 'deleteInstance':
          case 'deleteInstanceWithCascade':
          case 'updateInstance':
          case 'loadNewInstancesInLocalCache':
          case 'getInstance':
          case 'getInstances':
          // 
          case "undo":
          case "redo":
          // case "modelAction":
          case 'initModel':
          case 'commit':
          case 'rollback':
          case 'remoteLocalCacheRollback':
          case 'resetModel':
          case 'resetData':
          case 'alterEntityAttribute':
          case 'renameEntity':
          case 'createEntity':
          case 'dropEntity':
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
              log.info(
                "handleCompositeAction domainAction action to handle",
                JSON.stringify(currentAction, null, 2)
              );
            }
            // TODO: resolve runtime transformers for all composite actions. Should there be preserved areas?
            // const resolvedAction = transformer_extended_apply(
            //   "runtime",
            //   currentAction.actionLabel,
            //   currentAction as any as TransformerForRuntime,
            //   "value",
            //   actionParamValues, // queryParams
            //   localContext // contextResults
            // );

            // log.info(
            //   "handleCompositeAction resolvedAction action to handle",
            //   JSON.stringify(resolvedAction, null, 2)
            // );
            actionResult = await this.handleAction(
              currentAction,
              applicationDeploymentMap,
              modelEnvironment
            );
            if (actionResult instanceof Action2Error) {
              log.error(
                "handleCompositeAction Error on action",
                JSON.stringify(currentAction, null, 2),
                "actionResult",
                JSON.stringify(actionResult, null, 2)
              );
              throw new Error(
                "handleCompositeAction Error on action" +
                  JSON.stringify(currentAction, null, 2) +
                  "actionResult" +
                  JSON.stringify(actionResult, null, 2)
              );
            }
            break;
          }
          case "compositeRunBoxedQueryAction": {
            actionResult = await this.handleCompositeRunBoxedQueryAction(
              currentAction,
              applicationDeploymentMap,
              localContext,
            );

            break;
          }
          // case "compositeRunBoxedExtractorTemplateAction": {
          //   actionResult = await this.handleCompositeRunBoxedExtractorTemplateAction(
          //     currentAction,
          //     actionParamValues,
          //     localContext
          //   );
          //   break;
          // }
          case "compositeRunBoxedExtractorOrQueryAction": {
            actionResult = await this.handleCompositeRunBoxedExtractorOrQueryAction(
              currentAction,
              applicationDeploymentMap,
              actionParamValues,
              localContext
            );
            break;
          }
          // case "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
          //   throw new Error(
          //     "handleCompositeAction can not handle query actions: " + JSON.stringify(currentAction)
          //   );
          // }
          case "compositeRunTestAssertion": {
            actionResult = await this.miroirContext.miroirActivityTracker.trackTestAssertion(
              currentAction.actionLabel || "unnamed assertion",
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              (async () =>
                await this.handleTestCompositeActionAssertion(
                  currentAction,
                  modelEnvironment,
                  localContext,
                  actionResult
                )).bind(this)
            ); 
            // actionResult = this.handleTestCompositeActionAssertion(
            //   currentAction,
            //   localContext,
            //   actionResult
            // );
            break;
          }
          case 'compositeRunBoxedExtractorAction':
          default: {
            log.error("handleCompositeAction unknown actionType", currentAction);
            break;
          }
        }
        if (actionResult instanceof Action2Error) {
          log.error(
            "handleCompositeAction error",
            JSON.stringify(actionResult, null, 2),
            "on action",
            JSON.stringify(currentAction, null, 2)
          );
          return new Action2Error(
            "FailedTestAction",
            "handleCompositeAction error: " + JSON.stringify(actionResult.errorMessage, null, 2),
            [
              currentAction.actionLabel ?? currentAction.actionType,
              ...(actionResult.errorStack ?? ([] as any)),
            ],
            actionResult
          );
        }
      } catch (error) {
        // log.error(
        //   "handleCompositeAction caught error",
        //   error,
        //   "for action",
        //   JSON.stringify(currentAction, null, 2)
        // );
        return new Action2Error(
          "FailedTestAction",
          "handleCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType]
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
    buildPlusRuntimeCompositeAction: BuildPlusRuntimeCompositeAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleRuntimeCompositeAction compositeActionSequence",
      JSON.stringify(buildPlusRuntimeCompositeAction, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams)
    );
    // log.info("handleRuntimeCompositeAction compositeActionSequence", JSON.stringify(compositeActionSequence, null, 2), "localActionParams keys", Object.keys(localActionParams));
    // log.info("handleRuntimeCompositeAction compositeActionSequence", compositeActionSequence, "localActionParams", localActionParams);

    for (const currentAction of buildPlusRuntimeCompositeAction.payload.definition) {
      let actionResult: Action2ReturnType | undefined = undefined;
      try {
        LoggerGlobalContext.setAction(currentAction.actionLabel);
        // Also set in MiroirActivityTracker for MiroirEventService
        this.miroirContext.miroirActivityTracker.setAction(currentAction.actionLabel);
        // log.info(
        //   "handleRuntimeCompositeAction compositeInstanceAction handling sub currentAction",
        //   JSON.stringify(currentAction, null, 2),
        //   // currentAction,
        //   "localContext keys",
        //   Object.keys(localContext),
        // );

        // TODO: resolve runtime transformers for all composite actions. Should there be preserved areas?
        // const resolvedAction = transformer_extended_apply(
        //   "runtime",
        //   currentAction.actionLabel,
        //   currentAction as any as TransformerForRuntime,
        //   "value",
        //   actionParamValues, // queryParams
        //   localContext // contextResults
        // );

        // log.info(
        //   "handleRuntimeCompositeAction resolvedAction action to handle",
        //   JSON.stringify(resolvedAction, null, 2)
        // );

        // if (resolvedAction instanceof Domain2ElementFailed) {
        //   log.error(
        //     "handleRuntimeCompositeAction resolvedAction error",
        //     JSON.stringify(resolvedAction, null, 2)
        //   );
        //   return new Action2Error(
        //     "FailedToResolveTemplate",
        //     "handleRuntimeCompositeAction error resolving action " +
        //       JSON.stringify(resolvedAction, null, 2),
        //     [currentAction.actionLabel ?? currentAction.actionType]
        //   );
        // }

        switch (currentAction.actionType) {
          case "compositeActionSequence": {
            // composite pattern, recursive call
            log.info(
              "handleRuntimeCompositeAction compositeActionSequence action to handle",
              JSON.stringify(currentAction, null, 2)
            );
            actionResult = await this.handleRuntimeCompositeActionDO_NOT_USE(
              currentAction,
              applicationDeploymentMap,
              // currentAction as BuildPlusRuntimeCompositeAction,
              modelEnvironment,
              actionParamValues,
            );
            break;
          }
          // case "instanceAction":
          case 'createInstance':
          case 'deleteInstance':
          case 'deleteInstanceWithCascade':
          case 'updateInstance':
          case 'loadNewInstancesInLocalCache':
          case 'getInstance':
          case 'getInstances':
          // 
          case "redo":
          case "undo":
          // case "modelAction":
          // case 'compositeRunBoxedExtractorAction':
          case 'initModel':
          case 'commit':
          case 'rollback':
          case 'remoteLocalCacheRollback':
          case 'resetModel':
          case 'resetData':
          case 'alterEntityAttribute':
          case 'renameEntity':
          case 'createEntity':
          case 'dropEntity':
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
              log.info(
                "handleRuntimeCompositeAction domainAction action to handle",
                JSON.stringify(currentAction, null, 2)
              );
            }
            // // TODO: resolve runtime transformers for all composite actions. Should there be preserved areas?
            const resolvedAction = transformer_extended_apply(
              "runtime",
              [],
              currentAction.actionLabel,
              currentAction as any as TransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext // contextResults
            );

            log.info(
              "handleRuntimeCompositeAction resolvedAction action to handle",
              JSON.stringify(resolvedAction, null, 2)
            );

            if (resolvedAction instanceof Domain2ElementFailed) {
              log.error(
                "handleRuntimeCompositeAction resolvedAction error",
                JSON.stringify(resolvedAction, null, 2)
              );
              return new Action2Error(
                "FailedToResolveTemplate",
                "handleRuntimeCompositeAction error resolving action " +
                  JSON.stringify(resolvedAction, null, 2),
                [currentAction.actionLabel ?? currentAction.actionType]
              );
            }
            actionResult = await this.handleAction(resolvedAction, applicationDeploymentMap, modelEnvironment);
            // actionResult = await this.handleAction(currentAction, currentModel);
            if (actionResult instanceof Action2Error) {
              log.error(
                "handleRuntimeCompositeAction Error on action",
                JSON.stringify(currentAction, null, 2),
                "actionResult",
                JSON.stringify(actionResult, null, 2)
              );
              throw new Error(
                "handleRuntimeCompositeAction Error on action" +
                  JSON.stringify(currentAction, null, 2) +
                  "actionResult" +
                  JSON.stringify(actionResult, null, 2)
              );
            }
            break;
          }
          case "compositeRunBoxedQueryAction": {
            // const resolvedActionWithProtectedRuntimeTranformers = currentAction.queryTemplate.query.runtimeTransformers?
            //   {
            //     ...resolvedAction,
            //     queryTemplate: {
            //       ...resolvedAction.queryTemplate,
            //       query: {
            //         ...resolvedAction.queryTemplate.query,
            //         runtimeTransformers: currentAction.queryTemplate.query.runtimeTransformers,
            //       },
            //     },
            //   }: resolvedAction;
            const resolvedActionWithProtectedRuntimeTranformers: {
              actionType: "compositeRunBoxedQueryAction";
              actionLabel?: string | undefined;
              nameGivenToResult: string;
              queryTemplate: RunBoxedQueryAction;
            } = transformer_extended_apply(
              "build",
              [],
              currentAction.actionLabel,
              currentAction as any as TransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext // contextResults
            );
            actionResult = await this.handleCompositeRunBoxedQueryAction(
              resolvedActionWithProtectedRuntimeTranformers,
              applicationDeploymentMap,
              localContext
            );
            if (actionResult instanceof Action2Error) {
              return actionResult;
            }

            break;
          }
          case "compositeRunBoxedExtractorOrQueryAction": {
            // const resolvedActionWithProtectedRuntimeTranformers = (currentAction.query.query as any).runtimeTransformers?
            //   {
            //     ...resolvedAction,
            //     query: {
            //       ...resolvedAction.query,
            //       query: {
            //         ...resolvedAction.query.query,
            //         runtimeTransformers: (currentAction.query.query as any).runtimeTransformers,
            //       },
            //     },
            //   }: resolvedAction;
            const resolvedActionWithProtectedRuntimeTranformers: {
              actionType: "compositeRunBoxedExtractorOrQueryAction";
              actionLabel?: string | undefined;
              nameGivenToResult: string;
              query: RunBoxedExtractorOrQueryAction;
            } = transformer_extended_apply(
              "build",
              [],
              currentAction.actionLabel,
              currentAction as any as TransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext // contextResults
            );
            actionResult = await this.handleCompositeRunBoxedExtractorOrQueryAction(
              resolvedActionWithProtectedRuntimeTranformers,
              applicationDeploymentMap,
              actionParamValues,
              localContext
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
              currentAction as any as TransformerForBuildPlusRuntime,
              "value",
              modelEnvironment,
              actionParamValues, // queryParams
              localContext // contextResults
            );

            log.info(
              "handleRuntimeCompositeAction resolvedAction action to handle",
              JSON.stringify(resolvedAction, null, 2)
            );

            if (resolvedAction instanceof Domain2ElementFailed) {
              log.error(
                "handleRuntimeCompositeAction resolvedAction error",
                JSON.stringify(resolvedAction, null, 2)
              );
              return new Action2Error(
                "FailedToResolveTemplate",
                "handleRuntimeCompositeAction error resolving action " +
                  JSON.stringify(resolvedAction, null, 2),
                [currentAction.actionLabel ?? currentAction.actionType]
              );
            }

            actionResult = this.handleTestCompositeActionAssertion(
              resolvedAction, //currentAction,
              modelEnvironment,
              localContext,
              actionResult
            );
            break;
          }
          case 'compositeRunBoxedExtractorAction':
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
            JSON.stringify(currentAction, null, 2)
          );
          return new Action2Error(
            "FailedTestAction",
            "handleRuntimeCompositeAction error: " + JSON.stringify(actionResult.errorMessage, null, 2),
            [
              currentAction.actionLabel ?? currentAction.actionType,
              ...(actionResult.errorStack ?? ([] as any)),
            ],
            actionResult
          );
        }
      } catch (error) {
        log.error(
          "handleRuntimeCompositeAction caught error",
          error,
          "for action",
          JSON.stringify(currentAction, null, 2)
        );
        return new Action2Error(
          "FailedTestAction",
          "handleRuntimeCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType]
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
    buildPlusRuntimeCompositeAction: BuildPlusRuntimeCompositeAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleBuildPlusRuntimeCompositeAction compositeActionSequence",
      JSON.stringify(buildPlusRuntimeCompositeAction, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams)
    );

    const resolvedCompositeActionTemplates: any = {};
    // going imperatively to handle inner references
    if (buildPlusRuntimeCompositeAction.payload.templates) {
      // log.info("handleBuildPlusRuntimeCompositeAction resolving templates", buildPlusRuntimeCompositeAction.templates);

      for (const t of Object.entries(buildPlusRuntimeCompositeAction.payload.templates)) {
        // const newLocalParameters: Record<string,any> = { ...localActionParams, ...resolvedCompositeActionTemplates };
        const newLocalParameters: Record<string, any> = {
          // miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
          // TODO: missing miroirMetaModel: MetaModel
          // currentModel,
          ...localActionParams,
          ...resolvedCompositeActionTemplates,
        };
        // log.info(
        //   "buildPlusRuntimeCompositeAction",
        //   buildPlusRuntimeCompositeAction.actionLabel,
        //   "resolving template",
        //   t[0],
        //   // t[1],
        //   "newLocalParameters",
        //   newLocalParameters
        // );
        const resolvedTemplate = transformer_extended_apply_wrapper(
          undefined, // activityTracker
          "build",
          [],
          // "runtime",
          t[0],
          t[1] as any,
          modelEnvironment,
          newLocalParameters, // queryParams
          {}, // contextResults
          "value"
        );
        if (resolvedTemplate.queryFailure) {
          log.error(
            "handleBuildPlusRuntimeCompositeAction resolved template error",
            resolvedTemplate
          );
          return new Action2Error(
            "FailedToResolveTemplate",
            "handleBuildPlusRuntimeCompositeAction error resolving template " +
              JSON.stringify(resolvedTemplate, null, 2),
            [
              buildPlusRuntimeCompositeAction.actionLabel ??
                buildPlusRuntimeCompositeAction.actionType,
            ]
          );
          // throw new Error(
          //   "handleBuildPlusRuntimeCompositeAction error resolving template " +
          //   " " + t[0] + " " + JSON.stringify(resolvedTemplate, null, 2)
          // );
        } else {
          log.info(
            "handleBuildPlusRuntimeCompositeAction",
            buildPlusRuntimeCompositeAction.actionLabel,
            "resolved template",
            t[0],
            "has value",
            resolvedTemplate
          );
          resolvedCompositeActionTemplates[t[0]] = resolvedTemplate;
        }
      }
    }

    const resolvedActionDefinition: TransformerReturnType<any> =
      transformer_extended_apply_wrapper(
        undefined, // activityTracker
        "build",
        [],
        buildPlusRuntimeCompositeAction.actionLabel,
        buildPlusRuntimeCompositeAction.payload.definition as any as TransformerForBuildPlusRuntime,
        modelEnvironment,
        { ...actionParamValues, ...resolvedCompositeActionTemplates }, // queryParams
        localContext, // contextResults
        "value"
      );

    // log.info(
    //   "handleBuildPlusRuntimeCompositeAction resolvedActionDefinition",
    //   JSON.stringify(resolvedActionDefinition, null, 2)
    // );
    // if (resolvedActionDefinition instanceof Action2Error) {
    if (resolvedActionDefinition instanceof TransformerFailure) {
      log.error(
        "handleBuildPlusRuntimeCompositeAction Error on action",
        JSON.stringify(buildPlusRuntimeCompositeAction, null, 2),
        "actionResult",
        JSON.stringify(buildPlusRuntimeCompositeAction, null, 2)
      );
      // throw new Error(
      //   "handleBuildPlusRuntimeCompositeAction Error on action" +
      //     JSON.stringify(buildPlusRuntimeCompositeAction, null, 2) +
      //     "actionResult" +
      //     JSON.stringify(buildPlusRuntimeCompositeAction, null, 2)
      // );
      return new Action2Error(
        "FailedToResolveAction",
        "handleBuildPlusRuntimeCompositeAction error: " +
          JSON.stringify(resolvedActionDefinition, null, 2),
        [
          buildPlusRuntimeCompositeAction.actionLabel ?? buildPlusRuntimeCompositeAction.actionType,
          ...(resolvedActionDefinition.errorStack ?? ([] as any)),
        ],
        resolvedActionDefinition as any // TODO: Action2Error can not be constructed from TransformerFailure, should this be allowed?
      );
    } else {
      log.info(
        "handleBuildPlusRuntimeCompositeAction resolvedActionDefinition",
        JSON.stringify(resolvedActionDefinition, null, 2)
      );
    }

    const resolvedAction: BuildPlusRuntimeCompositeAction = {
      actionType: "compositeActionSequence",
      actionLabel: buildPlusRuntimeCompositeAction.actionLabel,
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "IGNORED",
        definition: resolvedActionDefinition as any,
        templates: resolvedCompositeActionTemplates,
      }
    };

    return this.handleRuntimeCompositeActionDO_NOT_USE(
      resolvedAction, //buildPlusRuntimeCompositeAction,
      applicationDeploymentMap,
      modelEnvironment,
      actionParamValues,
    );
    return Promise.resolve(ACTION_OK);
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
    actionResult: Action2ReturnType | undefined
  ) {
    if (!ConfigurationService.testImplementation) {
      throw new Error(
        "ConfigurationService.testImplementation is not set, please inject a test implementation using ConfigurationService.registerTestImplementation on startup if you want to run tests at runtime."
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
            localContext // TODO: should be {}?
          )
        : localContext;

      const preValueToTest = resolvePathOnObject(
        prePreValueToTest,
        currentAction.testAssertion.definition.resultAccessPath ?? []
      );

      valueToTest = removeUndefinedProperties(unNullify(Array.isArray(preValueToTest)
        ? ignorePostgresExtraAttributesOnList(
            preValueToTest,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          )
        : ignorePostgresExtraAttributesOnObject(
            preValueToTest,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          )));
      const expectedValue = Array.isArray(currentAction.testAssertion.definition.expectedValue)
        ? ignorePostgresExtraAttributesOnList(
            currentAction.testAssertion.definition.expectedValue,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          )
        : ignorePostgresExtraAttributesOnObject(
            currentAction.testAssertion.definition.expectedValue,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          );
      log.info(
        "handleTestCompositeActionAssertion compositeRunTestAssertion to handle",
        JSON.stringify(currentAction.testAssertion, null, 2),
        "ignoreAttributes",
        currentAction.testAssertion.definition.ignoreAttributes??[],
        "expectedValue",
        JSON.stringify(expectedValue, null, 2),
        // "preValueToTest is array",
        // Array.isArray(preValueToTest),
        // "preValueToTest",
        // JSON.stringify(preValueToTest, null, 2),
        "valueToTest",
        JSON.stringify(valueToTest, null, 2)
      );
      try {
        ConfigurationService.testImplementation
          .expect(valueToTest, currentAction.nameGivenToResult)
          .toEqual(expectedValue);
        // .toEqual(currentAction.testAssertion.definition.expectedValue);
        log.info(
          "handleTestCompositeActionAssertion compositeRunTestAssertion test passed",
          currentAction.testAssertion
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
          }
        );
      } catch (error) {
        // TestSuiteContext.setTestAssertionResult({
        //   assertionName: currentAction.testAssertion.testLabel,
        //   assertionResult: "error",
        //   assertionExpectedValue: currentAction.testAssertion.definition.expectedValue,
        //   assertionActualValue: valueToTest,
        // });
        // Set test result in MiroirActivityTracker for TestLogService
        this.miroirContext.miroirActivityTracker.setTestAssertionResult(
          this.miroirContext.miroirActivityTracker.getCurrentTestAssertionPath(),
          {
            assertionName: currentAction.testAssertion.testLabel,
            assertionResult: "error",
            assertionExpectedValue: currentAction.testAssertion.definition.expectedValue,
            assertionActualValue: valueToTest,
          }
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
        }
      );
      throw new Error(
        "handleTestCompositeActionAssertion compositeRunTestAssertion error" + JSON.stringify(error, null, 2)
      );
    } finally {
      // Clear test assertion in MiroirActivityTracker for TestLogService
      // this.miroirContext.miroirActivityTracker.setTestAssertion(undefined);
    }
    return actionResult;
  }

  // ##############################################################################################
  private async handleCompositeRunBoxedExtractorOrQueryAction(
    currentAction: {
      actionType: "compositeRunBoxedExtractorOrQueryAction";
      actionLabel?: string | undefined;
      nameGivenToResult: string;
      query: RunBoxedExtractorOrQueryAction;
    },
    applicationDeploymentMap: ApplicationDeploymentMap,
    actionParamValues: Record<string, any>,
    // actionResult: Action2ReturnType | undefined,
    localContext: Record<string, any>
  ) {
    log.info(
      "handleCompositeAction runBoxedExtractorOrQueryAction to handle",
      currentAction,
      "with actionParamValues",
      actionParamValues
    );

    const actionResult = await this.handleBoxedExtractorOrQueryAction(
      currentAction.query,
      applicationDeploymentMap
    ); // TODO: pass the current model
    if (actionResult.status == "error" /* actionResult instanceof Action2Error */) {
      log.error(
        "Error on runBoxedExtractorOrQueryAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "query=",
        JSON.stringify(actionResult, null, 2)
      );
      return new Action2Error(
        "FailedToRunBoxedExtractorOrQueryAction",
        "handleCompositeRunBoxedExtractorOrQueryAction error: " +
          JSON.stringify(actionResult, null, 2),
        [currentAction.actionLabel ?? currentAction.actionType],
        actionResult as any
      );
    } else {
      if ((actionResult as any).returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error on runBoxedExtractorOrQueryAction (Domain2ElementFailed) with nameGivenToResult",
          currentAction.nameGivenToResult,
          "query=",
          JSON.stringify(actionResult, null, 2)
        );
        return new Action2Error(
          "FailedToRunBoxedExtractorOrQueryAction",
          "handleCompositeRunBoxedExtractorOrQueryAction error: " +
            JSON.stringify(actionResult, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType],
          actionResult as any
        );
      } else {
        log.info(
          "handleCompositeAction runBoxedExtractorOrQueryAction adding result to context as",
          currentAction.nameGivenToResult,
          "value",
          JSON.stringify(actionResult, null, 2)
        );
        localContext[currentAction.nameGivenToResult] = (actionResult as any).returnedDomainElement;
      }
    }
    return actionResult;
  }

  // ##############################################################################################
  private async handleCompositeRunBoxedQueryAction(
    currentAction: {
      actionType: "compositeRunBoxedQueryAction";
      actionLabel?: string | undefined;
      nameGivenToResult: string;
      queryTemplate: RunBoxedQueryAction;
    },
    applicationDeploymentMap: ApplicationDeploymentMap,
    localContext: Record<string, any>
  ) {
    if (currentAction.queryTemplate == undefined) {
      throw new Error("handleCompositeAction currentAction.queryTemplate is undefined");
    }

    // actionResult = await this.handleQueryTemplateActionForServerONLY(
    const actionResult = await this.handleBoxedExtractorOrQueryAction(currentAction.queryTemplate, applicationDeploymentMap); // TODO: pass the current model
    if (actionResult instanceof Action2Error) {
      log.error(
        "Error (Action2Error) on handleCompositeRunBoxedQueryAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "query=",
        JSON.stringify(actionResult, null, 2)
      );
      return actionResult;
    } else {
      if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error (Domain2ElementFailed) on handleCompositeRunBoxedQueryAction with nameGivenToResult",
          currentAction.nameGivenToResult,
          "query=",
          JSON.stringify(actionResult, null, 2)
        );
        return actionResult;
      } else {
        log.info(
          "handleCompositeRunBoxedQueryAction adding result to context as",
          currentAction.nameGivenToResult,
          "value",
          actionResult
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

  // // ##############################################################################################
  // private async handleCompositeRunBoxedQueryTemplateAction(
  //   currentAction: {
  //     actionType: "compositeRunBoxedQueryTemplateAction";
  //     actionLabel?: string | undefined;
  //     nameGivenToResult: string;
  //     queryTemplate: RunBoxedQueryTemplateAction;
  //   },
  //   actionParamValues: Record<string, any>,
  //   // actionResult: Action2ReturnType | undefined,
  //   localContext: Record<string, any>
  // ) {
  //   log.info(
  //     "handleCompositeRunBoxedQueryTemplateAction to handle",
  //     currentAction,
  //     "with actionParamValues",
  //     actionParamValues
  //   );

  //   const actionResult = await this.handleQueryTemplateActionForServerONLY(
  //     currentAction.queryTemplate
  //   );
  //   if (actionResult instanceof Action2Error) {
  //     log.error(
  //       "Error on handleCompositeRunBoxedQueryTemplateAction with nameGivenToResult",
  //       currentAction.nameGivenToResult,
  //       "query=",
  //       JSON.stringify(actionResult, null, 2)
  //     );
  //   } else {
  //     if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
  //       log.error(
  //         "Error on handleCompositeRunBoxedQueryTemplateAction with nameGivenToResult",
  //         currentAction.nameGivenToResult,
  //         "query=",
  //         JSON.stringify(actionResult, null, 2)
  //       );
  //     } else {
  //       log.info(
  //         "handleCompositeActionTemplate handleCompositeRunBoxedQueryTemplateAction adding result to context as",
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
  async handleCompositeActionTemplate(
    compositeActionSequence: CompositeActionTemplate,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };
    const actionLabel = (compositeActionSequence as any).actionLabel ?? "no action label";
    log.info(
      "handleCompositeActionTemplate called with compositeActionSequence",
      actionLabel,
      "compositeActionSequence",
      compositeActionSequence,
      "localActionParams",
      localActionParams
    );
    const resolved: TransformerReturnType<{
      resolvedCompositeActionDefinition: CompositeActionSequence;
      resolvedCompositeActionTemplates: Record<string, any>;
    }> = resolveCompositeActionTemplate(compositeActionSequence, modelEnvironment, localActionParams,); // resolves "build" temp

    if (resolved instanceof TransformerFailure) {
      return new Action2Error(
        "FailedToResolveTemplate",
        "handleCompositeActionTemplate error resolving composite action template",
        [actionLabel],
        resolved as any, // TODO: TransformerFailure to Action2Error
        compositeActionSequence
      );
    }

    log.info("handleCompositeActionTemplate resolved Templates", {actionLabel, localActionParams, resolved});
    // log.info("handleCompositeActionTemplate", actionLabel, "localActionParams", localActionParams);
    // log.info(
    //   "handleCompositeActionTemplate",
    //   actionLabel,
    //   "resolvedCompositeActionDefinition",
    //   resolved.resolvedCompositeActionDefinition
    //   // JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );

    // TODO: replace with handleCompositeAction
    for (const currentAction of resolved.resolvedCompositeActionDefinition.payload.definition) {
      log.info(
        "handleCompositeActionTemplate",
        actionLabel,
        "currentAction",
        // JSON.stringify(currentAction, null, 2),
        currentAction.actionLabel,
        currentAction,
        // "actionParamsAndTemplates",
        // resolved.actionParamsAndTemplates,
        "localContext keys",
        Object.keys(localContext),
        "localContext",
        localContext
      );
      // const resolvedActionTemplate: InstanceAction = transformer_extended_apply(
      const resolvedActionTemplate: any = transformer_extended_apply(
        "runtime",
        [],
        currentAction.actionLabel ?? "NO NAME",
        currentAction as any as TransformerForBuildPlusRuntime, // TODO: correct type
        "value",
        modelEnvironment,
        localActionParams,
        localContext
      ) as InstanceAction;
      log.info(
        "handleCompositeActionTemplate compositeInstanceAction",
        currentAction.actionLabel ?? "without step name",
        // "resolvedActionTemplate instanceof Domain2ElementFailed",
        // resolvedActionTemplate instanceof Domain2ElementFailed,
        "resolvedActionTemplate instanceof TransformerFailure",
        resolvedActionTemplate instanceof TransformerFailure,
        "resolved action Template",
        JSON.stringify(resolvedActionTemplate, null, 2)
      );
          // log.info("handleCompositeActionTemplate compositeInstanceAction current model", currentModel);
          // if (resolvedActionTemplate instanceof Domain2ElementFailed) {
          if (resolvedActionTemplate instanceof TransformerFailure) {
            return new Action2Error(
              "FailedToResolveTemplate",
              "handleCompositeActionTemplate compositeInstanceAction error resolving action",
              [],
              resolvedActionTemplate as any,
              currentAction
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
            localContext
          );
          if (actionResult instanceof Action2Error) {
            return actionResult;
          }
          // return actionResult;
          break;
        }
        case "compositeRunBoxedExtractorOrQueryAction": {
          // const resolvedActionTemplate = transformer_extended_apply(
          //   "runtime",
          //   [],
          //   currentAction.actionLabel ?? "NO NAME",
          //   currentAction as any as TransformerForRuntime, // TODO: correct type
          //   "value",
          //   modelEnvironment,
          //   localActionParams,
          //   localContext
          // ) as InstanceAction;
          // log.info(
          //   "handleCompositeActionTemplate compositeRunBoxedExtractorOrQueryAction",
          //   currentAction.actionLabel ?? "without step name",
          //   "resolved action Template",
          //   JSON.stringify(resolvedActionTemplate, null, 2)
          // );

          // TODO: resolve runtime transformers here. Use the "main" case, since it's the same implementation?
          const actionResult = await this.handleCompositeRunBoxedExtractorOrQueryAction(
            resolvedActionTemplate,
            applicationDeploymentMap,
            actionParamValues,
            localContext,
          );
          log.info(
            "handleCompositeActionTemplate",
            "'" + actionLabel + "'",
            "handled compositeRunBoxedExtractorOrQueryAction",
            "result is error",
            actionResult instanceof Action2Error,
            "action",
            currentAction,
            "with actionParamValues",
            actionParamValues, 
            "resulting context",
            localContext
          );
          if (actionResult instanceof Action2Error) {
            return actionResult;
          }
          // return actionResult;
          break;
        }
        case "compositeRunBoxedExtractorAction":
        case "compositeRunTestAssertion": {
          log.error(
            "handleCompositeActionTemplate",
            actionLabel,
            "can not handle actionType",
            currentAction
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
            [currentAction.actionLabel ?? currentAction.actionType]
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
        //
        case "transactionalInstanceAction":
        case "compositeActionSequence":
        // case "storeManagementAction":
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
          const actionResult = await this.handleAction(resolvedActionTemplate, applicationDeploymentMap, modelEnvironment);
          log.info(
            "handleCompositeActionTemplate",
            actionLabel,
            "received actionResult from compositeInstanceAction",
            currentAction,
            "actionResult",
            JSON.stringify(actionResult, null, 2)
          );
          if (actionResult instanceof Action2Error) {
            log.error(
              "handleCompositeActionTemplate compositeInstanceAction error on running action",
              JSON.stringify(currentAction, null, 2) +
                "actionResult" +
                JSON.stringify(actionResult, null, 2)
            );
            // throw new Error(
            //   "handleCompositeActionTemplate compositeInstanceAction error on action" +
            //     JSON.stringify(resolveCompositeActionTemplate, null, 2) +
            //     "actionResult" +
            //     JSON.stringify(actionResult, null, 2)
            // );
            return new Action2Error(
              "FailedToHandleAction",
              "handleCompositeActionTemplate compositeInstanceAction error: " +
                JSON.stringify(actionResult, null, 2),
              [
                currentAction.actionLabel ?? currentAction.actionType,
                ...(actionResult.errorStack ?? ([] as any)),
              ],
              actionResult
            );
          }
          break;
        }
        // default: {
        //   log.error(
        //     "handleCompositeActionTemplate",
        //     actionLabel,
        //     "unknown actionType",
        //     currentAction
        //   );
        //   // throw new Error(
        //   //   "handleCompositeActionTemplate " +
        //   //     actionLabel +
        //   //     " unknown actionType: " +
        //   //     currentAction.actionType
        //   // );
        //   return new Action2Error(
        //     "FailedToHandleAction",
        //     "handleCompositeActionTemplate " +
        //       actionLabel +
        //       " unknown actionType: " +
        //       currentAction.actionType,
        //     [currentAction.actionLabel ?? currentAction.actionType]
        //   );
        //   break;
        // }
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
    testAction: TestCompositeAction | TestBuildPlusRuntimeCompositeAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleTestCompositeAction testAction",
      testAction,
      "localActionParams",
      localActionParams
    );

    // log.info(
    //   "handleCompositeAction compositeInstanceAction resolvedCompositeActionDefinition",
    //   JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );
    this.miroirContext.miroirActivityTracker.setTest(testAction.testLabel);

    if (testAction.beforeTestSetupAction) {
      log.info(
        "handleTestCompositeAction beforeAll",
        testAction.beforeTestSetupAction.actionLabel,
        testAction.beforeTestSetupAction
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
      log.info("handleTestCompositeAction no beforeTestSetupAction!");
    }

    switch (testAction.testType) {
      case "testCompositeAction": {
        const localCompositeAction: CompositeActionSequence = {
          ...testAction.compositeActionSequence,
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          payload: {
            application: "IGNORED",
            definition: [
              ...testAction.compositeActionSequence.payload.definition,
              ...testAction.testCompositeActionAssertions,
            ]
          }
        };
        const result = await this.handleCompositeAction(
          localCompositeAction,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
      }
      case "testBuildPlusRuntimeCompositeAction": {
        const localCompositeAction: BuildPlusRuntimeCompositeAction = {
          ...testAction.compositeActionSequence,
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          payload: {
            application: "IGNORED",
            definition: [
              ...testAction.compositeActionSequence.payload.definition,
              ...testAction.testCompositeActionAssertions,
            ],
          }
        };
        const result = await this.handleRuntimeCompositeActionDO_NOT_USE(
          localCompositeAction,
          applicationDeploymentMap,
          modelEnvironment,
          localActionParams,
        );
      }
    }

    if (testAction.afterTestCleanupAction) {
      log.info(
        "handleTestCompositeAction afterTestCleanupAction",
        testAction.afterTestCleanupAction.actionLabel,
        testAction.afterTestCleanupAction
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
      log.info("handleTestCompositeAction no afterTestCleanupAction!");
    }
    // TestSuiteContext.setTest(undefined);
    this.miroirContext.miroirActivityTracker.setTest(undefined);

    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleTestCompositeActionSuite(
    testAction: TestCompositeActionSuite | TestBuildPlusRuntimeCompositeActionSuite,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleTestCompositeActionSuite testAction",
      testAction,
      "localActionParams",
      Object.keys(localActionParams)
    );

    const testSuiteResult: Record<string, TestResult> = {};

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
            beforeAllResult
          );
        }
        this.miroirContext.miroirActivityTracker.setTest(undefined);
        // LoggerGlobalContext.setTest(undefined);
      } else {
        log.info("handleTestCompositeActionSuite no beforeAll!");
      }

      // testAction.testCompositeActions
      for (const testCompositeAction of Object.entries(testAction.testCompositeActions) as [
        string,
        // TestCompositeAction | TestRuntimeCompositeAction | TestBuildPlusRuntimeCompositeAction
        TestCompositeAction | TestBuildPlusRuntimeCompositeAction
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
          this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel + ".beforeEach");
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
              JSON.stringify(beforeEachResult, null, 2)
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite error: " +
                JSON.stringify(beforeEachResult.errorMessage, null, 2),
              beforeEachResult.errorStack,
              beforeEachResult
            );
          }
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          // LoggerGlobalContext.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no beforeEach!");
        }

        // beforeTestSetupAction
        if (testCompositeAction[1].beforeTestSetupAction) {
          // TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".beforeTestSetupAction");
          this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel + ".beforeTestSetupAction");
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "beforeTestSetupAction",
            testCompositeAction[1].beforeTestSetupAction.actionLabel,
            testCompositeAction[1].beforeTestSetupAction
          );
          const beforeTestResult = await this.handleCompositeAction(
            testCompositeAction[1].beforeTestSetupAction,
            applicationDeploymentMap,
            modelEnvironment,
            localActionParams,
          );
          if (beforeTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on beforeTestSetupAction",
              JSON.stringify(beforeTestResult, null, 2)
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite beforeTest error: " +
                JSON.stringify(beforeTestResult.errorMessage, null, 2),
              beforeTestResult.errorStack,
              beforeTestResult
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no beforeTestSetupAction!"
          );
        }

        let testResult: Action2ReturnType | undefined = undefined;
        switch (testCompositeAction[1].testType) {
          case 'testBuildPlusRuntimeCompositeAction': {
            const localTestCompositeAction: BuildPlusRuntimeCompositeAction = {
              ...testCompositeAction[1].compositeActionSequence,
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                application: "IGNORED",
                definition: [
                  ...testCompositeAction[1].compositeActionSequence.payload.definition,
                  ...testCompositeAction[1].testCompositeActionAssertions,
                ]
              }
            };
            // TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel);
            testResult = await this.miroirContext.miroirActivityTracker.trackTest(
              testCompositeAction[1].testLabel,
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              async() => await this.handleBuildPlusRuntimeCompositeAction(
                localTestCompositeAction,
                applicationDeploymentMap,
                modelEnvironment,
                localActionParams,
              )
            );
            //
            //
            // testResult = await this.handleBuildPlusRuntimeCompositeAction(
            //   localTestCompositeAction,
            //   localActionParams,
            //   currentModel
            // );
            break;
          }
          // case "testRuntimeCompositeAction": {
          //   const localTestCompositeAction: BuildPlusRuntimeCompositeAction = {
          //     ...testCompositeAction[1].compositeActionSequence,
          //     definition: [
          //       ...testCompositeAction[1].compositeActionSequence.definition,
          //       ...testCompositeAction[1].testCompositeActionAssertions,
          //     ],
          //   };
          //   // TestSuiteContext.setTest(testCompositeAction[1].testLabel);
          //   this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel);
          //   testResult = await this.miroirContext.miroirActivityTracker.trackTest(
          //     testCompositeAction[1].testLabel,
          //     this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
          //     async() => await this.handleRuntimeCompositeActionDO_NOT_USE(
          //       localTestCompositeAction,
          //       modelEnvironment,
          //       localActionParams,
          //     )
          //   );
          //   //
          //   // testResult = await this.handleRuntimeCompositeActionDO_NOT_USE(
          //   //   localTestCompositeAction,
          //   //   localActionParams,
          //   //   currentModel
          //   // );
          //   break;
          // }
          case "testCompositeAction": {
            const localTestCompositeAction: CompositeActionSequence = {
              ...testCompositeAction[1].compositeActionSequence,
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                application: "IGNORED",
                definition: [
                  ...testCompositeAction[1].compositeActionSequence.payload.definition,
                  ...testCompositeAction[1].testCompositeActionAssertions,
                ],
              }
            };
            // TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel);
            testResult = await this.miroirContext.miroirActivityTracker.trackTest(
              testCompositeAction[1].testLabel,
              this.miroirContext.miroirActivityTracker.getCurrentActivityId() || "unknown",
              async() => await this.handleCompositeAction(
                localTestCompositeAction,
                applicationDeploymentMap,
                modelEnvironment,
                localActionParams,
              )
            )
            // testResult = await this.handleCompositeAction(
            //   localTestCompositeAction,
            //   localActionParams,
            //   currentModel
            // );
            break;
          }
        }
        if (testResult instanceof Action2Error) {
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
          return new Action2Error(
            "FailedTestAction",
            "handleTestCompositeActionSuite error: " +
              JSON.stringify(testResult.errorMessage, null, 2),
            [
              testCompositeAction[1].testLabel ?? testCompositeAction[1].testType,
              ...(testResult.errorStack ?? []),
            ],
            testResult
          );
        } else {
          log.info(
            "handleTestCompositeActionSuite testResult", JSON.stringify(testResult, null, 2)
          );
        }
        // TestSuiteContext.setTest(undefined);
        this.miroirContext.miroirActivityTracker.setTest(undefined);

        if (testCompositeAction[1].afterTestCleanupAction) {
          // TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterTestCleanupAction");
          this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel + ".afterTestCleanupAction");
          log.info(
            "handleTestCompositeAction",
            testCompositeAction[0],
            "afterTestCleanupAction",
            testCompositeAction[1].afterTestCleanupAction.actionLabel,
            testCompositeAction[1].afterTestCleanupAction
          );
          const afterTestResult = await this.handleCompositeAction(
            testCompositeAction[1].afterTestCleanupAction,
            applicationDeploymentMap,
            modelEnvironment,
            localActionParams,
          );
          if (afterTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeAction",
              testCompositeAction[0],
              "Error on afterTestCleanupAction",
              JSON.stringify(afterTestResult, null, 2)
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterTestCleanup error: " +
                JSON.stringify(afterTestResult.errorMessage, null, 2),
              ["afterTestCleanupAction", ...(afterTestResult.errorStack ?? [])],
              afterTestResult
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no afterTestSetupAction!"
          );
        }

        if (testAction.afterEach) {
          // TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterEach");
          this.miroirContext.miroirActivityTracker.setTest(testCompositeAction[1].testLabel + ".afterEach");
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "afterEach",
            testAction.afterEach.actionLabel,
            testAction.beforeAll
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
              JSON.stringify(beforeAllResult, null, 2)
            );
            // TestSuiteContext.setTest(undefined);
            this.miroirContext.miroirActivityTracker.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterEach error: " +
                JSON.stringify(beforeAllResult.errorMessage, null, 2),
              beforeAllResult.errorStack,
              beforeAllResult
            );
          }
          // TestSuiteContext.setTest(undefined);
          this.miroirContext.miroirActivityTracker.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no afterEach!");
        }
      }

      if (testAction.afterAll) {
        // TestSuiteContext.setTest("afterAll");
        this.miroirContext.miroirActivityTracker.setTest("afterAll");
        log.info(
          "handleTestCompositeActionSuite afterAll",
          testAction.afterAll.actionLabel,
          testAction.beforeAll
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
            "handleTestCompositeActionSuite afterAll error: " +
              JSON.stringify(afterAllResult.errorMessage, null, 2),
            afterAllResult.errorStack,
            afterAllResult
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
        "handleTestCompositeActionSuite caught error: " + JSON.stringify(error, null, 2)
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
      Object.keys(localActionParams)
    );

    const resolvedAction: {
      resolvedTestCompositeActionDefinition: TestCompositeActionSuite;
      resolvedCompositeActionTemplates: Record<string, any>;
    } = resolveTestCompositeActionTemplateSuite(testAction, modelEnvironment, localActionParams,);

    const resolveErrors = Object.entries(
      resolvedAction.resolvedTestCompositeActionDefinition.testCompositeActions
    ).filter(
      (e: [string, TestCompositeAction]) =>
        (e[1].compositeActionSequence.payload.definition as any).queryFailure != undefined
    );
    
    if (resolveErrors.length > 0) {
      log.error("handleTestCompositeActionTemplateSuite errors", resolveErrors);
      return new Action2Error(
        "FailedToResolveTemplate",
        "handleTestCompositeActionTemplateSuite resolveTestCompositeActionTemplateSuite errors for entries: " +
          JSON.stringify(
            resolveErrors.map((e) => e[0]),
            null,
            2
          ),
        [],
        resolveErrors[0] as any
      );
    }
    log.info(
      "handleTestCompositeActionTemplateSuite resolved testSuite template:",
      JSON.stringify(resolvedAction.resolvedTestCompositeActionDefinition)
    );

    const testSuiteResult: Record<string, TestResult> = {};

    return this.handleTestCompositeActionSuite(
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

