import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
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
  SelfApplication,
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
import { MiroirLoggerFactory } from "./LoggerFactory.js";
import { cleanLevel } from "./constants.js";

import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  Domain2ElementFailed
} from "../0_interfaces/2_domain/DomainElement.js";
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
  async handleBoxedExtractorAction(action: RunBoxedExtractorAction): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedExtractorAction','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
    const result: Action2ReturnType = await currentStore.handleBoxedExtractorAction(action);

    log.info(this.logHeader,'handleBoxedExtractorAction','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleBoxedQueryAction(action: RunBoxedQueryAction): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedQueryAction called with RunBoxedQueryAction',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
    const result: Action2ReturnType = await currentStore.handleBoxedQueryAction(action);

    log.info(this.logHeader,'handleBoxedQueryAction done  for query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleBoxedExtractorTemplateActionForServerONLY(action: RunBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: Action2ReturnType = await currentStore.handleBoxedExtractorTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleQueryTemplateActionForServerONLY(action: RunBoxedQueryTemplateAction): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: Action2ReturnType = await currentStore.handleQueryTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(action: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',action);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // TODO: composite actions / queries could execute on different sections, how should this be dealt with? 
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const currentStore: PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface =
      action.applicationSection == "data" ? this.dataStoreSection : this.modelStoreSection;
      
    const result: Action2ReturnType = await currentStore.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(action);

    log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',action, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleAction(persistenceStoreControllerAction: PersistenceStoreControllerAction): Promise<Action2ReturnType> {
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
            return this.getInstance(
              persistenceStoreControllerAction.applicationSection,
              persistenceStoreControllerAction.parentUuid,
              persistenceStoreControllerAction.uuid
            );
            break;
          }
          case "getInstances": {
            return this.getInstances(
              persistenceStoreControllerAction.applicationSection,
              persistenceStoreControllerAction.parentUuid
            );
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
        params.selfApplication,
        // params.selfApplicationDeploymentConfiguration,
        params.applicationModelBranch,
        params.applicationVersion,
        // params.applicationStoreBasedConfiguration
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
        params.selfApplication,
        // params.selfApplicationDeploymentConfiguration,
        params.applicationModelBranch,
        params.applicationVersion,
        // params.applicationStoreBasedConfiguration
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
    selfApplication: SelfApplication,
    // selfApplicationDeploymentConfiguration: SelfApplicationDeploymentConfiguration,
    selfApplicationModelBranch: EntityInstance,
    selfApplicationVersion: EntityInstance,
    // selfApplicationStoreBasedConfiguration: EntityInstance,
  ):Promise<Action2ReturnType>{
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      selfApplication,
      // selfApplicationDeploymentConfiguration,
      selfApplicationModelBranch,
      selfApplicationVersion,
      // selfApplicationStoreBasedConfiguration,
    );
    return Promise.resolve(ACTION_OK);
  }


  // #############################################################################################
  async bootFromPersistedState(
    metaModelEntities : Entity[],
    metaModelEntityDefinitions : EntityDefinition[],
  ):Promise<Action2VoidReturnType> {
    const modelBootFromPersistedState: Action2ReturnType = await this.modelStoreSection.bootFromPersistedState(
      metaModelEntities,
      metaModelEntityDefinitions
    );
    if (modelBootFromPersistedState instanceof Action2Error) {
      return new Action2Error("FailedToGetInstances", `bootFromPersistedState failed for section model: ${modelBootFromPersistedState.errorMessage}`);
    }
    const dataEntities:Action2EntityInstanceCollectionOrFailure = await this.modelStoreSection.getInstances(entityEntity.uuid);
    const dataEntityDefinitions:Action2EntityInstanceCollectionOrFailure = await this.modelStoreSection.getInstances(entityEntityDefinition.uuid);

    if (dataEntities instanceof Action2Error || dataEntities.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `bootFromPersistedState for entities getInstances(${entityEntity.uuid}) status: ${
        dataEntities.status
      }. Message: ${dataEntities instanceof Action2Error ? dataEntities?.errorMessage: ""}`);
    }
    if (dataEntityDefinitions instanceof Action2Error || dataEntityDefinitions.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `bootFromPersistedState for entityDefinitions getInstances(${entityEntityDefinition.uuid}) status: ${
        dataEntityDefinitions.status
      }. Message: ${dataEntityDefinitions instanceof Action2Error ? dataEntityDefinitions?.errorMessage: ""}`);
    }

    log.info(this.logHeader,'bootFromPersistedState for data section with dataEntities',dataEntities);
    const dataBootFromPersistedState = await this.dataStoreSection.bootFromPersistedState(
      ((dataEntities as any).returnedDomainElement?.instances as Entity[]).filter(
        (e) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1
      ), // for Miroir selfApplication only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
      (dataEntityDefinitions as any).returnedDomainElement?.instances as EntityDefinition[]
    );
    if (dataBootFromPersistedState instanceof Action2Error || dataBootFromPersistedState.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `bootFromPersistedState failed for section data: ${dataBootFromPersistedState}`);
    }
    
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  async open():Promise<Action2VoidReturnType> {
    await this.adminStore.open();
    await this.dataStoreSection.open();
    await this.modelStoreSection.open();
    return Promise.resolve(ACTION_OK);
  }
  
  // ##############################################################################################
  async close():Promise<Action2VoidReturnType> {
    await this.adminStore.close();
    await this.modelStoreSection.close();
    await this.dataStoreSection.close();
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    return this.adminStore.createStore(config);
  }
  
  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    return this.adminStore.deleteStore(config);
  }

  // ##############################################################################################
  async clear():Promise<Action2VoidReturnType> {
    log.info(this.logHeader,'clear',this.getEntityUuids());
    await this.dataStoreSection.clear();
    await this.modelStoreSection.clear();
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async clearDataInstances():Promise<Action2VoidReturnType> {
    log.debug(this.logHeader, "clearDataInstances", this.getEntityUuids());
    const dataSectionEntities: Action2EntityInstanceCollectionOrFailure = await this.getInstances("model", entityEntity.uuid);
    if (dataSectionEntities instanceof Action2Error) {
      return new Action2Error("FailedToGetInstances", `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid}, error: ${dataSectionEntities.errorType}, ${dataSectionEntities.errorMessage}`);
    }
    if (dataSectionEntities.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid}, error: ${dataSectionEntities}`);
    }
    const dataSectionEntityDefinitions: Action2EntityInstanceCollectionOrFailure = await this.getInstances("model", entityEntityDefinition.uuid);
    if (dataSectionEntityDefinitions instanceof Action2Error) {
      return new Action2Error("FailedToGetInstances", `clearDataInstances failed for dataSectionEntityDefinitions section: model, entityUuid ${entityEntityDefinition.uuid}, error: ${dataSectionEntityDefinitions}`);
    }
    if (dataSectionEntityDefinitions.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `clearDataInstances failed for dataSectionEntityDefinitions section: model, entityUuid ${entityEntityDefinition.uuid}, error: ${dataSectionEntityDefinitions}`);
    }
    const dataSectionFilteredEntities: Entity[] = (
      dataSectionEntities.returnedDomainElement.instances as Entity[]
    ).filter((e: EntityInstanceWithName) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1); // for Miroir selfApplication only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
    log.trace(this.logHeader, "clearDataInstances found entities to clear:", dataSectionFilteredEntities);
    await this.dataStoreSection.clear();

    for (const entity of dataSectionFilteredEntities) {
      const entityDefinition: EntityDefinition | undefined =
        dataSectionEntityDefinitions.returnedDomainElement.instances.find(
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
  ):Promise<Action2VoidReturnType> {
    return this.modelStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createDataStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ):Promise<Action2VoidReturnType> {
    return this.dataStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType> {
    const result = await this.modelStoreSection.createEntity(entity,entityDefinition);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async createEntities(
    entities: {
      entity:Entity,
      entityDefinition: EntityDefinition,
    }[]
  ): Promise<Action2VoidReturnType> {
    const result = await this.modelStoreSection.createEntities(entities);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.renameEntityClean(update);
  }

  // ##############################################################################################
  async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.alterEntityAttribute(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
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
  async getInstance(section: ApplicationSection, entityUuid: string, uuid: Uuid): Promise<Action2EntityInstanceReturnType> {
    log.info(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid);
    
    // let result: EntityInstance | undefined;
    let result: Action2EntityInstanceReturnType;
    if (section == 'data') {
      result = await this.dataStoreSection.getInstance(entityUuid,uuid);
    } else {
      result = await this.modelStoreSection.getInstance(entityUuid, uuid);
    }
    log.trace(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid, "result", result);
    return result;
  }
  
  // #############################################################################################
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'getInstances','section',section,'entity',entityUuid);
    
    const currentStore = section == 'data'?this.dataStoreSection:this.modelStoreSection;
    const instances: Action2EntityInstanceCollectionOrFailure = await currentStore.getInstances(entityUuid);

    if (instances instanceof Action2Error) {
      return new Action2Error("FailedToGetInstances", `getInstances failed for section: ${section}, entityUuid ${entityEntity.uuid}, error: ${instances.errorType}, ${instances.errorMessage}`);
    }
    if (instances.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error("FailedToGetInstances", `getInstances failed for section: ${section}, entityUuid ${entityEntity.uuid}, error: ${instances}`);
    }

    log.info(this.logHeader,'getInstances','section',section,'entity',entityUuid, "result", instances);
    return instances;
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<Action2VoidReturnType>{
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
      return this.dataStoreSection.upsertInstance(instance.parentUuid,instance);
    } else {
      return this.modelStoreSection.upsertInstance(instance.parentUuid,instance);
    }
  }

  // ##############################################################################################
  async deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<Action2VoidReturnType>{
    if (section == 'data') {
      return this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
    } else {
      return this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<Action2VoidReturnType>{
    for (const instance of instances) {
      if (section == 'data') {
        return this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
      } else {
        return this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
      }
    }
    return Promise.resolve(ACTION_OK);
  }
}
