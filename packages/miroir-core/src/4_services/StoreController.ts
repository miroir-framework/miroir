
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
  ModelActionRenameEntity,
  StoreSectionConfiguration,
  actionReturnType,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  ModelReplayableUpdate,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
} from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import {
  AdminStoreInterface,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  StoreControllerInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/StoreControllerInterface.js";
import { applyModelEntityUpdate } from "../3_controllers/ActionRunner.js";
import { modelInitialize } from "../3_controllers/ModelInitializer.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { MiroirLoggerFactory } from "./Logger.js";
import { cleanLevel } from "./constants.js";

import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { ACTION_OK } from "../1_core/constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"StoreController");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// #######################################################################################################################
export interface StoreControllerFactoryReturnType {
  localMiroirStoreController: StoreControllerInterface,
  localAppStoreController: StoreControllerInterface,
}


// #######################################################################################################################
export async function storeSectionFactory (
  StoreSectionFactoryRegister:StoreSectionFactoryRegister,
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  dataStore?: StoreDataSectionInterface,
):Promise<StoreDataSectionInterface | StoreModelSectionInterface> {
  log.info('StoreController storeSectionFactory called for', section, config, StoreSectionFactoryRegister);
  if (section == 'model' && !dataStore) {
    throw new Error('StoreController storeSectionFactory model section factory must receive data section store.')
  }
  const storeFactoryRegisterKey:string = JSON.stringify({storageType:config.emulatedServerType,section});
  log.info("StoreController storeSectionFactory storeFactoryRegisterKey", storeFactoryRegisterKey);
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
// #######################################################################################################################
// #######################################################################################################################
// MAIN CLASS: StoreController
// #######################################################################################################################
export class StoreController implements StoreControllerInterface {
  private logHeader: string;

  constructor(
    private adminStore: AdminStoreInterface,
    private modelStoreSection:StoreModelSectionInterface,
    private dataStoreSection:StoreDataSectionInterface,
  ){
    this.logHeader = 'StoreController '+ modelStoreSection.getStoreName();
  }

  // #########################################################################################
  getStoreName(): string {
    return this.modelStoreSection.getStoreName();
  }

  // #############################################################################################
  async initApplication(
    metaModel:MetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeploymentConfiguration: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<ActionReturnType>{
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      application,
      applicationDeploymentConfiguration,
      applicationModelBranch,
      applicationVersion,
      applicationStoreBasedConfiguration,
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
    // if (dataEntities.returnedDomainElement?.elementType != "entityInstanceCollection" || dataEntityDefinitions.returnedDomainElement?.elementType != "entityInstanceCollection") {
    //   return Promise.resolve({
    //     status: "error",
    //     error: {
    //       errorType: "FailedToGetInstances",
    //       errorMessage: `bootFromPersistedState for entities wrong element type, expected "instanceArray", got getInstances(${entityEntity.uuid}) elementType: ${dataEntities.returnedDomainElement?.elementType}, getInstances(${entityEntityDefinition.uuid}) elementType: ${dataEntityDefinitions.returnedDomainElement?.elementType}`,
    //     },
    //   });
    // }

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
        (d: EntityDefinition) => d.entityUuid == entity.uuid
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
  async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<ActionVoidReturnType> {
    return this.modelStoreSection.renameEntity(update);
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
  // async getInstance(section: ApplicationSection, entityUuid: string, uuid: Uuid): Promise<EntityInstance | undefined> {
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
  // async getInstances(section: ApplicationSection, entityUuid: string): Promise<EntityInstanceCollection> {
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
    log.info(this.logHeader,'upsertInstance','section',section,'instance',instance,'model entities',this.getModelEntities(),'data entities',this.getEntityUuids());
    
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

  // ##############################################################################################
  async applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<ActionVoidReturnType>{
    log.info('StoreController applyModelEntityUpdate',update);
    await applyModelEntityUpdate(this,update);
    return Promise.resolve(ACTION_OK);
  }
}
