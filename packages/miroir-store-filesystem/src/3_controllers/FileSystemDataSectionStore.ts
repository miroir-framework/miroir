import {
  DataStoreApplicationType,
  IDataSectionStore,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  Uuid
} from "miroir-core";

import * as fs from "fs";
import * as path from "path";
import { MixedFileSystemDbInstanceStore, fullName } from "./FileSystemInstanceStoreMixin.js";


export class FileSystemDataSectionStore extends MixedFileSystemDbInstanceStore implements IDataSectionStore {
  public logHeader: string;
  // private targetPath: path.ParsedPath;

  // #############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    directory: string,
  ) {
    super(
      applicationName,
      dataStoreType,
      directory,
      'FileSystemDataSectionStore' + ' Application '+ applicationName +' dataStoreType ' + dataStoreType
    );

    // this.logHeader = 'SqlDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
    // this.dataSequelize = new Sequelize(dataConnectionString,{schema:dataSchema}) // Example for postgres
  }

  // #############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection; }> {
    let result = {};
    console.log(this.logHeader, 'getState this.getEntityUuids()',this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader, 'getState getting instances for',parentUuid);
      const instances = await this.getInstances(parentUuid);
      console.log(this.logHeader, 'getState found instances',parentUuid,instances);

      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
  
  // constructor(
  //   public applicationName: string,
  //   public dataStoreType: DataStoreApplicationType,
  //   private directory: string,
  // ) {
  //   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
  //   this.logHeader = 'FileSystemModelStore ' + applicationName + ' dataStoreType ' + dataStoreType
  //   this.targetPath = path.parse(directory);
  //   const files = fs.readdirSync(this.directory);
  //   console.log(this.logHeader, 'constructor found entities',files);
  // }

  // // #########################################################################################
  // open(): Promise<void> {
  //   const entityDirectories = fs.readdirSync(this.directory);
  //   console.log(this.logHeader, 'open does nothing! existing entities',entityDirectories);
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // close(): Promise<void> {
  //   console.log(this.logHeader, 'close does nothing!');
  //   return Promise.resolve();
  // }
  // // #############################################################################################
  // bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
  //   console.log(this.logHeader, 'bootFromPersistedState does nothing!');
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
  //   // console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity does nothing!');
  //   const entityInstancesPath = path.join(this.directory,entity.uuid)
  //   if (!fs.existsSync(entityInstancesPath)) {
  //     fs.mkdirSync(entityInstancesPath)
  //   } else {
  //     console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity storage space already exists for',entity.uuid);
  //   }
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
  //   const entityInstancesPath = path.join(this.directory,entityUuid)
  //   if (fs.existsSync(entityInstancesPath)) {
  //     fs.rmSync(entityInstancesPath,{ recursive: true, force: true })
  //   } else {
  //     console.log(this.logHeader,'dropStorageSpaceForInstancesOfEntity storage space does not exist for',entityUuid);
  //   }
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
  //   console.log(this.logHeader, 'renameStorageSpaceForInstancesOfEntity does nothing!');
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // async clear(): Promise<void> {
  //   console.log(this.logHeader, 'clear this.getEntityUuids()',this.getEntityUuids());

  //   for (const parentUuid of this.getEntityUuids()) {
  //     console.log(this.logHeader, 'clear for entity',parentUuid);
  //     await this.dropStorageSpaceForInstancesOfEntity(parentUuid);
  //   }
  //   return Promise.resolve();
  // }
  
  // // #############################################################################################
  // getEntityUuids(): string[] {
  //   const files = fs.readdirSync(this.directory);
  //   return files;
  // }

  // // #############################################################################################
  // getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined> {
  //   const entityInstancePath = path.join(this.directory,entityUuid,fullName(uuid))
  //   return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()) as EntityInstance);
  // }

  // // #########################################################################################
  // async getInstances(entityUuid: string): Promise<EntityInstance[]> {
  //   console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory);
    
  //   const entityInstancesPath = path.join(this.directory,entityUuid)
  //   if (fs.existsSync(entityInstancesPath)) {
  //     const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
  //     console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstancesUuid);
  //     const entityInstances = {parentUuid:entityUuid, instances:entityInstancesUuid.map(e=>JSON.parse(fs.readFileSync(path.join(entityInstancesPath,e)).toString()))} as EntityInstanceCollection;
  //     console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstances);
  //     return Promise.resolve(entityInstances.instances);
  //   } else {
  //     console.warn('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'could not find path',entityInstancesPath);
  //     return Promise.resolve([]);
  //   }
  // }
  // // #########################################################################################
  // upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
  //   const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
  //   fs.writeFileSync(filePath,JSON.stringify(instance, undefined, 2))

  //   return Promise.resolve(undefined);
  // }

  // // #############################################################################################
  // async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
  //   console.log(this.logHeader, 'deleteInstances',parentUuid, instances);
  //   for (const o of instances) {
  //     await this.deleteInstance(parentUuid, {uuid:o.uuid} as EntityInstance);
  //   }
  //   return Promise.resolve();
  // }

  // // #############################################################################################
  // deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
  //   const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
  //   fs.rmSync(filePath);
  //   return Promise.resolve();
  // }
}