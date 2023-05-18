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
  StoreFacadeInterface,
  Uuid,
  WrappedModelEntityUpdateWithCUDUpdate,
  applyModelEntityUpdate,
  entityEntity,
  entityEntityDefinition,
  metamodelEntities
} from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlDbModelStore } from "./SqlDbModelStore.js";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";
import { SqlDbDataStore } from "./SqlDbDataStore.js";


  export class SqlDbStoreFacade implements StoreFacadeInterface {
  private logHeader: string;
  private sqlDbDataDataStore:DataStoreInterface;
  private sqlDbModelStore:ModelStoreInterface;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private modelSequelize: Sequelize,
    private modelSchema: string,
    dataSequelize: Sequelize,
    dataSchema: string,
  ) {
    this.logHeader = 'SqlDbStoreFacade' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
    this.sqlDbDataDataStore = new SqlDbDataStore(applicationName,dataStoreType,dataSequelize,dataSchema);
    this.sqlDbModelStore = new SqlDbModelStore(applicationName,dataStoreType,modelSequelize,modelSchema,this.sqlDbDataDataStore,this);
  }

  getEntityNames(): string[] {
    throw new Error("Method not implemented.");
  }
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  dropData(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  bootDataStoreFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dropStorageSpaceForInstancesOfEntity(entityUuid:Uuid) {
    throw new Error("Method not implemented.");
  }

  // ##############################################################################################
  // TODO: does side effect on sequelize object => refactor!
  getAccessToEntity(sequelize:Sequelize, entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entity.uuid]: {
        parentName: entity.parentName, 
        sequelizeModel: sequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.modelSchema,
          }
        ),
      },
    };
  }
  
  // ##############################################################################################
  // TODO: does side effect => refactor!
  getAccessToModelSectionEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.modelSequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.modelSchema,
          }
        ),
      },
    };
  }
  
  
  // // ##############################################################################################
  async initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
    ):Promise<void> {
      return this.sqlDbModelStore.initApplication(
      metaModel,
      dataStoreType,
      application,
      applicationDeployment,
      applicationModelBranch,
      applicationVersion,
      applicationStoreBasedConfiguration,
    )
  }

  // ##############################################################################################
  async dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void> {
    return this.sqlDbModelStore.dropModelAndData(metaModel);
  }
    
  // ##############################################################################################
  // does side effects! ugly!
  async bootFromPersistedState(
    metaModel:MiroirMetaModel,
  ): Promise<void> {
    return this.sqlDbModelStore.bootFromPersistedState(metaModel);
  }
  

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.sqlDbModelStore.createStorageSpaceForInstancesOfEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    return this.sqlDbModelStore.createEntity(entity,entityDefinition);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    return this.sqlDbModelStore.dropEntity(entityUuid);
  }


  // ##############################################################################################
    async getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
      return this.sqlDbModelStore.getModelInstances(parentUuid);
    }


  // ##############################################################################################
  // async getInstances(parentUuid: string): Promise<EntityInstance[]> {
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
    await this.modelSequelize.close();
    await this.sqlDbDataDataStore.close();
    return Promise.resolve();
    // disconnect from DB?
  }

  // ##############################################################################################
  async clear(metaModel: MiroirMetaModel):Promise<void> { // redundant with dropModelAndData?
    return this.dropModelAndData(metaModel)
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.sqlDbModelStore.getEntities();
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    return this.sqlDbModelStore.dropEntities(entityUuids);
  }

  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition,
  ):Promise<void> {
    return this.sqlDbDataDataStore.renameStorageSpaceForInstancesOfEntity(oldName,newName,entity,entityDefinition);
  }

  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    return this.sqlDbModelStore.renameEntity(update);
  }


  // ##############################################################################################
  async upsertModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.sqlDbModelStore.upsertModelInstance(parentUuid,instance)
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
  async deleteModelInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.sqlDbModelStore.deleteModelInstances(parentUuid,instances);
  }


  // ##############################################################################################
  async deleteModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.sqlDbModelStore.deleteModelInstance(parentUuid,instance);
  }


  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return this.sqlDbModelStore.existsEntity(entityUuid);
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    await applyModelEntityUpdate(this,update);
  }

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in IndexedDbDataStore
    return this.sqlDbDataDataStore.getState();
  }

  // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    return this.sqlDbDataDataStore.getDataInstance(parentUuid,uuid);
  }

  // ##############################################################################################
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    return this.sqlDbDataDataStore.getDataInstances(parentUuid);
  }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.sqlDbDataDataStore.upsertDataInstance(parentUuid,instance);
  }

  // ##############################################################################################
  async deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return this.sqlDbDataDataStore.deleteDataInstances(parentUuid,instances);
  }


  // ##############################################################################################
  async deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return this.sqlDbDataDataStore.deleteDataInstance(parentUuid,instance);
  }
}
