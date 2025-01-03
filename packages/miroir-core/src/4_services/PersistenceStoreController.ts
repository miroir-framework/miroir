
import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  Application,
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaModel,
  ModelActionAlterEntityAttribute,
  ModelActionInitModel,
  ModelActionInitModelParams,
  ModelActionRenameEntity,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  SelfApplicationDeploymentConfiguration,
  StoreSectionConfiguration
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreControllerAction,
  PersistenceStoreControllerInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
// import { applyModelEntityUpdate } from "../3_controllers/ActionRunner.js";
import { modelInitialize } from "../3_controllers/ModelInitializer.js";
import { packageName } from "../constants.js";
import { MiroirLoggerFactory } from "./Logger.js";
import { cleanLevel } from "./constants.js";

import { ACTION_OK } from "../1_core/constants.js";
import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json" assert { type: "json" };
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json" assert { type: "json" };

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceStoreController")
).then((logger: LoggerInterface) => {log = logger});


// #######################################################################################################################
export interface PersistenceStoreControllerFactoryReturnType {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
}


// #######################################################################################################################
export async function storeSectionFactory (
  StoreSectionFactoryRegister:StoreSectionFactoryRegister,
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  dataStore?: PersistenceStoreDataSectionInterface,
):Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> {
  log.info('PersistenceStoreController storeSectionFactory called for', section, config, StoreSectionFactoryRegister);
  if (section == 'model' && !dataStore) {
    throw new Error('PersistenceStoreController storeSectionFactory model section factory must receive data section store.')
  }
  const storeFactoryRegisterKey:string = JSON.stringify({storageType:config.emulatedServerType,section});
  log.info("PersistenceStoreController storeSectionFactory storeFactoryRegisterKey", storeFactoryRegisterKey);
  const foundStoreSectionFactory = StoreSectionFactoryRegister.get(storeFactoryRegisterKey);
  if (foundStoreSectionFactory) {
    if (section == 'model') {
      return foundStoreSectionFactory(section,config,dataStore)
    } else {
      return foundStoreSectionFactory(section,config)
    }
  } else {
    throw new Error('foundStoreFactory is undefined for ' + config.emulatedServerType + ', section ' + section)
  }
}


// #######################################################################################################################
// #######################################################################################################################
// #######################################################################################################################
// #######################################################################################################################
// MAIN CLASS: PersistenceStoreController
// #######################################################################################################################
export class PersistenceStoreController implements PersistenceStoreControllerInterface {
  private logHeader: string;

  constructor(
    private adminStore: PersistenceStoreAdminSectionInterface,
    private modelStoreSection: PersistenceStoreModelSectionInterface,
    private dataStoreSection: PersistenceStoreDataSectionInterface,
  ){
    this.logHeader = 'PersistenceStoreController '+ modelStoreSection.getStoreName();
  }

  // #########################################################################################
  getStoreName(): string {
    return this.modelStoreSection.getStoreName();
  }

