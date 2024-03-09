import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
import {
  CRUDActionName,
  DomainControllerInterface,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";

import { MiroirContextInterface } from '../0_interfaces/3_controllers/MiroirContextInterface';
import {
  LocalCacheInterface
} from "../0_interfaces/4-services/LocalCacheInterface.js";
import { PersistenceInterface } from '../0_interfaces/4-services/PersistenceInterface.js';


import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';

import {
  ActionVoidReturnType,
  ApplicationSection,
  ApplicationVersion,
  DomainAction,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  RestPersistenceAction,
  TransactionalInstanceAction,
  UndoRedoAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface';
import { MiroirLoggerFactory } from '../4_services/Logger';
import { packageName } from '../constants.js';
import { getLoggerName } from '../tools';
import { Endpoint } from './Endpoint.js';
import { CallUtils } from './ErrorHandling/CallUtils.js';
import { metaModelEntities, miroirModelEntities } from './ModelInitializer';
import { cleanLevel } from './constants.js';
import { ACTION_OK } from '../1_core/constants.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);


/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  private callUtil: CallUtils;
  constructor(
    private hasDirectAccessToPersistenceStore: boolean,
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private persistenceStore: PersistenceInterface,
    private endpoint: Endpoint
  ) {
    this.callUtil = new CallUtils(miroirContext.errorLogService, localCache, persistenceStore);
  }

  getRemoteStore(): PersistenceInterface {
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

  // ##############################################################################################
  async handleInstanceAction(
    deploymentUuid: Uuid,
    instanceAction: InstanceAction
  ): Promise<ActionVoidReturnType> {
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
        case 'remoteLocalCacheRollback': {
          if (this.hasDirectAccessToPersistenceStore) {
            log.info("handleModelAction reloading current configuration from local PersistenceStore!")
            await this.loadConfigurationFromPersistenceStore(deploymentUuid);
            log.info("handleModelAction reloading current configuration from local PersistenceStore DONE!")
          } else {
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
        case 'alterEntityAttribute':
        case 'createEntity':
        case 'renameEntity':
        case 'dropEntity': {
          if (modelAction.transactional == false) {
            // the modelAction is not transactional, we update the persistentStore directly
            log.info("handleModelAction running for non-transactional action!")
            await this.callUtil.callPersistenceAction(
              {}, // context
              {}, // context update
              modelAction
            );
            log.info("handleModelAction running for non-transactional action DONE!")
          }
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
              modelAction,
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
          log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit", this.localCache.currentTransaction());

          if (!currentModel) {
            throw new Error(
              "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions."
            );
          } else {
            const sectionOfapplicationEntities: ApplicationSection =
              modelAction.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model";
            const newModelVersionUuid = uuidv4();
            // const newModelVersion: MiroirApplicationVersionOLD_DO_NOT_USE = {
            const newModelVersion: ApplicationVersion = {
              uuid: newModelVersionUuid,
              // conceptLevel: "Data",
              parentName: entityApplicationVersion?.name,
              parentUuid: entityApplicationVersion?.uuid,
              description: "TODO: no description yet",
              name: "TODO: No label was given to this version.",
              previousVersion: currentModel?.configuration[0]?.definition?.currentApplicationVersion,
              // branch: applicationModelBranchMiroirMasterBranch.uuid,
              branch: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              // application:applicationMiroir.uuid, // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              application: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              modelStructureMigration: this.localCache.currentTransaction(),
              // .map((t: LocalCacheModelActionWithDeployment | DomainTransactionalInstanceAction) =>
              //   t.actionType == "localCacheModelActionWithDeployment" ? t : t.update
              // ),
            };

            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit create new version", newModelVersion);
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
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit new version created", newModelVersion);

            for (const replayAction of this.localCache.currentTransaction()) {
              // const localReplayAction: LocalCacheTransactionalInstanceActionWithDeployment | ModelAction = replayAction;
              log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction", replayAction);
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
                      "transactional": false
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
                  deploymentUuid:modelAction.deploymentUuid,
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
                    deploymentUuid:modelAction.deploymentUuid,
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
                JSON.stringify(context.dataEntitiesFromModelSection,undefined,2)
            );
          }
          const modelEntitiesToFetch: MetaEntity[] =
            deploymentUuid == applicationDeploymentMiroir.uuid ? miroirModelEntities : metaModelEntities;
          const dataEntitiesToFetch: MetaEntity[] =
            deploymentUuid == applicationDeploymentMiroir.uuid
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
                    actionName: "replaceLocalCache",
                    deploymentUuid,
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: instances,
                  }
                )
              )
              .then(
                (context: Record<string, any>) =>
                  this.callUtil.callLocalCacheAction(
                    context, // context
                    {}, // context update
                    {
                      actionType: "modelAction",
                      actionName: "rollback",
                      deploymentUuid,
                      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    }
                  )
              )
              .catch((reason) => log.error(reason));
          }

          log.info(
            "DomainController loadConfigurationFromRemoteDataStore done rollback",
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
  async handleAction(domainAction: DomainAction, currentModel: MetaModel): Promise<ActionVoidReturnType> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleAction",
      "deploymentUuid",
      domainAction.deploymentUuid,
      "actionName",
      (domainAction as any).actionName,
      "actionType",
      domainAction?.actionType,
      "objects",
      JSON.stringify((domainAction as any)["objects"], null, 2)
    );

    log.debug("handleAction domainAction", domainAction);

    switch (domainAction.actionType) {
      case "modelAction": {
        return this.handleModelAction(domainAction.deploymentUuid, domainAction, currentModel);
      }
      case "instanceAction": {
        return this.handleInstanceAction(
          domainAction.deploymentUuid,
          domainAction
        );
      }
      case "queryAction": {
        // if (this.hasDirectAccessToPersistenceStore) {
        //   const result = await this.callUtil.callLocalCacheAction(
        //     {}, // context
        //     {}, // context update
        //     domainAction
        //   );
        //   log.info("handleAction queryAction callLocalCacheAction Result=", result);
        //   // return result;
        // } else {
        // queryActions only exist on the client
        // they are translated to "query" Rest calls and the result is placed in the local cache.
        const result = this.callUtil.callPersistenceAction(
          {}, // context
          {}, // context update
          domainAction
        );
        log.info("handleAction queryAction callPersistenceAction Result=", result);
        // return result;
        // }
        
        return ACTION_OK;
        // return this.handleQueryAction(
        //   domainAction.deploymentUuid,
        //   domainAction
        // );
        break;
      }
      case "undoRedoAction": {
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
    return Promise.resolve(ACTION_OK)
  }
}
