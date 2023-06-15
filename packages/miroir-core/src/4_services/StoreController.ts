
import { Application } from "../0_interfaces/1_core/Application.js";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { EmulatedServerConfig, MiroirConfig } from "../0_interfaces/1_core/MiroirConfig.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { IDataSectionStore, IModelSectionStore, IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import { StoreFactoryRegister } from "../3_controllers/ConfigurationService.js";
import { applyModelEntityUpdate } from "../3_controllers/ModelActionRunner.js";
import { applicationModelEntities, modelInitialize } from "../3_controllers/ModelInitializer.js";
import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

// #######################################################################################################################
export interface StoreControllerFactoryReturnType {
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
}


// #######################################################################################################################
export async function storeFactory (
  storeFactoryRegister:StoreFactoryRegister,
  appName: string,
  dataStoreApplicationType: DataStoreApplicationType,
  section:ApplicationSection,
  config: EmulatedServerConfig,
  dataStore?: IDataSectionStore,
):Promise<IDataSectionStore | IModelSectionStore> {
  console.log('storeFactory called for',appName, dataStoreApplicationType, section, config);
  if (section == 'model' && !dataStore) {
    throw new Error('storeFactory model section factory must receive data section store.')
  }
  const storeFactoryRegisterKey:string = JSON.stringify({storageType:config.emulatedServerType,section});
  const foundStoreFactory = storeFactoryRegister.get(storeFactoryRegisterKey);
  if (foundStoreFactory) {
    if (section == 'model') {
      return foundStoreFactory(appName,dataStoreApplicationType,section,config,dataStore)
    } else {
      return foundStoreFactory(appName,dataStoreApplicationType,section,config)
    }
  } else {
    throw new Error('foundStoreFactory is undefined for ' + config.emulatedServerType + ', section ' + section)
  }
}


// #################################################################################################################
export async function StoreControllerFactory(
  storeFactoryRegister:StoreFactoryRegister,
  miroirConfig:MiroirConfig,
): Promise<StoreControllerFactoryReturnType> {
  let localMiroirStoreController,localAppStoreController;

  console.log('StoreControllerFactory called with config:',miroirConfig);

  if (!miroirConfig.emulateServer) {
    throw new Error('StoreControllerFactory emulateServer must be true in miroirConfig, tests must be independent of server.'); // TODO: really???
  }

  let miroirModelStore:IModelSectionStore, miroirDataStore:IDataSectionStore, appModelStore:IModelSectionStore, appDataStore:IDataSectionStore;
  appDataStore = await storeFactory(storeFactoryRegister, 'library','app','data',miroirConfig.appServerConfig.data) as IDataSectionStore;
  appModelStore = await storeFactory(storeFactoryRegister, 'library','app','model',miroirConfig.appServerConfig.model,appDataStore) as IModelSectionStore;
  miroirDataStore = await storeFactory(storeFactoryRegister, 'miroir','miroir','data',miroirConfig.miroirServerConfig.data) as IDataSectionStore;
  miroirModelStore = await storeFactory(storeFactoryRegister, 'miroir','miroir','model',miroirConfig.miroirServerConfig.model,miroirDataStore) as IModelSectionStore;

  localAppStoreController = new StoreController('library','app',appModelStore,appDataStore);
  localMiroirStoreController = new StoreController('miroir','miroir',miroirModelStore,miroirDataStore);

  return Promise.resolve({
    localMiroirStoreController,
    localAppStoreController,
  });
}

