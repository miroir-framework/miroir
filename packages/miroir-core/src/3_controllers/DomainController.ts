import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
import { MiroirApplicationVersionOLD_DO_NOT_USE } from '../0_interfaces/1_core/ModelVersion';
import {
  CRUDActionName,
  CRUDActionNamesArray, DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainTransactionalAction,
  DomainTransactionalActionWithCUDUpdate,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { WrappedTransactionalEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";

import { MiroirContextInterface } from '../0_interfaces/3_controllers/MiroirContextInterface';
import {
  LocalCacheCUDActionWithDeployment,
  LocalCacheModelActionWithDeployment,
  LocalCacheInterface,
} from "../0_interfaces/4-services/LocalCacheInterface.js";
import { RemoteStoreInterface, RemoteStoreCRUDAction, RemoteStoreActionReturnType } from '../0_interfaces/4-services/RemoteStoreInterface.js';

import { ModelEntityActionTransformer } from "../2_domain/ModelEntityActionTransformer.js";

import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';

import {
  ApplicationSection,
  ModelAction,
  EntityDefinition,
  EntityInstanceCollection,
  entityDefinition,
  InstanceAction,
  EntityInstance,
  ActionReturnType,
  entityInstanceCollection,
  MetaModel,
  ModelActionInitModel,
  ModelActionResetModel,
  ModelActionResetData,
  ModelActionCommit,
  ModelActionRollback,
  ApplicationVersion,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface';
import { MiroirLoggerFactory } from '../4_services/Logger';
import { packageName } from '../constants.js';
import { circularReplacer, getLoggerName } from '../tools';
import { CallUtils } from './ErrorHandling/CallUtils.js';
import { metaModelEntities, miroirModelEntities } from './ModelInitializer';
import { cleanLevel } from './constants.js';
import { Endpoint } from './Endpoint.js';

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
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteStoreInterface,
    private endpoint: Endpoint,
  ) {
    this.callUtil = new CallUtils(miroirContext.errorLogService,localCache,remoteStore);
  }

  getRemoteStore(): RemoteStoreInterface {
      return this.remoteStore
  }
  // ##############################################################################################
  currentTransaction(): (DomainTransactionalActionWithCUDUpdate | LocalCacheModelActionWithDeployment)[] {
    return this.localCache.currentTransaction();
  }

  // ##############################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  // ##############################################################################################
  // converts a Domain transactional action into a set of local cache actions and remote store actions
  async handleDomainTransactionalAction(
    deploymentUuid:Uuid,
    domainTransactionalAction: DomainTransactionalAction,
    currentModel: MetaModel,
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainTransactionalAction start actionName",
      domainTransactionalAction['actionName'],
      "deployment", deploymentUuid,
      "action",
      domainTransactionalAction
    );
    try {
      switch (domainTransactionalAction.actionName) {
        case "undo":
        case "redo": {
          this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            "handleLocalCacheTransactionalAction",
            {
              actionType: "localCacheTransactionalActionWithDeployment",
              deploymentUuid,
              domainAction: domainTransactionalAction
            }
          );
    
          break;
        }
        case "UpdateMetaModelInstance": {
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            "handleLocalCacheTransactionalAction",
            {
              actionType: "localCacheTransactionalActionWithDeployment",
              deploymentUuid, 
              domainAction:domainTransactionalAction
            }
          )
          break;
        }
        case "updateEntity": {
          log.debug(
            "DomainController updateEntity for model entity update",
            domainTransactionalAction?.update.modelEntityUpdate,
            "entities",
            currentModel.entities,
            "entity definitions",
            currentModel.entityDefinitions
          );
          if (domainTransactionalAction.update.modelEntityUpdate.actionName == "createEntity") {
            for (const entity of domainTransactionalAction?.update.modelEntityUpdate.entities) {
              await this.callUtil.callLocalCacheAction(
                {}, // context
                {}, // context update
                "handleLocalCacheEntityAction",
                {
                  actionType: "localCacheModelActionWithDeployment",
                  deploymentUuid,
                  modelAction: {
                    actionType: "modelAction",
                    actionName: "createEntity",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    entity: entity.entity,
                    entityDefinition: entity.entityDefinition
                  }
                }
              )
            }
          } else {
            const cudUpdate = ModelEntityActionTransformer.modelEntityUpdateToModelCUDUpdate(domainTransactionalAction?.update.modelEntityUpdate, currentModel);
            log.trace('DomainController updateEntity correspondingCUDUpdate',cudUpdate);
  
            const structureUpdatesWithCUDUpdates: WrappedTransactionalEntityUpdateWithCUDUpdate = {
              actionName: 'WrappedTransactionalEntityUpdateWithCUDUpdate',
              modelEntityUpdate:domainTransactionalAction?.update.modelEntityUpdate,
              equivalentModelCUDUpdates: cudUpdate?[cudUpdate]:[],
            };
            // log.trace('structureUpdatesWithCUDUpdates',structureUpdatesWithCUDUpdates);
            
            await this.callUtil.callLocalCacheAction(
              {}, // context
              {}, // context update
              "handleLocalCacheTransactionalAction",
              {
                actionType: "localCacheTransactionalActionWithDeployment",
                deploymentUuid,
                domainAction: {...domainTransactionalAction,update:structureUpdatesWithCUDUpdates}
              }
            )
          }
          break;
        }
  
        default: {
          log.warn("DomainController handleDomainTransactionalAction cannot handle action name for", domainTransactionalAction);
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleDomainTransactionalAction caught exception when handling",
        domainTransactionalAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        domainTransactionalAction,
        "exception",
        error
      );
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async handleDomainNonTransactionalAction(deploymentUuid:Uuid, domainAction: DomainDataAction): Promise<void> {
    log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction", domainAction.actionName, domainAction.objects);
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    if (CRUDActionNamesArray.map((a) => a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances,
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
          deploymentUuid,
          "handleDomainNonTransactionalAction sending to remote storage instances",
          instances.parentName,
          instances.instances
        );
        await this.callUtil.callRemoteAction(
          {}, // context
          {}, // context update
          "handleRemoteStoreRestCRUDAction",
          deploymentUuid,
          'data',
          {
            actionType: 'RemoteStoreCRUDAction',
            actionName: domainAction.actionName.toString() as CRUDActionName,
            parentName: instances.parentName,
            objects: instances.instances,
          }
        );
      }
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
        deploymentUuid,
        "handleDomainNonTransactionalAction done calling handleRemoteStoreRestCRUDAction",
        domainAction
      );
      if (domainAction.actionName == "create") {
        const instanceAction: InstanceAction = {
          actionType: "instanceAction",
          actionName: "createInstance",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          applicationSection: domainAction.objects[0].applicationSection,
          deploymentUuid,
          objects: domainAction.objects,
        }
        await this.endpoint.handleAction(instanceAction);
        
      } else {
        const instanceCUDAction: LocalCacheCUDActionWithDeployment = {
          actionType: "LocalCacheCUDActionWithDeployment",
          deploymentUuid,
          instanceCUDAction: {
            actionType: "InstanceCUDAction",
            actionName: domainAction.actionName,
            applicationSection: domainAction.objects[0].applicationSection,
            objects: domainAction.objects,
          },
        }
        await this.callUtil.callLocalCacheAction(
          {}, // context
          {}, // context update
          "handleLocalCacheCUDAction",
          instanceCUDAction
        )
      }
      log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction end", domainAction);
    } else {
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction could not handle action name",
        domainAction.actionName,
        "for action",
        domainAction
      );
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  // converts a Domain model action into a set of local cache actions and remote store actions
  async handleModelAction(
    deploymentUuid:Uuid,
    modelAction: ModelActionInitModel | ModelActionResetModel | ModelActionResetData | ModelActionCommit | ModelActionRollback,
    currentModel: MetaModel,
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction start actionName",
      modelAction['actionName'],
      "deployment", deploymentUuid,
      "action",
      modelAction
    );
    try {
      switch (modelAction.actionName) {
        case "rollback": {
          await this.loadConfigurationFromRemoteDataStore(deploymentUuid);
          break;
        }
        case "resetModel": 
        case "resetData": 
        case "initModel": {
          await this.callUtil.callRemoteAction(
            {}, // context
            {}, // context update
            "handleRemoteStoreModelAction",
            deploymentUuid,
            modelAction
          );
          break;
        }
        case "commit": {
          log.debug(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit",
            this.localCache.currentTransaction()
          );
  
          if (!currentModel) {
            throw new Error('commit operation did not receive current model. It requires the current model, to access the pre-existing transactions.');
          } else {
            const sectionOfapplicationEntities: ApplicationSection = deploymentUuid== applicationDeploymentMiroir.uuid?'data':'model';
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
              modelStructureMigration: this.localCache
                .currentTransaction()
                .map((t: LocalCacheModelActionWithDeployment | DomainTransactionalActionWithCUDUpdate) =>
                  t.actionType == "localCacheModelActionWithDeployment" ? t : t.update
                ),
            };
    
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit create new version", newModelVersion);
            const newModelVersionAction: RemoteStoreCRUDAction = {
              actionType: 'RemoteStoreCRUDAction',
              actionName: "create",
              objects: [newModelVersion],
            };
    
            // in the case of the Miroir app, this should be done in the 'data' section
            await this.callUtil.callRemoteAction(
              {}, // context
              {}, // context update
              "handleRemoteStoreRestCRUDAction",
              deploymentUuid,
              sectionOfapplicationEntities,
              newModelVersionAction
            );
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit new version created", newModelVersion);
    
            for (const replayAction of this.localCache.currentTransaction()) {
              // replayAction: DomainTransactionalActionWithCUDUpdate | LocalCacheModelActionWithDeployment
              log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit replayAction", replayAction);
              switch (replayAction.actionType) {
                case 'DomainTransactionalAction': {
                  if (replayAction.actionName == "updateEntity") {
                    switch (replayAction.update.modelEntityUpdate.actionName) {
                      case 'createEntity': {
                        const modelAction: ModelAction = {
                            actionType: "modelAction",
                            actionName: 'createEntity',
                            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                            entity: replayAction.update.modelEntityUpdate.entities[0].entity,
                            entityDefinition: replayAction.update.modelEntityUpdate.entities[0].entityDefinition as any as EntityDefinition,
                          // }
                        }
                        await this.callUtil.callRemoteAction(
                          {}, // context
                          {}, // context update
                          "handleRemoteStoreModelAction",
                          deploymentUuid,
                          modelAction
                        );
                        break;
                      }
                      case 'DeleteEntity': {
                        const modelAction: ModelAction = {
                          actionType: "modelAction",
                          actionName: 'dropEntity',
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          entityUuid: replayAction.update.modelEntityUpdate.entityUuid,
                          entityDefinitionUuid: "unknown!!"
                        }
                        await this.callUtil.callRemoteAction(
                          {}, // context
                          {}, // context update
                          "handleRemoteStoreModelAction",
                          deploymentUuid,
                          modelAction
                        );
                        break;
                      }
                      case 'renameEntity':
                      case 'alterEntityAttribute':
                      default: {
                        await this.callUtil.callRemoteAction(
                          {}, // context
                          {}, // context update
                          "handleRemoteStoreOLDModelAction",
                          deploymentUuid,
                          replayAction
                        );
                        break;
                      }
                    }
                  } else {
                    await this.callUtil.callRemoteAction(
                      {}, // context
                      {}, // context update
                      "handleRemoteStoreRestCRUDAction",
                      deploymentUuid,
                      replayAction.update.objects[0].applicationSection,
                      {
                        actionType:'RemoteStoreCRUDAction',
                        actionName: replayAction.update.actionName.toString() as CRUDActionName,
                        parentName: replayAction.update.objects[0].parentName,
                        parentUuid: replayAction.update.objects[0].parentUuid,
                        objects: replayAction.update.objects[0].instances,
                      }
                    );
                  }
                  break;
                }
                case "localCacheModelActionWithDeployment": {
                  await this.callUtil.callRemoteAction(
                    {}, // context
                    {}, // context update
                    "handleRemoteStoreModelAction",
                    deploymentUuid,
                    (replayAction as LocalCacheModelActionWithDeployment).modelAction
                  );
                  break;
                }
                default:
                  throw new Error("DomainController handleDomainTransactionalAction commit could not handle replay action:" + JSON.stringify(replayAction));
                  break;
              }
            }

            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit actions replayed, currentTransaction:",this.localCache.currentTransaction());

            await this.callUtil.callLocalCacheAction(
              {}, // context
              {}, // context update
              "handleLocalCacheTransactionalAction",
              {
                actionType: "localCacheTransactionalActionWithDeployment",
                deploymentUuid,
                domainAction: {
                  actionType: "modelAction",
                  actionName: "commit",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e"
                }
              }
            ).then(
              (context) => {
                log.debug(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit actions replayed and notified to local cache, currentTransaction:",
                  this.localCache.currentTransaction()
                );
                return this.callUtil.callLocalCacheAction(
                  {}, // context
                  {}, // context update
                  "handleLocalCacheCUDAction",
                  {
                    actionType: "LocalCacheCUDActionWithDeployment",
                    deploymentUuid,
                    instanceCUDAction: {
                      actionType: 'InstanceCUDAction',
                      actionName:'create',
                      applicationSection: "model",
                      objects:[{parentUuid:newModelVersion.parentUuid, applicationSection:sectionOfapplicationEntities, instances: [newModelVersion]}]
                    }
                  }
                )
              }
            ).then(
              (context) => {
                const updatedConfiguration = Object.assign({},instanceConfigurationReference,{definition:{"currentApplicationVersion": newModelVersionUuid}})
                log.debug('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit updating configuration',updatedConfiguration)
                const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
                  actionType:'RemoteStoreCRUDAction',
                  actionName: "update",
                  objects: [
                    updatedConfiguration
                  ],
                };
                // TODO: in the case of the Miroir app, this should be in the 'data'section
                return this.callUtil.callRemoteAction(
                  {}, // context
                  {}, // context update
                  "handleRemoteStoreRestCRUDAction",
                  deploymentUuid,
                  sectionOfapplicationEntities,
                  newStoreBasedConfiguration
                );
              }
            );
    
          }
          break;
        }
        default: {
          log.warn("DomainController handleDomainTransactionalAction cannot handle action name for", modelAction);
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleDomainTransactionalAction caught exception when handling",
        modelAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        modelAction,
        "exception",
        error
      );
    }
    return Promise.resolve();
  }


  //####################################################################################
  //####################################################################################
  //####################################################################################
  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore(
    deploymentUuid: string,
  ): Promise<void> {
    log.info("DomainController loadConfigurationFromRemoteDataStore called for deployment",deploymentUuid);
    try {
      await this.callUtil.callRemoteAction(
        {}, // context
        {
          addResultToContextAsName: "dataEntitiesFromModelSection",
          expectedDomainElementType: "entityInstanceCollection"
        }, // context update
        "handleRemoteStoreRestCRUDAction",
        // this.remoteStore, //this
        deploymentUuid,
        "model",
        {
          actionName: "read",
          parentName: entityEntity.name,
          parentUuid: entityEntity.uuid,
        }
      ).then(
        async (context) => {
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
              "DomainController loadConfigurationFromRemoteDataStore could not fetch entity instance list" +
              context.dataEntitiesFromModelSection
            );
          }
          const modelEntitiesToFetch: MetaEntity[] =
            deploymentUuid == applicationDeploymentMiroir.uuid
              ? miroirModelEntities
              : metaModelEntities
          ;

          const dataEntitiesToFetch: MetaEntity[] = 
          deploymentUuid == applicationDeploymentMiroir.uuid?
            (context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances??[]).filter(
              (dataEntity:EntityInstance) => modelEntitiesToFetch.filter((modelEntity) => dataEntity.uuid == modelEntity.uuid).length == 0
            )
          :
          context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances??[]
          ; // hack, hack, hack
  
          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore for deployment",
            deploymentUuid,
            "found data entities to fetch",
            dataEntitiesToFetch,
            "model entities to fetch",
            modelEntitiesToFetch,
          );
    
          // const modelEntities = [entityReport].filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
          const toFetchEntities: { section: ApplicationSection; entity: MetaEntity }[] = [
            ...modelEntitiesToFetch.map(
              (e) => (
              { section: "model" as ApplicationSection, entity: e })
            ),
            ...dataEntitiesToFetch.map(
              (e) => (
              { section: "data" as ApplicationSection, entity: e as MetaEntity })
              ),
          ];
          let instances: EntityInstanceCollection[] = []; //TODO: replace with functional implementation
          for (const e of toFetchEntities) {
            // makes sequential calls to interface. Make parallel calls instead using Promise.all?
            log.info(
              "DomainController loadConfigurationFromRemoteDataStore fecthing instances from server for entity",
              JSON.stringify(e,undefined,2)
            );
            await this.callUtil.callRemoteAction(
              {}, // context
              {
                addResultToContextAsName: "entityInstanceCollection",
                expectedDomainElementType: "entityInstanceCollection"
              }, // context update
              "handleRemoteStoreRestCRUDAction",
              deploymentUuid,
              e.section,
              {
                actionName: "read",
                parentName: e.entity.name,
                parentUuid: e.entity.uuid,
              }
            ).then(
              (context: Record<string, any>) => {
                log.trace(
                  "DomainController loadConfigurationFromRemoteDataStore found instances for entity",
                  e.entity["name"],
                  entityInstanceCollection
                );
                instances.push(context["entityInstanceCollection"].returnedDomainElement.elementValue);
                return context;
              }
            ).then(
              (context: Record<string, any>) => this.callUtil.callLocalCacheAction(
                context, // context
                {}, // context update
                "handleLocalCacheCUDAction",
                {
                  actionType: "LocalCacheCUDActionWithDeployment",
                  deploymentUuid,
                  instanceCUDAction: {
                    actionType: "InstanceCUDAction",
                    actionName: "replaceLocalCache",
                    objects: instances,
                  }
                }
              )
            ).then(
              (context: Record<string, any>) => this.callUtil.callLocalCacheAction(
                context, // context
                {}, // context update
                "handleLocalCacheTransactionalAction",
                {
                  actionType: "localCacheTransactionalActionWithDeployment",
                  deploymentUuid,
                  domainAction: {
                    actionType: "modelAction",
                    actionName: "rollback"
                  }
                }
              )
            ).catch(
              (reason) => log.error(reason)
            );
          }
    
          log.info(
            "DomainController loadConfigurationFromRemoteDataStore done handleLocalCacheTransactionalAction rollback",
            this.currentTransaction()
          );
    
          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore",
            deploymentUuid,
            "all instances stored:",
            JSON.stringify(this.localCache.getState(), circularReplacer())
          );
          return context;
        }
      );

      return Promise.resolve();
    } catch (error) {
      log.warn("DomainController loadConfigurationFromRemoteDataStore caught error:", error);
    }
  }

  // ##############################################################################################
  async handleDomainAction(
    deploymentUuid:Uuid,
    domainAction: DomainAction,
    currentModel:MetaModel,
  ): Promise<void> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleDomainAction",
      "deploymentUuid",
      deploymentUuid,
      "actionName",
      domainAction?.actionName,
      "actionType",
      domainAction?.actionType,
      "objects",
      JSON.stringify((domainAction as any)["objects"], null, 2)
    );

    log.debug('handleDomainAction domainAction',domainAction);
     
    switch (domainAction.actionType) {
      case "modelAction": {
        await this.handleModelAction(deploymentUuid, domainAction as ModelActionInitModel, currentModel);
        return Promise.resolve()
      }
      case "DomainDataAction": {
        await this.handleDomainNonTransactionalAction(deploymentUuid, domainAction as DomainDataAction);
        return Promise.resolve()
      }
      case "DomainTransactionalAction": {
        await this.handleDomainTransactionalAction(deploymentUuid, domainAction as DomainTransactionalAction, currentModel);
        return Promise.resolve()
      }
      default:
        log.error(
          "DomainController handleDomainAction action could not be taken into account, unkown action",
          domainAction
        );
    }
  }
}
