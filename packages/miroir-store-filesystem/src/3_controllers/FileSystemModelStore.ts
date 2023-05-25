import {
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  MiroirMetaModel,
  ModelReplayableUpdate,
  ModelStoreInterface,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";

import * as fs from "fs";
import * as path from "path";

const fileExt = '.json'
export function fullName(baseName:string) {
  return baseName + fileExt;
}
export function extractName(fullName:string) {
  return fullName.substring(fullName.length-5);
}
export class FileSystemModelStore implements ModelStoreInterface {
  private targetPath: path.ParsedPath;
  private logHeader: string;

  // #############################################################################################
  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private directory: string,
    private dataStore: DataStoreInterface,
  ) {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
    this.targetPath = path.parse(directory);
    const files = fs.readdirSync(this.directory);
    console.log('FileSystemEntityDataStore constructor found entities',files);
    this.logHeader = 'FileSystemModelStore ' + applicationName + ' dataStoreType ' + dataStoreType
  }

  // #############################################################################################
  connect(): Promise<void> {
    console.log(this.logHeader,'connect() does nothing.');
    return Promise.resolve();
  }

  // #############################################################################################
  getEntityNames(): string[] {
    throw new Error("Method not implemented.");
  }
  // #############################################################################################
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  
  // #############################################################################################
  bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }

  // #########################################################################################
  async dropModelAndData(metaModel:MiroirMetaModel): Promise<void> {
    console.log(this.logHeader,'dropModelAndData');
    await this.dataStore.dropData();
    const entityDirectories = fs.readdirSync(this.directory);
    console.log(this.logHeader, 'dropModelAndData found entities',entityDirectories);
    for (const directory of entityDirectories) {
      fs.rmSync(path.join(this.directory,directory),{recursive:true,force:true})
    }
    return Promise.resolve()
  }

  // #########################################################################################
  open(): Promise<void> {
    const entityDirectories = fs.readdirSync(this.directory);
    console.log(this.logHeader, 'open does nothing! existing entities',entityDirectories);
    return Promise.resolve();
  }

  // #########################################################################################
  close(): Promise<void> {
    const entityDirectories = fs.readdirSync(this.directory);
    console.log(this.logHeader, 'close does nothing! existing entities',entityDirectories);
    return Promise.resolve();
  }

  // #########################################################################################
  getEntities(): string[] {
    const entityDirectories = fs.readdirSync(this.directory);
    return entityDirectories;
  }

  // #########################################################################################
  existsEntity(entityUuid: string): boolean {
    const entityDirectories = fs.readdirSync(this.directory);
    return entityDirectories.includes(entityUuid);
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    // console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity does nothing!');
    const entityInstancesDirectory = path.join(this.directory,entity.uuid)
    if (!fs.existsSync(entityInstancesDirectory)) {
      fs.mkdirSync(entityInstancesDirectory)
    } else {
      console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity storage space already exists for',entity.uuid);
      fs.rmSync(entityInstancesDirectory,{ recursive: true, force: true })
      fs.mkdirSync(entityInstancesDirectory)
    }
    return Promise.resolve();
  }


  // #########################################################################################
  async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition):Promise<void> {
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(
        this.logHeader,
        "createEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
        console.warn(this.logHeader,'createEntity',entity.name,'already existing entity',entity.uuid,'existing entities',this.dataStore.getEntityUuids());
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
        await this.upsertInstance(entityEntity.uuid, entity);
        await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
      }
    }


    const entities = fs.readdirSync(this.directory);

    if (!entities.includes(entity.uuid)) {
      fs.mkdirSync(path.join(this.directory,entity.uuid))
    }

    await this.upsertInstance(entityEntity.uuid,entity);
    await this.upsertInstance(entityEntityDefinition.uuid,entityDefinition);
    // fs.writeFileSync(path.join(this.directory,entityEntity.uuid,fullName(entity.uuid)),JSON.stringify(entity))
    // fs.writeFileSync(path.join(this.directory,entityEntityDefinition.uuid,fullName(entityDefinition.uuid)),JSON.stringify(entityDefinition))
    return Promise.resolve()
  }

  // #########################################################################################
  async dropEntity(entityUuid: string):Promise<void> {
    // TODO: implementation ~ indexedDb case. share it?
    if (this.dataStore.getEntityUuids().includes(entityUuid)) {
      // this.localUuidIndexedDb.removeSubLevels([entityUuid]);
      await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid)
    } else {
      console.warn(this.logHeader,'dropEntity entity not found:', entityUuid);
    }

    if(this.getEntities().includes(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
    } else {
      console.warn(this.logHeader,'dropEntity sublevel for entityEntity does not exist',entityEntity.uuid,'existing entities',this.getEntities());
    }

    if(this.getEntities().includes(entityEntityDefinition.uuid)) {
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

      const entityDefinitions = (await this.dataStore.getInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
      for (
        const entityDefinition of entityDefinitions
      ) {
        await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition)
      }
    } else {
      console.warn('StoreController dropEntity entity entityEntityDefinition does not exist',entityEntityDefinition.uuid,'existing entities',this.getEntities());
    }
    return Promise.resolve();
  }

  // #########################################################################################
  async dropEntities(entityUuids: string[]):Promise<void> {
    entityUuids.forEach(async (e) =>await this.dropEntity(e));
    return Promise.resolve()
  }

  // #########################################################################################
  async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate):Promise<void> {
    // TODO: identical to IndexedDbModelStore implementation!
    console.log(this.logHeader,'renameEntity',update);
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
  getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    const entityInstancePath = path.join(this.directory,entityUuid,uuid)
    return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()) as EntityInstance);
  }

  // #########################################################################################
  async getInstances(entityUuid: string): Promise<EntityInstance[]> {
    console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory);
    
    const entityInstancesPath = path.join(this.directory,entityUuid)
    if (fs.existsSync(entityInstancesPath)) {
      const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
      console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstancesUuid);
      const entityInstances = {parentUuid:entityUuid, instances:entityInstancesUuid.map(e=>JSON.parse(fs.readFileSync(path.join(entityInstancesPath,e)).toString()))} as EntityInstanceCollection;
      console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstances);
      return Promise.resolve(entityInstances.instances);
    } else {
      console.warn('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'could not find path',entityInstancesPath);
      return Promise.resolve([]);
    }
  }

  // #########################################################################################
  // used only for testing purposes!
  // getState(): Promise<{ [uuid: string]: EntityInstance[] }> {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return Promise.resolve({});
  }

  // #########################################################################################
  upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
    const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
    fs.writeFileSync(filePath,JSON.stringify(instance, undefined, 2))

    return Promise.resolve(undefined);
  }

  // #############################################################################################
  async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    console.log(this.logHeader, 'deleteInstances',parentUuid, instances);
    for (const o of instances) {
      await this.deleteInstance(parentUuid, {uuid:o.uuid} as EntityInstance);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
    const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
    fs.rmSync(filePath);
    return Promise.resolve();
  }

  // #########################################################################################
  // applyModelEntityUpdates(updates:ModelEntityUpdateWithCUDUpdate[]);
  applyModelEntityUpdate(update: ModelReplayableUpdate) {
    return Promise.resolve(undefined);
  }
}