// #######################################################################################################################
export class StoreController implements IStoreController{
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private modelSectionStore:IModelSectionStore,
    private dataSectionStore:IDataSectionStore,
  ){
    this.logHeader = 'StoreController' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }


  // #############################################################################################
  async initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>{
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      application,
      applicationDeployment,
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
    await this.modelSectionStore.bootFromPersistedState(metaModelEntities, metaModelEntityDefinitions);
    const dataEntities = await this.modelSectionStore.getInstances(entityEntity.uuid) as MetaEntity[];
    const dataEntityDefinitions = await this.modelSectionStore.getInstances(entityEntityDefinition.uuid) as EntityDefinition[];
    await this.dataSectionStore.bootFromPersistedState(
      dataEntities.filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1), // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
      dataEntityDefinitions
    );
    return Promise.resolve();
  }

  // #############################################################################################
  async open():Promise<void> {
    await this.dataSectionStore.open(); // replace by open?
    await this.modelSectionStore.open();
    return Promise.resolve();
  }
  
  // ##############################################################################################
  async close():Promise<void> {
    await this.modelSectionStore.close();
    await this.dataSectionStore.close();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear():Promise<void> {
    console.log(this.logHeader,'clear',this.getEntityUuids());
    await this.dataSectionStore.clear();
    await this.modelSectionStore.clear();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clearDataInstances():Promise<void> {
    console.log(this.logHeader,'clearDataInstances',this.getEntityUuids());
    const dataSectionEntities:EntityInstanceCollection = await this.getInstances("model", entityEntity.uuid);
    const dataSectionEntityDefinitions:EntityInstanceCollection = await this.getInstances("model", entityEntityDefinition.uuid);
    const dataSectionFilteredEntities:MetaEntity[] = (dataSectionEntities.instances as MetaEntity[]).filter((e:MetaEntity)=>['Entity','EntityDefinition'].indexOf(e.name)==-1); // for Miroir application only, which has the Meta-Entities Entity and EntityDefinition defined in its Entity table
    console.log(this.logHeader,'clearDataInstances found entities to clear:',dataSectionFilteredEntities);
    await this.dataSectionStore.clear();
    
    for (const entity of dataSectionFilteredEntities) {
      const entityDefinition: EntityDefinition | undefined = dataSectionEntityDefinitions.instances.find((d:EntityDefinition)=>d.entityUuid == entity.uuid) as EntityDefinition;
      if (entityDefinition) {
        await this.createDataStorageSpaceForInstancesOfEntity(entity,entityDefinition);
      } else {
        console.error(this.logHeader,'clearDataInstances could not find entity definition for Entity',entity);
      }
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.modelSectionStore.existsEntity(entityUuid);
  }
  
  // #############################################################################################
  getEntityUuids(): string[] {
    return this.dataSectionStore.getEntityUuids();
  }

  // #############################################################################################
  getModelEntities(): string[] {
    return this.modelSectionStore.getEntityUuids();
  }

  // ##############################################################################################
  async createModelStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.modelSectionStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createDataStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.dataSectionStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    return this.modelSectionStore.createEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate){
    return this.modelSectionStore.renameEntity(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.modelSectionStore.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    return this.modelSectionStore.dropEntities(entityUuids);
  }

  // ##############################################################################################
  // used only for testing purposes!
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.dataSectionStore.getState();
  }
  
  // #############################################################################################
  // async getInstances(parentUuid:string):Promise<any> {
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<EntityInstanceCollection> {
    // TODO: fix applicationSection!!!
    const modelEntitiesUuid = this.dataStoreType == "app"?applicationModelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    console.log(this.logHeader,'getInstances','section',section,'entity',entityUuid,'found modelEntities',modelEntitiesUuid);


    // if (modelEntitiesUuid.includes(entityUuid)) {
    if (section == 'data') {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'data', instances: await this.dataSectionStore.getInstances(entityUuid)});
    } else {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'model', instances: await this.modelSectionStore.getInstances(entityUuid)});
    }
    // return {parentUuid:entityUuid,applicationSection:'model',instances:await this.localUuidIndexedDb.getAllValue(entityUuid) as EntityInstance[]};
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    console.log(this.logHeader,'upsertInstance','section',section,'type',this.dataStoreType,'instance',instance,'model entities',this.getModelEntities(),'data entities',this.getEntityUuids());
    
    // if (this.getEntityUuids().includes(parentUuid)) {
    if (section == 'data') {
      await this.dataSectionStore.upsertInstance(instance.parentUuid,instance);
    } else {
      await this.modelSectionStore.upsertInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    if (section == 'data') {
      await this.dataSectionStore.deleteInstance(instance.parentUuid,instance);
    } else {
      await this.modelSectionStore.deleteInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>{
    for (const instance of instances) {
      if (section == 'data') {
        await this.dataSectionStore.deleteInstance(instance.parentUuid,instance);
      } else {
        await this.modelSectionStore.deleteInstance(instance.parentUuid,instance);
      }
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<void>{
    console.log('StoreController applyModelEntityUpdate',update);
    await applyModelEntityUpdate(this,update);
    return Promise.resolve();
  }
}
