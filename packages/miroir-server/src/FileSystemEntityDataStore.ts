import {
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  ModelReplayableUpdate,
  WrappedModelEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
} from "miroir-core";

import * as fs from "fs";
import * as path from "path";

export class FileSystemEntityDataStore implements DataStoreInterface {
  targetPath: path.ParsedPath;

  // #############################################################################################
  constructor(
    private modelDirectory: string,
    private dataDirectory: string,
  ) {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
    this.targetPath = path.parse(modelDirectory);
    const files = fs.readdirSync(this.modelDirectory);
    console.log('FileSystemEntityDataStore constructor found entities',files);
    
  }

  start(): Promise<void> {
    return Promise.resolve();
  }

  // #########################################################################################
  dropModel(): Promise<void> {
    console.log('FileSystemEntityDataStore dropModel');
    this.clear();
    return Promise.resolve();
  }
  // #########################################################################################
  initModel(): Promise<void> {
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
  clear() {
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
  getState(): Promise<{ [uuid: string]: EntityInstance[] }> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  getInstances(parentUuid: string): Promise<EntityInstance[]> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
    const filePath = path.join(this.modelDirectory,entityUuid,instance.uuid);
    // if (fs.existsSync(filePath)) {
      
    // } else {
      
    // }
    fs.writeFileSync(filePath,JSON.stringify(instance))

    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    return Promise.resolve(undefined);
  }

  // #########################################################################################
  // applyModelEntityUpdates(updates:ModelEntityUpdateWithCUDUpdate[]);
  applyModelEntityUpdate(update: ModelReplayableUpdate) {
    return Promise.resolve(undefined);
  }
}
