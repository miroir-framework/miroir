import {
  DataStoreApplicationType,
  StoreFacadeInterface,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  MiroirMetaModel,
  ModelReplayableUpdate,
  WrappedModelEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
} from "miroir-core";

import * as fs from "fs";
import * as path from "path";

export class FileSystemEntityDataStore implements StoreFacadeInterface {
  targetPath: path.ParsedPath;

  // #############################################################################################
  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private modelDirectory: string,
    private dataDirectory: string,
  ) {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
    this.targetPath = path.parse(modelDirectory);
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore constructor found entities',files);
    
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
  dropStorageSpaceForInstancesOfEntity(entityUuid: string) {
    throw new Error("Method not implemented.");
  }

  initializeEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    throw new Error("Method not implemented.");
  }


  
  bootFromPersistedState(
    metaModel:MiroirMetaModel,
  ): Promise<void> {
    return Promise.resolve();
  }

  // #########################################################################################
  dropModelAndData(metaModel:MiroirMetaModel): Promise<void> {
    console.log('FileSystemEntityDataStore dropModelAndData');
    this.clear(metaModel);
    return Promise.resolve();
  }
  // #########################################################################################
  initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: EntityInstance,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ): Promise<void> {
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore initModel does nothing! existing entities',files);
    return Promise.resolve();
  }

  // #########################################################################################
  open() {
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore open does nothing! existing entities',files);
  }

  // #########################################################################################
  close() {
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore close does nothing! existing entities',files);
  }

  // #########################################################################################
  clear(metaModel: MiroirMetaModel) {
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore clear found entities',files);
    for (const file of files) {
      fs.rmSync(file,{recursive:true,force:true})
    }
  }

  // #########################################################################################
  getEntities(): string[] {
    const files = fs.readdirSync(this.modelDirectory);
    return files;
  }

  // #########################################################################################
  existsEntity(entityUuid: string): boolean {
    const files = fs.readdirSync(this.modelDirectory);
    return files.includes(entityUuid);
  }

  // #########################################################################################
  createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    this.createEntity(entity,entityDefinition);
  }

  // #########################################################################################
  createEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    const entities = fs.readdirSync(this.modelDirectory);

    if (!entities.includes(entity.uuid)) {
      fs.mkdirSync(path.join(this.modelDirectory,entity.uuid))
    }

    fs.writeFileSync(path.join(this.modelDirectory,entityEntity.uuid,entity.uuid),JSON.stringify(entity))
    fs.writeFileSync(path.join(this.modelDirectory,entityEntityDefinition.uuid,entityDefinition.uuid),JSON.stringify(entityDefinition))
  }

  // #########################################################################################
  dropEntity(entityUuid: string) {
    const entities = fs.readdirSync(this.modelDirectory);

    if (entities.includes(entityUuid)) {
      fs.rmSync(path.join(this.modelDirectory,entityUuid),{recursive:true,force:true})
    }

    console.error('not implemented');
    

    // fs.writeFileSync(path.join(this.directory,entityEntity.uuid,entity.uuid),JSON.stringify(entity))
    // fs.writeFileSync(path.join(this.directory,entityEntityDefinition.uuid,entityDefinition.uuid),JSON.stringify(entityDefinition))
  }

  // #########################################################################################
  dropEntities(entityUuids: string[]) {
    entityUuids.forEach(e =>this.dropEntity(e));
  }

  // #########################################################################################
  renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate) {}

  // #########################################################################################
  // getInstances(entityUuid: string): Promise<EntityInstance[]> {
  async getInstances(entityUuid: string): Promise<EntityInstanceCollection|undefined> {
    console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.dataDirectory);
    
    const entityInstancesPath = path.join(this.dataDirectory,entityUuid)
    if (fs.existsSync(entityInstancesPath)) {
      const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
      console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.dataDirectory,'found entity instances',entityInstancesUuid);
      const entityInstances = {parentUuid:entityUuid, instances:entityInstancesUuid.map(e=>JSON.parse(fs.readFileSync(path.join(entityInstancesPath,e)).toString()))} as EntityInstanceCollection;
      console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.dataDirectory,'found entity instances',entityInstances);
      return Promise.resolve(entityInstances);
    } else {
      console.warn('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'could not find path',entityInstancesPath);
      return Promise.resolve(undefined);
    }
  }

  // #########################################################################################
  // used only for testing purposes!
  // getState(): Promise<{ [uuid: string]: EntityInstance[] }> {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return Promise.resolve({});
  }

  // // #########################################################################################
  // getModelInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
  //   return Promise.resolve({} as EntityInstance);
  // }

  // // #########################################################################################
  // getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
  //   return Promise.resolve([]);
  // }

  // // #########################################################################################
  // getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
  //   return Promise.resolve({} as EntityInstance);
  // }

  // // #########################################################################################
  // getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
  //   return Promise.resolve([]);
  // }

  // #########################################################################################
  upsertDataInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
    const filePath = path.join(this.modelDirectory,entityUuid,instance.uuid);
    fs.writeFileSync(filePath,JSON.stringify(instance, undefined, 2))

    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    return this.upsertDataInstance(parentUuid,instance);
  }

  // #########################################################################################
  upsertModelInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
    const filePath = path.join(this.modelDirectory,entityUuid,instance.uuid);
    // if (fs.existsSync(filePath)) {
      
    // } else {
      
    // }
    fs.writeFileSync(filePath,JSON.stringify(instance))

    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteModelInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  // applyModelEntityUpdates(updates:ModelEntityUpdateWithCUDUpdate[]);
  applyModelEntityUpdate(update: ModelReplayableUpdate) {
    return Promise.resolve(undefined);
  }
}
