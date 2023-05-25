import {
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirMetaModel,
  ModelStoreInterface,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
} from "miroir-core";
import { IndexedDb } from "./indexedDb.js";

export class IndexedDbModelStore implements ModelStoreInterface {
  private logHeader: string;

  // ##############################################################################################
  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private localUuidIndexedDb: IndexedDb,
    private dataStore: DataStoreInterface,
  ) {
    this.logHeader = "IndexedDbModelStore" + " Application " + this.applicationName + " dataStoreType " + this.dataStoreType;
  }

  // ##############################################################################################
  async close():Promise<void> {
    console.log(this.logHeader,'close(): closing');
    await this.localUuidIndexedDb.closeObjectStore();
    console.log(this.logHeader,'close(): closed');
      return Promise.resolve();
  }
  
  // ##################################################################################################
  async connect(): Promise<void> {
    console.log(this.logHeader,'connect(): opening');
    await this.localUuidIndexedDb.openObjectStore();
    console.log(this.logHeader,'connect(): opened');
    return Promise.resolve();
  }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }
  // ##################################################################################################
  getEntities(): string[] {
    return this.localUuidIndexedDb.getSubLevels();
  }

  // ##################################################################################################
  existsEntity(entityUuid: string): boolean {
    return this.localUuidIndexedDb.hasSubLevel(entityUuid);
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    // console.warn('StoreController createStorageSpaceForInstancesOfEntity does nothing: StoreController is not persistent.');
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(this.logHeader,'createStorageSpaceForInstancesOfEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
        this.localUuidIndexedDb.addSubLevels([entity.uuid]);
        console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity added entity in Model section:',entity.name,entity.uuid, ', existing Entities',this.localUuidIndexedDb.getSubLevels());
      } else {
        this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
        console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','input: entity',entity,'entityDefinition',entityDefinition, 'already has entity. Existing entities:',this.localUuidIndexedDb.getSubLevels());
      }
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async createEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(
        this.logHeader,
        "createEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
        console.warn(this.logHeader,'createEntity',entity.name,'already existing sublevel',entity.uuid,this.localUuidIndexedDb.hasSubLevel(entity.uuid));
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
        await this.upsertInstance(entityEntity.uuid, entity);
        if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
          await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
        } else {
          console.warn(this.logHeader,'createEntity',entity.name,'sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
        }
      }
    }
  }

  // #############################################################################################
  async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate){
    // TODO: identical to the Filesystem implementation!
    const cudUpdate = update.equivalentModelCUDUpdates[0];
    // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
    if (
      cudUpdate 
      && cudUpdate.objects[0].instances[0].parentUuid 
      && cudUpdate.objects[0].instances[0].parentUuid == entityEntity.uuid
      && cudUpdate.objects[0].instances[0].uuid
    ) {
      const currentValue = await this.getInstance(entityEntity.uuid,cudUpdate.objects[0].instances[0].uuid);
      console.log(this.logHeader, 'renameEntity',cudUpdate.objects[0].instances[0].parentUuid,currentValue);
      await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
      const updatedValue = await this.getInstance(entityEntity.uuid,cudUpdate.objects[0].instances[0].uuid);
      // TODO: update EntityDefinition, too!
      console.log(this.logHeader, 'renameEntity done',cudUpdate.objects[0].instances[0].parentUuid,updatedValue);
    } else {
      throw new Error(this.logHeader + ' renameEntity incorrect parameter ' + cudUpdate);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async dropEntity(entityUuid:string):Promise<void> {
    if (this.dataStore.getEntityUuids().includes(entityUuid)) {
      // this.localUuidIndexedDb.removeSubLevels([entityUuid]);
      await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid)
    } else {
      console.warn(this.logHeader,'dropEntity entity not found:', entityUuid);
    }

    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
    } else {
      console.warn(this.logHeader,'dropEntity sublevel for entityEntity does not exist',entityEntity.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid));
    }

    if(this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

      const entityDefinitions = (await this.dataStore.getInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
      for (
        const entityDefinition of entityDefinitions
      ) {
        await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition)
      }
    } else {
      console.warn('StoreController dropEntity sublevel for entityEntityDefinition does not exist',entityEntityDefinition.uuid,this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async dropEntities(entityUuids:string[]) {
    // console.error(this.logHeader,'do not call dropentities!');
    
    for (const entityUuid of entityUuids) {
      await this.dropEntity(entityUuid)
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropModelAndData(metaModel: MiroirMetaModel): Promise<void> {
    // drop data anq model Entities
    await this.dataStore.dropData();
    await this.localUuidIndexedDb.removeSubLevels(this.getEntities())
    console.log(this.logHeader, "dropModelAndData DONE", this.getEntities());
    return Promise.resolve();
  }

  // #############################################################################################
  async getInstance(parentUuid:string,uuid:string):Promise<EntityInstance | undefined> {
    const result = await this.localUuidIndexedDb.getValue(parentUuid,uuid);
    return Promise.resolve(result);
  }

  // #############################################################################################
  async getInstances(parentUuid:string):Promise<any> {
    let result
    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      result = await this.localUuidIndexedDb.getAllValue(parentUuid);
    } else {
      console.error(this.logHeader, 'getModelInstances entity',parentUuid,'does not exist.');
    }
    return Promise.resolve(result);
  }

  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log(this.logHeader, 'upsertInstance',instance.parentUuid, instance);

    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      await this.localUuidIndexedDb.putValue(parentUuid,instance);
    } else {
      console.error(this.logHeader, 'upsertInstance',instance.parentUuid,'does not exist.');
    }
    return Promise.resolve(instance);
  }

  // #############################################################################################
  async deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any> {
    console.log(this.logHeader, 'deleteInstances',parentUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log(this.logHeader, 'deleteInstance',parentUuid, instance);
    // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
    // }
    return Promise.resolve();
  }
}