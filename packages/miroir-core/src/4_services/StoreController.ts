
import { Application } from "../0_interfaces/1_core/Application.js";
import { EntityDefinition, MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import Instance, { ApplicationSection, EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { DataStoreInterface, ModelStoreInterface, StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { applyModelEntityUpdate } from "../3_controllers/ModelActionRunner.js";
import { DataStoreApplicationType, applicationModelEntities, modelInitialize } from "../3_controllers/ModelInitializer.js";
import entityEntity from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

export class StoreController implements StoreControllerInterface{
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    // private localUuidIndexedDb: IndexedDb,
    private modelStore:ModelStoreInterface,
    private dataStore:DataStoreInterface,
  ){
    this.logHeader = 'StoreController' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }
  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }

  getEntityNames(): string[] {
    return this.dataStore.getEntityNames();
  }

  getEntityUuids(): string[] {
    return this.dataStore.getEntityUuids();
  }

  dropData(): Promise<void> {
    return this.dataStore.dropData();
  }

  
  // #############################################################################################
  async dropModelAndData(metaModel: MiroirMetaModel):Promise<void>{
    await this.clear(metaModel);
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
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }

  // #############################################################################################
  async open():Promise<void> {
    await this.dataStore.connect(); // replace by open?
    await this.modelStore.connect();
    return Promise.resolve();
  }
  
  // ##############################################################################################
  async close():Promise<void> {
    await this.modelStore.close();
    await this.dataStore.close();
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear(metaModel: MiroirMetaModel):Promise<void> {
    console.log(this.logHeader,'clear',this.getEntities());
    // await this.dataStore.dropData(metaModel);
    await this.modelStore.dropModelAndData(metaModel);
    return Promise.resolve();
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.modelStore.existsEntity(entityUuid);
  }
  
  // #############################################################################################
  getEntities(): string[] {
    return this.dataStore.getEntityUuids();
  }

  // #############################################################################################
  getModelEntities(): string[] {
    return this.modelStore.getEntities();
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.modelStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // // #############################################################################################
  // async renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition):Promise<void> {
  //   return this.dataStore.renameStorageSpaceForInstancesOfEntity(oldName,newName,entity,entityDefinition);
  // }

  // // #############################################################################################
  // async dropStorageSpaceForInstancesOfEntity(entityUuid:Uuid):Promise<void> {
  //   return this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
  // }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    return this.modelStore.createEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    return this.modelStore.renameEntity(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.modelStore.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    return this.modelStore.dropEntities(entityUuids);
  }

  // ##############################################################################################
  // used only for testing purposes!
  // async getState():Promise<{[uuid:string]:EntityInstance[]}>{
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{
    return this.dataStore.getState();
    // let result = {};
    // console.log('getState this.getEntities()',this.getEntities());
    
    // for (const parentUuid of this.getEntities()) {
    //   console.log('getState getting instances for',parentUuid);
    //   const instances = await this.getDataInstances(parentUuid);
    //   console.log('getState found instances',parentUuid,instances);
      
    //   Object.assign(result,{[parentUuid]:instances});
    // }
    // return Promise.resolve(result);
  }
  
  // #############################################################################################
  // async getInstances(parentUuid:string):Promise<any> {
  async getInstances(section: ApplicationSection, entityUuid: string): Promise<EntityInstanceCollection> {
    // TODO: fix applicationSection!!!
    const modelEntitiesUuid = this.dataStoreType == "app"?applicationModelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    console.log(this.logHeader,'getInstances','section',section,'entity',entityUuid,'found modelEntities',modelEntitiesUuid);


    // if (modelEntitiesUuid.includes(entityUuid)) {
    if (section == 'data') {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'data', instances: await this.dataStore.getInstances(entityUuid)});
    } else {
      return Promise.resolve({parentUuid:entityUuid, applicationSection:'model', instances: await this.modelStore.getInstances(entityUuid)});
    }
    // return {parentUuid:entityUuid,applicationSection:'model',instances:await this.localUuidIndexedDb.getAllValue(entityUuid) as EntityInstance[]};
  }
  
  // ##############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    console.log(this.logHeader,'upsertInstance','section',section,'type',this.dataStoreType,'instance',instance,'model entities',this.getModelEntities(),'data entities',this.getEntities());
    
    // if (this.getEntities().includes(parentUuid)) {
    if (section == 'data') {
      await this.dataStore.upsertInstance(instance.parentUuid,instance);
    } else {
      await this.modelStore.upsertInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>{
    if (section == 'data') {
      await this.dataStore.deleteInstance(instance.parentUuid,instance);
    } else {
      await this.modelStore.deleteInstance(instance.parentUuid,instance);
    }
    return Promise.resolve(instance);
  }

  // ##############################################################################################
  async deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>{
    for (const instance of instances) {
      if (section == 'data') {
        await this.dataStore.deleteInstance(instance.parentUuid,instance);
      } else {
        await this.modelStore.deleteInstance(instance.parentUuid,instance);
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