  // #############################################################################################
  async handleBoxedExtractorAction(action: RunBoxedExtractorAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedExtractorAction','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
    const result: ActionReturnType = await currentStore.handleBoxedExtractorAction(action);

    log.info(this.logHeader,'handleBoxedExtractorAction','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleBoxedQueryAction(action: RunBoxedQueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedQueryAction','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
    const result: ActionReturnType = await currentStore.handleBoxedQueryAction(action);

    log.info(this.logHeader,'handleBoxedQueryAction','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(action: RunBoxedExtractorTemplateAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: ActionReturnType = await currentStore.handleBoxedExtractorTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleQueryTemplateActionForServerONLY(action: RunBoxedQueryTemplateAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: ActionReturnType = await currentStore.handleQueryTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(action: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: ActionReturnType = await currentStore.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleAction(persistenceStoreControllerAction: PersistenceStoreControllerAction): Promise<ActionReturnType> {
    switch (persistenceStoreControllerAction.actionType) {
      case "modelAction": {
        // const storeManagementAction: ModelAction = body;
        // log.info('modelActionStoreRunnerNotUsed action', JSON.stringify(update,undefined,2));
        log.info("handleAction action", persistenceStoreControllerAction);
        switch (persistenceStoreControllerAction.actionName) {
          case "dropEntity": {
            // await targetProxy.dropEntity(update.modelEntityUpdate.entityUuid);
            await this.dropEntity(persistenceStoreControllerAction.entityUuid);
            break;
          }
          case "renameEntity": {
            await this.renameEntityClean(persistenceStoreControllerAction);
            break;
          }
          case "resetModel": {
            log.debug("handleAction resetModel update");
            await this.clear();
            // await appDataStoreProxy.clear();
            log.trace("handleAction resetModel after dropped entities:", this.getEntityUuids());
            break;
          }
          case "alterEntityAttribute": {
            await this.alterEntityAttribute(persistenceStoreControllerAction);
            break;
          }
          case "resetData": {
            log.debug("handleAction resetData update");
            await this.clearDataInstances();
            log.trace(
              "handleAction resetData after cleared data contents for entities:",
              this.getEntityUuids()
            );
            break;
          }
          case "initModel": {
            const modelActionInitModel = persistenceStoreControllerAction as ModelActionInitModel;
            const params: ModelActionInitModelParams = modelActionInitModel.params;
            log.debug("handleAction initModel params", params);
      
            await this.initApplicationDeploymentStore(params);
            break;
          }
          // case "alterEntityAttribute":
          case "commit":
          case "rollback": {
            throw new Error("handleAction could not handle action" + JSON.stringify(persistenceStoreControllerAction));
          }
          case "createEntity": {
            log.debug("handleAction applyModelEntityUpdates createEntity inserting", persistenceStoreControllerAction.entities);
            // await targetProxy.createEntity(update.entity, update.entityDefinition);
            await this.createEntities(persistenceStoreControllerAction.entities);
            break;
          }
          default:
            log.warn("handleAction could not handle action", persistenceStoreControllerAction);
            break;
        }
    
        break;
      }
      case "instanceAction": {
        // TODO: check await calls for errors!
        switch (persistenceStoreControllerAction.actionName) {
          case "updateInstance": 
          case "createInstance": {
            for (const instanceCollection of persistenceStoreControllerAction.objects) {
              for (const instance of instanceCollection.instances) {
                await this.upsertInstance(instanceCollection.applicationSection,instance)
              }
            }
            break;
          }
          case "deleteInstance": {
            for (const instanceCollection of persistenceStoreControllerAction.objects) {
              await this.deleteInstances(instanceCollection.applicationSection,instanceCollection.instances)
            }
            break;
          }
          case "loadNewInstancesInLocalCache": {
            throw new Error("PersistenceStoreController handleAction can not handle loadNewInstancesInLocalCache action!");
            break;
          }
          case "getInstance": {
            return this.getInstance(persistenceStoreControllerAction.applicationSection,persistenceStoreControllerAction.parentUuid, persistenceStoreControllerAction.uuid)
            break;
          }
          case "getInstances": {
            return this.getInstances(persistenceStoreControllerAction.applicationSection,persistenceStoreControllerAction.parentUuid)
            break;
          }
          default:
            break;
        }
        break;
      }
      default: {
        throw new Error("PersistenceStoreController handleAction could not handleAction " + persistenceStoreControllerAction);
        break;
      }
    }
    log.debug("handleAction returning empty response.");
    return Promise.resolve(ACTION_OK);
  }


  // #############################################################################################
  async initApplicationDeploymentStore(
    params: ModelActionInitModelParams
  ) {
    log.info("ActionRunner.ts initApplicationDeploymentStore model/initModel params", params);
    if (params.dataStoreType == "miroir") {
      // TODO: improve, test is dirty
      await this.initApplication(
        // defaultMiroirMetaModel,
        params.metaModel,
        params.dataStoreType,
        params.application,
        // params.applicationDeploymentConfiguration,
        params.selfApplicationDeploymentConfiguration,
        params.applicationModelBranch,
        params.applicationVersion,
        params.applicationStoreBasedConfiguration
      );
      log.info(
        "ActionRunner.ts initApplicationDeploymentStore miroir model/initModel contents",
        await this.getState()
      );
    } else {
      // different Proxy object!!!!!!
      await this.initApplication(
        params.metaModel,
        "app",
        params.application,
        // params.applicationDeploymentConfiguration,
        params.selfApplicationDeploymentConfiguration,
        params.applicationModelBranch,
        params.applicationVersion,
        params.applicationStoreBasedConfiguration
      );
      log.info(
        "ActionRunner.ts initApplicationDeploymentStore app model/initModel contents",
        await this.getState()
      );
    }
    log.debug("server post resetModel after initModel, entities:", this.getEntityUuids());
  }
  // #############################################################################################
  async initApplication(
    metaModel:MetaModel,
    dataStoreType: DataStoreApplicationType,
    selfApplication: Application,
    // selfApplicationDeploymentConfiguration: EntityInstance,
    selfApplicationDeploymentConfiguration: SelfApplicationDeploymentConfiguration,
    selfApplicationModelBranch: EntityInstance,
    selfApplicationVersion: EntityInstance,
    selfApplicationStoreBasedConfiguration: EntityInstance,
  ):Promise<ActionReturnType>{
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      selfApplication,
      selfApplicationDeploymentConfiguration,
      selfApplicationModelBranch,
      selfApplicationVersion,
      selfApplicationStoreBasedConfiguration,
    );
    return Promise.resolve(ACTION_OK);
  }


  // #############################################################################################
  async bootFromPersistedState(
    metaModelEntities : Entity[],
    metaModelEntityDefinitions : EntityDefinition[],
  ):Promise<ActionVoidReturnType> {
    const modelBootFromPersistedState: ActionReturnType = await this.modelStoreSection.bootFromPersistedState(metaModelEntities, metaModelEntityDefinitions);
    if (modelBootFromPersistedState.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `bootFromPersistedState failed for section model: ${modelBootFromPersistedState.error}`,
        },
      });
    }
    const dataEntities:ActionEntityInstanceCollectionReturnType = await this.modelStoreSection.getInstances(entityEntity.uuid);
    const dataEntityDefinitions:ActionEntityInstanceCollectionReturnType = await this.modelStoreSection.getInstances(entityEntityDefinition.uuid);
    if (dataEntities.status != "ok" || dataEntityDefinitions.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `bootFromPersistedState for entities getInstances(${entityEntity.uuid}) status: ${dataEntities.status}, getInstances(${entityEntityDefinition.uuid}) status: ${dataEntities.status}. Message: ${dataEntities.status == "ok"?"":dataEntities.error}, ${dataEntityDefinitions.status == "ok"?"":dataEntityDefinitions.error}`,
        },
      });
    }

    const dataBootFromPersistedState = await this.dataStoreSection.bootFromPersistedState(
      (dataEntities.returnedDomainElement?.elementValue.instances as Entity[]).filter((e) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1), // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
      dataEntityDefinitions.returnedDomainElement?.elementValue.instances as EntityDefinition[]
    );
    if (dataBootFromPersistedState.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `bootFromPersistedState failed for section data: ${dataBootFromPersistedState.error}`,
        },
      });
    }
    
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  async open():Promise<ActionVoidReturnType> {
    await this.adminStore.open();
    await this.dataStoreSection.open();
    await this.modelStoreSection.open();
    return Promise.resolve(ACTION_OK);
  }
  
  // ##############################################################################################
  async close():Promise<ActionVoidReturnType> {
    await this.adminStore.close();
    await this.modelStoreSection.close();
    await this.dataStoreSection.close();
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    return this.adminStore.createStore(config);
  }
  
  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    return this.adminStore.deleteStore(config);
  }

  // ##############################################################################################
  async clear():Promise<ActionVoidReturnType> {
    log.info(this.logHeader,'clear',this.getEntityUuids());
    await this.dataStoreSection.clear();
    await this.modelStoreSection.clear();
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async clearDataInstances():Promise<ActionVoidReturnType> {
    log.debug(this.logHeader, "clearDataInstances", this.getEntityUuids());
    // const dataSectionEntities: EntityInstanceCollection = await this.getInstances("model", entityEntity.uuid);
    const dataSectionEntities: ActionEntityInstanceCollectionReturnType = await this.getInstances("model", entityEntity.uuid);
    if (dataSectionEntities.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid}, error: ${dataSectionEntities.error.errorType}, ${dataSectionEntities.error.errorMessage}`,
        },
      });
    }
    // if (dataSectionEntities.returnedDomainElement?.elementType != "entityInstanceCollection") {
    //   return Promise.resolve({
    //     status: "error",
    //     error: {
    //       errorType: "FailedToGetInstances",
    //       errorMessage: `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid} wrong element type, expected "entityInstanceCollection", got elementType: ${dataSectionEntities.returnedDomainElement?.elementType}`,
    //     },
    //   });
    // }
    const dataSectionEntityDefinitions: ActionEntityInstanceCollectionReturnType = await this.getInstances(
      "model",
      entityEntityDefinition.uuid
    );
    if (dataSectionEntityDefinitions.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `clearDataInstances failed for dataSectionEntityDefinitions section: model, entityUuid ${entityEntityDefinition.uuid}, error: ${dataSectionEntityDefinitions.error.errorType}, ${dataSectionEntityDefinitions.error.errorMessage}`,
        },
      });
    }
    // if (dataSectionEntityDefinitions.returnedDomainElement?.elementType != "entityInstanceCollection") {
    //   return Promise.resolve({
    //     status: "error",
    //     error: {
    //       errorType: "FailedToGetInstances",
    //       errorMessage: `clearDataInstances failed for dataSectionEntityDefinitions section: model, entityUuid ${entityEntityDefinition.uuid} wrong element type, expected "entityInstanceCollection", got elementType: ${dataSectionEntityDefinitions.returnedDomainElement?.elementType}`,
    //     },
    //   });
    // }
    const dataSectionFilteredEntities: Entity[] = (dataSectionEntities.returnedDomainElement.elementValue.instances as Entity[]).filter(
      (e: Entity) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1
    ); // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
    log.trace(this.logHeader, "clearDataInstances found entities to clear:", dataSectionFilteredEntities);
    await this.dataStoreSection.clear();

    for (const entity of dataSectionFilteredEntities) {
      const entityDefinition: EntityDefinition | undefined = dataSectionEntityDefinitions.returnedDomainElement.elementValue.instances.find(
        (d: EntityInstance) => (d as EntityDefinition).entityUuid == entity.uuid
      ) as EntityDefinition;
      if (entityDefinition) {
        await this.createDataStorageSpaceForInstancesOfEntity(entity, entityDefinition);
      } else {
        log.error(this.logHeader, "clearDataInstances could not find entity definition for Entity", entity);
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.modelStoreSection.existsEntity(entityUuid);
  }
  
  // #############################################################################################
  getEntityUuids(): string[] {
    return this.dataStoreSection.getEntityUuids();
  }

  // #############################################################################################
  getModelEntities(): string[] {
    return this.modelStoreSection.getEntityUuids();
  }

  // ##############################################################################################
  async createModelStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ):Promise<ActionVoidReturnType> {
    return this.modelStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createDataStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ):Promise<ActionVoidReturnType> {
    return this.dataStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionVoidReturnType> {
    const result = await this.modelStoreSection.createEntity(entity,entityDefinition);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async createEntities(
    entities: {
      entity:Entity,
      entityDefinition: EntityDefinition,
    }[]
  ): Promise<ActionVoidReturnType> {
    const result = await this.modelStoreSection.createEntities(entities);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async renameEntityClean(update: ModelActionRenameEntity): Promise<ActionVoidReturnType> {
    return this.modelStoreSection.renameEntityClean(update);
  }

  // ##############################################################################################
  async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<ActionVoidReturnType> {
    return this.modelStoreSection.alterEntityAttribute(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string): Promise<ActionVoidReturnType> {
    return this.modelStoreSection.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]): Promise<ActionVoidReturnType> {
    return this.modelStoreSection.dropEntities(entityUuids);
  }

  // ##############################################################################################
  // used only for testing purposes!
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.dataStoreSection.getState();
  }
  
  // ##############################################################################################
  // used only for testing purposes!
  async getDataState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.dataStoreSection.getState();
  }
  
  // ##############################################################################################
  // used only for testing purposes!
  async getModelState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.modelStoreSection.getState();
  }
  
  // #############################################################################################
  async getInstance(section: ApplicationSection, entityUuid: string, uuid: Uuid): Promise<ActionEntityInstanceReturnType> {
    log.info(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid);
    
    // let result: EntityInstance | undefined;
    let result: ActionEntityInstanceReturnType;
    if (section == 'data') {
      result = await this.dataStoreSection.getInstance(entityUuid,uuid);
    } else {
      result = await this.modelStoreSection.getInstance(entityUuid, uuid);
    }
    log.trace(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid, "result", result);
    return result;
  }
  
  // #############################################################################################
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'getInstances','section',section,'entity',entityUuid);
    
    const currentStore = section == 'data'?this.dataStoreSection:this.modelStoreSection;
    const instances: ActionEntityInstanceCollectionReturnType = await currentStore.getInstances(entityUuid);

    if (instances.status != "ok") {
      return Promise.resolve({
        status: "error",
        error: {
          errorType: "FailedToGetInstances",
          errorMessage: `getInstances failed for section: ${section}, entityUuid ${entityEntity.uuid}, error: ${instances.error.errorType}, ${instances.error.errorMessage}`,
        },
      });
    }
    // if (instances.returnedDomainElement?.elementType != "entityInstanceCollection") {
    //   return Promise.resolve({
    //     status: "error",
    //     error: {
    //       errorType: "FailedToGetInstances",
    //       errorMessage: `getInstances failed for section: ${section}, entityUuid ${entityEntity.uuid} wrong element type, expected "entityInstanceCollection", got elementType: ${instances.returnedDomainElement?.elementType}`,
    //     },
    //   });
    // }
    const result:ActionEntityInstanceCollectionReturnType = {
      status: "ok",
      returnedDomainElement: {
        elementType: "entityInstanceCollection",
        elementValue: instances.returnedDomainElement.elementValue
      }
    }

    log.info(this.logHeader,'getInstances','section',section,'entity',entityUuid, "result", result);
    return result;
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<ActionVoidReturnType>{
    log.info(
      this.logHeader,
      "upsertInstance",
      "section",
      section,
      "instance",
      instance,
      "model entities",
      this.getModelEntities(),
      "data entities",
      this.getEntityUuids()
    );
    
    if (section == 'data') {
      await this.dataStoreSection.upsertInstance(instance.parentUuid,instance);
    } else {
      await this.modelStoreSection.upsertInstance(instance.parentUuid,instance);
    }

    // try {
    //   const foundInstance:ActionEntityInstanceReturnType = await this.getInstance(section, instance.parentUuid, instance.uuid)
    //   log.info(this.logHeader,'upsertInstance succeeded!','section',section,'instance',instance,"found", foundInstance);
    // } catch (e){
    //   throw new Error("UpsertInstance insert failed" + e);
    // }
    return Promise.resolve({ status: "ok", returnedDomainElement: { elementType: "void", elementValue: undefined } } );
  }

  // ##############################################################################################
  async deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<ActionVoidReturnType>{
    if (section == 'data') {
      await this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
    } else {
      await this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<ActionVoidReturnType>{
    for (const instance of instances) {
      if (section == 'data') {
        await this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
      } else {
        await this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
      }
    }
    return Promise.resolve(ACTION_OK);
  }
}
