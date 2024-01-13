
import { Application } from "../0_interfaces/1_core/Application.js";
import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { MiroirApplicationModel } from "../0_interfaces/1_core/Model.js";
import {
  ApplicationSection,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  StoreSectionConfiguration,
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
  log.info('storeSectionFactory called for', section, config);
  if (section == 'model' && !dataStore) {
    throw new Error('storeSectionFactory model section factory must receive data section store.')
  }
  const storeFactoryRegisterKey:string = JSON.stringify({storageType:config.emulatedServerType,section});
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
// MAIN CLASS: StoreController
// #######################################################################################################################
export class StoreController implements StoreControllerInterface{
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
    metaModel:MiroirApplicationModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeploymentConfiguration: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>{
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
    return Promise.resolve();
  }


  // #############################################################################################
  async bootFromPersistedState(
    metaModelEntities : MetaEntity[],
    metaModelEntityDefinitions : EntityDefinition[],
  ):Promise<void> {
    await this.modelStoreSection.bootFromPersistedState(metaModelEntities, metaModelEntityDefinitions);
    const dataEntities = await this.modelStoreSection.getInstances(entityEntity.uuid) as MetaEntity[];
    const dataEntityDefinitions = await this.modelStoreSection.getInstances(entityEntityDefinition.uuid) as EntityDefinition[];
    await this.dataStoreSection.bootFromPersistedState(
      dataEntities.filter((e) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1), // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
      dataEntityDefinitions
    );
    return Promise.resolve();
  }

  // #############################################################################################
  async open():Promise<void> {
    await this.dataStoreSection.open();
    await this.modelStoreSection.open();
    return Promise.resolve();
  }
  
  // ##############################################################################################
  async close():Promise<void> {
    await this.modelStoreSection.close();
    await this.dataStoreSection.close();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear():Promise<void> {
    log.info(this.logHeader,'clear',this.getEntityUuids());
    await this.dataStoreSection.clear();
    await this.modelStoreSection.clear();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clearDataInstances():Promise<void> {
    log.debug(this.logHeader, "clearDataInstances", this.getEntityUuids());
    const dataSectionEntities: EntityInstanceCollection = await this.getInstances("model", entityEntity.uuid);
    const dataSectionEntityDefinitions: EntityInstanceCollection = await this.getInstances(
      "model",
      entityEntityDefinition.uuid
    );
    const dataSectionFilteredEntities: MetaEntity[] = (dataSectionEntities.instances as MetaEntity[]).filter(
      (e: MetaEntity) => ["Entity", "EntityDefinition"].indexOf(e.name) == -1
    ); // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
    log.trace(this.logHeader, "clearDataInstances found entities to clear:", dataSectionFilteredEntities);
    await this.dataStoreSection.clear();

    for (const entity of dataSectionFilteredEntities) {
      const entityDefinition: EntityDefinition | undefined = dataSectionEntityDefinitions.instances.find(
        (d: EntityDefinition) => d.entityUuid == entity.uuid
      ) as EntityDefinition;
      if (entityDefinition) {
        await this.createDataStorageSpaceForInstancesOfEntity(entity, entityDefinition);
      } else {
        log.error(this.logHeader, "clearDataInstances could not find entity definition for Entity", entity);
      }
    }
    return Promise.resolve();
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
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.modelStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createDataStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.dataStoreSection.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    const result = await this.modelStoreSection.createEntity(entity,entityDefinition);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate){
    return this.modelStoreSection.renameEntity(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.modelStoreSection.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
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
  async getInstance(section: ApplicationSection, entityUuid: string, uuid: Uuid): Promise<EntityInstance | undefined> {
    log.info(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid);
    
    let result: EntityInstance | undefined;
    if (section == 'data') {
      result = await this.dataStoreSection.getInstance(entityUuid,uuid);
    } else {
      result = await this.modelStoreSection.getInstance(entityUuid, uuid);
    }
    log.trace(this.logHeader,'getInstance','section',section,'entity',entityUuid, "uuid", uuid, "result", result);
    return result;
  }
  
  // #############################################################################################
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<EntityInstanceCollection> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'getInstances','section',section,'entity',entityUuid);
    
    let result: EntityInstanceCollection;
    if (section == 'data') {
      result = await Promise.resolve({
        parentUuid: entityUuid,
        applicationSection: "data",
        instances: await this.dataStoreSection.getInstances(entityUuid),
      });
    } else {
      result = await Promise.resolve({
        parentUuid: entityUuid,
        applicationSection: "model",
        instances: await this.modelStoreSection.getInstances(entityUuid),
      });
    }
    log.trace(this.logHeader,'getInstances','section',section,'entity',entityUuid, "result", result);
    return result;
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    log.info(this.logHeader,'upsertInstance','section',section,'instance',instance,'model entities',this.getModelEntities(),'data entities',this.getEntityUuids());
    
    if (section == 'data') {
      await this.dataStoreSection.upsertInstance(instance.parentUuid,instance);
    } else {
      await this.modelStoreSection.upsertInstance(instance.parentUuid,instance);
    }

    // try {
    //   const foundInstance = await this.getInstance(section, instance.parentUuid, instance.uuid)
    //   log.info(this.logHeader,'upsertInstance succeeded!','section',section,'instance',instance,"found", foundInstance);
    // } catch (e){
    //   throw new Error("UpsertInstance insert failed" + e);
    // }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    if (section == 'data') {
      await this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
    } else {
      await this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>{
    for (const instance of instances) {
      if (section == 'data') {
        await this.dataStoreSection.deleteInstance(instance.parentUuid,instance);
      } else {
        await this.modelStoreSection.deleteInstance(instance.parentUuid,instance);
      }
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<void>{
    log.info('StoreController applyModelEntityUpdate',update);
    await applyModelEntityUpdate(this,update);
    return Promise.resolve();
  }
}
