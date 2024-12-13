
import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition';
import {
  CRUDActionName,
  DomainControllerInterface,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";

import { MiroirContextInterface } from '../0_interfaces/3_controllers/MiroirContextInterface';
import {
  LocalCacheInterface
} from "../0_interfaces/4-services/LocalCacheInterface";
import { PersistenceStoreLocalOrRemoteInterface } from '../0_interfaces/4-services/PersistenceInterface';


import adminConfigurationDeploymentMiroir from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entitySelfApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';

import {
  ActionReturnType,
  ActionVoidReturnType,
  ApplicationSection,
  ApplicationVersion,
  CompositeAction,
  CompositeActionDefinition,
  CompositeActionTemplate,
  Deployment,
  DomainAction,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  RestPersistenceAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  SelfApplicationDeploymentConfiguration,
  TestAction_runTestCompositeAction,
  TestCompositeAction,
  TestCompositeActionSuite,
  TransactionalInstanceAction,
  TransformerForRuntime,
  UndoRedoAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface';
import { ACTION_OK } from '../1_core/constants';
import { defaultMiroirMetaModel, metaModelEntities, miroirModelEntities } from '../1_core/Model';
import { resolveCompositeActionTemplate } from '../2_domain/ResolveCompositeAction';
import { transformer_extended_apply } from '../2_domain/Transformers';
import { MiroirLoggerFactory } from '../4_services/Logger';
import { packageName } from '../constants';
import {
  ConfigurationService,
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
  TestImplementation,
} from "../index";
import { getLoggerName, resolvePathOnObject } from '../tools';
import { cleanLevel } from './constants';
import { Endpoint } from './Endpoint';
import { CallUtils } from './ErrorHandling/CallUtils';

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export interface DeploymentConfiguration {
  adminConfigurationDeployment: EntityInstance,
  selfApplicationDeployment: SelfApplicationDeploymentConfiguration,
}

export async function resetAndInitMiroirAndApplicationDatabase(
  domainController: DomainControllerInterface,
  // deployments: any[] // TODO: use Deployment Entity Type!
  // adminConfigurationDeployments: Deployment[] // TODO: use Deployment Entity Type!
  selfAdminConfigurationDeployments: SelfApplicationDeploymentConfiguration[] // TODO: use Deployment Entity Type!
  // deployments: DeploymentConfiguration[] // TODO: use Deployment Entity Type!
) {
  // const deployments = [adminConfigurationDeploymentLibrary, adminConfigurationDeploymentMiroir];

  for (const selfAdminConfigurationDeployment of selfAdminConfigurationDeployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: selfAdminConfigurationDeployment.uuid,
    });
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
        application: selfApplicationMiroir,
        selfApplicationDeploymentConfiguration: selfAdminConfigurationDeployment,
        applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
        applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
        applicationVersion: selfApplicationVersionInitialMiroirVersion,
      },
    });
  }
  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetAndInitMiroirAndApplicationDatabase APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );
  for (const d of selfAdminConfigurationDeployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.uuid,
    });
  }
  return Promise.resolve(ACTION_OK);
}
export async function resetAndInitMiroirAndApplicationDatabaseNew(
  domainController: DomainControllerInterface,
  deployments: DeploymentConfiguration[] // TODO: use Deployment Entity Type!
) {
  // const mappedDeployments = deployments.map(d=>d.adminConfigurationDeployment);
  const mappedDeployments = deployments.map(d=>d.selfApplicationDeployment);
  return resetAndInitMiroirAndApplicationDatabase(domainController, mappedDeployments);
}
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  private callUtil: CallUtils;

  constructor(
    private domainControllerIsDeployedOn: "server" | "client",
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private persistenceStore: PersistenceStoreLocalOrRemoteInterface, // instance of PersistenceReduxSaga
    private endpoint: Endpoint
  ) {
    this.callUtil = new CallUtils(miroirContext.errorLogService, localCache, persistenceStore);
  }

  // TODO: remove? only used in commented code in index.tsx
  getRemoteStore(): PersistenceStoreLocalOrRemoteInterface {
    return this.persistenceStore;
  }
  // ##############################################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelAction)[] {
    return this.localCache.currentTransaction();
  }

  // ##############################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  // ##############################################################################################
  // converts a Domain transactional action into a set of local cache actions and remote store actions
  async handleDomainUndoRedoAction(
    deploymentUuid: Uuid,
    undoRedoAction: UndoRedoAction,
    currentModel: MetaModel
  ): Promise<ActionVoidReturnType> {
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
          log.warn("DomainController handleDomainUndoRedoAction cannot handle action name for", undoRedoAction);
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

  // ##############################################################################################
  async handleInstanceAction(deploymentUuid: Uuid, instanceAction: InstanceAction): Promise<ActionVoidReturnType> {
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
    await this.callUtil.callPersistenceAction(
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
  ): Promise<ActionVoidReturnType> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction START actionName=",
      modelAction["actionName"],
      "deployment",
      deploymentUuid,
      "action",
      modelAction
    );
    try {
      switch (modelAction.actionName) {
        case "remoteLocalCacheRollback": {
          if (this.domainControllerIsDeployedOn == "server") {
            // if the domain controller is deployed on the server, we refresh the local cache from the remote store
            log.info("handleModelAction reloading current configuration from local PersistenceStore!");
            await this.loadConfigurationFromPersistenceStore(deploymentUuid);
            log.info("handleModelAction reloading current configuration from local PersistenceStore DONE!");
          } else {
            // if the domain controller is deployed on the client, we send the "remoteLocalCacheRollback" action to the server
            await this.callUtil.callPersistenceAction(
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
            await this.callUtil.callPersistenceAction(
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
          await this.callUtil.callPersistenceAction(
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
              modelAction.deploymentUuid == adminConfigurationDeploymentMiroir.uuid ? "data" : "model";
            const newModelVersionUuid = uuidv4();
            // const newModelVersion: MiroirApplicationVersionOLD_DO_NOT_USE = {
            const newModelVersion: ApplicationVersion = {
              uuid: newModelVersionUuid,
              // conceptLevel: "Data",
              parentName: entitySelfApplicationVersion?.name,
              parentUuid: entitySelfApplicationVersion?.uuid,
              description: "TODO: no description yet",
              name: "TODO: No label was given to this version.",
              previousVersion: currentModel?.configuration[0]?.definition?.currentApplicationVersion,
              branch: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              application: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              // modelStructureMigration: this.localCache.currentTransaction(),
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
            await this.callUtil.callPersistenceAction(
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
                  await this.callUtil.callPersistenceAction(
                    {}, // context
                    {}, // context update
                    {
                      actionType: "RestPersistenceAction",
                      actionName: replayAction.instanceAction.actionName.toString() as CRUDActionName,
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
                  await this.callUtil.callPersistenceAction(
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
                return this.callUtil.callPersistenceAction(
                  {}, // context
                  {}, // context update
                  newStoreBasedConfiguration
                );
              });
            log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done!");
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

  //####################################################################################
  //####################################################################################
  //####################################################################################
  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromPersistenceStore(deploymentUuid: string): Promise<ActionVoidReturnType> {
    log.info("DomainController loadConfigurationFromRemoteDataStore called for deployment", deploymentUuid);
    try {
      await this.callUtil
        .callPersistenceAction(
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
          log.info(
            "DomainController loadConfigurationFromRemoteDataStore fetched list of Entities for deployment",
            deploymentUuid,
            "found data entities from Model Section dataEntitiesFromModelSection",
            context.dataEntitiesFromModelSection
          );

          if (
            !context.dataEntitiesFromModelSection ||
            context.dataEntitiesFromModelSection.status != "ok" ||
            context.dataEntitiesFromModelSection.returnedDomainElement.elementType != "entityInstanceCollection"
          ) {
            throw new Error(
              "DomainController loadConfigurationFromRemoteDataStore could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection, undefined, 2)
            );
          }
          // TODO: information has to come from localCacheSlice, not from hard-coded source!
          const modelEntitiesToFetch: MetaEntity[] =
            deploymentUuid == adminConfigurationDeploymentMiroir.uuid ? miroirModelEntities : metaModelEntities;
          const dataEntitiesToFetch: MetaEntity[] =
            deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? (context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances ?? []).filter(
                  (dataEntity: EntityInstance) =>
                    modelEntitiesToFetch.filter((modelEntity) => dataEntity.uuid == modelEntity.uuid).length == 0
                )
              : context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances ?? []; // hack, hack, hack
          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore for deployment",
            deploymentUuid,
            "found data entities to fetch",
            dataEntitiesToFetch,
            "model entities to fetch",
            modelEntitiesToFetch
          );

          // const modelEntities = [entityReport].filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
          const toFetchEntities: { section: ApplicationSection; entity: MetaEntity }[] = [
            ...modelEntitiesToFetch.map((e) => ({ section: "model" as ApplicationSection, entity: e })),
            ...dataEntitiesToFetch.map((e) => ({ section: "data" as ApplicationSection, entity: e as MetaEntity })),
          ];
          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore for deployment",
            deploymentUuid,
            "found entities to fetch",
            toFetchEntities
          );
          let instances: EntityInstanceCollection[] = []; //TODO: replace with functional implementation
          for (const e of toFetchEntities) {
            // makes sequential calls to interface. Make parallel calls instead using Promise.all?
            log.info(
              "DomainController loadConfigurationFromRemoteDataStore fecthing instances from server for entity",
              JSON.stringify(e, undefined, 2)
            );
            await this.callUtil
              .callPersistenceAction(
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
                instances.push(context["entityInstanceCollection"].returnedDomainElement.elementValue);
                return context;
              })
              .then((context: Record<string, any>) =>
                this.callUtil.callLocalCacheAction(
                  context, // context
                  {}, // context update
                  {
                    actionType: "instanceAction",
                    actionName: "loadNewInstancesInLocalCache",
                    deploymentUuid,
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: instances,
                  }
                )
              )
              .catch((reason) => log.error(reason));
          }

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
            "DomainController loadConfigurationFromRemoteDataStore done rollback, currentTransaction=",
            this.currentTransaction()
          );

          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore",
            deploymentUuid,
            "all instances stored!",
            toFetchEntities.map((e) => ({ section: e.section, uuid: e.entity.uuid }))
            // JSON.stringify(this.localCache.getState(), circularReplacer())
          );
          return context;
        });
    } catch (error) {
      log.warn("DomainController loadConfigurationFromRemoteDataStore caught error:", error);
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // called only in server.ts to handle queries on the server side
  // used in RootComponent to fetch data from the server
  // used in Importer.tsx
  // used in scripts.ts
  // used in tests
  async handleQueryActionOrBoxedExtractorActionForServerONLY(
    runBoxedExtractorOrQueryAction: RunBoxedExtractorOrQueryAction
  ): Promise<ActionReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
      // "deploymentUuid",
      // runBoxedExtractorOrQueryAction.deploymentUuid,
      "actionName",
      (runBoxedExtractorOrQueryAction as any).actionName,
      "actionType",
      runBoxedExtractorOrQueryAction?.actionType,
      "objects",
      JSON.stringify((runBoxedExtractorOrQueryAction as any)["objects"], null, 2)
    );

    if (this.domainControllerIsDeployedOn == "server") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: ActionReturnType = await this.persistenceStore.handlePersistenceAction(runBoxedExtractorOrQueryAction);
      log.info(
        "DomainController handleQueryActionOrBoxedExtractorActionForServerONLY runBoxedExtractorOrQueryAction callPersistenceAction Result=",
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
        "DomainController handleQueryActionOrBoxedExtractorActionForServerONLY runBoxedExtractorOrQueryAction sending query to server for execution",
        // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction)
        runBoxedExtractorOrQueryAction
      );
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        runBoxedExtractorOrQueryAction
      );
      log.info(
        "handleQueryActionOrBoxedExtractorActionForServerONLY runBoxedExtractorOrQueryAction callPersistenceAction Result=",
        result
      );
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
  async handleQueryTemplateActionForServerONLY(
    runBoxedQueryTemplateAction: RunBoxedQueryTemplateAction
  ): Promise<ActionReturnType> {
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

    if (this.domainControllerIsDeployedOn == "server") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: ActionReturnType = await this.persistenceStore.handlePersistenceAction(
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
      const result = await this.callUtil.callPersistenceAction(
        // what if it is a REAL persistence store?? exception?
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection",
        }, // continuation
        runBoxedQueryTemplateAction
      );
      log.info(
        "handleQueryTemplateActionForServerONLY callPersistenceAction Result=",
        result
      );
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
  ): Promise<ActionReturnType> {
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

    if (this.domainControllerIsDeployedOn == "server") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: ActionReturnType = await this.persistenceStore.handlePersistenceAction(
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
      const result = await this.callUtil.callPersistenceAction(
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
  ): Promise<ActionReturnType> {
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
      JSON.stringify((runBoxedQueryTemplateOrBoxedExtractorTemplateAction as any)["objects"], null, 2)
    );

    if (this.domainControllerIsDeployedOn == "server") {
      /**
       * we're on the server side. Shall we execute the query on the localCache or on the persistentStore?
       */

      const result: ActionReturnType = await this.persistenceStore.handlePersistenceAction(
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction
      );
      log.info(
        "DomainController handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY runBoxedQueryTemplateOrBoxedExtractorTemplateAction callPersistenceAction Result=",
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
        "DomainController handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY runBoxedQueryTemplateOrBoxedExtractorTemplateAction sending query to server for execution",
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
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction
      );
      log.info(
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY runBoxedQueryTemplateOrBoxedExtractorTemplateAction callPersistenceAction Result=",
        result
      );
      return result["dataEntitiesFromModelSection"];
    }

    return ACTION_OK;
  }

  // ##############################################################################################
  // TODO: not used, not tested!
  async handleTestCompositeAction(
    // testAction: TestAction_runTestCompositeAction,
    testAction: TestCompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<ActionVoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info("handleTestCompositeAction testAction", testAction, "localActionParams", localActionParams);
    // const resolved: any = resolveCompositeActionTemplate(compositeAction, localActionParams, currentModel);

    log.info("handleTestCompositeAction compositeInstanceAction localActionParams", localActionParams);
    // log.info(
    //   "handleCompositeAction compositeInstanceAction resolvedCompositeActionDefinition",
    //   JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );
    // switch (testAction.actionName) {
    //   case "runTestCompositeAction": {

    if (testAction.beforeTestSetupAction) {
      log.info("handleTestCompositeAction beforeAll", testAction.beforeTestSetupAction.actionLabel, testAction.beforeTestSetupAction);
      const beforeAllResult = await this.handleCompositeAction(testAction.beforeTestSetupAction, localActionParams, currentModel);
      if (beforeAllResult?.status != "ok") {
        log.error("Error on beforeTestSetupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.info("handleTestCompositeAction no beforeTestSetupAction!");
    }

    const localCompositeAction: CompositeAction = {
      ...testAction.compositeAction,
      definition: [
        ...testAction.compositeAction.definition,
        ...testAction.testCompositeActionAssertions
      ],
    }
    const result = await this.handleCompositeAction(localCompositeAction, localActionParams, currentModel);

    if (testAction.afterTestCleanupAction) {
      log.info("handleTestCompositeAction afterTestCleanupAction", testAction.afterTestCleanupAction.actionLabel, testAction.afterTestCleanupAction);
      const beforeAllResult = await this.handleCompositeAction(testAction.afterTestCleanupAction, localActionParams, currentModel);
      if (beforeAllResult?.status != "ok") {
        log.error("Error on afterTestCleanupAction", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.info("handleTestCompositeAction no afterTestCleanupAction!");
    }

    return Promise.resolve(ACTION_OK);
  }
  
  // ##############################################################################################
  async handleTestCompositeActionSuite(
    // testAction: TestAction_runTestCompositeAction,
    testAction: TestCompositeActionSuite,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<ActionVoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info("handleTestCompositeActionSuite testAction", testAction, "localActionParams", localActionParams);
    // const resolved: any = resolveCompositeActionTemplate(compositeAction, localActionParams, currentModel);

    log.info("handleTestCompositeActionSuite compositeInstanceAction localActionParams", localActionParams);
    // log.info(
    //   "handleCompositeAction compositeInstanceAction resolvedCompositeActionDefinition",
    //   JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );
    // switch (testAction.actionName) {
    //   case "runTestCompositeAction": {

    if (testAction.beforeAll) {
      log.info("handleTestCompositeActionSuite beforeAll", testAction.beforeAll.actionLabel, testAction.beforeAll);
      const beforeAllResult = await this.handleCompositeAction(testAction.beforeAll, localActionParams, currentModel);
      if (beforeAllResult?.status != "ok") {
        log.error("Error on beforeAll", JSON.stringify(beforeAllResult, null, 2));
      }
    } else {
      log.info("handleTestCompositeActionSuite no beforeAll!");
    }

    for (const testCompositeAction of testAction.testCompositeActions) {
      if (testAction.beforeEach) {
        log.info("handleTestCompositeActionSuite beforeEach", testAction.beforeEach.actionLabel, testAction.beforeAll);
        const beforeAllResult = await this.handleCompositeAction(testAction.beforeEach, localActionParams, currentModel);
        if (beforeAllResult?.status != "ok") {
          log.error("handleTestCompositeActionSuite Error on beforeEach", JSON.stringify(beforeAllResult, null, 2));
        }
      } else {
        log.info("handleTestCompositeActionSuite no beforeEach!");
      }

      if (testCompositeAction.beforeTestSetupAction) {
        log.info("handleTestCompositeAction beforeAll", testCompositeAction.beforeTestSetupAction.actionLabel, testCompositeAction.beforeTestSetupAction);
        const beforeTestResult = await this.handleCompositeAction(testCompositeAction.beforeTestSetupAction, localActionParams, currentModel);
        if (beforeTestResult?.status != "ok") {
          log.error("Error on beforeTestSetupAction", JSON.stringify(beforeTestResult, null, 2));
        }
      } else {
        log.info("handleTestCompositeAction no beforeTestSetupAction!");
      }

      const localCompositeAction: CompositeAction = {
        ...testCompositeAction.compositeAction,
        definition: [
          ...testCompositeAction.compositeAction.definition,
          ...testCompositeAction.testCompositeActionAssertions
        ],
      }
      if (testCompositeAction.afterTestCleanupAction) {
        log.info("handleTestCompositeAction beforeAll", testCompositeAction.afterTestCleanupAction.actionLabel, testCompositeAction.afterTestCleanupAction);
        const afterTestResult = await this.handleCompositeAction(testCompositeAction.afterTestCleanupAction, localActionParams, currentModel);
        if (afterTestResult?.status != "ok") {
          log.error("Error on beforeTestSetupAction", JSON.stringify(afterTestResult, null, 2));
        }
      } else {
        log.info("handleTestCompositeAction no beforeTestSetupAction!");
      }

      const result = await this.handleCompositeAction(localCompositeAction, localActionParams, currentModel);
      if (testAction.afterEach) {
        log.info("handleTestCompositeActionSuite afterEach", testAction.afterEach.actionLabel, testAction.beforeAll);
        const beforeAllResult = await this.handleCompositeAction(testAction.afterEach, localActionParams, currentModel);
        if (beforeAllResult?.status != "ok") {
          log.error("handleTestCompositeActionSuite Error on afterEach", JSON.stringify(beforeAllResult, null, 2));
        }
      } else {
        log.info("handleTestCompositeActionSuite no afterEach!");
      }
    }

    return Promise.resolve(ACTION_OK);
  }
  
  // ##############################################################################################
  // TODO: not used, not tested!
  async handleCompositeAction(
    compositeAction: CompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<ActionVoidReturnType> {
    const localActionParams = { ...actionParamValues };
    let localContext: Record<string, any> = { ...actionParamValues };

    log.info("handleCompositeAction compositeAction", compositeAction, "localActionParams", localActionParams);
    // const resolved: any = resolveCompositeActionTemplate(compositeAction, localActionParams, currentModel);

    log.info("handleCompositeAction compositeInstanceAction localActionParams", localActionParams);
    // log.info(
    //   "handleCompositeAction compositeInstanceAction resolvedCompositeActionDefinition",
    //   JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    // );

    for (const currentAction of compositeAction.definition) {
      log.info(
        "handleCompositeAction compositeInstanceAction currentAction",
        // JSON.stringify(currentAction, null, 2),
        currentAction,
        "localContext keys",
        Object.keys(localContext),
        "localContext",
        localContext
      );
      switch (currentAction.compositeActionType) {
        case "compositeAction": {
          log.info(
            "handleCompositeAction compositeAction action to handle",
            JSON.stringify(currentAction, null, 2)
          );
          const actionResult = await this.handleCompositeAction(
            currentAction.compositeAction,
            actionParamValues,
            currentModel
          );
          break;
        }
        case "domainAction": {
          log.info(
            "handleCompositeAction domainAction action to handle",
            JSON.stringify(currentAction.domainAction, null, 2)
          );
          const actionResult = await this.handleAction(currentAction.domainAction, currentModel);
          if (actionResult?.status != "ok") {
            log.error("Error on action", JSON.stringify(actionResult, null, 2));
          }
          break;
        }
        case "runBoxedQueryTemplateAction": {
          log.info(
            "handleCompositeActionTemplate boxedQueryTemplateAction to handle",
            currentAction,
            "with actionParamValues",
            actionParamValues
          );

          const actionResult = await this.handleQueryTemplateActionForServerONLY(
            currentAction.queryTemplate
          );
          if (actionResult?.status != "ok") {
            log.error(
              "Error on runBoxedQueryTemplateAction with nameGivenToResult",
              currentAction.nameGivenToResult,
              "query=",
              JSON.stringify(actionResult, null, 2)
            );
          } else {
            log.info(
              "handleCompositeActionTemplate boxedQueryTemplateAction adding result to context as",
              currentAction.nameGivenToResult,
              "value",
              actionResult
            );
            localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement.elementValue;
          }
          break;
        }
        case "runBoxedExtractorTemplateAction": {
          log.info(
            "handleCompositeAction resolved extractorTemplate action",
            currentAction,
            "with actionParamValues",
            actionParamValues
          );

          const actionResult = await this.handleBoxedExtractorTemplateActionForServerONLY(
            currentAction.queryTemplate
          );
          if (actionResult?.status != "ok") {
            log.error(
              "Error on runBoxedQueryTemplateAction with nameGivenToResult",
              currentAction.nameGivenToResult,
              "query=",
              JSON.stringify(actionResult, null, 2)
            );
          } else {
            log.info(
              "handleCompositeActionTemplate extractorTemplate adding result to context as",
              currentAction.nameGivenToResult,
              "value",
              actionResult
            );
            localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement.elementValue;
          }
          break;
        }
        case "runBoxedExtractorOrQueryAction": {
          // throw new Error(
          //   "handleCompositeAction can not handle query actions: " + JSON.stringify(currentAction)
          // );

          log.info(
            "handleCompositeActionTemplate runBoxedExtractorOrQueryAction to handle",
            currentAction,
            "with actionParamValues",
            actionParamValues
          );

          const actionResult = await this.handleQueryActionOrBoxedExtractorActionForServerONLY(
            currentAction.query
          );
          if (actionResult?.status != "ok") {
            log.error(
              "Error on runBoxedExtractorOrQueryAction with nameGivenToResult",
              currentAction.nameGivenToResult,
              "query=",
              JSON.stringify(actionResult, null, 2)
            );
          } else {
            log.info(
              "handleCompositeActionTemplate runBoxedExtractorOrQueryAction adding result to context as",
              currentAction.nameGivenToResult,
              "value",
              JSON.stringify(actionResult, null, 2)
            );
            localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement.elementValue;
          }
          break;
        }
        case 'runBoxedQueryTemplateOrBoxedExtractorTemplateAction': {
          throw new Error("handleCompositeAction can not handle query actions: " + JSON.stringify(currentAction));
        }
        case 'runTestCompositeActionAssertion': {
          if (!ConfigurationService.testImplementation) {
            throw new Error(
              "ConfigurationService.testImplementation is not set, please inject a test implementation using ConfigurationService.registerTestImplementation on startup if you want to run tests at runtime."
            );
          }
          const preValueToTest = resolvePathOnObject(
            localContext,
            currentAction.testAssertion.definition.resultAccessPath ?? []
          );
          const valueToTest = Array.isArray(preValueToTest)
              ? ignorePostgresExtraAttributesOnList(preValueToTest, currentAction.testAssertion.definition.ignoreAttributes??[])
              : ignorePostgresExtraAttributesOnObject(preValueToTest, currentAction.testAssertion.definition.ignoreAttributes??[])
          ;
          log.info(
            "handleCompositeAction runTestCompositeActionAssertion to handle",
            JSON.stringify(currentAction.testAssertion, null, 2),
            "preValueToTest",
            JSON.stringify(preValueToTest, null, 2),
            "valueToTest",
            JSON.stringify(valueToTest, null, 2)
          );
          ConfigurationService.testImplementation
            .expect(valueToTest)
            .toEqual(currentAction.testAssertion.definition.expectedValue);
          log.info("handleCompositeAction runTestCompositeActionAssertion test passed", currentAction.testAssertion);
          break;
        }
        default: {
          log.error("handleCompositeAction unknown compositeActionType", currentAction);
          break;
        }
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleCompositeActionTemplate(
    compositeAction: CompositeActionTemplate,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<ActionVoidReturnType> {
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
      resolvedCompositeActionDefinition: CompositeActionDefinition;
      resolvedCompositeActionTemplates: Record<string, any>;
    } = resolveCompositeActionTemplate(compositeAction, localActionParams, currentModel);

    log.info("handleCompositeActionTemplate", actionLabel, "localActionParams", localActionParams);
    log.info(
      "handleCompositeActionTemplate",
      actionLabel,
      "resolvedCompositeActionDefinition",
      resolved.resolvedCompositeActionDefinition
      // JSON.stringify(resolved.resolvedCompositeActionDefinition, null, 2)
    );

    for (const currentAction of resolved.resolvedCompositeActionDefinition) {
      log.info(
        "handleCompositeActionTemplate",
        actionLabel,
        "currentAction",
        // JSON.stringify(currentAction, null, 2),
        currentAction.compositeActionStepLabel,
        currentAction,
        // "actionParamsAndTemplates",
        // resolved.actionParamsAndTemplates,
        "localContext keys",
        Object.keys(localContext),
        "localContext",
        localContext
      );
      switch (currentAction.compositeActionType) {
        case "domainAction": {
          // log.info(
          //   "handleCompositeActionTemplate compositeInstanceAction action to resolve",
          //   JSON.stringify(currentAction.domainAction, null, 2)
          // );
          const resolvedActionTemplate: InstanceAction = transformer_extended_apply(
            "runtime",
            currentAction.compositeActionStepLabel ?? "NO NAME",
            currentAction.domainAction as any as TransformerForRuntime, // TODO: correct type
            // resolved.actionParamsAndTemplates,
            localActionParams,
            localContext
          ).elementValue as InstanceAction;
          log.info(
            "handleCompositeActionTemplate compositeInstanceAction",
            currentAction.compositeActionStepLabel ?? "without step name",
            "resolved action Template",
            JSON.stringify(resolvedActionTemplate, null, 2)
          );
          // log.info("handleCompositeActionTemplate compositeInstanceAction current model", currentModel);

          // switch (resolvedActionTemplate.actionType) {
          //   case "compositeAction": {
          //     const actionResult = await this.handleCompositeActionTemplate(resolvedActionTemplate, currentModel);
          //     if (actionResult?.status != "ok") {
          //       log.error("Error on action", JSON.stringify(actionResult, null, 2));
          //     }
          //     break;
          //   }
          //   default: {
          const actionResult = await this.handleAction(resolvedActionTemplate, currentModel);
          if (actionResult?.status != "ok") {
            log.error("Error on action", JSON.stringify(actionResult, null, 2));
          }
          //   break;
          // }
          // }
          // const actionResult = await this.handleAction(currentAction.action, currentModel);
          break;
        }
        case "runBoxedQueryTemplateAction": {
          log.info(
            "handleCompositeActionTemplate",
            actionLabel,
            "resolved query action",
            currentAction,
            "with actionParamValues",
            actionParamValues
          );

          const actionResult = await this.handleQueryTemplateActionForServerONLY(
            currentAction.queryTemplate
          );
          if (actionResult?.status != "ok") {
            log.error("Error on query", JSON.stringify(actionResult, null, 2));
          } else {
            log.info(
              "handleCompositeActionTemplate",
              actionLabel,
              "query adding result to context as",
              currentAction.nameGivenToResult,
              "value",
              actionResult
            );
            localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement.elementValue;
          }
          break;
        }
        case "runBoxedExtractorTemplateAction": {
          log.info(
            "handleCompositeActionTemplate",
            actionLabel,
            "resolved query action",
            currentAction,
            "with actionParamValues",
            actionParamValues
          );

          const actionResult = await this.handleBoxedExtractorTemplateActionForServerONLY(
            currentAction.queryTemplate
          );
          if (actionResult?.status != "ok") {
            log.error(
              "Error on runBoxedExtractorTemplateAction with nameGivenToResult",
              currentAction.nameGivenToResult,
              "query=",
              JSON.stringify(actionResult, null, 2)
            );
          } else {
            log.info(
              "handleCompositeActionTemplate",
              actionLabel,
              "query adding result to context as",
              currentAction.nameGivenToResult,
              "value",
              actionResult
            );
            localContext[currentAction.nameGivenToResult] = actionResult.returnedDomainElement.elementValue;
          }
          break;
        }
        default: {
          log.error("handleCompositeActionTemplate", actionLabel, "unknown compositeActionType", currentAction);
          throw new Error(
            "handleCompositeActionTemplate " +
              actionLabel +
              " unknown compositeActionType: " +
              currentAction.compositeActionType
          );
          break;
        }
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async handleAction(domainAction: DomainAction, currentModel: MetaModel): Promise<ActionVoidReturnType> {
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

    log.debug("DomainController handleAction domainAction", domainAction);
    // if (!domainAction.deploymentUuid) {
    //   throw new Error("waaaaa");

    // }
    switch (domainAction.actionType) {
      case "compositeAction": {
        // old school, not used anymore (or should not be used anymore)
        throw new Error("DomainController handleAction compositeAction should not be used anymore");
        break;
      }
      case "modelAction": {
        return this.handleModelAction(domainAction.deploymentUuid, domainAction, currentModel);
      }
      case "instanceAction": {
        return this.handleInstanceAction(domainAction.deploymentUuid, domainAction);
      }
      case "storeManagementAction": {
        if (domainAction.actionName == "resetAndInitMiroirAndApplicationDatabase") {
          await resetAndInitMiroirAndApplicationDatabase(this, domainAction.deployments);
        } else {
          try {
            await this.callUtil.callPersistenceAction(
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
        }
        return Promise.resolve(ACTION_OK);
        break;
      }
      case "bundleAction": {
        try {
          await this.callUtil.callPersistenceAction(
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
        return this.handleDomainUndoRedoAction(domainAction.deploymentUuid, domainAction, currentModel);
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
        log.error("DomainController handleAction action could not be taken into account, unkown action", domainAction);
    }
    return Promise.resolve(ACTION_OK);
  }
}
