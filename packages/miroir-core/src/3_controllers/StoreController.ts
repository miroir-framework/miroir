import { Application } from "../0_interfaces/1_core/Application.js";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { DataStoreInterface, ModelStoreInterface, StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { applyModelEntityUpdate } from "./ModelActionRunner.js";
import { DataStoreApplicationType, applicationModelEntities, modelInitialize } from "./ModelInitializer.js";

import entityEntity from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';

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

  // ##############################################################################################
  connect():Promise<void> {
    throw new Error("Method not implemented.");
  }

  // ##############################################################################################
  open() {
    // connect to DB?
    console.warn('sqlDbDataStore does nothing!');
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    await applyModelEntityUpdate(this,update);
  }
  
  deleteInstances(section: ApplicationSection, parentUuid:string, instances:EntityInstance[]):Promise<any> {
    return Promise.resolve();
  }

  // #############################################################################################
  async upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any> {
    console.log(this.logHeader,'upsertInstance application',this.applicationName,'type',this.dataStoreType,'data entities',this.getEntities());
    
    // if (this.getEntities().includes(parentUuid)) {
    if (section == 'data') {
      await this.upsertDataInstance(instance.parentUuid,instance);
    } else {
      await this.upsertModelInstance(instance.parentUuid,instance);
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async getInstances(section: ApplicationSection, parentUuid: string): Promise<EntityInstanceCollection> {
    const modelEntitiesUuid = this.dataStoreType == "app"?applicationModelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    if (modelEntitiesUuid.includes(parentUuid)) {
      return Promise.resolve({parentUuid:parentUuid, applicationSection:'model', instances: await this.getModelInstances(parentUuid)});
    } else {
      return Promise.resolve({parentUuid:parentUuid, applicationSection:'data', instances: await this.getDataInstances(parentUuid)});
    }
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

  // ##############################################################################################
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
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in IndexedDbStoreController
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
