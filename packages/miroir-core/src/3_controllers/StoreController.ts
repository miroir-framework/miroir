import {
  Application,
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  MiroirMetaModel,
  ModelReplayableUpdate,
  ModelStoreInterface,
  StoreControllerInterface,
  WrappedModelEntityUpdateWithCUDUpdate,
  applyModelEntityUpdate,
  entityEntity,
  entityEntityDefinition,
  metamodelEntities,
  modelInitialize
} from "miroir-core";


export class StoreController implements StoreControllerInterface {
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private modelStore:ModelStoreInterface,
    private dataStore:DataStoreInterface,
    ) {
    this.logHeader = 'StoreController' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }

  connect():Promise<void> {
    throw new Error("Method not implemented.");
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    await applyModelEntityUpdate(this,update);
  }
  
  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log(this.logHeader,'upsertInstance application',this.applicationName,'type',this.dataStoreType,'parentUuid',parentUuid,'data entities',this.getEntities());
    
    if (this.getEntities().includes(parentUuid)) {
      await this.upsertDataInstance(parentUuid,instance);
    } else {
      await this.upsertModelInstance(parentUuid,instance);
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async getInstances(parentUuid: string): Promise<EntityInstanceCollection> {
    const modelEntitiesUuid = this.dataStoreType == "app"?metamodelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    if (modelEntitiesUuid.includes(parentUuid)) {
      return Promise.resolve({parentUuid:parentUuid, applicationSection:'model', instances: await this.getModelInstances(parentUuid)});
    } else {
      return Promise.resolve({parentUuid:parentUuid, applicationSection:'data', instances: await this.getDataInstances(parentUuid)});
    }
  }

  // ##############################################################################################
  open() {
      // connect to DB?
      console.warn('sqlDbDataStore does nothing!');
  }

  // ##############################################################################################
  async close() {
    await this.modelStore.close();
    await this.dataStore.close();
    return Promise.resolve();
    // disconnect from DB?
  }
  


  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    return this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
  }

  getEntityNames(): string[] {
    return this.dataStore.getEntityNames();
  }
  getEntityUuids(): string[] {
    return this.dataStore.getEntityUuids();
  }
  dropData(): Promise<void> {
    return this.dataStore.dropData();
  }
  
  // ##############################################################################################
  async initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void> {
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      application,
      applicationDeployment,
      applicationModelBranch,
      applicationVersion,
      applicationStoreBasedConfiguration
    );
    return Promise.resolve(undefined);
  }

  // ##############################################################################################
  async dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void> {
    return this.modelStore.dropModelAndData(metaModel);
  }
    
  // ##############################################################################################
  // does side effects! ugly!
  async bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void> {
    return this.modelStore.bootFromPersistedState(entities,entityDefinitions);
  }
  

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.modelStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    return this.modelStore.createEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.modelStore.dropEntity(entityUuid);
  }


  // ##############################################################################################
    async getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
      return this.modelStore.getModelInstances(parentUuid);
    }



  // ##############################################################################################
  async clear(metaModel: MiroirMetaModel):Promise<void> { // redundant with dropModelAndData?
    return this.dropModelAndData(metaModel)
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.modelStore.getEntities();
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    return this.modelStore.dropEntities(entityUuids);
  }

  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.dataStore.renameStorageSpaceForInstancesOfEntity(oldName,newName,entity,entityDefinition);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    return this.modelStore.renameEntity(update);
  }


  // ##############################################################################################
  async upsertModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.modelStore.upsertModelInstance(parentUuid,instance)
  }


  // ##############################################################################################
  async deleteModelInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.modelStore.deleteModelInstances(parentUuid,instances);
  }


  // ##############################################################################################
  async deleteModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.modelStore.deleteModelInstance(parentUuid,instance);
  }


  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.modelStore.existsEntity(entityUuid);
  }


  // ##############################################################################################
  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in IndexedDbDataStore
    return this.dataStore.getState();
  }

  // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    return this.dataStore.getDataInstance(parentUuid,uuid);
  }

  // ##############################################################################################
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    return this.dataStore.getDataInstances(parentUuid);
  }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.dataStore.upsertDataInstance(parentUuid,instance);
  }

  // ##############################################################################################
  async deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.dataStore.deleteDataInstances(parentUuid,instances);
  }


  // ##############################################################################################
  async deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.dataStore.deleteDataInstance(parentUuid,instance);
  }
}
