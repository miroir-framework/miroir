
import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
import {
  CRUDActionName,
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
const instanceConfigurationReference = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
const entityEntity = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
const entitySelfApplicationVersion = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');

import {
  ApplicationSection,
  ApplicationVersion,
  CompositeAction,
  CompositeActionDefinition,
  CompositeActionTemplate,
  DomainAction,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  RestPersistenceAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  RuntimeCompositeAction,
  SelfApplicationDeploymentConfiguration,
  Test,
  TestAssertion,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplateSuite,
  TestRuntimeCompositeAction,
  TestRuntimeCompositeActionSuite,
  TransactionalInstanceAction,
  TransformerForRuntime,
  UndoRedoAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { ACTION_OK } from "../1_core/constants";
import { defaultMiroirMetaModel, metaModelEntities, miroirModelEntities } from "../1_core/Model";
import { resolveCompositeActionTemplate } from "../2_domain/ResolveCompositeActionTemplate";
import { transformer_extended_apply } from "../2_domain/TransformersForRuntime.js";
import { LoggerGlobalContext } from '../4_services/LoggerContext.js';
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";

const selfApplicationMiroir = require('../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json');
const selfApplicationDeploymentMiroir = require('../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json');
const selfApplicationModelBranchMiroirMasterBranch = require('../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json');
const selfApplicationVersionInitialMiroirVersion = require('../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json');
const selfApplicationStoreBasedConfigurationMiroir = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');

import { resolvePathOnObject } from "../tools";
import { cleanLevel } from "./constants";
import { Endpoint } from "./Endpoint";
import { CallUtils } from "./ErrorHandling/CallUtils";
import { TestSuiteContext } from '../4_services/TestSuiteContext.js';
import { resolveTestCompositeActionTemplateSuite } from '../2_domain/TestSuiteTemplate.js';
import { Action2Error, Action2ReturnType, Action2VoidReturnType, Domain2ElementFailed } from '../0_interfaces/2_domain/DomainElement.js';
import { TestResult } from '../0_interfaces/4-services/TestInterface.js';
import { ignorePostgresExtraAttributesOnList, ignorePostgresExtraAttributesOnObject } from '../4_services/otherTools.js';
import { ConfigurationService } from './ConfigurationService.js';



let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainController")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface DeploymentConfiguration {
  adminConfigurationDeployment: EntityInstance,
  selfApplicationDeployment: SelfApplicationDeploymentConfiguration,
}

// ################################################################################################
export async function resetAndInitApplicationDeployment(
  domainController: DomainControllerInterface,
  selfAdminConfigurationDeployments: SelfApplicationDeploymentConfiguration[], // TODO: use Deployment Entity Type!
) {
  // const deployments = [adminConfigurationDeploymentLibrary, adminConfigurationDeploymentMiroir];

  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: selfAdminConfigurationDeployment.uuid,
    }, defaultMiroirMetaModel);
  }
  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: selfAdminConfigurationDeployment.uuid,
      params: {
        dataStoreType: selfAdminConfigurationDeployment.uuid == adminConfigurationDeploymentMiroir.uuid?"miroir":"app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
        selfApplication: selfApplicationMiroir,
        // selfApplicationDeploymentConfiguration: selfAdminConfigurationDeployment,
        applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
        // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
        applicationVersion: selfApplicationVersionInitialMiroirVersion,
      },
    }, defaultMiroirMetaModel);
  }
  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetAndInitApplicationDeployment APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );
  for (const d of selfAdminConfigurationDeployments) {
    log.info("resetAndInitApplicationDeployment rollback for deployment", d.uuid);
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.uuid,
    }, defaultMiroirMetaModel);
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

  getPersistenceStoreAccessMode(): "local" | "remote" {
    return this.persistenceStoreAccessMode;
  }
  // ##############################################################################################
  // TODO: remove? only used in commented code in index.tsx
  getRemoteStore(): PersistenceStoreLocalOrRemoteInterface {
    return this.persistenceStoreLocalOrRemote;
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
    undoRedoAction: UndoRedoAction,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainUndoRedoAction start actionName",
      undoRedoAction["actionName"],
      "deployment",
      deploymentUuid,
      "action",
      undoRedoAction
    );
    try {
      switch (undoRedoAction.actionName) {
        case "undo":
        case "redo": {
          this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
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
        undoRedoAction["actionName"],
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
    deploymentUuid: string
  ): Promise<Action2VoidReturnType> {
    log.info(
      "DomainController loadConfigurationFromPersistenceStore called for deployment",
      deploymentUuid
    );
    try {
      await this.callUtil
        .callRemotePersistenceAction(
          {}, // context
          {
            addResultToContextAsName: "dataEntitiesFromModelSection",
            expectedDomainElementType: "entityInstanceCollection",
          }, // context update
          // deploymentUuid,
          {
            actionType: "RestPersistenceAction",
            actionName: "read",
            endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
            deploymentUuid,
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            section: "model",
          }
        )
        .then(async (context) => {
          if (context instanceof Action2Error) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore could not fetch entity instance list " +
                JSON.stringify(context, undefined, 2)
            );
          }

          log.info(
            "DomainController loadConfigurationFromPersistenceStore fetched list of Entities for deployment",
            deploymentUuid,
            "found data entities from Model Section dataEntitiesFromModelSection",
            context.dataEntitiesFromModelSection
          );

          if (
            !context.dataEntitiesFromModelSection ||
            context.dataEntitiesFromModelSection instanceof Action2Error
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
            );
          }

          if (
            !context.dataEntitiesFromModelSection.returnedDomainElement ||
            context.dataEntitiesFromModelSection.returnedDomainElement instanceof
              Domain2ElementFailed
          ) {
            throw new Error(
              "DomainController loadConfigurationFromPersistenceStore could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
            );
          }

          // TODO: information has to come from localCacheSlice, not from hard-coded source!
          const modelEntitiesToFetch: MetaEntity[] =
            deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? miroirModelEntities
              : metaModelEntities;
          const dataEntitiesToFetch: MetaEntity[] =
            deploymentUuid == adminConfigurationDeploymentMiroir.uuid
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
            "DomainController loadConfigurationFromPersistenceStore for deployment",
            deploymentUuid,
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
            "DomainController loadConfigurationFromPersistenceStore for deployment",
            deploymentUuid,
            "found entities to fetch",
            toFetchEntities.map((e) => ({
              section: e.section,
              name: e.entity.name,
              uuid: e.entity.uuid,
            }))
          );
          let instances: EntityInstanceCollection[] = []; //TODO: replace with functional implementation
          let latestInstances: EntityInstanceCollection | undefined = undefined; //TODO: replace with functional implementation
          for (const e of toFetchEntities) {
            // makes sequential calls to interface. Make parallel calls instead using Promise.all?
            log.info(
              "DomainController loadConfigurationFromPersistenceStore fecthing instances from server for entity",
              JSON.stringify(e, undefined, 2)
            );
            await this.callUtil
              .callRemotePersistenceAction(
                {}, // context
                {
                  addResultToContextAsName: "entityInstanceCollection",
                  expectedDomainElementType: "entityInstanceCollection",
                }, // context update
                {
                  actionType: "RestPersistenceAction",
                  actionName: "read",
                  endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                  deploymentUuid,
                  parentName: e.entity.name,
                  parentUuid: e.entity.uuid,
                  section: e.section,
                }
              )
              .then((context: Record<string, any>) => {
                // TODO: is logging whithin this function independent of logging configuration?
                // log.trace(
                //   "DomainController loadConfigurationFromRemoteDataStore found instances for entity",
                //   e.entity["name"],
                //   entityInstanceCollection
                // );
                log.info(
                  "DomainController loadConfigurationFromPersistenceStore found instances for section",
                  e.section,
                  "entity",
                  e.entity.name
                );
                instances.push(context["entityInstanceCollection"].returnedDomainElement);
                latestInstances = context["entityInstanceCollection"].returnedDomainElement;
                return context;
              })
              .then((context: Record<string, any>) => {
                if (!latestInstances) {
                  throw new Error(
                    "DomainController loadConfigurationFromPersistenceStore could not fetch entity instance list " +
                      // JSON.stringify(context.dataEntitiesFromModelSection.map((e: any) => e.name), undefined, 2)
                      JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
                  );
                }
                return this.callUtil.callLocalCacheAction(
                  context, // context
                  {}, // context update
                  {
                    actionType: "instanceAction",
                    actionName: "loadNewInstancesInLocalCache",
                    deploymentUuid,
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: [latestInstances],
                  }
                );
              })
              .catch((reason) => log.error(reason));
          }

          // removes current transaction
          await this.callUtil.callLocalCacheAction(
            context, // context
            {}, // context update
            {
              actionType: "modelAction",
              actionName: "rollback",
              deploymentUuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            }
          );

          log.info(
            "DomainController loadConfigurationFromPersistenceStore done rollback, currentTransaction=",
            this.currentTransaction()
          );

          log.debug(
            "DomainController loadConfigurationFromPersistenceStore",
            deploymentUuid,
            "all instances stored!",
            toFetchEntities.map((e) => ({ section: e.section, uuid: e.entity.uuid }))
            // JSON.stringify(this.localCache.getState(), circularReplacer())
          );
          return context;
        });
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
    runBoxedExtractorOrQueryAction: RunBoxedQueryAction | RunBoxedExtractorOrQueryAction
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    try {
      LoggerGlobalContext.setAction(runBoxedExtractorOrQueryAction.actionName);
      log.info(
        "handleBoxedExtractorOrQueryAction",
        // "deploymentUuid",
        // runBoxedExtractorOrQueryAction.deploymentUuid,
        "persistenceStoreAccessMode=",
        this.persistenceStoreAccessMode,
        "actionName=",
        (runBoxedExtractorOrQueryAction as any).actionName,
        "actionType=",
        runBoxedExtractorOrQueryAction?.actionType,
        "queryExecutionStrategy=",
        runBoxedExtractorOrQueryAction.queryExecutionStrategy,
        "objects=",
        JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2)
      );
      /**
       * TODO: if the query is contaioned whithin a transactional action, it shall only access the localCache
       * if a query is contained whithin a composite action, then it shall access only the persistent storage (?)
       * handle the case of transactionInstanceActions...
       */
      if (this.persistenceStoreAccessMode == "local") {
        /**
         * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
         */

        const result: Action2ReturnType =
          await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalPersistenceStore(
            runBoxedExtractorOrQueryAction
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
          runBoxedExtractorOrQueryAction.queryExecutionStrategy ?? "storage";
        switch (executionStrategy) {
          case "ServerCache":
          case "localCacheOrFetch": {
            throw new Error(
              "DomainController handleBoxedExtractorOrQueryAction could not handle queryExecutionStrategy " +
                runBoxedExtractorOrQueryAction.queryExecutionStrategy
            );
          }
          case "localCacheOrFail": {
            const result =
              await this.persistenceStoreLocalOrRemote.handlePersistenceActionForLocalCache(
                runBoxedExtractorOrQueryAction
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
                runBoxedExtractorOrQueryAction
              );
            // const result = await this.callUtil.callRemotePersistenceAction(
            //   // what if it is a REAL persistence store?? exception?
            //   {}, // context
            //   {
            //     addResultToContextAsName: "dataEntitiesFromModelSection",
            //     expectedDomainElementType: "entityInstanceCollection",
            //   }, // continuation
            //   runBoxedExtractorOrQueryAction
            // );
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
                runBoxedExtractorOrQueryAction.queryExecutionStrategy
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
        "actionName",
        (runBoxedExtractorOrQueryAction as any).actionName,
        "actionType",
        runBoxedExtractorOrQueryAction?.actionType,
        "objects",
        JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2)
      );
    } finally {
      LoggerGlobalContext.setAction(undefined);
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
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleQueryTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedQueryTemplateOrBoxedExtractorTemplateAction.deploymentUuid,
      "actionName",
      (runBoxedQueryTemplateAction as any).actionName,
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
          runBoxedQueryTemplateAction
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
      const result = await this.callUtil.callRemotePersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
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
    runBoxedExtractorTemplateAction: RunBoxedExtractorTemplateAction
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleBoxedExtractorTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedQueryTemplateOrBoxedExtractorTemplateAction.deploymentUuid,
      "actionName",
      (runBoxedExtractorTemplateAction as any).actionName,
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
          runBoxedExtractorTemplateAction
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
      const result = await this.callUtil.callRemotePersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
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
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
  ): Promise<Action2ReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedQueryTemplateOrBoxedExtractorTemplateAction.deploymentUuid,
      "actionName",
      (runBoxedQueryTemplateOrBoxedExtractorTemplateAction as any).actionName,
      "actionType",
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction?.actionType,
      "objects",
      JSON.stringify(
        (runBoxedQueryTemplateOrBoxedExtractorTemplateAction as any)["objects"],
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
          runBoxedQueryTemplateOrBoxedExtractorTemplateAction
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
      const result = await this.callUtil.callRemotePersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
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
    deploymentUuid: Uuid,
    instanceAction: InstanceAction
  ): Promise<Action2VoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainNonTransactionalInstanceAction deployment",
      deploymentUuid,
      "instanceAction",
      instanceAction
      // domainDataNonTransactionalCUDAction.actionName,
      // domainDataNonTransactionalCUDAction.objects
    );
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)

    // The same action is performed on the local cache and on the remote store for Data Instances.
    await this.callUtil.callRemotePersistenceAction(
      {}, // context
      {}, // context update
      // deploymentUuid,
      instanceAction
    );
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
      deploymentUuid,
      "handleDomainNonTransactionalInstanceAction done calling handleRemoteStoreRestCRUDAction",
      instanceAction
    );
    await this.callUtil.callLocalCacheAction(
      {}, // context
      {}, // context update
      instanceAction
    );

    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
      deploymentUuid,
      "handleDomainNonTransactionalInstanceAction end",
      instanceAction
    );
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // converts a Domain model action into a set of local cache actions and remote store actions
  async handleModelAction(
    deploymentUuid: Uuid,
    modelAction: ModelAction,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction START actionName=",
      modelAction["actionName"],
      "deployment",
      deploymentUuid,
      "action",
      modelAction.actionName != "initModel" ? JSON.stringify(modelAction, null, 2) : modelAction
      // modelAction,
    );
    try {
      switch (modelAction.actionName) {
        case "remoteLocalCacheRollback": {
          if (this.persistenceStoreAccessMode == "local") {
            // if the domain controller is deployed on the server, we refresh the local cache from the remote store
            log.info(
              "handleModelAction reloading current configuration from local PersistenceStore!"
            );
            await this.loadConfigurationFromPersistenceStore(deploymentUuid);
            log.info(
              "handleModelAction reloading current configuration from local PersistenceStore DONE!"
            );
          } else {
            // if the domain controller is deployed on the client, we send the "remoteLocalCacheRollback" action to the server
            await this.callUtil.callRemotePersistenceAction(
              {}, // context
              {}, // context update
              modelAction
            );
          }
          break;
        }
        case "rollback": {
          await this.loadConfigurationFromPersistenceStore(deploymentUuid);
          break;
        }
        case "alterEntityAttribute":
        case "createEntity":
        case "renameEntity":
        case "dropEntity": {
          if (modelAction.transactional == false) {
            // the modelAction is not transactional, we update the persistentStore directly
            log.warn("handleModelAction running for non-transactional action!");
            await this.callUtil.callRemotePersistenceAction(
              {}, // context
              {}, // context update
              modelAction
            );
            log.info("handleModelAction running for non-transactional action DONE!");
          }
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            modelAction
          );
          break;
        }
        case "resetModel":
        case "resetData":
        case "initModel": {
          // await this.callAsyncActionHandler(modelAction, "*", currentModel, {}, {}, modelAction);
          await this.callUtil.callRemotePersistenceAction(
            {}, // context
            {}, // context update
            modelAction
          );
          break;
        }
        case "commit": {
          log.debug(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit",
            this.localCache.currentTransaction()
          );

          if (!currentModel) {
            throw new Error(
              "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions."
            );
          } else {
            const sectionOfapplicationEntities: ApplicationSection =
              modelAction.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
                ? "data"
                : "model";
            const newModelVersionUuid = uuidv4();
            // const newModelVersion: MiroirApplicationVersionOLD_DO_NOT_USE = {
            const newModelVersion: ApplicationVersion = {
              uuid: newModelVersionUuid,
              // conceptLevel: "Data",
              parentName: entitySelfApplicationVersion?.name,
              parentUuid: entitySelfApplicationVersion?.uuid,
              description: "TODO: no description yet",
              name: "TODO: No label was given to this version.",
              // previousVersion: currentModel?.configuration[0]?.definition?.currentApplicationVersion,
              previousVersion: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: how to get the previous version? The current version shall be found somewhere in the schema
              branch: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              selfApplication: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
            };

            log.debug(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit create new version",
              newModelVersion
            );
            const newModelVersionAction: RestPersistenceAction = {
              actionType: "RestPersistenceAction",
              actionName: "create",
              deploymentUuid,
              endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
              section: sectionOfapplicationEntities,
              objects: [newModelVersion],
            };

            // in the case of the Miroir app, this should be done in the 'data' section
            await this.callUtil.callRemotePersistenceAction(
              {}, // context
              {}, // context update
              // deploymentUuid,
              newModelVersionAction
            );
            log.debug(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit new version created",
              newModelVersion
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
                  await this.callUtil.callRemotePersistenceAction(
                    {}, // context
                    {}, // context update
                    {
                      actionType: "RestPersistenceAction",
                      actionName:
                        replayAction.instanceAction.actionName.toString() as CRUDActionName,
                      endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                      deploymentUuid,
                      section: replayAction.instanceAction.applicationSection,
                      parentName: replayAction.instanceAction.objects[0].parentName,
                      parentUuid: replayAction.instanceAction.objects[0].parentUuid,
                      objects: replayAction.instanceAction.objects[0].instances,
                    }
                  );
                  break;
                }
                case "modelAction": {
                  await this.callUtil.callRemotePersistenceAction(
                    {}, // context
                    {}, // context update
                    {
                      ...replayAction,
                      transactional: false,
                    }
                  );
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
                {}, // context update
                {
                  actionType: "modelAction",
                  actionName: "commit",
                  deploymentUuid: modelAction.deploymentUuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                }
              )
              .then((context) => {
                log.debug(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed and notified to local cache, currentTransaction:",
                  this.localCache.currentTransaction()
                );
                return this.callUtil.callLocalCacheAction(
                  {}, // context
                  {}, // context update
                  {
                    actionType: "instanceAction",
                    actionName: "createInstance",
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    deploymentUuid: modelAction.deploymentUuid,
                    applicationSection: "model",
                    objects: [
                      {
                        parentUuid: newModelVersion.parentUuid,
                        applicationSection: sectionOfapplicationEntities,
                        instances: [newModelVersion],
                      },
                    ],
                  }
                );
              })
              .then((context) => {
                const updatedConfiguration = Object.assign({}, instanceConfigurationReference, {
                  definition: { currentApplicationVersion: newModelVersionUuid },
                });
                log.debug(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit updating configuration",
                  updatedConfiguration
                );
                const newStoreBasedConfiguration: RestPersistenceAction = {
                  actionType: "RestPersistenceAction",
                  actionName: "update",
                  endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
                  deploymentUuid,
                  section: sectionOfapplicationEntities,
                  objects: [updatedConfiguration],
                };
                // TODO: in the case of the Miroir app, this should be in the 'data'section
                return this.callUtil.callRemotePersistenceAction(
                  {}, // context
                  {}, // context update
                  newStoreBasedConfiguration
                );
              });
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done!"
            );
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
        modelAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        modelAction,
        "exception",
        error
      );
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleAction(
    domainAction: DomainAction,
    currentModel?: MetaModel
  ): Promise<Action2VoidReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    // log.info(
    //   "handleAction",
    //   "deploymentUuid",
    //   domainAction.deploymentUuid,
    //   "actionName",
    //   (domainAction as any).actionName,
    //   "actionType",
    //   domainAction?.actionType,
    //   "objects",
    //   JSON.stringify((domainAction as any)["objects"], null, 2)
    // );

    if (domainAction.actionType != "modelAction" || domainAction.actionName != "initModel") {
      log.debug(
        "DomainController handleAction domainAction",
        JSON.stringify(domainAction, null, 2)
      );
    } else {
      log.debug("DomainController handleAction domainAction", domainAction);
    }
    // if (!domainAction.deploymentUuid) {
    //   throw new Error("waaaaa");

    // }
    try {
      LoggerGlobalContext.setAction(domainAction.actionType);
      switch (domainAction.actionType) {
        case "compositeAction": {
          // old school, not used anymore (or should not be used anymore)
          throw new Error(
            "DomainController handleAction compositeAction should not be used anymore"
          );
          break;
        }
        case "modelAction": {
          if (!currentModel) {
            throw new Error(
              "DomainController handleAction for modelAction needs a currentModel argument"
            );
          }
          return this.handleModelAction(domainAction.deploymentUuid, domainAction, currentModel);
        }
        case "instanceAction": {
          return this.handleInstanceAction(domainAction.deploymentUuid, domainAction);
        }
        case "storeManagementAction": {
          if (domainAction.actionName == "resetAndInitApplicationDeployment") {
            await resetAndInitApplicationDeployment(
              this,
              domainAction.deployments as any as SelfApplicationDeploymentConfiguration[]
            ); // TODO: works because only uuid of deployments is accessed in resetAndInitApplicationDeployment
            // await this.callAsyncActionHandler(domainAction, "*", currentModel, this, domainAction.deployments);
          } else {
            try {
              switch (this.persistenceStoreAccessMode) {
                case "local": {
                  await this.persistenceStoreLocalOrRemote.handleStoreOrBundleActionForLocalStore(
                    domainAction
                  );
                  // await this.callAsyncActionHandler(domainAction, "local", currentModel, domainAction);
                  break;
                }
                case "remote": {
                  await this.callUtil.callRemotePersistenceAction(
                    {}, // context
                    {}, // context update
                    domainAction
                  );
                  // await this.callAsyncActionHandler(domainAction, "remote", currentModel, {}, {}, domainAction);
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
                "deployment",
                domainAction.deploymentUuid,
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
            await this.callUtil.callRemotePersistenceAction(
              {}, // context
              {}, // context update
              // deploymentUuid,
              domainAction
            );
          } catch (error) {
            log.warn(
              "DomainController handleAction caught exception when handling",
              domainAction.actionType,
              "deployment",
              domainAction.deploymentUuid,
              "action",
              domainAction,
              "exception",
              error
            );
          }
          return Promise.resolve(ACTION_OK);
          break;
        }
        case "undoRedoAction": {
          if (!currentModel) {
            throw new Error(
              "DomainController handleAction for undoRedoAction needs a currentModel argument"
            );
          }
          // TODO: create callSyncActionHandler
          // return this.callAsyncActionHandler(domainAction, "*", currentModel, domainAction.deploymentUuid, domainAction, currentModel);
          return this.handleDomainUndoRedoAction(
            domainAction.deploymentUuid,
            domainAction,
            currentModel
          );
        }
        case "transactionalInstanceAction": {
          try {
            await this.callUtil.callLocalCacheAction(
              {}, // context
              {}, // context update
              domainAction
            );
          } catch (error) {
            log.warn(
              "DomainController handleAction caught exception when handling",
              domainAction.actionType,
              "deployment",
              domainAction.deploymentUuid,
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
      return new Action2Error(
        "FailedToHandleAction",
        "DomainController handleAction caught error: " + JSON.stringify(error, null, 2)
      );
    } finally {
      LoggerGlobalContext.setAction(undefined);
    }
  }

  // ##############################################################################################
  // TODO: used in tests only?!
  async handleCompositeAction(
    compositeAction: CompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleCompositeAction compositeAction",
      JSON.stringify(compositeAction, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams)
    );
    // log.info("handleCompositeAction compositeAction", JSON.stringify(compositeAction, null, 2), "localActionParams keys", Object.keys(localActionParams));
    // log.info("handleCompositeAction compositeAction", compositeAction, "localActionParams", localActionParams);

    for (const currentAction of compositeAction.definition) {
      let actionResult: Action2ReturnType | undefined = undefined;
      try {
        LoggerGlobalContext.setAction(currentAction.actionLabel);
        // log.info(
        //   "handleCompositeAction compositeInstanceAction handling sub currentAction",
        //   JSON.stringify(currentAction, null, 2),
        //   // currentAction,
        //   "localContext keys",
        //   Object.keys(localContext),
        // );
        switch (currentAction.actionType) {
          case "compositeAction": {
            // composite pattern, recursive call
            log.info(
              "handleCompositeAction compositeAction action to handle",
              JSON.stringify(currentAction, null, 2)
            );
            actionResult = await this.handleCompositeAction(
              currentAction,
              actionParamValues,
              currentModel
            );
            break;
          }
          case "undoRedoAction":
          case "modelAction":
          case "instanceAction":
          case "transactionalInstanceAction":
          case "storeManagementAction":
          case "bundleAction": {
            // these are PreActions, the runtime transformers present in them must be resolved before the action is executed
            if (
              currentAction.actionType !== "modelAction" ||
              currentAction.actionName !== "initModel"
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
            actionResult = await this.handleAction(currentAction, currentModel);
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
              actionResult,
              localContext
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
              actionParamValues,
              actionResult,
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
            actionResult = this.handleTestCompositeActionAssertion(
              currentAction,
              localContext,
              actionResult
            );
            break;
          }
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
        log.error(
          "handleCompositeAction caught error",
          error,
          "for action",
          JSON.stringify(currentAction, null, 2)
        );
        return new Action2Error(
          "FailedTestAction",
          "handleCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType]
        );
      } finally {
        LoggerGlobalContext.setCompositeAction(undefined);
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // TODO: used in tests only?!
  async handleRuntimeCompositeAction(
    runtimeCompositeAction: RuntimeCompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info(
      "handleRuntimeCompositeAction compositeAction",
      JSON.stringify(runtimeCompositeAction, null, 2),
      "localActionParams keys",
      Object.keys(localActionParams)
    );
    // log.info("handleCompositeAction compositeAction", JSON.stringify(compositeAction, null, 2), "localActionParams keys", Object.keys(localActionParams));
    // log.info("handleCompositeAction compositeAction", compositeAction, "localActionParams", localActionParams);

    for (const currentAction of runtimeCompositeAction.definition) {
      let actionResult: Action2ReturnType | undefined = undefined;
      try {
        LoggerGlobalContext.setAction(currentAction.actionLabel);
        // log.info(
        //   "handleCompositeAction compositeInstanceAction handling sub currentAction",
        //   JSON.stringify(currentAction, null, 2),
        //   // currentAction,
        //   "localContext keys",
        //   Object.keys(localContext),
        // );
        switch (currentAction.actionType) {
          case "compositeAction": {
            // composite pattern, recursive call
            log.info(
              "handleCompositeAction compositeAction action to handle",
              JSON.stringify(currentAction, null, 2)
            );
            actionResult = await this.handleRuntimeCompositeAction(
              currentAction,
              actionParamValues,
              currentModel
            );
            break;
          }
          case "undoRedoAction":
          case "modelAction":
          case "instanceAction":
          case "transactionalInstanceAction":
          case "storeManagementAction":
          case "bundleAction": {
            // these are PreActions, the runtime transformers present in them must be resolved before the action is executed
            if (
              currentAction.actionType !== "modelAction" ||
              currentAction.actionName !== "initModel"
            ) {
              log.info(
                "handleCompositeAction domainAction action to handle",
                JSON.stringify(currentAction, null, 2)
              );
            }
            // TODO: resolve runtime transformers for all composite actions. Should there be preserved areas?
            const resolvedAction = transformer_extended_apply(
              "runtime",
              currentAction.actionLabel,
              currentAction as any as TransformerForRuntime,
              "value",
              actionParamValues, // queryParams
              localContext // contextResults
            );

            log.info(
              "handleCompositeAction resolvedAction action to handle",
              JSON.stringify(resolvedAction, null, 2)
            );
            actionResult = await this.handleAction(resolvedAction, currentModel);
            // actionResult = await this.handleAction(currentAction, currentModel);
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
              actionResult,
              localContext
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
              actionParamValues,
              actionResult,
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
            actionResult = this.handleTestCompositeActionAssertion(
              currentAction,
              localContext,
              actionResult
            );
            break;
          }
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
        log.error(
          "handleCompositeAction caught error",
          error,
          "for action",
          JSON.stringify(currentAction, null, 2)
        );
        return new Action2Error(
          "FailedTestAction",
          "handleCompositeAction error: " + JSON.stringify(error, null, 2),
          [currentAction.actionLabel ?? currentAction.actionType]
        );
      } finally {
        LoggerGlobalContext.setCompositeAction(undefined);
      }
    }
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
      TestSuiteContext.setTestAssertion(currentAction.testAssertion.testLabel);
      const prePreValueToTest = currentAction.testAssertion.definition.resultTransformer
        ? transformer_extended_apply(
            "runtime",
            undefined /**WHAT?? */,
            currentAction.testAssertion.definition.resultTransformer,
            "value",
            {},
            localContext
          )
        : localContext;

      const preValueToTest = resolvePathOnObject(
        prePreValueToTest,
        currentAction.testAssertion.definition.resultAccessPath ?? []
      );

      valueToTest = Array.isArray(preValueToTest)
        ? ignorePostgresExtraAttributesOnList(
            preValueToTest,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          )
        : ignorePostgresExtraAttributesOnObject(
            preValueToTest,
            currentAction.testAssertion.definition.ignoreAttributes ?? []
          );
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
        "handleCompositeAction compositeRunTestAssertion to handle",
        JSON.stringify(currentAction.testAssertion, null, 2),
        // "preValueToTest typeof", typeof preValueToTest,
        // "preValueToTest instanceof Array", preValueToTest instanceof Array,
        "preValueToTest is array",
        Array.isArray(preValueToTest),
        // "preValueToTest object proto is array", JSON.stringify(Object.prototype.toString.call(preValueToTest)),
        // "preValueToTest constuctor is array", preValueToTest.constructor === Array,
        "preValueToTest",
        JSON.stringify(preValueToTest, null, 2),
        "valueToTest",
        JSON.stringify(valueToTest, null, 2)
      );
      try {
        ConfigurationService.testImplementation
          .expect(valueToTest, currentAction.nameGivenToResult)
          .toEqual(expectedValue);
        // .toEqual(currentAction.testAssertion.definition.expectedValue);
        log.info(
          "handleCompositeAction compositeRunTestAssertion test passed",
          currentAction.testAssertion
        );
        actionResult = {
          status: "ok",
          returnedDomainElement: undefined,
        };
        TestSuiteContext.setTestAssertionResult({
          assertionName: currentAction.testAssertion.testLabel,
          assertionResult: "ok",
          // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
          // assertionActualValue: valueToTest,
        });
      } catch (error) {
        TestSuiteContext.setTestAssertionResult({
          assertionName: currentAction.testAssertion.testLabel,
          assertionResult: "error",
          assertionExpectedValue: currentAction.testAssertion.definition.expectedValue,
          assertionActualValue: valueToTest,
        });
        // return ACTION_OK;
        actionResult = ACTION_OK;
      }
    } catch (error) {
      log.error("handleCompositeAction compositeRunTestAssertion error", error);
      // TODO: 2 try catch blocks, one for the expect, one for the rest
      TestSuiteContext.setTestAssertionResult({
        assertionName: currentAction.testAssertion.testLabel,
        assertionResult: "error",
        // TODO: set error message
        // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
        // assertionActualValue: valueToTest,
      });
      throw new Error(
        "handleCompositeAction compositeRunTestAssertion error" + JSON.stringify(error, null, 2)
      );
    } finally {
      TestSuiteContext.setTestAssertion(undefined);
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
    actionParamValues: Record<string, any>,
    actionResult: Action2ReturnType | undefined,
    localContext: Record<string, any>
  ) {
    log.info(
      "handleCompositeAction runBoxedExtractorOrQueryAction to handle",
      currentAction,
      "with actionParamValues",
      actionParamValues
    );

    actionResult = await this.handleBoxedExtractorOrQueryAction(currentAction.query);
    if (actionResult instanceof Action2Error) {
      log.error(
        "Error on runBoxedExtractorOrQueryAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "query=",
        JSON.stringify(actionResult, null, 2)
      );
    } else {
      if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error on runBoxedExtractorOrQueryAction with nameGivenToResult",
          currentAction.nameGivenToResult,
          "query=",
          JSON.stringify(actionResult, null, 2)
        );
      } else {
        log.info(
          "handleCompositeAction runBoxedExtractorOrQueryAction adding result to context as",
          currentAction.nameGivenToResult,
          "value",
          JSON.stringify(actionResult, null, 2)
        );
        localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
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
    actionResult: Action2ReturnType | undefined,
    localContext: Record<string, any>
  ) {
    if (currentAction.queryTemplate == undefined) {
      throw new Error("handleCompositeAction currentAction.queryTemplate is undefined");
    }

    // actionResult = await this.handleQueryTemplateActionForServerONLY(
    actionResult = await this.handleBoxedExtractorOrQueryAction(currentAction.queryTemplate);
    if (actionResult instanceof Action2Error) {
      log.error(
        "Error on handleCompositeAction with nameGivenToResult",
        currentAction.nameGivenToResult,
        "query=",
        JSON.stringify(actionResult, null, 2)
      );
    } else {
      if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(
          "Error on handleCompositeAction with nameGivenToResult",
          currentAction.nameGivenToResult,
          "query=",
          JSON.stringify(actionResult, null, 2)
        );
      } else {
        log.info(
          "handleCompositeActionTemplate adding result to context as",
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

  // ##############################################################################################
  private async handleCompositeRunBoxedQueryTemplateAction(
    currentAction: {
      actionType: "compositeRunBoxedQueryTemplateAction";
      actionLabel?: string | undefined;
      nameGivenToResult: string;
      queryTemplate: RunBoxedQueryTemplateAction;
    },
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
      currentAction.queryTemplate
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
          "handleCompositeActionTemplate handleCompositeRunBoxedQueryTemplateAction adding result to context as",
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
    compositeAction: CompositeActionTemplate,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };
    const actionLabel = (compositeAction as any).actionLabel ?? "no action label";
    log.info(
      "handleCompositeActionTemplate compositeAction",
      actionLabel,
      compositeAction,
      "localActionParams",
      localActionParams
    );
    const resolved: {
      // resolvedCompositeActionDefinition: CompositeActionDefinition;
      resolvedCompositeActionDefinition: CompositeAction;
      resolvedCompositeActionTemplates: Record<string, any>;
    } = resolveCompositeActionTemplate(compositeAction, localActionParams, currentModel); // resolves "build" temp

    log.info("handleCompositeActionTemplate", actionLabel, "localActionParams", localActionParams);
    log.info(
      "handleCompositeActionTemplate",
      actionLabel,
      "resolvedCompositeActionDefinition",
      resolved.resolvedCompositeActionDefinition
      // JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    );

    // TODO: replace with handleCompositeAction
    for (const currentAction of resolved.resolvedCompositeActionDefinition.definition) {
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
      switch (currentAction.actionType) {
        case "undoRedoAction":
        case "modelAction":
        case "instanceAction":
        case "transactionalInstanceAction":
        case "compositeAction":
        case "storeManagementAction":
        case "bundleAction": {
          // case "domainAction": {
          // log.info(
          //   "handleCompositeActionTemplate compositeInstanceAction action to resolve",
          //   JSON.stringify(currentAction.domainAction, null, 2)
          // );
          const resolvedActionTemplate: InstanceAction = transformer_extended_apply(
            "runtime",
            currentAction.actionLabel ?? "NO NAME",
            currentAction as any as TransformerForRuntime, // TODO: correct type
            "value",
            localActionParams,
            localContext
          ) as InstanceAction;
          log.info(
            "handleCompositeActionTemplate compositeInstanceAction",
            currentAction.actionLabel ?? "without step name",
            "resolved action Template",
            JSON.stringify(resolvedActionTemplate, null, 2)
          );
          // log.info("handleCompositeActionTemplate compositeInstanceAction current model", currentModel);

          const actionResult = await this.handleAction(resolvedActionTemplate, currentModel);
          if (actionResult instanceof Action2Error) {
            log.error(
              "handleCompositeActionTemplate compositeInstanceAction error on action",
              JSON.stringify(resolveCompositeActionTemplate, null, 2) +
                "actionResult" +
                JSON.stringify(actionResult, null, 2)
            );
            throw new Error(
              "handleCompositeActionTemplate compositeInstanceAction error on action" +
                JSON.stringify(resolveCompositeActionTemplate, null, 2) +
                "actionResult" +
                JSON.stringify(actionResult, null, 2)
            );
          }
          break;
        }
        // case "compositeRunBoxedQueryTemplateAction": {
        //   // const actionResult = await this.handleCompositeRunBoxedQueryTemplateAction(
        //   //   currentAction,
        //   //   actionParamValues,
        //   //   // actionResult,
        //   //   localContext
        //   // );
        //   log.info(
        //     "handleCompositeActionTemplate",
        //     actionLabel,
        //     "resolved query action",
        //     currentAction,
        //     "with actionParamValues",
        //     actionParamValues
        //   );

        //   const actionResult = await this.handleQueryTemplateActionForServerONLY(
        //     currentAction.queryTemplate
        //   );
        //   if (actionResult instanceof Action2Error) {
        //     log.error(
        //       "handleCompositeActionTemplate compositeRunBoxedQueryTemplateAction error on action",
        //       JSON.stringify(resolveCompositeActionTemplate, null, 2) +
        //         "actionResult" +
        //         JSON.stringify(actionResult, null, 2)
        //     );
        //   } else {
        //     if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        //       log.error(
        //         "handleCompositeActionTemplate compositeRunBoxedQueryTemplateAction error on action",
        //         JSON.stringify(resolveCompositeActionTemplate, null, 2) +
        //           "actionResult" +
        //           JSON.stringify(actionResult, null, 2)
        //       );
        //     } else {
        //       log.info(
        //         "handleCompositeActionTemplate",
        //         actionLabel,
        //         "query adding result to context as",
        //         currentAction.nameGivenToResult,
        //         "value",
        //         actionResult
        //       );
        //       localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
        //     }
        //   }
        //   break;
        // }
        // case "compositeRunBoxedExtractorTemplateAction": {
        //   const actionResult = await this.handleCompositeRunBoxedExtractorTemplateAction(
        //     currentAction,
        //     actionParamValues,
        //     // actionResult,
        //     localContext
        //   );

        //   // log.info(
        //   //   "handleCompositeActionTemplate",
        //   //   actionLabel,
        //   //   "resolved query action",
        //   //   currentAction,
        //   //   "with actionParamValues",
        //   //   actionParamValues
        //   // );

        //   // const actionResult = await this.handleBoxedExtractorTemplateActionForServerONLY(
        //   //   currentAction.queryTemplate
        //   // );
        //   // if (actionResult instanceof Action2Error) {
        //   //   log.error(
        //   //     "handleCompositeActionTemplate Error on compositeRunBoxedExtractorTemplateAction with nameGivenToResult",
        //   //     currentAction.nameGivenToResult,
        //   //     "query=",
        //   //     JSON.stringify(actionResult, null, 2)
        //   //   );
        //   // } else {
        //   //   if (actionResult.returnedDomainElement instanceof Domain2ElementFailed) {
        //   //     log.error(
        //   //       "handleCompositeActionTemplate Error on compositeRunBoxedExtractorTemplateAction with nameGivenToResult",
        //   //       currentAction.nameGivenToResult,
        //   //       "query=",
        //   //       JSON.stringify(actionResult, null, 2)
        //   //     );
        //   //   } else {
        //   //     log.info(
        //   //       "handleCompositeActionTemplate compositeRunBoxedExtractorTemplateAction",
        //   //       actionLabel,
        //   //       "query adding result to context as",
        //   //       currentAction.nameGivenToResult,
        //   //       "value",
        //   //       actionResult
        //   //     );
        //   //     localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement;
        //   //   }
        //   // }
        //   break;
        // }
        default: {
          log.error(
            "handleCompositeActionTemplate",
            actionLabel,
            "unknown actionType",
            currentAction
          );
          throw new Error(
            "handleCompositeActionTemplate " +
              actionLabel +
              " unknown actionType: " +
              currentAction.actionType
          );
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
   * @param currentModel
   * @returns
   */
  async handleTestCompositeAction(
    // testAction: TestAction_runTestCompositeAction,
    testAction: TestCompositeAction | TestRuntimeCompositeAction,
    // testAction: TestCompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
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
    // switch (testAction.actionName) {
    //   case "runTestCompositeAction": {
    TestSuiteContext.setTest(testAction.testLabel);

    if (testAction.beforeTestSetupAction) {
      log.info(
        "handleTestCompositeAction beforeAll",
        testAction.beforeTestSetupAction.actionLabel,
        testAction.beforeTestSetupAction
      );
      const beforeAllResult = await this.handleCompositeAction(
        testAction.beforeTestSetupAction,
        localActionParams,
        currentModel
      );
      if (beforeAllResult instanceof Action2Error) {
        log.error("Error on beforeTestSetupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.info("handleTestCompositeAction no beforeTestSetupAction!");
    }

    switch (testAction.testType) {
      case "testCompositeAction": {
        const localCompositeAction: CompositeAction = {
          ...testAction.compositeAction,
          definition: [
            ...testAction.compositeAction.definition,
            ...testAction.testCompositeActionAssertions,
          ],
        };
        const result = await this.handleCompositeAction(
          localCompositeAction,
          localActionParams,
          currentModel
        );
      }
      case "testRuntimeCompositeAction": {
        const localCompositeAction: RuntimeCompositeAction = {
          ...testAction.compositeAction,
          definition: [
            ...testAction.compositeAction.definition,
            ...testAction.testCompositeActionAssertions,
          ],
        };
        const result = await this.handleRuntimeCompositeAction(
          localCompositeAction,
          localActionParams,
          currentModel
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
        localActionParams,
        currentModel
      );
      if (beforeAllResult instanceof Action2Error) {
        log.error("Error on afterTestCleanupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.info("handleTestCompositeAction no afterTestCleanupAction!");
    }
    TestSuiteContext.setTest(undefined);

    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleTestCompositeActionSuite(
    // testAction: TestCompositeActionSuite,
    testAction: TestCompositeActionSuite | TestRuntimeCompositeActionSuite,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
    // ): Promise<Action2VoidReturnType> {
    // ): Promise<Action2ReturnType> {
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
      TestSuiteContext.setTestSuite(testAction.testLabel);

      if (testAction.beforeAll) {
        LoggerGlobalContext.setTest("beforeAll");
        log.info(
          "handleTestCompositeActionSuite beforeAll",
          testAction.beforeAll.actionLabel,
          testAction.beforeAll
        );
        const beforeAllResult = await this.handleCompositeAction(
          testAction.beforeAll,
          localActionParams,
          currentModel
        );
        if (beforeAllResult instanceof Action2Error) {
          log.error("Error on beforeAll", JSON.stringify(beforeAllResult, null, 2));
          TestSuiteContext.setTest(undefined);
          return new Action2Error(
            "FailedToSetupTest",
            "handleTestCompositeActionSuite beforeAll error: " +
              JSON.stringify(beforeAllResult.errorMessage, null, 2),
            beforeAllResult.errorStack,
            beforeAllResult
          );
        }
        LoggerGlobalContext.setTest(undefined);
      } else {
        log.info("handleTestCompositeActionSuite no beforeAll!");
      }

      for (const testCompositeAction of Object.entries(testAction.testCompositeActions) as [string,(TestCompositeAction | TestRuntimeCompositeAction)][]) {
        // expect.getState().currentTestName = testCompositeAction[0];
        log.info("handleTestCompositeActionSuite test", testCompositeAction[0], "beforeEach");

        if (testAction.beforeEach) {
          log.info(
            "handleTestCompositeActionSuite beforeEach",
            testAction.beforeEach.actionLabel,
            testAction.beforeEach
          );
          LoggerGlobalContext.setTest(testCompositeAction[1].testLabel + ".beforeEach");
          const beforeEachResult = await this.handleCompositeAction(
            testAction.beforeEach,
            localActionParams,
            currentModel
          );
          if (beforeEachResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on beforeEach",
              JSON.stringify(beforeEachResult, null, 2)
            );
            TestSuiteContext.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite error: " +
                JSON.stringify(beforeEachResult.errorMessage, null, 2),
              beforeEachResult.errorStack,
              beforeEachResult
            );
          }
          LoggerGlobalContext.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no beforeEach!");
        }

        if (testCompositeAction[1].beforeTestSetupAction) {
          TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".beforeTestSetupAction");
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "beforeTestSetupAction",
            testCompositeAction[1].beforeTestSetupAction.actionLabel,
            testCompositeAction[1].beforeTestSetupAction
          );
          const beforeTestResult = await this.handleCompositeAction(
            testCompositeAction[1].beforeTestSetupAction,
            localActionParams,
            currentModel
          );
          if (beforeTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on beforeTestSetupAction",
              JSON.stringify(beforeTestResult, null, 2)
            );
            TestSuiteContext.setTest(undefined);
            return new Action2Error(
              "FailedToSetupTest",
              "handleTestCompositeActionSuite beforeTest error: " +
                JSON.stringify(beforeTestResult.errorMessage, null, 2),
              beforeTestResult.errorStack,
              beforeTestResult
            );
          }
          TestSuiteContext.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no beforeTestSetupAction!"
          );
        }

        let testResult: Action2ReturnType | undefined = undefined;
        switch (testCompositeAction[1].testType) {
          case 'testRuntimeCompositeAction': {
            const localTestCompositeAction: RuntimeCompositeAction = {
              ...testCompositeAction[1].compositeAction,
              definition: [
                ...testCompositeAction[1].compositeAction.definition,
                ...testCompositeAction[1].testCompositeActionAssertions,
              ],
            };
            TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            testResult = await this.handleRuntimeCompositeAction(
              localTestCompositeAction,
              localActionParams,
              currentModel
            );
            break;
          }
          case 'testCompositeAction': {
            const localTestCompositeAction: CompositeAction = {
              ...testCompositeAction[1].compositeAction,
              definition: [
                ...testCompositeAction[1].compositeAction.definition,
                ...testCompositeAction[1].testCompositeActionAssertions,
              ],
            };
            TestSuiteContext.setTest(testCompositeAction[1].testLabel);
            testResult = await this.handleCompositeAction(
              localTestCompositeAction,
              localActionParams,
              currentModel
            );
            break;
          }
        }
        if (testResult instanceof Action2Error) {
          TestSuiteContext.setTest(undefined);
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
        }
        TestSuiteContext.setTest(undefined);

        if (testCompositeAction[1].afterTestCleanupAction) {
          TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterTestCleanupAction");
          log.info(
            "handleTestCompositeAction",
            testCompositeAction[0],
            "afterTestCleanupAction",
            testCompositeAction[1].afterTestCleanupAction.actionLabel,
            testCompositeAction[1].afterTestCleanupAction
          );
          const afterTestResult = await this.handleCompositeAction(
            testCompositeAction[1].afterTestCleanupAction,
            localActionParams,
            currentModel
          );
          if (afterTestResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeAction",
              testCompositeAction[0],
              "Error on afterTestCleanupAction",
              JSON.stringify(afterTestResult, null, 2)
            );
            TestSuiteContext.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterTestCleanup error: " +
                JSON.stringify(afterTestResult.errorMessage, null, 2),
              ["afterTestCleanupAction", ...(afterTestResult.errorStack ?? [])],
              afterTestResult
            );
          }
          TestSuiteContext.setTest(undefined);
        } else {
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "no afterTestSetupAction!"
          );
        }

        if (testAction.afterEach) {
          TestSuiteContext.setTest(testCompositeAction[1].testLabel + ".afterEach");
          log.info(
            "handleTestCompositeActionSuite",
            testCompositeAction[0],
            "afterEach",
            testAction.afterEach.actionLabel,
            testAction.beforeAll
          );
          const beforeAllResult = await this.handleCompositeAction(
            testAction.afterEach,
            localActionParams,
            currentModel
          );
          if (beforeAllResult instanceof Action2Error) {
            log.error(
              "handleTestCompositeActionSuite",
              testCompositeAction[0],
              "Error on afterEach",
              JSON.stringify(beforeAllResult, null, 2)
            );
            TestSuiteContext.setTest(undefined);
            return new Action2Error(
              "FailedToTeardownTest",
              "handleTestCompositeActionSuite afterEach error: " +
                JSON.stringify(beforeAllResult.errorMessage, null, 2),
              beforeAllResult.errorStack,
              beforeAllResult
            );
          }
          TestSuiteContext.setTest(undefined);
        } else {
          log.info("handleTestCompositeActionSuite", testCompositeAction[0], "no afterEach!");
        }
      }

      if (testAction.afterAll) {
        TestSuiteContext.setTest("afterAll");
        log.info(
          "handleTestCompositeActionSuite afterAll",
          testAction.afterAll.actionLabel,
          testAction.beforeAll
        );
        const afterAllResult = await this.handleCompositeAction(
          testAction.afterAll,
          localActionParams,
          currentModel
        );
        if (afterAllResult instanceof Action2Error) {
          log.error("Error on afterAll", JSON.stringify(afterAllResult, null, 2));
          TestSuiteContext.setTest(undefined);
          return new Action2Error(
            "FailedToTeardownTest",
            "handleTestCompositeActionSuite afterAll error: " +
              JSON.stringify(afterAllResult.errorMessage, null, 2),
            afterAllResult.errorStack,
            afterAllResult
          );
        }
        TestSuiteContext.setTest(undefined);
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
      TestSuiteContext.resetContext();
    }
  }

  // ##############################################################################################
  async handleTestCompositeActionTemplateSuite(
    testAction: TestCompositeActionTemplateSuite,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
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
    } = resolveTestCompositeActionTemplateSuite(testAction, localActionParams, currentModel);

    const resolveErrors = Object.entries(
      resolvedAction.resolvedTestCompositeActionDefinition.testCompositeActions
    ).filter(
      (e: [string, TestCompositeAction]) =>
        (e[1].compositeAction.definition as any).queryFailure != undefined
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
      localActionParams,
      currentModel
    );
  }

  // // ################################################################################################
  // async handleTestCompositeActionAssertion(
  //   // compositeAction: CompositeAction,
  //   compositeRunTestAssertion: {
  //     actionType: "compositeRunTestAssertion";
  //     actionLabel?: string | undefined;
  //     nameGivenToResult: string;
  //     testAssertion: TestAssertion;
  //   },
  //   actionParamValues: Record<string, any>,
  //   currentModel: MetaModel
  // ): Promise<Action2VoidReturnType> {
  //   let actionResult: Action2VoidReturnType | undefined = undefined;
  //   const localActionParams = { ...actionParamValues };
  //   let localContext: Record<string, any> = { ...actionParamValues };

  //   if (!ConfigurationService.testImplementation) {
  //     throw new Error(
  //       "ConfigurationService.testImplementation is not set, please inject a test implementation using ConfigurationService.registerTestImplementation on startup if you want to run tests at runtime."
  //     );
  //   }
  //   let valueToTest: any = undefined;
  //   try {
  //     TestSuiteContext.setTestAssertion(compositeRunTestAssertion.testAssertion.testLabel);
  //     const prePreValueToTest = compositeRunTestAssertion.testAssertion.definition.resultTransformer
  //       ? transformer_extended_apply(
  //           "runtime",
  //           undefined /**WHAT?? */,
  //           compositeRunTestAssertion.testAssertion.definition.resultTransformer,
  //           "value",
  //           {},
  //           localContext
  //         )
  //       : localContext;

  //     const preValueToTest = resolvePathOnObject(
  //       prePreValueToTest,
  //       compositeRunTestAssertion.testAssertion.definition.resultAccessPath ?? []
  //     );

  //     valueToTest = Array.isArray(preValueToTest)
  //       ? ignorePostgresExtraAttributesOnList(
  //           preValueToTest,
  //           compositeRunTestAssertion.testAssertion.definition.ignoreAttributes ?? []
  //         )
  //       : ignorePostgresExtraAttributesOnObject(
  //           preValueToTest,
  //           compositeRunTestAssertion.testAssertion.definition.ignoreAttributes ?? []
  //         );
  //     log.info(
  //       "handleCompositeAction compositeRunTestAssertion to handle",
  //       JSON.stringify(compositeRunTestAssertion.testAssertion, null, 2),
  //       // "preValueToTest typeof", typeof preValueToTest,
  //       // "preValueToTest instanceof Array", preValueToTest instanceof Array,
  //       "preValueToTest is array",
  //       Array.isArray(preValueToTest),
  //       // "preValueToTest object proto is array", JSON.stringify(Object.prototype.toString.call(preValueToTest)),
  //       // "preValueToTest constuctor is array", preValueToTest.constructor === Array,
  //       "preValueToTest",
  //       JSON.stringify(preValueToTest, null, 2),
  //       "valueToTest",
  //       JSON.stringify(valueToTest, null, 2)
  //     );
  //     try {
  //       ConfigurationService.testImplementation
  //         .expect(valueToTest, compositeRunTestAssertion.nameGivenToResult)
  //         .toEqual(compositeRunTestAssertion.testAssertion.definition.expectedValue);
  //       log.info(
  //         "handleCompositeAction compositeRunTestAssertion test passed",
  //         compositeRunTestAssertion.testAssertion
  //       );
  //       actionResult = ACTION_OK;
  //       TestSuiteContext.setTestAssertionResult({
  //         assertionName: compositeRunTestAssertion.testAssertion.testLabel,
  //         assertionResult: "ok",
  //         // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
  //         // assertionActualValue: valueToTest,
  //       });
  //     } catch (error) {
  //       TestSuiteContext.setTestAssertionResult({
  //         assertionName: compositeRunTestAssertion.testAssertion.testLabel,
  //         assertionResult: "error",
  //         assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
  //         assertionActualValue: valueToTest,
  //       });
  //       return ACTION_OK;
  //     }
  //   } catch (error) {
  //     log.error("handleCompositeAction compositeRunTestAssertion error", error);
  //     // TODO: 2 try catch blocks, one for the expect, one for the rest
  //     TestSuiteContext.setTestAssertionResult({
  //       assertionName: compositeRunTestAssertion.testAssertion.testLabel,
  //       assertionResult: "error",
  //       // TODO: set error message
  //       // assertionExpectedValue: compositeRunTestAssertion.testAssertion.definition.expectedValue,
  //       // assertionActualValue: valueToTest,
  //     });
  //     // return {
  //     //   status: "ok",
  //     //   returnedDomainElement: { elementType: "void" },
  //     // };
  //     throw new Error(
  //       "handleCompositeAction compositeRunTestAssertion error" + JSON.stringify(error, null, 2)
  //     );
  //   } finally {
  //     TestSuiteContext.setTestAssertion(undefined);
  //   }
  //   return (
  //     actionResult ??
  //     new Action2Error(
  //       "FailedToHandleCompositeActionTestAssertion",
  //       "handleTestCompositeActionAssertionNOTUSED compositeRunTestAssertion error: " +
  //         JSON.stringify(compositeRunTestAssertion)
  //     )
  //   );
  // }

  // ##############################################################################################
  private actionHandler: ActionHandler;

  getActionHandler(
    domainAction: DomainAction,
    actionHandlerKind: ActionHandlerKind,
    currentModel?: MetaModel
  ): AsyncHandlerFunction {
    const levels = {
      1: {
        actionType: domainAction.actionType,
        actionName: (domainAction as any).actionName,
        actionHandlerKind: actionHandlerKind,
      },
      2: {
        actionType: domainAction.actionType,
        actionName: (domainAction as any).actionName,
        actionHandlerKind: "*",
      },
      3: {
        actionType: domainAction.actionType,
        actionName: "*",
        actionHandlerKind: actionHandlerKind,
      },
      4: {
        actionType: domainAction.actionType,
        actionName: "*",
        actionHandlerKind: "*",
      },
    };
    for (const l of Object.entries(levels)) {
      if (
        this.actionHandler[l[1].actionType] &&
        this.actionHandler[l[1].actionType][l[1].actionName] &&
        (this.actionHandler[l[1].actionType][l[1].actionName] as any)[l[1].actionHandlerKind]
      ) {
        const levelhandler = (this.actionHandler[l[1].actionType][l[1].actionName] as any)[
          l[1].actionHandlerKind
        ];
        log.info(
          "DomainController getActionHandler using level",
          l[0],
          "for actionType=" +
            domainAction.actionType +
            " actionName=" +
            (domainAction as any).actionName +
            " actionHandlerKind=" +
            actionHandlerKind
        );
        return levelhandler;
      }
    }

    throw new Error(
      "DomainController getActionHandler could not find handler for actionType=" +
        domainAction.actionType +
        " actionName=" +
        (domainAction as any).actionName
    );
  }

  // ##############################################################################################
  callAsyncActionHandler(
    domainAction: DomainAction,
    actionHandlerKind: ActionHandlerKind,
    currentModel: MetaModel | undefined,
    ...actionHandlerArgs: any[]
  ): Promise<Action2ReturnType> {
    const actionHandler = this.getActionHandler(domainAction, actionHandlerKind, currentModel);
    return actionHandler(...actionHandlerArgs);
  }

  // ##############################################################################################
  constructor(
    private persistenceStoreAccessMode: "local" | "remote",
    // public persistenceStoreAccessMode: "local" | "remote",
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private persistenceStoreLocalOrRemote: PersistenceStoreLocalOrRemoteInterface, // instance of PersistenceReduxSaga
    private endpoint: Endpoint
  ) {
    this.callUtil = new CallUtils(miroirContext.errorLogService, persistenceStoreLocalOrRemote);
    const boundRemotePersistenceAction = this.callUtil.callRemotePersistenceAction.bind(
      this.callUtil
    );
    // actionType -> actionName -> actionHandlerKind -> handler
    this.actionHandler = {
      storeManagementAction: {
        resetAndInitApplicationDeployment: { "*": resetAndInitApplicationDeployment },
        "*": {
          local: this.persistenceStoreLocalOrRemote.handleStoreOrBundleActionForLocalStore.bind(
            this.persistenceStoreLocalOrRemote
          ),
          // remote: this.callUtil.callRemotePersistenceAction.bind(this.callUtil),
          remote: boundRemotePersistenceAction,
        },
      },
      bundleAction: {
        // TODO: not used, not tested!
        "*": {
          "*": this.handleDomainUndoRedoAction.bind(this),
        },
      },
      modelAction: {
        resetModel: {
          "*": boundRemotePersistenceAction,
        },
        resetData: {
          "*": boundRemotePersistenceAction,
        },
        initModel: {
          "*": boundRemotePersistenceAction,
        },
      },
    };
  }
} // class DomainController

type AsyncHandlerFunction = (...props: any[]) => Promise<Action2VoidReturnType>
type AsyncHandlerClosure = () => Promise<Action2VoidReturnType>

/**
 * actionType -> actionName -> handler
 * in the end, shall be:
 * actionType -> actionName -> {compositeAction, compositeActionParams}
 * also, the allowed actionNames shall be different for each actionType, depending on the actionType
 */
// export type ActionHandler= Record<string, Record<string, (domainAction: DomainAction, currentModel?: MetaModel) => Promise<Action2VoidReturnType>>>;
export type ActionHandlerKind = "local" | "remote" | "*";
export type ActionHandler = Record<string, Record<string, { [K in ActionHandlerKind]?: any }>>;

